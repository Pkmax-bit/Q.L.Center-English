import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await requireRole(request, ['student']);
    if (!user) return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });

    const { data: enrollments } = await supabaseAdmin
      .from('class_students')
      .select('class_id')
      .eq('student_id', user.id)
      .eq('status', 'active');

    const classIds = (enrollments || []).map((e: { class_id: string }) => e.class_id);
    if (classIds.length === 0) return NextResponse.json({ data: [] });

    const { data, error } = await supabaseAdmin
      .from('schedules')
      .select('*, class:classes(name, teacher:profiles(full_name)), room:facilities(name)')
      .in('class_id', classIds)
      .eq('is_active', true)
      .order('day_of_week')
      .order('start_time');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 });
  }
}
