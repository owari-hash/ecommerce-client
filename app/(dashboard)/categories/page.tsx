"use client";

import { useState } from "react";
import { useTenantAdmin } from "../../lib/TenantAdminContext";
import type { Category } from "../../lib/types";

type CategoryForm = Omit<Category, "id" | "createdAt">;

const EMPTY_FORM: CategoryForm = {
  name: "", slug: "", parentId: null, image: "", status: "active",
};

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useTenantAdmin();
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [search, setSearch] = useState("");

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() { setForm(EMPTY_FORM); setEditId(null); setModal("add"); }
  function openEdit(c: Category) {
    setForm({ name: c.name, slug: c.slug, parentId: c.parentId, image: c.image, status: c.status });
    setEditId(c.id);
    setModal("edit");
  }
  function closeModal() { setModal(null); setEditId(null); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (modal === "add") addCategory(form);
    else if (modal === "edit" && editId) updateCategory(editId, form);
    closeModal();
  }

  function setField<K extends keyof CategoryForm>(k: K, v: CategoryForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const parentName = (id: string | null) =>
    id ? (categories.find((c) => c.id === id)?.name ?? id) : "—";

  const rootCategories = categories.filter((c) => c.parentId === null);
  const childCategories = (parentId: string) => categories.filter((c) => c.parentId === parentId);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Ангилал</h2>
          <p className="text-sm text-slate-400 mt-0.5">Бараа бүтээгдэхүүний ангиллын бүтэц</p>
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

      {/* Category tree view */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {(search ? filtered : rootCategories).map((cat) => {
          const children = search ? [] : childCategories(cat.id);
          return (
            <div key={cat.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="h-1.5 bg-gradient-to-r from-[#D32F2F] to-[#EF5350]" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{cat.name}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">/{cat.slug}</p>
                    {cat.parentId && (
                      <p className="text-xs text-slate-500 mt-1">
                        ↳ {parentName(cat.parentId)}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${cat.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                    {cat.status === "active" ? "Идэвхтэй" : "Идэвхгүй"}
                  </span>
                </div>

                {children.length > 0 && (
                  <div className="mb-3 space-y-1">
                    {children.map((ch) => (
                      <div key={ch.id} className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-1.5">
                        <span className="text-slate-300">└</span>
                        <span className="font-medium text-slate-600">{ch.name}</span>
                        <span className="font-mono text-slate-400">/{ch.slug}</span>
                        <span className={`ml-auto font-semibold ${ch.status === "active" ? "text-emerald-600" : "text-slate-400"}`}>
                          {ch.status === "active" ? "•" : "○"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => openEdit(cat)} className="flex-1 text-center text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg transition-colors font-semibold">
                    Засах
                  </button>
                  <button
                    onClick={() => { if (confirm(`"${cat.name}" ангиллыг устгах уу?`)) deleteCategory(cat.id); }}
                    className="flex-1 text-center text-xs bg-red-50 hover:bg-red-100 text-[#D32F2F] py-2 rounded-lg transition-colors font-semibold"
                  >
                    Устгах
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-slate-100 px-6 py-16 text-center text-slate-400 text-sm shadow-sm">
            Ангилал олдсонгүй
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">
                {modal === "add" ? "Шинэ ангилал нэмэх" : "Ангилал засах"}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Нэр *</label>
                <input
                  type="text" required value={form.name}
                  onChange={(e) => { setField("name", e.target.value); setField("slug", slugify(e.target.value)); }}
                  placeholder="Электроник"
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
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Эцэг ангилал</label>
                <select
                  value={form.parentId ?? ""}
                  onChange={(e) => setField("parentId", e.target.value || null)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
                >
                  <option value="">Үндсэн ангилал (parent байхгүй)</option>
                  {categories
                    .filter((c) => c.id !== editId && c.parentId === null)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
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
