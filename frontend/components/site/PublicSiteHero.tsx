import type { Conference, SiteSettings } from '@/lib/types';
import { MediaPlaceholder } from '@/components/ui/MediaPlaceholder';

export function PublicSiteHero({
  conference,
  theme,
  bannerSrc,
}: {
  conference: Conference;
  theme: SiteSettings;
  bannerSrc: string | null;
}) {
  const accent = theme.accent_color || '#2563eb';

  return (
    <>
      <header
        className="-mx-4 mb-10 rounded-xl px-6 py-12 text-white md:-mx-0 md:px-10"
        style={{ backgroundColor: accent }}
      >
        <h1 className="mb-3 text-3xl font-bold md:text-4xl">{theme.hero_title || conference.title}</h1>
        <p className="max-w-2xl text-lg opacity-90">{theme.hero_subtitle || conference.description}</p>
      </header>

      {bannerSrc ? (
        <img src={bannerSrc} alt="" className="mb-8 max-h-64 w-full rounded-xl object-cover" />
      ) : (
        <MediaPlaceholder variant="banner" className="mb-8" />
      )}

      {conference.description && <p className="mb-8 text-slate-700">{conference.description}</p>}
    </>
  );
}
