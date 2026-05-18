"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTenantAdmin } from "../lib/TenantAdminContext";

const TITLES: Record<string, string> = {
  "/dashboard": "Хянах самбар",
  "/products": "Бүтээгдэхүүн",
  "/categories": "Ангилал",
  "/brands": "Брэнд",
  "/orders": "Захиалга",
  "/customers": "Харилцагч",
  "/settings": "Дэлгүүрийн тохиргоо",
};

const ROLE_LABEL: Record<string, string> = {
  owner: "Эзэн",
  manager: "Менежер",
  editor: "Редактор",
};

export default function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const path = usePathname();
  const router = useRouter();
  const { currentUser, logout, settings } = useTenantAdmin();

  const title = TITLES[path] ?? "";
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="h-[60px] bg-white border-b border-slate-200 flex items-center px-4 md:px-6 sticky top-0 z-40 shadow-sm gap-3">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="mr-1 p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors md:hidden"
        aria-label="Цэс нээх"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Page title */}
      <div className="flex items-center gap-2.5">
        <div className="w-1 h-5 bg-[#D32F2F] rounded-full hidden sm:block" />
        <h1 className="text-base font-semibold text-slate-800">{title}</h1>
      </div>

      <div className="flex-1" />

      {/* Store badge */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: settings.primaryColor }}
        />
        <span className="text-sm text-slate-600 font-medium truncate max-w-[140px]">
          {settings.storeName}
        </span>
      </div>

      {/* User menu */}
      <div className="relative" ref={userRef}>
        <button
          id="user-menu-btn"
          onClick={() => setUserMenuOpen((v) => !v)}
          className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-[#D32F2F]/10 flex items-center justify-center">
            <span className="text-[#D32F2F] font-bold text-sm">
              {currentUser?.name?.[0]?.toUpperCase() ?? "О"}
            </span>
          </div>
          <svg className="w-4 h-4 text-slate-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {userMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800 truncate">{currentUser?.name}</p>
              <p className="text-xs text-slate-400 truncate">{currentUser?.email}</p>
              <span className="inline-block mt-1 text-[10px] bg-red-50 text-[#D32F2F] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                {ROLE_LABEL[currentUser?.role ?? "owner"] ?? "Эзэн"}
              </span>
            </div>
            <div className="p-1.5">
              <button
                onClick={handleLogout}
                id="logout-btn"
                className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Гарах
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
