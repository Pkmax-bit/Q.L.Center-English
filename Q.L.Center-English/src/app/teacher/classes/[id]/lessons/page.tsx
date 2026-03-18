"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useToast } from "@/components/ui/toast";
import { DataTable } from "@/components/shared/DataTable";
import { Modal } from "@/components/shared/Modal";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { Lesson } from "@/types";

const emptyForm = {
  title: "",
  content: "",
  content_type: "text",
  file_url: "",
  youtube_url: "",
  drive_url: "",
  is_published: "false",
  order_index: "0",
};

const contentTypeOptions = [
  { value: "text", label: "Văn bản" },
  { value: "file", label: "Tệp tin" },
  { value: "youtube", label: "YouTube" },
  { value: "drive", label: "Google Drive" },
  { value: "mixed", label: "Hỗn hợp" },
];

const publishedOptions = [
  { value: "true", label: "Đã xuất bản" },
  { value: "false", label: "Chưa xuất bản" },
];

const contentTypeLabel: Record<string, string> = {
  text: "Văn bản",
  file: "Tệp tin",
  youtube: "YouTube",
  drive: "Google Drive",
  mixed: "Hỗn hợp",
};

export default function TeacherLessonsPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  const { token, loading } = useAuth();
  const { toast } = useToast();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [fetching, setFetching] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchLessons = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/teacher/lessons?class_id=${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLessons(data.data || []);
      } else {
        toast({ title: "Lỗi", description: "Không thể tải danh sách bài học", variant: "destructive" });
      }
    } catch {
      toast({ title: "Lỗi", description: "Không thể tải danh sách bài học", variant: "destructive" });
    } finally {
      setFetching(false);
    }
  }, [token, classId, toast]);

  useEffect(() => {
    if (token) fetchLessons();
  }, [token, fetchLessons]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (lesson: Lesson) => {
    setEditingId(lesson.id);
    setForm({
      title: lesson.title,
      content: lesson.content || "",
      content_type: lesson.content_type,
      file_url: lesson.file_url || "",
      youtube_url: lesson.youtube_url || "",
      drive_url: lesson.drive_url || "",
      is_published: String(lesson.is_published),
      order_index: String(lesson.order_index),
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast({ title: "Lỗi", description: "Tiêu đề là bắt buộc", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        ...(editingId ? { id: editingId } : {}),
        class_id: classId,
        title: form.title,
        content: form.content || null,
        content_type: form.content_type,
        file_url: form.file_url || null,
        youtube_url: form.youtube_url || null,
        drive_url: form.drive_url || null,
        is_published: form.is_published === "true",
        order_index: parseInt(form.order_index) || 0,
      };

      const res = await fetch("/api/teacher/lessons", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast({ title: "Thành công", description: editingId ? "Đã cập nhật bài học" : "Đã tạo bài học mới" });
        setModalOpen(false);
        fetchLessons();
      } else {
        const err = await res.json();
        toast({ title: "Lỗi", description: err.error || "Thao tác thất bại", variant: "destructive" });
      }
    } catch {
      toast({ title: "Lỗi", description: "Đã xảy ra lỗi", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa bài học này?")) return;
    try {
      const res = await fetch(`/api/teacher/lessons?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Thành công", description: "Đã xóa bài học" });
        fetchLessons();
      } else {
        const err = await res.json();
        toast({ title: "Lỗi", description: err.error || "Xóa thất bại", variant: "destructive" });
      }
    } catch {
      toast({ title: "Lỗi", description: "Đã xảy ra lỗi", variant: "destructive" });
    }
  };

  const updateForm = (key: string) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  const columns = [
    {
      key: "stt",
      label: "STT",
      render: (_: Record<string, unknown>, index?: number) => (index ?? 0) + 1,
    },
    { key: "title", label: "Tiêu đề" },
    {
      key: "content_type",
      label: "Loại nội dung",
      render: (item: Record<string, unknown>) =>
        contentTypeLabel[(item as unknown as Lesson).content_type] || (item as unknown as Lesson).content_type,
    },
    {
      key: "is_published",
      label: "Đã xuất bản",
      render: (item: Record<string, unknown>) => {
        const lesson = item as unknown as Lesson;
        return lesson.is_published ? (
          <Badge variant="default">Đã xuất bản</Badge>
        ) : (
          <Badge variant="secondary">Nháp</Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/teacher/classes/${classId}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Quản lý bài học</h1>
          <p className="text-muted-foreground">Tạo và quản lý bài học cho lớp</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Thêm bài học
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={lessons as unknown as Record<string, unknown>[]}
        searchPlaceholder="Tìm bài học..."
        actions={(item) => {
          const lesson = item as unknown as Lesson;
          return (
            <div className="flex items-center gap-2 justify-end">
              <Button variant="ghost" size="icon" onClick={() => openEdit(lesson)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(lesson.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        }}
      />

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingId ? "Chỉnh sửa bài học" : "Thêm bài học mới"}
      >
        <div className="space-y-4">
          <FormField
            label="Tiêu đề"
            name="title"
            value={form.title}
            onChange={updateForm("title")}
            placeholder="Nhập tiêu đề bài học"
            required
          />
          <FormField
            label="Nội dung"
            name="content"
            type="textarea"
            value={form.content}
            onChange={updateForm("content")}
            placeholder="Nội dung bài học"
          />
          <FormField
            label="Loại nội dung"
            name="content_type"
            type="select"
            value={form.content_type}
            onChange={updateForm("content_type")}
            options={contentTypeOptions}
            required
          />
          <FormField
            label="URL tệp tin"
            name="file_url"
            value={form.file_url}
            onChange={updateForm("file_url")}
            placeholder="https://..."
          />
          <FormField
            label="URL YouTube"
            name="youtube_url"
            value={form.youtube_url}
            onChange={updateForm("youtube_url")}
            placeholder="https://youtube.com/..."
          />
          <FormField
            label="URL Google Drive"
            name="drive_url"
            value={form.drive_url}
            onChange={updateForm("drive_url")}
            placeholder="https://drive.google.com/..."
          />
          <FormField
            label="Trạng thái xuất bản"
            name="is_published"
            type="select"
            value={form.is_published}
            onChange={updateForm("is_published")}
            options={publishedOptions}
          />
          <FormField
            label="Thứ tự"
            name="order_index"
            type="number"
            value={form.order_index}
            onChange={updateForm("order_index")}
            placeholder="0"
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Đang xử lý..." : editingId ? "Cập nhật" : "Tạo mới"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
