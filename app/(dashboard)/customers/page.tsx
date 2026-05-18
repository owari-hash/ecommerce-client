"use client";

import { useState } from "react";
import { useTenantAdmin } from "../../lib/TenantAdminContext";
import type { Customer } from "../../lib/types";

export default function CustomersPage() {
  const { customers, orders } = useTenantAdmin();
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Customer | null>(null);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const customerOrders = (customerId: string) =>
    orders.filter((o) => o.customer.email === customers.find((c) => c.id === customerId)?.email);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Харилцагч</h2>
          <p className="text-sm text-slate-400 mt-0.5">Нийт {customers.length} харилцагч бүртгэлтэй</p>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" placeholder="Нэр, и-мэйл, утас..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-3">Харилцагч</th>
                <th className="px-6 py-3">Утас</th>
                <th className="px-6 py-3">Захиалга</th>
                <th className="px-6 py-3">Нийт зарцуулсан</th>
                <th className="px-6 py-3">Статус</th>
                <th className="px-6 py-3">Бүртгэгдсэн</th>
                <th className="px-6 py-3">Дэлгэрэнгүй</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-slate-600 font-bold text-sm">{c.name[0]?.toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-600">{c.phone}</td>
                  <td className="px-6 py-3 text-sm font-semibold text-slate-700">{c.totalOrders}</td>
                  <td className="px-6 py-3 text-sm font-bold text-slate-800">₮{c.totalSpent.toLocaleString()}</td>
                  <td className="px-6 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${c.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                      {c.status === "active" ? "Идэвхтэй" : "Идэвхгүй"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-400">{c.createdAt}</td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => setDetail(c)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors font-semibold"
                    >
                      Харах
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">Харилцагч олдсонгүй</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">Харилцагчийн мэдээлэл</h3>
              <button onClick={() => setDetail(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              {/* Profile */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <span className="text-2xl font-black text-slate-500">{detail.name[0]?.toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800">{detail.name}</p>
                  <p className="text-sm text-slate-500">{detail.email}</p>
                  <p className="text-sm text-slate-500">{detail.phone}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Нийт захиалга</p>
                  <p className="text-2xl font-bold text-slate-800">{detail.totalOrders}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Нийт зарцуулсан</p>
                  <p className="text-xl font-bold text-[#D32F2F]">₮{detail.totalSpent.toLocaleString()}</p>
                </div>
              </div>

              {/* Address */}
              {detail.address && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Хаяг</p>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3">{detail.address}</p>
                </div>
              )}

              {/* Order history */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Захиалгын түүх</p>
                <div className="space-y-2">
                  {customerOrders(detail.id).map((o) => (
                    <div key={o.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 text-sm">
                      <div>
                        <p className="font-semibold text-slate-800">{o.orderNo}</p>
                        <p className="text-xs text-slate-400">{o.createdAt}</p>
                      </div>
                      <p className="font-bold text-slate-700">₮{o.total.toLocaleString()}</p>
                    </div>
                  ))}
                  {customerOrders(detail.id).length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">Захиалга байхгүй</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
