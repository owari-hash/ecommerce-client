"use client";

import { useState, useEffect, useRef } from "react";
import { useTenantAdmin, API_BASE } from "../../lib/TenantAdminContext";
import type { BannerSlide, BentoTile } from "../../lib/types";

// ─── Default empty templates ───────────────────────────────────────────────────

const EMPTY_SLIDE: BannerSlide = { href: "/", title: "", subtitle: "", emoji: "🛍️", image: "" };
const EMPTY_TILE: BentoTile  = { label: "", sub: "", href: "/", image: "" };

function ensure3(arr: BannerSlide[]): BannerSlide[] {
  const result = [...arr];
  while (result.length < 3) result.push({ ...EMPTY_SLIDE });
  return result.slice(0, 3);
}
function ensure9(arr: BentoTile[]): BentoTile[] {
  const result = [...arr];
  while (result.length < 9) result.push({ ...EMPTY_TILE });
  return result.slice(0, 9);
}

// ─── Reusable image URL field with upload button ───────────────────────────────

function ImageField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const token = localStorage.getItem("ikna_admin_token");
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        onChange(data.url ?? data.data?.url ?? "");
      }
    } catch {}
    setUploading(false);
  }

  return (
    <div>
      {label && <label className="block text-xs font-semibold text-slate-400 mb-1">{label}</label>}
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#D32F2F]"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
        >
          {uploading ? "..." : "Upload"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      {value && (
        <img
          src={value}
          alt="preview"
          className="mt-2 h-16 w-full object-cover rounded-lg border border-slate-700"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}
    </div>
  );
}

// ─── Single slide editor ───────────────────────────────────────────────────────

function SlideEditor({
  slide,
  index,
  onChange,
  label,
}: {
  slide: BannerSlide;
  index: number;
  onChange: (idx: number, patch: Partial<BannerSlide>) => void;
  label: string;
}) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
      <p className="text-sm font-bold text-slate-300">{label}</p>

      <ImageField
        label="Зураг (URL)"
        value={slide.image}
        onChange={(v) => onChange(index, { image: v })}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Гарчиг (жижиг)</label>
          <input
            type="text"
            value={slide.title}
            onChange={(e) => onChange(index, { title: e.target.value })}
            placeholder="Шинэ ирэлт"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#D32F2F]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Emoji</label>
          <input
            type="text"
            value={slide.emoji}
            onChange={(e) => onChange(index, { emoji: e.target.value })}
            placeholder="🛍️"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#D32F2F]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1">Дэд гарчиг (том)</label>
        <input
          type="text"
          value={slide.subtitle}
          onChange={(e) => onChange(index, { subtitle: e.target.value })}
          placeholder="Бүтээгдэхүүний нэр"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#D32F2F]"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1">Холбоос (href)</label>
        <input
          type="text"
          value={slide.href}
          onChange={(e) => onChange(index, { href: e.target.value })}
          placeholder="/"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#D32F2F]"
        />
      </div>
    </div>
  );
}

// ─── Single bento tile editor ──────────────────────────────────────────────────

const TILE_POSITIONS = [
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

function TileEditor({
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
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
      <p className="text-sm font-bold text-slate-300">{TILE_POSITIONS[index]}</p>

      <ImageField
        label="Зураг (URL)"
        value={tile.image}
        onChange={(v) => onChange(index, { image: v })}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Монгол нэр</label>
          <input
            type="text"
            value={tile.label}
            onChange={(e) => onChange(index, { label: e.target.value })}
            placeholder="Шинэ жимс & ногоо"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#D32F2F]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Англи нэр (sub)</label>
          <input
            type="text"
            value={tile.sub}
            onChange={(e) => onChange(index, { sub: e.target.value })}
            placeholder="Fresh Produce"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#D32F2F]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1">Холбоос</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tile.href}
            onChange={(e) => onChange(index, { href: e.target.value })}
            placeholder="/category-slug"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#D32F2F]"
          />
          {categories.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) onChange(index, { href: `/${e.target.value}` });
              }}
              className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#D32F2F]"
            >
              <option value="">Ангилал сонгох</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

type Tab = "big" | "small" | "bento";

export default function HomepagePage() {
  const { settings, updateSettings, categories } = useTenantAdmin();

  const [bigSlides,   setBigSlides]   = useState<BannerSlide[]>(() => ensure3(settings.bannerSlidesBig));
  const [smallSlides, setSmallSlides] = useState<BannerSlide[]>(() => ensure3(settings.bannerSlidesSmall));
  const [tiles,       setTiles]       = useState<BentoTile[]>(  () => ensure9(settings.bentoTiles));
  const [activeTab,   setActiveTab]   = useState<Tab>("big");
  const [saved,       setSaved]       = useState(false);
  const [saving,      setSaving]      = useState(false);

  // Keep local state in sync if settings change from outside
  useEffect(() => {
    setBigSlides(ensure3(settings.bannerSlidesBig));
    setSmallSlides(ensure3(settings.bannerSlidesSmall));
    setTiles(ensure9(settings.bentoTiles));
  }, [settings.bannerSlidesBig, settings.bannerSlidesSmall, settings.bentoTiles]);

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
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "big",   label: "🖼 Том баннер (зүүн)" },
    { id: "small", label: "🖼 Жижиг баннер (баруун)" },
    { id: "bento", label: "🛒 Хүнсний ангилал" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-100">Нүүр хуудас</h1>
          <p className="text-sm text-slate-400 mt-1">
            Баннер, слайдер, хүнсний ангилал тохируулах
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          {saving ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : saved ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          )}
          {saved ? "Хадгалагдлаа!" : saving ? "Хадгалж байна..." : "Хадгалах"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 rounded-xl p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-[#D32F2F] text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Big banner slides */}
      {activeTab === "big" && (
        <div className="space-y-4">
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 mb-2">
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-300">Том баннер</strong> — нүүр хуудасны зүүн талд байх том карусель (2/3 өргөн).
              3 слайд тохируулна. Зураг, гарчиг, холбоос тохируулна уу.
            </p>
          </div>
          {bigSlides.map((slide, i) => (
            <SlideEditor
              key={i}
              slide={slide}
              index={i}
              label={`Слайд ${i + 1}`}
              onChange={(idx, patch) => patchSlide(bigSlides, setBigSlides, idx, patch)}
            />
          ))}
        </div>
      )}

      {/* Small banner slides */}
      {activeTab === "small" && (
        <div className="space-y-4">
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 mb-2">
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-300">Жижиг баннер</strong> — нүүр хуудасны баруун талд байх жижиг карусель (1/3 өргөн).
              3 слайд тохируулна.
            </p>
          </div>
          {smallSlides.map((slide, i) => (
            <SlideEditor
              key={i}
              slide={slide}
              index={i}
              label={`Слайд ${i + 1}`}
              onChange={(idx, patch) => patchSlide(smallSlides, setSmallSlides, idx, patch)}
            />
          ))}
        </div>
      )}

      {/* Bento tiles */}
      {activeTab === "bento" && (
        <div className="space-y-4">
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 mb-2">
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-300">Хүнсний ангилал (9 тайлбар)</strong> — нүүр хуудасны "🛒 Хүнсний ангилал" хэсэгт харагдах 9 цонх.
              Нийт 9 тайлбар тохируулсны дараа л нүүр хуудасд тусгаж харуулна. Байрлалыг дээр харуулсан байна.
              Ангилал сонгоход холбоос автоматаар бөглөгдөнө.
            </p>

            {/* Visual layout hint */}
            <div className="mt-3 grid grid-cols-2 gap-1 max-w-xs">
              <div className="space-y-1">
                <div className="bg-slate-600 rounded text-[10px] text-center py-1 text-slate-300">1 (том)</div>
                <div className="flex gap-1">
                  <div className="flex-1 bg-slate-600 rounded text-[10px] text-center py-1 text-slate-300">2</div>
                  <div className="flex-1 bg-slate-600 rounded text-[10px] text-center py-1 text-slate-300">3</div>
                </div>
                <div className="bg-slate-600 rounded text-[10px] text-center py-1 text-slate-300">4 (том)</div>
              </div>
              <div className="space-y-1">
                <div className="flex gap-1">
                  <div className="flex-1 bg-slate-600 rounded text-[10px] text-center py-1 text-slate-300">5</div>
                  <div className="flex-1 bg-slate-600 rounded text-[10px] text-center py-1 text-slate-300">6</div>
                </div>
                <div className="bg-slate-600 rounded text-[10px] text-center py-1 text-slate-300">7 (том)</div>
                <div className="flex gap-1">
                  <div className="flex-1 bg-slate-600 rounded text-[10px] text-center py-1 text-slate-300">8</div>
                  <div className="flex-1 bg-slate-600 rounded text-[10px] text-center py-1 text-slate-300">9</div>
                </div>
              </div>
            </div>
          </div>

          {tiles.map((tile, i) => (
            <TileEditor
              key={i}
              tile={tile}
              index={i}
              categories={categories}
              onChange={patchTile}
            />
          ))}
        </div>
      )}

      {/* Bottom save */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          {saved ? "✓ Хадгалагдлаа" : saving ? "Хадгалж байна..." : "Хадгалах"}
        </button>
      </div>
    </div>
  );
}
