import { useQuery } from '@tanstack/react-query';
import api from '../api';
import type { DashboardStats } from '../types';
import { queryKeys } from '../queryKeys';

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: async () => (await api.get<DashboardStats>('/dashboard/stats')).data,
  });
}
