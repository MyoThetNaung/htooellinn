import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import FuzzyText from "./FuzzyText";
import RetroRadioPlayer, { type RetroRadioPlayerHandle } from "./RetroRadioPlayer";

gsap.registerPlugin(ScrollTrigger);

export default function CdPlayerSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const radioRef = useRef<RetroRadioPlayerHandle>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const radioEl = radioRef.current?.getRadioElement() ?? null;
      if (!radioEl) return;

      gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=1100",
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          scrub: 1,
        },
      })
        .from(radioEl, {
          x: -120,
          y: 40,
          opacity: 0,
          scale: 0.92,
          ease: "power3.out",
        })
        .to(
          radioEl,
          {
            x: 0,
            y: 0,
            scale: 1,
            opacity: 1,
            ease: "none",
          },
          0.45
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section py-0 md:py-16 min-h-screen px-4 bg-gradient-to-b from-black via-zinc-950 to-black flex items-center justify-center"
    >
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center justify-center gap-5 md:gap-8">
        <h2
          className="text-center uppercase tracking-[0.35em] text-zinc-200"
          style={{ fontSize: "clamp(1.2rem, 2.8vw, 2rem)", fontWeight: 800 }}
        >
          <FuzzyText
            baseIntensity={0.06}
            hoverIntensity={0.7}
            enableHover={false}
            clickEffect={false}
            glitchMode
            glitchInterval={950}
            glitchDuration={260}
            fuzzRange={14}
            direction="both"
            fontSize="clamp(1.8rem, 3.2vw, 2.6rem)"
            fontWeight={900}
            letterSpacing={1}
            color="#ffffff"
          >
            Listen
          </FuzzyText>
        </h2>

        <RetroRadioPlayer ref={radioRef} className="w-full flex flex-col items-center" />
      </div>
    </section>
  );
}
