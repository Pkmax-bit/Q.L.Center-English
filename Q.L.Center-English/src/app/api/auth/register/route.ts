import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const admin = await requireRole(request, ['admin']);
    if (!admin) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }

    const { email, password, full_name, role, phone } = await request.json();

    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    if (!['admin', 'teacher', 'student'].includes(role)) {
      return NextResponse.json({ error: 'Role không hợp lệ' }, { status: 400 });
    }

    // Kiểm tra email đã tồn tại chưa
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Email đã được sử dụng' }, { status: 400 });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Tạo profile với password
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        email,
        full_name,
        role,
        phone: phone || null,
        password_hash,
      })
      .select('id, email, full_name, role, phone, avatar_url, is_active, created_at, updated_at')
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Không thể tạo tài khoản: ' + profileError.message }, { status: 500 });
    }

    return NextResponse.json({ data: profile });
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 });
  }
}
