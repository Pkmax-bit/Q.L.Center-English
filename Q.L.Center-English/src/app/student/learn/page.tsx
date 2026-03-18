'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import Link from 'next/link';
import { Lesson } from '@/types';

type LessonWithClass = Omit<Lesson, 'class'> & {
  class: { name: string };
};

interface ClassGroup {
  classId: string;
  className: string;
  lessons: LessonWithClass[];
}

export default function StudentLearnPage() {
  const { token } = useAuth();
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchLessons = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/student/lessons', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const lessons: LessonWithClass[] = data.data || [];

      // Group by class
      const groups: Record<string, ClassGroup> = {};
      lessons.forEach((lesson) => {
        const classId = lesson.class_id || 'unknown';
        const className = lesson.class?.name || 'Chưa xác định';
        if (!groups[classId]) {
          groups[classId] = { classId, className, lessons: [] };
        }
        groups[classId].lessons.push(lesson);
      });

      setClassGroups(Object.values(groups));
      // Expand all by default
      setExpandedClasses(new Set(Object.keys(groups)));
    } catch (err) {
      console.error('Failed to fetch lessons:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const toggleClass = (classId: string) => {
    setExpandedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) {
        next.delete(classId);
      } else {
        next.add(classId);
      }
      return next;
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bài học</h1>
        <p className="text-muted-foreground">Danh sách bài học theo lớp</p>
      </div>

      {classGroups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Bạn chưa được ghi danh vào lớp nào</p>
          </CardContent>
        </Card>
      ) : (
        classGroups.map((group) => (
          <Card key={group.classId}>
            <CardHeader
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleClass(group.classId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{group.className}</CardTitle>
                    <CardDescription>{group.lessons.length} bài học</CardDescription>
                  </div>
                </div>
                {expandedClasses.has(group.classId) ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            {expandedClasses.has(group.classId) && (
              <CardContent>
                <div className="space-y-2">
                  {group.lessons.map((lesson, index) => (
                    <Link
                      key={lesson.id}
                      href={`/student/learn/${lesson.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{lesson.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">
                            {lesson.content_type === 'text'
                              ? 'Văn bản'
                              : lesson.content_type === 'youtube'
                              ? 'Video'
                              : lesson.content_type === 'drive'
                              ? 'Drive'
                              : lesson.content_type === 'file'
                              ? 'Tệp'
                              : 'Hỗn hợp'}
                          </Badge>
                        </div>
                      </div>
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
