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
    const ok = await login(email.trim(), password);
    if (ok) {
      router.replace("/dashboard");
    } else {
      setError("И-мэйл эсвэл нууц үг буруу байна.");
      setLoading(false);
    }
  }

  const BrandMark = ({ compact = false }: { compact?: boolean }) => (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-br from-cyan-400/50 to-blue-500/50 blur-md" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/zev.png"
          alt="Zevtabs"
          className={`relative ${compact ? "w-10 h-10" : "w-12 h-12"} rounded-xl object-contain ring-1 ring-white/15`}
        />
      </div>
      <span className="text-[11px] font-bold tracking-[0.2em] uppercase bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
        Powered by Zevtabs
      </span>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#0b1120]">
      {/* ── Left brand panel (desktop only) ───────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-[#1a0808] via-[#0b1120] to-[#0b1120]">
        {/* Ambient glows */}
        <div
          className="pointer-events-none absolute -top-40 -left-32 w-[32rem] h-[32rem] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #D32F2F 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute top-1/3 -right-32 w-[30rem] h-[30rem] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)" }}
        />
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />

        <div className="relative z-10 flex flex-col justify-center p-14 xl:p-20 w-full">
          {/* Brand mark — pinned to top */}
          <div className="absolute top-12 left-14 xl:left-20">
            <BrandMark />
          </div>

          {/* Headline — vertically centered to align with the form */}
          <div className="max-w-lg">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5 text-[11px] font-semibold text-slate-300 tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Цахим худалдааны нэгдсэн платформ
            </span>

            <h1 className="text-white text-4xl xl:text-5xl font-bold leading-[1.1] mt-6">
              Дэлгүүрээ нэг цонхноос
              <br />
              <span className="bg-gradient-to-r from-[#EF5350] to-[#F59E0B] bg-clip-text text-transparent">
                ухаалгаар удирдаарай.
              </span>
            </h1>

            <p className="text-slate-400 mt-5 text-[15px] leading-relaxed max-w-md">
              Бараа, захиалга, харилцагч, төлбөр тооцоо — бүгдийг нэг дороос. И-Баримт болон QPay-тэй бэлэн уялдаа.
            </p>

            <ul className="mt-9 space-y-3.5">
              {[
                "Бодит цагийн борлуулалтын тайлан",
                "И-Баримт болон QPay нэгдсэн тохиргоо",
                "Олон салбар, олон хэрэглэгчийн удирдлага",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3 text-slate-200 text-sm">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#D32F2F] to-[#B71C1C] flex items-center justify-center shrink-0 shadow-lg shadow-red-900/30">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <p className="absolute bottom-12 left-14 xl:left-20 text-slate-600 text-xs">
            © 2026 Zevtabs. Бүх эрх хуулиар хамгаалагдсан.
          </p>
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative overflow-hidden">
        {/* Mobile ambient glow */}
        <div
          className="lg:hidden pointer-events-none absolute -top-32 -right-24 w-80 h-80 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #D32F2F 0%, transparent 70%)" }}
        />

        <div className="w-full max-w-sm animate-fade-in relative z-10">
          {/* Mobile brand mark */}
          <div className="mb-8 lg:hidden">
            <BrandMark compact />
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-7 sm:p-9 shadow-2xl backdrop-blur-sm">
            <h2 className="text-white font-bold text-2xl">Тавтай морил</h2>
            <p className="text-slate-400 text-sm mt-2 mb-8">Үргэлжлүүлэхийн тулд бүртгэлээрээ нэвтэрнэ үү.</p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="login-email" className="block text-slate-300 text-sm font-medium mb-1.5">
                  И-мэйл хаяг
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="owner@shop.mn"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/50 focus:border-[#D32F2F]/60 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-slate-300 text-sm font-medium mb-1.5">
                  Нууц үг
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    id="login-password"
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-11 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/50 focus:border-[#D32F2F]/60 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                    aria-label={showPw ? "Нуух" : "Харах"}
                  >
                    {showPw ? (
                      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
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
                className="w-full bg-gradient-to-r from-[#EF5350] to-[#D32F2F] hover:from-[#D32F2F] hover:to-[#B71C1C] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-red-900/30 mt-2"
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

            <div className="mt-7 pt-6 border-t border-white/10 text-xs text-slate-500 text-center space-y-0.5">
              <p>Demo: <span className="text-slate-300">owner@shop.mn</span></p>
              <p>Нууц үг: <span className="text-slate-300">owner1234</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
