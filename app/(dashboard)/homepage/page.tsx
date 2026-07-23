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

// ─── Detail-view gallery images (per banner slide, up to 5) ───────────────────

function ImageGalleryEditor({
  images,
  onChange,
}: {
  images: string[];
  onChange: (next: string[]) => void;
}) {
  const [uploading, setUploading] = useState<number | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, idx: number) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(idx);
    try {
      const url = await uploadImage(file);
      const next = [...images];
      next[idx] = url;
      onChange(next.filter(Boolean).slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  }

  function remove(idx: number) {
    onChange(images.filter((_, i) => i !== idx));
  }

  const slots = [...images];
  while (slots.length < 5) slots.push("");

  return (
    <div className="border border-slate-100 rounded-xl p-3 bg-slate-50 space-y-2">
      <p className="text-xs font-semibold text-slate-600">Дэлгэрэнгүй харагдацын зурагнууд (дээд тал нь 5)</p>
      <p className="text-[11px] text-slate-400">
        Хэрэглэгч энэ слайд дээр дарахад цонх нээгдэж, эдгээр зурагнууд нэг нэгээр том харагдана.
      </p>
      <div className="flex gap-2 flex-wrap">
        {slots.slice(0, 5).map((img, idx) => (
          <div
            key={idx}
            className="relative w-16 h-16 rounded-lg border border-slate-200 bg-white overflow-hidden flex items-center justify-center shrink-0"
          >
            {img ? (
              <>
                <img src={img} alt="" className="w-full h-full object-cover" />
                <span className="absolute bottom-0.5 left-0.5 w-4 h-4 rounded-full bg-black/60 text-white text-[9px] font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-white/90 border border-slate-200 text-slate-400 hover:text-red-500 flex items-center justify-center text-[10px] leading-none"
                >
                  ×
                </button>
              </>
            ) : (
              <label className="cursor-pointer w-full h-full flex items-center justify-center text-slate-300 hover:text-slate-400 transition-colors">
                {uploading === idx ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <span className="text-xl leading-none">+</span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploading !== null}
                  onChange={(e) => handleUpload(e, idx)}
                />
              </label>
            )}
          </div>
        ))}
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
  showGallery,
}: {
  slides: BannerSlide[];
  onChange: (next: BannerSlide[]) => void;
  cats: Cat[];
  label: string;
  hint: string;
  showGallery?: boolean;
}) {
  // active: which slot is open for category picking
  const [active, setActive] = useState<number | null>(null);
  const [customImgOpen, setCustomImgOpen] = useState<number | null>(null);
  const [galleryOpen, setGalleryOpen] = useState<number | null>(null);
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
    if (galleryOpen === idx) setGalleryOpen(null);
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
          const isGalleryOpen = galleryOpen === idx;

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
                      onClick={() => { setCustomImgOpen(isImgOpen ? null : idx); setActive(null); setGalleryOpen(null); }}
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

                  {/* Detail-view gallery — only when filled and enabled for this tab */}
                  {filled && showGallery && (
                    <button
                      type="button"
                      onClick={() => { setGalleryOpen(isGalleryOpen ? null : idx); setActive(null); setCustomImgOpen(null); }}
                      title="Дэлгэрэнгүй харагдацын зурагнууд"
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                        isGalleryOpen
                          ? "bg-slate-700 text-white border-slate-700"
                          : (slide.images?.length ?? 0) > 0
                          ? "bg-emerald-50 text-emerald-600 border-emerald-300"
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

      {/* ── Detail-view gallery — per slide, up to 5 images ─────────── */}
      {galleryOpen !== null && slides[galleryOpen]?.title && (
        <ImageGalleryEditor
          images={slides[galleryOpen].images ?? []}
          onChange={(next) => onChange(slides.map((s, i) => (i === galleryOpen ? { ...s, images: next } : s)))}
        />
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

function BentoSectionEditor({
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

      <div>
        <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">
          Байрлал сонгох (дарж ангилал оноох)
        </p>

        <div className="flex gap-2">
          <div className="flex-1 space-y-2">
            <div className="relative" style={{ minHeight: 80 }}>
              <BentoCell idx={0} tile={tiles[0]} selected={active === 0} onClick={() => toggle(0)} />
              {!!tiles[0].label && (
                <button type="button" onClick={() => clear(0)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 text-xs flex items-center justify-center">×</button>
              )}
            </div>
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
            <div className="relative" style={{ minHeight: 80 }}>
              <BentoCell idx={3} tile={tiles[3]} selected={active === 3} onClick={() => toggle(3)} />
              {!!tiles[3].label && (
                <button type="button" onClick={() => clear(3)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 text-xs flex items-center justify-center">×</button>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-2">
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
            <div className="relative" style={{ minHeight: 80 }}>
              <BentoCell idx={6} tile={tiles[6]} selected={active === 6} onClick={() => toggle(6)} />
              {!!tiles[6].label && (
                <button type="button" onClick={() => clear(6)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 text-xs flex items-center justify-center">×</button>
              )}
            </div>
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

      {active !== null && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1">
              <span className="w-6 h-6 rounded-md bg-[#D32F2F] text-white text-xs font-black flex items-center justify-center">{active + 1}</span>
              байрлалд ангилал сонгох
            </span>
          </p>
          <CategoryPicker cats={cats} onPick={pick} />
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

function BannerSectionEditor({
  image,
  link,
  onImageChange,
  onLinkChange,
}: {
  image: string;
  link: string;
  onImageChange: (v: string) => void;
  onLinkChange: (v: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onImageChange(url);
    } catch { /* ignore */ } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Баннер зураг</label>
        <div className="flex gap-3 items-center">
          {image ? (
            <img src={image} alt="Promo Banner" className="w-24 h-12 rounded-lg object-cover border border-slate-200 shrink-0" />
          ) : (
            <div className="w-24 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-xs text-slate-400">Зураггүй</div>
          )}
          <input
            type="text"
            value={image}
            onChange={(e) => onImageChange(e.target.value)}
            placeholder="https://... зургийн URL"
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
          />
          <label className={`cursor-pointer shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
            uploading ? "bg-slate-100 text-slate-400" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
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
          value={link}
          onChange={(e) => onLinkChange(e.target.value)}
          placeholder="Жишээ: /category-slug эсвэл /product-slug"
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
        />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = "big" | "bento";

export default function HomepagePage() {
  const { settings, updateSettings, categories, reorderCategories } = useTenantAdmin();

  const [bigSlides,   setBigSlides]   = useState<BannerSlide[]>(() => ensure3(settings.bannerSlidesBig));
  const [tiles,       setTiles]       = useState<BentoTile[]>(  () => ensure9(settings.bentoTiles));
  const [bentoTitle,  setBentoTitle]  = useState(settings.bentoTitle ?? "");
  const [bentoType,   setBentoType]   = useState(settings.bentoType ?? "category");
  const [bentoBannerImage, setBentoBannerImage] = useState(settings.bentoBannerImage ?? "");
  const [bentoBannerLink,  setBentoBannerLink]  = useState(settings.bentoBannerLink ?? "");
  const [layout,      setLayout]      = useState<any[]>([]);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  
  const [activeTab,   setActiveTab]   = useState<Tab>("big");
  const [saved,       setSaved]       = useState(false);
  const [saving,      setSaving]      = useState(false);

  const rootCategories = [...categories.filter(
    (c) => c.parentId === null || !categories.some((parent) => parent.id === c.parentId)
  )];

  useEffect(() => {
    setBigSlides(ensure3(settings.bannerSlidesBig));
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
      initialLayout = [
        ...rootCatIds.map(id => ({ id, type: "category", categoryId: id })),
        { id: "bento-default", type: "bento", bentoTitle: settings.bentoTitle ?? "", bentoTiles: ensure9(settings.bentoTiles) },
        { id: "banner-default", type: "banner", bentoBannerImage: settings.bentoBannerImage ?? "", bentoBannerLink: settings.bentoBannerLink ?? "" }
      ];
    }

    // Convert legacy formats
    let processedLayout = initialLayout.map(item => {
      if (typeof item === "string") {
        if (item === "bento") {
          return {
            id: "bento-default",
            type: "bento",
            bentoTitle: settings.bentoTitle ?? "",
            bentoTiles: ensure9(settings.bentoTiles)
          };
        } else if (item === "banner") {
          return {
            id: "banner-default",
            type: "banner",
            bentoBannerImage: settings.bentoBannerImage ?? "",
            bentoBannerLink: settings.bentoBannerLink ?? ""
          };
        } else {
          return {
            id: item,
            type: "category",
            categoryId: item
          };
        }
      }
      return item;
    });

    // Append missing categories
    rootCatIds.forEach(id => {
      const exists = processedLayout.some(x => x.type === "category" && (x.categoryId === id || x.id === id));
      if (!exists) {
        processedLayout.push({ id, type: "category", categoryId: id });
      }
    });

    // Filter out deleted categories
    processedLayout = processedLayout.filter(item => {
      if (item.type === "bento" || item.type === "banner") return true;
      const catId = item.categoryId || item.id;
      return categories.some(c => c.id === catId);
    });

    setLayout(processedLayout);
  }, [
    settings.bannerSlidesBig,
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
      bentoTiles: tiles,
      bentoTitle,
      bentoType,
      bentoBannerImage,
      bentoBannerLink,
      homepageLayout: layout,
    });

    // Reorder categories sorting in DB
    const catOrder = layout
      .filter(x => x.type === "category")
      .map((x, index) => ({ id: x.categoryId || x.id, sortOrder: index }));
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
    const next = layout.filter(x => x.id !== id);
    setLayout(next);
    if (editingSectionId === id) setEditingSectionId(null);
    setSaved(false);
  }

  function showLayoutItem(item: any) {
    if (!layout.some(x => x.id === item.id)) {
      setLayout([...layout, item]);
      setSaved(false);
    }
  }

  function addBentoSection() {
    const newId = `bento-${Date.now()}`;
    const newSection = {
      id: newId,
      type: "bento",
      bentoTitle: "Хэсэгчилсэн ангилал (Bento)",
      bentoTiles: ensure9([]),
    };
    setLayout([...layout, newSection]);
    setEditingSectionId(newId);
    setSaved(false);
  }

  function addBannerSection() {
    const newId = `banner-${Date.now()}`;
    const newSection = {
      id: newId,
      type: "banner",
      bentoBannerImage: "",
      bentoBannerLink: "",
    };
    setLayout([...layout, newSection]);
    setEditingSectionId(newId);
    setSaved(false);
  }

  function updateSectionData(id: string, patch: any) {
    setLayout(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, ...patch };
      }
      return s;
    }));
    setSaved(false);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "big",   label: "Том баннер" },
    { id: "bento", label: "Нүүр хуудасны бүтэц" },
  ];

  const activeCats = (categories as Cat[]).filter((c) => c.status === "active");

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Нүүр хуудас</h2>
        <p className="text-sm text-slate-400 mt-0.5">Баннер карусель болон нүүр хуудасны хэсгүүдийн дараалал, агуулга тохируулах</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id !== "bento") setEditingSectionId(null);
            }}
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
          label="Том баннер"
          hint="3 слайд. Ангилал сонгоход зураг, нэр, холбоос автоматаар бөглөгдөнө. Слайд бүрт дээд тал нь 5 зураг нэмэхэд, хэрэглэгч дарахад тухайн зурагнууд дараалан том харагдах цонх нээгдэнэ."
          showGallery
        />
      )}

      {activeTab === "bento" && (
        <div className="space-y-5">
          {/* Add Section Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={addBentoSection}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95"
            >
              🧩 + Bento сүлжээ нэмэх
            </button>
            <button
              type="button"
              onClick={addBannerSection}
              className="flex-1 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95"
            >
              🖼️ + Баннер нэмэх
            </button>
          </div>

          {/* Sequence Manager */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <svg className="w-4 h-4 text-[#D32F2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <h3 className="font-bold text-slate-800 text-sm">Хэсгүүдийн дараалал</h3>
              <span className="text-xs text-slate-400 ml-1">— нүүр хуудас дээр харагдах дараалал</span>
            </div>

            {/* Visible Items */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Харагдаж байгаа хэсгүүд ({layout.length})</p>
              <div className="space-y-2">
                {layout.map((item, idx) => {
                  let name = "";
                  let imgUrl = "";
                  let isCategory = item.type === "category";
                  let isBento = item.type === "bento";
                  let isBanner = item.type === "banner";

                  if (isBento) {
                    name = item.bentoTitle || "Хэсэгчилсэн ангилал (Bento сүлжээ)";
                  } else if (isBanner) {
                    name = "Сурталчилгааны баннер";
                    imgUrl = item.bentoBannerImage;
                  } else {
                    const catId = item.categoryId || item.id;
                    const cat = categories.find(c => c.id === catId);
                    name = cat?.name ?? "Ангилал";
                    const { url } = resolveCatImage(cat?.image);
                    imgUrl = url;
                  }

                  const isEditing = editingSectionId === item.id;

                  return (
                    <div key={item.id} className={`flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 group hover:bg-slate-100 transition-all border ${isEditing ? "border-[#D32F2F] ring-2 ring-[#D32F2F]/10 bg-white hover:bg-white" : "border-transparent"}`}>
                      <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-200 text-slate-500 text-xs font-bold shrink-0">{idx + 1}</span>
                      
                      {isCategory && (imgUrl ? (
                        <img src={imgUrl} alt={name} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-150" />
                      ) : (
                        <span className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-sm shrink-0">📁</span>
                      ))}
                      {isBento && <span className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-150 flex items-center justify-center text-sm shrink-0">🧩</span>}
                      {isBanner && (imgUrl ? (
                        <img src={imgUrl} alt={name} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-150" />
                      ) : (
                        <span className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-150 flex items-center justify-center text-sm shrink-0">🖼️</span>
                      ))}

                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-slate-700 text-sm truncate block leading-tight">{name}</span>
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                          {isCategory && "Ангиллын бүтээгдэхүүний мөр"}
                          {isBento && "Bento 9-цонхот сүлжээ"}
                          {isBanner && "Сурталчилгааны баннер"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Edit Button for Bento/Banner */}
                        {(isBento || isBanner) && (
                          <button
                            type="button"
                            onClick={() => setEditingSectionId(isEditing ? null : item.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${isEditing ? "bg-[#D32F2F] text-white border-transparent" : "bg-white text-slate-600 hover:border-[#D32F2F] hover:text-[#D32F2F]"}`}
                          >
                            {isEditing ? "Хаах" : "Засах"}
                          </button>
                        )}
                        {/* Hide button */}
                        <button
                          type="button"
                          onClick={() => hideLayoutItem(item.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:border-red-500 hover:text-red-500 transition-colors"
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
                          className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-[#D32F2F] hover:text-[#D32F2F] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                          className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-[#D32F2F] hover:text-[#D32F2F] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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

            {/* Hidden List */}
            {(() => {
              const hiddenCats = rootCategories.filter(cat => !layout.some(x => x.type === "category" && (x.categoryId === cat.id || x.id === cat.id)));
              
              if (hiddenCats.length === 0) return null;

              return (
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Нуугдсан хэсгүүд ({hiddenCats.length})</p>
                  <div className="space-y-1.5">
                    {hiddenCats.map((cat) => (
                      <div key={cat.id} className="flex items-center gap-3 bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2 opacity-60 hover:opacity-100 transition-opacity">
                        <span className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-sm shrink-0 text-slate-400">📁</span>
                        <span className="font-bold text-slate-500 text-sm flex-1 truncate">{cat.name}</span>
                        <button
                          type="button"
                          onClick={() => showLayoutItem({ id: cat.id, type: "category", categoryId: cat.id })}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:border-[#D32F2F] hover:text-[#D32F2F] hover:bg-[#D32F2F]/5 transition-colors shrink-0"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Харуулах
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Section Editors */}
          {editingSectionId && (() => {
            const section = layout.find(s => s.id === editingSectionId);
            if (!section) return null;

            if (section.type === "bento") {
              return (
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">🧩 Bento сүлжээ засварлагч</span>
                    <button type="button" onClick={() => setEditingSectionId(null)} className="text-xs text-slate-500 hover:text-slate-700 font-medium">Хаах ✕</button>
                  </div>
                  <BentoSectionEditor
                    tiles={section.bentoTiles || ensure9([])}
                    bentoTitle={section.bentoTitle || ""}
                    onChange={(nextTiles) => updateSectionData(editingSectionId, { bentoTiles: nextTiles })}
                    onTitleChange={(nextTitle) => updateSectionData(editingSectionId, { bentoTitle: nextTitle })}
                    cats={activeCats}
                  />
                </div>
              );
            }

            if (section.type === "banner") {
              return (
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">🖼️ Баннер засварлагч</span>
                    <button type="button" onClick={() => setEditingSectionId(null)} className="text-xs text-slate-500 hover:text-slate-700 font-medium">Хаах ✕</button>
                  </div>
                  <BannerSectionEditor
                    image={section.bentoBannerImage || ""}
                    link={section.bentoBannerLink || ""}
                    onImageChange={(nextImg) => updateSectionData(editingSectionId, { bentoBannerImage: nextImg })}
                    onLinkChange={(nextLink) => updateSectionData(editingSectionId, { bentoBannerLink: nextLink })}
                  />
                </div>
              );
            }

            return null;
          })()}
        </div>
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
