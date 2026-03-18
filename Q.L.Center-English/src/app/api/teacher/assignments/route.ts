import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await requireRole(request, ['teacher']);
    if (!user) return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('class_id');

    let query = supabaseAdmin.from('assignments').select('*, questions:assignment_questions(*)');

    if (classId) {
      query = query.eq('class_id', classId);
    } else {
      const { data: classes } = await supabaseAdmin
        .from('classes')
        .select('id')
        .eq('teacher_id', user.id);
      const classIds = (classes || []).map((c: { id: string }) => c.id);
      if (classIds.length > 0) {
        query = query.in('class_id', classIds);
      } else {
        return NextResponse.json({ data: [] });
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(request, ['teacher']);
    if (!user) return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });

    const body = await request.json();
    const { class_id, lesson_id, title, description, assignment_type, due_date, total_points, time_limit_minutes, is_published, questions } = body;

    if (!title || !class_id) return NextResponse.json({ error: 'Tiêu đề và lớp là bắt buộc' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('assignments')
      .insert({
        class_id,
        lesson_id: lesson_id || null,
        title,
        description,
        assignment_type: assignment_type || 'mixed',
        due_date: due_date || null,
        total_points: total_points || 100,
        time_limit_minutes: time_limit_minutes || null,
        is_published: is_published || false,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (questions && questions.length > 0) {
      const qs = questions.map((q: Record<string, unknown>, i: number) => ({
        assignment_id: data.id,
        question_text: q.question_text,
        question_type: q.question_type || 'mcq',
        options: q.options || null,
        correct_answer: q.correct_answer || null,
        points: q.points || 10,
        order_index: i,
      }));
      await supabaseAdmin.from('assignment_questions').insert(qs);
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireRole(request, ['teacher']);
    if (!user) return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });

    const { id, title, description, assignment_type, due_date, total_points, time_limit_minutes, is_published, questions } = await request.json();

    const { data, error } = await supabaseAdmin
      .from('assignments')
      .update({
        title,
        description,
        assignment_type,
        due_date,
        total_points,
        time_limit_minutes,
        is_published,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (questions !== undefined) {
      await supabaseAdmin.from('assignment_questions').delete().eq('assignment_id', id);
      if (questions.length > 0) {
        const qs = questions.map((q: Record<string, unknown>, i: number) => ({
          assignment_id: id,
          question_text: q.question_text,
          question_type: q.question_type || 'mcq',
          options: q.options || null,
          correct_answer: q.correct_answer || null,
          points: q.points || 10,
          order_index: i,
        }));
        await supabaseAdmin.from('assignment_questions').insert(qs);
      }
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireRole(request, ['teacher']);
    if (!user) return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Thiếu ID' }, { status: 400 });

    const { error } = await supabaseAdmin.from('assignments').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ message: 'Đã xóa bài tập' });
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 });
  }
}
