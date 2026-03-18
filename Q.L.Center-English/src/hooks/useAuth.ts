'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Profile } from '@/types';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      setToken(session.access_token);

      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại');

    // Set session in browser
    await supabase.auth.setSession({
      access_token: data.data.session.access_token,
      refresh_token: data.data.session.refresh_token,
    });

    setUser(data.data.profile);
    setToken(data.data.session.access_token);

    // Redirect based on role
    const role = data.data.profile.role;
    router.push(`/${role}`);

    return data.data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  return { user, loading, token, login, logout, refreshProfile: fetchProfile };
}
