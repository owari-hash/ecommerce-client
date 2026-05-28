"use client";

import { useState, useEffect, useRef } from "react";
import { useTenantAdmin, API_BASE } from "../../lib/TenantAdminContext";

const COLORS = [
  "#D32F2F", "#B71C1C", "#E53935",
  "#1565C0", "#0D47A1", "#1976D2",
  "#2E7D32", "#1B5E20", "#388E3C",
  "#6A1B9A", "#4A148C", "#7B1FA2",
  "#E65100", "#BF360C", "#F57C00",
  "#00695C", "#004D40", "#00796B",
];

const FONTS = ["Inter", "Roboto", "Outfit", "Poppins", "Nunito"];

export default function SettingsPage() {
  const { settings, updateSettings } = useTenantAdmin();
  const [draft, setDraft] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  useEffect(() => { setDraft({ ...settings }); }, [settings]);

  function setDraftField<K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
    setSaved(false);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateSettings(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setDraftField("logo", data.url);
      } else {
        console.error("Upload failed");
      }
    } catch (err) {
      console.error("Upload error", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Дэлгүүрийн тохиргоо</h2>
        <p className="text-sm text-slate-400 mt-0.5">Дэлгүүрийн нэр, өнгө, мэдээлэл тохируулах</p>
      </div>

      {/* Live preview */}
      <div
        className="rounded-2xl p-5 text-white flex items-center gap-4 transition-colors duration-300"
        style={{ backgroundColor: draft.primaryColor }}
      >
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl font-bold">
          {draft.storeName?.[0]?.toUpperCase() ?? "S"}
        </div>
        <div>
          <p className="font-bold text-lg">{draft.storeName || "Дэлгүүрийн нэр"}</p>
          <p className="text-white/70 text-sm">{draft.bannerSubtitle || "Тайлбар"}</p>
        </div>
        <div className="ml-auto text-right hidden sm:block">
          <p className="text-white/60 text-xs">Үндсэн өнгө</p>
          <p className="font-mono font-bold">{draft.primaryColor}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Store identity */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#D32F2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Дэлгүүрийн мэдээлэл
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Дэлгүүрийн нэр</label>
              <input
                type="text" value={draft.storeName}
                onChange={(e) => setDraftField("storeName", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Лого</label>
              <div className="flex items-center gap-3">
                {draft.logo && (
                  <img src={draft.logo} alt="Logo" className="w-10 h-10 object-contain bg-slate-50 border border-slate-200 rounded" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                />
              </div>
              {uploading && <p className="text-xs text-slate-400 mt-1">Хуулж байна...</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Бидний тухай текст</label>
            <textarea
              rows={4}
              value={draft.description}
              onChange={(e) => setDraftField("description", e.target.value)}
              placeholder="Дэлгүүрийн тухай товч тайлбар. Мөр тутам шинэ догол мөр болно."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 resize-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Баннерийн гарчиг</label>
              <input
                type="text" value={draft.bannerTitle}
                onChange={(e) => setDraftField("bannerTitle", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Баннерийн дэд гарчиг</label>
              <input
                type="text" value={draft.bannerSubtitle}
                onChange={(e) => setDraftField("bannerSubtitle", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#D32F2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Холбоо барих
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">И-мэйл</label>
              <input
                type="email" value={draft.contactEmail}
                onChange={(e) => setDraftField("contactEmail", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Утасны дугаар</label>
              <input
                type="text" value={draft.contactPhone}
                onChange={(e) => setDraftField("contactPhone", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Хаяг</label>
            <input
              type="text" value={draft.address}
              onChange={(e) => setDraftField("address", e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
            />
          </div>
        </div>

        {/* Theme */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#D32F2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Дизайн
          </h3>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Үндсэн өнгө</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COLORS.map((c) => (
                <button
                  key={c} type="button" onClick={() => setDraftField("primaryColor", c)}
                  className={`w-8 h-8 rounded-xl border-2 transition-transform hover:scale-110 ${draft.primaryColor === c ? "border-slate-800 scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color" value={draft.primaryColor}
                onChange={(e) => setDraftField("primaryColor", e.target.value)}
                className="w-9 h-9 rounded-xl cursor-pointer border border-slate-200"
              />
              <input
                type="text" value={draft.primaryColor}
                onChange={(e) => setDraftField("primaryColor", e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-mono w-28 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Фонт</label>
            <div className="flex flex-wrap gap-2">
              {FONTS.map((f) => (
                <button
                  key={f} type="button" onClick={() => setDraftField("font", f)}
                  className={`px-4 py-2 rounded-xl text-sm border-2 font-medium transition-all ${draft.font === f ? "border-[#D32F2F] text-[#D32F2F] bg-red-50" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                  style={{ fontFamily: f }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Promo block */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#D32F2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Промо блок (мэгамэню)
            </h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-slate-500">Харагдах</span>
              <div className="relative flex-shrink-0">
                <input
                  type="checkbox" className="sr-only peer"
                  checked={draft.promoVisible ?? true}
                  onChange={(e) => setDraftField("promoVisible", e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-checked:bg-[#D32F2F] rounded-full transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </div>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Шошго (жиш: Хязгаартай)</label>
              <input
                type="text" value={draft.promoLabel ?? ""}
                onChange={(e) => setDraftField("promoLabel", e.target.value)}
                placeholder="Хязгаартай"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Хямдрал (жиш: 30% OFF)</label>
              <input
                type="text" value={draft.promoDiscount ?? ""}
                onChange={(e) => setDraftField("promoDiscount", e.target.value)}
                placeholder="30% OFF"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Дэд текст</label>
              <input
                type="text" value={draft.promoSubtitle ?? ""}
                onChange={(e) => setDraftField("promoSubtitle", e.target.value)}
                placeholder="Бүх электрон бараа"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Холбоос (жиш: /electronics)</label>
              <input
                type="text" value={draft.promoHref ?? ""}
                onChange={(e) => setDraftField("promoHref", e.target.value)}
                placeholder="/electronics"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
              />
            </div>
          </div>
          {/* Live preview */}
          {(draft.promoVisible ?? true) && (
            <div className="rounded-xl bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white p-4 relative overflow-hidden max-w-xs">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <p className="text-[10px] font-black uppercase opacity-80 tracking-wider">{draft.promoLabel || "Хязгаартай"}</p>
                <p className="text-xl font-black mt-1">{draft.promoDiscount || "30% OFF"}</p>
                {draft.promoSubtitle && <p className="text-sm opacity-90">{draft.promoSubtitle}</p>}
                <span className="inline-block mt-3 bg-white text-red-600 px-3 py-1.5 rounded-lg text-xs font-black">Харах →</span>
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#D32F2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Функцууд
          </h3>
          {(
            [
              ["reviews", "Үнэлгээ & Сэтгэгдэл", "Хэрэглэгчдэд бараанд үнэлгээ бичих боломж"],
              ["chat", "Live Chat", "Онлайн чат дэмжлэг"],
              ["loyaltyProgram", "Урамшуулалын программ", "Оноо цуглуулах систем"],
            ] as const
          ).map(([key, label, desc]) => {
            const checked = draft.features?.[key] ?? false;
            return (
              <label key={key} className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox" className="sr-only peer"
                    checked={checked}
                    onChange={(e) =>
                      setDraftField("features", { ...draft.features, [key]: e.target.checked })
                    }
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-checked:bg-[#D32F2F] rounded-full transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                </div>
              </label>
            );
          })}
        </div>

        {/* Locations */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#D32F2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Салбар дэлгүүр
            </h3>
            <button
              type="button"
              onClick={() =>
                setDraftField("locations", [
                  ...draft.locations,
                  { name: "", district: "", address: "", phone: "", hours: "" },
                ])
              }
              className="flex items-center gap-1.5 text-sm font-semibold text-[#D32F2F] hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Салбар нэмэх
            </button>
          </div>

          {draft.locations.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">Салбар дэлгүүр бүртгэгдээгүй байна</p>
          )}

          <div className="space-y-4">
            {draft.locations.map((loc, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">Салбар {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftField("locations", draft.locations.filter((_, i) => i !== idx))
                    }
                    className="text-xs text-red-500 hover:text-red-700 font-semibold"
                  >
                    Устгах
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    [
                      ["name",     "Салбарын нэр",  "Их Наяд Плаза — Их Наяд"],
                      ["district", "Дүүрэг",        "Хан-Уул дүүрэг"],
                      ["phone",    "Утас",           "7709 1155"],
                      ["hours",    "Цагийн хуваарь", "Өдөр бүр 10:00 - 20:00"],
                    ] as const
                  ).map(([field, label, placeholder]) => (
                    <div key={field}>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
                      <input
                        type="text"
                        value={(loc as any)[field]}
                        placeholder={placeholder}
                        onChange={(e) => {
                          const next = draft.locations.map((l, i) =>
                            i === idx ? { ...l, [field]: e.target.value } : l
                          );
                          setDraftField("locations", next);
                        }}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Хаяг</label>
                  <textarea
                    rows={2}
                    value={loc.address}
                    placeholder="Улаанбаатар хот, Хан-Уул дүүрэг..."
                    onChange={(e) => {
                      const next = draft.locations.map((l, i) =>
                        i === idx ? { ...l, address: e.target.value } : l
                      );
                      setDraftField("locations", next);
                    }}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 resize-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* POS Integration */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#D32F2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            POS Системийн Холболт (Заавал биш)
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">POS Холболтын хаяг (API URL эсвэл MongoDB URI)</label>
              <input
                type="text"
                value={draft.posDbUri ?? ""}
                onChange={(e) => setDraftField("posDbUri", e.target.value)}
                placeholder="Жишээ: http://103.236.194.50:5000 эсвэл mongodb://..."
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
              />
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Салбар дээр ажиллаж буй POS-ын арын албаны API хаяг (жишээ нь: <code className="font-semibold text-slate-600">http://103.236.194.50:5000</code>) эсвэл MongoDB холболтын мэдээлэл.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Салбарын ID (salbariinId)</label>
              <input
                type="text"
                value={draft.posBranchId ?? ""}
                onChange={(e) => setDraftField("posBranchId", e.target.value)}
                placeholder="Жишээ: branch-001"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Байгууллагын ID (baiguullagiinId)</label>
              <input
                type="text"
                value={draft.posOrgId ?? ""}
                onChange={(e) => setDraftField("posOrgId", e.target.value)}
                placeholder="Жишээ: org-999"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
              />
            </div>
          </div>
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
            type="submit"
            className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Хадгалах
          </button>
        </div>
      </form>
    </div>
  );
}
