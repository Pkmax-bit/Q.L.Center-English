import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret-change-me'
);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email và mật khẩu là bắt buộc' }, { status: 400 });
    }

    // Tìm user trong bảng profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Email hoặc mật khẩu không đúng' }, { status: 401 });
    }

    if (!profile.is_active) {
      return NextResponse.json({ error: 'Tài khoản đã bị vô hiệu hóa' }, { status: 403 });
    }

    if (!profile.password_hash) {
      return NextResponse.json({ error: 'Tài khoản chưa được thiết lập mật khẩu' }, { status: 401 });
    }

    // So sánh password
    const isValid = await bcrypt.compare(password, profile.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Email hoặc mật khẩu không đúng' }, { status: 401 });
    }

    // Tạo JWT token
    const token = await new SignJWT({
      sub: profile.id,
      email: profile.email,
      role: profile.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // Bỏ password_hash khỏi response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...safeProfile } = profile;

    return NextResponse.json({
      data: {
        session: {
          access_token: token,
          token_type: 'bearer',
          expires_in: 7 * 24 * 60 * 60,
        },
        profile: safeProfile,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 });
  }
}
