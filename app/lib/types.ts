// ─── Product ──────────────────────────────────────────────────────────────────

export type ProductStatus = "active" | "inactive" | "draft";

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice: number | null;
  stock: number;
  categoryId: string;
  brandId: string;
  images: string[];
  tags: string[];
  featured: boolean;
  status: ProductStatus;
  createdAt: string;
};

// ─── Category ─────────────────────────────────────────────────────────────────

export type Category = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  image: string;
  status: "active" | "inactive";
  createdAt: string;
};

// ─── Brand ───────────────────────────────────────────────────────────────────

export type Brand = {
  id: string;
  name: string;
  slug: string;
  logo: string;
  status: "active" | "inactive";
  createdAt: string;
};

// ─── Order ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderItem = {
  productId: string;
  productName: string;
  qty: number;
  price: number;
};

export type Order = {
  id: string;
  orderNo: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  note: string;
  createdAt: string;
};

// ─── Customer ────────────────────────────────────────────────────────────────

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  status: "active" | "inactive";
  createdAt: string;
};

// ─── Tenant User (admin of the store) ────────────────────────────────────────

export type TenantUserRole = "owner" | "manager" | "editor";

export type TenantUser = {
  id: string;
  name: string;
  email: string;
  /** Stored plaintext for demo — hash in production */
  password: string;
  role: TenantUserRole;
  createdAt: string;
  lastLogin: string | null;
  status: "active" | "inactive";
};

// ─── Store Settings ───────────────────────────────────────────────────────────

export type StoreSettings = {
  storeName: string;
  logo: string;
  primaryColor: string;
  font: string;
  bannerTitle: string;
  bannerSubtitle: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  features: {
    reviews: boolean;
    chat: boolean;
    loyaltyProgram: boolean;
  };
};
