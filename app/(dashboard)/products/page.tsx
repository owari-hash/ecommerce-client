"use client";

import { useState } from "react";
import { useTenantAdmin } from "../../lib/TenantAdminContext";
import type { Product, ProductStatus } from "../../lib/types";

type ProductForm = Omit<Product, "id" | "createdAt">;

const EMPTY_FORM: ProductForm = {
  name: "", slug: "", description: "", price: 0, salePrice: null,
  stock: 0, categoryId: "", brandId: "", images: [], tags: [],
  featured: false, status: "active", renterId: null,
};

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const STATUS_STYLE: Record<ProductStatus, string> = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-slate-100 text-slate-400",
  draft: "bg-yellow-50 text-yellow-700",
};

const STATUS_LABEL: Record<ProductStatus, string> = {
  active: "Идэвхтэй",
  inactive: "Идэвхгүй",
  draft: "Ноорог",
};

export default function ProductsPage() {
  const {
    products, categories, brands, renters,
    addProduct, updateProduct, deleteProduct,
    currentUser, currentRenter,
  } = useTenantAdmin();

  const isRenter = currentRenter !== null;

  // Renters only see their own products; owners see all
  const visibleProducts = isRenter
    ? products.filter((p) => p.renterId === currentRenter.id)
    : products;

  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>({ ...EMPTY_FORM, renterId: isRenter ? currentRenter.id : null });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ProductStatus | "all">("all");

  const filtered = visibleProducts.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  function openAdd() {
    setForm({ ...EMPTY_FORM, renterId: isRenter ? currentRenter.id : null });
    setEditId(null);
    setModal("add");
  }

  function openEdit(p: Product) {
    // Renters can only edit their own products
    if (isRenter && p.renterId !== currentRenter.id) return;
    setForm({
      name: p.name, slug: p.slug, description: p.description,
      price: p.price, salePrice: p.salePrice, stock: p.stock,
      categoryId: p.categoryId, brandId: p.brandId,
      images: [...p.images], tags: [...p.tags],
      featured: p.featured, status: p.status, renterId: p.renterId,
    });
    setEditId(p.id);
    setModal("edit");
  }

  function closeModal() { setModal(null); setEditId(null); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (modal === "add") addProduct(form);
    else if (modal === "edit" && editId) updateProduct(editId, form);
    closeModal();
  }

  function setField<K extends keyof ProductForm>(k: K, v: ProductForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";
  const brandName = (id: string) => brands.find((b) => b.id === id)?.name ?? "—";
  const renterName = (id: string | null) =>
    id ? (renters.find((r) => r.id === id)?.storeName ?? id) : "Дэлгүүр";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {isRenter ? "Миний бүтээгдэхүүн" : "Бүтээгдэхүүн"}
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {isRenter
              ? `${currentRenter.storeName} · ${visibleProducts.length} бүтээгдэхүүн`
              : "Дэлгүүрийн каталогийг удирдах"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(["all", "active", "draft", "inactive"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterStatus === s ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {s === "all" ? "Бүгд" : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          {/* Search */}
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
          <button
            onClick={openAdd}
            className={`flex items-center gap-2 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm ${isRenter ? "bg-amber-500 hover:bg-amber-600" : "bg-[#D32F2F] hover:bg-[#B71C1C]"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Нэмэх
          </button>
        </div>
      </div>

      {/* Renter info banner */}
      {isRenter && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 flex items-center gap-3">
          <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-amber-800">
            Та зөвхөн өөрийн бүтээгдэхүүнийг харж, засварлах боломжтой.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-3">Бүтээгдэхүүн</th>
                <th className="px-6 py-3">Ангилал</th>
                <th className="px-6 py-3">Брэнд</th>
                <th className="px-6 py-3">Үнэ</th>
                <th className="px-6 py-3">Нөөц</th>
                <th className="px-6 py-3">Статус</th>
                {!isRenter && <th className="px-6 py-3">Түрээслэгч</th>}
                <th className="px-6 py-3">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const canEdit = !isRenter || p.renterId === currentRenter?.id;
                return (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                          {p.name}
                          {p.featured && (
                            <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">/{p.slug}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">{categoryName(p.categoryId)}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{brandName(p.brandId)}</td>
                    <td className="px-6 py-3">
                      {p.salePrice ? (
                        <>
                          <p className="text-sm font-semibold text-[#D32F2F]">₮{p.salePrice.toLocaleString()}</p>
                          <p className="text-xs text-slate-400 line-through">₮{p.price.toLocaleString()}</p>
                        </>
                      ) : (
                        <p className="text-sm font-semibold text-slate-800">₮{p.price.toLocaleString()}</p>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-sm font-semibold ${p.stock === 0 ? "text-red-500" : p.stock < 5 ? "text-yellow-600" : "text-slate-700"}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLE[p.status]}`}>
                        {STATUS_LABEL[p.status]}
                      </span>
                    </td>
                    {!isRenter && (
                      <td className="px-6 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${p.renterId ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                          {renterName(p.renterId)}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-3">
                      {canEdit ? (
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(p)} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors font-semibold">
                            Засах
                          </button>
                          <button
                            onClick={() => { if (confirm(`"${p.name}" устгах уу?`)) deleteProduct(p.id); }}
                            className="text-xs bg-red-50 hover:bg-red-100 text-[#D32F2F] px-3 py-1.5 rounded-lg transition-colors font-semibold"
                          >
                            Устгах
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={isRenter ? 7 : 8} className="px-6 py-12 text-center text-slate-400 text-sm">Бүтээгдэхүүн олдсонгүй</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">
                {modal === "add" ? "Шинэ бүтээгдэхүүн нэмэх" : "Бүтээгдэхүүн засах"}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Нэр *</label>
                  <input
                    type="text" required value={form.name}
                    onChange={(e) => { setField("name", e.target.value); setField("slug", slugify(e.target.value)); }}
                    placeholder="Бүтээгдэхүүний нэр"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Slug</label>
                  <input
                    type="text" value={form.slug}
                    onChange={(e) => setField("slug", slugify(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Тайлбар</label>
                <textarea
                  value={form.description} rows={2}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Бүтээгдэхүүний дэлгэрэнгүй тайлбар"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Үнэ *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₮</span>
                    <input
                      type="number" required min={0} value={form.price}
                      onChange={(e) => setField("price", Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Хөнгөлөлтийн үнэ</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₮</span>
                    <input
                      type="number" min={0}
                      value={form.salePrice ?? ""}
                      onChange={(e) => setField("salePrice", e.target.value ? Number(e.target.value) : null)}
                      className="w-full border border-slate-200 rounded-xl pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
                      placeholder="—"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Нөөц</label>
                  <input
                    type="number" min={0} value={form.stock}
                    onChange={(e) => setField("stock", Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ангилал</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setField("categoryId", e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
                  >
                    <option value="">— Сонгох —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Брэнд</label>
                  <select
                    value={form.brandId}
                    onChange={(e) => setField("brandId", e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
                  >
                    <option value="">— Сонгох —</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Owner-only: assign to renter */}
              {!isRenter && currentUser && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Түрээслэгч</label>
                  <select
                    value={form.renterId ?? ""}
                    onChange={(e) => setField("renterId", e.target.value || null)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
                  >
                    <option value="">Дэлгүүрийн өөрийн бараа</option>
                    {renters.map((r) => (
                      <option key={r.id} value={r.id}>{r.storeName} ({r.name})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Статус</label>
                  <div className="flex gap-2">
                    {(["active", "draft", "inactive"] as const).map((s) => (
                      <button
                        key={s} type="button" onClick={() => setField("status", s)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                          form.status === s
                            ? s === "active" ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                              : s === "draft" ? "border-yellow-400 text-yellow-700 bg-yellow-50"
                              : "border-slate-400 text-slate-600 bg-slate-100"
                            : "border-slate-200 text-slate-400 hover:border-slate-300"
                        }`}
                      >
                        {STATUS_LABEL[s]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input type="checkbox" className="sr-only peer" checked={form.featured} onChange={(e) => setField("featured", e.target.checked)} />
                      <div className="w-10 h-5 bg-slate-200 peer-checked:bg-[#D32F2F] rounded-full transition-colors" />
                      <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                    </div>
                    <span className="text-sm text-slate-600">Онцлох бараа</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                  Болих
                </button>
                <button type="submit" className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors shadow-sm ${isRenter ? "bg-amber-500 hover:bg-amber-600" : "bg-[#D32F2F] hover:bg-[#B71C1C]"}`}>
                  {modal === "add" ? "Нэмэх" : "Хадгалах"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
