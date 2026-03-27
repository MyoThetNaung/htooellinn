import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { Pause, Play } from "lucide-react";
import FuzzyText from "./FuzzyText";

const discImage = new URL("../../../resource images/disc.png", import.meta.url).href;
const songFile = new URL("../../../MUSIC/Min Lay Nar Lal.mp3", import.meta.url).href;

export default function CdPlayerSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const discWrapRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const buttonWrapRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=1100",
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          scrub: 1,
        },
      });

      tl.from(discWrapRef.current, {
        x: -260,
        y: -80,
        opacity: 0,
        scale: 0.8,
        ease: "power3.out",
      })
        .from(
          timelineRef.current,
          {
            x: 280,
            y: 90,
            opacity: 0,
            scale: 0.9,
            ease: "power3.out",
          },
          0
        )
        .from(
          buttonWrapRef.current,
          {
            x: 220,
            y: 160,
            opacity: 0,
            scale: 0.88,
            ease: "power3.out",
          },
          0.12
        )
        .to(
          [discWrapRef.current, timelineRef.current, buttonWrapRef.current],
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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

  const handleTimelineChange = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(Math.max(seconds, 0), duration || 0);
    setCurrentTime(audio.currentTime);
  };

  const progressPercent = useMemo(() => {
    if (!duration) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  const formatTime = (timeInSec: number) => {
    const minutes = Math.floor(timeInSec / 60);
    const seconds = Math.floor(timeInSec % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  return (
    <section
      ref={sectionRef}
      className="section py-0 md:py-16 min-h-screen px-4 bg-gradient-to-b from-black via-zinc-950 to-black flex items-center justify-center"
    >
      <audio ref={audioRef} src={songFile} preload="metadata" />

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

        <div ref={discWrapRef}>
          <img
            src={discImage}
            alt="CD Disc"
            className="w-[82vw] max-w-[360px] md:w-[580px] md:max-w-[580px] aspect-square rounded-full shadow-[0_0_28px_rgba(220,38,38,0.4)] animate-spin"
            style={{
              animationDuration: "3s",
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
              animationPlayState: isPlaying ? "running" : "paused",
            }}
          />
        </div>

        <div ref={timelineRef} className="w-full max-w-xl md:max-w-3xl">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={(event) => handleTimelineChange(Number(event.target.value))}
            className="neon-timeline w-full"
            style={
              {
                "--progress": `${progressPercent}%`,
              } as CSSProperties
            }
            aria-label="Song timeline"
          />
          <div className="flex justify-between mt-2 text-xs tracking-widest text-zinc-300">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div ref={buttonWrapRef} className="mt-4 flex justify-center">
            <button
              onClick={togglePlay}
              className="px-4 py-2 rounded-md transition-colors duration-300 flex items-center justify-center gap-2 uppercase tracking-wide text-xs border border-red-300/60 bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.35),0_3px_8px_rgba(0,0,0,0.35)]"
              aria-label={isPlaying ? "Pause audio" : "Play audio"}
            >
              {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
              {isPlaying ? "Pause" : "Play"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
