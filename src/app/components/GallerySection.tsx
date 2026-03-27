import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import FuzzyText from "./FuzzyText";

const gallery1 = new URL("../../../resource images/gallery/1.jpg", import.meta.url).href;
const gallery2 = new URL("../../../resource images/gallery/2.jpg", import.meta.url).href;
const gallery3 = new URL("../../../resource images/gallery/3.jpg", import.meta.url).href;
const gallery4 = new URL("../../../resource images/gallery/4.jpg", import.meta.url).href;
const gallery5 = new URL("../../../resource images/gallery/5.jpg", import.meta.url).href;
const gallery6 = new URL("../../../resource images/gallery/6.jpg", import.meta.url).href;
const gallery7 = new URL("../../../resource images/gallery/7.jpg", import.meta.url).href;
const gallery8 = new URL("../../../resource images/gallery/8.jpg", import.meta.url).href;

const galleryImages = [
  {
    url: gallery1,
    title: "Gallery 1",
  },
  {
    url: gallery2,
    title: "Gallery 2",
  },
  {
    url: gallery3,
    title: "Gallery 3",
  },
  {
    url: gallery4,
    title: "Gallery 4",
  },
  {
    url: gallery5,
    title: "Gallery 5",
  },
  {
    url: gallery6,
    title: "Gallery 6",
  },
  {
    url: gallery7,
    title: "Gallery 7",
  },
  {
    url: gallery8,
    title: "Gallery 8",
  },
];

export default function GallerySection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (imageRef.current) {
      gsap.fromTo(
        imageRef.current,
        { x: 100, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
      );
    }
  }, [currentIndex]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  return (
    <div ref={sectionRef} className="section min-h-screen py-20 px-4 bg-gradient-to-b from-black via-zinc-900 to-black">
      <div className="max-w-7xl mx-auto">
        <h2
          className="mb-16 text-center uppercase tracking-widest"
          style={{
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            fontWeight: 800,
            textShadow: "0 0 20px rgba(220, 38, 38, 0.5)",
          }}
        >
          <FuzzyText
            baseIntensity={0.06}
            hoverIntensity={0.7}
            enableHover={false}
            clickEffect={false}
            glitchMode
            glitchInterval={1200}
            glitchDuration={230}
            fuzzRange={16}
            direction="both"
            fontSize="clamp(2.5rem, 5vw, 4rem)"
            fontWeight={900}
            letterSpacing={1}
            color="#ffffff"
          >
            Gallery
          </FuzzyText>
        </h2>

        <div className="relative">
          <div
            ref={imageRef}
            className="relative overflow-hidden rounded-lg shadow-2xl touch-pan-y"
            onTouchStart={(e) => {
              const t = e.touches[0];
              touchStartRef.current = { x: t.clientX, y: t.clientY };
            }}
            onTouchEnd={(e) => {
              const start = touchStartRef.current;
              if (!start) return;
              const t = e.changedTouches[0];
              const dx = t.clientX - start.x;
              const dy = t.clientY - start.y;
              const absX = Math.abs(dx);
              const absY = Math.abs(dy);

              // Only treat as swipe when horizontal intent is dominant.
              if (absX > absY && absX > 50) {
                if (dx < 0) nextImage();
                else prevImage();
              }

              touchStartRef.current = null;
            }}
          >
            <ImageWithFallback
              src={galleryImages[currentIndex].url}
              alt={galleryImages[currentIndex].title}
              className="w-full h-[600px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>

          <div className="flex justify-center gap-2 mt-8">
            {galleryImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "bg-red-600 w-8" : "bg-gray-600 hover:bg-gray-500"
                }`}
              />
            ))}
          </div>
          <button
            onClick={prevImage}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 bg-red-600/80 hover:bg-red-600 rounded-full items-center justify-center transition-all duration-300 hover:scale-110"
            aria-label="Previous gallery image"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={nextImage}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 bg-red-600/80 hover:bg-red-600 rounded-full items-center justify-center transition-all duration-300 hover:scale-110"
            aria-label="Next gallery image"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-12">
          {galleryImages.map((image, index) => (
            <div
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`relative cursor-pointer overflow-hidden rounded-lg transition-all duration-300 ${
                index === currentIndex ? "ring-4 ring-red-600" : "opacity-60 hover:opacity-100"
              }`}
            >
              <ImageWithFallback
                src={image.url}
                alt={image.title}
                className="w-full h-32 object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
