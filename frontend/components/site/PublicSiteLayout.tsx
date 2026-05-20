import Link from 'next/link';
import type { Conference, SitePage, SiteSettings } from '@/lib/types';
import { getUploadUrl } from '@/lib/urls';
import { MediaPlaceholder } from '@/components/ui/MediaPlaceholder';
import { SiteNavigation } from './SiteNavigation';
import { PublicConferenceFooter } from '@/components/conferences/PublicConferenceFooter';

export function PublicSiteLayout({
  conference,
  theme,
  pages,
  shortName,
  children,
}: {
  conference: Conference;
  theme: SiteSettings;
  pages: SitePage[];
  shortName: string;
  children: React.ReactNode;
}) {
  const accent = theme.accent_color || '#2563eb';
  const logoSrc = getUploadUrl(theme.logo_url);

  return (
    <div className="min-h-screen bg-slate-50">
      <header style={{ backgroundColor: accent }} className="text-white shadow-sm">
        <div className="border-b border-white/15 bg-black/10">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs md:px-8">
            <Link href="/" className="font-medium text-white/90 hover:text-white">
              ← На главную SciConnect
            </Link>
            <Link href="/conferences" className="text-white/80 hover:text-white">
              Каталог конференций
            </Link>
          </div>
        </div>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
          <Link href={`/c/${shortName}`} className="flex min-w-0 items-center gap-3">
            {logoSrc ? (
              <img src={logoSrc} alt="" className="h-10 object-contain" />
            ) : (
              <MediaPlaceholder variant="logo" hideLabel />
            )}
            <span className="truncate text-lg font-bold md:text-xl">{theme.hero_title || conference.title}</span>
          </Link>
        </div>
        <SiteNavigation shortName={shortName} pages={pages} />
      </header>
      <main className="mx-auto max-w-4xl px-4 py-10 md:px-8">{children}</main>
      <PublicConferenceFooter conference={conference} />
    </div>
  );
}
