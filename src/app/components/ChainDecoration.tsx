import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function ChainDecoration() {
  const chainRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".chain-link", {
        rotation: 360,
        duration: 20,
        repeat: -1,
        ease: "none",
        stagger: {
          each: 0.5,
          from: "start",
        },
      });

      gsap.to(chainRef.current, {
        y: 20,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, chainRef);

    return () => ctx.revert();
  }, []);

  return (
    <svg
      ref={chainRef}
      className="fixed top-0 left-0 w-24 h-full pointer-events-none z-0 opacity-20"
      viewBox="0 0 100 1000"
      style={{ filter: "drop-shadow(0 0 10px rgba(220, 38, 38, 0.5))" }}
    >
      {[...Array(10)].map((_, i) => (
        <g key={i} className="chain-link" transform={`translate(50, ${i * 100 + 50})`}>
          <ellipse
            cx="0"
            cy="0"
            rx="20"
            ry="35"
            fill="none"
            stroke="#dc2626"
            strokeWidth="6"
            opacity="0.8"
          />
          <ellipse
            cx="0"
            cy="0"
            rx="10"
            ry="25"
            fill="none"
            stroke="#7f1d1d"
            strokeWidth="4"
          />
        </g>
      ))}
    </svg>
  );
}
