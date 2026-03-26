import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { Play } from "lucide-react";
import { Album } from "../App";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface AlbumDetailProps {
  album: Album;
  onClose: () => void;
}

export default function AlbumDetail({ album, onClose }: AlbumDetailProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(modalRef.current, {
        opacity: 0,
        duration: 0.3,
      });

      gsap.from(contentRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
        ease: "back.out(1.7)",
      });

    }, modalRef);

    return () => ctx.revert();
  }, []);

  const handleClose = () => {
    gsap.to(contentRef.current, {
      scale: 0.8,
      opacity: 0,
      duration: 0.3,
      onComplete: onClose,
    });
  };

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/95 z-50 overflow-y-auto"
      onClick={handleClose}
    >
      <div
        ref={contentRef}
        onClick={(e) => e.stopPropagation()}
        className="min-h-screen py-12 px-4"
      >
        <div className="max-w-6xl mx-auto bg-gradient-to-br from-zinc-900 to-black border border-red-600/20 rounded-lg shadow-2xl">
          <button
            onClick={handleClose}
            className="absolute top-8 right-8 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-red-600/20 rounded-lg text-xs uppercase tracking-widest transition-all duration-300 z-10"
          >
            Back
          </button>

          <div className="grid md:grid-cols-2 gap-8 p-8">
            <div className="relative group">
              <div className="relative overflow-hidden rounded-lg shadow-2xl">
                <ImageWithFallback
                  src={album.cover}
                  alt={album.title}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              <div className="mt-6 flex gap-4">
                <a
                  href={album.streamingLinks.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-colors duration-300"
                  style={{ backgroundColor: "#1ed760", color: "#000000" }}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                    <path d="M12 1.5a10.5 10.5 0 1 0 0 21 10.5 10.5 0 0 0 0-21Zm4.79 15.14a.8.8 0 0 1-1.1.26c-3.02-1.84-6.82-2.25-11.3-1.2a.8.8 0 0 1-.37-1.56c4.9-1.16 9.09-.69 12.5 1.4.38.23.5.72.27 1.1Zm1.57-3.2a1 1 0 0 1-1.37.32c-3.46-2.13-8.74-2.75-12.83-1.5a1 1 0 0 1-.58-1.92c4.67-1.41 10.47-.73 14.46 1.73a1 1 0 0 1 .32 1.38Zm.14-3.35C14.43 7.75 7.7 7.53 3.8 8.72a1.2 1.2 0 1 1-.7-2.3C7.55 5.08 15 5.36 19.73 8.2a1.2 1.2 0 0 1-1.23 2.04Z" />
                  </svg>
                  <span className="uppercase tracking-wide">Spotify</span>
                </a>

                {album.streamingLinks.appleMusic ? (
                  <a
                    href={album.streamingLinks.appleMusic}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-colors duration-300"
                    style={{ backgroundColor: "#ff4e6b" }}
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                      <path d="M16.37 1.43c.06.95-.29 1.9-.9 2.57-.62.68-1.64 1.2-2.55 1.12-.12-.93.3-1.93.9-2.58.65-.72 1.7-1.23 2.55-1.11Zm3.3 16.06c-.44 1.02-.65 1.47-1.2 2.38-.77 1.27-1.85 2.85-3.19 2.86-1.2.01-1.51-.77-3.14-.77-1.64 0-1.98.76-3.17.78-1.35.01-2.37-1.4-3.14-2.67-2.15-3.52-2.38-7.64-1.05-9.68.95-1.47 2.45-2.33 3.87-2.33 1.46 0 2.38.78 3.58.78 1.16 0 1.86-.78 3.57-.78 1.26 0 2.58.68 3.53 1.86-3.11 1.7-2.61 6.16.34 7.57Z" />
                    </svg>
                    <span className="uppercase tracking-wide">Apple</span>
                  </a>
                ) : null}
              </div>

              <a
                href={album.streamingLinks.youtubeMusic}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-300"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                  <path d="M21.58 7.19a2.98 2.98 0 0 0-2.1-2.11C17.62 4.5 12 4.5 12 4.5s-5.62 0-7.48.58a2.98 2.98 0 0 0-2.1 2.11A31.9 31.9 0 0 0 2 12a31.9 31.9 0 0 0 .42 4.81 2.98 2.98 0 0 0 2.1 2.11c1.86.58 7.48.58 7.48.58s5.62 0 7.48-.58a2.98 2.98 0 0 0 2.1-2.11c.28-1.58.42-3.2.42-4.81s-.14-3.23-.42-4.81ZM10 15.5v-7l6 3.5-6 3.5Z" />
                </svg>
                <span className="uppercase tracking-wide">YouTube Music</span>
              </a>
            </div>

            <div>
              <h2
                className="mb-2 uppercase tracking-widest"
                style={{
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  fontWeight: 800,
                  textShadow: "0 0 20px rgba(220, 38, 38, 0.5)",
                }}
              >
                {album.title}
              </h2>
              <p className="text-gray-400 mb-8 leading-relaxed">{album.description}</p>

              <div className="space-y-2">
                <h3 className="uppercase tracking-wider mb-4" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                  Tracklist
                </h3>
                {album.songs.map((song, index) => (
                  <div
                    key={song.id}
                    className="song-item flex items-center gap-4 p-3 bg-zinc-800/50 hover:bg-zinc-800 border border-transparent hover:border-red-600/30 rounded transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center group-hover:bg-red-700 transition-colors">
                      <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="group-hover:text-red-600 transition-colors" style={{ fontWeight: 600 }}>
                        {song.title}
                      </p>
                    </div>
                    <div className="text-gray-400 tracking-wider" style={{ fontSize: "0.9rem" }}>
                      {song.duration}
                    </div>
                    <Play className="w-4 h-4 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-zinc-800/30 border border-red-600/20 rounded-lg">
                <p className="text-gray-400 text-center" style={{ fontSize: "0.9rem" }}>
                  Total Duration:{" "}
                  <span className="text-white">
                    {album.songs.length} tracks •{" "}
                    {Math.floor(
                      album.songs.reduce((acc, song) => {
                        const [min, sec] = song.duration.split(":").map(Number);
                        return acc + min * 60 + sec;
                      }, 0) / 60
                    )}{" "}
                    minutes
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
