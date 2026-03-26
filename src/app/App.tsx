import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HeroSection from "./components/HeroSection";
import AboutSection from "./components/AboutSection";
import CdPlayerSection from "./components/CdPlayerSection";
import AlbumSelector from "./components/AlbumSelector";
import GallerySection from "./components/GallerySection";
import AlbumDetail from "./components/AlbumDetail";
import Footer from "./components/Footer";
import ShopAndSongRequestSection from "./components/ShopAndSongRequestSection";

gsap.registerPlugin(ScrollTrigger);

export interface Album {
  id: number;
  title: string;
  cover: string;
  description: string;
  songs: {
    id: number;
    title: string;
    duration: string;
  }[];
  streamingLinks: {
    spotify: string;
    appleMusic?: string;
    youtubeMusic: string;
  };
}

const angelTaYawCover = new URL("../../resource images/Angel Ta Yaw.jpg", import.meta.url).href;
const minLayNarLalCover = new URL("../../resource images/Min Lay Nar Lal.jpg", import.meta.url).href;
const naungTaCover = new URL("../../resource images/Naung Ta.jpg", import.meta.url).href;
const ngaThaMeeSarKyatNayTalCover = new URL(
  "../../resource images/Nga Tha Mee Sar Kyat Nay Tal.jpg",
  import.meta.url
).href;

const albums: Album[] = [
  {
    id: 1,
    title: "Angel Ta Yaw",
    cover: angelTaYawCover,
    description: "An explosive collection of hard-hitting rock anthems",
    songs: [
      { id: 1, title: "Min Lay Nar Lal", duration: "4:16" },
      { id: 2, title: "A Pyan", duration: "3:37" },
      { id: 3, title: "Angel Tayaw", duration: "3:36" },
      { id: 4, title: "Kho Nar Yar Mae", duration: "3:33" },
      { id: 5, title: "Thoe", duration: "3:15" },
      { id: 6, title: "Yin Kwin Hin Lin Pyin", duration: "4:01" },
      { id: 7, title: "Chut Char Nya", duration: "4:07" },
      { id: 8, title: "Thit Pin Ao Yae Kabar", duration: "3:48" },
      { id: 9, title: "Ar Thit Rock", duration: "2:57" },
      { id: 10, title: "Lay Lwint A Twle", duration: "4:04" },
      { id: 11, title: "La Mike Nya Guitare", duration: "2:58" },
      { id: 12, title: "Min Lay Nar Lal (unplugged)", duration: "5:37" },
    ],
    streamingLinks: {
      spotify: "https://open.spotify.com/album/4dNMVnXhjefACdkacQOjcO",
      youtubeMusic: "https://music.youtube.com/playlist?list=OLAK5uy_mdEQtH45Lpy5evj2ne8Eh8L0fO7zWSjms",
    },
  },
  {
    id: 2,
    title: "Min Lay Nar Lal",
    cover: minLayNarLalCover,
    description: "Raw power meets melodic intensity",
    songs: [
      { id: 1, title: "Min Lay Nar Lal", duration: "4:17" },
    ],
    streamingLinks: {
      spotify: "https://open.spotify.com/album/6gH9w65O9FozhCkV4DbV2z",
      youtubeMusic: "https://music.youtube.com/watch?v=BS5D41zzs9Y",
    },
  },
  {
    id: 3,
    title: "Naung Ta",
    cover: naungTaCover,
    description: "High-voltage rock that electrifies the soul",
    songs: [
      { id: 1, title: "A lwan Myoh", duration: "4:29" },
      { id: 2, title: "Law Ba Thar Kaung", duration: "3:51" },
      { id: 3, title: "A Kaung Myin War Da", duration: "5:11" },
      { id: 4, title: "Naung Ta", duration: "3:37" },
      { id: 5, title: "CELE", duration: "4:11" },
      { id: 6, title: "Kyal Sin Pyo Tae Kaung Kin", duration: "6:09" },
      { id: 7, title: "Di Bawa Di Mya", duration: "4:29" },
      { id: 8, title: "Oo Yin Mhue", duration: "3:50" },
      { id: 9, title: "Nay Ma Win Myoh", duration: "3:44" },
      { id: 10, title: "Nha Yoke Htal Moe", duration: "4:31" },
    ],
    streamingLinks: {
      spotify: "https://open.spotify.com/album/7yAEDPe4uwnspx2fWYMxMO",
      youtubeMusic: "https://music.youtube.com/playlist?list=OLAK5uy_n8l9agWWy888dfAVXWDE4IL1ykgBQq4OI",
    },
  },
  {
    id: 4,
    title: "Nga Tha Mee Sar Kyat Nay Tal",
    cover: ngaThaMeeSarKyatNayTalCover,
    description: "Anthems for the rebellious and free-spirited",
    songs: [
      { id: 1, title: "Nga Tha Mee Sar Kyat Nay Tal", duration: "3:05" },
    ],
    streamingLinks: {
      spotify: "https://open.spotify.com/album/4fgLOPWUYyx5JwOkbq7UrX",
      youtubeMusic: "https://music.youtube.com/playlist?list=OLAK5uy_mIyE6fkpoAwqegJKV9dMw27PuLnsV4gjI",
    },
  },
];

export default function App() {
  const getAlbumIdFromPath = (path: string) => {
    const match = path.match(/^\/ALBUM\/(\d+)$/i);
    return match ? Number(match[1]) : null;
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [pathname, setPathname] = useState<string>(() => window.location.pathname.toUpperCase());

  useEffect(() => {
    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray(".section");
      sections.forEach((section: any) => {
        gsap.from(section, {
          opacity: 0,
          y: 100,
          duration: 1,
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            end: "top 50%",
            scrub: 1,
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const syncPathname = () => setPathname(window.location.pathname.toUpperCase());
    window.addEventListener("popstate", syncPathname);
    syncPathname();
    return () => window.removeEventListener("popstate", syncPathname);
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;
    const scrollToRequest = sessionStorage.getItem("scrollToRequestSection") === "1";
    const scrollToMerch = sessionStorage.getItem("scrollToMerchSection") === "1";
    const scrollToDiscography = sessionStorage.getItem("scrollToDiscographySection") === "1";
    if (!scrollToRequest && !scrollToMerch && !scrollToDiscography) return;

    const restoreScrollTarget = () => {
      const targetId = scrollToDiscography
        ? "discography-home-anchor"
        : scrollToRequest
        ? "request-song-home-anchor"
        : "merchandise-home-anchor";
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "auto", block: "start" });
      }
      sessionStorage.removeItem("scrollToRequestSection");
      sessionStorage.removeItem("scrollToMerchSection");
      sessionStorage.removeItem("scrollToDiscographySection");
    };

    // Wait for main-page sections to mount before scrolling.
    window.requestAnimationFrame(restoreScrollTarget);
  }, [pathname]);

  const selectedAlbum = (() => {
    const albumId = getAlbumIdFromPath(pathname);
    if (albumId === null) return null;
    return albums.find((album) => album.id === albumId) ?? null;
  })();

  const isSpecialShopRoute =
    pathname === "/REQUEST_SONG" || pathname === "/MERCHANDISE" || pathname.startsWith("/PRODUCT_ITEM/");

  const handleOpenAlbum = (album: Album) => {
    window.location.assign(`/ALBUM/${album.id}`);
  };

  const handleCloseAlbum = () => {
    sessionStorage.setItem("scrollToDiscographySection", "1");
    window.location.assign("/");
  };

  return (
    <div ref={containerRef} className="relative min-h-screen bg-black text-white overflow-x-hidden">

      {selectedAlbum ? (
        <AlbumDetail album={selectedAlbum} onClose={handleCloseAlbum} />
      ) : (
        <>
          {isSpecialShopRoute ? (
            <ShopAndSongRequestSection />
          ) : (
            <>
              <HeroSection />
              <CdPlayerSection />
              <AboutSection />
              <AlbumSelector albums={albums} onSelectAlbum={handleOpenAlbum} />
              <ShopAndSongRequestSection />
              <GallerySection />
              <Footer />
            </>
          )}
        </>
      )}
    </div>
  );
}
