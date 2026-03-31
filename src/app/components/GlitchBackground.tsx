import React, { useEffect, useRef, useState } from "react";

export interface GlitchBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  color?: string;
  intensity?: number;
  scanlines?: boolean;
}

function cn(...values: Array<string | undefined | null | false>) {
  return values.filter(Boolean).join(" ");
}

export function GlitchBackground({
  className,
  children,
  color = "#00ffff",
  intensity = 1,
  scanlines = true,
}: GlitchBackgroundProps) {
  const [glitchState, setGlitchState] = useState({
    offsetX1: 0,
    offsetX2: 0,
    sliceY: 0,
    sliceHeight: 0,
    sliceOffset: 0,
    noiseOpacity: 0,
    isGlitching: false,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationId = 0;
    let lastGlitch = 0;
    let glitchDuration = 0;
    let nextGlitch = 1600 + Math.random() * 2600;
    let lastCalmUpdate = 0;

    const animate = (time: number) => {
      const timeSinceGlitch = time - lastGlitch;

      if (timeSinceGlitch > nextGlitch && glitchDuration === 0) {
        glitchDuration = 45 + Math.random() * 90 * intensity;
        lastGlitch = time;
      }

      if (glitchDuration > 0) {
        glitchDuration -= 16;

        const glitchIntensity = intensity * (Math.random() * 0.5 + 0.5);

        setGlitchState({
          offsetX1: (Math.random() - 0.5) * 25 * glitchIntensity,
          offsetX2: (Math.random() - 0.5) * 25 * glitchIntensity,
          sliceY: Math.random() * 100,
          sliceHeight: 2 + Math.random() * 10,
          sliceOffset: (Math.random() - 0.5) * 40 * glitchIntensity,
          noiseOpacity: 0.12 + Math.random() * 0.18 * glitchIntensity,
          isGlitching: true,
        });

        if (glitchDuration <= 0) {
          nextGlitch = (1800 + Math.random() * 3200) / Math.max(0.7, intensity);
        }
      } else {
        if (time - lastCalmUpdate > 250) {
          lastCalmUpdate = time;
          setGlitchState(() => ({
            offsetX1: 0,
            offsetX2: 0,
            sliceY: 0,
            sliceHeight: 0,
            sliceOffset: 0,
            noiseOpacity: 0.01,
            isGlitching: false,
          }));
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [intensity]);

  return (
    <div ref={containerRef} className={cn("fixed inset-0 overflow-hidden bg-black", className)}>
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 40%, ${color}15 0%, transparent 50%),
            radial-gradient(ellipse at 70% 60%, ${color}10 0%, transparent 50%),
            linear-gradient(180deg, #0a0a0f 0%, #12121a 50%, #0a0a12 100%)
          `,
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 mix-blend-screen"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${color}20 0%, transparent 60%)`,
          transform: `translateX(${glitchState.offsetX1}px)`,
          opacity: 0.8,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 mix-blend-screen"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, #ff000018 0%, transparent 60%)",
          transform: `translateX(${-glitchState.offsetX2}px)`,
          opacity: 0.6,
        }}
      />

      {glitchState.isGlitching && glitchState.sliceHeight > 0 && (
        <div
          className="pointer-events-none absolute inset-x-0"
          style={{
            top: `${glitchState.sliceY}%`,
            height: `${glitchState.sliceHeight}%`,
            background: `linear-gradient(90deg, transparent, ${color}30, transparent)`,
            transform: `translateX(${glitchState.sliceOffset}px)`,
            boxShadow: `0 0 10px ${color}50`,
          }}
        />
      )}

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: glitchState.noiseOpacity,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
        }}
      />

      {scanlines && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
            opacity: 0.5,
          }}
        />
      )}

      {glitchState.isGlitching && Math.random() > 0.7 && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: color,
            opacity: 0.03,
          }}
        />
      )}

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.8) 100%)",
        }}
      />

      {children ? <div className="relative z-10 h-full w-full">{children}</div> : null}
    </div>
  );
}

export default function GlitchBackgroundDemo() {
  return <GlitchBackground />;
}
