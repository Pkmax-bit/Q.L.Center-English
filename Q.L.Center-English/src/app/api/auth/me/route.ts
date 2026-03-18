import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const profile = await verifyAuth(request);
    if (!profile) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    return NextResponse.json({ data: profile });
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 });
  }
}
