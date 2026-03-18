import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await requireRole(request, ['admin']);
    if (!user) return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });

    const { data, error } = await supabaseAdmin
      .from('assignments')
      .select('*, questions:assignment_questions(*)')
      .eq('is_template', true)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(request, ['admin']);
    if (!user) return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });

    const body = await request.json();
    const { title, description, assignment_type, total_points, time_limit_minutes, questions } = body;

    if (!title) return NextResponse.json({ error: 'Tiêu đề là bắt buộc' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('assignments')
      .insert({
        title,
        description,
        assignment_type: assignment_type || 'mixed',
        total_points: total_points || 100,
        time_limit_minutes,
        is_template: true,
        is_published: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Add questions if provided
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
    const user = await requireRole(request, ['admin']);
    if (!user) return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });

    const { id, title, description, assignment_type, total_points, time_limit_minutes, questions } = await request.json();

    const { data, error } = await supabaseAdmin
      .from('assignments')
      .update({
        title,
        description,
        assignment_type,
        total_points,
        time_limit_minutes,
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
    const user = await requireRole(request, ['admin']);
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
