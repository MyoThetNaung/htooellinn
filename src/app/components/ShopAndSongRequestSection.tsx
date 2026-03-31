import { useEffect, useMemo, useState } from "react";
import FuzzyText from "./FuzzyText";

const angelCover = new URL("../../../resource images/Angel Ta Yaw.jpg", import.meta.url).href;
const minLayNarLalCover = new URL("../../../resource images/Min Lay Nar Lal.jpg", import.meta.url).href;
const naungTaCover = new URL("../../../resource images/Naung Ta.jpg", import.meta.url).href;
const ngaThaMeeSarKyatNayTalCover = new URL(
  "../../../resource images/Nga Tha Mee Sar Kyat Nay Tal.jpg",
  import.meta.url
).href;

export default function ShopAndSongRequestSection() {
  const goToWithRefresh = (path: string) => {
    window.location.assign(path);
  };

  const getProductIdFromPath = () => {
    const match = window.location.pathname.match(/^\/PRODUCT_ITEM\/([^/]+)$/i);
    return match?.[1]?.toLowerCase() ?? null;
  };

  const getPageFromPath = () => {
    const path = window.location.pathname.toUpperCase();
    if (path === "/REQUEST_SONG") return ("request" as const);
    if (path === "/MERCHANDISE") return ("merch" as const);
    if (path.startsWith("/PRODUCT_ITEM/")) return ("product" as const);
    return ("main" as const);
  };
  const [page, setPage] = useState<"main" | "merch" | "request" | "product">(() => getPageFromPath());
  const [selectedProductId, setSelectedProductId] = useState<string | null>(() => getProductIdFromPath());

  useEffect(() => {
    const onPopState = () => {
      setPage(getPageFromPath());
      setSelectedProductId(getProductIdFromPath());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const merch = useMemo(
    () => [
      { id: "m1", name: "HTOO T-Shirt", price: "$25", img: minLayNarLalCover },
      { id: "m2", name: "Classic CD", price: "$10", img: angelCover },
      { id: "m3", name: "Poster Print", price: "$15", img: naungTaCover },
      { id: "m4", name: "Sticker Pack", price: "$6", img: ngaThaMeeSarKyatNayTalCover },
    ],
    [angelCover, minLayNarLalCover, naungTaCover, ngaThaMeeSarKyatNayTalCover]
  );

  const selectedProduct = useMemo(
    () => merch.find((item) => item.id.toLowerCase() === (selectedProductId ?? "")) ?? merch[0],
    [merch, selectedProductId]
  );

  const goToProduct = (id: string) => {
    window.history.pushState({}, "", `/PRODUCT_ITEM/${id}`);
    setSelectedProductId(id.toLowerCase());
    setPage("product");
    window.dispatchEvent(new Event("popstate"));
  };

  return (
    <>
      {page === "main" ? (
        <section
          id="merchandise-home-anchor"
          className="section flex flex-col items-center py-20 px-4"
        >
          <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
            <div className="mb-10 flex w-full justify-center px-1 sm:px-2">
              <h2
                className="flex w-full flex-col items-center justify-center text-center uppercase tracking-widest text-red-500"
                style={{ fontSize: "clamp(1.7rem, 3.5vw, 2.4rem)", fontWeight: 900 }}
              >
                <FuzzyText
                  className="mx-auto block max-w-full"
                  baseIntensity={0.06}
                  hoverIntensity={0.7}
                  enableHover={false}
                  clickEffect={false}
                  glitchMode
                  glitchInterval={1020}
                  glitchDuration={230}
                  fuzzRange={14}
                  direction="both"
                  fontSize="clamp(1.7rem, 3.5vw, 2.4rem)"
                  fontWeight={900}
                  letterSpacing={1}
                  color="#ffffff"
                >
                  Merchandise
                </FuzzyText>
              </h2>
            </div>

            <div className="grid w-full max-w-2xl grid-cols-2 gap-4 sm:max-w-none">
              {merch.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    goToWithRefresh("/MERCHANDISE");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      goToWithRefresh("/MERCHANDISE");
                    }
                  }}
                  className="rounded-xl overflow-hidden border border-red-600/20 bg-zinc-900/40 shadow-lg cursor-pointer"
                >
                  <img src={item.img} alt={item.name} className="w-full aspect-square object-cover" />
                  <div className="p-3">
                    <div className="text-white font-bold text-sm truncate">{item.name}</div>
                    <div className="text-red-400 text-xs mt-1">{item.price}</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        goToProduct(item.id);
                      }}
                      className="mt-3 w-full py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs uppercase tracking-wide"
                      type="button"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <button
                onClick={() => {
                  goToWithRefresh("/MERCHANDISE");
                }}
                className="w-full sm:w-auto px-12 py-4 bg-zinc-800 hover:bg-zinc-700 border border-red-600/20 rounded-xl text-xs uppercase tracking-widest text-white"
              >
                VIEW MORE
              </button>
            </div>

            <div
              id="request-song-home-anchor"
              className="mt-12 w-full max-w-3xl mx-auto flex flex-col items-center rounded-xl border border-red-600/20 bg-zinc-900/40 p-6"
            >
              <div className="mb-3 flex w-full justify-center">
                <h3
                  className="flex w-full max-w-3xl flex-col items-center justify-center text-center text-red-500 uppercase tracking-widest"
                  style={{ fontWeight: 800, fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)" }}
                >
                  <FuzzyText
                    className="mx-auto block max-w-full"
                    baseIntensity={0.06}
                    hoverIntensity={0.7}
                    enableHover={false}
                    clickEffect={false}
                    glitchMode
                    glitchInterval={980}
                    glitchDuration={220}
                    fuzzRange={12}
                    direction="both"
                    fontSize="clamp(1.1rem, 2.5vw, 1.5rem)"
                    fontWeight={900}
                    letterSpacing={1}
                    color="#ef4444"
                  >
                    REQUEST SONG FOR USE
                  </FuzzyText>
                </h3>
              </div>
              <p className="mb-4 text-center text-gray-300 text-[1rem] sm:text-[1.12rem] leading-relaxed">
                To use songs for covers, performances, or commercial content, please send a request
                with full project details. All uses require artist approval.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    goToWithRefresh("/REQUEST_SONG");
                  }}
                  className="w-full sm:w-auto px-12 py-4 bg-red-600 hover:bg-red-700 rounded-xl text-xs uppercase tracking-widest text-white"
                >
                  REQUEST SONG FOR USE
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : page === "merch" ? (
        <section className="section py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 flex w-full flex-col gap-4">
              <div className="flex w-full justify-end">
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem("skipHomeIntroOnce", "1");
                    sessionStorage.setItem("scrollToMerchSection", "1");
                    window.history.pushState({}, "", "/");
                    setPage("main");
                    window.dispatchEvent(new Event("popstate"));
                  }}
                  className="shrink-0 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-red-600/20 rounded-lg text-xs uppercase tracking-widest"
                >
                  Back
                </button>
              </div>
              <h2
                className="flex w-full flex-col items-center justify-center text-center uppercase tracking-widest text-red-500 px-2"
                style={{ fontSize: "clamp(1.7rem, 3.5vw, 2.4rem)", fontWeight: 900 }}
              >
                <FuzzyText
                  className="mx-auto block max-w-full"
                  baseIntensity={0.06}
                  hoverIntensity={0.7}
                  enableHover={false}
                  clickEffect={false}
                  glitchMode
                  glitchInterval={1020}
                  glitchDuration={230}
                  fuzzRange={14}
                  direction="both"
                  fontSize="clamp(1.7rem, 3.5vw, 2.4rem)"
                  fontWeight={900}
                  letterSpacing={1}
                  color="#ffffff"
                >
                  Merchandise
                </FuzzyText>
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {merch.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl overflow-hidden border border-red-600/20 bg-zinc-900/40 shadow-lg"
                >
                  <img src={item.img} alt={item.name} className="w-full aspect-square object-cover" />
                  <div className="p-3">
                    <div className="text-white font-bold text-sm truncate">{item.name}</div>
                    <div className="text-red-400 text-xs mt-1">{item.price}</div>
                    <button
                      onClick={() => goToProduct(item.id)}
                      className="mt-3 w-full py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs uppercase tracking-wide"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>
      ) : page === "product" ? (
        <section className="section py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex w-full flex-col gap-4">
              <div className="flex w-full justify-end">
                <button
                  type="button"
                  onClick={() => {
                    window.history.pushState({}, "", "/MERCHANDISE");
                    setPage("merch");
                    window.dispatchEvent(new Event("popstate"));
                  }}
                  className="shrink-0 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-red-600/20 rounded-lg text-xs uppercase tracking-widest"
                >
                  Back
                </button>
              </div>
              <h2
                className="w-full text-center uppercase tracking-widest text-red-500 px-2"
                style={{ fontSize: "clamp(1.3rem, 3.5vw, 2.2rem)", fontWeight: 900 }}
              >
                PRODUCT ITEM
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 rounded-xl border border-red-600/20 bg-zinc-900/40 p-5">
              <img
                src={selectedProduct.img}
                alt={selectedProduct.name}
                className="w-full aspect-square object-cover rounded-lg"
              />
              <div className="flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-white uppercase tracking-wide">{selectedProduct.name}</h3>
                <p className="text-red-400 text-lg mt-2">{selectedProduct.price}</p>
                <p className="text-gray-300 text-sm mt-4">
                  Official merchandise item. Click Buy Now to proceed with purchase request.
                </p>
                <button className="mt-6 w-full md:w-auto px-8 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-sm uppercase tracking-widest">
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="section py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 flex w-full flex-col gap-4">
              <div className="flex w-full justify-end">
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem("skipHomeIntroOnce", "1");
                    sessionStorage.setItem("scrollToRequestSection", "1");
                    window.history.pushState({}, "", "/");
                    setPage("main");
                    window.dispatchEvent(new Event("popstate"));
                  }}
                  className="shrink-0 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-red-600/20 rounded-lg text-xs uppercase tracking-widest"
                >
                  Back
                </button>
              </div>
              <h2
                className="flex w-full flex-col items-center justify-center text-center uppercase tracking-widest text-red-500 px-2"
                style={{ fontSize: "clamp(1.2rem, 3.5vw, 2.2rem)", fontWeight: 900 }}
              >
                <FuzzyText
                  className="mx-auto block max-w-full"
                  baseIntensity={0.06}
                  hoverIntensity={0.7}
                  enableHover={false}
                  clickEffect={false}
                  glitchMode
                  glitchInterval={980}
                  glitchDuration={220}
                  fuzzRange={12}
                  direction="both"
                  fontSize="clamp(1.2rem, 3.5vw, 2.2rem)"
                  fontWeight={900}
                  letterSpacing={1}
                  color="#ef4444"
                >
                  REQUEST SONG FOR USE
                </FuzzyText>
              </h2>
            </div>

            <div className="max-w-xl mx-auto">
              <div className="mt-4 rounded-xl border border-red-600/20 bg-zinc-900/40 p-5">
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const data = new FormData(form);
                    const songName = String(data.get("songName") || "");
                    const email = String(data.get("email") || "");
                    const phone = String(data.get("phone") || "");
                    const useType = String(data.get("useType") || "");
                    const details = String(data.get("details") || "");
                    const requesterName = String(data.get("requesterName") || "");

                    alert(
                      `Thanks! Request received.\nSong: ${songName || "(empty)"}\nName: ${
                        requesterName || "(empty)"
                      }\nEmail: ${
                        email || "(empty)"
                      }\nPhone: ${phone || "(empty)"}\nUse: ${useType || "(empty)"}\nDetails: ${
                        details || "(empty)"
                      }`
                    );
                    form.reset();
                  }}
                >
                  <input
                    name="requesterName"
                    placeholder="Name of who request"
                    required
                    className="w-full rounded-lg bg-black/30 border border-zinc-700 px-3 py-2 text-sm text-white placeholder:text-zinc-500"
                  />

                  <input
                    name="songName"
                    placeholder="Song name (type it)"
                    required
                    className="w-full rounded-lg bg-black/30 border border-zinc-700 px-3 py-2 text-sm text-white placeholder:text-zinc-500"
                  />

                  <input
                    name="email"
                    type="email"
                    placeholder="Email address"
                    required
                    className="w-full rounded-lg bg-black/30 border border-zinc-700 px-3 py-2 text-sm text-white placeholder:text-zinc-500"
                  />

                  <input
                    name="phone"
                    type="tel"
                    placeholder="Phone number"
                    required
                    className="w-full rounded-lg bg-black/30 border border-zinc-700 px-3 py-2 text-sm text-white placeholder:text-zinc-500"
                  />

                  <select
                    name="useType"
                    required
                    className="w-full rounded-lg bg-black/30 border border-zinc-700 px-3 py-2 text-sm text-white"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      How to use (choose)
                    </option>
                    <option value="sing_cover">Sing cover</option>
                    <option value="video_use">Use in video</option>
                    <option value="live_performance">Live performance</option>
                    <option value="other">Other</option>
                  </select>

                  <textarea
                    name="details"
                    placeholder="Optional details (ex: platform, date, credit)"
                    rows={3}
                    className="w-full rounded-lg bg-black/30 border border-zinc-700 px-3 py-2 text-sm text-white placeholder:text-zinc-500"
                  />

                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-red-600/20 rounded-lg text-sm uppercase tracking-widest"
                  >
                    Send Request
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}


