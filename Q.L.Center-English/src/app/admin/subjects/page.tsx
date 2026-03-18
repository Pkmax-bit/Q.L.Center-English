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
import { Subject } from "@/types";

interface SubjectForm {
  id?: string;
  code: string;
  name: string;
  description: string;
  is_active: string;
}

const emptyForm: SubjectForm = {
  code: "",
  name: "",
  description: "",
  is_active: "true",
};

export default function AdminSubjectsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<SubjectForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchSubjects = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/subjects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSubjects(data.data || []);
      }
    } catch {
      toast({ title: "Lỗi tải dữ liệu môn học", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setEditing(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setForm({
      id: subject.id,
      code: subject.code,
      name: subject.name,
      description: subject.description || "",
      is_active: String(subject.is_active),
    });
    setEditing(true);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.code || !form.name) {
      toast({ title: "Vui lòng điền đầy đủ thông tin bắt buộc", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const method = editing ? "PUT" : "POST";
      const body = {
        ...(editing && { id: form.id }),
        code: form.code,
        name: form.name,
        description: form.description || null,
        is_active: form.is_active === "true",
      };

      const res = await fetch("/api/admin/subjects", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi xử lý");

      toast({ title: editing ? "Cập nhật môn học thành công" : "Thêm môn học thành công" });
      setModalOpen(false);
      fetchSubjects();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa môn học này?")) return;
    try {
      const res = await fetch(`/api/admin/subjects?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi xóa");
      toast({ title: "Xóa môn học thành công" });
      fetchSubjects();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      toast({ title: message, variant: "destructive" });
    }
  };

  if (loading) return <LoadingSpinner />;

  const columns = [
    {
      key: "stt",
      label: "STT",
      render: (_: Subject, index?: number) => (index ?? 0) + 1,
    },
    { key: "code", label: "Mã môn" },
    { key: "name", label: "Tên môn" },
    {
      key: "description",
      label: "Mô tả",
      render: (item: Subject) => item.description || "—",
    },
    {
      key: "is_active",
      label: "Trạng thái",
      render: (item: Subject) => (
        <Badge variant={item.is_active ? "default" : "secondary"}>
          {item.is_active ? "Hoạt động" : "Không hoạt động"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý môn học</h1>
          <p className="text-muted-foreground mt-1">Danh sách môn học trong hệ thống</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm môn học
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={subjects}
        searchPlaceholder="Tìm kiếm môn học..."
        actions={(item: Subject) => (
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
        title={editing ? "Chỉnh sửa môn học" : "Thêm môn học mới"}
        description={editing ? "Cập nhật thông tin môn học" : "Nhập thông tin môn học mới"}
      >
        <div className="space-y-4 mt-4">
          <FormField
            label="Mã môn"
            name="code"
            value={form.code}
            onChange={(v) => setForm({ ...form, code: v })}
            placeholder="VD: ENG101"
            required
          />
          <FormField
            label="Tên môn"
            name="name"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            placeholder="Nhập tên môn học"
            required
          />
          <FormField
            label="Mô tả"
            name="description"
            type="textarea"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
            placeholder="Nhập mô tả môn học"
          />
          <FormField
            label="Trạng thái"
            name="is_active"
            type="select"
            value={form.is_active}
            onChange={(v) => setForm({ ...form, is_active: v })}
            options={[
              { value: "true", label: "Hoạt động" },
              { value: "false", label: "Không hoạt động" },
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
