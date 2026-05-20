const LOCALE = 'ru-RU';

function parseDate(value: string | Date): Date | null {
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const s = String(value).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s.slice(0, 10))) {
    const d = new Date(`${s.slice(0, 10)}T12:00:00`);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/** Дата: «18 мая 2026 г.» */
export function formatDate(value: string | Date | null | undefined): string {
  const d = value == null ? null : parseDate(value);
  if (!d) return '—';
  return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Дата и время: «18 мая 2026 г., 14:30» */
export function formatDateTime(value: string | Date | null | undefined): string {
  const d = value == null ? null : parseDate(value);
  if (!d) return '—';
  return d.toLocaleString(LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Короткая дата для списков: «18.05.2026» */
export function formatDateShort(value: string | Date | null | undefined): string {
  const d = value == null ? null : parseDate(value);
  if (!d) return '—';
  return d.toLocaleDateString(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined
): string {
  return `${formatDate(start)} — ${formatDate(end)}`;
}

/** Время: «14:30» */
export function formatTime(value: string | Date | null | undefined): string {
  const d = value == null ? null : parseDate(value);
  if (!d) return '—';
  return d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
}

/** Интервал времени: «14:00–16:00» или «14:00», если конец не задан */
export function formatTimeRange(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined
): string {
  const startLabel = formatTime(start);
  if (startLabel === '—') return '—';
  const endLabel = formatTime(end);
  if (!end || endLabel === '—') return startLabel;
  return `${startLabel}–${endLabel}`;
}

/** Относительное время: «5 мин. назад», «вчера» */
export function formatRelativeTime(value: string | Date | null | undefined): string {
  const d = value == null ? null : parseDate(value);
  if (!d) return '—';
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'только что';
  if (diffMin < 60) return `${diffMin} мин. назад`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ч. назад`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'вчера';
  if (diffDays < 7) return `${diffDays} дн. назад`;
  return formatDateShort(d);
}
