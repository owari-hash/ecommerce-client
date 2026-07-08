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
  /** null = store-owned product; string = renter id who owns it */
  renterId: string | null;
  createdAt: string;
  isPosLinked?: boolean;
  posProductCode?: string;
  isEmLinked?: boolean;
  emProductCode?: string;
};

// ─── Category ─────────────────────────────────────────────────────────────────

export type Category = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  image: string;
  banner?: string;
  status: "active" | "inactive";
  sortOrder: number;
  createdAt: string;
};

// ─── Brand ───────────────────────────────────────────────────────────────────

export type Brand = {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  /** null = store brand; string = renter id who owns this brand */
  renterId: string | null;
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

// ─── Renter (sub-tenant who only manages their own products) ─────────────────

export type Renter = {
  id: string;
  name: string;
  storeName: string;
  email: string;
  /** Stored plaintext for demo — hash in production */
  password: string;
  createdAt: string;
  lastLogin: string | null;
  status: "active" | "inactive";
};

// ─── Store Settings ───────────────────────────────────────────────────────────

export type StoreLocation = {
  name: string;
  district: string;
  address: string;
  phone: string;
  hours: string;
};

export type BannerSlide = {
  href: string;
  title: string;
  subtitle: string;
  emoji: string;
  image: string;
  /** Optional custom image URL override (not saved to DB, UI-only tracking) */
  _customImage?: string;
};

export type BentoTile = {
  label: string;
  sub: string;
  href: string;
  image: string;
};

export type StoreSettings = {
  storeName: string;
  logo: string;
  primaryColor: string;
  font: string;
  description: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerSlidesBig: BannerSlide[];
  bannerSlidesSmall: BannerSlide[];
  bentoTiles: BentoTile[];
  bentoTitle: string;
  bentoType: string;
  bentoBannerImage: string;
  bentoBannerLink: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  features: {
    reviews: boolean;
    chat: boolean;
    loyaltyProgram: boolean;
  };
  promoVisible: boolean;
  promoLabel: string;
  promoDiscount: string;
  promoSubtitle: string;
  promoHref: string;
  locations: StoreLocation[];
  posDbUri?: string;
  posBranchId?: string;
  posOrgId?: string;
  emDbUri?: string;
  emBranchId?: string;
  emOrgId?: string;
  register?: string;
  registerTurul?: "Байгууллага" | "Хувь хүн";
  branches?: StoreBranch[];
  shippingFee?: number;
  shippingFreeThreshold?: number;
  ebarimtTin?: string;
  ebarimtDistrict?: string;
  ebarimtKhoroo?: string;
  ebarimtEnabled?: boolean;
  ebarimtAutoSend?: boolean;
};

export type StoreBranch = {
  id: string;
  name: string;
  register: string;
  systemTurul?: string;
  systemuud?: string[];
  isEnabled: boolean;
};
