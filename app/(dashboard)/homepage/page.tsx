"use client";

import { useState, useEffect, useRef } from "react";
import { useTenantAdmin, API_BASE } from "../../lib/TenantAdminContext";
import type { BannerSlide, BentoTile } from "../../lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Image upload field ───────────────────────────────────────────────────────

function ImageField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const token = localStorage.getItem("ikna_admin_token");
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        onChange(data.url ?? data.data?.url ?? "");
      }
    } catch {}
    setUploading(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {uploading ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Хуулж байна...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Зураг оруулах
            </>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      {value && (
        <img
          src={value}
          alt="preview"
          className="h-20 w-full object-cover rounded-xl border border-slate-100"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          onLoad={(e) => { (e.target as HTMLImageElement).style.display = ""; }}
        />
      )}
    </div>
  );
}

// ─── Slide editor card ────────────────────────────────────────────────────────

function SlideCard({
  slide,
  index,
  label,
  onChange,
}: {
  slide: BannerSlide;
  index: number;
  label: string;
  onChange: (idx: number, patch: Partial<BannerSlide>) => void;
}) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 space-y-3">
      <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Зураг (URL)</label>
        <ImageField value={slide.image} onChange={(v) => onChange(index, { image: v })} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Жижиг гарчиг</label>
          <input
            type="text" value={slide.title}
            onChange={(e) => onChange(index, { title: e.target.value })}
            placeholder="Шинэ ирэлт"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Emoji</label>
          <input
            type="text" value={slide.emoji}
            onChange={(e) => onChange(index, { emoji: e.target.value })}
            placeholder="🛍️"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Том гарчиг / нэр</label>
        <input
          type="text" value={slide.subtitle}
          onChange={(e) => onChange(index, { subtitle: e.target.value })}
          placeholder="Бүтээгдэхүүний нэр"
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Холбоос</label>
        <input
          type="text" value={slide.href}
          onChange={(e) => onChange(index, { href: e.target.value })}
          placeholder="/"
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
        />
      </div>
    </div>
  );
}

// ─── Bento tile editor card ───────────────────────────────────────────────────

const TILE_LABELS = [
  "1 — Дээд зүүн (том)",
  "2 — Дунд зүүн №1",
  "3 — Дунд зүүн №2",
  "4 — Доод зүүн (том)",
  "5 — Дээд баруун №1",
  "6 — Дээд баруун №2",
  "7 — Дунд баруун (том)",
  "8 — Доод баруун №1",
  "9 — Доод баруун №2",
];

function TileCard({
  tile,
  index,
  categories,
  onChange,
}: {
  tile: BentoTile;
  index: number;
  categories: { id: string; name: string; slug: string }[];
  onChange: (idx: number, patch: Partial<BentoTile>) => void;
}) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 space-y-3">
      <p className="text-xs font-black uppercase tracking-wider text-slate-400">{TILE_LABELS[index]}</p>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Зураг (URL)</label>
        <ImageField value={tile.image} onChange={(v) => onChange(index, { image: v })} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Монгол нэр</label>
          <input
            type="text" value={tile.label}
            onChange={(e) => onChange(index, { label: e.target.value })}
            placeholder="Шинэ жимс & ногоо"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Англи нэр</label>
          <input
            type="text" value={tile.sub}
            onChange={(e) => onChange(index, { sub: e.target.value })}
            placeholder="Fresh Produce"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Холбоос</label>
        <div className="flex gap-2">
          <input
            type="text" value={tile.href}
            onChange={(e) => onChange(index, { href: e.target.value })}
            placeholder="/category-slug"
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
          />
          {categories.length > 0 && (
            <select
              value=""
              onChange={(e) => { if (e.target.value) onChange(index, { href: `/${e.target.value}` }); }}
              className="border border-slate-200 rounded-xl px-2 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
            >
              <option value="">Ангилал</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>
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

  function patchSlide(
    arr: BannerSlide[],
    setArr: React.Dispatch<React.SetStateAction<BannerSlide[]>>,
    idx: number,
    patch: Partial<BannerSlide>
  ) {
    setArr(arr.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
    setSaved(false);
  }

  function patchTile(idx: number, patch: Partial<BentoTile>) {
    setTiles((t) => t.map((tile, i) => (i === idx ? { ...tile, ...patch } : tile)));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    await updateSettings({
      bannerSlidesBig:   bigSlides,
      bannerSlidesSmall: smallSlides,
      bentoTiles:        tiles,
      bentoTitle,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "big",   label: "Том баннер (зүүн)" },
    { id: "small", label: "Жижиг баннер (баруун)" },
    { id: "bento", label: "Хэсэгчилсэн ангилал" },
  ];

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Нүүр хуудас</h2>
        <p className="text-sm text-slate-400 mt-0.5">Баннер слайдер, ангилалын хэсгийг тохируулах</p>
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

      {/* ── BIG BANNER ──────────────────────────────────────────────────────────── */}
      {activeTab === "big" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#D32F2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Том баннер — зүүн карусель (2/3 өргөн)
          </h3>
          <p className="text-xs text-slate-400">3 слайд тохируулна. Зураг, гарчиг, холбоосыг бөглөнө үү.</p>

          <div className="space-y-4">
            {bigSlides.map((slide, i) => (
              <SlideCard
                key={i}
                slide={slide}
                index={i}
                label={`Слайд ${i + 1}`}
                onChange={(idx, patch) => patchSlide(bigSlides, setBigSlides, idx, patch)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── SMALL BANNER ────────────────────────────────────────────────────────── */}
      {activeTab === "small" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#D32F2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Жижиг баннер — баруун карусель (1/3 өргөн)
          </h3>
          <p className="text-xs text-slate-400">3 слайд тохируулна.</p>

          <div className="space-y-4">
            {smallSlides.map((slide, i) => (
              <SlideCard
                key={i}
                slide={slide}
                index={i}
                label={`Слайд ${i + 1}`}
                onChange={(idx, patch) => patchSlide(smallSlides, setSmallSlides, idx, patch)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── BENTO TILES ─────────────────────────────────────────────────────────── */}
      {activeTab === "bento" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#D32F2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Хэсэгчилсэн ангилал (9 цонх)
          </h3>

          {/* Section title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Хэсгийн гарчиг</label>
            <input
              type="text" value={bentoTitle}
              onChange={(e) => { setBentoTitle(e.target.value); setSaved(false); }}
              placeholder="🛒 Хүнсний ангилал"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
            />
            <p className="text-xs text-slate-400 mt-1">Хоосон үлдвэл "🛒 Хүнсний ангилал" харагдана.</p>
          </div>

          {/* Layout diagram */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-2">Байрлалын зураглал</p>
            <div className="grid grid-cols-2 gap-1 max-w-xs text-[10px] text-slate-500 font-medium">
              <div className="space-y-1">
                <div className="bg-white border border-slate-200 rounded text-center py-1">1 (том)</div>
                <div className="flex gap-1">
                  <div className="flex-1 bg-white border border-slate-200 rounded text-center py-1">2</div>
                  <div className="flex-1 bg-white border border-slate-200 rounded text-center py-1">3</div>
                </div>
                <div className="bg-white border border-slate-200 rounded text-center py-1">4 (том)</div>
              </div>
              <div className="space-y-1">
                <div className="flex gap-1">
                  <div className="flex-1 bg-white border border-slate-200 rounded text-center py-1">5</div>
                  <div className="flex-1 bg-white border border-slate-200 rounded text-center py-1">6</div>
                </div>
                <div className="bg-white border border-slate-200 rounded text-center py-1">7 (том)</div>
                <div className="flex gap-1">
                  <div className="flex-1 bg-white border border-slate-200 rounded text-center py-1">8</div>
                  <div className="flex-1 bg-white border border-slate-200 rounded text-center py-1">9</div>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">9 цонх бүгд бөглөгдсөн үед л нүүр хуудасд харагдана.</p>
          </div>

          {/* Tile editors */}
          <div className="space-y-4">
            {tiles.map((tile, i) => (
              <TileCard
                key={i}
                tile={tile}
                index={i}
                categories={categories}
                onChange={patchTile}
              />
            ))}
          </div>
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
