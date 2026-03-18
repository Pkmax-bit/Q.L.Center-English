"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useToast } from "@/components/ui/toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable } from "@/components/shared/DataTable";
import { ArrowLeft, FileText, ClipboardList, Users, Info } from "lucide-react";
import { Class, Subject, ClassStudent, Profile } from "@/types";

interface TeacherClass extends Class {
  subject?: Subject;
  class_students?: (ClassStudent & { student?: Profile })[];
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Đang hoạt động", variant: "default" },
  inactive: { label: "Tạm dừng", variant: "secondary" },
  completed: { label: "Hoàn thành", variant: "destructive" },
};

const studentStatusMap: Record<string, string> = {
  active: "Đang học",
  dropped: "Đã nghỉ",
  completed: "Hoàn thành",
};

export default function TeacherClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  const { token, loading } = useAuth();
  const { toast } = useToast();
  const [classData, setClassData] = useState<TeacherClass | null>(null);
  const [fetching, setFetching] = useState(true);

  const fetchClass = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/teacher/classes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const found = (data.data || []).find((c: TeacherClass) => c.id === classId);
        setClassData(found || null);
      } else {
        toast({ title: "Lỗi", description: "Không thể tải thông tin lớp", variant: "destructive" });
      }
    } catch {
      toast({ title: "Lỗi", description: "Không thể tải thông tin lớp", variant: "destructive" });
    } finally {
      setFetching(false);
    }
  }, [token, classId, toast]);

  useEffect(() => {
    if (token) fetchClass();
  }, [token, fetchClass]);

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/teacher/classes")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          Không tìm thấy lớp học hoặc bạn không có quyền truy cập.
        </div>
      </div>
    );
  }

  const status = statusMap[classData.status] || statusMap.active;
  const students = classData.class_students || [];

  const studentColumns = [
    {
      key: "stt",
      label: "STT",
      render: (_: Record<string, unknown>, index?: number) => (index ?? 0) + 1,
    },
    {
      key: "full_name",
      label: "Họ tên",
      render: (item: Record<string, unknown>) => {
        const s = item as unknown as ClassStudent & { student?: Profile };
        return s.student?.full_name || "—";
      },
    },
    {
      key: "email",
      label: "Email",
      render: (item: Record<string, unknown>) => {
        const s = item as unknown as ClassStudent & { student?: Profile };
        return s.student?.email || "—";
      },
    },
    {
      key: "phone",
      label: "Điện thoại",
      render: (item: Record<string, unknown>) => {
        const s = item as unknown as ClassStudent & { student?: Profile };
        return s.student?.phone || "—";
      },
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (item: Record<string, unknown>) => {
        const s = item as unknown as ClassStudent;
        return studentStatusMap[s.status] || s.status;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/teacher/classes")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{classData.name}</h1>
          <p className="text-muted-foreground">{classData.subject?.name || "Chưa gán môn học"}</p>
        </div>
        <Badge variant={status.variant} className="ml-auto">
          {status.label}
        </Badge>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info" className="gap-2">
            <Info className="h-4 w-4" /> Thông tin
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-2">
            <Users className="h-4 w-4" /> Học sinh ({students.length})
          </TabsTrigger>
          <TabsTrigger value="lessons" className="gap-2">
            <FileText className="h-4 w-4" /> Bài học
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2">
            <ClipboardList className="h-4 w-4" /> Bài tập
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin lớp học</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tên lớp</p>
                  <p className="font-medium">{classData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Môn học</p>
                  <p className="font-medium">{classData.subject?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sĩ số tối đa</p>
                  <p className="font-medium">{classData.max_students}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số học sinh hiện tại</p>
                  <p className="font-medium">{students.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ngày bắt đầu</p>
                  <p className="font-medium">
                    {classData.start_date
                      ? new Date(classData.start_date).toLocaleDateString("vi-VN")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ngày kết thúc</p>
                  <p className="font-medium">
                    {classData.end_date
                      ? new Date(classData.end_date).toLocaleDateString("vi-VN")
                      : "—"}
                  </p>
                </div>
              </div>
              {classData.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Mô tả</p>
                  <p className="font-medium">{classData.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách học sinh</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={studentColumns}
                data={students as unknown as Record<string, unknown>[]}
                searchPlaceholder="Tìm học sinh..."
                pageSize={10}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lessons" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Quản lý bài học</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Quản lý bài học cho lớp {classData.name}</p>
              <Button onClick={() => router.push(`/teacher/classes/${classId}/lessons`)}>
                Đi đến quản lý bài học
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Quản lý bài tập</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <ClipboardList className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Quản lý bài tập cho lớp {classData.name}</p>
              <Button onClick={() => router.push(`/teacher/classes/${classId}/assignments`)}>
                Đi đến quản lý bài tập
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
