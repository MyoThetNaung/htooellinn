import React, { useEffect, useRef } from "react";
import gsap from "gsap";

const mainBackground = new URL("../../../resource images/main background.jpg", import.meta.url).href;

export default function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(titleRef.current, {
        opacity: 0,
        y: -50,
        duration: 1.5,
        ease: "power4.out",
      });

      gsap.from(subtitleRef.current, {
        opacity: 0,
        y: 50,
        duration: 1.5,
        delay: 0.3,
        ease: "power4.out",
      });

      gsap.to(heroRef.current, {
        backgroundPosition: "50% 100%",
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={heroRef}
      className="section relative h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${mainBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "50% 0%",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />

      <div className="relative z-10 text-center px-4">
        <h1
          ref={titleRef}
          className="mb-6 tracking-wider whitespace-nowrap leading-none"
          style={{
            fontSize: "clamp(2.3rem, 8vw, 7rem)",
            fontWeight: 900,
            textShadow: "0 0 30px rgba(220, 38, 38, 0.8), 0 0 60px rgba(220, 38, 38, 0.4)",
            letterSpacing: "0.07em",
          }}
        >
          Htoo El Lynn
        </h1>

        <p
          ref={subtitleRef}
          className="mb-12 text-gray-300 tracking-widest uppercase"
          style={{
            fontSize: "clamp(1rem, 2vw, 1.5rem)",
            letterSpacing: "0.3em",
          }}
        >
          Rock • Metal • Thunder
        </p>

      </div>

    </div>
  );
}
