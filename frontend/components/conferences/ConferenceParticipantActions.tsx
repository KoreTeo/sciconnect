'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import type { Conference } from '@/lib/types';
import { canRegisterForConference, canSubmitPaperToConference, canManageConference } from '@/lib/permissions';
import { publicBtnPrimary, publicBtnSecondary } from '@/components/site/publicSiteStyles';

export function ConferenceParticipantActions({ conference }: { conference: Conference }) {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">Войдите, чтобы подать статью или зарегистрироваться на мероприятие.</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href={`/login?next=${encodeURIComponent(`/submit-paper?conferenceId=${conference.id}`)}`}
            className={publicBtnPrimary}
          >
            Подать статью
          </Link>
          <Link href="/register" className={publicBtnSecondary}>
            Зарегистрироваться
          </Link>
        </div>
      </div>
    );
  }

  if (canManageConference(user, conference)) {
    return (
      <div className="space-y-3 text-sm text-slate-600">
        <p>Вы организатор этого мероприятия.</p>
        <Link href={`/conference-manage/${conference.id}`} className={publicBtnPrimary}>
          Перейти в панель управления
        </Link>
      </div>
    );
  }

  const showSubmit = canSubmitPaperToConference(user, conference);
  const showRegister = canRegisterForConference(user, conference);

  if (!showSubmit && !showRegister) {
    return (
      <p className="text-sm text-slate-500">
        {conference.status !== 'submission_open'
          ? 'Приём статей на этой конференции сейчас закрыт.'
          : 'Доступные действия для этой конференции сейчас не требуются.'}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {showSubmit && (
        <Link href={`/submit-paper?conferenceId=${conference.id}`} className={publicBtnPrimary}>
          Подать статью
        </Link>
      )}
      {showRegister && (
        <Link href={`/conferences/${conference.id}/register`} className={publicBtnSecondary}>
          Регистрация на конференцию
        </Link>
      )}
    </div>
  );
}
