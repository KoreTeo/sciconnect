export const dynamic = 'force-dynamic';

import type { PublicConference, SiteSettings } from '@/lib/types';
import { serverFetch } from '@/lib/server-api';
import { buildPublicPageMetadata } from '@/lib/publicMetadata';
import { normalizePages, findPageBySlug } from '@/lib/siteUtils';
import { PublicSiteLayout } from '@/components/site/PublicSiteLayout';
import { PublicSitePageContent } from '@/components/site/PublicSitePageContent';

async function getPublic(shortName: string): Promise<PublicConference | null> {
  return serverFetch<PublicConference>(`/conferences/public/${encodeURIComponent(shortName)}`);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shortName: string; slug?: string[] }>;
}) {
  const resolvedParams = await params;
  const data = await getPublic(resolvedParams.shortName);
  if (!data) return { title: 'Конференция' };
  return buildPublicPageMetadata(data, resolvedParams.slug);
}

export default async function PublicConferencePage({
  params,
}: {
  params: Promise<{ shortName: string; slug?: string[] }>;
}) {
  const resolvedParams = await params;
  const data = await getPublic(resolvedParams.shortName);
  if (!data?.site?.is_published) {
    return (
      <p className="py-16 text-center text-slate-500">Сайт не найден или не опубликован</p>
    );
  }

  const raw = (data.site.theme_json as SiteSettings) || {};
  const defaults: SiteSettings = {
    accent_color: '#2563eb',
    show_program: true,
    show_topics: true,
    show_deadlines: true,
    show_cfp: true,
  };
  const theme = normalizePages({ ...defaults, ...raw });

  const page = findPageBySlug(theme, resolvedParams.slug);
  if (!page) {
    return (
      <p className="py-16 text-center text-slate-500">Страница не найдена</p>
    );
  }

  return (
    <PublicSiteLayout
      conference={data}
      theme={theme}
      pages={theme.pages || []}
      shortName={resolvedParams.shortName}
    >
      <PublicSitePageContent
        conference={data}
        theme={theme}
        page={page}
        program={data.program}
      />
    </PublicSiteLayout>
  );
}
