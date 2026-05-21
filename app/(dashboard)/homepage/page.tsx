"use client";

import { useState, useEffect } from "react";
import { useTenantAdmin } from "../../lib/TenantAdminContext";
import type { BannerSlide, BentoTile } from "../../lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Cat = {
  id: string;
  name: string;
  slug: string;
  image?: string;
  status: string;
};

// ─── Image resolution (same logic as storefront) ──────────────────────────────

function getApiBase() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined")
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  return "http://localhost:8000";
}

function resolveCatImage(image?: string): { url: string; emoji: string } {
  if (!image) return { url: "", emoji: "📁" };
  const s = image.trim().replace(/^(Оруулах|оруулах|[Oo]ruulah|[Uu]pload)/g, "").trim();
  if (!s) return { url: "", emoji: "📁" };
  if (s.length <= 4 && !s.includes("/") && !s.includes("."))
    return { url: "", emoji: s };
  if (s.startsWith("http") || s.startsWith("data:")) return { url: s, emoji: "" };
  const api = getApiBase();
  const m = s.match(/\/upload\/(.+)$/);
  if (m) return { url: `${api}/upload/${m[1]}`, emoji: "" };
  return { url: s.startsWith("/") ? `${api}${s}` : `${api}/upload/${s}`, emoji: "" };
}

// ─── Convert category → tile / slide ─────────────────────────────────────────

function catToTile(cat: Cat): BentoTile {
  const { url } = resolveCatImage(cat.image);
  return { label: cat.name, sub: cat.name, href: `/${cat.slug}`, image: url };
}

function catToSlide(cat: Cat): BannerSlide {
  const { url, emoji } = resolveCatImage(cat.image);
  return {
    title: cat.name,
    subtitle: cat.name,
    href: `/${cat.slug}`,
    image: url,
    emoji: emoji || "🛍️",
  };
}

// ─── Ensure arrays have the right length ─────────────────────────────────────

const EMPTY_SLIDE: BannerSlide = { href: "/", title: "", subtitle: "", emoji: "🛍️", image: "" };
const EMPTY_TILE: BentoTile = { label: "", sub: "", href: "/", image: "" };

function ensure3(arr: BannerSlide[]): BannerSlide[] {
  const r = [...arr];
  while (r.length < 3) r.push({ ...EMPTY_SLIDE });
  return r.slice(0, 3);
}
function ensure9(arr: BentoTile[]): BentoTile[] {
  const r = [...arr];
  while (r.length < 9) r.push({ ...EMPTY_TILE });
  return r.slice(0, 9);
}

// ─── Small thumbnail for a category ──────────────────────────────────────────

function CatThumb({ image, name, size = 8 }: { image?: string; name: string; size?: number }) {
  const { url, emoji } = resolveCatImage(image);
  const px = size * 4; // tailwind unit → px approximation for img sizes
  return (
    <div
      className={`w-${size} h-${size} rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-200`}
    >
      {url ? (
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-lg">{emoji}</span>
      )}
    </div>
  );
}

// ─── Category picker grid ─────────────────────────────────────────────────────

function CategoryPicker({
  cats,
  onPick,
}: {
  cats: Cat[];
  onPick: (cat: Cat) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = q
    ? cats.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
    : cats;

  return (
    <div className="border border-[#D32F2F]/30 rounded-xl bg-red-50/30 p-3 space-y-2">
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Хайх..."
        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
        autoFocus
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-52 overflow-y-auto">
        {filtered.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onPick(cat)}
            className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-100 hover:border-[#D32F2F] hover:bg-red-50 text-left transition-colors group"
          >
            <CatThumb image={cat.image} name={cat.name} size={7} />
            <span className="text-xs font-semibold text-slate-700 group-hover:text-[#D32F2F] leading-tight truncate">
              {cat.name}
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-xs text-slate-400 text-center py-4">Ангилал олдсонгүй</p>
        )}
      </div>
    </div>
  );
}

// ─── Banner tab ───────────────────────────────────────────────────────────────

function BannerTab({
  slides,
  onChange,
  cats,
  label,
  hint,
}: {
  slides: BannerSlide[];
  onChange: (next: BannerSlide[]) => void;
  cats: Cat[];
  label: string;
  hint: string;
}) {
  const [active, setActive] = useState<number | null>(null);

  function pick(idx: number, cat: Cat) {
    const next = slides.map((s, i) => (i === idx ? catToSlide(cat) : s));
    onChange(next);
    setActive(null);
  }

  function clear(idx: number) {
    const next = slides.map((s, i) => (i === idx ? { ...EMPTY_SLIDE } : s));
    onChange(next);
    if (active === idx) setActive(null);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
      <div>
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#D32F2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {label}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
      </div>

      <div className="space-y-2">
        {slides.map((slide, idx) => {
          const filled = !!slide.title;
          const isOpen = active === idx;

          return (
            <div key={idx}>
              <button
                type="button"
                onClick={() => setActive(isOpen ? null : idx)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  isOpen
                    ? "border-[#D32F2F] bg-red-50/40"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                {/* Slot number */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-black ${
                    isOpen ? "bg-[#D32F2F] text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {idx + 1}
                </div>

                {/* Category preview or placeholder */}
                {filled ? (
                  <>
                    {slide.image ? (
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-100 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-xl flex-shrink-0">
                        {slide.emoji}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{slide.title}</p>
                      <p className="text-xs text-slate-400 truncate">{slide.href}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); clear(idx); }}
                      className="w-6 h-6 rounded-full bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 text-sm flex items-center justify-center flex-shrink-0 transition-colors"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-slate-400 flex-1">
                    {isOpen ? "Ангилал сонгоно уу..." : "Ангилал сонгох"}
                  </p>
                )}
              </button>

              {isOpen && (
                <div className="mt-1.5">
                  <CategoryPicker cats={cats} onPick={(cat) => pick(idx, cat)} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Bento tab ────────────────────────────────────────────────────────────────

// The 9 positions in the desktop layout (matches GroceryBento.tsx order)
// Left col: 0(full), 1+2(pair), 3(full)
// Right col: 4+5(pair), 6(full), 7+8(pair)

type CellProps = {
  idx: number;
  tile: BentoTile;
  selected: boolean;
  onClick: () => void;
};

function BentoCell({ idx, tile, selected, onClick }: CellProps) {
  const filled = !!tile.label;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full flex flex-col items-center justify-center gap-1 rounded-xl border-2 transition-all py-3 px-2 ${
        selected
          ? "border-[#D32F2F] bg-red-50"
          : filled
          ? "border-emerald-300 bg-emerald-50 hover:border-emerald-400"
          : "border-slate-200 bg-slate-50 hover:border-slate-300"
      }`}
    >
      <span
        className={`text-sm font-black ${
          selected ? "text-[#D32F2F]" : filled ? "text-emerald-600" : "text-slate-400"
        }`}
      >
        {idx + 1}
      </span>
      {filled ? (
        <>
          {tile.image ? (
            <img src={tile.image} alt={tile.label} className="w-8 h-8 rounded-md object-cover" />
          ) : (
            <span className="text-xl">📁</span>
          )}
          <span className="text-[10px] font-semibold text-slate-600 leading-tight text-center line-clamp-2 max-w-full">
            {tile.label}
          </span>
        </>
      ) : (
        <span className="text-[10px] text-slate-300 font-medium">Сонгох</span>
      )}
    </button>
  );
}

function BentoTab({
  tiles,
  bentoTitle,
  onChange,
  onTitleChange,
  cats,
}: {
  tiles: BentoTile[];
  bentoTitle: string;
  onChange: (next: BentoTile[]) => void;
  onTitleChange: (v: string) => void;
  cats: Cat[];
}) {
  const [active, setActive] = useState<number | null>(null);

  function pick(cat: Cat) {
    if (active === null) return;
    const next = tiles.map((t, i) => (i === active ? catToTile(cat) : t));
    onChange(next);
    setActive(null);
  }

  function clear(idx: number) {
    const next = tiles.map((t, i) => (i === idx ? { ...EMPTY_TILE } : t));
    onChange(next);
    if (active === idx) setActive(null);
  }

  function toggle(idx: number) {
    setActive((prev) => (prev === idx ? null : idx));
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
      <div>
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#D32F2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Хэсэгчилсэн ангилал — 9 цонх
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Тоо дарж ангилал сонгоно уу. 9 цонх бүгд бөглөгдсөн үед харагдана.
        </p>
      </div>

      {/* Section title input */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Хэсгийн гарчиг</label>
        <input
          type="text"
          value={bentoTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="🛒 Хүнсний ангилал"
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
        />
        <p className="text-xs text-slate-400 mt-1">Хоосон үлдвэл "🛒 Хүнсний ангилал" харагдана.</p>
      </div>

      {/* Interactive bento layout grid */}
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">
          Байрлал сонгох (дарж ангилал оноох)
        </p>

        {/* Visual bento layout — mirrors the actual storefront layout */}
        <div className="flex gap-2">
          {/* Left column */}
          <div className="flex-1 space-y-2">
            {/* Position 0 — full */}
            <div className="relative" style={{ minHeight: 80 }}>
              <BentoCell idx={0} tile={tiles[0]} selected={active === 0} onClick={() => toggle(0)} />
              {!!tiles[0].label && (
                <button
                  type="button"
                  onClick={() => clear(0)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 text-xs flex items-center justify-center"
                >×</button>
              )}
            </div>
            {/* Positions 1 + 2 — pair */}
            <div className="flex gap-2" style={{ minHeight: 80 }}>
              {[1, 2].map((i) => (
                <div key={i} className="flex-1 relative">
                  <BentoCell idx={i} tile={tiles[i]} selected={active === i} onClick={() => toggle(i)} />
                  {!!tiles[i].label && (
                    <button type="button" onClick={() => clear(i)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 text-xs flex items-center justify-center">×</button>
                  )}
                </div>
              ))}
            </div>
            {/* Position 3 — full */}
            <div className="relative" style={{ minHeight: 80 }}>
              <BentoCell idx={3} tile={tiles[3]} selected={active === 3} onClick={() => toggle(3)} />
              {!!tiles[3].label && (
                <button type="button" onClick={() => clear(3)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 text-xs flex items-center justify-center">×</button>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="flex-1 space-y-2">
            {/* Positions 4 + 5 — pair */}
            <div className="flex gap-2" style={{ minHeight: 80 }}>
              {[4, 5].map((i) => (
                <div key={i} className="flex-1 relative">
                  <BentoCell idx={i} tile={tiles[i]} selected={active === i} onClick={() => toggle(i)} />
                  {!!tiles[i].label && (
                    <button type="button" onClick={() => clear(i)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 text-xs flex items-center justify-center">×</button>
                  )}
                </div>
              ))}
            </div>
            {/* Position 6 — full */}
            <div className="relative" style={{ minHeight: 80 }}>
              <BentoCell idx={6} tile={tiles[6]} selected={active === 6} onClick={() => toggle(6)} />
              {!!tiles[6].label && (
                <button type="button" onClick={() => clear(6)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 text-xs flex items-center justify-center">×</button>
              )}
            </div>
            {/* Positions 7 + 8 — pair */}
            <div className="flex gap-2" style={{ minHeight: 80 }}>
              {[7, 8].map((i) => (
                <div key={i} className="flex-1 relative">
                  <BentoCell idx={i} tile={tiles[i]} selected={active === i} onClick={() => toggle(i)} />
                  {!!tiles[i].label && (
                    <button type="button" onClick={() => clear(i)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 text-xs flex items-center justify-center">×</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Category picker — shows below grid when a cell is active */}
      {active !== null && (
        <div>
          <p className="text-sm font-semibold text-slate-600 mb-2">
            <span className="inline-flex items-center gap-1">
              <span className="w-6 h-6 rounded-md bg-[#D32F2F] text-white text-xs font-black flex items-center justify-center">{active + 1}</span>
              байрлалд ангилал сонгох
            </span>
          </p>
          <CategoryPicker cats={cats} onPick={pick} />
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = "big" | "small" | "bento";

export default function HomepagePage() {
  const { settings, updateSettings, categories } = useTenantAdmin();

  const [bigSlides,   setBigSlides]   = useState<BannerSlide[]>(() => ensure3(settings.bannerSlidesBig));
  const [smallSlides, setSmallSlides] = useState<BannerSlide[]>(() => ensure3(settings.bannerSlidesSmall));
  const [tiles,       setTiles]       = useState<BentoTile[]>(  () => ensure9(settings.bentoTiles));
  const [bentoTitle,  setBentoTitle]  = useState(settings.bentoTitle ?? "");
  const [activeTab,   setActiveTab]   = useState<Tab>("big");
  const [saved,       setSaved]       = useState(false);
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    setBigSlides(ensure3(settings.bannerSlidesBig));
    setSmallSlides(ensure3(settings.bannerSlidesSmall));
    setTiles(ensure9(settings.bentoTiles));
    setBentoTitle(settings.bentoTitle ?? "");
  }, [settings.bannerSlidesBig, settings.bannerSlidesSmall, settings.bentoTiles, settings.bentoTitle]);

  async function handleSave() {
    setSaving(true);
    await updateSettings({ bannerSlidesBig: bigSlides, bannerSlidesSmall: smallSlides, bentoTiles: tiles, bentoTitle });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "big",   label: "Том баннер" },
    { id: "small", label: "Жижиг баннер" },
    { id: "bento", label: "Хэсэгчилсэн ангилал" },
  ];

  // Show all active categories in picker
  const activeCats = (categories as Cat[]).filter((c) => c.status === "active");

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Нүүр хуудас</h2>
        <p className="text-sm text-slate-400 mt-0.5">Баннер слайдер болон ангилалын хэсгийг тохируулах</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "big" && (
        <BannerTab
          slides={bigSlides}
          onChange={(next) => { setBigSlides(next); setSaved(false); }}
          cats={activeCats}
          label="Том баннер — зүүн карусель (2/3 өргөн)"
          hint="3 слайд. Ангилал сонгоход зураг, нэр, холбоос автоматаар бөглөгдөнө."
        />
      )}

      {activeTab === "small" && (
        <BannerTab
          slides={smallSlides}
          onChange={(next) => { setSmallSlides(next); setSaved(false); }}
          cats={activeCats}
          label="Жижиг баннер — баруун карусель (1/3 өргөн)"
          hint="3 слайд. Ангилал сонгоход зураг, нэр, холбоос автоматаар бөглөгдөнө."
        />
      )}

      {activeTab === "bento" && (
        <BentoTab
          tiles={tiles}
          bentoTitle={bentoTitle}
          onChange={(next) => { setTiles(next); setSaved(false); }}
          onTitleChange={(v) => { setBentoTitle(v); setSaved(false); }}
          cats={activeCats}
        />
      )}

      {/* Save bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4">
        {saved ? (
          <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Амжилттай хадгалагдлаа!
          </div>
        ) : (
          <p className="text-sm text-slate-400">Өөрчлөлт хадгалагдаагүй байна</p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
        >
          {saving ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {saving ? "Хадгалж байна..." : "Хадгалах"}
        </button>
      </div>
    </div>
  );
}
