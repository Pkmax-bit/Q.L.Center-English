import { supabaseAdmin } from './supabase/server';
import { supabase } from './supabase/client';
import { Profile } from '@/types';

export async function verifyAuth(request: Request): Promise<Profile | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile as Profile | null;
}

export async function requireRole(request: Request, roles: string[]): Promise<Profile | null> {
  const profile = await verifyAuth(request);
  if (!profile || !roles.includes(profile.role)) {
    return null;
  }
  return profile;
}
