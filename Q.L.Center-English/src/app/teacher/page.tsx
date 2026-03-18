"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useToast } from "@/components/ui/toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { School, Users, FileText, ClipboardList } from "lucide-react";
import { Class, Lesson, Assignment } from "@/types";

interface ClassWithStudents extends Class {
  class_students?: { id: string }[];
}

export default function TeacherDashboard() {
  const { user, loading, token } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassWithStudents[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [fetching, setFetching] = useState(true);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [classesRes, lessonsRes, assignmentsRes] = await Promise.all([
        fetch("/api/teacher/classes", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/teacher/lessons", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/teacher/assignments", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (classesRes.ok) {
        const data = await classesRes.json();
        setClasses(data.data || []);
      }
      if (lessonsRes.ok) {
        const data = await lessonsRes.json();
        setLessons(data.data || []);
      }
      if (assignmentsRes.ok) {
        const data = await assignmentsRes.json();
        setAssignments(data.data || []);
      }
    } catch {
      toast({ title: "Lỗi", description: "Không thể tải dữ liệu", variant: "destructive" });
    } finally {
      setFetching(false);
    }
  }, [token, toast]);

  useEffect(() => {
    if (token) fetchData();
  }, [token, fetchData]);

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  const totalStudents = classes.reduce(
    (sum, c) => sum + (c.class_students?.length || c.student_count || 0),
    0
  );

  const stats = [
    {
      label: "Số lớp đang dạy",
      value: classes.filter((c) => c.status === "active").length,
      icon: School,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      label: "Tổng học sinh",
      value: totalStudents,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "Bài học đã tạo",
      value: lessons.length,
      icon: FileText,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      label: "Bài tập đã tạo",
      value: assignments.length,
      icon: ClipboardList,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Xin chào, {user?.full_name || "Giáo viên"}!</h1>
        <p className="text-muted-foreground">Tổng quan hoạt động giảng dạy của bạn</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
