import { supabaseAdmin } from './supabase/server';
import { Profile } from '@/types';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret-change-me'
);

export async function verifyAuth(request: Request): Promise<Profile | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.sub;

    if (!userId) {
      return null;
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, phone, avatar_url, is_active, created_at, updated_at')
      .eq('id', userId)
      .single();

    return profile as Profile | null;
  } catch {
    return null;
  }
}

export async function requireRole(request: Request, roles: string[]): Promise<Profile | null> {
  const profile = await verifyAuth(request);
  if (!profile || !roles.includes(profile.role)) {
    return null;
  }
  return profile;
}
