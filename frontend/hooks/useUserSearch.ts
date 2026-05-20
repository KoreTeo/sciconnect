'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { User } from '@/lib/types';

export function useUserSearch(query: string, minLength = 3) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ['users', 'search', trimmed],
    queryFn: async () => (await api.get<User[]>(`/users/search?q=${encodeURIComponent(trimmed)}`)).data,
    enabled: trimmed.length >= minLength,
    staleTime: 30_000,
  });
}
