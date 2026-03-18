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
import { Profile } from "@/types";

interface StudentForm {
  id?: string;
  full_name: string;
  email: string;
  phone: string;
  password: string;
}

const emptyForm: StudentForm = {
  full_name: "",
  email: "",
  phone: "",
  password: "",
};

export default function AdminStudentsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchStudents = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setStudents(data.data || []);
      }
    } catch {
      toast({ title: "Lỗi tải dữ liệu học sinh", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setEditing(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (student: Profile) => {
    setForm({
      id: student.id,
      full_name: student.full_name,
      email: student.email,
      phone: student.phone || "",
      password: "",
    });
    setEditing(true);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.full_name || !form.email) {
      toast({ title: "Vui lòng điền đầy đủ thông tin bắt buộc", variant: "destructive" });
      return;
    }
    if (!editing && !form.password) {
      toast({ title: "Vui lòng nhập mật khẩu", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const method = editing ? "PUT" : "POST";
      const body = editing
        ? { id: form.id, full_name: form.full_name, phone: form.phone }
        : { full_name: form.full_name, email: form.email, phone: form.phone, password: form.password };

      const res = await fetch("/api/admin/students", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi xử lý");

      toast({ title: editing ? "Cập nhật học sinh thành công" : "Thêm học sinh thành công" });
      setModalOpen(false);
      fetchStudents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa học sinh này?")) return;
    try {
      const res = await fetch(`/api/admin/students?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi xóa");
      toast({ title: "Xóa học sinh thành công" });
      fetchStudents();
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
      render: (_: Profile, index?: number) => (index ?? 0) + 1,
    },
    { key: "full_name", label: "Họ tên" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Số điện thoại", render: (item: Profile) => item.phone || "—" },
    {
      key: "is_active",
      label: "Trạng thái",
      render: (item: Profile) => (
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
          <h1 className="text-3xl font-bold">Quản lý học sinh</h1>
          <p className="text-muted-foreground mt-1">Danh sách học sinh trong hệ thống</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm học sinh
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={students}
        searchPlaceholder="Tìm kiếm học sinh..."
        actions={(item: Profile) => (
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
        title={editing ? "Chỉnh sửa học sinh" : "Thêm học sinh mới"}
        description={editing ? "Cập nhật thông tin học sinh" : "Nhập thông tin học sinh mới"}
      >
        <div className="space-y-4 mt-4">
          <FormField
            label="Họ tên"
            name="full_name"
            value={form.full_name}
            onChange={(v) => setForm({ ...form, full_name: v })}
            placeholder="Nhập họ tên"
            required
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
            placeholder="Nhập email"
            required
            disabled={editing}
          />
          <FormField
            label="Số điện thoại"
            name="phone"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
            placeholder="Nhập số điện thoại"
          />
          {!editing && (
            <FormField
              label="Mật khẩu"
              name="password"
              type="password"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              placeholder="Nhập mật khẩu"
              required
            />
          )}
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
