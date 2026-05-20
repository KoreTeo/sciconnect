'use client';

import { useMemo, useState } from 'react';
import type { SiteBlock, SitePage, SiteSettings } from '@/lib/types';
import { normalizePages } from '@/lib/siteUtils';

export const defaultSiteSettings = (): SiteSettings => ({
  hero_title: '',
  hero_subtitle: '',
  accent_color: '#2563eb',
  show_program: true,
  show_topics: true,
  show_deadlines: true,
  show_cfp: false,
  pages: [],
});

export function getActiveSitePage(theme: SiteSettings, pageId: string | null): SitePage | null {
  const pages = theme.pages || [];
  if (!pages.length) return null;
  if (pageId) return pages.find((page) => page.id === pageId) || pages[0];
  return pages.find((page) => page.is_home) || pages[0];
}

export function updateSitePage(theme: SiteSettings, pageId: string, patch: Partial<SitePage>): SiteSettings {
  const pages = (theme.pages || []).map((page) => (page.id === pageId ? { ...page, ...patch } : page));
  return { ...theme, pages };
}

export function updateSiteBlock(
  theme: SiteSettings,
  pageId: string,
  blockId: string,
  patch: Partial<SiteBlock>
): SiteSettings {
  const pages = (theme.pages || []).map((page) => {
    if (page.id !== pageId) return page;
    const blocks = (page.blocks || []).map((block) => (block.id === blockId ? { ...block, ...patch } : block));
    return { ...page, blocks };
  });
  return { ...theme, pages };
}

export function useSiteBuilderState() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings());
  const theme = useMemo(() => normalizePages(settings), [settings]);

  const patchSettings = (patch: Partial<SiteSettings>) => setSettings((current) => ({ ...normalizePages(current), ...patch }));
  const patchPage = (pageId: string, patch: Partial<SitePage>) => setSettings((current) => updateSitePage(normalizePages(current), pageId, patch));
  const patchBlock = (pageId: string, blockId: string, patch: Partial<SiteBlock>) =>
    setSettings((current) => updateSiteBlock(normalizePages(current), pageId, blockId, patch));

  return {
    settings,
    setSettings,
    theme,
    patchSettings,
    patchPage,
    patchBlock,
  };
}
