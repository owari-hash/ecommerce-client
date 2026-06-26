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

      <div className="space-y-3">
        {slides.map((slide, idx) => {
          const filled = !!slide.title;
          const isOpen = active === idx;
          const isImgOpen = customImgOpen === idx;

          return (
            <div key={idx} className="rounded-xl border border-slate-200 overflow-hidden">
              {/* ── Slide row ─────────────────────────────────── */}
              <div className={`flex items-center gap-3 p-3 ${
                isOpen ? "bg-red-50/40" : "bg-white"
              }`}>
                {/* Slot number */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-black ${
                  isOpen ? "bg-[#D32F2F] text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {idx + 1}
                </div>

                {/* Thumbnail */}
                {filled ? (
                  slide.image ? (
                    <img src={slide.image} alt={slide.title}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-100 flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-xl flex-shrink-0">
                      {slide.emoji}
                    </div>
                  )
                ) : null}

                {/* Name / placeholder */}
                <div className="flex-1 min-w-0">
                  {filled ? (
                    <>
                      <p className="text-sm font-semibold text-slate-800 truncate">{slide.title}</p>
                      <p className="text-xs text-slate-400 truncate">{slide.href}</p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">{isOpen ? "Ангилал сонгоно уу..." : "Ангилал сонгох"}</p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Change category */}
                  <button type="button" onClick={() => { setActive(isOpen ? null : idx); setCustomImgOpen(null); }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      isOpen
                        ? "bg-[#D32F2F] text-white border-[#D32F2F]"
                        : "bg-white text-slate-600 border-slate-200 hover:border-[#D32F2F] hover:text-[#D32F2F]"
                    }`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
                    {filled ? "Солих" : "Сонгох"}
                  </button>

                  {/* Custom image override — only when filled */}
                  {filled && (
                    <button type="button"
                      onClick={() => { setCustomImgOpen(isImgOpen ? null : idx); setActive(null); }}
                      title="Өөр зураг ашиглах (optional)"
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        isImgOpen
                          ? "bg-slate-700 text-white border-slate-700"
                          : slide._customImage
                          ? "bg-emerald-50 text-emerald-600 border-emerald-300"
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                      }`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01"/></svg>
                      Зураг
                    </button>
                  )}

                  {/* Clear */}
                  {filled && (
                    <button type="button" onClick={() => clear(idx)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 flex items-center justify-center text-sm transition-colors">
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* ── Category picker panel ──────────────────────── */}
              {isOpen && (
                <div className="border-t border-slate-100 p-3 bg-slate-50">
                  <CategoryPicker cats={cats} onPick={(cat) => pick(idx, cat)} />
                </div>
              )}

              {/* ── Custom image override panel ────────────────── */}
              {isImgOpen && filled && (
                <div className="border-t border-slate-100 p-3 bg-slate-50 space-y-2">
                  <p className="text-xs font-semibold text-slate-600">
                    Тусгай зураг (заавал биш) — ангилалын үндсэн зургийн оронд
                  </p>
                  <div className="flex gap-2 items-center">
                    {slide.image && (
                      <img src={slide.image} alt="preview"
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0" />
                    )}
                    <input
                      type="text"
                      value={slide._customImage ?? slide.image ?? ""}
                      onChange={(e) => setCustomImage(idx, e.target.value)}
                      placeholder="https://... зургийн URL"
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
                    />
                    <label className={`cursor-pointer shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      uploading
                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                    }`}>
                      {uploading ? (
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
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
                        onChange={(e) => handleFileUpload(e, idx)}
                      />
                    </label>
                  </div>
                  {slide._customImage && (
                    <button type="button" onClick={() => clearCustomImage(idx)}
                      className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                      ↩ Ангилалын үндсэн зураг руу буцах
                    </button>
                  )}
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
