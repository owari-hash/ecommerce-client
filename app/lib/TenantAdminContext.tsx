"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type {
  TenantUser,
  Product,
  Category,
  Brand,
  Order,
  Customer,
  StoreSettings,
  Renter,
} from "./types";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_USERS: TenantUser[] = [
  {
    id: "u1",
    name: "Дэлгүүр Эзэн",
    email: "owner@shop.mn",
    password: "owner1234",
    role: "owner",
    createdAt: "2026-05-01",
    lastLogin: null,
    status: "active",
  },
];

const SEED_RENTERS: Renter[] = [
  {
    id: "r1",
    name: "Болд Дорж",
    storeName: "Bold Fashion",
    email: "bold@renter.mn",
    password: "renter1234",
    createdAt: "2026-05-10",
    lastLogin: null,
    status: "active",
  },
];

const SEED_CATEGORIES: Category[] = [
  { id: "cat1", name: "Электроник", slug: "electronics", parentId: null, image: "", status: "active", createdAt: "2026-05-01" },
  { id: "cat2", name: "Хувцас", slug: "clothing", parentId: null, image: "", status: "active", createdAt: "2026-05-01" },
  { id: "cat3", name: "Гэр ахуй", slug: "home", parentId: null, image: "", status: "active", createdAt: "2026-05-01" },
  { id: "cat4", name: "Утас & Таблет", slug: "phones", parentId: "cat1", image: "", status: "active", createdAt: "2026-05-01" },
  { id: "cat5", name: "Зурагт & Дуу чимээ", slug: "tv-audio", parentId: "cat1", image: "", status: "active", createdAt: "2026-05-01" },
];

const SEED_BRANDS: Brand[] = [
  { id: "br1", name: "Samsung", slug: "samsung", logo: "", description: "", renterId: null, status: "active", createdAt: "2026-05-01" },
  { id: "br2", name: "Apple", slug: "apple", logo: "", description: "", renterId: null, status: "active", createdAt: "2026-05-01" },
  { id: "br3", name: "LG", slug: "lg", logo: "", description: "", renterId: null, status: "active", createdAt: "2026-05-01" },
  { id: "br4", name: "Nike", slug: "nike", logo: "", description: "", renterId: null, status: "active", createdAt: "2026-05-01" },
  { id: "br5", name: "Adidas", slug: "adidas", logo: "", description: "", renterId: null, status: "active", createdAt: "2026-05-01" },
  { id: "br6", name: "Bold Fashion", slug: "bold-fashion", logo: "", description: "", renterId: "r1", status: "active", createdAt: "2026-05-10" },
];

const SEED_PRODUCTS: Product[] = [
  {
    id: "p1", name: "Samsung Galaxy A55", slug: "samsung-galaxy-a55",
    description: "6.6 инч Super AMOLED дэлгэц, 50MP камер", price: 1200000, salePrice: 1099000,
    stock: 24, categoryId: "cat4", brandId: "br1", images: [], tags: ["утас", "android"],
    featured: true, status: "active", renterId: null, createdAt: "2026-05-01",
  },
  {
    id: "p2", name: "Apple iPhone 15", slug: "apple-iphone-15",
    description: "6.1 инч Super Retina XDR дэлгэц, A16 Bionic чип", price: 2500000, salePrice: null,
    stock: 10, categoryId: "cat4", brandId: "br2", images: [], tags: ["утас", "ios"],
    featured: true, status: "active", renterId: null, createdAt: "2026-05-01",
  },
  {
    id: "p3", name: "LG OLED 55\" TV", slug: "lg-oled-55-tv",
    description: "55 инч 4K OLED Smart TV, webOS", price: 3200000, salePrice: 2900000,
    stock: 5, categoryId: "cat5", brandId: "br3", images: [], tags: ["зурагт", "oled"],
    featured: false, status: "active", renterId: null, createdAt: "2026-05-02",
  },
  {
    id: "p4", name: "Nike Air Max 2025", slug: "nike-air-max-2025",
    description: "Гүйлтийн гутал, хөнгөн материал", price: 350000, salePrice: null,
    stock: 40, categoryId: "cat2", brandId: "br4", images: [], tags: ["гутал", "спорт"],
    featured: false, status: "active", renterId: null, createdAt: "2026-05-03",
  },
  {
    id: "p5", name: "Adidas Ultraboost 24", slug: "adidas-ultraboost-24",
    description: "Тав тухтай гүйлтийн гутал, Boost технологи", price: 320000, salePrice: 280000,
    stock: 0, categoryId: "cat2", brandId: "br5", images: [], tags: ["гутал", "спорт"],
    featured: false, status: "inactive", renterId: null, createdAt: "2026-05-03",
  },
  {
    id: "p6", name: "Bold Fashion Цамц", slug: "bold-fashion-shirt",
    description: "Үдийн цагт тохирох хөнгөн цамц", price: 89000, salePrice: null,
    stock: 15, categoryId: "cat2", brandId: "br6", images: [], tags: ["цамц"],
    featured: false, status: "active", renterId: "r1", createdAt: "2026-05-12",
  },
];

const SEED_ORDERS: Order[] = [
  {
    id: "o1", orderNo: "ORD-2026-001",
    customer: { name: "Бат-Эрдэнэ Дорж", email: "bat@example.mn", phone: "99001122" },
    items: [{ productId: "p1", productName: "Samsung Galaxy A55", qty: 1, price: 1099000 }],
    subtotal: 1099000, total: 1099000, status: "pending", note: "", createdAt: "2026-05-10",
  },
  {
    id: "o2", orderNo: "ORD-2026-002",
    customer: { name: "Дэлгэрмаа Очир", email: "delger@example.mn", phone: "88223344" },
    items: [{ productId: "p4", productName: "Nike Air Max 2025", qty: 2, price: 350000 }],
    subtotal: 700000, total: 700000, status: "processing", note: "Хурдан хүргэх", createdAt: "2026-05-11",
  },
  {
    id: "o3", orderNo: "ORD-2026-003",
    customer: { name: "Номин-Эрдэнэ Гантулга", email: "nomin@example.mn", phone: "77334455" },
    items: [{ productId: "p2", productName: "Apple iPhone 15", qty: 1, price: 2500000 }],
    subtotal: 2500000, total: 2500000, status: "delivered", note: "", createdAt: "2026-05-08",
  },
  {
    id: "o4", orderNo: "ORD-2026-004",
    customer: { name: "Энхбаяр Лхагва", email: "enkh@example.mn", phone: "99445566" },
    items: [{ productId: "p3", productName: "LG OLED 55\" TV", qty: 1, price: 2900000 }],
    subtotal: 2900000, total: 2900000, status: "shipped", note: "", createdAt: "2026-05-12",
  },
];

const SEED_CUSTOMERS: Customer[] = [
  { id: "c1", name: "Бат-Эрдэнэ Дорж", email: "bat@example.mn", phone: "99001122", address: "Улаанбаатар, СБД, 1-р хороо", totalOrders: 3, totalSpent: 3400000, status: "active", createdAt: "2026-04-01" },
  { id: "c2", name: "Дэлгэрмаа Очир", email: "delger@example.mn", phone: "88223344", address: "Улаанбаатар, БЗД, 3-р хороо", totalOrders: 1, totalSpent: 700000, status: "active", createdAt: "2026-05-11" },
  { id: "c3", name: "Номин-Эрдэнэ Гантулга", email: "nomin@example.mn", phone: "77334455", address: "Улаанбаатар, ХУД, 5-р хороо", totalOrders: 2, totalSpent: 2800000, status: "active", createdAt: "2026-03-15" },
  { id: "c4", name: "Энхбаяр Лхагва", email: "enkh@example.mn", phone: "99445566", address: "Улаанбаатар, ЧД, 2-р хороо", totalOrders: 1, totalSpent: 2900000, status: "active", createdAt: "2026-05-12" },
];

const SEED_SETTINGS: StoreSettings = {
  storeName: "Их наяд плаза",
  logo: "",
  primaryColor: "#D32F2F",
  font: "Inter",
  bannerTitle: "Хамгийн шилдэг бараанууд",
  bannerSubtitle: "Хямдрал, шинэ бараа, хүргэлт",
  contactEmail: "info@shop.mn",
  contactPhone: "7700-1234",
  address: "Улаанбаатар хот, Сүхбаатар дүүрэг",
  features: { reviews: true, chat: false, loyaltyProgram: false },
};

// ─── Storage helpers ──────────────────────────────────────────────────────────

const KEYS = {
  users: "ikna_client_users",
  session: "ikna_client_session",
  renters: "ikna_client_renters",
  renterSession: "ikna_client_renter_session",
  products: "ikna_client_products",
  categories: "ikna_client_categories",
  brands: "ikna_client_brands",
  orders: "ikna_client_orders",
  customers: "ikna_client_customers",
  settings: "ikna_client_settings",
};

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : fallback;
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Context shape ────────────────────────────────────────────────────────────

type TenantAdminCtx = {
  // Auth
  currentUser: TenantUser | null;
  currentRenter: Renter | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;

  // Renters CRUD (owner/manager only)
  renters: Renter[];
  addRenter: (r: Omit<Renter, "id" | "createdAt" | "lastLogin">, brand?: { logo: string; description: string }) => void;
  updateRenter: (id: string, patch: Partial<Omit<Renter, "id">>) => void;
  deleteRenter: (id: string) => void;

  // Products
  products: Product[];
  addProduct: (p: Omit<Product, "id" | "createdAt">) => void;
  updateProduct: (id: string, patch: Partial<Omit<Product, "id">>) => void;
  deleteProduct: (id: string) => void;

  // Categories
  categories: Category[];
  addCategory: (c: Omit<Category, "id" | "createdAt">) => void;
  updateCategory: (id: string, patch: Partial<Omit<Category, "id">>) => void;
  deleteCategory: (id: string) => void;

  // Brands
  brands: Brand[];
  addBrand: (b: Omit<Brand, "id" | "createdAt">) => void;
  updateBrand: (id: string, patch: Partial<Omit<Brand, "id">>) => void;
  deleteBrand: (id: string) => void;

  // Orders
  orders: Order[];
  updateOrderStatus: (id: string, status: Order["status"]) => void;

  // Customers
  customers: Customer[];

  // Settings
  settings: StoreSettings;
  updateSettings: (patch: Partial<StoreSettings>) => void;
};

const TenantAdminContext = createContext<TenantAdminCtx | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function TenantAdminProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<TenantUser | null>(null);
  const [currentRenter, setCurrentRenter] = useState<Renter | null>(null);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [renters, setRenters] = useState<Renter[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(SEED_SETTINGS);

  useEffect(() => {
    const storedUsers = load<TenantUser[]>(KEYS.users, SEED_USERS);
    const storedRenters = load<Renter[]>(KEYS.renters, SEED_RENTERS);
    const sessionId = load<string | null>(KEYS.session, null);
    const renterSessionId = load<string | null>(KEYS.renterSession, null);

    if (!localStorage.getItem(KEYS.users)) save(KEYS.users, SEED_USERS);
    if (!localStorage.getItem(KEYS.renters)) save(KEYS.renters, SEED_RENTERS);
    if (!localStorage.getItem(KEYS.products)) save(KEYS.products, SEED_PRODUCTS);
    if (!localStorage.getItem(KEYS.categories)) save(KEYS.categories, SEED_CATEGORIES);
    if (!localStorage.getItem(KEYS.brands)) save(KEYS.brands, SEED_BRANDS);
    if (!localStorage.getItem(KEYS.orders)) save(KEYS.orders, SEED_ORDERS);
    if (!localStorage.getItem(KEYS.customers)) save(KEYS.customers, SEED_CUSTOMERS);
    if (!localStorage.getItem(KEYS.settings)) save(KEYS.settings, SEED_SETTINGS);

    setUsers(storedUsers);
    setRenters(storedRenters);
    setProducts(load<Product[]>(KEYS.products, SEED_PRODUCTS));
    setCategories(load<Category[]>(KEYS.categories, SEED_CATEGORIES));
    setBrands(load<Brand[]>(KEYS.brands, SEED_BRANDS));
    setOrders(load<Order[]>(KEYS.orders, SEED_ORDERS));
    setCustomers(load<Customer[]>(KEYS.customers, SEED_CUSTOMERS));
    setSettings(load<StoreSettings>(KEYS.settings, SEED_SETTINGS));

    if (sessionId) {
      const user = storedUsers.find((u) => u.id === sessionId) ?? null;
      setCurrentUser(user);
    } else if (renterSessionId) {
      const renter = storedRenters.find((r) => r.id === renterSessionId) ?? null;
      setCurrentRenter(renter);
    }

    // Fetch from backend
    const searchParams = new URLSearchParams(window.location.search);
    const tenantParam = searchParams.get('tenant');
    const qs = tenantParam ? `?tenant=${encodeURIComponent(tenantParam)}` : '';

    fetch(`${API_BASE}/api/config${qs}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.branding) {
          const fetchedSettings: StoreSettings = {
            storeName: data.branding.name || "",
            logo: data.branding.logo || "",
            primaryColor: data.branding.primaryColor || "#D32F2F",
            font: data.branding.font || "Inter",
            bannerTitle: data.theme?.homepageSections?.[0]?.props?.title || "",
            bannerSubtitle: data.theme?.homepageSections?.[0]?.props?.subtitle || "",
            contactEmail: data.contact?.email || "",
            contactPhone: data.contact?.phone || "",
            address: data.contact?.address || "",
            features: data.features || { reviews: false, chat: false, loyaltyProgram: false },
          };
          setSettings(fetchedSettings);
          save(KEYS.settings, fetchedSettings);
        }
      })
      .catch((err) => console.error("Failed to fetch initial config", err))
      .finally(() => {
        setReady(true);
      });
  }, []);

  // ── Auth ────────────────────────────────────────────────────────────────────

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      // 1. Try real backend authentication API
      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        if (res.ok) {
          const body = await res.json();
          const { token, user } = body.data;

          // Save the token
          localStorage.setItem("ikna_admin_token", token);

          const tenantUser: TenantUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            password: "", // No local plain text password
            role: user.role === "superadmin" ? "owner" : "manager",
            createdAt: new Date().toISOString().slice(0, 10),
            lastLogin: new Date().toISOString().slice(0, 10),
            status: "active",
          };

          // Save session
          save(KEYS.session, user.id);
          localStorage.setItem(KEYS.users, JSON.stringify([tenantUser]));
          localStorage.removeItem(KEYS.renterSession);
          setCurrentUser(tenantUser);
          setCurrentRenter(null);
          return true;
        }
      } catch (e) {
        console.error("Backend auth failed, attempting offline mock data:", e);
      }

      // 2. Offline fallback to local TenantUser
      const user = users.find(
        (u) =>
          u.email.toLowerCase() === email.toLowerCase() &&
          u.password === password &&
          u.status === "active"
      );
      if (user) {
        const updatedUsers = users.map((u) =>
          u.id === user.id ? { ...u, lastLogin: new Date().toISOString().slice(0, 10) } : u
        );
        setUsers(updatedUsers);
        save(KEYS.users, updatedUsers);
        save(KEYS.session, user.id);
        localStorage.removeItem(KEYS.renterSession);
        setCurrentUser({ ...user, lastLogin: new Date().toISOString().slice(0, 10) });
        setCurrentRenter(null);
        return true;
      }

      // 3. Offline fallback to local Renter
      const renter = renters.find(
        (r) =>
          r.email.toLowerCase() === email.toLowerCase() &&
          r.password === password &&
          r.status === "active"
      );
      if (renter) {
        const updatedRenters = renters.map((r) =>
          r.id === renter.id ? { ...r, lastLogin: new Date().toISOString().slice(0, 10) } : r
        );
        setRenters(updatedRenters);
        save(KEYS.renters, updatedRenters);
        save(KEYS.renterSession, renter.id);
        localStorage.removeItem(KEYS.session);
        setCurrentRenter({ ...renter, lastLogin: new Date().toISOString().slice(0, 10) });
        setCurrentUser(null);
        return true;
      }

      return false;
    },
    [users, renters]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(KEYS.session);
    localStorage.removeItem(KEYS.renterSession);
    localStorage.removeItem("ikna_admin_token");
    setCurrentUser(null);
    setCurrentRenter(null);
  }, []);

  // ── Renters CRUD ─────────────────────────────────────────────────────────────

  const addRenter = useCallback(
    (r: Omit<Renter, "id" | "createdAt" | "lastLogin">, brand?: { logo: string; description: string }) => {
      const ts = Date.now();
      const renterId = `r${ts}`;
      const brandId = `br${ts}`;
      const today = new Date().toISOString().slice(0, 10);

      const newRenter: Renter = { ...r, id: renterId, createdAt: today, lastLogin: null };
      const newBrand: Brand = {
        id: brandId,
        name: r.storeName,
        slug: r.storeName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        logo: brand?.logo ?? "",
        description: brand?.description ?? "",
        renterId,
        status: "active",
        createdAt: today,
      };

      const nextRenters = [...renters, newRenter];
      const nextBrands = [...brands, newBrand];
      setRenters(nextRenters);
      setBrands(nextBrands);
      save(KEYS.renters, nextRenters);
      save(KEYS.brands, nextBrands);
    },
    [renters, brands]
  );

  const updateRenter = useCallback(
    (id: string, patch: Partial<Omit<Renter, "id">>) => {
      const nextRenters = renters.map((r) => (r.id === id ? { ...r, ...patch } : r));
      setRenters(nextRenters);
      save(KEYS.renters, nextRenters);

      // Sync brand name/slug if storeName changed
      if (patch.storeName) {
        const nextBrands = brands.map((b) =>
          b.renterId === id
            ? {
                ...b,
                name: patch.storeName!,
                slug: patch.storeName!.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
              }
            : b
        );
        setBrands(nextBrands);
        save(KEYS.brands, nextBrands);
      }
    },
    [renters, brands]
  );

  const deleteRenter = useCallback(
    (id: string) => {
      const nextRenters = renters.filter((r) => r.id !== id);
      setRenters(nextRenters);
      save(KEYS.renters, nextRenters);

      // Detach brand (keep brand, clear the renter link)
      const nextBrands = brands.map((b) => (b.renterId === id ? { ...b, renterId: null } : b));
      setBrands(nextBrands);
      save(KEYS.brands, nextBrands);
    },
    [renters, brands]
  );

  // ── Products CRUD ────────────────────────────────────────────────────────────

  const addProduct = useCallback(
    (p: Omit<Product, "id" | "createdAt">) => {
      const next = [...products, { ...p, id: `p${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) }];
      setProducts(next);
      save(KEYS.products, next);
    },
    [products]
  );

  const updateProduct = useCallback(
    (id: string, patch: Partial<Omit<Product, "id">>) => {
      const next = products.map((p) => (p.id === id ? { ...p, ...patch } : p));
      setProducts(next);
      save(KEYS.products, next);
    },
    [products]
  );

  const deleteProduct = useCallback(
    (id: string) => {
      const next = products.filter((p) => p.id !== id);
      setProducts(next);
      save(KEYS.products, next);
    },
    [products]
  );

  // ── Categories CRUD ──────────────────────────────────────────────────────────

  const addCategory = useCallback(
    (c: Omit<Category, "id" | "createdAt">) => {
      const next = [...categories, { ...c, id: `cat${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) }];
      setCategories(next);
      save(KEYS.categories, next);
    },
    [categories]
  );

  const updateCategory = useCallback(
    (id: string, patch: Partial<Omit<Category, "id">>) => {
      const next = categories.map((c) => (c.id === id ? { ...c, ...patch } : c));
      setCategories(next);
      save(KEYS.categories, next);
    },
    [categories]
  );

  const deleteCategory = useCallback(
    (id: string) => {
      const next = categories.filter((c) => c.id !== id);
      setCategories(next);
      save(KEYS.categories, next);
    },
    [categories]
  );

  // ── Brands CRUD ──────────────────────────────────────────────────────────────

  const addBrand = useCallback(
    (b: Omit<Brand, "id" | "createdAt">) => {
      const next = [...brands, { ...b, id: `br${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) }];
      setBrands(next);
      save(KEYS.brands, next);
    },
    [brands]
  );

  const updateBrand = useCallback(
    (id: string, patch: Partial<Omit<Brand, "id">>) => {
      const next = brands.map((b) => (b.id === id ? { ...b, ...patch } : b));
      setBrands(next);
      save(KEYS.brands, next);
    },
    [brands]
  );

  const deleteBrand = useCallback(
    (id: string) => {
      const next = brands.filter((b) => b.id !== id);
      setBrands(next);
      save(KEYS.brands, next);
    },
    [brands]
  );

  // ── Orders ───────────────────────────────────────────────────────────────────

  const updateOrderStatus = useCallback(
    (id: string, status: Order["status"]) => {
      const next = orders.map((o) => (o.id === id ? { ...o, status } : o));
      setOrders(next);
      save(KEYS.orders, next);
    },
    [orders]
  );

  // ── Settings ─────────────────────────────────────────────────────────────────

  const updateSettings = useCallback(
    async (patch: Partial<StoreSettings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      save(KEYS.settings, next);

      try {
        const searchParams = new URLSearchParams(window.location.search);
        const tenantParam = searchParams.get('tenant');
        const qs = tenantParam ? `?tenant=${encodeURIComponent(tenantParam)}` : '';

        await fetch(`${API_BASE}/api/config${qs}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(patch),
        });
      } catch (err) {
        console.error("Failed to update config on backend:", err);
      }
    },
    [settings]
  );

  if (!ready) return null;

  return (
    <TenantAdminContext.Provider
      value={{
        currentUser,
        currentRenter,
        login,
        logout,
        renters,
        addRenter,
        updateRenter,
        deleteRenter,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        brands,
        addBrand,
        updateBrand,
        deleteBrand,
        orders,
        updateOrderStatus,
        customers,
        settings,
        updateSettings,
      }}
    >
      {children}
    </TenantAdminContext.Provider>
  );
}

export function useTenantAdmin() {
  const ctx = useContext(TenantAdminContext);
  if (!ctx) throw new Error("useTenantAdmin must be used within TenantAdminProvider");
  return ctx;
}
