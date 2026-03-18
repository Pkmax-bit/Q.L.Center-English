'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { DataTable } from '@/components/shared/DataTable';
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Assignment, Submission } from '@/types';

type AssignmentWithClass = Omit<Assignment, 'class'> & {
  class: { name: string };
};

export default function StudentAssignmentsPage() {
  const { token } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentWithClass[]>([]);
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

      // Filter out tests (assignments with time_limit_minutes)
      const allAssignments: AssignmentWithClass[] = (assignData.data || []).filter(
        (a: AssignmentWithClass) => !a.time_limit_minutes
      );
      setAssignments(allAssignments);
      setSubmissions(subData.data || []);
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
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

  const getStatus = (assignment: AssignmentWithClass) => {
    const sub = getSubmission(assignment.id);
    if (!sub) {
      if (assignment.due_date && new Date(assignment.due_date) < new Date()) {
        return { label: 'Quá hạn', variant: 'destructive' as const, icon: AlertCircle };
      }
      return { label: 'Chờ làm', variant: 'warning' as const, icon: Clock };
    }
    if (sub.status === 'graded') {
      return { label: `Đã chấm: ${sub.score}đ`, variant: 'success' as const, icon: CheckCircle };
    }
    return { label: 'Đã nộp', variant: 'secondary' as const, icon: CheckCircle };
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'mcq': return 'Trắc nghiệm';
      case 'essay': return 'Tự luận';
      case 'mixed': return 'Hỗn hợp';
      default: return type;
    }
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
      key: 'assignment_type',
      label: 'Loại',
      render: (item: AssignmentWithClass) => (
        <Badge variant="outline">{getTypeLabel(item.assignment_type)}</Badge>
      ),
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
        <h1 className="text-2xl font-bold">Bài tập</h1>
        <p className="text-muted-foreground">Danh sách bài tập từ các lớp đang học</p>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có bài tập nào</p>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={assignments as unknown as Record<string, unknown>[]}
          searchPlaceholder="Tìm kiếm bài tập..."
          actions={(item) => {
            const assignment = item as unknown as AssignmentWithClass;
            const sub = getSubmission(assignment.id);
            return (
              <Link href={`/student/assignments/${assignment.id}`}>
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
