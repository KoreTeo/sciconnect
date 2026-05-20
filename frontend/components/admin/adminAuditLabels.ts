export const ADMIN_ACTION_LABELS: Record<string, string> = {
  update_user: 'Изменение пользователя',
  update_conference: 'Изменение конференции',
  submit_conference_for_approval: 'Отправка на модерацию',
  moderate_conference_approve: 'Модерация: принято',
  moderate_conference_request_changes: 'Модерация: доработка',
  moderate_conference_reject: 'Модерация: отклонено',
};

export const ADMIN_ENTITY_LABELS: Record<string, string> = {
  user: 'пользователь',
  conference: 'конференция',
};

export function formatAuditPayload(payload: Record<string, unknown>) {
  const entries = Object.entries(payload);
  if (entries.length === 0) return '—';
  return entries.map(([key, value]) => `${key}: ${String(value ?? '—')}`).join(', ');
}
