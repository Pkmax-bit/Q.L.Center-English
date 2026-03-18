"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { DataTable } from "@/components/shared/DataTable";
import { Modal } from "@/components/shared/Modal";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Class, Subject, Profile } from "@/types";

interface ClassForm {
  id?: string;
  name: string;
  subject_id: string;
  teacher_id: string;
  description: string;
  max_students: string;
  status: string;
  start_date: string;
  end_date: string;
}

const emptyForm: ClassForm = {
  name: "",
  subject_id: "",
  teacher_id: "",
  description: "",
  max_students: "30",
  status: "active",
  start_date: "",
  end_date: "",
};

export default function AdminClassesPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ClassForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [classesRes, subjectsRes, teachersRes] = await Promise.all([
        fetch("/api/admin/classes", { headers }),
        fetch("/api/admin/subjects", { headers }),
        fetch("/api/admin/teachers", { headers }),
      ]);

      const [classesData, subjectsData, teachersData] = await Promise.all([
        classesRes.json(),
        subjectsRes.json(),
        teachersRes.json(),
      ]);

      if (classesRes.ok) setClasses(classesData.data || []);
      if (subjectsRes.ok) setSubjects(subjectsData.data || []);
      if (teachersRes.ok) setTeachers(teachersData.data || []);
    } catch {
      toast({ title: "Lỗi tải dữ liệu", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setEditing(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (cls: Class) => {
    setForm({
      id: cls.id,
      name: cls.name,
      subject_id: cls.subject_id || "",
      teacher_id: cls.teacher_id || "",
      description: cls.description || "",
      max_students: String(cls.max_students),
      status: cls.status,
      start_date: cls.start_date || "",
      end_date: cls.end_date || "",
    });
    setEditing(true);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name) {
      toast({ title: "Vui lòng nhập tên lớp học", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const method = editing ? "PUT" : "POST";
      const body = {
        ...(editing && { id: form.id }),
        name: form.name,
        subject_id: form.subject_id || null,
        teacher_id: form.teacher_id || null,
        description: form.description || null,
        max_students: parseInt(form.max_students) || 30,
        status: form.status,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };

      const res = await fetch("/api/admin/classes", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi xử lý");

      toast({ title: editing ? "Cập nhật lớp học thành công" : "Thêm lớp học thành công" });
      setModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lớp học này?")) return;
    try {
      const res = await fetch(`/api/admin/classes?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi xóa");
      toast({ title: "Xóa lớp học thành công" });
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      toast({ title: message, variant: "destructive" });
    }
  };

  const statusLabels: Record<string, string> = {
    active: "Đang hoạt động",
    inactive: "Tạm dừng",
    completed: "Hoàn thành",
  };

  const statusVariants: Record<string, "default" | "secondary" | "outline"> = {
    active: "default",
    inactive: "secondary",
    completed: "outline",
  };

  if (loading) return <LoadingSpinner />;

  const columns = [
    {
      key: "stt",
      label: "STT",
      render: (_: Class, index?: number) => (index ?? 0) + 1,
    },
    { key: "name", label: "Tên lớp" },
    {
      key: "subject_id",
      label: "Môn học",
      render: (item: Class) => item.subject?.name || "—",
    },
    {
      key: "teacher_id",
      label: "Giáo viên",
      render: (item: Class) => item.teacher?.full_name || "—",
    },
    {
      key: "student_count",
      label: "Sĩ số",
      render: (item: Class) => `${item.student_count ?? 0}/${item.max_students}`,
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (item: Class) => (
        <Badge variant={statusVariants[item.status] || "secondary"}>
          {statusLabels[item.status] || item.status}
        </Badge>
      ),
    },
  ];

  const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name }));
  const teacherOptions = teachers.map((t) => ({ value: t.id, label: t.full_name }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý lớp học</h1>
          <p className="text-muted-foreground mt-1">Danh sách lớp học trong hệ thống</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm lớp học
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={classes}
        searchPlaceholder="Tìm kiếm lớp học..."
        actions={(item: Class) => (
          <div className="flex items-center gap-2 justify-end">
            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(item)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      />

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? "Chỉnh sửa lớp học" : "Thêm lớp học mới"}
        description={editing ? "Cập nhật thông tin lớp học" : "Nhập thông tin lớp học mới"}
      >
        <div className="space-y-4 mt-4">
          <FormField
            label="Tên lớp"
            name="name"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            placeholder="Nhập tên lớp học"
            required
          />
          <FormField
            label="Môn học"
            name="subject_id"
            type="select"
            value={form.subject_id}
            onChange={(v) => setForm({ ...form, subject_id: v })}
            options={subjectOptions}
            placeholder="Chọn môn học"
          />
          <FormField
            label="Giáo viên"
            name="teacher_id"
            type="select"
            value={form.teacher_id}
            onChange={(v) => setForm({ ...form, teacher_id: v })}
            options={teacherOptions}
            placeholder="Chọn giáo viên"
          />
          <FormField
            label="Mô tả"
            name="description"
            type="textarea"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
            placeholder="Nhập mô tả lớp học"
          />
          <FormField
            label="Sĩ số tối đa"
            name="max_students"
            type="number"
            value={form.max_students}
            onChange={(v) => setForm({ ...form, max_students: v })}
            placeholder="30"
          />
          <FormField
            label="Trạng thái"
            name="status"
            type="select"
            value={form.status}
            onChange={(v) => setForm({ ...form, status: v })}
            options={[
              { value: "active", label: "Đang hoạt động" },
              { value: "inactive", label: "Tạm dừng" },
              { value: "completed", label: "Hoàn thành" },
            ]}
          />
          <FormField
            label="Ngày bắt đầu"
            name="start_date"
            type="date"
            value={form.start_date}
            onChange={(v) => setForm({ ...form, start_date: v })}
          />
          <FormField
            label="Ngày kết thúc"
            name="end_date"
            type="date"
            value={form.end_date}
            onChange={(v) => setForm({ ...form, end_date: v })}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Đang xử lý..." : editing ? "Cập nhật" : "Thêm mới"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
