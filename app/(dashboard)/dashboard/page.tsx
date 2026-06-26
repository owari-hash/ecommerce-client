"use client";

import Link from "next/link";
import { useTenantAdmin } from "../../lib/TenantAdminContext";

export default function DashboardPage() {
  const { products, categories, brands, orders, customers } = useTenantAdmin();

  const activeProducts = products.filter((p) => p.status === "active").length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  const stats = [
    {
      label: "Нийт бүтээгдэхүүн",
      value: products.length,
      sub: `${activeProducts} идэвхтэй`,
      color: "text-[#D32F2F]",
      bg: "bg-red-50",
      border: "border-red-100",
      href: "/products",
      icon: (
        <svg className="w-6 h-6 text-[#D32F2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      label: "Захиалга",
      value: orders.length,
      sub: `${pendingOrders} хүлээгдэж байна`,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
      href: "/orders",
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      label: "Харилцагч",
      value: customers.length,
      sub: `${customers.filter((c) => c.status === "active").length} идэвхтэй`,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      href: "/customers",
      icon: (
        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      label: "Нийт орлого",
      value: totalRevenue >= 100_000_000
        ? `₮${(totalRevenue / 1_000_000).toFixed(1)}M`
        : `₮${totalRevenue.toLocaleString()}`,
      sub: "Цуцлагдаагүй бүх захиалга",
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
      href: "/orders",
      icon: (
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const recentOrders = [...orders]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const statusStyle: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700",
    processing: "bg-blue-50 text-blue-700",
    shipped: "bg-indigo-50 text-indigo-700",
    delivered: "bg-emerald-50 text-emerald-700",
    cancelled: "bg-red-50 text-red-500",
  };

  const statusLabel: Record<string, string> = {
    pending: "Хүлээгдэж байна",
    processing: "Боловсруулж байна",
    shipped: "Илгээгдсэн",
    delivered: "Хүргэгдсэн",
    cancelled: "Цуцлагдсан",
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={`bg-white rounded-2xl p-5 shadow-sm border ${s.border} hover:shadow-md transition-all group`}
          >
            <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${s.bg} mb-4 group-hover:scale-110 transition-transform`}>
              {s.icon}
            </div>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-700 text-sm font-medium mt-0.5">{s.label}</p>
            <p className="text-slate-400 text-xs mt-0.5">{s.sub}</p>
          </Link>
        ))}
      </div>

      {/* Alerts */}
      {outOfStock > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-yellow-800 font-medium">
            <span className="font-bold">{outOfStock}</span> бүтээгдэхүүн нөөцгүй байна.{" "}
            <Link href="/products" className="underline hover:text-yellow-900">Нөөц нэмэх </Link>
          </p>
        </div>
      )}

      {/* Overview row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Сүүлийн захиалга</h2>
            <Link href="/orders" className="text-[#D32F2F] text-sm font-medium hover:underline">
              Бүгдийг харах 
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentOrders.map((o) => (
              <div key={o.id} className="px-6 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{o.orderNo}</p>
                  <p className="text-xs text-slate-400">{o.customer.name} · {o.createdAt}</p>
                </div>
                <p className="text-sm font-bold text-slate-700">₮{o.total.toLocaleString()}</p>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${statusStyle[o.status]}`}>
                  {statusLabel[o.status]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <h2 className="font-semibold text-slate-800 px-1">Хурдан үйлдэл</h2>
          {[
            { href: "/products", label: "Бүтээгдэхүүн нэмэх", desc: "Каталогт шинэ бараа оруулах", color: "#D32F2F",
              icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> },
            { href: "/categories", label: "Ангилал нэмэх", desc: "Бараа ангиллын бүтэц", color: "#2563eb",
              icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
            { href: "/settings", label: "Дэлгүүр тохируулах", desc: "Нэр, өнгө, мэдээлэл засах", color: "#7c3aed",
              icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
          ].map((a) => (
            <Link key={a.href} href={a.href} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-start gap-3 group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white group-hover:scale-110 transition-transform" style={{ backgroundColor: a.color }}>
                {a.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{a.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{a.desc}</p>
              </div>
            </Link>
          ))}

          {/* Mini catalog summary */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Каталог</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Ангилал</span>
                <span className="font-semibold text-slate-800">{categories.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Брэнд</span>
                <span className="font-semibold text-slate-800">{brands.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Нөөцгүй</span>
                <span className={`font-semibold ${outOfStock > 0 ? "text-yellow-600" : "text-slate-800"}`}>{outOfStock}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
