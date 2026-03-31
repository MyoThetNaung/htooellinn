import React, { useEffect, useRef } from "react";

const fretSvgUrl = new URL("../../../resource images/Fretboard background.svg", import.meta.url).href;

export default function FretBackground() {
  const fretRef = useRef<HTMLDivElement | null>(null);
  const lightningRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let scrollY = 0;

    const handleScroll = () => {
      scrollY = window.scrollY;

      if (fretRef.current) {
        fretRef.current.style.transform = `translateY(${-scrollY * 0.4}px)`;
      }

      if (lightningRef.current) {
        lightningRef.current.style.transform = `translateY(${-scrollY * 0.2}px)`;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const canvas = lightningRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let frameId: number;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize, { passive: true });

    const drawLightning = () => {
      ctx.clearRect(0, 0, width, height);

      if (Math.random() < 0.04) {
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 2;

        let x = Math.random() * width;
        let y = 0;

        ctx.beginPath();
        ctx.moveTo(x, y);

        while (y < height) {
          x += (Math.random() - 0.5) * 25;
          y += Math.random() * 35;
          ctx.lineTo(x, y);
        }

        ctx.stroke();
      }

      frameId = requestAnimationFrame(drawLightning);
    };

    drawLightning();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 bg-black overflow-hidden">
      {/* Fretboard */}
      <div className="absolute inset-0">
        <div
          ref={fretRef}
          className="relative h-[200vh] w-full"
        >
          <img
            src={fretSvgUrl}
            alt="Guitar fretboard"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Lightning layer */}
      <canvas
        ref={lightningRef}
        className="absolute inset-0 opacity-40"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/90" />
    </div>
  );
}

