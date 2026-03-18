"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  School,
  FileText,
  ClipboardList,
  DollarSign,
  Building,
} from "lucide-react";
import { SidebarItem } from "@/components/layout/Sidebar";

const sidebarItems: SidebarItem[] = [
  { label: "Trang chủ", href: "/admin", icon: LayoutDashboard },
  { label: "Giáo viên", href: "/admin/teachers", icon: Users },
  { label: "Học sinh", href: "/admin/students", icon: GraduationCap },
  { label: "Môn học", href: "/admin/subjects", icon: BookOpen },
  { label: "Lớp học", href: "/admin/classes", icon: School },
  { label: "Bài học mẫu", href: "/admin/lessons", icon: FileText },
  { label: "Bài tập mẫu", href: "/admin/assignments", icon: ClipboardList },
  { label: "Tài chính", href: "/admin/finances", icon: DollarSign },
  { label: "Cơ sở", href: "/admin/facilities", icon: Building },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
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

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <DashboardShell
      sidebarItems={sidebarItems}
      sidebarTitle="Quản Trị"
      accentColor="bg-purple-600"
    >
      {children}
    </DashboardShell>
  );
}
