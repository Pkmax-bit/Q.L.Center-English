'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Modal } from '@/components/shared/Modal';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { Assignment, AssignmentQuestion, MCQOption, Submission, SubmissionAnswer } from '@/types';

type AssignmentWithDetails = Omit<Assignment, 'class' | 'questions'> & {
  class?: { name: string };
  questions?: AssignmentQuestion[];
};

interface AnswerState {
  [questionId: string]: {
    answer_text?: string;
    selected_option_id?: string;
  };
}

export default function DoAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<AssignmentWithDetails | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<SubmissionAnswer[] | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [assignRes, subRes] = await Promise.all([
        fetch('/api/student/assignments', { headers }),
        fetch('/api/student/submissions', { headers }),
      ]);
      const assignData = await assignRes.json();
      const subData = await subRes.json();

      const allAssignments: AssignmentWithDetails[] = assignData.data || [];
      const found = allAssignments.find((a) => a.id === assignmentId);
      setAssignment(found || null);

      const submissions: Submission[] = subData.data || [];
      const existingSub = submissions.find(
        (s) => s.assignment_id === assignmentId
      );
      if (existingSub) {
        setExistingSubmission(existingSub);
        setSubmitted(true);
        setResults(existingSub.answers || []);
      }
    } catch (err) {
      console.error('Failed to fetch assignment:', err);
    } finally {
      setLoading(false);
    }
  }, [token, assignmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], selected_option_id: optionId },
    }));
  };

  const handleTextChange = (questionId: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], answer_text: text },
    }));
  };

  const handleSubmit = async () => {
    if (!token || !assignment) return;
    setSubmitting(true);
    setShowConfirm(false);

    try {
      const answerPayload = (assignment.questions || []).map((q) => ({
        question_id: q.id,
        answer_text: answers[q.id]?.answer_text || undefined,
        selected_option_id: answers[q.id]?.selected_option_id || undefined,
      }));

      const res = await fetch('/api/student/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignment_id: assignmentId,
          answers: answerPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Đã xảy ra lỗi khi nộp bài');
        return;
      }

      setSubmitted(true);
      // Re-fetch to get graded results
      const subRes = await fetch('/api/student/submissions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subData = await subRes.json();
      const newSub = (subData.data || []).find(
        (s: Submission) => s.assignment_id === assignmentId
      );
      if (newSub) {
        setExistingSubmission(newSub);
        setResults(newSub.answers || []);
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('Đã xảy ra lỗi khi nộp bài');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!assignment) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Không tìm thấy bài tập</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const questions = assignment.questions || [];
  const answeredCount = Object.keys(answers).filter(
    (qId) => answers[qId]?.selected_option_id || answers[qId]?.answer_text
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            {assignment.class && (
              <Badge variant="secondary">{assignment.class.name}</Badge>
            )}
            <Badge variant="outline">
              {assignment.assignment_type === 'mcq'
                ? 'Trắc nghiệm'
                : assignment.assignment_type === 'essay'
                ? 'Tự luận'
                : 'Hỗn hợp'}
            </Badge>
            <Badge>{assignment.total_points} điểm</Badge>
          </div>
          <CardTitle className="text-xl">{assignment.title}</CardTitle>
          {assignment.description && (
            <CardDescription>{assignment.description}</CardDescription>
          )}
          {submitted && existingSubmission && (
            <div className="mt-2">
              {existingSubmission.status === 'graded' ? (
                <Badge variant="success">
                  Đã chấm: {existingSubmission.score}/{assignment.total_points} điểm
                </Badge>
              ) : (
                <Badge variant="secondary">Đã nộp - Chờ chấm điểm</Badge>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        {questions
          .sort((a, b) => a.order_index - b.order_index)
          .map((question, index) => {
            const result = results?.find((r) => r.question_id === question.id);
            return (
              <Card key={question.id}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{question.question_text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">
                          {question.question_type === 'mcq' ? 'Trắc nghiệm' : 'Tự luận'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {question.points} điểm
                        </span>
                      </div>
                    </div>
                    {submitted && result && question.question_type === 'mcq' && (
                      <div>
                        {result.is_correct ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {question.question_type === 'mcq' && question.options ? (
                    <div className="space-y-2">
                      {question.options.map((option: MCQOption) => {
                        const isSelected =
                          answers[question.id]?.selected_option_id === option.id ||
                          result?.selected_option_id === option.id;
                        const isCorrect = submitted && option.is_correct;
                        const isWrong =
                          submitted && isSelected && !option.is_correct;

                        return (
                          <label
                            key={option.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              submitted
                                ? isCorrect
                                  ? 'border-green-500 bg-green-50'
                                  : isWrong
                                  ? 'border-red-500 bg-red-50'
                                  : ''
                                : isSelected
                                ? 'border-primary bg-primary/5'
                                : 'hover:bg-muted/50'
                            } ${submitted ? 'pointer-events-none' : ''}`}
                          >
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={option.id}
                              checked={isSelected}
                              onChange={() =>
                                handleOptionSelect(question.id, option.id)
                              }
                              disabled={submitted}
                              className="h-4 w-4"
                            />
                            <span className="text-sm">{option.text}</span>
                            {submitted && isCorrect && (
                              <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                            )}
                            {submitted && isWrong && (
                              <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div>
                      <textarea
                        className="w-full min-h-[120px] p-3 rounded-lg border bg-background resize-y text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Nhập câu trả lời của bạn..."
                        value={
                          submitted && result
                            ? result.answer_text || ''
                            : answers[question.id]?.answer_text || ''
                        }
                        onChange={(e) =>
                          handleTextChange(question.id, e.target.value)
                        }
                        disabled={submitted}
                      />
                      {submitted && result?.feedback && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Nhận xét: {result.feedback}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Submit bar */}
      {!submitted && questions.length > 0 && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="text-sm text-muted-foreground">
              Đã trả lời: {answeredCount}/{questions.length} câu
            </div>
            <Button onClick={() => setShowConfirm(true)} disabled={submitting}>
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Đang nộp...' : 'Nộp bài'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Confirmation modal */}
      <Modal
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Xác nhận nộp bài"
        description="Bạn không thể thay đổi câu trả lời sau khi nộp."
      >
        <div className="space-y-4">
          {answeredCount < questions.length && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 text-yellow-800 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Bạn còn {questions.length - answeredCount} câu chưa trả lời
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Đang nộp...' : 'Xác nhận nộp'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
