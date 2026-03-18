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
import { Lesson } from "@/types";

interface LessonForm {
  id?: string;
  title: string;
  content: string;
  content_type: string;
  file_url: string;
  youtube_url: string;
  drive_url: string;
  is_published: string;
}

const emptyForm: LessonForm = {
  title: "",
  content: "",
  content_type: "text",
  file_url: "",
  youtube_url: "",
  drive_url: "",
  is_published: "false",
};

export default function AdminLessonsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<LessonForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchLessons = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/lessons", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setLessons(data.data || []);
      }
    } catch {
      toast({ title: "Lỗi tải dữ liệu bài học", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setEditing(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (lesson: Lesson) => {
    setForm({
      id: lesson.id,
      title: lesson.title,
      content: lesson.content || "",
      content_type: lesson.content_type,
      file_url: lesson.file_url || "",
      youtube_url: lesson.youtube_url || "",
      drive_url: lesson.drive_url || "",
      is_published: String(lesson.is_published),
    });
    setEditing(true);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title) {
      toast({ title: "Vui lòng nhập tiêu đề bài học", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const method = editing ? "PUT" : "POST";
      const body = {
        ...(editing && { id: form.id }),
        title: form.title,
        content: form.content || null,
        content_type: form.content_type,
        file_url: form.file_url || null,
        youtube_url: form.youtube_url || null,
        drive_url: form.drive_url || null,
        is_published: form.is_published === "true",
        is_template: true,
      };

      const res = await fetch("/api/admin/lessons", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi xử lý");

      toast({ title: editing ? "Cập nhật bài học thành công" : "Thêm bài học thành công" });
      setModalOpen(false);
      fetchLessons();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài học này?")) return;
    try {
      const res = await fetch(`/api/admin/lessons?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi xóa");
      toast({ title: "Xóa bài học thành công" });
      fetchLessons();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      toast({ title: message, variant: "destructive" });
    }
  };

  const contentTypeLabels: Record<string, string> = {
    text: "Văn bản",
    file: "Tệp tin",
    youtube: "YouTube",
    drive: "Google Drive",
    mixed: "Hỗn hợp",
  };

  if (loading) return <LoadingSpinner />;

  const columns = [
    {
      key: "stt",
      label: "STT",
      render: (_: Lesson, index?: number) => (index ?? 0) + 1,
    },
    { key: "title", label: "Tiêu đề" },
    {
      key: "content_type",
      label: "Loại nội dung",
      render: (item: Lesson) => contentTypeLabels[item.content_type] || item.content_type,
    },
    {
      key: "is_published",
      label: "Trạng thái",
      render: (item: Lesson) => (
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
          <h1 className="text-3xl font-bold">Quản lý bài học mẫu</h1>
          <p className="text-muted-foreground mt-1">Danh sách bài học mẫu trong hệ thống</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm bài học
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={lessons}
        searchPlaceholder="Tìm kiếm bài học..."
        actions={(item: Lesson) => (
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
        title={editing ? "Chỉnh sửa bài học" : "Thêm bài học mới"}
        description={editing ? "Cập nhật thông tin bài học mẫu" : "Nhập thông tin bài học mẫu mới"}
      >
        <div className="space-y-4 mt-4">
          <FormField
            label="Tiêu đề"
            name="title"
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
            placeholder="Nhập tiêu đề bài học"
            required
          />
          <FormField
            label="Nội dung"
            name="content"
            type="textarea"
            value={form.content}
            onChange={(v) => setForm({ ...form, content: v })}
            placeholder="Nhập nội dung bài học"
          />
          <FormField
            label="Loại nội dung"
            name="content_type"
            type="select"
            value={form.content_type}
            onChange={(v) => setForm({ ...form, content_type: v })}
            options={[
              { value: "text", label: "Văn bản" },
              { value: "file", label: "Tệp tin" },
              { value: "youtube", label: "YouTube" },
              { value: "drive", label: "Google Drive" },
              { value: "mixed", label: "Hỗn hợp" },
            ]}
          />
          <FormField
            label="URL tệp tin"
            name="file_url"
            value={form.file_url}
            onChange={(v) => setForm({ ...form, file_url: v })}
            placeholder="Nhập URL tệp tin"
          />
          <FormField
            label="URL YouTube"
            name="youtube_url"
            value={form.youtube_url}
            onChange={(v) => setForm({ ...form, youtube_url: v })}
            placeholder="Nhập URL YouTube"
          />
          <FormField
            label="URL Google Drive"
            name="drive_url"
            value={form.drive_url}
            onChange={(v) => setForm({ ...form, drive_url: v })}
            placeholder="Nhập URL Google Drive"
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
