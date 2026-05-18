"use client";

import { useState } from "react";
import { useTenantAdmin } from "../../lib/TenantAdminContext";
import type { Brand } from "../../lib/types";

type BrandForm = Omit<Brand, "id" | "createdAt" | "renterId">;

const EMPTY_FORM: BrandForm = { name: "", slug: "", logo: "", description: "", status: "active" };

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function BrandsPage() {
  const { brands, products, renters, addBrand, updateBrand, deleteBrand } = useTenantAdmin();
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<BrandForm>(EMPTY_FORM);
  const [search, setSearch] = useState("");

  const filtered = brands.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.slug.toLowerCase().includes(search.toLowerCase())
  );

  function getRenterName(renterId: string | null) {
    if (!renterId) return null;
    return renters.find((r) => r.id === renterId)?.storeName ?? null;
  }

  function openAdd() { setForm(EMPTY_FORM); setEditId(null); setModal("add"); }
  function openEdit(b: Brand) {
    setForm({ name: b.name, slug: b.slug, logo: b.logo, description: b.description, status: b.status });
    setEditId(b.id);
    setModal("edit");
  }
  function closeModal() { setModal(null); setEditId(null); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (modal === "add") addBrand({ ...form, renterId: null });
    else if (modal === "edit" && editId) updateBrand(editId, form);
    closeModal();
  }

  function setField<K extends keyof BrandForm>(k: K, v: BrandForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const productCount = (brandId: string) => products.filter((p) => p.brandId === brandId).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Брэнд</h2>
          <p className="text-sm text-slate-400 mt-0.5">Бүтээгдэхүүний брэндүүдийг удирдах</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text" placeholder="Хайх..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
            />
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Нэмэх
          </button>
        </div>
      </div>

      {/* Brand cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {filtered.map((b) => {
          const renterName = getRenterName(b.renterId);
          const isRenterBrand = b.renterId !== null;

          return (
            <div key={b.id} className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${isRenterBrand ? "border-amber-200" : "border-slate-100"}`}>
              {/* Logo area */}
              <div className={`h-24 flex items-center justify-center border-b relative ${isRenterBrand ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-100"}`}>
                {b.logo ? (
                  <img src={b.logo} alt={b.name} className="h-12 object-contain" />
                ) : (
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isRenterBrand ? "bg-gradient-to-br from-amber-200 to-amber-300" : "bg-gradient-to-br from-slate-200 to-slate-300"}`}>
                    <span className={`text-2xl font-black ${isRenterBrand ? "text-amber-700" : "text-slate-500"}`}>{b.name[0]}</span>
                  </div>
                )}
                {/* Renter badge */}
                {isRenterBrand && (
                  <div className="absolute top-2 right-2">
                    <span className="text-[10px] font-semibold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                      Түрээслэгч
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{b.name}</p>
                    <p className="text-xs text-slate-400 font-mono">/{b.slug}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${b.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                    {b.status === "active" ? "Идэвхтэй" : "Идэвхгүй"}
                  </span>
                </div>

                {/* Renter owner line */}
                {renterName && (
                  <p className="text-xs text-amber-600 font-medium mb-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {renterName}
                  </p>
                )}

                {/* Description */}
                {b.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-2">{b.description}</p>
                )}

                <p className="text-xs text-slate-500 mb-3">{productCount(b.id)} бүтээгдэхүүн</p>

                <div className="flex gap-2">
                  <button onClick={() => openEdit(b)} className="flex-1 text-center text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg transition-colors font-semibold">
                    Засах
                  </button>
                  {isRenterBrand ? (
                    <div className="flex-1 text-center text-xs bg-amber-50 text-amber-500 py-2 rounded-lg font-semibold cursor-not-allowed" title="Түрээслэгчийн брэндийг устгах боломжгүй">
                      Хамгаалагдсан
                    </div>
                  ) : (
                    <button
                      onClick={() => { if (confirm(`"${b.name}" брэндийг устгах уу?`)) deleteBrand(b.id); }}
                      className="flex-1 text-center text-xs bg-red-50 hover:bg-red-100 text-[#D32F2F] py-2 rounded-lg transition-colors font-semibold"
                    >
                      Устгах
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-slate-100 px-6 py-16 text-center text-slate-400 text-sm shadow-sm">
            Брэнд олдсонгүй
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">
                {modal === "add" ? "Шинэ брэнд нэмэх" : "Брэнд засах"}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Брэндийн нэр *</label>
                <input
                  type="text" required value={form.name}
                  onChange={(e) => { setField("name", e.target.value); setField("slug", slugify(e.target.value)); }}
                  placeholder="Samsung"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Slug</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">/</span>
                  <input
                    type="text" value={form.slug}
                    onChange={(e) => setField("slug", slugify(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl pl-6 pr-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Logo URL</label>
                <input
                  type="text" value={form.logo}
                  onChange={(e) => setField("logo", e.target.value)}
                  placeholder="https://..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
                />
                {form.logo && (
                  <div className="mt-2 h-16 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
                    <img
                      src={form.logo}
                      alt="preview"
                      className="h-12 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Брэндийн тухай</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Брэндийн товч танилцуулга..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Статус</label>
                <div className="flex gap-2">
                  {(["active", "inactive"] as const).map((s) => (
                    <button
                      key={s} type="button" onClick={() => setField("status", s)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                        form.status === s
                          ? s === "active" ? "border-emerald-500 text-emerald-700 bg-emerald-50" : "border-slate-400 text-slate-600 bg-slate-100"
                          : "border-slate-200 text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      {s === "active" ? "Идэвхтэй" : "Идэвхгүй"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">Болих</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-sm font-semibold transition-colors shadow-sm">
                  {modal === "add" ? "Үүсгэх" : "Хадгалах"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
