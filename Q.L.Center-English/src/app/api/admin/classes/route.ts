import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await requireRole(request, ['admin']);
    if (!user) return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });

    const { data, error } = await supabaseAdmin
      .from('classes')
      .select('*, subject:subjects(*), teacher:profiles!teacher_id(*)')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Get student counts
    const classIds = (data || []).map((c: Record<string, unknown>) => c.id);
    const { data: counts } = await supabaseAdmin
      .from('class_students')
      .select('class_id')
      .in('class_id', classIds)
      .eq('status', 'active');

    const countMap: Record<string, number> = {};
    (counts || []).forEach((c: Record<string, unknown>) => {
      const cid = c.class_id as string;
      countMap[cid] = (countMap[cid] || 0) + 1;
    });

    const enriched = (data || []).map((c: Record<string, unknown>) => ({
      ...c,
      student_count: countMap[c.id as string] || 0,
    }));

    return NextResponse.json({ data: enriched });
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(request, ['admin']);
    if (!user) return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });

    const body = await request.json();
    const { name, subject_id, teacher_id, description, max_students, start_date, end_date, student_ids } = body;

    if (!name) return NextResponse.json({ error: 'Tên lớp là bắt buộc' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('classes')
      .insert({
        name,
        subject_id: subject_id || null,
        teacher_id: teacher_id || null,
        description,
        max_students: max_students || 30,
        start_date: start_date || null,
        end_date: end_date || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Add students if provided
    if (student_ids && student_ids.length > 0) {
      const classStudents = student_ids.map((sid: string) => ({
        class_id: data.id,
        student_id: sid,
      }));
      await supabaseAdmin.from('class_students').insert(classStudents);
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireRole(request, ['admin']);
    if (!user) return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });

    const { id, name, subject_id, teacher_id, description, max_students, status, start_date, end_date, student_ids } = await request.json();

    const { data, error } = await supabaseAdmin
      .from('classes')
      .update({
        name,
        subject_id: subject_id || null,
        teacher_id: teacher_id || null,
        description,
        max_students,
        status,
        start_date: start_date || null,
        end_date: end_date || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update students if provided
    if (student_ids !== undefined) {
      await supabaseAdmin.from('class_students').delete().eq('class_id', id);
      if (student_ids.length > 0) {
        const classStudents = student_ids.map((sid: string) => ({
          class_id: id,
          student_id: sid,
        }));
        await supabaseAdmin.from('class_students').insert(classStudents);
      }
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireRole(request, ['admin']);
    if (!user) return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Thiếu ID' }, { status: 400 });

    const { error } = await supabaseAdmin.from('classes').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ message: 'Đã xóa lớp học' });
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 });
  }
}
