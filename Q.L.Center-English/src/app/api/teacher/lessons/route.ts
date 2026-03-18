import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await requireRole(request, ['teacher']);
    if (!user) return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('class_id');

    let query = supabaseAdmin.from('lessons').select('*');

    if (classId) {
      query = query.eq('class_id', classId);
    } else {
      // Get teacher's class IDs
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

    const { data, error } = await query.order('order_index', { ascending: true });
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
    const { class_id, title, content, content_type, file_url, youtube_url, drive_url, order_index, is_published } = body;

    if (!title || !class_id) return NextResponse.json({ error: 'Tiêu đề và lớp là bắt buộc' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('lessons')
      .insert({
        class_id,
        title,
        content,
        content_type: content_type || 'text',
        file_url,
        youtube_url,
        drive_url,
        order_index: order_index || 0,
        is_published: is_published || false,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireRole(request, ['teacher']);
    if (!user) return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });

    const { id, title, content, content_type, file_url, youtube_url, drive_url, order_index, is_published } = await request.json();

    const { data, error } = await supabaseAdmin
      .from('lessons')
      .update({
        title,
        content,
        content_type,
        file_url,
        youtube_url,
        drive_url,
        order_index,
        is_published,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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

    const { error } = await supabaseAdmin.from('lessons').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ message: 'Đã xóa bài học' });
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 });
  }
}
