'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { DataTable } from '@/components/shared/DataTable';
import { ClipboardCheck, Clock, CheckCircle, AlertCircle, Timer } from 'lucide-react';
import Link from 'next/link';
import { Assignment, Submission } from '@/types';

type AssignmentWithClass = Omit<Assignment, 'class'> & {
  class: { name: string };
};

export default function StudentTestsPage() {
  const { token } = useAuth();
  const [tests, setTests] = useState<AssignmentWithClass[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

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

      // Filter only tests (assignments with time_limit_minutes)
      const allTests: AssignmentWithClass[] = (assignData.data || []).filter(
        (a: AssignmentWithClass) => a.time_limit_minutes && a.time_limit_minutes > 0
      );
      setTests(allTests);
      setSubmissions(subData.data || []);
    } catch (err) {
      console.error('Failed to fetch tests:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getSubmission = (assignmentId: string) => {
    return submissions.find((s) => s.assignment_id === assignmentId);
  };

  const getStatus = (test: AssignmentWithClass) => {
    const sub = getSubmission(test.id);
    if (!sub) {
      if (test.due_date && new Date(test.due_date) < new Date()) {
        return { label: 'Quá hạn', variant: 'destructive' as const, icon: AlertCircle };
      }
      return { label: 'Chờ làm', variant: 'warning' as const, icon: Clock };
    }
    if (sub.status === 'graded') {
      return { label: `Đã chấm: ${sub.score}đ`, variant: 'success' as const, icon: CheckCircle };
    }
    return { label: 'Đã nộp', variant: 'secondary' as const, icon: CheckCircle };
  };

  if (loading) return <LoadingSpinner />;

  const columns = [
    {
      key: 'title',
      label: 'Tiêu đề',
      render: (item: AssignmentWithClass) => (
        <div className="font-medium">{item.title}</div>
      ),
    },
    {
      key: 'class',
      label: 'Lớp',
      render: (item: AssignmentWithClass) => item.class?.name || '—',
    },
    {
      key: 'time_limit_minutes',
      label: 'Thời gian',
      render: (item: AssignmentWithClass) => (
        <div className="flex items-center gap-1">
          <Timer className="h-3 w-3" />
          {item.time_limit_minutes} phút
        </div>
      ),
    },
    {
      key: 'total_points',
      label: 'Tổng điểm',
      render: (item: AssignmentWithClass) => `${item.total_points} điểm`,
    },
    {
      key: 'due_date',
      label: 'Hạn nộp',
      render: (item: AssignmentWithClass) =>
        item.due_date
          ? new Date(item.due_date).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Không giới hạn',
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (item: AssignmentWithClass) => {
        const status = getStatus(item);
        return (
          <Badge variant={status.variant}>
            <status.icon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bài kiểm tra</h1>
        <p className="text-muted-foreground">Danh sách bài kiểm tra có giới hạn thời gian</p>
      </div>

      {tests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có bài kiểm tra nào</p>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={tests as unknown as Record<string, unknown>[]}
          searchPlaceholder="Tìm kiếm bài kiểm tra..."
          actions={(item) => {
            const test = item as unknown as AssignmentWithClass;
            const sub = getSubmission(test.id);
            return (
              <Link href={`/student/tests/${test.id}`}>
                <Button variant={sub ? 'outline' : 'default'} size="sm">
                  {sub ? 'Xem lại' : 'Làm bài'}
                </Button>
              </Link>
            );
          }}
        />
      )}
    </div>
  );
}
