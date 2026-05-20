import type { Conference, User } from './types';

/** Нормализация статуса статьи (на случай enum из API). */
export function normalizePaperStatus(status: string): string {
  const s = status?.toLowerCase?.() ?? status;
  const aliases: Record<string, string> = {
    under_review: 'under_review',
    revision_required: 'revision_required',
  };
  if (aliases[s]) return aliases[s];
  if (s.includes('_') || ['draft', 'submitted', 'accepted', 'rejected'].includes(s)) return s;
  return s.replace(/-/g, '_');
}

export function isConferenceOwner(user: User | null, conf: Pick<Conference, 'organizer_id'>): boolean {
  return !!user && user.id === conf.organizer_id;
}

export function canManageConference(user: User | null, conf: Pick<Conference, 'organizer_id'>): boolean {
  return !!user && (user.id === conf.organizer_id || user.role === 'admin');
}

/** Регистрация как участник слушателя/автора — не для организатора своей конференции. */
export function canRegisterForConference(
  user: User | null,
  conf: Pick<Conference, 'organizer_id' | 'status'>
): boolean {
  if (!user) return false;
  if (isConferenceOwner(user, conf)) return false;
  if (user.role === 'admin') return false;
  return true;
}

/** Подача статьи — участники и рецензенты; не организатор на своей конференции. */
export function canSubmitPaperToConference(
  user: User | null,
  conf: Pick<Conference, 'organizer_id' | 'status'>
): boolean {
  if (!user) return false;
  if (conf.status !== 'submission_open') return false;
  if (isConferenceOwner(user, conf)) return false;
  if (user.role === 'admin') return false;
  return true;
}
