'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { BookOpen, FileText, CheckCircle, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalClasses: number;
  pendingAssignments: number;
  submittedCount: number;
  averageScore: number;
}

export default function StudentDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalClasses: 0,
    pendingAssignments: 0,
    submittedCount: 0,
    averageScore: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [lessonsRes, assignmentsRes, submissionsRes] = await Promise.all([
        fetch('/api/student/lessons', { headers }),
        fetch('/api/student/assignments', { headers }),
        fetch('/api/student/submissions', { headers }),
      ]);

      const lessonsData = await lessonsRes.json();
      const assignmentsData = await assignmentsRes.json();
      const submissionsData = await submissionsRes.json();

      const lessons = lessonsData.data || [];
      const assignments = assignmentsData.data || [];
      const submissions = submissionsData.data || [];

      // Count unique classes from lessons
      const classIds = new Set(lessons.map((l: { class_id: string }) => l.class_id));

      // Submitted assignment IDs
      const submittedAssignmentIds = new Set(
        submissions.map((s: { assignment_id: string }) => s.assignment_id)
      );

      // Pending = not yet submitted
      const pending = assignments.filter(
        (a: { id: string }) => !submittedAssignmentIds.has(a.id)
      );

      // Average score of graded submissions
      const gradedSubmissions = submissions.filter(
        (s: { status: string; score: number | null }) => s.status === 'graded' && s.score !== null
      );
      const avgScore =
        gradedSubmissions.length > 0
          ? gradedSubmissions.reduce(
              (sum: number, s: { score: number }) => sum + s.score,
              0
            ) / gradedSubmissions.length
          : 0;

      setStats({
        totalClasses: classIds.size,
        pendingAssignments: pending.length,
        submittedCount: submissions.length,
        averageScore: Math.round(avgScore * 10) / 10,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) return <LoadingSpinner />;

  const statCards = [
    {
      title: 'Số lớp đang học',
      value: stats.totalClasses,
      icon: BookOpen,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Bài tập chờ làm',
      value: stats.pendingAssignments,
      icon: FileText,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: 'Bài đã nộp',
      value: stats.submittedCount,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Điểm trung bình',
      value: stats.averageScore,
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trang chủ</h1>
        <p className="text-muted-foreground">Tổng quan hoạt động học tập</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
