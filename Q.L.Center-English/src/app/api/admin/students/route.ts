import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import bcrypt from 'bcryptjs';

const SAFE_FIELDS = 'id, email, full_name, role, phone, avatar_url, is_active, created_at, updated_at';

export async function GET(request: Request) {
  try {
    const admin = await requireRole(request, ['admin']);
    if (!admin) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select(SAFE_FIELDS)
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireRole(request, ['admin']);
    if (!admin) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }

    const { email, password, full_name, phone } = await request.json();

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    // Kiểm tra email trùng
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Email đã được sử dụng' }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        email,
        full_name,
        role: 'student',
        phone: phone || null,
        password_hash,
      })
      .select(SAFE_FIELDS)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Không thể tạo hồ sơ học sinh: ' + profileError.message }, { status: 500 });
    }

    return NextResponse.json({ data: profile });
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireRole(request, ['admin']);
    if (!admin) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }

    const { id, full_name, phone, is_active } = await request.json();

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ full_name, phone, is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(SAFE_FIELDS)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireRole(request, ['admin']);
    if (!admin) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Thiếu ID' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: 'Đã xóa học sinh' });
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 });
  }
}
