import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import FuzzyText from "./FuzzyText";

const mainBackground = new URL("../../../resource images/main background.jpg", import.meta.url).href;

export default function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);

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

      gsap.to(heroImageRef.current, {
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
    >
      <div
        ref={heroImageRef}
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${mainBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "50% 0%",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 62%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, black 0%, black 62%, transparent 100%)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/45 to-transparent" />

      <div className="relative z-10 text-center px-4">
        <div ref={titleRef} className="mb-6 flex justify-center w-[90vw] md:w-2/3 mx-auto">
          <FuzzyText
            baseIntensity={0.06}
            hoverIntensity={0.7}
            enableHover={false}
            clickEffect
            glitchMode
            glitchInterval={950}
            glitchDuration={260}
            fuzzRange={18}
            direction="both"
            fontSize="clamp(3.2rem, 12.5vw, 8.4rem)"
            fontWeight={950}
            letterSpacing={0}
            color="#ffffff"
            className="w-full [filter:drop-shadow(0_0_2px_rgba(255,255,255,0.75))_drop-shadow(0_0_10px_rgba(255,255,255,0.45))_drop-shadow(0_0_18px_rgba(220,38,38,0.35))]"
          >
            Htoo El Lynn
          </FuzzyText>
        </div>

        <div
          ref={subtitleRef}
          className="mb-12 flex flex-nowrap items-center justify-center gap-0.5 uppercase text-gray-300 w-[90vw] md:w-2/3 mx-auto"
          style={{ letterSpacing: "0.01em" }}
        >
          <FuzzyText
            baseIntensity={0.05}
            hoverIntensity={0.62}
            enableHover={false}
            clickEffect
            glitchMode
            glitchInterval={1450}
            glitchDuration={180}
            fuzzRange={14}
            direction="both"
            fontSize="clamp(0.9rem, 3.5vw, 1.35rem)"
            fontWeight={700}
            color="#d1d5db"
            className="[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.75))_drop-shadow(0_0_6px_rgba(255,255,255,0.35))_drop-shadow(0_0_10px_rgba(220,38,38,0.25))]"
          >
            Rock
          </FuzzyText>
          <span aria-hidden="true" className="text-[0.6em]">
            •
          </span>
          <FuzzyText
            baseIntensity={0.05}
            hoverIntensity={0.62}
            enableHover={false}
            clickEffect
            glitchMode
            glitchInterval={1750}
            glitchDuration={240}
            fuzzRange={14}
            direction="both"
            fontSize="clamp(0.9rem, 3.5vw, 1.35rem)"
            fontWeight={700}
            color="#d1d5db"
            className="[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.75))_drop-shadow(0_0_6px_rgba(255,255,255,0.35))_drop-shadow(0_0_10px_rgba(220,38,38,0.25))]"
          >
            Metal
          </FuzzyText>
          <span aria-hidden="true" className="text-[0.6em]">
            •
          </span>
          <FuzzyText
            baseIntensity={0.05}
            hoverIntensity={0.62}
            enableHover={false}
            clickEffect
            glitchMode
            glitchInterval={1300}
            glitchDuration={200}
            fuzzRange={14}
            direction="both"
            fontSize="clamp(0.9rem, 3.5vw, 1.35rem)"
            fontWeight={700}
            color="#d1d5db"
            className="[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.75))_drop-shadow(0_0_6px_rgba(255,255,255,0.35))_drop-shadow(0_0_10px_rgba(220,38,38,0.25))]"
          >
            Thunder
          </FuzzyText>
        </div>
      </div>
    </div>
  );
}
