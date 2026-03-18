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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronLeft,
  X,
  GripVertical,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Assignment, AssignmentQuestion, MCQOption } from "@/types";

// ── Types for form state ──────────────────────────────────────────

interface OptionForm {
  id: string;
  text: string;
  is_correct: boolean;
}

interface QuestionForm {
  id: string;
  question_text: string;
  question_type: "mcq" | "essay";
  points: number;
  options: OptionForm[];
  correct_answer: string;
}

interface AssignmentForm {
  title: string;
  description: string;
  assignment_type: "mcq" | "essay" | "mixed";
  due_date: string;
  total_points: string;
  time_limit_minutes: string;
  is_published: string;
}

// ── Helpers ───────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10);

const emptyAssignmentForm: AssignmentForm = {
  title: "",
  description: "",
  assignment_type: "mixed",
  due_date: "",
  total_points: "100",
  time_limit_minutes: "",
  is_published: "false",
};

const newQuestion = (): QuestionForm => ({
  id: uid(),
  question_text: "",
  question_type: "mcq",
  points: 10,
  options: [
    { id: uid(), text: "", is_correct: true },
    { id: uid(), text: "", is_correct: false },
  ],
  correct_answer: "",
});

const assignmentTypeOptions = [
  { value: "mcq", label: "Trắc nghiệm" },
  { value: "essay", label: "Tự luận" },
  { value: "mixed", label: "Hỗn hợp" },
];

const publishedOptions = [
  { value: "true", label: "Xuất bản" },
  { value: "false", label: "Nháp" },
];

const questionTypeOptions = [
  { value: "mcq", label: "Trắc nghiệm" },
  { value: "essay", label: "Tự luận" },
];

const typeLabel: Record<string, string> = {
  mcq: "Trắc nghiệm",
  essay: "Tự luận",
  mixed: "Hỗn hợp",
};

// ── Component ─────────────────────────────────────────────────────

export default function TeacherAssignmentsPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  const { token, loading } = useAuth();
  const { toast } = useToast();

  // List state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [fetching, setFetching] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState<AssignmentForm>(emptyAssignmentForm);
  const [questions, setQuestions] = useState<QuestionForm[]>([]);

  // ── Fetch ────────────────────────────────────────────────────

  const fetchAssignments = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/teacher/assignments?class_id=${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.data || []);
      } else {
        toast({ title: "Lỗi", description: "Không thể tải danh sách bài tập", variant: "destructive" });
      }
    } catch {
      toast({ title: "Lỗi", description: "Không thể tải danh sách bài tập", variant: "destructive" });
    } finally {
      setFetching(false);
    }
  }, [token, classId, toast]);

  useEffect(() => {
    if (token) fetchAssignments();
  }, [token, fetchAssignments]);

  // ── Open modals ──────────────────────────────────────────────

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyAssignmentForm);
    setQuestions([newQuestion()]);
    setStep(1);
    setModalOpen(true);
  };

  const openEdit = (assignment: Assignment) => {
    setEditingId(assignment.id);
    setForm({
      title: assignment.title,
      description: assignment.description || "",
      assignment_type: assignment.assignment_type,
      due_date: assignment.due_date ? assignment.due_date.slice(0, 16) : "",
      total_points: String(assignment.total_points),
      time_limit_minutes: assignment.time_limit_minutes ? String(assignment.time_limit_minutes) : "",
      is_published: String(assignment.is_published),
    });

    if (assignment.questions && assignment.questions.length > 0) {
      setQuestions(
        assignment.questions.map((q: AssignmentQuestion) => ({
          id: q.id || uid(),
          question_text: q.question_text,
          question_type: q.question_type,
          points: q.points,
          options: q.options
            ? q.options.map((o: MCQOption) => ({
                id: o.id || uid(),
                text: o.text,
                is_correct: o.is_correct,
              }))
            : [
                { id: uid(), text: "", is_correct: true },
                { id: uid(), text: "", is_correct: false },
              ],
          correct_answer: q.correct_answer || "",
        }))
      );
    } else {
      setQuestions([newQuestion()]);
    }
    setStep(1);
    setModalOpen(true);
  };

  // ── Form handlers ───────────────────────────────────────────

  const updateForm = (key: keyof AssignmentForm) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ── Question handlers ───────────────────────────────────────

  const addQuestion = () => {
    setQuestions((prev) => [...prev, newQuestion()]);
  };

  const removeQuestion = (qId: string) => {
    if (questions.length <= 1) {
      toast({ title: "Lưu ý", description: "Cần ít nhất 1 câu hỏi" });
      return;
    }
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  const updateQuestion = (qId: string, field: keyof QuestionForm, value: unknown) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const updated = { ...q, [field]: value };
        // When switching question type, reset options/answer
        if (field === "question_type") {
          if (value === "mcq") {
            updated.options =
              q.options.length > 0
                ? q.options
                : [
                    { id: uid(), text: "", is_correct: true },
                    { id: uid(), text: "", is_correct: false },
                  ];
            updated.correct_answer = "";
          }
        }
        return updated;
      })
    );
  };

  // ── Option handlers ─────────────────────────────────────────

  const addOption = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId ? { ...q, options: [...q.options, { id: uid(), text: "", is_correct: false }] } : q
      )
    );
  };

  const removeOption = (qId: string, oId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        if (q.options.length <= 2) {
          toast({ title: "Lưu ý", description: "Cần ít nhất 2 đáp án" });
          return q;
        }
        return { ...q, options: q.options.filter((o) => o.id !== oId) };
      })
    );
  };

  const updateOptionText = (qId: string, oId: string, text: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? { ...q, options: q.options.map((o) => (o.id === oId ? { ...o, text } : o)) }
          : q
      )
    );
  };

  const setCorrectOption = (qId: string, oId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? {
              ...q,
              options: q.options.map((o) => ({
                ...o,
                is_correct: o.id === oId,
              })),
            }
          : q
      )
    );
  };

  // ── Validation ──────────────────────────────────────────────

  const validateStep1 = (): boolean => {
    if (!form.title.trim()) {
      toast({ title: "Lỗi", description: "Tiêu đề bài tập là bắt buộc", variant: "destructive" });
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        toast({
          title: "Lỗi",
          description: `Câu hỏi ${i + 1}: Chưa nhập nội dung câu hỏi`,
          variant: "destructive",
        });
        return false;
      }
      if (q.question_type === "mcq") {
        const hasEmpty = q.options.some((o) => !o.text.trim());
        if (hasEmpty) {
          toast({
            title: "Lỗi",
            description: `Câu hỏi ${i + 1}: Tất cả đáp án phải có nội dung`,
            variant: "destructive",
          });
          return false;
        }
        const hasCorrect = q.options.some((o) => o.is_correct);
        if (!hasCorrect) {
          toast({
            title: "Lỗi",
            description: `Câu hỏi ${i + 1}: Phải chọn 1 đáp án đúng`,
            variant: "destructive",
          });
          return false;
        }
      }
    }
    return true;
  };

  // ── Submit ──────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    setSubmitting(true);
    try {
      const body = {
        ...(editingId ? { id: editingId } : {}),
        class_id: classId,
        title: form.title,
        description: form.description || null,
        assignment_type: form.assignment_type,
        due_date: form.due_date || null,
        total_points: parseInt(form.total_points) || 100,
        time_limit_minutes: form.time_limit_minutes ? parseInt(form.time_limit_minutes) : null,
        is_published: form.is_published === "true",
        questions: questions.map((q) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          points: q.points,
          options:
            q.question_type === "mcq"
              ? q.options.map((o) => ({ text: o.text, is_correct: o.is_correct }))
              : null,
          correct_answer: q.question_type === "essay" ? q.correct_answer || null : null,
        })),
      };

      const res = await fetch("/api/teacher/assignments", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast({
          title: "Thành công",
          description: editingId ? "Đã cập nhật bài tập" : "Đã tạo bài tập mới",
        });
        setModalOpen(false);
        fetchAssignments();
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

  // ── Delete ──────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa bài tập này? Tất cả câu hỏi và bài nộp liên quan cũng sẽ bị xóa."))
      return;
    try {
      const res = await fetch(`/api/teacher/assignments?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Thành công", description: "Đã xóa bài tập" });
        fetchAssignments();
      } else {
        const err = await res.json();
        toast({ title: "Lỗi", description: err.error || "Xóa thất bại", variant: "destructive" });
      }
    } catch {
      toast({ title: "Lỗi", description: "Đã xảy ra lỗi", variant: "destructive" });
    }
  };

  // ── Loading ─────────────────────────────────────────────────

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  // ── Table columns ───────────────────────────────────────────

  const columns = [
    {
      key: "stt",
      label: "STT",
      render: (_: Record<string, unknown>, index?: number) => (index ?? 0) + 1,
    },
    { key: "title", label: "Tiêu đề" },
    {
      key: "assignment_type",
      label: "Loại",
      render: (item: Record<string, unknown>) =>
        typeLabel[(item as unknown as Assignment).assignment_type] || (item as unknown as Assignment).assignment_type,
    },
    {
      key: "due_date",
      label: "Hạn nộp",
      render: (item: Record<string, unknown>) => {
        const a = item as unknown as Assignment;
        return a.due_date ? new Date(a.due_date).toLocaleDateString("vi-VN") : "—";
      },
    },
    {
      key: "total_points",
      label: "Điểm",
      render: (item: Record<string, unknown>) => (item as unknown as Assignment).total_points,
    },
    {
      key: "is_published",
      label: "Trạng thái",
      render: (item: Record<string, unknown>) => {
        const a = item as unknown as Assignment;
        return a.is_published ? (
          <Badge variant="default">Đã xuất bản</Badge>
        ) : (
          <Badge variant="secondary">Nháp</Badge>
        );
      },
    },
  ];

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/teacher/classes/${classId}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Quản lý bài tập</h1>
          <p className="text-muted-foreground">Tạo và quản lý bài tập cho lớp</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Thêm bài tập
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={assignments as unknown as Record<string, unknown>[]}
        searchPlaceholder="Tìm bài tập..."
        actions={(item) => {
          const assignment = item as unknown as Assignment;
          return (
            <div className="flex items-center gap-2 justify-end">
              <Button variant="ghost" size="icon" onClick={() => openEdit(assignment)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(assignment.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        }}
      />

      {/* ── Assignment Modal ───────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setModalOpen(false);
            setStep(1);
          }
        }}
        title={
          editingId
            ? `Chỉnh sửa bài tập — Bước ${step}/2`
            : `Thêm bài tập mới — Bước ${step}/2`
        }
        description={step === 1 ? "Thông tin bài tập" : "Câu hỏi"}
      >
        {step === 1 ? (
          /* ── Step 1: Assignment info ───────────────────────── */
          <div className="space-y-4">
            <FormField
              label="Tiêu đề"
              name="title"
              value={form.title}
              onChange={updateForm("title")}
              placeholder="Nhập tiêu đề bài tập"
              required
            />
            <FormField
              label="Mô tả"
              name="description"
              type="textarea"
              value={form.description}
              onChange={updateForm("description")}
              placeholder="Mô tả bài tập (không bắt buộc)"
            />
            <FormField
              label="Loại bài tập"
              name="assignment_type"
              type="select"
              value={form.assignment_type}
              onChange={updateForm("assignment_type")}
              options={assignmentTypeOptions}
              required
            />
            <FormField
              label="Hạn nộp"
              name="due_date"
              type="datetime-local"
              value={form.due_date}
              onChange={updateForm("due_date")}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Tổng điểm"
                name="total_points"
                type="number"
                value={form.total_points}
                onChange={updateForm("total_points")}
                placeholder="100"
              />
              <FormField
                label="Giới hạn thời gian (phút)"
                name="time_limit_minutes"
                type="number"
                value={form.time_limit_minutes}
                onChange={updateForm("time_limit_minutes")}
                placeholder="Không giới hạn"
              />
            </div>
            <FormField
              label="Trạng thái"
              name="is_published"
              type="select"
              value={form.is_published}
              onChange={updateForm("is_published")}
              options={publishedOptions}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={() => {
                  if (validateStep1()) setStep(2);
                }}
              >
                Tiếp theo <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        ) : (
          /* ── Step 2: Questions builder ─────────────────────── */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {questions.length} câu hỏi · Tổng{" "}
                {questions.reduce((s, q) => s + q.points, 0)} điểm
              </p>
              <Button variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-1" /> Thêm câu hỏi
              </Button>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {questions.map((q, qi) => (
                <Card key={q.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                        <CardTitle className="text-base">Câu {qi + 1}</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => removeQuestion(q.id)}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Question text */}
                    <div className="space-y-2">
                      <Label>Nội dung câu hỏi *</Label>
                      <Textarea
                        value={q.question_text}
                        onChange={(e) => updateQuestion(q.id, "question_text", e.target.value)}
                        placeholder="Nhập nội dung câu hỏi..."
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Question type */}
                      <FormField
                        label="Loại câu hỏi"
                        name={`q_type_${q.id}`}
                        type="select"
                        value={q.question_type}
                        onChange={(val) => updateQuestion(q.id, "question_type", val)}
                        options={questionTypeOptions}
                      />
                      {/* Points */}
                      <div className="space-y-2">
                        <Label>Điểm</Label>
                        <Input
                          type="number"
                          min={0}
                          value={q.points}
                          onChange={(e) =>
                            updateQuestion(q.id, "points", parseInt(e.target.value) || 0)
                          }
                        />
                      </div>
                    </div>

                    {/* MCQ options */}
                    {q.question_type === "mcq" && (
                      <div className="space-y-2">
                        <Label>Đáp án (nhấn vào biểu tượng tròn để chọn đáp án đúng)</Label>
                        <div className="space-y-2">
                          {q.options.map((o, oi) => (
                            <div key={o.id} className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setCorrectOption(q.id, o.id)}
                                className="shrink-0 focus:outline-none"
                                title={o.is_correct ? "Đáp án đúng" : "Nhấn để chọn là đáp án đúng"}
                              >
                                {o.is_correct ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : (
                                  <Circle className="h-5 w-5 text-muted-foreground" />
                                )}
                              </button>
                              <span className="text-sm text-muted-foreground w-6 shrink-0">
                                {String.fromCharCode(65 + oi)}.
                              </span>
                              <Input
                                value={o.text}
                                onChange={(e) => updateOptionText(q.id, o.id, e.target.value)}
                                placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`}
                                className="flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() => removeOption(q.id, o.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addOption(q.id)}
                          className="mt-1"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Thêm đáp án
                        </Button>
                      </div>
                    )}

                    {/* Essay answer */}
                    {q.question_type === "essay" && (
                      <div className="space-y-2">
                        <Label>Đáp án mẫu (không bắt buộc)</Label>
                        <Textarea
                          value={q.correct_answer}
                          onChange={(e) => updateQuestion(q.id, "correct_answer", e.target.value)}
                          placeholder="Nhập đáp án mẫu để tham khảo khi chấm điểm..."
                          rows={2}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Quay lại
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setModalOpen(false)} disabled={submitting}>
                  Hủy
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Đang xử lý..." : editingId ? "Cập nhật" : "Tạo bài tập"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
