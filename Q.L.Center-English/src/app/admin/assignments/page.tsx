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
import { Assignment } from "@/types";

interface AssignmentForm {
  id?: string;
  title: string;
  description: string;
  assignment_type: string;
  total_points: string;
  time_limit_minutes: string;
  is_published: string;
}

const emptyForm: AssignmentForm = {
  title: "",
  description: "",
  assignment_type: "mcq",
  total_points: "100",
  time_limit_minutes: "",
  is_published: "false",
};

export default function AdminAssignmentsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<AssignmentForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchAssignments = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/assignments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAssignments(data.data || []);
      }
    } catch {
      toast({ title: "Lỗi tải dữ liệu bài tập", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setEditing(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (assignment: Assignment) => {
    setForm({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description || "",
      assignment_type: assignment.assignment_type,
      total_points: String(assignment.total_points),
      time_limit_minutes: assignment.time_limit_minutes ? String(assignment.time_limit_minutes) : "",
      is_published: String(assignment.is_published),
    });
    setEditing(true);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title) {
      toast({ title: "Vui lòng nhập tiêu đề bài tập", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const method = editing ? "PUT" : "POST";
      const body = {
        ...(editing && { id: form.id }),
        title: form.title,
        description: form.description || null,
        assignment_type: form.assignment_type,
        total_points: parseInt(form.total_points) || 100,
        time_limit_minutes: form.time_limit_minutes ? parseInt(form.time_limit_minutes) : null,
        is_published: form.is_published === "true",
        is_template: true,
      };

      const res = await fetch("/api/admin/assignments", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi xử lý");

      toast({ title: editing ? "Cập nhật bài tập thành công" : "Thêm bài tập thành công" });
      setModalOpen(false);
      fetchAssignments();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài tập này?")) return;
    try {
      const res = await fetch(`/api/admin/assignments?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi xóa");
      toast({ title: "Xóa bài tập thành công" });
      fetchAssignments();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      toast({ title: message, variant: "destructive" });
    }
  };

  const typeLabels: Record<string, string> = {
    mcq: "Trắc nghiệm",
    essay: "Tự luận",
    mixed: "Hỗn hợp",
  };

  if (loading) return <LoadingSpinner />;

  const columns = [
    {
      key: "stt",
      label: "STT",
      render: (_: Assignment, index?: number) => (index ?? 0) + 1,
    },
    { key: "title", label: "Tiêu đề" },
    {
      key: "assignment_type",
      label: "Loại",
      render: (item: Assignment) => typeLabels[item.assignment_type] || item.assignment_type,
    },
    {
      key: "total_points",
      label: "Điểm",
      render: (item: Assignment) => item.total_points,
    },
    {
      key: "is_published",
      label: "Trạng thái",
      render: (item: Assignment) => (
        <Badge variant={item.is_published ? "default" : "secondary"}>
          {item.is_published ? "Đã xuất bản" : "Bản nháp"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý bài tập mẫu</h1>
          <p className="text-muted-foreground mt-1">Danh sách bài tập mẫu trong hệ thống</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm bài tập
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={assignments}
        searchPlaceholder="Tìm kiếm bài tập..."
        actions={(item: Assignment) => (
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
        title={editing ? "Chỉnh sửa bài tập" : "Thêm bài tập mới"}
        description={editing ? "Cập nhật thông tin bài tập mẫu" : "Nhập thông tin bài tập mẫu mới"}
      >
        <div className="space-y-4 mt-4">
          <FormField
            label="Tiêu đề"
            name="title"
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
            placeholder="Nhập tiêu đề bài tập"
            required
          />
          <FormField
            label="Mô tả"
            name="description"
            type="textarea"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
            placeholder="Nhập mô tả bài tập"
          />
          <FormField
            label="Loại bài tập"
            name="assignment_type"
            type="select"
            value={form.assignment_type}
            onChange={(v) => setForm({ ...form, assignment_type: v })}
            options={[
              { value: "mcq", label: "Trắc nghiệm" },
              { value: "essay", label: "Tự luận" },
              { value: "mixed", label: "Hỗn hợp" },
            ]}
          />
          <FormField
            label="Tổng điểm"
            name="total_points"
            type="number"
            value={form.total_points}
            onChange={(v) => setForm({ ...form, total_points: v })}
            placeholder="100"
          />
          <FormField
            label="Thời gian làm bài (phút)"
            name="time_limit_minutes"
            type="number"
            value={form.time_limit_minutes}
            onChange={(v) => setForm({ ...form, time_limit_minutes: v })}
            placeholder="Nhập thời gian (để trống nếu không giới hạn)"
          />
          <FormField
            label="Trạng thái"
            name="is_published"
            type="select"
            value={form.is_published}
            onChange={(v) => setForm({ ...form, is_published: v })}
            options={[
              { value: "true", label: "Đã xuất bản" },
              { value: "false", label: "Bản nháp" },
            ]}
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
