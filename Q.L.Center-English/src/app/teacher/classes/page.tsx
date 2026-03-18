"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useToast } from "@/components/ui/toast";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { Class, Subject, ClassStudent } from "@/types";

interface TeacherClass extends Class {
  subject?: Subject;
  class_students?: ClassStudent[];
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Đang hoạt động", variant: "default" },
  inactive: { label: "Tạm dừng", variant: "secondary" },
  completed: { label: "Hoàn thành", variant: "destructive" },
};

export default function TeacherClassesPage() {
  const { token, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [fetching, setFetching] = useState(true);

  const fetchClasses = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/teacher/classes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setClasses(data.data || []);
      } else {
        toast({ title: "Lỗi", description: "Không thể tải danh sách lớp", variant: "destructive" });
      }
    } catch {
      toast({ title: "Lỗi", description: "Không thể tải danh sách lớp", variant: "destructive" });
    } finally {
      setFetching(false);
    }
  }, [token, toast]);

  useEffect(() => {
    if (token) fetchClasses();
  }, [token, fetchClasses]);

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lớp học của tôi</h1>
        <p className="text-muted-foreground">Danh sách các lớp bạn đang phụ trách</p>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Bạn chưa được phân công lớp học nào.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => {
            const status = statusMap[cls.status] || statusMap.active;
            const studentCount = cls.class_students?.length || cls.student_count || 0;
            return (
              <Card
                key={cls.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/teacher/classes/${cls.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm text-muted-foreground mb-2">
                    {cls.subject?.name || "Chưa gán môn học"}
                  </p>
                  {cls.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{cls.description}</p>
                  )}
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{studentCount} học sinh</span>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
