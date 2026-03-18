"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { LayoutDashboard, School, Calendar } from "lucide-react";
import { SidebarItem } from "@/components/layout/Sidebar";

const sidebarItems: SidebarItem[] = [
  { label: "Trang chủ", href: "/teacher", icon: LayoutDashboard },
  { label: "Lớp học", href: "/teacher/classes", icon: School },
  { label: "Thời khóa biểu", href: "/teacher/schedule", icon: Calendar },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "teacher")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || user.role !== "teacher") {
    return null;
  }

  return (
    <DashboardShell
      sidebarItems={sidebarItems}
      sidebarTitle="Giáo Viên"
      accentColor="bg-green-600"
    >
      {children}
    </DashboardShell>
  );
}
