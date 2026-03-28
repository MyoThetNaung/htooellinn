import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useRef, useState } from "react";

/** Fixed black station dots (slider does not move). */
const CHANNEL_CX = [350, 650, 900] as const;
/** Red line drawn at this x; horizontal `offset` is added via transform (needle moves). */
const INDICATOR_BASE_X = 550;
const TUNE_THRESHOLD = 14;
const SNAP_OFFSETS = CHANNEL_CX.map((cx) => cx - INDICATOR_BASE_X) as readonly [number, number, number];
const OFFSET_MIN = -400;
const OFFSET_MAX = 400;
const FADE_S = 0.45;

/** Analog VU: pivot and needle sweep (degrees, SVG rotate clockwise positive). */
const VU_PIVOT_L = { x: 330, y: 392 };
const VU_PIVOT_R = { x: 770, y: 392 };
const VU_ANGLE_MIN = -52;
const VU_ANGLE_MAX = 52;

const TRACKS = [
  { title: "A Chit Lo Khaw Tha Lar", src: new URL("../../../MUSIC/A Chit Lo Khaw Tha Lar.mp3", import.meta.url).href },
  { title: "A Pyan", src: new URL("../../../MUSIC/A Pyan.mp3", import.meta.url).href },
  { title: "Min Lay Nar Lal", src: new URL("../../../MUSIC/Min Lay Nar Lal.mp3", import.meta.url).href },
] as const;

function nearestSnapOffset(offset: number): number {
  let best = SNAP_OFFSETS[0];
  let bestD = Math.abs(offset - best);
  for (const s of SNAP_OFFSETS) {
    const d = Math.abs(offset - s);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

function tunedChannelIndex(offset: number): 0 | 1 | 2 | null {
  const redX = INDICATOR_BASE_X + offset;
  for (let i = 0; i < CHANNEL_CX.length; i++) {
    if (Math.abs(CHANNEL_CX[i] - redX) < TUNE_THRESHOLD) return i as 0 | 1 | 2;
  }
  return null;
}

function fftToLevel(freq: Uint8Array): number {
  if (freq.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < freq.length; i++) sum += freq[i] ?? 0;
  return Math.min(1, (sum / freq.length / 255) * 2.1);
}

export type RetroRadioPlayerHandle = { getRadioElement: () => HTMLDivElement | null };

type Props = { className?: string };

const RetroRadioPlayer = forwardRef<RetroRadioPlayerHandle, Props>(function RetroRadioPlayer({ className }, ref) {
  const uid = useId().replace(/:/g, "");
  const woodId = `wood-${uid}`;
  const retroId = `retro-${uid}`;
  const gridId = `grid-${uid}`;
  const sliderBgId = `sliderBg-${uid}`;
  const knob3dId = `knob3d-${uid}`;
  const clipId = `slider-clip-${uid}`;
  const vuFaceId = `vu-face-${uid}`;

  const rootRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => ({
    getRadioElement: () => rootRef.current,
  }));

  const indicatorRef = useRef<SVGGElement>(null);
  const vuNeedleLRef = useRef<SVGGElement>(null);
  const vuNeedleRRef = useRef<SVGGElement>(null);
  const rafRef = useRef<number>(0);

  const offsetRef = useRef(0);
  const smoothOffsetRef = useRef(0);
  const snapAnimRef = useRef<{ from: number; to: number; t0: number; dur: number } | null>(null);
  const dragRef = useRef<{ startX: number; startOffset: number; active: boolean }>({
    startX: 0,
    startOffset: 0,
    active: false,
  });
  const appliedTunedRef = useRef<0 | 1 | 2 | null | undefined>(undefined);

  const [powered, setPowered] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const staticGainRef = useRef<GainNode | null>(null);
  const staticNoiseRef = useRef<AudioBufferSourceNode | null>(null);
  const trackGainsRef = useRef<GainNode[] | null>(null);
  const musicMasterRef = useRef<GainNode | null>(null);
  const analyserLRef = useRef<AnalyserNode | null>(null);
  const analyserRRef = useRef<AnalyserNode | null>(null);
  const audioElsRef = useRef<HTMLAudioElement[] | null>(null);

  const clampOffset = (v: number) => Math.min(OFFSET_MAX, Math.max(OFFSET_MIN, v));

  const ensureAudio = useCallback(async () => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === "suspended") await audioCtxRef.current.resume();
      return;
    }

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const staticGain = ctx.createGain();
    staticGain.gain.value = 0;
    staticGainRef.current = staticGain;

    const musicMaster = ctx.createGain();
    musicMaster.gain.value = 1;
    musicMasterRef.current = musicMaster;

    const splitter = ctx.createChannelSplitter(2);
    const merger = ctx.createChannelMerger(2);

    const analyserL = ctx.createAnalyser();
    const analyserR = ctx.createAnalyser();
    analyserL.fftSize = 256;
    analyserR.fftSize = 256;
    analyserL.smoothingTimeConstant = 0.6;
    analyserR.smoothingTimeConstant = 0.6;
    analyserLRef.current = analyserL;
    analyserRRef.current = analyserR;

    const trackGains: GainNode[] = [];
    const audios: HTMLAudioElement[] = [];

    for (let i = 0; i < TRACKS.length; i++) {
      const g = ctx.createGain();
      g.gain.value = 0;
      trackGains.push(g);
      const a = new Audio();
      a.src = TRACKS[i].src;
      a.loop = true;
      audios.push(a);
    }
    trackGainsRef.current = trackGains;
    audioElsRef.current = audios;

    for (let i = 0; i < TRACKS.length; i++) {
      const src = ctx.createMediaElementSource(audios[i]);
      src.connect(trackGains[i]);
      trackGains[i].connect(musicMaster);
    }

    musicMaster.connect(splitter);
    splitter.connect(analyserL, 0);
    splitter.connect(analyserR, 1);
    splitter.connect(merger, 0, 0);
    splitter.connect(merger, 1, 1);
    merger.connect(ctx.destination);

    staticGain.connect(ctx.destination);

    const noiseDur = 3;
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * noiseDur, ctx.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;
    noise.connect(staticGain);
    noise.start();
    staticNoiseRef.current = noise;

    await ctx.resume();
  }, []);

  const rampGain = useCallback((node: GainNode, value: number, when?: number) => {
    const actx = audioCtxRef.current;
    if (!actx) return;
    const t = when ?? actx.currentTime;
    node.gain.cancelScheduledValues(t);
    node.gain.setValueAtTime(node.gain.value, t);
    node.gain.linearRampToValueAtTime(value, t + FADE_S);
  }, []);

  const applyTunedState = useCallback(
    (idx: 0 | 1 | 2 | null) => {
      const staticGain = staticGainRef.current;
      const trackGains = trackGainsRef.current;
      const audios = audioElsRef.current;
      if (!staticGain || !trackGains || !audios) return;

      if (idx === null) {
        rampGain(staticGain, 0.22);
        for (let i = 0; i < TRACKS.length; i++) {
          rampGain(trackGains[i], 0);
          void audios[i].pause();
        }
        return;
      }

      rampGain(staticGain, 0);
      for (let i = 0; i < TRACKS.length; i++) {
        if (i === idx) {
          rampGain(trackGains[i], 1);
          void audios[i].play().catch(() => {});
        } else {
          rampGain(trackGains[i], 0);
          void audios[i].pause();
        }
      }
    },
    [rampGain]
  );

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      const actx = audioCtxRef.current;
      if (actx) void actx.close();
    };
  }, []);

  const pointerDown = async (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    await ensureAudio();
    setPowered(true);
    appliedTunedRef.current = undefined;
    dragRef.current = { active: true, startX: e.clientX, startOffset: offsetRef.current };
    snapAnimRef.current = null;
  };

  const pointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    offsetRef.current = clampOffset(dragRef.current.startOffset + dx);
  };

  const endDrag = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    const target = nearestSnapOffset(offsetRef.current);
    const from = offsetRef.current;
    snapAnimRef.current = { from, to: target, t0: performance.now(), dur: 340 };
  };

  const onWheel = async (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await ensureAudio();
    setPowered(true);
    appliedTunedRef.current = undefined;
    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
    offsetRef.current = clampOffset(offsetRef.current + delta * 0.5);
    snapAnimRef.current = null;
  };

  const smoothVuL = useRef(0.12);
  const smoothVuR = useRef(0.12);
  const idleVuL = useRef(0.14);
  const idleVuR = useRef(0.16);

  useEffect(() => {
    const freqL = new Uint8Array(analyserLRef.current?.frequencyBinCount ?? 0);
    const freqR = new Uint8Array(analyserRRef.current?.frequencyBinCount ?? 0);

    const setNeedle = (el: SVGGElement | null, level: number, pivot: { x: number; y: number }) => {
      if (!el) return;
      const clamped = Math.min(1, Math.max(0, level));
      const deg = VU_ANGLE_MIN + clamped * (VU_ANGLE_MAX - VU_ANGLE_MIN);
      el.setAttribute("transform", `rotate(${deg} ${pivot.x} ${pivot.y})`);
    };

    const tick = (now: number) => {
      let drawOffset = offsetRef.current;
      const snap = snapAnimRef.current;
      if (snap) {
        const u = Math.min(1, (now - snap.t0) / snap.dur);
        const ease = 1 - (1 - u) ** 3;
        drawOffset = snap.from + (snap.to - snap.from) * ease;
        if (u >= 1) {
          snapAnimRef.current = null;
          offsetRef.current = snap.to;
          drawOffset = snap.to;
        }
      }

      smoothOffsetRef.current += (drawOffset - smoothOffsetRef.current) * 0.22;
      const smooth = smoothOffsetRef.current;

      const dragging = dragRef.current.active;
      const jitter = dragging
        ? Math.sin(now / 40) * 2.4 + Math.sin(now / 16) * 1.2 + (Math.random() - 0.5) * 2.8
        : 0;
      const visualX = smooth + jitter;

      indicatorRef.current?.setAttribute("transform", `translate(${visualX},0)`);

      const tuned = tunedChannelIndex(smooth);
      if (powered && audioCtxRef.current) {
        if (tuned !== appliedTunedRef.current) {
          appliedTunedRef.current = tuned;
          applyTunedState(tuned);
        }
      }

      const aL = analyserLRef.current;
      const aR = analyserRRef.current;
      let targetL: number;
      let targetR: number;

      if (powered && aL && aR && tuned !== null) {
        aL.getByteFrequencyData(freqL);
        aR.getByteFrequencyData(freqR);
        targetL = fftToLevel(freqL);
        targetR = fftToLevel(freqR);
      } else {
        const bump = powered ? 0.055 : 0.022;
        const bias = powered ? 0.14 : 0.06;
        idleVuL.current += (Math.random() - 0.5) * bump;
        idleVuR.current += (Math.random() - 0.5) * bump;
        idleVuL.current = idleVuL.current * 0.92 + bias * 0.08;
        idleVuR.current = idleVuR.current * 0.92 + bias * 0.08;
        idleVuL.current = Math.min(0.58, Math.max(0.06, idleVuL.current));
        idleVuR.current = Math.min(0.58, Math.max(0.06, idleVuR.current));
        targetL = idleVuL.current;
        targetR = idleVuR.current;
      }

      const follow = tuned !== null && powered ? 0.28 : powered ? 0.14 : 0.08;
      smoothVuL.current += (targetL - smoothVuL.current) * follow;
      smoothVuR.current += (targetR - smoothVuR.current) * follow;

      setNeedle(vuNeedleLRef.current, smoothVuL.current, VU_PIVOT_L);
      setNeedle(vuNeedleRRef.current, smoothVuR.current, VU_PIVOT_R);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [powered, applyTunedState]);

  return (
    <div ref={rootRef} className={className ?? ""}>
      <svg
        viewBox="0 0 1100 550"
        className="w-full max-w-[min(100%,1100px)] mx-auto h-auto block touch-none"
        role="img"
        aria-label="Radio: drag or scroll on the strip to move the red line over a station"
      >
        <defs>
          <linearGradient id={woodId}>
            <stop offset="0%" stopColor="#5a3e2b" />
            <stop offset="100%" stopColor="#2b1f1a" />
          </linearGradient>
          <linearGradient id={retroId}>
            <stop offset="0%" stopColor="#f5d36b" />
            <stop offset="100%" stopColor="#caa83e" />
          </linearGradient>
          <pattern id={gridId} width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="#1a1a1a" />
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#333" strokeWidth="1" />
          </pattern>
          <linearGradient id={sliderBgId}>
            <stop offset="0%" stopColor="#f4ecd8" />
            <stop offset="100%" stopColor="#e8dcb5" />
          </linearGradient>
          <radialGradient id={knob3dId} cx="30%" cy="30%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="50%" stopColor="#bbb" />
            <stop offset="100%" stopColor="#333" />
          </radialGradient>
          <clipPath id={clipId}>
            <rect x="150" y="150" width="800" height="70" rx="12" />
          </clipPath>
          <linearGradient id={vuFaceId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff8e8" />
            <stop offset="35%" stopColor="#f5e6b8" />
            <stop offset="100%" stopColor="#e2c96a" />
          </linearGradient>
        </defs>

        <rect x="20" y="20" width="1060" height="510" rx="40" fill={`url(#${woodId})`} />

        <rect
          x="50"
          y="50"
          width="1000"
          height="450"
          rx="25"
          fill={`url(#${gridId})`}
          stroke={`url(#${retroId})`}
          strokeWidth="6"
        />

        <rect
          x="150"
          y="150"
          width="800"
          height="70"
          rx="12"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          pointerEvents="none"
        />

        <polygon points="130,185 150,175 150,195" fill="#fff" pointerEvents="none" />
        <polygon points="970,185 950,175 950,195" fill="#fff" pointerEvents="none" />

        <g id="slider" style={{ pointerEvents: "none" }}>
          <g clipPath={`url(#${clipId})`}>
            <rect x="150" y="150" width="800" height="70" rx="12" fill={`url(#${sliderBgId})`} stroke="#999" />
            <line x1="150" y1="185" x2="950" y2="185" stroke="#000" strokeWidth="2" />

            <g stroke="#000">
              <line x1="200" y1="185" x2="200" y2="160" strokeWidth="2" />
              <line x1="350" y1="185" x2="350" y2="160" strokeWidth="2" />
              <line x1="500" y1="185" x2="500" y2="160" strokeWidth="2" />
              <line x1="650" y1="185" x2="650" y2="160" strokeWidth="2" />
              <line x1="800" y1="185" x2="800" y2="160" strokeWidth="2" />
              <line x1="950" y1="185" x2="950" y2="160" strokeWidth="2" />

              <line x1="250" y1="185" x2="250" y2="170" strokeWidth="1" />
              <line x1="300" y1="185" x2="300" y2="170" strokeWidth="1" />
              <line x1="400" y1="185" x2="400" y2="170" strokeWidth="1" />
              <line x1="450" y1="185" x2="450" y2="170" strokeWidth="1" />
              <line x1="550" y1="185" x2="550" y2="170" strokeWidth="1" />
              <line x1="600" y1="185" x2="600" y2="170" strokeWidth="1" />
              <line x1="700" y1="185" x2="700" y2="170" strokeWidth="1" />
              <line x1="750" y1="185" x2="750" y2="170" strokeWidth="1" />
              <line x1="850" y1="185" x2="850" y2="170" strokeWidth="1" />
              <line x1="900" y1="185" x2="900" y2="170" strokeWidth="1" />
            </g>

            <g id="channels">
              <circle cx="350" cy="185" r="6" fill="#000" />
              <circle cx="650" cy="185" r="6" fill="#000" />
              <circle cx="900" cy="185" r="6" fill="#000" />
            </g>
          </g>

          <g fill="#ffffff" fontSize="16" textAnchor="middle" fontFamily="monospace" pointerEvents="none">
            <text x="200" y="105">
              88
            </text>
            <text x="350" y="105">
              92
            </text>
            <text x="500" y="105">
              96
            </text>
            <text x="650" y="105">
              100
            </text>
            <text x="800" y="105">
              104
            </text>
            <text x="950" y="105">
              108
            </text>
          </g>
        </g>

        <g ref={indicatorRef} transform="translate(0,0)" pointerEvents="none">
          <line x1="550" y1="140" x2="550" y2="230" stroke="red" strokeWidth="6" strokeLinecap="square" />
        </g>

        <rect
          x="150"
          y="150"
          width="800"
          height="70"
          rx="12"
          fill="transparent"
          className="cursor-grab active:cursor-grabbing outline-none"
          style={{ touchAction: "none" }}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onLostPointerCapture={endDrag}
          onWheel={onWheel}
          aria-label="Tuning: drag or scroll to move the red line over a station dot"
        />

        <g id="vu-left" pointerEvents="none">
          <rect x="218" y="258" width="224" height="184" rx="18" fill="#15120e" stroke="#3d3628" strokeWidth="2" />
          <rect
            x="226"
            y="266"
            width="208"
            height="168"
            rx="14"
            fill={`url(#${vuFaceId})`}
            stroke="#9a8648"
            strokeWidth="1.5"
          />
          <path
            d="M 272 388 A 58 58 0 0 1 388 388"
            fill="none"
            stroke="#6b5c3a"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <g stroke="#4a3f28" strokeWidth="1.5" strokeLinecap="round">
            <line x1="278" y1="375" x2="282" y2="368" />
            <line x1="302" y1="352" x2="306" y2="345" />
            <line x1="330" y1="332" x2="330" y2="324" />
            <line x1="358" y1="352" x2="354" y2="345" />
            <line x1="382" y1="375" x2="378" y2="368" />
          </g>
          <text x="330" y="418" textAnchor="middle" fill="#6b5c3a" fontSize="11" fontFamily="ui-monospace, monospace">
            VU
          </text>
          <g ref={vuNeedleLRef} transform={`rotate(${VU_ANGLE_MIN} ${VU_PIVOT_L.x} ${VU_PIVOT_L.y})`}>
            <line
              x1={VU_PIVOT_L.x}
              y1={VU_PIVOT_L.y}
              x2={VU_PIVOT_L.x}
              y2={298}
              stroke="#1a1510"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx={VU_PIVOT_L.x} cy={VU_PIVOT_L.y} r="6" fill="#2c2419" stroke="#0d0b08" strokeWidth="1" />
          </g>
        </g>

        <g id="vu-right" pointerEvents="none">
          <rect x="658" y="258" width="224" height="184" rx="18" fill="#15120e" stroke="#3d3628" strokeWidth="2" />
          <rect
            x="666"
            y="266"
            width="208"
            height="168"
            rx="14"
            fill={`url(#${vuFaceId})`}
            stroke="#9a8648"
            strokeWidth="1.5"
          />
          <path
            d="M 712 388 A 58 58 0 0 1 828 388"
            fill="none"
            stroke="#6b5c3a"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <g stroke="#4a3f28" strokeWidth="1.5" strokeLinecap="round">
            <line x1="718" y1="375" x2="722" y2="368" />
            <line x1="742" y1="352" x2="746" y2="345" />
            <line x1="770" y1="332" x2="770" y2="324" />
            <line x1="798" y1="352" x2="794" y2="345" />
            <line x1="822" y1="375" x2="818" y2="368" />
          </g>
          <text x="770" y="418" textAnchor="middle" fill="#6b5c3a" fontSize="11" fontFamily="ui-monospace, monospace">
            VU
          </text>
          <g ref={vuNeedleRRef} transform={`rotate(${VU_ANGLE_MIN} ${VU_PIVOT_R.x} ${VU_PIVOT_R.y})`}>
            <line
              x1={VU_PIVOT_R.x}
              y1={VU_PIVOT_R.y}
              x2={VU_PIVOT_R.x}
              y2={298}
              stroke="#1a1510"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx={VU_PIVOT_R.x} cy={VU_PIVOT_R.y} r="6" fill="#2c2419" stroke="#0d0b08" strokeWidth="1" />
          </g>
        </g>

        <circle cx="550" cy="330" r="10" fill="#00ff66" opacity={powered ? 1 : 0.35} />
        <circle cx="550" cy="330" r="5" fill="#ccffcc" opacity={powered ? 1 : 0.35} />

        <g>
          <circle cx="120" cy="350" r="40" fill={`url(#${knob3dId})`} />
          <circle cx="120" cy="350" r="20" fill="#222" />
          <line x1="120" y1="350" x2="120" y2="310" stroke="#fff" strokeWidth="3" />
        </g>

        <g>
          <circle cx="980" cy="350" r="40" fill={`url(#${knob3dId})`} />
          <circle cx="980" cy="350" r="20" fill="#222" />
          <line x1="980" y1="350" x2="980" y2="310" stroke="#fff" strokeWidth="3" />
        </g>
      </svg>
    </div>
  );
});

RetroRadioPlayer.displayName = "RetroRadioPlayer";

export default RetroRadioPlayer;
