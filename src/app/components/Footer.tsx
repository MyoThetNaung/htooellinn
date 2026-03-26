import { Instagram, Twitter, Facebook, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-red-600/20 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <h3
              className="mb-2 uppercase tracking-widest"
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                textShadow: "0 0 15px rgba(220, 38, 38, 0.5)",
              }}
            >
              HTOO EL LYNN
            </h3>
            <p className="text-gray-400 tracking-wide">Rock • Metal • Thunder</p>
          </div>

          <div className="flex gap-4">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-zinc-800 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-zinc-800 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-zinc-800 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-zinc-800 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
            >
              <Youtube className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-zinc-800 text-center text-gray-500">
          <p className="tracking-wide" style={{ fontSize: "0.9rem" }}>
            © 2026 HTOO EL LYNN. All rights reserved. | Designed for the rock revolution.
          </p>
        </div>
      </div>
    </footer>
  );
}
