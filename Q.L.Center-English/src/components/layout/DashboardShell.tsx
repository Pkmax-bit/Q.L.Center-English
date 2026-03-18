"use client";

import React, { useState } from "react";
import { Sidebar, SidebarItem } from "./Sidebar";
import { Header } from "./Header";

interface DashboardShellProps {
  children: React.ReactNode;
  sidebarItems: SidebarItem[];
  sidebarTitle: string;
  accentColor?: string;
}

export function DashboardShell({
  children,
  sidebarItems,
  sidebarTitle,
  accentColor,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className={mobileOpen ? "block lg:hidden fixed inset-0 z-50" : "hidden"}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
        <div className="fixed left-0 top-0 h-full w-64 z-50 translate-x-0">
          <Sidebar items={sidebarItems} title={sidebarTitle} accentColor={accentColor} />
        </div>
      </div>

      <div className="hidden lg:block">
        <Sidebar items={sidebarItems} title={sidebarTitle} accentColor={accentColor} />
      </div>

      <div className="lg:ml-64">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
