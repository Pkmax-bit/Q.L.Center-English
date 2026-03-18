'use client';

import { useCallback } from 'react';
import { useAuth } from './useAuth';

export function useSupabase() {
  const { token } = useAuth();

  const fetchApi = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Có lỗi xảy ra');
    }

    return data;
  }, [token]);

  return { fetchApi };
}
