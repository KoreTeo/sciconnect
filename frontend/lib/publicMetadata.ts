import type { PublicConference, SiteSettings } from '@/lib/types';
import { getServerApiUrl } from '@/lib/server-api';
import { normalizePages, findPageBySlug } from '@/lib/siteUtils';

function getFrontendBaseUrl(): string {
  return (
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

function resolveAssetUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  const api = getServerApiUrl().replace(/\/$/, '');
  return `${api}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildPublicPageMetadata(
  data: PublicConference,
  slug?: string[]
) {
  const theme = normalizePages((data.site?.theme_json as SiteSettings) || {});
  const page = findPageBySlug(theme, slug);
  const title = page?.title || theme.hero_title || data.title;
  const description = (data.description || theme.hero_subtitle || '').slice(0, 160);
  const base = getFrontendBaseUrl();
  const path = slug?.length ? `/${slug.join('/')}` : '';
  const url = `${base}/c/${encodeURIComponent(data.short_name || '')}${path}`;
  const image = resolveAssetUrl(theme.banner_url || theme.logo_url);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}
