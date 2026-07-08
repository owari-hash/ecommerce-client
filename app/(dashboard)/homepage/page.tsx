"use client";

import { useState, useEffect, useRef } from "react";
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

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const token = localStorage.getItem("ikna_admin_token");
  const res = await fetch(`${getApiBase()}/api/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error("Upload failed");
  const body = await res.json();
  const path: string = body.data?.url ?? body.url ?? body.path ?? "";
  const m = path.match(/\/upload\/(.+)$/);
  return m ? `${getApiBase()}/upload/${m[1]}` : path;
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

// ─── Convert category  tile / slide ─────────────────────────────────────────

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
  const px = size * 4; // tailwind unit  px approximation for img sizes
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
    <div className="border border-[#D32F2F]/30 rounded-xl bg-slate-50 p-3 space-y-2">
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Хайх..."
        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
        autoFocus
      />
      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
        {filtered.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onPick(cat)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white border border-slate-100 hover:border-[#D32F2F] hover:bg-red-50 text-left transition-colors group w-full"
          >
            <CatThumb image={cat.image} name={cat.name} size={7} />
            <span className="text-sm font-semibold text-slate-700 group-hover:text-[#D32F2F] leading-tight truncate flex-1">
              {cat.name}
            </span>
            <svg className="w-4 h-4 text-slate-300 group-hover:text-[#D32F2F] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-4">Ангилал олдсонгүй</p>
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
  // active: which slot is open for category picking
  const [active, setActive] = useState<number | null>(null);
  const [customImgOpen, setCustomImgOpen] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, idx: number) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setCustomImage(idx, url);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function pick(idx: number, cat: Cat) {
    const slide = catToSlide(cat);
    // preserve any existing custom image override
    const existing = slides[idx];
    if (existing._customImage) slide.image = existing._customImage as string;
    const next = slides.map((s, i) => (i === idx ? slide : s));
    onChange(next);
    setActive(null);
  }

  function setCustomImage(idx: number, url: string) {
    const next = slides.map((s, i) =>
      i === idx ? { ...s, image: url, _customImage: url } : s
    );
    onChange(next);
  }

  function clearCustomImage(idx: number) {
    // revert to category default image
    const slide = slides[idx];
    const cat = cats.find((c) => `/${c.slug}` === slide.href);
    const defaultImg = cat ? resolveCatImage(cat.image).url : "";
    const next = slides.map((s, i) =>
      i === idx ? { ...s, image: defaultImg, _customImage: undefined } : s
    );
    onChange(next);
  }

  function clear(idx: number) {
    const next = slides.map((s, i) => (i === idx ? { ...EMPTY_SLIDE } : s));
    onChange(next);
    if (active === idx) setActive(null);
    if (customImgOpen === idx) setCustomImgOpen(null);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
      <div>
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#D32F2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {label}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
      </div>

      {/* ── Horizontal slide row ────────────────────────────────────── */}
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {slides.map((slide, idx) => {
          const filled = !!slide.title;
          const isOpen = active === idx;
          const isImgOpen = customImgOpen === idx;

          return (
            <div
              key={idx}
              className={`flex-shrink-0 w-48 rounded-xl border-2 overflow-hidden transition-all ${
                isOpen
                  ? "border-[#D32F2F] shadow-md"
                  : filled
                  ? "border-emerald-200"
                  : "border-slate-200"
              }`}
            >
              {/* Thumbnail */}
              <div className="relative h-28 bg-slate-50 flex items-center justify-center overflow-hidden">
                {filled && slide.image ? (
                  <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                ) : filled ? (
                  <span className="text-4xl">{slide.emoji}</span>
                ) : (
                  <span className="text-slate-300 text-3xl">🖼️</span>
                )}
                {/* Slot number badge */}
                <span
                  className={`absolute top-2 left-2 w-6 h-6 rounded-md flex items-center justify-center text-xs font-black ${
                    isOpen ? "bg-[#D32F2F] text-white" : "bg-white/90 text-slate-600 border border-slate-200"
                  }`}
                >
                  {idx + 1}
                </span>
                {/* Clear button */}
                {filled && (
                  <button
                    type="button"
                    onClick={() => clear(idx)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 border border-slate-200 text-slate-400 hover:text-red-500 flex items-center justify-center text-sm transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Info + actions */}
              <div className="p-2.5 space-y-2">
                {filled ? (
                  <>
                    <p className="text-xs font-semibold text-slate-800 truncate">{slide.title}</p>
                    <p className="text-[10px] text-slate-400 truncate">{slide.href}</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-400">{isOpen ? "Сонгоно уу..." : "Хоосон"}</p>
                )}

                <div className="flex gap-1.5">
                  {/* Change/Select category */}
                  <button
                    type="button"
                    onClick={() => { setActive(isOpen ? null : idx); setCustomImgOpen(null); }}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                      isOpen
                        ? "bg-[#D32F2F] text-white border-[#D32F2F]"
                        : "bg-white text-slate-600 border-slate-200 hover:border-[#D32F2F] hover:text-[#D32F2F]"
                    }`}
                  >
                    {filled ? "Солих" : "Сонгох"}
                  </button>

                  {/* Custom image — only when filled */}
                  {filled && (
                    <button
                      type="button"
                      onClick={() => { setCustomImgOpen(isImgOpen ? null : idx); setActive(null); }}
                      title="Өөр зураг ашиглах"
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                        isImgOpen
                          ? "bg-slate-700 text-white border-slate-700"
                          : slide._customImage
                          ? "bg-emerald-50 text-emerald-600 border-emerald-300"
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Category picker panel (shown below row when a slot is active) ── */}
      {active !== null && (
        <div className="border border-slate-100 rounded-xl p-3 bg-slate-50 space-y-1.5">
          <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-[#D32F2F] text-white text-[10px] font-black flex items-center justify-center">{active + 1}</span>
            дугаарт ангилал сонгох
          </p>
          <CategoryPicker cats={cats} onPick={(cat) => pick(active, cat)} />
        </div>
      )}

      {/* ── Custom image panel ──────────────────────────────────────────── */}
      {customImgOpen !== null && slides[customImgOpen]?.title && (
        <div className="border border-slate-100 rounded-xl p-3 bg-slate-50 space-y-2">
          <p className="text-xs font-semibold text-slate-600">
            Тусгай зураг (заавал биш) — ангилалын үндсэн зургийн оронд
          </p>
          <div className="flex gap-2 items-center">
            {slides[customImgOpen].image && (
              <img
                src={slides[customImgOpen].image}
                alt="preview"
                className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
              />
            )}
            <input
              type="text"
              value={slides[customImgOpen]._customImage ?? slides[customImgOpen].image ?? ""}
              onChange={(e) => setCustomImage(customImgOpen, e.target.value)}
              placeholder="https://... зургийн URL"
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
            />
            <label
              className={`cursor-pointer shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                uploading
                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
            >
              {uploading ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
              {uploading ? "..." : "Оруулах"}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => handleFileUpload(e, customImgOpen)}
              />
            </label>
          </div>
          {slides[customImgOpen]._customImage && (
            <button
              type="button"
              onClick={() => clearCustomImage(customImgOpen)}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              ↩ Ангилалын үндсэн зураг руу буцах
            </button>
          )}
        </div>
      )}
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
  bentoType,
  bentoBannerImage,
  bentoBannerLink,
  onChange,
  onTitleChange,
  onBentoTypeChange,
  onBentoBannerImageChange,
  onBentoBannerLinkChange,
  cats,
}: {
  tiles: BentoTile[];
  bentoTitle: string;
  bentoType: string;
  bentoBannerImage: string;
  bentoBannerLink: string;
  onChange: (next: BentoTile[]) => void;
  onTitleChange: (v: string) => void;
  onBentoTypeChange: (v: string) => void;
  onBentoBannerImageChange: (v: string) => void;
  onBentoBannerLinkChange: (v: string) => void;
  cats: Cat[];
}) {
  const [active, setActive] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleTileImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (active === null) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      const next = tiles.map((t, i) => (i === active ? { ...t, image: url } : t));
      onChange(next);
    } catch { /* ignore */ } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onBentoBannerImageChange(url);
    } catch { /* ignore */ } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function clearTileImage() {
    if (active === null) return;
    const next = tiles.map((t, i) => (i === active ? { ...t, image: "" } : t));
    onChange(next);
  }

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
          Хэсэгчилсэн ангилал ба Баннер
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Энэ хэсэгт Bento ангилал эсвэл сурталчилгааны баннер харуулахыг тохируулна.
        </p>
      </div>

      {/* Control Type */}
      <div className="space-y-2 border-b border-slate-100 pb-4">
        <label className="block text-sm font-semibold text-slate-700">Хэсгийн төрөл</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="radio" name="bentoType" value="category" checked={bentoType === "category"} onChange={() => onBentoTypeChange("category")} className="text-[#D32F2F] focus:ring-[#D32F2F]/30" />
            <span>Ангиллын Bento сүлжээ</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="radio" name="bentoType" value="banner" checked={bentoType === "banner"} onChange={() => onBentoTypeChange("banner")} className="text-[#D32F2F] focus:ring-[#D32F2F]/30" />
            <span>Сурталчилгааны баннер</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="radio" name="bentoType" value="hide" checked={bentoType === "hide"} onChange={() => onBentoTypeChange("hide")} className="text-[#D32F2F] focus:ring-[#D32F2F]/30" />
            <span>Нуух</span>
          </label>
        </div>
      </div>

      {bentoType === "category" && (
        <>
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

          {/* Category picker + image upload — shows below grid when a cell is active */}
          {active !== null && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <span className="w-6 h-6 rounded-md bg-[#D32F2F] text-white text-xs font-black flex items-center justify-center">{active + 1}</span>
                  байрлалд ангилал сонгох
                </span>
              </p>
              <CategoryPicker cats={cats} onPick={pick} />
              {/* Image upload for already-filled tile */}
              {tiles[active]?.label && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  {tiles[active].image ? (
                    <img src={tiles[active].image} alt={tiles[active].label} className="w-12 h-12 rounded-lg object-cover border border-slate-200 flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-2xl">📁</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{tiles[active].label}</p>
                    <p className="text-[10px] text-slate-400">{tiles[active].image ? "Зураг оруулсан" : "Зураг байхгүй"}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      uploading ? "bg-slate-100 text-slate-400" : "bg-[#D32F2F] hover:bg-red-700 text-white"
                    }`}>
                      {uploading ? (
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      )}
                      {uploading ? "..." : "Зураг оруулах"}
                      <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={handleTileImageUpload} />
                    </label>
                    {tiles[active].image && (
                      <button type="button" onClick={clearTileImage} className="px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 transition-colors">
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {bentoType === "banner" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Баннер зураг</label>
            <div className="flex gap-3 items-center">
              {bentoBannerImage ? (
                <img src={bentoBannerImage} alt="Bento Banner" className="w-24 h-12 rounded-lg object-cover border border-slate-200 shrink-0" />
              ) : (
                <div className="w-24 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-xs text-slate-400">Зураггүй</div>
              )}
              <input
                type="text"
                value={bentoBannerImage}
                onChange={(e) => onBentoBannerImageChange(e.target.value)}
                placeholder="https://... зургийн URL"
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
              />
              <label className={`cursor-pointer shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                uploading ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}>
                {uploading ? "..." : "Оруулах"}
                <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={handleBannerUpload} />
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Холбоос URL</label>
            <input
              type="text"
              value={bentoBannerLink}
              onChange={(e) => onBentoBannerLinkChange(e.target.value)}
              placeholder="Жишээ: /category-slug эсвэл /product-slug"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
            />
          </div>
        </div>
      )}

      {bentoType === "hide" && (
        <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-sm">
          🫥 Энэ хэсэг одоогоор нүүр хуудаснаас нуугдсан байна.
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = "big" | "small" | "bento";

export default function HomepagePage() {
  const { settings, updateSettings, categories, reorderCategories } = useTenantAdmin();

  const [bigSlides,   setBigSlides]   = useState<BannerSlide[]>(() => ensure3(settings.bannerSlidesBig));
  const [smallSlides, setSmallSlides] = useState<BannerSlide[]>(() => ensure3(settings.bannerSlidesSmall));
  const [tiles,       setTiles]       = useState<BentoTile[]>(  () => ensure9(settings.bentoTiles));
  const [bentoTitle,  setBentoTitle]  = useState(settings.bentoTitle ?? "");
  const [bentoType,   setBentoType]   = useState(settings.bentoType ?? "category");
  const [bentoBannerImage, setBentoBannerImage] = useState(settings.bentoBannerImage ?? "");
  const [bentoBannerLink,  setBentoBannerLink]  = useState(settings.bentoBannerLink ?? "");
  const [layout,      setLayout]      = useState<string[]>([]);
  
  const [activeTab,   setActiveTab]   = useState<Tab>("big");
  const [saved,       setSaved]       = useState(false);
  const [saving,      setSaving]      = useState(false);

  const rootCategories = [...categories.filter(
    (c) => c.parentId === null || !categories.some((parent) => parent.id === c.parentId)
  )];

  useEffect(() => {
    setBigSlides(ensure3(settings.bannerSlidesBig));
    setSmallSlides(ensure3(settings.bannerSlidesSmall));
    setTiles(ensure9(settings.bentoTiles));
    setBentoTitle(settings.bentoTitle ?? "");
    setBentoType(settings.bentoType ?? "category");
    setBentoBannerImage(settings.bentoBannerImage ?? "");
    setBentoBannerLink(settings.bentoBannerLink ?? "");

    // Process layout state
    const rootCatIds = rootCategories.map(c => c.id);
    let initialLayout = settings.homepageLayout && settings.homepageLayout.length > 0
      ? [...settings.homepageLayout]
      : [];

    if (initialLayout.length === 0) {
      initialLayout = [...rootCatIds, "bento", "banner"];
    } else {
      // Clean up layout: only keep active categories that still exist + bento + banner
      initialLayout = initialLayout.filter(id => {
        if (id === "bento" || id === "banner") return true;
        return categories.some(c => c.id === id);
      });
      // Append any missing active root categories
      rootCatIds.forEach(id => {
        if (!initialLayout.includes(id)) {
          initialLayout.push(id);
        }
      });
      // Ensure bento and banner are present
      if (!initialLayout.includes("bento")) initialLayout.push("bento");
      if (!initialLayout.includes("banner")) initialLayout.push("banner");
    }
    setLayout(initialLayout);
  }, [
    settings.bannerSlidesBig,
    settings.bannerSlidesSmall,
    settings.bentoTiles,
    settings.bentoTitle,
    settings.bentoType,
    settings.bentoBannerImage,
    settings.bentoBannerLink,
    settings.homepageLayout,
    categories,
  ]);

  async function handleSave() {
    setSaving(true);
    await updateSettings({
      bannerSlidesBig: bigSlides,
      bannerSlidesSmall: smallSlides,
      bentoTiles: tiles,
      bentoTitle,
      bentoType,
      bentoBannerImage,
      bentoBannerLink,
      homepageLayout: layout,
    });

    // Reorder categories sorting in DB
    const catOrder = layout
      .filter(id => id !== "bento" && id !== "banner")
      .map((id, index) => ({ id, sortOrder: index }));
    await reorderCategories(catOrder);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function moveLayoutItem(index: number, dir: -1 | 1) {
    const next = [...layout];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setLayout(next);
    setSaved(false);
  }

  function hideLayoutItem(id: string) {
    const next = layout.filter(x => x !== id);
    setLayout(next);
    setSaved(false);
  }

  function showLayoutItem(id: string) {
    if (!layout.includes(id)) {
      setLayout([...layout, id]);
      setSaved(false);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "big",   label: "Том баннер" },
    { id: "small", label: "Жижиг баннер" },
    { id: "bento", label: "Хэсэгчилсэн ангилал ба Баннер" },
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
          bentoType={bentoType}
          bentoBannerImage={bentoBannerImage}
          bentoBannerLink={bentoBannerLink}
          onChange={(next) => { setTiles(next); setSaved(false); }}
          onTitleChange={(v) => { setBentoTitle(v); setSaved(false); }}
          onBentoTypeChange={(v) => { setBentoType(v); setSaved(false); }}
          onBentoBannerImageChange={(v) => { setBentoBannerImage(v); setSaved(false); }}
          onBentoBannerLinkChange={(v) => { setBentoBannerLink(v); setSaved(false); }}
          cats={activeCats}
        />
      )}

      {/* Homepage layout sequence manager */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#D32F2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <h3 className="font-bold text-slate-800 text-sm">Нүүр хуудасны хэсгүүдийн дараалал</h3>
          <span className="text-xs text-slate-400 ml-1">— харагдах дараалал (дэлгүүрийн нүүр хуудас)</span>
        </div>

        {/* Visible items */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Харагдаж буй хэсгүүд ({layout.length})</p>
          <div className="space-y-1.5">
            {layout.map((id, idx) => {
              let name = "";
              let imgUrl = "";
              let isCategory = false;
              let isBento = false;
              let isBanner = false;

              if (id === "bento") {
                name = settings.bentoTitle || "Хэсэгчилсэн ангилал (Bento сүлжээ)";
                isBento = true;
              } else if (id === "banner") {
                name = "Сурталчилгааны баннер (Promo Banner)";
                imgUrl = settings.bentoBannerImage;
                isBanner = true;
              } else {
                const cat = categories.find(c => c.id === id);
                name = cat?.name ?? "Ангилал";
                const { url } = resolveCatImage(cat?.image);
                imgUrl = url;
                isCategory = true;
              }

              return (
                <div key={id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5 group hover:bg-slate-100 transition-colors">
                  <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-200 text-slate-500 text-xs font-bold shrink-0">{idx + 1}</span>
                  {isCategory && (imgUrl ? (
                    <img src={imgUrl} alt={name} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                  ) : (
                    <span className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-sm shrink-0">📁</span>
                  ))}
                  {isBento && <span className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-sm shrink-0">🧩</span>}
                  {isBanner && (imgUrl ? (
                    <img src={imgUrl} alt={name} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                  ) : (
                    <span className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-sm shrink-0">🖼️</span>
                  ))}
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-slate-700 text-sm truncate block">{name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {isCategory && "Бүтээгдэхүүнүүдийн мөр"}
                      {isBento && "9 цонхот Bento сүлжээ"}
                      {isBanner && "Сурталчилгааны баннер хэсэг"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Hide Button */}
                    <button
                      type="button"
                      onClick={() => hideLayoutItem(id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-red-500 hover:text-red-500 transition-colors"
                      title="Нуух"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    {/* Move Up */}
                    <button
                      type="button"
                      onClick={() => moveLayoutItem(idx, -1)}
                      disabled={idx === 0}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-[#D32F2F] hover:text-[#D32F2F] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Дээш"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    {/* Move Down */}
                    <button
                      type="button"
                      onClick={() => moveLayoutItem(idx, 1)}
                      disabled={idx === layout.length - 1}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-[#D32F2F] hover:text-[#D32F2F] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Доош"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hidden items */}
        {(() => {
          const allPossibleIds = [...rootCategories.map(c => c.id), "bento", "banner"];
          const hiddenIds = allPossibleIds.filter(id => !layout.includes(id));
          if (hiddenIds.length === 0) return null;

          return (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Нуугдсан хэсгүүд ({hiddenIds.length})</p>
              <div className="space-y-1.5">
                {hiddenIds.map((id) => {
                  let name = "";
                  let isCategory = false;
                  let isBento = false;
                  let isBanner = false;

                  if (id === "bento") {
                    name = settings.bentoTitle || "Хэсэгчилсэн ангилал (Bento сүлжээ)";
                    isBento = true;
                  } else if (id === "banner") {
                    name = "Сурталчилгааны баннер (Promo Banner)";
                    isBanner = true;
                  } else {
                    const cat = categories.find(c => c.id === id);
                    name = cat?.name ?? "Ангилал";
                    isCategory = true;
                  }

                  return (
                    <div key={id} className="flex items-center gap-3 bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2 opacity-60 hover:opacity-100 transition-opacity">
                      {isCategory && <span className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-sm shrink-0 text-slate-400">📁</span>}
                      {isBento && <span className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-sm shrink-0 text-slate-400">🧩</span>}
                      {isBanner && <span className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-sm shrink-0 text-slate-400">🖼️</span>}
                      <span className="font-semibold text-slate-500 text-sm flex-1 truncate">{name}</span>
                      <button
                        type="button"
                        onClick={() => showLayoutItem(id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:border-[#D32F2F] hover:text-[#D32F2F] hover:bg-[#D32F2F]/5 transition-colors shrink-0"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Харуулах
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

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
