'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Calendar, Clock } from 'lucide-react';
import { Schedule } from '@/types';

type ScheduleWithRelations = Omit<Schedule, 'class' | 'room'> & {
  class?: {
    name: string;
    teacher?: { full_name: string };
  };
  room?: { name: string };
};

const DAY_NAMES = [
  'Chủ nhật',
  'Thứ 2',
  'Thứ 3',
  'Thứ 4',
  'Thứ 5',
  'Thứ 6',
  'Thứ 7',
];

const DAY_COLORS = [
  'bg-red-50 border-red-200',
  'bg-blue-50 border-blue-200',
  'bg-green-50 border-green-200',
  'bg-yellow-50 border-yellow-200',
  'bg-purple-50 border-purple-200',
  'bg-orange-50 border-orange-200',
  'bg-pink-50 border-pink-200',
];

const DAY_TEXT_COLORS = [
  'text-red-700',
  'text-blue-700',
  'text-green-700',
  'text-yellow-700',
  'text-purple-700',
  'text-orange-700',
  'text-pink-700',
];

export default function StudentSchedulePage() {
  const { token } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/student/schedule', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSchedules(data.data || []);
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  if (loading) return <LoadingSpinner />;

  // Group schedules by day of week
  const schedulesByDay: Record<number, ScheduleWithRelations[]> = {};
  schedules.forEach((s) => {
    if (!schedulesByDay[s.day_of_week]) {
      schedulesByDay[s.day_of_week] = [];
    }
    schedulesByDay[s.day_of_week].push(s);
  });

  // Sort days: Monday (1) through Sunday (0)
  const orderedDays = [1, 2, 3, 4, 5, 6, 0].filter(
    (day) => schedulesByDay[day] && schedulesByDay[day].length > 0
  );

  const formatTime = (time: string) => {
    return time.substring(0, 5); // "HH:MM"
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Thời khóa biểu</h1>
        <p className="text-muted-foreground">Lịch học hàng tuần</p>
      </div>

      {schedules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có lịch học nào</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop: Table view */}
          <div className="hidden lg:block">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                          <th
                            key={day}
                            className={`h-12 px-3 text-center font-medium min-w-[140px] ${
                              new Date().getDay() === day
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {DAY_NAMES[day]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                          <td key={day} className="p-2 align-top border-r last:border-r-0">
                            <div className="space-y-2 min-h-[100px]">
                              {(schedulesByDay[day] || []).map((s) => (
                                <div
                                  key={s.id}
                                  className={`p-2 rounded-lg border text-xs ${DAY_COLORS[day]}`}
                                >
                                  <p className={`font-semibold ${DAY_TEXT_COLORS[day]}`}>
                                    {s.class?.name}
                                  </p>
                                  <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {formatTime(s.start_time)} - {formatTime(s.end_time)}
                                  </div>
                                  {s.class?.teacher && (
                                    <p className="mt-1 text-muted-foreground">
                                      GV: {s.class.teacher.full_name}
                                    </p>
                                  )}
                                  {s.room && (
                                    <p className="text-muted-foreground">
                                      Phòng: {s.room.name}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile: Card per day */}
          <div className="lg:hidden space-y-4">
            {orderedDays.map((day) => (
              <Card key={day}>
                <CardHeader className="pb-2">
                  <CardTitle
                    className={`text-base flex items-center gap-2 ${
                      new Date().getDay() === day ? 'text-primary' : ''
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    {DAY_NAMES[day]}
                    {new Date().getDay() === day && (
                      <Badge variant="default" className="text-xs">
                        Hôm nay
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(schedulesByDay[day] || []).map((s) => (
                    <div
                      key={s.id}
                      className={`p-3 rounded-lg border ${DAY_COLORS[day]}`}
                    >
                      <p className={`font-semibold ${DAY_TEXT_COLORS[day]}`}>
                        {s.class?.name}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(s.start_time)} - {formatTime(s.end_time)}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        {s.class?.teacher && (
                          <span>GV: {s.class.teacher.full_name}</span>
                        )}
                        {s.room && <span>Phòng: {s.room.name}</span>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
