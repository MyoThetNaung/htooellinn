import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const GUITAR_FREQUENCIES = [
  82.41,  // E2 (low E string)
  110.0,  // A2
  146.83, // D3
  196.0,  // G3
  246.94, // B3
  329.63, // E4 (high E string)
];

interface GuitarStringProps {
  orientation?: "vertical" | "horizontal";
}

export default function GuitarString({ orientation = "vertical" }: GuitarStringProps) {
  const stringsRef = useRef<(SVGLineElement | null)[]>([]);
  const [isDragging, setIsDragging] = useState<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

    stringsRef.current.forEach((string, index) => {
      if (string) {
        gsap.to(string, {
          strokeWidth: 2 + index * 0.8,
          opacity: 0.7 + index * 0.05,
          ease: "power1.inOut",
        });

        gsap.to(string, {
          y: Math.sin(index) * 3,
          duration: 2 + index * 0.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
    });

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playGuitarSound = (frequency: number, intensity: number = 1) => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, now);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2000 + intensity * 1000, now);
    filter.Q.setValueAtTime(1, now);

    const volume = 0.3 * intensity;
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(volume * 0.3, now + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 2);

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + 2);

    const harmonic1 = ctx.createOscillator();
    const harmonicGain1 = ctx.createGain();
    harmonic1.type = "sine";
    harmonic1.frequency.setValueAtTime(frequency * 2, now);
    harmonicGain1.gain.setValueAtTime(volume * 0.3, now);
    harmonicGain1.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    harmonic1.connect(harmonicGain1);
    harmonicGain1.connect(ctx.destination);
    harmonic1.start(now);
    harmonic1.stop(now + 1.5);

    const harmonic2 = ctx.createOscillator();
    const harmonicGain2 = ctx.createGain();
    harmonic2.type = "sine";
    harmonic2.frequency.setValueAtTime(frequency * 3, now);
    harmonicGain2.gain.setValueAtTime(volume * 0.15, now);
    harmonicGain2.gain.exponentialRampToValueAtTime(0.001, now + 1);
    harmonic2.connect(harmonicGain2);
    harmonicGain2.connect(ctx.destination);
    harmonic2.start(now);
    harmonic2.stop(now + 1);
  };

  const handleStringInteraction = (index: number, clientY: number, playSound: boolean = true) => {
    const string = stringsRef.current[index];
    if (string) {
      const displacement = ((clientY % 100) - 50) * 0.8;
      const intensity = Math.min(Math.abs(displacement) / 40, 1);

      gsap.to(string, {
        attr: { x1: displacement, x2: -displacement },
        duration: 0.05,
        ease: "power2.out",
        onComplete: () => {
          gsap.to(string, {
            attr: { x1: 0, x2: 0 },
            duration: 1.2,
            ease: "elastic.out(1, 0.2)",
          });
        },
      });

      if (playSound) {
        playGuitarSound(GUITAR_FREQUENCIES[index], intensity);
      }
    }
  };

  const handleStringClick = (index: number, e: React.MouseEvent) => {
    handleStringInteraction(index, e.clientY, true);
  };

  const handleStringHover = (index: number, e: React.MouseEvent) => {
    handleStringInteraction(index, e.clientY, false);
  };

  const isHorizontal = orientation === "horizontal";
  const gradientId = isHorizontal ? "stringGradientHorizontal" : "stringGradientVertical";

  return (
    <svg
      className={
        isHorizontal
          ? "relative z-[120] w-full max-w-6xl h-40 mx-auto pointer-events-auto opacity-100 cursor-pointer"
          : "fixed top-0 right-0 w-48 h-full pointer-events-auto z-10 opacity-40 cursor-pointer"
      }
      viewBox={isHorizontal ? "0 0 1000 200" : "0 0 200 1000"}
      style={{ filter: "drop-shadow(0 0 12px rgba(248, 113, 113, 0.8))" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={isHorizontal ? "#fee2e2" : "#7f1d1d"} stopOpacity="1" />
          <stop offset="50%" stopColor={isHorizontal ? "#f87171" : "#dc2626"} stopOpacity="1" />
          <stop offset="100%" stopColor={isHorizontal ? "#fee2e2" : "#7f1d1d"} stopOpacity="1" />
        </linearGradient>
      </defs>

      {[...Array(6)].map((_, i) => (
        <g key={i}>
          <line
            ref={(el) => (stringsRef.current[i] = el)}
            x1="0"
            y1="0"
            x2={isHorizontal ? "1000" : "0"}
            y2={isHorizontal ? "0" : "1000"}
            stroke={`url(#${gradientId})`}
            strokeLinecap="round"
            transform={isHorizontal ? `translate(0, ${40 + i * 25})` : `translate(${40 + i * 25}, 0)`}
            onClick={(e) => handleStringClick(i, e)}
            onMouseEnter={(e) => handleStringHover(i, e)}
            onMouseMove={(e) => {
              if (isDragging === i) {
                handleStringInteraction(i, e.clientY, true);
              }
            }}
            onMouseDown={() => setIsDragging(i)}
            onMouseUp={() => setIsDragging(null)}
            onMouseLeave={() => setIsDragging(null)}
            style={{
              cursor: "pointer",
              pointerEvents: "all",
              strokeWidth: isHorizontal ? 4.5 : undefined,
            }}
          />
          <circle
            cx={isHorizontal ? "50" : 40 + i * 25}
            cy={isHorizontal ? 40 + i * 25 : "50"}
            r="4"
            fill="#dc2626"
            opacity="0.6"
            style={{ pointerEvents: "none" }}
          />
          <circle
            cx={isHorizontal ? "950" : 40 + i * 25}
            cy={isHorizontal ? 40 + i * 25 : "950"}
            r="4"
            fill="#dc2626"
            opacity="0.6"
            style={{ pointerEvents: "none" }}
          />
        </g>
      ))}

      {isHorizontal ? (
        <>
          <rect x="30" y="0" width="8" height="200" fill="#18181b" opacity="0.8" rx="2" />
          <rect x="962" y="0" width="8" height="200" fill="#18181b" opacity="0.8" rx="2" />
        </>
      ) : (
        <>
          <rect x="0" y="30" width="200" height="8" fill="#18181b" opacity="0.8" rx="2" />
          <rect x="0" y="962" width="200" height="8" fill="#18181b" opacity="0.8" rx="2" />
        </>
      )}
    </svg>
  );
}
