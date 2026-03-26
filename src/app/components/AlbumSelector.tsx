import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Album } from "../App";

interface AlbumSelectorProps {
  albums: Album[];
  onSelectAlbum: (album: Album) => void;
}

export default function AlbumSelector({ albums, onSelectAlbum }: AlbumSelectorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const albumRefs = useRef<(HTMLDivElement | null)[]>([]);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const didSwipeRef = useRef(false);

  useEffect(() => {
    updateCarousel();
  }, [currentIndex]);

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
      className="section relative min-h-screen flex flex-col items-center justify-center py-20 px-4 overflow-hidden"
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

      <div className="relative z-10 text-center mb-12">
        <h2
          className="mb-3 sm:mb-4 text-red-600 uppercase tracking-[0.12em] sm:tracking-widest"
          style={{
            fontSize: "clamp(2rem, 8vw, 3rem)",
            fontWeight: 900,
            textShadow: "0 0 30px rgba(220, 38, 38, 0.8)",
          }}
        >
          Discography
        </h2>
        <p className="text-gray-400 tracking-wide sm:tracking-wider max-w-2xl mx-auto px-2 text-[0.95rem] sm:text-[1.1rem]">
          Choose Album
        </p>
      </div>

      <div className="relative w-full max-w-7xl h-[500px] md:h-[620px]" style={{ perspective: "1500px" }}>
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

      <div className="mt-24 flex gap-3">
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
