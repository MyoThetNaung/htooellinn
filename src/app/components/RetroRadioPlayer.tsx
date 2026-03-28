import React, { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useRef, useState } from "react";

const CHANNEL_CX = [350, 650, 900] as const;
const INDICATOR_BASE_X = 550;
const TUNE_THRESHOLD = 14;
const SNAP_OFFSETS: readonly [number, number, number] = [
  CHANNEL_CX[0] - INDICATOR_BASE_X,
  CHANNEL_CX[1] - INDICATOR_BASE_X,
  CHANNEL_CX[2] - INDICATOR_BASE_X,
];
const OFFSET_MIN = -400;
const OFFSET_MAX = 400;
const FADE_S = 0.45;

const VU_PIVOT_L = { x: 330, y: 392 };
const VU_PIVOT_R = { x: 770, y: 392 };
const VU_ANGLE_MIN = -52;
const VU_ANGLE_MAX = 52;

const KNOB = { x: 120, y: 350 };

const TRACKS = [
  { title: "A Chit Lo Khaw Tha Lar", src: new URL("../../../MUSIC/A Chit Lo Khaw Tha Lar.mp3", import.meta.url).href },
  { title: "A Pyan", src: new URL("../../../MUSIC/A Pyan.mp3", import.meta.url).href },
  { title: "Min Lay Nar Lal", src: new URL("../../../MUSIC/Min Lay Nar Lal.mp3", import.meta.url).href },
] as const;

/** Skip opening seconds so playback feels like tuning into a station mid-broadcast. */
const RADIO_INTRO_SKIP_SEC = 3;

function seekPastRadioIntro(a: HTMLAudioElement) {
  const d = a.duration;
  if (Number.isFinite(d) && d > RADIO_INTRO_SKIP_SEC + 0.25) {
    a.currentTime = RADIO_INTRO_SKIP_SEC;
  }
}

function playWithRadioIntroSkip(a: HTMLAudioElement) {
  const start = () => {
    seekPastRadioIntro(a);
    void a.play().catch(() => {});
  };
  if (a.readyState >= HTMLMediaElement.HAVE_METADATA) {
    start();
  } else {
    a.addEventListener("loadedmetadata", start, { once: true });
    if (a.readyState === HTMLMediaElement.HAVE_NOTHING) void a.load();
  }
}

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

/**
 * Mean of L/R FFT magnitudes in [i0, i1) — each bin is 0–255; average both channels then normalize.
 */
function bandEnergy(l: Uint8Array, r: Uint8Array, i0: number, i1: number): number {
  let sum = 0;
  let n = 0;
  const hi = Math.min(i1, l.length, r.length);
  for (let i = Math.max(0, i0); i < hi; i++) {
    sum += (l[i] ?? 0) + (r[i] ?? 0);
    n += 2;
  }
  if (n === 0) return 0;
  return Math.min(1, (sum / n / 255) * 1.95);
}

/** Peak L/R magnitude in band (0–1). Kicks and hits read much higher than mean alone — matches visible VU better. */
function bandPeakNorm(l: Uint8Array, r: Uint8Array, i0: number, i1: number): number {
  let m = 0;
  const hi = Math.min(i1, l.length, r.length);
  for (let i = Math.max(0, i0); i < hi; i++) {
    m = Math.max(m, (l[i] ?? 0) / 255, (r[i] ?? 0) / 255);
  }
  return Math.min(1, m);
}

/**
 * Four bands left→right, tuned for typical mixes (kick/bass, warmth/body, vocals/instruments, air/hats).
 * Slightly staggered edges vs classic 120/500/2k/8k so each tube gets more distinct energy.
 */
const TUBE_HZ_RANGES: readonly [number, number][] = [
  [45, 240],
  [240, 950],
  [950, 3600],
  [3600, 12000],
];

/**
 * Hz → half-open bin indices [lo, hi). floor(lo) keeps bass energy; ceil(hi) for exclusive end.
 * Bin k ≈ frequencies [k·sr/fftSize , (k+1)·sr/fftSize).
 */
function hzRangeToBinRange(
  hzLo: number,
  hzHi: number,
  sampleRate: number,
  fftSize: number,
  binCount: number
): [number, number] {
  if (hzHi <= hzLo || binCount < 2) return [1, 2];
  const lo = Math.max(1, Math.floor((hzLo * fftSize) / sampleRate));
  const hiEx = Math.min(binCount, Math.ceil((hzHi * fftSize) / sampleRate));
  return [lo, Math.max(lo + 1, hiEx)];
}

/**
 * Per-tube gain so typical mixes feel balanced (treble FFT energy is usually lower than bass/mids).
 */
const TUBE_BAND_GAIN = [1.12, 1.02, 1.08, 1.55] as const;

/**
 * Per-tube 0–1 drive (not pegged): mean + peak, modest gain so 5 segments rarely all max at once.
 */
function tubeBandLevel(
  l: Uint8Array,
  r: Uint8Array,
  range: readonly [number, number],
  tubeIndex: number
): number {
  const [lo, hi] = range;
  const mean = bandEnergy(l, r, lo, hi);
  const peak = bandPeakNorm(l, r, lo, hi);
  const mix = mean * 0.42 + peak * 0.58;
  const g = TUBE_BAND_GAIN[tubeIndex] ?? 1.1;
  let x = mix * g * 2.25;
  x = Math.min(1, x);
  return Math.min(1, x ** 1.05);
}

const TUBE_COUNT = 4;
/** Each tube = one VU bar; 5 filaments = 5 segments from bottom (index 4) to top (index 0). */
const TUBE_SEGMENTS = 5;
const TUBE_SEG_REF_COUNT = TUBE_COUNT * TUBE_SEGMENTS;

const FILAMENT_LOCAL_CY = 115;
/** dy order: j=0 top … j=4 bottom — segment fill uses s = 4 - j so level fills bottom→top. */
const FILAMENT_STACK_DY = [-42.4, -21.2, 0, 21.2, 42.4] as const;

const TUBE_OFFSETS_X = [80, 240, 400, 560] as const;

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
  const speakerGrilleId = `speaker-grille-pattern-${uid}`;

  const rootRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => ({
    getRadioElement: () => rootRef.current,
  }));

  const indicatorRef = useRef<SVGGElement>(null);
  const vuNeedleLRef = useRef<SVGGElement>(null);
  const vuNeedleRRef = useRef<SVGGElement>(null);
  const vuLabelLRef = useRef<SVGGElement>(null);
  const vuLabelRRef = useRef<SVGGElement>(null);
  const vuBlurLId = `vublur-l-${uid}`;
  const vuBlurRId = `vublur-r-${uid}`;
  const tubeGlassId = `tube-glass-${uid}`;
  const tubeFilamentGlowId = `tube-filament-glow-${uid}`;
  const tubeGlowBlurId = `tube-glow-blur-${uid}`;
  const tubeBlurSigmaIds = [0, 1, 2, 3].map((i) => `tube-blur-sigma-${uid}-${i}`);
  const knobRef = useRef<SVGGElement>(null);
  const rafRef = useRef<number>(0);
  const filamentSegRefs = useRef<(SVGGElement | null)[]>(Array.from({ length: TUBE_SEG_REF_COUNT }, () => null));
  const tubeSmoothRef = useRef([0, 0, 0, 0]);
  const tubeIdleRef = useRef([0.06, 0.05, 0.06, 0.05]);
  /** Resized inside RAF when analysers exist so we never read FFT into zero-length buffers. */
  const freqBufLRef = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(0));
  const freqBufRRef = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(0));

  const offsetRef = useRef(0);
  const smoothOffsetRef = useRef(0);
  const snapAnimRef = useRef<{ from: number; to: number; t0: number; dur: number } | null>(null);
  const dragRef = useRef<{ startX: number; startOffset: number; active: boolean }>({
    startX: 0,
    startOffset: 0,
    active: false,
  });
  const appliedTunedRef = useRef<0 | 1 | 2 | null | undefined>(undefined);
  /** Which station index is allowed to loop-restart after `ended` (radio-style repeat from skip point). */
  const playingTrackRef = useRef<number | null>(null);

  const [powerOn, setPowerOn] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
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

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGainRef.current = masterGain;

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
    analyserL.fftSize = 4096;
    analyserR.fftSize = 4096;
    analyserL.smoothingTimeConstant = 0.38;
    analyserR.smoothingTimeConstant = 0.38;
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
      a.loop = false;
      audios.push(a);
    }
    trackGainsRef.current = trackGains;
    audioElsRef.current = audios;

    for (let i = 0; i < TRACKS.length; i++) {
      audios[i].addEventListener("ended", () => {
        if (playingTrackRef.current !== i) return;
        const list = audioElsRef.current;
        if (!list?.[i]) return;
        seekPastRadioIntro(list[i]);
        void list[i].play().catch(() => {});
      });
    }

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
    merger.connect(masterGain);

    staticGain.connect(masterGain);
    masterGain.connect(ctx.destination);

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
        playingTrackRef.current = null;
        rampGain(staticGain, 0.22);
        for (let i = 0; i < TRACKS.length; i++) {
          rampGain(trackGains[i], 0);
          void audios[i].pause();
        }
        return;
      }

      playingTrackRef.current = idx;
      rampGain(staticGain, 0);
      for (let i = 0; i < TRACKS.length; i++) {
        if (i === idx) {
          rampGain(trackGains[i], 1);
          playWithRadioIntroSkip(audios[i]);
        } else {
          rampGain(trackGains[i], 0);
          void audios[i].pause();
        }
      }
    },
    [rampGain]
  );

  const silenceOutputs = useCallback(() => {
    playingTrackRef.current = null;
    const staticGain = staticGainRef.current;
    const trackGains = trackGainsRef.current;
    const audios = audioElsRef.current;
    if (staticGain) rampGain(staticGain, 0);
    if (trackGains && audios) {
      for (let i = 0; i < TRACKS.length; i++) {
        rampGain(trackGains[i], 0);
        void audios[i].pause();
      }
    }
  }, [rampGain]);

  useEffect(() => {
    const run = async () => {
      if (!powerOn) {
        appliedTunedRef.current = undefined;
        const mg = masterGainRef.current;
        if (mg && audioCtxRef.current) {
          const t = audioCtxRef.current.currentTime;
          mg.gain.cancelScheduledValues(t);
          mg.gain.setValueAtTime(mg.gain.value, t);
          mg.gain.linearRampToValueAtTime(0, t + 0.25);
        }
        silenceOutputs();
        return;
      }
      await ensureAudio();
      const ctx = audioCtxRef.current;
      const mg = masterGainRef.current;
      if (ctx && mg) {
        const t = ctx.currentTime;
        mg.gain.cancelScheduledValues(t);
        mg.gain.setValueAtTime(mg.gain.value, t);
        mg.gain.linearRampToValueAtTime(1, t + 0.2);
      }
      appliedTunedRef.current = undefined;
    };
    void run();
  }, [powerOn, ensureAudio, silenceOutputs]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      const actx = audioCtxRef.current;
      if (actx) void actx.close();
    };
  }, []);

  const pointerDown = async (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    appliedTunedRef.current = undefined;
    dragRef.current = { active: true, startX: e.clientX, startOffset: offsetRef.current };
    snapAnimRef.current = null;
    if (powerOn) await ensureAudio();
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
    appliedTunedRef.current = undefined;
    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
    offsetRef.current = clampOffset(offsetRef.current + delta * 0.5);
    snapAnimRef.current = null;
    if (powerOn) await ensureAudio();
  };

  const togglePower = () => setPowerOn((v) => !v);

  const smoothVuL = useRef(0.12);
  const smoothVuR = useRef(0.12);
  const idleVuL = useRef(0.14);
  const idleVuR = useRef(0.16);

  useEffect(() => {
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

      const tNorm = (smooth - OFFSET_MIN) / (OFFSET_MAX - OFFSET_MIN);
      const knobDeg = -78 + Math.min(1, Math.max(0, tNorm)) * 156;
      knobRef.current?.setAttribute("transform", `rotate(${knobDeg} ${KNOB.x} ${KNOB.y})`);

      const tuned = tunedChannelIndex(smooth);
      if (powerOn && audioCtxRef.current && masterGainRef.current && masterGainRef.current.gain.value > 0.01) {
        if (tuned !== appliedTunedRef.current) {
          appliedTunedRef.current = tuned;
          applyTunedState(tuned);
        }
      } else if (!powerOn && appliedTunedRef.current !== undefined) {
        appliedTunedRef.current = undefined;
      }

      const aL = analyserLRef.current;
      const aR = analyserRRef.current;
      let targetL: number;
      let targetR: number;
      const tubeTargets = [0, 0, 0, 0];

      if (powerOn && aL && aR && tuned !== null) {
        const nBin = aL.frequencyBinCount;
        if (freqBufLRef.current.length !== nBin) {
          freqBufLRef.current = new Uint8Array(nBin);
          freqBufRRef.current = new Uint8Array(nBin);
        }
        const freqL = freqBufLRef.current;
        const freqR = freqBufRRef.current;
        aL.getByteFrequencyData(freqL);
        aR.getByteFrequencyData(freqR);
        targetL = fftToLevel(freqL);
        targetR = fftToLevel(freqR);
        const sr = audioCtxRef.current?.sampleRate ?? 44100;
        const fftSz = aL.fftSize;
        const bands: number[] = [];
        for (let t = 0; t < TUBE_COUNT; t++) {
          const hz = TUBE_HZ_RANGES[t] ?? [45, 240];
          const binRange = hzRangeToBinRange(hz[0], hz[1], sr, fftSz, nBin);
          bands.push(tubeBandLevel(freqL, freqR, binRange, t));
        }
        const sumBands = bands.reduce((acc, v) => acc + v, 0) + 1e-6;
        const vuMono = (targetL + targetR) * 0.5;
        const tubeVuGain = 1.2;
        for (let t = 0; t < TUBE_COUNT; t++) {
          const share = (bands[t]! / sumBands) * TUBE_COUNT;
          tubeTargets[t] = Math.min(1, vuMono * share * tubeVuGain);
        }
      } else if (powerOn) {
        const bump = 0.055;
        const bias = 0.14;
        idleVuL.current += (Math.random() - 0.5) * bump;
        idleVuR.current += (Math.random() - 0.5) * bump;
        idleVuL.current = idleVuL.current * 0.92 + bias * 0.08;
        idleVuR.current = idleVuR.current * 0.92 + bias * 0.08;
        idleVuL.current = Math.min(0.58, Math.max(0.06, idleVuL.current));
        idleVuR.current = Math.min(0.58, Math.max(0.06, idleVuR.current));
        targetL = idleVuL.current;
        targetR = idleVuR.current;
        for (let b = 0; b < TUBE_COUNT; b++) {
          let v = (tubeIdleRef.current[b] ?? 0.06) + (Math.random() - 0.5) * 0.035;
          v = Math.min(0.22, Math.max(0.02, v * 0.94 + 0.05 * 0.06));
          tubeIdleRef.current[b] = v;
          tubeTargets[b] = v;
        }
      } else {
        targetL = 0.06;
        targetR = 0.06;
      }

      const follow = powerOn && tuned !== null ? 0.28 : powerOn ? 0.14 : 0.12;
      smoothVuL.current += (targetL - smoothVuL.current) * follow;
      smoothVuR.current += (targetR - smoothVuR.current) * follow;

      setNeedle(vuNeedleLRef.current, smoothVuL.current, VU_PIVOT_L);
      setNeedle(vuNeedleRRef.current, smoothVuR.current, VU_PIVOT_R);

      const pulseL = 0.38 + smoothVuL.current * 0.62;
      const pulseR = 0.38 + smoothVuR.current * 0.62;
      vuLabelLRef.current?.setAttribute("opacity", String(pulseL));
      vuLabelRRef.current?.setAttribute("opacity", String(pulseR));
      const blurL = 1.2 + smoothVuL.current * 6.5;
      const blurR = 1.2 + smoothVuR.current * 6.5;
      document.getElementById(vuBlurLId)?.setAttribute("stdDeviation", String(blurL));
      document.getElementById(vuBlurRId)?.setAttribute("stdDeviation", String(blurR));

      const smoothT = tubeSmoothRef.current;
      const SEG_OFF = 0.02;
      const SEG_FULL = 1;
      const BLUR_DIM = 2;
      const BLUR_BRIGHT = 14;
      const segs = filamentSegRefs.current;
      for (let t = 0; t < TUBE_COUNT; t++) {
        const tgt = tubeTargets[t] ?? 0;
        const prev = smoothT[t] ?? 0;
        const attack = 0.55;
        const release = 0.08;
        const k = tgt > prev ? attack : release;
        smoothT[t] = prev + (tgt - prev) * k;
        const lvl = Math.min(1, Math.max(0, smoothT[t] ?? 0));
        const blurSig = BLUR_DIM + (BLUR_BRIGHT - BLUR_DIM) * lvl;
        document.getElementById(tubeBlurSigmaIds[t] ?? "")?.setAttribute("stdDeviation", String(blurSig));
        const meter = Math.min(1, lvl ** 1.42);
        const stack = meter * TUBE_SEGMENTS;
        for (let j = 0; j < TUBE_SEGMENTS; j++) {
          const s = TUBE_SEGMENTS - 1 - j;
          const segAmp = Math.min(1, Math.max(0, stack - s));
          const op = SEG_OFF + (SEG_FULL - SEG_OFF) * segAmp;
          segs[t * TUBE_SEGMENTS + j]?.setAttribute("opacity", String(op));
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [powerOn, applyTunedState]);

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`.trim()}>
      <div
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-0 w-full max-w-[800px] -translate-x-1/2"
        aria-hidden
      >
        <svg
          width="800"
          height="222"
          viewBox="0 0 800 222"
          preserveAspectRatio="xMidYMax meet"
          className="mx-auto block h-auto w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={tubeGlassId}>
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
            </linearGradient>
            <radialGradient id={tubeFilamentGlowId}>
              <stop offset="0%" stopColor="#fff6d4" />
              <stop offset="45%" stopColor="#ffc14a" />
              <stop offset="100%" stopColor="#ff3a12" />
            </radialGradient>
            {[0, 1, 2, 3].map((bi) => (
              <filter
                key={bi}
                id={`${tubeGlowBlurId}-${bi}`}
                x="-130%"
                y="-130%"
                width="360%"
                height="360%"
              >
                <feGaussianBlur
                  id={tubeBlurSigmaIds[bi]}
                  in="SourceGraphic"
                  stdDeviation="5"
                  result="blur"
                />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
          </defs>

          <rect x="80" y="210" width="640" height="12" fill="#333" />

          {TUBE_OFFSETS_X.map((tx, i) => (
            <g key={i} transform={`translate(${tx},20)`}>
              <path
                d="M20 180 L20 60 Q20 20 60 20 Q100 20 100 60 L100 180 Z"
                fill="#111"
                stroke="#555"
              />
              <path
                d="M20 180 L20 60 Q20 20 60 20 Q100 20 100 60 L100 180 Z"
                fill={`url(#${tubeGlassId})`}
              />
              <line x1="40" y1="60" x2="40" y2="170" stroke="#666" />
              <line x1="80" y1="60" x2="80" y2="170" stroke="#666" />
              <rect x="45" y="70" width="30" height="70" fill="#222" />
              <rect x="48" y="75" width="24" height="60" fill="#2a2a2a" />
              <g stroke="#444">
                <line x1="45" y1="85" x2="75" y2="85" />
                <line x1="45" y1="100" x2="75" y2="100" />
                <line x1="45" y1="115" x2="75" y2="115" />
              </g>
              <g className="filament" pointerEvents="none">
                {FILAMENT_STACK_DY.map((dy, j) => {
                  const segIdx = i * TUBE_SEGMENTS + j;
                  return (
                    <g
                      key={j}
                      ref={(el) => {
                        filamentSegRefs.current[segIdx] = el;
                        el?.setAttribute("opacity", "0.02");
                      }}
                      transform={`translate(0,${dy})`}
                    >
                      <ellipse
                        cx="60"
                        cy={FILAMENT_LOCAL_CY}
                        rx="13"
                        ry="5.5"
                        fill={`url(#${tubeFilamentGlowId})`}
                        filter={`url(#${tubeGlowBlurId}-${i})`}
                      />
                      <path
                        d={`M45 ${FILAMENT_LOCAL_CY} Q50 ${FILAMENT_LOCAL_CY - 8} 55 ${FILAMENT_LOCAL_CY} Q60 ${FILAMENT_LOCAL_CY + 8} 65 ${FILAMENT_LOCAL_CY} Q70 ${FILAMENT_LOCAL_CY - 8} 75 ${FILAMENT_LOCAL_CY}`}
                        stroke="#ffcc66"
                        strokeWidth="1.5"
                        fill="none"
                      />
                    </g>
                  );
                })}
              </g>
            </g>
          ))}
        </svg>
      </div>

      <svg
        viewBox="0 0 1100 550"
        className="w-full max-w-[min(100%,1100px)] mx-auto h-auto block touch-none"
        role="img"
        aria-label="Radio: power on, then drag or scroll on the strip to tune"
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
          <filter id={`vu-red-glow-l-${uid}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur id={vuBlurLId} in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`vu-red-glow-r-${uid}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur id={vuBlurRId} in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id={speakerGrilleId} width="9" height="9" patternUnits="userSpaceOnUse">
            <rect width="9" height="9" fill="#1c1810" />
            <path d="M 0 0 H 9 M 0 0 V 9" fill="none" stroke="#4a4336" strokeWidth="0.55" />
            <path d="M 4.5 0 V 9 M 0 4.5 H 9" fill="none" stroke="#2e2920" strokeWidth="0.35" opacity="0.85" />
          </pattern>
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
          <line x1="550" y1="138" x2="550" y2="232" stroke="#b30000" strokeWidth="12" strokeLinecap="round" />
          <line x1="550" y1="142" x2="550" y2="228" stroke="#ff3030" strokeWidth="5" strokeLinecap="round" />
        </g>

        <rect
          x="150"
          y="140"
          width="800"
          height="100"
          rx="14"
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
          <g ref={vuLabelLRef} opacity="0.85" pointerEvents="none">
            <text
              x="330"
              y="292"
              textAnchor="middle"
              fill="#ff1a1a"
              fontSize="30"
              fontWeight="800"
              fontFamily="ui-monospace, monospace"
              letterSpacing="0.22em"
              filter={`url(#vu-red-glow-l-${uid})`}
            >
              VU
            </text>
          </g>
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

        <g id="radio-speaker" pointerEvents="none">
          <rect x="460" y="260" width="180" height="180" rx="16" fill="#15120e" stroke="#3d3628" strokeWidth="2" />
          <rect
            x="468"
            y="268"
            width="164"
            height="164"
            rx="11"
            fill={`url(#${speakerGrilleId})`}
            stroke="#9a8648"
            strokeWidth="1.2"
          />
          <rect
            x="472"
            y="272"
            width="156"
            height="156"
            rx="8"
            fill="none"
            stroke="#0d0b08"
            strokeWidth="1"
            opacity="0.45"
          />
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
          <g ref={vuLabelRRef} opacity="0.85" pointerEvents="none">
            <text
              x="770"
              y="292"
              textAnchor="middle"
              fill="#ff1a1a"
              fontSize="30"
              fontWeight="800"
              fontFamily="ui-monospace, monospace"
              letterSpacing="0.22em"
              filter={`url(#vu-red-glow-r-${uid})`}
            >
              VU
            </text>
          </g>
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

        <g
          role="button"
          tabIndex={0}
          cursor="pointer"
          onClick={(e) => {
            e.stopPropagation();
            togglePower();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              togglePower();
            }
          }}
        >
          <circle
            cx="960"
            cy="340"
            r="46"
            fill={powerOn ? "#1a3d24" : "#252525"}
            stroke={powerOn ? "#4ae070" : "#555"}
            strokeWidth="3"
          />
          <circle
            cx="960"
            cy="340"
            r="38"
            fill="none"
            stroke={powerOn ? "#2d8f45" : "#444"}
            strokeWidth="1"
            opacity="0.85"
          />
          <text
            x="960"
            y="334"
            textAnchor="middle"
            fill={powerOn ? "#c8ffd4" : "#999"}
            fontSize="11"
            fontWeight="800"
            letterSpacing="0.06em"
          >
            PWR
          </text>
          <text x="960" y="352" textAnchor="middle" fill={powerOn ? "#7ecf8f" : "#777"} fontSize="10" fontWeight="600">
            {powerOn ? "ON" : "OFF"}
          </text>
        </g>

        <g ref={knobRef} transform={`rotate(0 ${KNOB.x} ${KNOB.y})`} pointerEvents="none">
          <circle cx={KNOB.x} cy={KNOB.y} r="40" fill={`url(#${knob3dId})`} />
          <circle cx={KNOB.x} cy={KNOB.y} r="20" fill="#222" />
          <line x1={KNOB.x} y1={KNOB.y} x2={KNOB.x} y2={KNOB.y - 32} stroke="#fff" strokeWidth="3" />
        </g>
      </svg>

      <p
        className="text-center text-sm sm:text-base tracking-wide text-zinc-400 mt-3 px-4"
        style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        Tune Radio to listening song.
      </p>
    </div>
  );
});

RetroRadioPlayer.displayName = "RetroRadioPlayer";

export default RetroRadioPlayer;
