"use client";

import { useState } from "react";
import { useTenantAdmin } from "../../lib/TenantAdminContext";
import type { Order, OrderStatus } from "../../lib/types";

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-500 border-red-200",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Хүлээгдэж байна",
  processing: "Боловсруулж байна",
  shipped: "Илгээгдсэн",
  delivered: "Хүргэгдсэн",
  cancelled: "Цуцлагдсан",
};

const ALL_STATUSES: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];

export default function OrdersPage() {
  const { orders, updateOrderStatus } = useTenantAdmin();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.orderNo.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const sorted = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Захиалга</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Нийт {orders.length} захиалга · {orders.filter((o) => o.status === "pending").length} хүлээгдэж байна
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text" placeholder="Хайх..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["all", ...ALL_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              filterStatus === s
                ? s === "all"
                  ? "bg-slate-800 text-white border-slate-800"
                  : `${STATUS_STYLE[s as OrderStatus]} border`
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
            }`}
          >
            {s === "all" ? "Бүгд" : STATUS_LABEL[s as OrderStatus]}
            <span className="ml-1.5 opacity-70">
              ({s === "all" ? orders.length : orders.filter((o) => o.status === s).length})
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-3">Захиалгын №</th>
                <th className="px-6 py-3">Харилцагч</th>
                <th className="px-6 py-3">Нийт дүн</th>
                <th className="px-6 py-3">Статус</th>
                <th className="px-6 py-3">Огноо</th>
                <th className="px-6 py-3">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((o) => (
                <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3">
                    <button
                      onClick={() => setDetailOrder(o)}
                      className="text-sm font-semibold text-[#D32F2F] hover:underline"
                    >
                      {o.orderNo}
                    </button>
                    <p className="text-xs text-slate-400">{o.items.length} бараа</p>
                  </td>
                  <td className="px-6 py-3">
                    <p className="text-sm font-semibold text-slate-800">{o.customer.name}</p>
                    <p className="text-xs text-slate-400">{o.customer.email}</p>
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-slate-800">
                    ₮{o.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLE[o.status]}`}>
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-400">{o.createdAt}</td>
                  <td className="px-6 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                      className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 cursor-pointer"
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">Захиалга олдсонгүй</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order detail modal */}
      {detailOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{detailOrder.orderNo}</h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[detailOrder.status]}`}>
                  {STATUS_LABEL[detailOrder.status]}
                </span>
              </div>
              <button onClick={() => setDetailOrder(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              {/* Customer */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Харилцагч</p>
                <div className="bg-slate-50 rounded-xl p-4 space-y-1.5">
                  <p className="text-sm font-semibold text-slate-800">{detailOrder.customer.name}</p>
                  <p className="text-sm text-slate-500">{detailOrder.customer.email}</p>
                  <p className="text-sm text-slate-500">{detailOrder.customer.phone}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Захиалсан бараа</p>
                <div className="space-y-2">
                  {detailOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-slate-50 rounded-xl px-4 py-3">
                      <div>
                        <p className="font-semibold text-slate-800">{item.productName}</p>
                        <p className="text-xs text-slate-400">{item.qty} ширхэг × ₮{item.price.toLocaleString()}</p>
                      </div>
                      <p className="font-bold text-slate-700">₮{(item.qty * item.price).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                <p className="text-sm font-semibold text-slate-600">Нийт дүн</p>
                <p className="text-xl font-bold text-slate-800">₮{detailOrder.total.toLocaleString()}</p>
              </div>

              {/* Note */}
              {detailOrder.note && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
                  <span className="font-semibold">Тэмдэглэл:</span> {detailOrder.note}
                </div>
              )}

              {/* Status change */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Статус солих</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => { updateOrderStatus(detailOrder.id, s); setDetailOrder({ ...detailOrder, status: s }); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        detailOrder.status === s ? `${STATUS_STYLE[s]} ring-2 ring-offset-1 ring-current` : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
