import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { Guitar, Mic2, Music } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const legendImage = new URL("../../../resource images/LEGEND.jpg", import.meta.url).href;

export default function AboutSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageBlockRef = useRef<HTMLDivElement>(null);
  const textBlockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=1000",
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          scrub: 1,
        },
      });

      tl.from(
        imageBlockRef.current,
        {
          x: 260,
          opacity: 0,
          scale: 0.92,
          ease: "power3.out",
        },
        0
      )
        .from(
          textBlockRef.current,
          {
            x: 220,
            opacity: 0,
            scale: 0.96,
            ease: "power3.out",
          },
          0.08
        )
        .from(
          ".stat-card",
          {
            x: 150,
            opacity: 0,
            stagger: 0.12,
            ease: "power3.out",
          },
          0.2
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      id="legend"
      ref={sectionRef}
      className="section min-h-screen px-4 bg-gradient-to-b from-black via-zinc-900 to-black flex items-center"
    >
      <div className="max-w-6xl mx-auto w-full">
        <h2
          className="mb-8 md:mb-10 text-center uppercase tracking-widest"
          style={{
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            fontWeight: 800,
            textShadow: "0 0 20px rgba(220, 38, 38, 0.5)",
          }}
        >
          The Legend
        </h2>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <div ref={imageBlockRef} className="relative group overflow-hidden rounded-lg">
            <ImageWithFallback
              src={legendImage}
              alt="Rock singer with guitar"
              className="w-full h-[500px] object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
          </div>

          <div ref={textBlockRef} className="flex flex-col justify-center space-y-4 sm:space-y-5">
            <p className="text-gray-300 leading-relaxed text-[0.9rem] sm:text-[1.1rem]">
              Born in the heart of the underground scene, Htoo El Lin has been delivering
              bone-crushing riffs and soul-stirring vocals for over a decade. From smoky dive bars
              to sold-out arenas, the journey has been nothing short of legendary.
            </p>
            <p className="text-gray-300 leading-relaxed text-[0.9rem] sm:text-[1.1rem]">
              With four critically acclaimed albums and countless electrifying performances,
              Steel Rage continues to push the boundaries of rock music, blending raw power
              with melodic mastery.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 sm:pt-6">
              <div className="stat-card flex items-center gap-3 p-3 sm:p-4 bg-zinc-800/50 border border-red-600/20 hover:border-red-600 transition-colors min-w-0">
                <Music className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 flex-shrink-0" />
                <div>
                  <div className="text-xl sm:text-2xl font-bold leading-none">10</div>
                  <div className="text-xs sm:text-sm text-gray-400 uppercase tracking-wide">Album</div>
                </div>
              </div>

              <div className="stat-card flex items-center gap-3 p-3 sm:p-4 bg-zinc-800/50 border border-red-600/20 hover:border-red-600 transition-colors min-w-0">
                <Mic2 className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 flex-shrink-0" />
                <div>
                  <div className="text-xl sm:text-2xl font-bold leading-none">500+</div>
                  <div className="text-xs sm:text-sm text-gray-400 uppercase tracking-wide">Show</div>
                </div>
              </div>

              <div className="stat-card flex items-center gap-3 p-3 sm:p-4 bg-zinc-800/50 border border-red-600/20 hover:border-red-600 transition-colors min-w-0">
                <Guitar className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 flex-shrink-0" />
                <div>
                  <div className="text-xl sm:text-2xl font-bold leading-none">20+</div>
                  <div className="text-xs sm:text-sm text-gray-400 uppercase tracking-wide">Years</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
