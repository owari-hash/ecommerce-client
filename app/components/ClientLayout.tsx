"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTenantAdmin } from "../lib/TenantAdminContext";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useTenantAdmin();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setChecked(true);
    if (!currentUser) {
      router.replace("/login");
    }
  }, [currentUser, router]);

  if (!checked) return null;
  if (!currentUser) return null;

  return (
    <>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:ml-[260px] min-h-screen bg-[#f1f5f9] flex flex-col">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 animate-fade-in">{children}</main>
      </div>
    </>
  );
}
