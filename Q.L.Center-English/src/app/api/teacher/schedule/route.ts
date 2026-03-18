import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await requireRole(request, ['teacher']);
    if (!user) return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });

    const { data: classes } = await supabaseAdmin
      .from('classes')
      .select('id')
      .eq('teacher_id', user.id);

    const classIds = (classes || []).map((c: { id: string }) => c.id);
    if (classIds.length === 0) return NextResponse.json({ data: [] });

    const { data, error } = await supabaseAdmin
      .from('schedules')
      .select('*, class:classes(*, subject:subjects(*)), room:facilities(*)')
      .in('class_id', classIds)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 });
  }
}
