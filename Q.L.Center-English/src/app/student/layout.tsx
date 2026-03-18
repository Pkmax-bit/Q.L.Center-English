'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { SidebarItem } from '@/components/layout/Sidebar';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  ClipboardCheck,
  Calendar,
} from 'lucide-react';

const sidebarItems: SidebarItem[] = [
  { label: 'Trang chủ', href: '/student', icon: LayoutDashboard },
  { label: 'Học', href: '/student/learn', icon: BookOpen },
  { label: 'Bài tập', href: '/student/assignments', icon: FileText },
  { label: 'Kiểm tra', href: '/student/tests', icon: ClipboardCheck },
  { label: 'Thời khóa biểu', href: '/student/schedule', icon: Calendar },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || user.role !== 'student') {
    return null;
  }

  return (
    <DashboardShell
      sidebarItems={sidebarItems}
      sidebarTitle="Học Sinh"
      accentColor="bg-blue-600"
    >
      {children}
    </DashboardShell>
  );
}
