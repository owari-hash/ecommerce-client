"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTenantAdmin } from "../lib/TenantAdminContext";

export default function LoginPage() {
  const { login } = useTenantAdmin();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const ok = login(email.trim(), password);
    if (ok) {
      router.replace("/dashboard");
    } else {
      setError("И-мэйл эсвэл нууц үг буруу байна.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glows */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #D32F2F 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #EF5350 0%, transparent 70%)" }}
      />

      <div className="w-full max-w-md animate-fade-in">
        {/* Brand mark */}
        <div className="flex items-center gap-3 mb-8 px-1">
          <div className="w-2.5 h-10 bg-gradient-to-b from-[#EF5350] to-[#B71C1C] rounded-full" />
          <div>
           
            <p className="text-[#D32F2F] text-xs font-semibold mt-0.5 tracking-wide uppercase">
              Дэлгүүрийн Удирдлага
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-white font-semibold text-xl mb-6">Нэвтрэх</h1>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="login-email" className="block text-slate-300 text-sm font-medium mb-1.5">
                И-мэйл
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="owner@shop.mn"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/50 focus:border-[#D32F2F]/60 transition-all"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-slate-300 text-sm font-medium mb-1.5">
                Нууц үг
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/50 focus:border-[#D32F2F]/60 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showPw ? "Нуух" : "Харах"}
                >
                  {showPw ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              id="login-submit"
              className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-red-900/30 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Нэвтэрч байна...
                </span>
              ) : (
                "Нэвтрэх"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-xs text-slate-500 text-center space-y-0.5">
            <p>Demo: <span className="text-slate-400">owner@shop.mn</span></p>
            <p>Нууц үг: <span className="text-slate-400">owner1234</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
