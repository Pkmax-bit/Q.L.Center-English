import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await requireRole(request, ['admin']);
    if (!user) return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });

    const { data, error } = await supabaseAdmin
      .from('subjects')
      .select('*')
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
    const { name, code, description } = body;

    if (!name || !code) return NextResponse.json({ error: 'Tên và mã môn học là bắt buộc' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('subjects')
      .insert({ name, code, description })
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
    const user = await requireRole(request, ['admin']);
    if (!user) return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });

    const { id, name, code, description, is_active } = await request.json();

    const { data, error } = await supabaseAdmin
      .from('subjects')
      .update({ name, code, description, is_active, updated_at: new Date().toISOString() })
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
    const user = await requireRole(request, ['admin']);
    if (!user) return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Thiếu ID' }, { status: 400 });

    const { error } = await supabaseAdmin.from('subjects').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ message: 'Đã xóa môn học' });
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 });
  }
}
