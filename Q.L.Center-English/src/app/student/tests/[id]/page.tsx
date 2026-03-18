'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  Timer,
  Clock,
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

export default function TakeTestPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const testId = params.id as string;

  const [assignment, setAssignment] = useState<AssignmentWithDetails | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<SubmissionAnswer[] | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSubmitRef = useRef(false);

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
      const found = allAssignments.find((a) => a.id === testId);
      setAssignment(found || null);

      const submissions: Submission[] = subData.data || [];
      const existingSub = submissions.find((s) => s.assignment_id === testId);
      if (existingSub) {
        setExistingSubmission(existingSub);
        setSubmitted(true);
        setResults(existingSub.answers || []);
      }
    } catch (err) {
      console.error('Failed to fetch test:', err);
    } finally {
      setLoading(false);
    }
  }, [token, testId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Timer countdown
  useEffect(() => {
    if (!testStarted || submitted || timeLeft === null || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [testStarted, submitted, timeLeft]);

  // Auto-submit when timer reaches 0
  useEffect(() => {
    if (timeLeft === 0 && testStarted && !submitted && !autoSubmitRef.current) {
      autoSubmitRef.current = true;
      handleSubmit();
    }
  }, [timeLeft, testStarted, submitted]);

  const startTest = () => {
    if (assignment?.time_limit_minutes) {
      setTimeLeft(assignment.time_limit_minutes * 60);
    }
    setTestStarted(true);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
          assignment_id: testId,
          answers: answerPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Đã xảy ra lỗi khi nộp bài');
        return;
      }

      setSubmitted(true);
      if (timerRef.current) clearInterval(timerRef.current);

      // Re-fetch to get graded results
      const subRes = await fetch('/api/student/submissions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subData = await subRes.json();
      const newSub = (subData.data || []).find(
        (s: Submission) => s.assignment_id === testId
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
            <p className="text-muted-foreground">Không tìm thấy bài kiểm tra</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const questions = assignment.questions || [];
  const answeredCount = Object.keys(answers).filter(
    (qId) => answers[qId]?.selected_option_id || answers[qId]?.answer_text
  ).length;

  // Pre-test screen
  if (!testStarted && !submitted) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{assignment.title}</CardTitle>
            {assignment.description && (
              <CardDescription>{assignment.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Lớp</span>
                <span className="font-medium">{assignment.class?.name || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Số câu hỏi</span>
                <span className="font-medium">{questions.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Tổng điểm</span>
                <span className="font-medium">{assignment.total_points} điểm</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 text-orange-800">
                <span className="flex items-center gap-1">
                  <Timer className="h-4 w-4" />
                  Thời gian làm bài
                </span>
                <span className="font-bold">{assignment.time_limit_minutes} phút</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 text-yellow-800 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Khi bắt đầu, đồng hồ sẽ đếm ngược. Bài sẽ tự động nộp khi hết thời gian.
            </div>
            <Button className="w-full" size="lg" onClick={startTest}>
              <Timer className="h-4 w-4 mr-2" />
              Bắt đầu làm bài
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
      </div>

      {/* Timer bar */}
      {testStarted && !submitted && timeLeft !== null && (
        <div
          className={`sticky top-0 z-30 flex items-center justify-between p-3 rounded-lg border shadow-sm ${
            timeLeft <= 60
              ? 'bg-red-50 border-red-200 text-red-800'
              : timeLeft <= 300
              ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            <Clock className="h-4 w-4" />
            Thời gian còn lại
          </div>
          <div className="text-lg font-bold font-mono">{formatTime(timeLeft)}</div>
        </div>
      )}

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
                        const isWrong = submitted && isSelected && !option.is_correct;

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
                              onChange={() => handleOptionSelect(question.id, option.id)}
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
                        onChange={(e) => handleTextChange(question.id, e.target.value)}
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
      {!submitted && testStarted && questions.length > 0 && (
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
        title="Xác nhận nộp bài kiểm tra"
        description="Bạn không thể thay đổi câu trả lời sau khi nộp."
      >
        <div className="space-y-4">
          {answeredCount < questions.length && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 text-yellow-800 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Bạn còn {questions.length - answeredCount} câu chưa trả lời
            </div>
          )}
          {timeLeft !== null && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 text-blue-800 text-sm">
              <Clock className="h-4 w-4 shrink-0" />
              Thời gian còn lại: {formatTime(timeLeft)}
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
