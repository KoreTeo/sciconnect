import type { ProgramSession, PublicConference, SitePage, SiteSettings } from '@/lib/types';
import { getUploadUrl } from '@/lib/urls';
import { SiteBlockRenderer } from './SiteBlockRenderer';
import { PublicSiteHero } from './PublicSiteHero';
import { ProceedingsCurrentIssue } from './ProceedingsCurrentIssue';

export function PublicSitePageContent({
  conference,
  theme,
  page,
  program,
}: {
  conference: PublicConference;
  theme: SiteSettings;
  page: SitePage;
  program?: ProgramSession[];
}) {
  const isHome = page.is_home || !page.slug;
  const isProceedings = page.slug === 'proceedings';
  const bannerSrc = getUploadUrl(theme.banner_url) ?? null;
  const publishedIssue = conference.proceedings?.is_published ? conference.proceedings : null;

  return (
    <article>
      {isHome && <PublicSiteHero conference={conference} theme={theme} bannerSrc={bannerSrc} />}

      {!isHome && <h1 className="mb-8 text-3xl font-bold text-slate-900">{page.title}</h1>}

      <div className={isHome ? 'space-y-6' : 'space-y-8'}>
        {(page.blocks || []).map((block) => (
          <SiteBlockRenderer
            key={block.id}
            block={block}
            conference={conference}
            program={program}
            variant={isHome ? 'plain' : 'card'}
          />
        ))}
      </div>

      {isProceedings && publishedIssue && publishedIssue.entries.length > 0 && (
        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Текущий выпуск</h2>
          <ProceedingsCurrentIssue issue={publishedIssue} />
        </section>
      )}

      {theme.contact_email && isHome && (
        <p className="mt-8 text-sm text-slate-500">Контакт: {theme.contact_email}</p>
      )}
    </article>
  );
}
