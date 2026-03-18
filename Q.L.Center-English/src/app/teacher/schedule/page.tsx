"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useToast } from "@/components/ui/toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Schedule } from "@/types";

const dayNames: Record<number, string> = {
  0: "CN",
  1: "T2",
  2: "T3",
  3: "T4",
  4: "T5",
  5: "T6",
  6: "T7",
};

const dayOrder = [1, 2, 3, 4, 5, 6, 0]; // T2-T7, CN

const timeSlots = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

function formatTime(time: string): string {
  return time.slice(0, 5);
}

function getSlotIndex(time: string): number {
  const hour = parseInt(time.slice(0, 2));
  return timeSlots.findIndex((s) => parseInt(s.slice(0, 2)) === hour);
}

function getSlotSpan(start: string, end: string): number {
  const startHour = parseInt(start.slice(0, 2));
  const endHour = parseInt(end.slice(0, 2));
  return Math.max(1, endHour - startHour);
}

export default function TeacherSchedulePage() {
  const { token, loading } = useAuth();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [fetching, setFetching] = useState(true);

  const fetchSchedule = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/teacher/schedule", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.data || []);
      } else {
        toast({ title: "Lỗi", description: "Không thể tải thời khóa biểu", variant: "destructive" });
      }
    } catch {
      toast({ title: "Lỗi", description: "Không thể tải thời khóa biểu", variant: "destructive" });
    } finally {
      setFetching(false);
    }
  }, [token, toast]);

  useEffect(() => {
    if (token) fetchSchedule();
  }, [token, fetchSchedule]);

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  // Group schedules by day
  const schedulesByDay: Record<number, Schedule[]> = {};
  for (const day of dayOrder) {
    schedulesByDay[day] = schedules.filter((s) => s.day_of_week === day);
  }

  // Build occupied cells to track multi-slot entries
  const occupied: Record<string, boolean> = {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Thời khóa biểu</h1>
        <p className="text-muted-foreground">Lịch giảng dạy hàng tuần của bạn</p>
      </div>

      {schedules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Chưa có lịch giảng dạy nào được sắp xếp.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop: Grid view */}
          <div className="hidden md:block overflow-x-auto">
            <div className="rounded-md border min-w-[800px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-12 px-3 text-left font-medium text-muted-foreground w-20">
                      Giờ
                    </th>
                    {dayOrder.map((day) => (
                      <th
                        key={day}
                        className="h-12 px-3 text-center font-medium text-muted-foreground"
                      >
                        {dayNames[day]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((slot) => {
                    const slotHour = parseInt(slot.slice(0, 2));
                    return (
                      <tr key={slot} className="border-b">
                        <td className="px-3 py-2 text-muted-foreground font-mono text-xs">
                          {slot}
                        </td>
                        {dayOrder.map((day) => {
                          const cellKey = `${day}-${slot}`;
                          if (occupied[cellKey]) return null;

                          const entry = schedulesByDay[day]?.find(
                            (s) => parseInt(s.start_time.slice(0, 2)) === slotHour
                          );

                          if (entry) {
                            const span = getSlotSpan(entry.start_time, entry.end_time);
                            // Mark cells as occupied
                            for (let i = 1; i < span; i++) {
                              const h = slotHour + i;
                              const k = `${day}-${String(h).padStart(2, "0")}:00`;
                              occupied[k] = true;
                            }
                            return (
                              <td
                                key={day}
                                rowSpan={span}
                                className="px-1 py-1"
                              >
                                <div className="rounded-md bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 p-2 h-full">
                                  <p className="font-medium text-xs text-green-800 dark:text-green-200 truncate">
                                    {entry.class?.name || "Lớp học"}
                                  </p>
                                  <p className="text-[10px] text-green-600 dark:text-green-400 mt-0.5">
                                    {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                                  </p>
                                  {entry.room && (
                                    <p className="text-[10px] text-green-600 dark:text-green-400">
                                      {entry.room.name}
                                    </p>
                                  )}
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td key={day} className="px-1 py-1">
                              <div className="h-8" />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: Card view by day */}
          <div className="md:hidden space-y-4">
            {dayOrder.map((day) => {
              const daySchedules = schedulesByDay[day];
              if (!daySchedules || daySchedules.length === 0) return null;
              return (
                <Card key={day}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{dayNames[day]}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {daySchedules
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between rounded-md border p-3"
                        >
                          <div>
                            <p className="font-medium text-sm">
                              {entry.class?.name || "Lớp học"}
                            </p>
                            {entry.class?.subject && (
                              <p className="text-xs text-muted-foreground">
                                {entry.class.subject.name}
                              </p>
                            )}
                            {entry.room && (
                              <p className="text-xs text-muted-foreground">
                                Phòng: {entry.room.name}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary">
                            {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                          </Badge>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
