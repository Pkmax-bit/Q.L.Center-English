"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, School, DollarSign } from "lucide-react";

interface DashboardStats {
  totalTeachers: number;
  totalStudents: number;
  totalClasses: number;
  totalIncome: number;
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalTeachers: 0,
    totalStudents: 0,
    totalClasses: 0,
    totalIncome: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [teachersRes, studentsRes, classesRes, financesRes] = await Promise.all([
        fetch("/api/admin/teachers", { headers }),
        fetch("/api/admin/students", { headers }),
        fetch("/api/admin/classes", { headers }),
        fetch("/api/admin/finances", { headers }),
      ]);

      const [teachersData, studentsData, classesData, financesData] = await Promise.all([
        teachersRes.json(),
        studentsRes.json(),
        classesRes.json(),
        financesRes.json(),
      ]);

      const incomeTotal = (financesData.data || [])
        .filter((f: { type: string; status: string }) => f.type === "income" && f.status === "completed")
        .reduce((sum: number, f: { amount: number }) => sum + f.amount, 0);

      setStats({
        totalTeachers: (teachersData.data || []).length,
        totalStudents: (studentsData.data || []).length,
        totalClasses: (classesData.data || []).length,
        totalIncome: incomeTotal,
      });
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const statCards = [
    {
      title: "Tổng giáo viên",
      value: stats.totalTeachers,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Tổng học sinh",
      value: stats.totalStudents,
      icon: GraduationCap,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Tổng lớp học",
      value: stats.totalClasses,
      icon: School,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      title: "Tổng thu nhập",
      value: new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(stats.totalIncome),
      icon: DollarSign,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bảng điều khiển</h1>
        <p className="text-muted-foreground mt-1">Tổng quan hệ thống quản lý trung tâm</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
