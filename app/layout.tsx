import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TenantAdminProvider } from "./lib/TenantAdminContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ikhNayd Дэлгүүрийн Админ",
  description: "Бүтээгдэхүүн, ангилал, захиалга удирдах дэлгүүрийн удирдлагын самбар",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn" className={inter.variable}>
      <body>
        <TenantAdminProvider>{children}</TenantAdminProvider>
      </body>
    </html>
  );
}
