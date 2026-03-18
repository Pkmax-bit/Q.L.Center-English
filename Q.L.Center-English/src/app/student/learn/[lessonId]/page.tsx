'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ArrowLeft, Download, ExternalLink, PlayCircle } from 'lucide-react';
import { Lesson } from '@/types';

type LessonWithClass = Omit<Lesson, 'class'> & {
  class?: { name: string };
};

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/
  );
  return match ? match[1] : null;
}

export default function LessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [lesson, setLesson] = useState<LessonWithClass | null>(null);
  const [loading, setLoading] = useState(true);

  const lessonId = params.lessonId as string;

  const fetchLesson = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/student/lessons', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const lessons: LessonWithClass[] = data.data || [];
      const found = lessons.find((l) => l.id === lessonId);
      setLesson(found || null);
    } catch (err) {
      console.error('Failed to fetch lesson:', err);
    } finally {
      setLoading(false);
    }
  }, [token, lessonId]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  if (loading) return <LoadingSpinner />;

  if (!lesson) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Không tìm thấy bài học</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const youtubeId = lesson.youtube_url ? extractYouTubeId(lesson.youtube_url) : null;

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
            {lesson.class && (
              <Badge variant="secondary">{lesson.class.name}</Badge>
            )}
            <Badge variant="outline">
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
          <CardTitle className="text-2xl">{lesson.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Lesson content */}
          {lesson.content && (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
            </div>
          )}

          {/* YouTube embed */}
          {youtubeId && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <PlayCircle className="h-4 w-4 text-red-600" />
                Video bài học
              </div>
              <div className="aspect-video rounded-lg overflow-hidden border">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title={lesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          )}

          {/* Google Drive embed */}
          {lesson.drive_url && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ExternalLink className="h-4 w-4 text-blue-600" />
                Tài liệu Google Drive
              </div>
              <div className="aspect-[4/3] rounded-lg overflow-hidden border">
                <iframe
                  src={lesson.drive_url.replace('/view', '/preview')}
                  title="Google Drive Document"
                  className="w-full h-full"
                  allow="autoplay"
                />
              </div>
              <a
                href={lesson.drive_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Mở trong Google Drive
              </a>
            </div>
          )}

          {/* File download */}
          {lesson.file_url && (
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
              <Download className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Tệp đính kèm</p>
                <p className="text-xs text-muted-foreground">Nhấn để tải về</p>
              </div>
              <a href={lesson.file_url} download target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Tải xuống
                </Button>
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
