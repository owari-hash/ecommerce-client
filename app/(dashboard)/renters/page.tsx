"use client";

import { useState } from "react";
import { useTenantAdmin } from "../../lib/TenantAdminContext";
import type { Renter } from "../../lib/types";

const EMPTY_FORM = {
  name: "",
  storeName: "",
  email: "",
  password: "",
  status: "active" as "active" | "inactive",
  brandLogo: "",
  brandDescription: "",
};

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function RentersPage() {
  const { renters, products, brands, addRenter, updateRenter, deleteRenter, updateBrand } = useTenantAdmin();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Renter | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPass, setShowPass] = useState<Record<string, boolean>>({});
  const [formShowPass, setFormShowPass] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(false);

  const filtered = renters.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.storeName.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase())
  );

  function getRenterBrand(renterId: string) {
    return brands.find((b) => b.renterId === renterId) ?? null;
  }

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormShowPass(false);
    setModalOpen(true);
  }

  function openEdit(r: Renter) {
    const brand = getRenterBrand(r.id);
    setEditTarget(r);
    setForm({
      name: r.name,
      storeName: r.storeName,
      email: r.email,
      password: r.password,
      status: r.status,
      brandLogo: brand?.logo ?? "",
      brandDescription: brand?.description ?? "",
    });
    setFormShowPass(false);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditTarget(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { brandLogo, brandDescription, ...renterFields } = form;

    if (editTarget) {
      updateRenter(editTarget.id, renterFields);
      const brand = getRenterBrand(editTarget.id);
      if (brand) {
        updateBrand(brand.id, { logo: brandLogo, description: brandDescription });
      }
    } else {
      addRenter(renterFields, { logo: brandLogo, description: brandDescription });
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    closeModal();
  }

  function productCount(renterId: string) {
    return products.filter((p) => p.renterId === renterId).length;
  }

  function toggleShowPass(id: string) {
    setShowPass((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Түрээслэгчид</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Дэлгүүрт бүтээгдэхүүн нэмэх эрх бүхий түрээслэгчдийг удирдах
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#D32F2F] text-white text-sm font-semibold rounded-xl hover:bg-[#B71C1C] transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Түрээслэгч нэмэх
        </button>
      </div>

      {/* Save toast */}
      {saved && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg animate-fade-in">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Амжилттай хадгалагдлаа
        </div>
      )}

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-amber-700">
          Түрээслэгч бүр өөрийн брэндтэй бүртгэгдэнэ. Нэвтрэх мэдээллийг нь дамжуулна уу.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Хайх..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]"
        />
      </div>

      {/* Renters grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium">Түрээслэгч олдсонгүй</p>
          <p className="text-slate-400 text-sm mt-1">Шинэ түрээслэгч нэмэхийн тулд дээрх товчийг дарна уу</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((renter) => {
            const brand = getRenterBrand(renter.id);
            return (
              <div key={renter.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Brand logo area */}
                <div className="h-20 bg-slate-50 border-b border-slate-100 flex items-center justify-center relative">
                  {brand?.logo ? (
                    <img src={brand.logo} alt={brand.name} className="h-12 object-contain" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                      <span className="text-2xl font-black text-amber-600">
                        {renter.storeName[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  {/* Brand slug badge */}
                  {brand && (
                    <div className="absolute bottom-2 right-2">
                      <span className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">
                        /{slugify(brand.name)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="px-5 pt-4 pb-3 space-y-3">
                  {/* Renter info */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-amber-600 text-sm">
                        {renter.name[0]?.toUpperCase() ?? "Т"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800 truncate text-sm">{renter.name}</p>
                        <span
                          className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                            renter.status === "active"
                              ? "bg-green-50 text-green-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {renter.status === "active" ? "Идэвхтэй" : "Идэвхгүй"}
                        </span>
                      </div>
                      <p className="text-sm text-amber-600 font-semibold truncate">{renter.storeName}</p>
                    </div>
                  </div>

                  {/* Brand description */}
                  {brand?.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 border-l-2 border-amber-200 pl-2">
                      {brand.description}
                    </p>
                  )}

                  {/* Credentials */}
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Нэвтрэх мэдээлэл</p>
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-slate-700 truncate font-mono">{renter.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-sm text-slate-700 font-mono flex-1">
                        {showPass[renter.id] ? renter.password : "•".repeat(renter.password.length)}
                      </span>
                      <button
                        onClick={() => toggleShowPass(renter.id)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPass[renter.id] ? (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span>{productCount(renter.id)} бүтээгдэхүүн</span>
                    </div>
                    {renter.lastLogin && (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          {new Date(renter.lastLogin).toLocaleDateString("mn-MN", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-5 pb-5 flex items-center gap-2">
                  <button
                    onClick={() => openEdit(renter)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Засах
                  </button>
                  <button
                    onClick={() =>
                      updateRenter(renter.id, { status: renter.status === "active" ? "inactive" : "active" })
                    }
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                      renter.status === "active"
                        ? "text-amber-700 bg-amber-50 hover:bg-amber-100"
                        : "text-green-700 bg-green-50 hover:bg-green-100"
                    }`}
                  >
                    {renter.status === "active" ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Түр зогсоох
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Идэвхжүүлэх
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(renter.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-y-auto max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                {editTarget ? "Түрээслэгч засах" : "Шинэ түрээслэгч нэмэх"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {editTarget
                  ? "Мэдээллийг шинэчилж хадгална уу"
                  : "Нэвтрэх мэдээллийг түрээслэгчид өгнө үү"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Renter info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Нэр <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Болд"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Дэлгүүрийн нэр / Брэнд <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={form.storeName}
                    onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                    placeholder="Bold Fashion"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]"
                  />
                  {form.storeName && (
                    <p className="text-[10px] text-slate-400 font-mono mt-1">
                      /{slugify(form.storeName)}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  И-мэйл хаяг <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="bold@example.mn"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Нууц үг <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    required
                    type={formShowPass ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Хамгийн багадаа 6 тэмдэгт"
                    minLength={6}
                    className="w-full px-3 py-2 pr-10 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]"
                  />
                  <button
                    type="button"
                    onClick={() => setFormShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {formShowPass ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {editTarget && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Төлөв</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] bg-white"
                  >
                    <option value="active">Идэвхтэй</option>
                    <option value="inactive">Идэвхгүй</option>
                  </select>
                </div>
              )}

              {/* Brand details divider */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Брэндийн дэлгэрэнгүй</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Лого URL</label>
                <input
                  type="text"
                  value={form.brandLogo}
                  onChange={(e) => setForm({ ...form, brandLogo: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]"
                />
                {form.brandLogo && (
                  <div className="mt-2 h-16 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
                    <img
                      src={form.brandLogo}
                      alt="preview"
                      className="h-12 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Брэндийн тухай</label>
                <textarea
                  rows={3}
                  value={form.brandDescription}
                  onChange={(e) => setForm({ ...form, brandDescription: e.target.value })}
                  placeholder="Брэндийн товч танилцуулга..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Цуцлах
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-[#D32F2F] hover:bg-[#B71C1C] rounded-xl transition-colors"
                >
                  {editTarget ? "Шинэчлэх" : "Нэмэх"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-800 text-center mb-2">Түрээслэгч устгах уу?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              Энэ үйлдлийг буцаах боломжгүй. Брэнд болон бүтээгдэхүүнүүд дэлгүүрт үлдэнэ.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Цуцлах
              </button>
              <button
                onClick={() => {
                  deleteRenter(deleteConfirm);
                  setDeleteConfirm(null);
                }}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
              >
                Устгах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
