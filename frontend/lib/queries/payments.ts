import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import type { Payment } from '../types';
import { queryKeys } from '../queryKeys';

export function usePayment(id?: string | number) {
  return useQuery({
    queryKey: queryKeys.payments.detail(id),
    queryFn: async () => (await api.get<Payment>(`/payments/${id}`)).data,
    enabled: !!id,
  });
}

export interface CreatePaymentPayload {
  conference_id: number;
  paper_id?: number;
  registration_id?: number;
  purpose: 'submission' | 'registration';
  promo_code?: string;
}

export function useCreatePayment() {
  return useMutation({
    mutationFn: async (payload: CreatePaymentPayload) =>
      (await api.post<Payment>('/payments/create', payload)).data,
  });
}

function invalidatePaymentDependents(queryClient: ReturnType<typeof useQueryClient>, payment: Payment) {
  queryClient.invalidateQueries({ queryKey: queryKeys.payments.detail(payment.id) });
  queryClient.invalidateQueries({ queryKey: queryKeys.conferences.myRegistrations });
  queryClient.invalidateQueries({ queryKey: queryKeys.papers.my });
  if (payment.conference_id) {
    queryClient.invalidateQueries({ queryKey: queryKeys.conferences.registrations(payment.conference_id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.conferences.papers(payment.conference_id) });
  }
  if (payment.paper_id) {
    queryClient.invalidateQueries({ queryKey: queryKeys.papers.detail(payment.paper_id) });
  }
}

export function useConfirmPayment(id?: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post<Payment>(`/payments/${id}/confirm`)).data,
    onSuccess: (payment) => invalidatePaymentDependents(queryClient, payment),
  });
}

export function useConfirmDemoPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (paymentId: string | number) => (await api.post<Payment>(`/payments/${paymentId}/confirm`)).data,
    onSuccess: (payment) => invalidatePaymentDependents(queryClient, payment),
  });
}
