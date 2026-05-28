"use client";

import { useState, useRef, useEffect } from "react";
import { useTenantAdmin, API_BASE } from "../../lib/TenantAdminContext";
import type { Product, ProductStatus } from "../../lib/types";

const MAX_IMAGES = 5;

type ProductForm = Omit<Product, "id" | "createdAt">;

const EMPTY_FORM: ProductForm = {
  name: "", slug: "", description: "", price: 0, salePrice: null,
  stock: 0, categoryId: "", brandId: "", images: [], tags: [],
  featured: false, status: "active", renterId: null,
};

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function resolveImageUrl(url: string) {
  if (!url) return "";
  const uploadMatch = url.match(/\/upload\/(.+)$/);
  if (uploadMatch) {
    return `${API_BASE}/upload/${uploadMatch[1]}`;
  }
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return url.startsWith("/") ? `${API_BASE}${url}` : `${API_BASE}/upload/${url}`;
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
  const [uploadingImages, setUploadingImages] = useState(false);
  const imageFileRef = useRef<HTMLInputElement>(null);

  const { settings } = useTenantAdmin();
  const [posModalOpen, setPosModalOpen] = useState(false);
  const [posLoading, setPosLoading] = useState(false);
  const [posProducts, setPosProducts] = useState<any[]>([]);
  const [selectedPosCodes, setSelectedPosCodes] = useState<Record<string, boolean>>({});
  const [posSearch, setPosSearch] = useState("");
  const [importingPos, setImportingPos] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [posError, setPosError] = useState<string | null>(null);

  async function openPosImport() {
    setPosModalOpen(true);
    setPosLoading(true);
    setPosError(null);
    setSelectedPosCodes({});
    setPosSearch("");
    setImportSuccess(false);

    try {
      const token = localStorage.getItem("ikna_admin_token");
      const searchParams = new URLSearchParams(window.location.search);
      const tenantParam = searchParams.get('tenant');
      const qs = tenantParam ? `&tenantId=${encodeURIComponent(tenantParam)}` : '';
      
      const res = await fetch(`${API_BASE}/api/products/pos-available?${qs}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const body = await res.json();
        setPosProducts(body.data || []);
      } else {
        const body = await res.json().catch(() => ({}));
        const errMsg = body.error?.message || body.error || "POS системтэй холбогдоход алдаа гарлаа.";
        setPosError(errMsg);
        console.error("Failed to load POS items:", errMsg);
      }
    } catch (err: any) {
      const errMsg = err?.message || "Сүлжээний алдаа гарлаа. Дахин оролдоно уу.";
      setPosError(errMsg);
      console.error("Error loading POS items", err);
    } finally {
      setPosLoading(false);
    }
  }

  async function handlePosImport(e: React.FormEvent) {
    e.preventDefault();
    const codes = Object.keys(selectedPosCodes).filter((c) => selectedPosCodes[c]);
    if (codes.length === 0) return;

    setImportingPos(true);
    try {
      const token = localStorage.getItem("ikna_admin_token");
      const searchParams = new URLSearchParams(window.location.search);
      const tenantParam = searchParams.get('tenant');
      
      const res = await fetch(`${API_BASE}/api/products/pos-import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          codes,
          tenantId: tenantParam || undefined,
        }),
      });

      if (res.ok) {
        setImportSuccess(true);
        const prodRes = await fetch(`${API_BASE}/api/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (prodRes.ok) {
          const prodBody = await prodRes.json();
          if (prodBody?.data) {
            const KEYS = { products: "ikna_client_products" };
            localStorage.setItem(KEYS.products, JSON.stringify(prodBody.data));
            window.location.reload();
          }
        }
        setTimeout(() => {
          setPosModalOpen(false);
        }, 1500);
      } else {
        console.error("POS import failed");
      }
    } catch (err) {
      console.error("Error during POS import", err);
    } finally {
      setImportingPos(false);
    }
  }

  useEffect(() => {
    if (modal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modal]);

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

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = MAX_IMAGES - form.images.length;
    if (remaining <= 0) return;
    const toUpload = files.slice(0, remaining);
    setUploadingImages(true);
    try {
      const token = localStorage.getItem("ikna_admin_token");
      const urls: string[] = [];
      for (const file of toUpload) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`${API_BASE}/api/upload`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        });
        if (res.ok) {
          const body = await res.json();
          const imageUrl = body?.url || (body?.data?.path ? `${API_BASE}${body.data.path}` : "");
          if (imageUrl) {
            urls.push(imageUrl);
          }
        }
      }
      if (urls.length) setField("images", [...form.images, ...urls]);
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setUploadingImages(false);
      if (imageFileRef.current) imageFileRef.current.value = "";
    }
  }

  function removeImage(idx: number) {
    setField("images", form.images.filter((_, i) => i !== idx));
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
          {!isRenter && settings.posDbUri && (
            <button
              onClick={() => openPosImport()}
              className="flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 bg-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              POS-оос татах
            </button>
          )}
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
                      <div className="flex items-center gap-3">
                        {p.images[0] ? (
                          <img src={resolveImageUrl(p.images[0])} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-slate-100 flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
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

      {/* POS Import Modal */}
      {posModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in relative max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">POS-оос бараа татах</h3>
                <p className="text-xs text-slate-400 mt-0.5">Танай POS систем дээр бүртгэлтэй барааны жагсаалт</p>
              </div>
              <button onClick={() => setPosModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-3 border-b border-slate-50 bg-slate-50/50 shrink-0 flex items-center gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text" placeholder="Барааны нэр эсвэл кодоор хайх..." value={posSearch}
                  onChange={(e) => setPosSearch(e.target.value)}
                  className="border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs w-full focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
                />
              </div>
            </div>

            <form onSubmit={handlePosImport} className="flex flex-col flex-1 overflow-hidden">
              <div className="px-6 py-4 overflow-y-auto flex-1">
                {posLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                    <svg className="w-8 h-8 animate-spin text-[#D32F2F]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm font-semibold">POS барааг ачаалж байна...</span>
                  </div>
                ) : posError ? (
                  <div className="text-center py-10 px-6 rounded-2xl bg-rose-50/50 border border-rose-100 max-w-md mx-auto my-4 text-slate-500">
                    <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-3 text-rose-600 animate-pulse">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-slate-800">POS баазтай холбогдож чадсангүй</p>
                    <p className="text-[11px] text-rose-600/90 font-mono mt-2 bg-white/80 p-3 rounded-xl border border-rose-50 select-text overflow-x-auto text-left leading-relaxed">
                      {posError}
                    </p>
                    <button
                      type="button"
                      onClick={openPosImport}
                      className="mt-5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                    >
                      Дахин оролдох
                    </button>
                  </div>
                ) : posProducts.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-sm font-semibold">POS дээр бараа олдсонгүй.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {posProducts
                      .filter((p) =>
                        p.name.toLowerCase().includes(posSearch.toLowerCase()) ||
                        p.code.toLowerCase().includes(posSearch.toLowerCase())
                      )
                      .map((p) => (
                        <div
                          key={p.code}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                            p.alreadyImported
                              ? "bg-slate-50 border-slate-100 opacity-60"
                              : selectedPosCodes[p.code]
                              ? "bg-red-50/50 border-[#D32F2F]/30"
                              : "bg-white border-slate-100 hover:border-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              disabled={p.alreadyImported}
                              checked={!!selectedPosCodes[p.code]}
                              onChange={(e) =>
                                setSelectedPosCodes((s) => ({ ...s, [p.code]: e.target.checked }))
                              }
                              className="rounded border-slate-300 text-[#D32F2F] focus:ring-[#D32F2F] w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                              <p className="text-[10px] font-mono text-slate-400">Код: {p.code} {p.barcode && `· Баркод: ${p.barcode}`}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-800">₮{p.price.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">Үлдэгдэл: <span className="font-semibold text-slate-700">{p.stock}</span></p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl shrink-0 flex items-center justify-between gap-3 mt-auto">
                {importSuccess ? (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Бараа амжилттай татагдлаа!
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    Сонгосон: <span className="font-bold text-slate-700">{Object.keys(selectedPosCodes).filter(c => selectedPosCodes[c]).length} бараа</span>
                  </p>
                )}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPosModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors">Болих</button>
                  <button
                    type="submit"
                    disabled={importingPos || posLoading || Object.keys(selectedPosCodes).filter(c => selectedPosCodes[c]).length === 0}
                    className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-60"
                  >
                    {importingPos ? "Татаж байна..." : "Сонгосныг татах"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl animate-fade-in relative max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-800 text-lg">
                {modal === "add" ? "Шинэ бүтээгдэхүүн нэмэх" : "Бүтээгдэхүүн засах"}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: General & Text Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Нэр *</label>
                      <input
                        type="text" required value={form.name}
                        onChange={(e) => { setField("name", e.target.value); setField("slug", slugify(e.target.value)); }}
                        placeholder="Бүтээгдэхүүний нэр"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Slug</label>
                      <input
                        type="text" value={form.slug}
                        onChange={(e) => setField("slug", slugify(e.target.value))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Тайлбар</label>
                      <textarea
                        value={form.description} rows={3}
                        onChange={(e) => setField("description", e.target.value)}
                        placeholder="Бүтээгдэхүүний дэлгэрэнгүй тайлбар..."
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 resize-none bg-white"
                      />
                    </div>

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
                                : "border-slate-200 text-slate-400 hover:border-slate-300 bg-white"
                            }`}
                          >
                            {STATUS_LABEL[s]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center pt-2">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input type="checkbox" className="sr-only peer" checked={form.featured} onChange={(e) => setField("featured", e.target.checked)} />
                          <div className="w-10 h-5 bg-slate-200 peer-checked:bg-[#D32F2F] rounded-full transition-colors" />
                          <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                        </div>
                        <span className="text-sm font-semibold text-slate-600">Онцлох бүтээгдэхүүн болгох</span>
                      </label>
                    </div>

                    {/* Owner-only: assign to renter */}
                    {!isRenter && currentUser && (
                      <div className="pt-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Түрээслэгч эзэмшигч</label>
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
                  </div>

                  {/* Right Column: Numbers & Media */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Үндсэн үнэ *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₮</span>
                          <input
                            type="number" required min={0} value={form.price || ""}
                            onChange={(e) => setField("price", Number(e.target.value))}
                            className="w-full border border-slate-200 rounded-xl pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Хөнгөлөлттэй үнэ</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₮</span>
                          <input
                            type="number" min={0}
                            value={form.salePrice ?? ""}
                            onChange={(e) => setField("salePrice", e.target.value ? Number(e.target.value) : null)}
                            className="w-full border border-slate-200 rounded-xl pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
                            placeholder="Хямдралгүй"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Нөөцийн тоо</label>
                        <input
                          type="number" min={0} value={form.stock}
                          onChange={(e) => setField("stock", Number(e.target.value))}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ангилал</label>
                        <select
                          value={form.categoryId}
                          onChange={(e) => setField("categoryId", e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
                        >
                          <option value="">— Сонгох —</option>
                          {categories.filter((c) => !c.parentId).map((root) => {
                            const subs = categories.filter((c) => c.parentId === root.id);
                            return (
                              <optgroup key={root.id} label={root.name}>
                                <option value={root.id}>{root.name} (Үндсэн)</option>
                                {subs.map((sub) => (
                                  <option key={sub.id} value={sub.id}>
                                    {"\u00A0\u00A0↳ "}{sub.name}
                                  </option>
                                ))}
                              </optgroup>
                            );
                          })}
                          {categories.filter((c) => c.parentId && !categories.some((parent) => parent.id === c.parentId)).length > 0 && (
                            <optgroup label="Бусад">
                              {categories
                                .filter((c) => c.parentId && !categories.some((parent) => parent.id === c.parentId))
                                .map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </optgroup>
                          )}
                        </select>
                      </div>
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

                    {/* Image Upload Manager */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          Бүтээгдэхүүний зураг
                          <span className="ml-1.5 text-xs font-normal text-slate-400">(дээд тал нь {MAX_IMAGES})</span>
                        </label>
                        <span className="text-xs text-slate-400 font-semibold">{form.images.length}/{MAX_IMAGES}</span>
                      </div>

                      {/* Thumbnails */}
                      {form.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          {form.images.map((url, idx) => (
                            <div key={idx} className="relative group shrink-0">
                              <img
                                src={resolveImageUrl(url)}
                                alt={`Зураг ${idx + 1}`}
                                className="w-14 h-14 object-cover rounded-lg border border-slate-200"
                              />
                              {idx === 0 && (
                                <span className="absolute -top-1 -left-1 bg-[#D32F2F] text-white text-[9px] font-bold px-1 py-0.5 rounded-md leading-none">Гол</span>
                              )}
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-slate-500 hover:text-red-500"
                              >
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload zone */}
                      {form.images.length < MAX_IMAGES && (
                        <div
                          className="relative border-2 border-dashed border-slate-200 hover:border-[#D32F2F]/40 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-slate-100/50"
                          onClick={() => !uploadingImages && imageFileRef.current?.click()}
                        >
                          <input
                            ref={imageFileRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            multiple
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={uploadingImages}
                          />
                          {uploadingImages ? (
                            <div className="flex items-center justify-center gap-2 py-1.5">
                              <svg className="w-4 h-4 animate-spin text-[#D32F2F]" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              <span className="text-sm text-slate-400 font-medium">Хуулж байна...</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                              <p className="text-xs font-semibold text-slate-500">Зураг оруулах (товших эсвэл чирэх)</p>
                              <p className="text-[10px] text-slate-400 font-medium">JPG, PNG, WEBP · {MAX_IMAGES - form.images.length} зураг нэмэх боломжтой</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl shrink-0 flex gap-3 mt-auto">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">Болих</button>
                <button type="submit" disabled={uploadingImages} className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors shadow-sm disabled:opacity-60 ${isRenter ? "bg-amber-500 hover:bg-amber-600" : "bg-[#D32F2F] hover:bg-[#B71C1C]"}`}>
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
