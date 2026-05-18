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
  "/renters": "Түрээслэгч",
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
  const { currentUser, currentRenter, logout, settings } = useTenantAdmin();

  const isRenter = currentRenter !== null;
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

  const displayName = isRenter ? currentRenter.name : (currentUser?.name ?? "");
  const displayEmail = isRenter ? currentRenter.email : (currentUser?.email ?? "");
  const displayInitial = displayName[0]?.toUpperCase() ?? "Т";
  const roleLabel = isRenter
    ? `Түрээслэгч · ${currentRenter.storeName}`
    : (ROLE_LABEL[currentUser?.role ?? "owner"] ?? "Эзэн");

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
        <div className={`w-1 h-5 rounded-full hidden sm:block ${isRenter ? "bg-amber-500" : "bg-[#D32F2F]"}`} />
        <h1 className="text-base font-semibold text-slate-800">{title}</h1>
      </div>

      <div className="flex-1" />

      {/* Renter store badge */}
      {isRenter && (
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl">
          <svg className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="text-sm text-amber-700 font-semibold truncate max-w-[140px]">
            {currentRenter.storeName}
          </span>
        </div>
      )}

      {/* Store badge for owner */}
      {!isRenter && (
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: settings.primaryColor }}
          />
          <span className="text-sm text-slate-600 font-medium truncate max-w-[140px]">
            {settings.storeName}
          </span>
        </div>
      )}

      {/* User menu */}
      <div className="relative" ref={userRef}>
        <button
          id="user-menu-btn"
          onClick={() => setUserMenuOpen((v) => !v)}
          className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isRenter ? "bg-amber-500/10" : "bg-[#D32F2F]/10"}`}>
            <span className={`font-bold text-sm ${isRenter ? "text-amber-600" : "text-[#D32F2F]"}`}>
              {displayInitial}
            </span>
          </div>
          <svg className="w-4 h-4 text-slate-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {userMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800 truncate">{displayName}</p>
              <p className="text-xs text-slate-400 truncate">{displayEmail}</p>
              <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${isRenter ? "bg-amber-50 text-amber-700" : "bg-red-50 text-[#D32F2F]"}`}>
                {roleLabel}
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
