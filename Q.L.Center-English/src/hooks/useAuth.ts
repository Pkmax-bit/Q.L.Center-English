'use client';

import { useState, useEffect, useCallback } from 'react';
import { Profile } from '@/types';
import { useRouter } from 'next/navigation';

const TOKEN_KEY = 'auth_token';

export function useAuth() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  const fetchProfile = useCallback(async () => {
    try {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (!savedToken) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      setToken(savedToken);

      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${savedToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.data);
      } else {
        // Token không hợp lệ hoặc hết hạn
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setToken(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại');

    // Lưu token vào localStorage
    const accessToken = data.data.session.access_token;
    localStorage.setItem(TOKEN_KEY, accessToken);

    setUser(data.data.profile);
    setToken(accessToken);

    // Redirect theo role
    const role = data.data.profile.role;
    router.push(`/${role}`);

    return data.data;
  };

  const logout = async () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  return { user, loading, token, login, logout, refreshProfile: fetchProfile };
}
