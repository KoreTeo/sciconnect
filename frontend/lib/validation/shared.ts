import { z } from 'zod';

export const required = (label: string) => z.string().trim().min(1, `${label} обязательно`);
export const optionalText = z.string().trim().optional().or(z.literal(''));
const ORCID_RE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i;

export const orcidField = optionalText.refine(
  (value) => {
    if (!value) return true;
    const cleaned = value.replace(/^https?:\/\/orcid\.org\//i, '').trim();
    return ORCID_RE.test(cleaned);
  },
  { message: 'Некорректный ORCID (пример: 0000-0002-1825-0097)' }
);

export const optionalAmount = optionalText.refine((value) => !value || Number(value) >= 0, {
  message: 'Сумма не может быть отрицательной',
});

export const countryField = optionalText.refine(
  (value) => !value || /^[A-Za-z]{2}$/.test(value),
  { message: 'Код страны должен быть в формате ISO 3166-1 alpha-2' }
);

export const password = z.string().min(6, 'Пароль должен быть не короче 6 символов');
export const strongPassword = z.string().min(8, 'Пароль должен быть не короче 8 символов');

export function emptyToUndefined(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function splitCsv(value?: string): string[] {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toIso(value: string): string {
  return new Date(value).toISOString();
}
