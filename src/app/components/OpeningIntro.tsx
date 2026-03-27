import { useEffect, useMemo, useState } from "react";
import FuzzyText from "./FuzzyText";

interface OpeningIntroProps {
  covers: string[];
  onComplete: () => void;
}

export default function OpeningIntro({ covers, onComplete }: OpeningIntroProps) {
  const [coverIndex, setCoverIndex] = useState(0);
  const [artPosition, setArtPosition] = useState({ top: 50, left: 50, rotate: 0, scale: 1 });
  const [showSignalLine, setShowSignalLine] = useState(false);
  const [showClearLogo] = useState(true);
  const [showEndFlash, setShowEndFlash] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const safeCovers = useMemo(() => (covers.length ? covers : [""]), [covers]);

  useEffect(() => {
    const flashTimer = window.setInterval(() => {
      setCoverIndex((prev) => (prev + 1) % safeCovers.length);
      setArtPosition({
        top: 50,
        left: 50,
        rotate: -38 + Math.random() * 76,
        scale: 0.72 + Math.random() * 1.05,
      });
    }, 170);

    const lineTimer = window.setTimeout(() => {
      setShowSignalLine(true);
    }, 1800);

    const endFlashTimer = window.setTimeout(() => {
      setShowEndFlash(true);
    }, 2550);

    const endingTimer = window.setTimeout(() => {
      setIsEnding(true);
    }, 2750);

    const completeTimer = window.setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      window.clearInterval(flashTimer);
      window.clearTimeout(lineTimer);
      window.clearTimeout(endFlashTimer);
      window.clearTimeout(endingTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete, safeCovers.length]);

  return (
    <div
      className={`fixed inset-0 z-[120] bg-black overflow-hidden transition-opacity duration-300 ${
        isEnding ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative h-full w-full intro-screen-jitter z-20">
        <div className="absolute inset-0">
          <div
            className="absolute h-[46vh] max-h-[520px] w-[80vw] max-w-[860px] overflow-hidden"
            style={{
              top: `${artPosition.top}%`,
              left: `${artPosition.left}%`,
              transform: `translate(-50%, -50%) rotate(${artPosition.rotate}deg) scale(${artPosition.scale})`,
              willChange: "transform",
            }}
          >
            {safeCovers[coverIndex] ? (
              <img
                src={safeCovers[coverIndex]}
                alt="Intro album art"
                className="h-full w-full object-cover opacity-90 intro-art-flash"
              />
            ) : null}
          </div>
        </div>

        <div className="relative h-full w-full flex items-center justify-center px-6">
          <div className="w-[90vw] md:w-2/3 mx-auto relative">
            <div className={`intro-signal-line ${showSignalLine ? "intro-signal-line-active" : ""}`} />
            <div
              className={`intro-final-title ${
                showClearLogo ? "opacity-100 scale-100" : "opacity-0 scale-95"
              } ${isEnding ? "intro-final-flash" : ""}`}
            >
              <FuzzyText
                baseIntensity={0.06}
                hoverIntensity={0.7}
                enableHover={false}
                clickEffect={false}
                glitchMode
                glitchInterval={950}
                glitchDuration={260}
                fuzzRange={18}
                direction="both"
                fontSize="clamp(3.2rem, 12.5vw, 8.4rem)"
                fontWeight={950}
                letterSpacing={0}
                color="#ef4444"
                className="w-full [filter:drop-shadow(0_0_2px_rgba(248,113,113,0.9))_drop-shadow(0_0_10px_rgba(239,68,68,0.55))_drop-shadow(0_0_20px_rgba(220,38,38,0.45))]"
              >
                Htoo El Lynn
              </FuzzyText>
            </div>
          </div>
        </div>
      </div>
      <div className="intro-rgb-shift absolute inset-0 z-10" />
      <div className="intro-flicker absolute inset-0 z-10" />
      <div className="intro-random-flash absolute inset-0 z-10" />
      <div className="intro-scanlines absolute inset-0 z-10" />
      <div className="intro-grain absolute inset-0 z-10" />
      <div className="intro-white-noise absolute inset-0 z-10" />
      <div className="intro-static-burst absolute inset-0 z-10" />
      <div className="intro-vignette absolute inset-0 z-10" />
      {showEndFlash ? <div className="intro-end-fullflash absolute inset-0 z-30" /> : null}
    </div>
  );
}
