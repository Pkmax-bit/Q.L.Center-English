import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await requireRole(request, ['student']);
    if (!user) return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });

    const { data, error } = await supabaseAdmin
      .from('submissions')
      .select('*, assignment:assignments(title, total_points, class:classes(name)), answers:submission_answers(*)')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(request, ['student']);
    if (!user) return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });

    const body = await request.json();
    const { assignment_id, answers } = body;

    // Check if already submitted
    const { data: existing } = await supabaseAdmin
      .from('submissions')
      .select('id')
      .eq('assignment_id', assignment_id)
      .eq('student_id', user.id)
      .in('status', ['submitted', 'graded'])
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Bạn đã nộp bài này rồi' }, { status: 400 });
    }

    // Create submission
    const { data: submission, error: subError } = await supabaseAdmin
      .from('submissions')
      .insert({
        assignment_id,
        student_id: user.id,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });

    // Get assignment questions for auto-grading MCQ
    const { data: questions } = await supabaseAdmin
      .from('assignment_questions')
      .select('*')
      .eq('assignment_id', assignment_id);

    let totalScore = 0;
    const answerRecords = (answers || []).map((ans: { question_id: string; answer_text?: string; selected_option_id?: string }) => {
      const question = (questions || []).find((q: { id: string }) => q.id === ans.question_id);
      let is_correct: boolean | null = null;
      let points_earned = 0;

      if (question && question.question_type === 'mcq' && question.options) {
        const correctOption = question.options.find((o: { is_correct: boolean }) => o.is_correct);
        is_correct = correctOption ? correctOption.id === ans.selected_option_id : false;
        points_earned = is_correct ? question.points : 0;
        totalScore += points_earned;
      }

      return {
        submission_id: submission.id,
        question_id: ans.question_id,
        answer_text: ans.answer_text || null,
        selected_option_id: ans.selected_option_id || null,
        is_correct,
        points_earned,
      };
    });

    if (answerRecords.length > 0) {
      await supabaseAdmin.from('submission_answers').insert(answerRecords);
    }

    // Auto-grade if all MCQ
    const allMcq = (questions || []).every((q: { question_type: string }) => q.question_type === 'mcq');
    if (allMcq && questions && questions.length > 0) {
      await supabaseAdmin
        .from('submissions')
        .update({ score: totalScore, status: 'graded', graded_at: new Date().toISOString() })
        .eq('id', submission.id);
    }

    return NextResponse.json({ data: submission });
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 });
  }
}
