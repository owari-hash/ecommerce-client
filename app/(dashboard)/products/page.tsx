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

  // Pagination for main products list
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  useEffect(() => {
    setPage(1);
  }, [search, filterStatus]);

  // History modal states
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PAGE_SIZE = 10;

  const { settings } = useTenantAdmin();
  const [posModalOpen, setPosModalOpen] = useState(false);
  const [posLoading, setPosLoading] = useState(false);
  const [posProducts, setPosProducts] = useState<any[]>([]);
  const [selectedPosCodes, setSelectedPosCodes] = useState<Record<string, boolean>>({});
  const [posSearch, setPosSearch] = useState("");
  const [importingPos, setImportingPos] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [posError, setPosError] = useState<string | null>(null);
  const [posProgress, setPosProgress] = useState<{ done: number; total: number } | null>(null);


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
    setPosProgress({ done: 0, total: codes.length });
    try {
      const token = localStorage.getItem("ikna_admin_token");
      const searchParams = new URLSearchParams(window.location.search);
      const tenantParam = searchParams.get('tenant');

      let done = 0;
      for (const code of codes) {
        await fetch(`${API_BASE}/api/products/pos-import`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ codes: [code], tenantId: tenantParam || undefined }),
        });
        done++;
        setPosProgress({ done, total: codes.length });
      }

      setImportSuccess(true);
      const prodRes = await fetch(`${API_BASE}/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (prodRes.ok) {
        const prodBody = await prodRes.json();
        if (prodBody?.data) {
          localStorage.setItem("ikna_client_products", JSON.stringify(prodBody.data));
          window.location.reload();
        }
      }
      setTimeout(() => setPosModalOpen(false), 1500);
    } catch (err) {
      console.error("Error during POS import", err);
    } finally {
      setImportingPos(false);
      setPosProgress(null);
    }
  }

  const [emModalOpen, setEmModalOpen] = useState(false);
  const [emLoading, setEmLoading] = useState(false);
  const [emProducts, setEmProducts] = useState<any[]>([]);
  const [selectedEmCodes, setSelectedEmCodes] = useState<Record<string, boolean>>({});
  const [emSearch, setEmSearch] = useState("");
  const [importingEm, setImportingEm] = useState(false);
  const [emError, setEmError] = useState<string | null>(null);
  const [emCatMap, setEmCatMap] = useState<Record<string, string>>({});
  const [emProgress, setEmProgress] = useState<{ done: number; total: number } | null>(null);

  // Auto image inject state
  const [imgModalOpen, setImgModalOpen] = useState(false);
  const [imgStep, setImgStep] = useState<"select" | "preview" | "saving">("select");
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);
  const [imgProducts, setImgProducts] = useState<Product[]>([]);
  const [selectedImgProductIds, setSelectedImgProductIds] = useState<Record<string, boolean>>({});
  const [imgSearch, setImgSearch] = useState("");
  const [imgPreviewData, setImgPreviewData] = useState<Record<string, { urls: string[]; selectedIndex: number }>>({});
  const [imgSuccess, setImgSuccess] = useState(false);

  function autoAssignCategories(products: any[]): Record<string, string> {
    const map: Record<string, string> = {};
    if (!categories.length) return map;

    // Mongolian stop words to ignore during matching
    const MN_STOP = new Set(["байна","бүх","бүр","бүрэн","бүртгэл","бүтээгдэхүүн","нь","эс","эвэл","дээр","дэх","хийгээд","шинэ"]);

    function tokenize(s: string): string[] {
      return s.toLowerCase()
        .replace(/[^\u0400-\u04ffa-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 1 && !MN_STOP.has(w));
    }

    // Pre-build per-category token sets from name + slug
    const catTokens: Array<{ id: string; tokens: string[]; nameTokens: string[] }> = categories
      .filter((c: any) => c.status === "active")
      .map((c: any) => ({
        id: c.id,
        tokens: [...new Set([
          ...tokenize(c.name),
          ...tokenize(c.slug ?? ""),
        ])],
        nameTokens: tokenize(c.name),
      }));

    for (const p of products) {
      const prodName = (p.name ?? "").toLowerCase();
      const prodTokens = tokenize(prodName);
      let best: { id: string; score: number } | null = null;

      for (const cat of catTokens) {
        let score = 0;

        // Signal 1: exact substring of full category name inside product name
        const catNameFull = tokenize(categories.find((c: any) => c.id === cat.id)?.name ?? "").join(" ");
        if (catNameFull && prodName.includes(catNameFull)) score += catNameFull.length * 3;

        // Signal 2: per-token matches — weight by token length, bonus for name tokens vs slug tokens
        for (const tok of cat.tokens) {
          if (tok.length < 2) continue;
          const isNameTok = cat.nameTokens.includes(tok);
          if (prodName.includes(tok)) {
            // Bonus for whole-word match
            const wordBoundary = new RegExp(`(^|[\\s\\-])${tok.replace(/[-]/g, "\\-")}($|[\\s\\-])`).test(prodName);
            score += tok.length * (isNameTok ? 2 : 1) * (wordBoundary ? 1.5 : 1);
          }
        }

        // Signal 3: product tokens that appear in category tokens
        for (const pt of prodTokens) {
          if (pt.length < 3) continue;
          if (cat.tokens.some((ct) => ct.includes(pt) || pt.includes(ct))) {
            score += pt.length * 0.5;
          }
        }

        if (score > 0 && (!best || score > best.score)) {
          best = { id: cat.id, score };
        }
      }

      if (best) map[p.code] = best.id;
      else map[p.code] = "__unmatched__";
    }
    return map;
  }

  async function openEmImport() {
    setEmModalOpen(true);
    setEmLoading(true);
    setEmError(null);
    setSelectedEmCodes({});
    setEmCatMap({});
    setEmSearch("");
    setImportSuccess(false);

    try {
      const token = localStorage.getItem("ikna_admin_token");
      const searchParams = new URLSearchParams(window.location.search);
      const tenantParam = searchParams.get('tenant');
      const qs = tenantParam ? `&tenantId=${encodeURIComponent(tenantParam)}` : '';
      
      const res = await fetch(`${API_BASE}/api/products/em-available?${qs}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const body = await res.json();
        const prods = body.data || [];
        setEmProducts(prods);
        setEmCatMap(autoAssignCategories(prods));
      } else {
        const body = await res.json().catch(() => ({}));
        const errMsg = body.error?.message || body.error || "EM системтэй холбогдоход алдаа гарлаа.";
        setEmError(errMsg);
        console.error("Failed to load EM items:", errMsg);
      }
    } catch (err: any) {
      const errMsg = err?.message || "Сүлжээний алдаа гарлаа. Дахин оролдоно уу.";
      setEmError(errMsg);
      console.error("Error loading EM items", err);
    } finally {
      setEmLoading(false);
    }
  }

  async function handleEmImport(e: React.FormEvent) {
    e.preventDefault();
    const codes = Object.keys(selectedEmCodes).filter((c) => selectedEmCodes[c]);
    if (codes.length === 0) return;

    setImportingEm(true);
    setEmProgress({ done: 0, total: codes.length });
    try {
      const token = localStorage.getItem("ikna_admin_token");
      const searchParams = new URLSearchParams(window.location.search);
      const tenantParam = searchParams.get('tenant');

      // Ensure "Бусад" category exists for unmatched products
      let busadId: string | null = null;
      const existingBusad = categories.find((c: any) => c.name === "Бусад" && c.status === "active");
      if (existingBusad) {
        busadId = existingBusad.id;
      } else if (codes.some((c) => emCatMap[c] === "__unmatched__")) {
        try {
          const res = await fetch(`${API_BASE}/api/categories`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ name: "Бусад", slug: "busad", status: "active", ...(tenantParam ? { tenantId: tenantParam } : {}) }),
          });
          if (res.ok) {
            const body = await res.json();
            busadId = body.data?.id ?? body.data?._id ?? null;
          }
        } catch { /* ignore */ }
      }

      let done = 0;
      for (const code of codes) {
        const categoryOverrides: Record<string, string> = {};
        const assignedCat = emCatMap[code];
        const resolvedCat = assignedCat === "__unmatched__" ? busadId : (assignedCat || null);
        if (resolvedCat) categoryOverrides[code] = resolvedCat;
        await fetch(`${API_BASE}/api/products/em-import`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ codes: [code], categoryOverrides, tenantId: tenantParam || undefined }),
        });
        done++;
        setEmProgress({ done, total: codes.length });
      }

      setImportSuccess(true);
      const prodRes = await fetch(`${API_BASE}/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (prodRes.ok) {
        const prodBody = await prodRes.json();
        if (prodBody?.data) {
          localStorage.setItem("ikna_client_products", JSON.stringify(prodBody.data));
          window.location.reload();
        }
      }
      setTimeout(() => setEmModalOpen(false), 1500);
    } catch (err) {
      console.error("Error during EM import", err);
    } finally {
      setImportingEm(false);
      setEmProgress(null);
    }
  }

  // ── Auto Image Inject handlers ─────────────────────────────────────────────

  function openImgInject() {
    setImgModalOpen(true);
    setImgStep("select");
    setImgLoading(false);
    setImgError(null);
    setImgSuccess(false);
    setSelectedImgProductIds({});
    setImgSearch("");
    setImgPreviewData({});

    // Default: show all visible products (those without images first)
    const candidates = visibleProducts.filter((p: Product) => !p.images || p.images.length === 0);
    setImgProducts(candidates.length > 0 ? candidates : visibleProducts);
  }

  async function handleSearchImages() {
    const selectedIds = Object.keys(selectedImgProductIds).filter((id) => selectedImgProductIds[id]);
    if (selectedIds.length === 0) return;

    setImgLoading(true);
    setImgError(null);
    setImgStep("preview");
    const preview: Record<string, { urls: string[]; selectedIndex: number }> = {};

    try {
      const token = localStorage.getItem("ikna_admin_token");
      for (const productId of selectedIds) {
        const product = visibleProducts.find((p) => p.id === productId);
        if (!product) continue;

        const res = await fetch(`${API_BASE}/api/products/image-search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ query: product.name, perPage: 3 }),
        });

        if (res.ok) {
          const body = await res.json();
          const urls = body.data?.urls || [];
          if (urls.length > 0) {
            preview[productId] = { urls, selectedIndex: 0 };
          }
        }
      }

      setImgPreviewData(preview);
    } catch (err: any) {
      setImgError(err?.message || "Зураг хайхад алдаа гарлаа.");
      console.error("Image search error", err);
    } finally {
      setImgLoading(false);
    }
  }

  async function handleSaveInjections() {
    const injections = Object.entries(imgPreviewData)
      .filter(([productId, data]) => (data as { urls: string[]; selectedIndex: number }).urls.length > 0 && selectedImgProductIds[productId])
      .map(([productId, data]) => ({
        productId,
        imageUrl: (data as { urls: string[]; selectedIndex: number }).urls[(data as { urls: string[]; selectedIndex: number }).selectedIndex],
      }));

    if (injections.length === 0) return;

    setImgLoading(true);
    setImgStep("saving");
    setImgError(null);

    try {
      const token = localStorage.getItem("ikna_admin_token");
      const searchParams = new URLSearchParams(window.location.search);
      const tenantParam = searchParams.get('tenant');

      const res = await fetch(`${API_BASE}/api/products/bulk-image-inject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          injections,
          tenantId: tenantParam || undefined,
        }),
      });

      if (res.ok) {
        setImgSuccess(true);
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
          setImgModalOpen(false);
        }, 1500);
      } else {
        const body = await res.json().catch(() => ({}));
        setImgError(body.error?.message || body.error || "Хадгалахад алдаа гарлаа.");
      }
    } catch (err: any) {
      setImgError(err?.message || "Сүлжээний алдаа гарлаа.");
      console.error("Bulk image inject error", err);
    } finally {
      setImgLoading(false);
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
      (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.slug || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const pageSafe = Math.min(page, Math.max(1, pageCount));
  const pagedProducts = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);


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

  async function openHistory(p: Product) {
    setHistoryProduct(p);
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryData([]);
    setHistoryPage(1);

    try {
      const token = localStorage.getItem("ikna_admin_token");
      const searchParams = new URLSearchParams(window.location.search);
      const tenantParam = searchParams.get('tenant');
      const qs = tenantParam ? `?tenantId=${encodeURIComponent(tenantParam)}` : '';
      
      const res = await fetch(`${API_BASE}/api/products/${p.id}/history${qs}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const body = await res.json();
        setHistoryData(body.data || []);
      } else {
        console.error("Failed to load product history");
      }
    } catch (err) {
      console.error("Error loading product history", err);
    } finally {
      setHistoryLoading(false);
    }
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
          {!isRenter && settings.emDbUri && (
            <button
              onClick={() => openEmImport()}
              className="flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 bg-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              EM-ээс татах
            </button>
          )}
          {!isRenter && (
            <button
              onClick={() => openImgInject()}
              className="flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 bg-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Зураг автоматаар оруулах
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
              {pagedProducts.map((p) => {
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => openHistory(p)}
                          className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg transition-colors font-semibold"
                        >
                          Түүх
                        </button>
                        {canEdit && (
                          <>
                            <button onClick={() => openEdit(p)} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors font-semibold">
                              Засах
                            </button>
                            <button
                              onClick={() => { if (confirm(`"${p.name}" устгах уу?`)) deleteProduct(p.id); }}
                              className="text-xs bg-red-50 hover:bg-red-100 text-[#D32F2F] px-3 py-1.5 rounded-lg transition-colors font-semibold"
                            >
                              Устгах
                            </button>
                          </>
                        )}
                      </div>
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

      {/* Products Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-3 mt-3">
          <p className="text-xs text-slate-400">
            Нийт {filtered.length} бүтээгдэхүүнээс {(pageSafe - 1) * PAGE_SIZE + 1}–{Math.min(pageSafe * PAGE_SIZE, filtered.length)}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(pageSafe - 1)}
              disabled={pageSafe <= 1}
              className="min-w-9 h-9 px-3 rounded-lg text-sm font-bold border border-slate-200 text-slate-600 hover:border-[#D32F2F] hover:text-[#D32F2F] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ‹
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === pageCount || Math.abs(n - pageSafe) <= 1)
              .map((n, idx, arr) => (
                <span key={n} className="flex items-center gap-1.5">
                  {idx > 0 && n - arr[idx - 1] > 1 && <span className="text-slate-400 px-1">…</span>}
                  <button
                    onClick={() => setPage(n)}
                    className={`min-w-9 h-9 px-3 rounded-lg text-sm font-bold transition-colors ${
                      n === pageSafe ? "bg-[#D32F2F] text-white" : "border border-slate-200 text-slate-700 hover:border-[#D32F2F] hover:text-[#D32F2F]"
                    }`}
                  >
                    {n}
                  </button>
                </span>
              ))}
            <button
              onClick={() => setPage(pageSafe + 1)}
              disabled={pageSafe >= pageCount}
              className="min-w-9 h-9 px-3 rounded-lg text-sm font-bold border border-slate-200 text-slate-600 hover:border-[#D32F2F] hover:text-[#D32F2F] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ›
            </button>
          </div>
        </div>
      )}

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

              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl shrink-0 space-y-2 mt-auto">
                {posProgress && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Татаж байна... <span className="font-bold text-slate-700">{posProgress.done}/{posProgress.total}</span></span>
                      <span>{Math.round((posProgress.done / posProgress.total) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D32F2F] rounded-full transition-all duration-300"
                        style={{ width: `${(posProgress.done / posProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
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
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EM Import Modal */}
      {emModalOpen && (() => {
        const emFiltered = emProducts.filter((p) =>
          p.name.toLowerCase().includes(emSearch.toLowerCase()) ||
          p.code.toLowerCase().includes(emSearch.toLowerCase())
        );
        const importable = emFiltered.filter((p) => !p.alreadyImported);
        const selectedCount = Object.keys(selectedEmCodes).filter((c) => selectedEmCodes[c]).length;
        const allSelected = importable.length > 0 && importable.every((p) => selectedEmCodes[p.code]);

        function toggleAll() {
          if (allSelected) {
            setSelectedEmCodes((s) => {
              const next = { ...s };
              importable.forEach((p) => { delete next[p.code]; });
              return next;
            });
          } else {
            setSelectedEmCodes((s) => {
              const next = { ...s };
              importable.forEach((p) => { next[p.code] = true; });
              return next;
            });
          }
        }

        return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in relative max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">EM-ээс эм/бараа татах</h3>
                <p className="text-xs text-slate-400 mt-0.5">Танай EM систем дээр бүртгэлтэй эмийн жагсаалт</p>
              </div>
              <button onClick={() => setEmModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
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
                  type="text" placeholder="Эмийн нэр эсвэл кодоор хайх..." value={emSearch}
                  onChange={(e) => setEmSearch(e.target.value)}
                  className="border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs w-full focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
                />
              </div>
              {/* Check-all toggle */}
              {!emLoading && !emError && importable.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    allSelected
                      ? "bg-[#D32F2F] text-white border-[#D32F2F]"
                      : "bg-white text-slate-600 border-slate-200 hover:border-[#D32F2F] hover:text-[#D32F2F]"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {allSelected ? "Болих" : "Бүгд"}
                </button>
              )}
            </div>

            <form onSubmit={handleEmImport} className="flex flex-col flex-1 overflow-hidden">
              <div className="px-6 py-4 overflow-y-auto flex-1">
                {emLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                    <svg className="w-8 h-8 animate-spin text-[#D32F2F]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm font-semibold">EM барааг ачаалж байна...</span>
                  </div>
                ) : emError ? (
                  <div className="text-center py-10 px-6 rounded-2xl bg-rose-50/50 border border-rose-100 max-w-md mx-auto my-4 text-slate-500">
                    <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-3 text-rose-600 animate-pulse">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-slate-800">EM баазтай холбогдож чадсангүй</p>
                    <p className="text-[11px] text-rose-600/90 font-mono mt-2 bg-white/80 p-3 rounded-xl border border-rose-50 select-text overflow-x-auto text-left leading-relaxed">
                      {emError}
                    </p>
                    <button type="button" onClick={openEmImport}
                      className="mt-5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors">
                      Дахин оролдох
                    </button>
                  </div>
                ) : emProducts.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-sm font-semibold">EM дээр эм олдсонгүй.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {emFiltered.map((p) => {
                      const suggestedCatId = emCatMap[p.code];
                      const isUnmatched = suggestedCatId === "__unmatched__";
                      const suggestedCat = isUnmatched ? { id: "__unmatched__", name: "Бусад" } : (suggestedCatId ? categories.find((c) => c.id === suggestedCatId) : null);
                      return (
                        <div
                          key={p.code}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                            p.alreadyImported
                              ? "bg-slate-50 border-slate-100 opacity-60"
                              : selectedEmCodes[p.code]
                              ? "bg-red-50/50 border-[#D32F2F]/30"
                              : "bg-white border-slate-100 hover:border-slate-200"
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={p.alreadyImported}
                            checked={!!selectedEmCodes[p.code]}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSelectedEmCodes((s) => ({ ...s, [p.code]: checked }));
                            }}
                            className="rounded border-slate-300 text-[#D32F2F] focus:ring-[#D32F2F] w-4 h-4 cursor-pointer disabled:cursor-not-allowed shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                            <p className="text-[10px] font-mono text-slate-400">Код: {p.code}{p.barcode ? ` · ${p.barcode}` : ""}</p>
                          </div>
                          {/* Auto category badge */}
                          <div className="shrink-0">
                            <select
                              value={isUnmatched ? "__unmatched__" : (emCatMap[p.code] ?? "")}
                              onChange={(e) => setEmCatMap((m) => ({ ...m, [p.code]: e.target.value }))}
                              className={`text-[10px] font-semibold px-2 py-1 rounded-lg border focus:outline-none focus:ring-1 max-w-[130px] cursor-pointer ${
                                suggestedCat && !isUnmatched
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-400"
                                  : isUnmatched
                                  ? "bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-400"
                                  : "bg-slate-100 text-slate-500 border-slate-200 focus:ring-slate-300"
                              }`}
                            >
                              <option value="">— Ангилалгүй</option>
                              <option value="__unmatched__">Бусад (авто)</option>
                              {categories.filter((c) => c.status === "active").map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-slate-800">₮{p.price.toLocaleString()}</p>
                            <p className="text-xs text-slate-400">{p.stock} үлд</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl shrink-0 space-y-2 mt-auto">
                {emProgress && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Татаж байна... <span className="font-bold text-slate-700">{emProgress.done}/{emProgress.total}</span></span>
                      <span>{Math.round((emProgress.done / emProgress.total) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D32F2F] rounded-full transition-all duration-300"
                        style={{ width: `${(emProgress.done / emProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  {importSuccess ? (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Эм амжилттай татагдлаа!
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      Сонгосон: <span className="font-bold text-slate-700">{selectedCount} эм</span>
                      {selectedCount > 0 && Object.keys(emCatMap).filter((c) => selectedEmCodes[c] && emCatMap[c]).length > 0 && (
                        <span className="ml-2 text-emerald-600">· {Object.keys(emCatMap).filter((c) => selectedEmCodes[c] && emCatMap[c]).length} ангилал оноогдсон</span>
                      )}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEmModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors">Болих</button>
                    <button
                      type="submit"
                      disabled={importingEm || emLoading || selectedCount === 0}
                      className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-60"
                    >
                      {importingEm ? "Татаж байна..." : "Сонгосныг татах"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
        );
      })()}

      {/* Auto Image Inject Modal */}
      {imgModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl animate-fade-in relative max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">
                  {imgStep === "select" ? "Зураг автоматаар оруулах" : imgStep === "preview" ? "Олдсон зургуудыг харах" : "Хадгалж байна..."}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {imgStep === "select"
                    ? "Зураг оруулах бүтээгдэхүүнийг сонгоно уу"
                    : imgStep === "preview"
                    ? "Бүтээгдэхүүн бүрт тохирох зураг сонгоно уу"
                    : "Зургуудыг серверт хадгалж байна..."}
                </p>
              </div>
              <button
                onClick={() => setImgModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* STEP: SELECT */}
            {imgStep === "select" && (
              <>
                <div className="px-6 py-3 border-b border-slate-50 bg-slate-50/50 shrink-0 flex items-center gap-3">
                  <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text" placeholder="Бүтээгдэхүүний нэрээр хайх..." value={imgSearch}
                      onChange={(e) => setImgSearch(e.target.value)}
                      className="border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs w-full focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
                    />
                  </div>
                </div>

                <div className="px-6 py-4 overflow-y-auto flex-1">
                  {imgProducts.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <p className="text-sm font-semibold">Бүтээгдэхүүн олдсонгүй.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {imgProducts
                        .filter((p) => p.name.toLowerCase().includes(imgSearch.toLowerCase()))
                        .map((p) => (
                          <div
                            key={p.id}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                              selectedImgProductIds[p.id]
                                ? "bg-red-50/50 border-[#D32F2F]/30"
                                : "bg-white border-slate-100 hover:border-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={!!selectedImgProductIds[p.id]}
                                onChange={(e) =>
                                  setSelectedImgProductIds((s) => ({ ...s, [p.id]: e.target.checked }))
                                }
                                className="rounded border-slate-300 text-[#D32F2F] focus:ring-[#D32F2F] w-4 h-4 cursor-pointer"
                              />
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                                <p className="text-[10px] font-mono text-slate-400">{p.images.length > 0 ? `${p.images.length} зурагтай` : "Зураггүй"}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-slate-800">₮{p.price.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl shrink-0 flex items-center justify-between gap-3 mt-auto">
                  <p className="text-xs text-slate-400">
                    Сонгосон: <span className="font-bold text-slate-700">{Object.keys(selectedImgProductIds).filter((id) => selectedImgProductIds[id]).length} бүтээгдэхүүн</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setImgModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Болих
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = imgProducts.reduce((acc: Record<string, boolean>, p: Product) => ({ ...acc, [p.id]: true }), {});
                        setSelectedImgProductIds(allIds);
                      }}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Бүгдийг сонгох
                    </button>
                    <button
                      type="button"
                      disabled={Object.keys(selectedImgProductIds).filter((id) => selectedImgProductIds[id]).length === 0}
                      onClick={handleSearchImages}
                      className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-60"
                    >
                      Зураг хайх
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* STEP: PREVIEW */}
            {imgStep === "preview" && (
              <>
                <div className="px-6 py-4 overflow-y-auto flex-1">
                  {imgLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                      <svg className="w-8 h-8 animate-spin text-[#D32F2F]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-sm font-semibold">Зургуудыг хайж байна...</span>
                    </div>
                  ) : imgError ? (
                    <div className="text-center py-10 px-6 rounded-2xl bg-rose-50/50 border border-rose-100 max-w-md mx-auto my-4 text-slate-500">
                      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-3 text-rose-600 animate-pulse">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-slate-800">Алдаа гарлаа</p>
                      <p className="text-[11px] text-rose-600/90 font-mono mt-2 bg-white/80 p-3 rounded-xl border border-rose-50 select-text overflow-x-auto text-left leading-relaxed">
                        {imgError}
                      </p>
                      <button
                        type="button"
                        onClick={() => setImgStep("select")}
                        className="mt-5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                      >
                        Буцах
                      </button>
                    </div>
                  ) : Object.keys(imgPreviewData).length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <p className="text-sm font-semibold">Зураг олдсонгүй. Дахин оролдоно уу.</p>
                      <button
                        type="button"
                        onClick={() => setImgStep("select")}
                        className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                      >
                        Буцах
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(imgPreviewData).map(([productId, data]) => {
                        const product = visibleProducts.find((p) => p.id === productId);
                        if (!product) return null;
                        const urls = (data as { urls: string[]; selectedIndex: number }).urls;
                        const selectedIndex = (data as { urls: string[]; selectedIndex: number }).selectedIndex;
                        return (
                          <div key={productId} className="border border-slate-100 rounded-xl p-4 bg-slate-50/30">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm font-bold text-slate-800">{product.name}</p>
                              <span className="text-xs text-slate-400">{urls.length} зураг олдлоо</span>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              {urls.map((url: string, idx: number) => (
                                <button
                                  key={idx}
                                  onClick={() =>
                                    setImgPreviewData((prev) => ({
                                      ...prev,
                                      [productId]: { ...prev[productId], selectedIndex: idx },
                                    }))
                                  }
                                  className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-square ${
                                    selectedIndex === idx
                                      ? "border-[#D32F2F] ring-2 ring-[#D32F2F]/20"
                                      : "border-transparent hover:border-slate-300"
                                  }`}
                                >
                                  <img
                                    src={url}
                                    alt={`${product.name} ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                  {selectedIndex === idx && (
                                    <div className="absolute top-2 right-2 bg-[#D32F2F] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                      Сонгосон
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {!imgLoading && !imgError && Object.keys(imgPreviewData).length > 0 && (
                  <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl shrink-0 flex items-center justify-between gap-3 mt-auto">
                    <p className="text-xs text-slate-400">
                      Нийт: <span className="font-bold text-slate-700">{Object.keys(imgPreviewData).length} бүтээгдэхүүн</span>
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setImgStep("select")}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                      >
                        Буцах
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveInjections}
                        disabled={imgLoading}
                        className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-60"
                      >
                        {imgLoading ? "Хадгалж байна..." : "Хадгалах"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* STEP: SAVING */}
            {imgStep === "saving" && (
              <div className="px-6 py-12 flex flex-col items-center justify-center gap-3 text-slate-400 flex-1">
                <svg className="w-8 h-8 animate-spin text-[#D32F2F]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm font-semibold">Зургуудыг хадгалж байна...</span>
              </div>
            )}

            {imgSuccess && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl shrink-0 flex items-center justify-center gap-2 text-emerald-600 text-sm font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Зургууд амжилттай хадгалагдлаа!
              </div>
            )}
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
                              <p className="text-[10px] text-slate-400 font-medium">Санал болгох хэмжээ: 1200×1200px, дөрвөлжин (1:1) харьцаатай</p>
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

      {/* History Modal */}
      {historyOpen && historyProduct && (() => {
        const pageCount = Math.ceil(historyData.length / HISTORY_PAGE_SIZE);
        const pageSafe = Math.min(historyPage, Math.max(1, pageCount));
        const pagedHistory = historyData.slice((pageSafe - 1) * HISTORY_PAGE_SIZE, pageSafe * HISTORY_PAGE_SIZE);

        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl animate-fade-in relative max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Нөөцийн хөдөлгөөний түүх</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{historyProduct.name} · ({historyProduct.slug})</p>
                </div>
                <button
                  onClick={() => { setHistoryOpen(false); setHistoryProduct(null); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                    <svg className="w-8 h-8 animate-spin text-[#D32F2F]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm font-semibold">Түүхийг ачаалж байна...</span>
                  </div>
                ) : historyData.length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                    <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-semibold">Барааны хөдөлгөөний түүх олдсонгүй.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold uppercase text-slate-500">
                          <th className="px-5 py-3">Огноо</th>
                          <th className="px-5 py-3">Үйлдэл / Төрөл</th>
                          <th className="px-5 py-3">Баримтын №</th>
                          <th className="px-5 py-3 text-right">Тоо хэмжээ</th>
                          <th className="px-5 py-3 text-right">Өмнөх үлдэгдэл</th>
                          <th className="px-5 py-3">Хариуцагч / Ажилтан</th>
                          <th className="px-5 py-3">Тайлбар</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedHistory.map((item, index) => {
                          const isAdd = item.flow === "orlogo";
                          const dateStr = item.date ? new Date(item.date).toLocaleString("mn-MN") : "—";
                          return (
                            <tr key={index} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-3 text-xs font-medium text-slate-500 font-mono whitespace-nowrap">{dateStr}</td>
                              <td className="px-5 py-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  item.type === "Захиалга" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                  item.type === "Орлого" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                  item.type === "Зарлага" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                  item.type === "pos" ? "bg-violet-50 text-violet-700 border-violet-200" :
                                  item.type === "Онлайн" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                  "bg-slate-100 text-slate-600 border-slate-200"
                                }`}>
                                  {item.type}
                                </span>
                              </td>
                              <td className="px-5 py-3 font-mono text-xs font-bold text-slate-700">{item.refNo || "—"}</td>
                              <td className="px-5 py-3 text-right font-semibold">
                                <span className={isAdd ? "text-emerald-600" : "text-rose-600"}>
                                  {isAdd ? "+" : "-"}{item.qty}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-right text-slate-400 font-medium font-mono">{item.prevStock !== undefined ? item.prevStock : "—"}</td>
                              <td className="px-5 py-3 text-slate-700 font-medium">{item.actor || "—"}</td>
                              <td className="px-5 py-3 text-xs text-slate-400 max-w-[200px] truncate" title={item.note}>{item.note || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Footer / Pagination */}
              {!historyLoading && pageCount > 1 && (
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl shrink-0 flex items-center justify-between gap-3 mt-auto">
                  <p className="text-xs text-slate-400">
                    Нийт {historyData.length} бичлэгээс {(pageSafe - 1) * HISTORY_PAGE_SIZE + 1}–{Math.min(pageSafe * HISTORY_PAGE_SIZE, historyData.length)}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setHistoryPage(pageSafe - 1)}
                      disabled={pageSafe <= 1}
                      className="min-w-8 h-8 px-2 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:border-[#D32F2F] hover:text-[#D32F2F] disabled:opacity-40 disabled:cursor-not-allowed bg-white"
                    >
                      ‹
                    </button>
                    {Array.from({ length: pageCount }, (_, i) => i + 1)
                      .filter((n) => n === 1 || n === pageCount || Math.abs(n - pageSafe) <= 1)
                      .map((n, idx, arr) => (
                        <span key={n} className="flex items-center gap-1">
                          {idx > 0 && n - arr[idx - 1] > 1 && <span className="text-slate-400 px-1 text-xs">…</span>}
                          <button
                            onClick={() => setHistoryPage(n)}
                            className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-colors ${
                              n === pageSafe ? "bg-[#D32F2F] text-white animate-fade-in" : "border border-slate-200 text-slate-700 hover:border-[#D32F2F] hover:text-[#D32F2F] bg-white"
                            }`}
                          >
                            {n}
                          </button>
                        </span>
                      ))}
                    <button
                      onClick={() => setHistoryPage(pageSafe + 1)}
                      disabled={pageSafe >= pageCount}
                      className="min-w-8 h-8 px-2 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:border-[#D32F2F] hover:text-[#D32F2F] disabled:opacity-40 disabled:cursor-not-allowed bg-white"
                    >
                      ›
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

