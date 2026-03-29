import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Album } from "../App";
import FuzzyText from "./FuzzyText";

gsap.registerPlugin(ScrollTrigger);

interface AlbumSelectorProps {
  albums: Album[];
  onSelectAlbum: (album: Album) => void;
}

export default function AlbumSelector({ albums, onSelectAlbum }: AlbumSelectorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const titleBlockRef = useRef<HTMLDivElement>(null);
  const carouselWrapRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const albumRefs = useRef<(HTMLDivElement | null)[]>([]);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const didSwipeRef = useRef(false);

  useEffect(() => {
    updateCarousel();
  }, [currentIndex]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=900",
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.from(
        titleBlockRef.current,
        {
          y: 140,
          opacity: 0,
          scale: 0.98,
          ease: "power3.out",
        },
        0
      )
        .from(
          carouselWrapRef.current,
          {
            y: 200,
            opacity: 0,
            scale: 0.96,
            ease: "power3.out",
          },
          0.08
        )
        .from(
          dotsRef.current,
          {
            y: 100,
            opacity: 0,
            ease: "power3.out",
          },
          0.22
        );
    }, sectionRef);

    const refresh = () => ScrollTrigger.refresh();
    window.requestAnimationFrame(refresh);
    const t = window.setTimeout(refresh, 300);

    return () => {
      window.clearTimeout(t);
      ctx.revert();
    };
  }, []);

  const updateCarousel = () => {
    const viewportWidth = window.innerWidth;
    const baseTranslateX = viewportWidth >= 1024 ? 360 : viewportWidth >= 768 ? 300 : 220;
    const baseSize = viewportWidth >= 1280 ? 420 : viewportWidth >= 768 ? 360 : 280;

    albumRefs.current.forEach((album, index) => {
      if (!album) return;

      const offset = index - currentIndex;
      const absOffset = Math.abs(offset);

      const rotateY = offset * 50;
      const translateX = offset * baseTranslateX;
      const translateZ = -absOffset * 200;
      const scale = 1 - absOffset * 0.15;
      const opacity = absOffset > 2 ? 0 : 1 - absOffset * 0.25;
      const zIndex = 10 - absOffset;

      gsap.set(album, {
        width: baseSize,
        height: baseSize,
      });

      gsap.to(album, {
        rotateY,
        x: translateX,
        z: translateZ,
        scale,
        opacity,
        zIndex,
        duration: 0.8,
        ease: "power3.out",
      });
    });
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : albums.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < albums.length - 1 ? prev + 1 : 0));
  };

  const handleAlbumClick = (index: number) => {
    if (didSwipeRef.current) return;
    if (index === currentIndex) {
      onSelectAlbum(albums[index]);
    } else {
      setCurrentIndex(index);
    }
  };

  return (
    <section
      id="discography-home-anchor"
      ref={sectionRef}
      className="section relative flex min-h-[100dvh] min-h-screen flex-col items-center justify-start overflow-hidden px-4 pb-14 pt-0 sm:pb-16 sm:pt-2 md:pb-20 md:pt-4"
      onTouchStart={(e) => {
        const t = e.touches[0];
        touchStartRef.current = { x: t.clientX, y: t.clientY };
        didSwipeRef.current = false;
      }}
      onTouchEnd={(e) => {
        const start = touchStartRef.current;
        if (!start) return;

        const t = e.changedTouches[0];
        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (absX > absY && absX > 50) {
          didSwipeRef.current = true;
          if (dx < 0) handleNext();
          else handlePrev();

          window.setTimeout(() => {
            didSwipeRef.current = false;
          }, 400);
        }

        touchStartRef.current = null;
      }}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, #dc2626 2px, #dc2626 4px)",
        }}
      />

      <div
        ref={titleBlockRef}
        className="relative z-10 mb-3 flex w-full flex-col items-center sm:mb-6 md:mb-8"
      >
        <h2
          className="mb-3 flex w-full flex-col items-center justify-center text-center text-red-600 uppercase tracking-[0.12em] sm:mb-4 sm:tracking-widest"
          style={{
            fontSize: "clamp(2rem, 8vw, 3rem)",
            fontWeight: 900,
            textShadow: "0 0 30px rgba(220, 38, 38, 0.8)",
          }}
        >
          <FuzzyText
            className="mx-auto block max-w-full"
            baseIntensity={0.06}
            hoverIntensity={0.7}
            enableHover={false}
            clickEffect={false}
            glitchMode
            glitchInterval={1000}
            glitchDuration={240}
            fuzzRange={15}
            direction="both"
            fontSize="clamp(2rem, 8vw, 3rem)"
            fontWeight={900}
            letterSpacing={1}
            color="#ffffff"
          >
            Discography
          </FuzzyText>
        </h2>
        <p className="w-full max-w-2xl px-2 text-center text-gray-400 tracking-wide sm:tracking-wider text-[0.95rem] sm:text-[1.1rem]">
          Choose Album
        </p>
      </div>

      <div
        ref={carouselWrapRef}
        className="relative h-[min(380px,50svh)] w-full max-w-7xl sm:h-[460px] md:h-[600px]"
        style={{ perspective: "1500px" }}
      >
        <div
          ref={carouselRef}
          className="absolute inset-0 flex items-center justify-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          {albums.map((album, index) => (
            <div
              key={album.id}
              ref={(el) => {
                albumRefs.current[index] = el;
              }}
              onClick={() => handleAlbumClick(index)}
              className="absolute cursor-pointer group"
              style={{
                transformStyle: "preserve-3d",
                width: "280px",
                height: "280px",
              }}
            >
              <div
                className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl transition-all duration-300"
                style={{
                  boxShadow:
                    index === currentIndex
                      ? "0 0 40px rgba(220, 38, 38, 0.6), 0 20px 60px rgba(0, 0, 0, 0.8)"
                      : "0 10px 30px rgba(0, 0, 0, 0.5)",
                  border: index === currentIndex ? "3px solid #dc2626" : "3px solid #27272a",
                }}
              >
                <img
                  src={album.cover}
                  alt={album.title}
                  className="w-full h-full object-cover"
                  style={{
                    filter: index === currentIndex ? "brightness(1.1)" : "brightness(0.7)",
                  }}
                />

                <div
                  className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6"
                  style={{
                    opacity: index === currentIndex ? 1 : 0,
                  }}
                >
                  {index === currentIndex && (
                    <p className="text-gray-300 mt-2 tracking-wide" style={{ fontSize: "0.9rem" }}>
                      Click to explore
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handlePrev}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-50 w-14 h-14 bg-zinc-900/80 hover:bg-red-600 border-2 border-red-600/50 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 backdrop-blur-sm"
          style={{ boxShadow: "0 0 20px rgba(220, 38, 38, 0.3)" }}
          aria-label="Previous album"
        >
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>

        <button
          onClick={handleNext}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-50 w-14 h-14 bg-zinc-900/80 hover:bg-red-600 border-2 border-red-600/50 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 backdrop-blur-sm"
          style={{ boxShadow: "0 0 20px rgba(220, 38, 38, 0.3)" }}
          aria-label="Next album"
        >
          <ChevronRight className="w-8 h-8 text-white" />
        </button>
      </div>

      <div ref={dotsRef} className="mt-4 flex gap-3 md:mt-10">
        {albums.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className="w-3 h-3 rounded-full transition-all duration-300"
            style={{
              backgroundColor: index === currentIndex ? "#dc2626" : "#3f3f46",
              boxShadow: index === currentIndex ? "0 0 10px rgba(220, 38, 38, 0.8)" : "none",
              transform: index === currentIndex ? "scale(1.3)" : "scale(1)",
            }}
          />
        ))}
      </div>
    </section>
  );
}


