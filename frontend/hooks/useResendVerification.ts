'use client';

import { useState } from 'react';
import api from '@/lib/api';

export function useResendVerification() {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const resend = async () => {
    setSending(true);
    setMessage('');
    try {
      const { data } = await api.post<{ message?: string }>('/auth/resend-verification');
      setMessage(data.message || 'Письмо отправлено');
    } catch {
      setMessage('Не удалось отправить письмо');
    } finally {
      setSending(false);
    }
  };

  return { resend, message, sending };
}
