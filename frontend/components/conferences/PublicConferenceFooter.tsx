'use client';

import Link from 'next/link';
import type { Conference } from '@/lib/types';
import { ConferenceParticipantActions } from './ConferenceParticipantActions';

export function PublicConferenceFooter({ conference }: { conference: Conference }) {
  return (
    <footer className="border-t bg-white py-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-5 px-4 text-center md:px-8">
        <div className="rounded-2xl border bg-slate-50 px-5 py-5">
          <ConferenceParticipantActions conference={conference} />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
          <Link href="/" className="font-medium text-brand-600 hover:underline">
            На главную SciConnect
          </Link>
          <Link href="/conferences" className="text-slate-500 hover:text-brand-600">
            Каталог конференций
          </Link>
        </div>
        <p className="text-xs text-slate-400">На платформе SciConnect</p>
      </div>
    </footer>
  );
}
