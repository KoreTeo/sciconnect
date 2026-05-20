import type { SiteBlock, SitePage, SiteSettings } from './types';

const RESERVED = new Set(['api', 'admin', 'login', 'register', 'static', 'uploads']);

export function newBlockId(): string {
  return Math.random().toString(36).slice(2, 14);
}

export function slugify(title: string, fallback = 'page'): string {
  let s = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (!s || RESERVED.has(s)) return fallback;
  return s.slice(0, 64);
}

function blockFromLegacy(b: { type?: string; title?: string; content?: string; items?: unknown }): SiteBlock {
  return {
    id: newBlockId(),
    type: b.type || 'text',
    title: b.title,
    content: b.content,
    items: b.items as SiteBlock['items'],
  };
}

export function migrateThemeToPages(theme: SiteSettings): SiteSettings {
  const t = { ...theme };
  if (t.pages && t.pages.length > 0) return normalizePages(t);

  const homeId = newBlockId();
  const blocks: SiteBlock[] = [];

  if (t.show_cfp && t.cfp_text) {
    blocks.push({
      id: newBlockId(),
      type: 'text',
      title: 'Приглашение к участию',
      content: `<p>${t.cfp_text.replace(/\n/g, '</p><p>')}</p>`,
    });
  }
  if (t.show_deadlines) blocks.push({ id: newBlockId(), type: 'deadlines', title: 'Сроки' });
  if (t.show_topics) blocks.push({ id: newBlockId(), type: 'topics', title: 'Тематики' });
  for (const b of t.custom_blocks || []) {
    blocks.push(blockFromLegacy(b));
  }
  if (t.show_program) blocks.push({ id: newBlockId(), type: 'program', title: 'Программа' });

  return normalizePages({
    ...t,
    pages: [
      {
        id: homeId,
        slug: '',
        title: 'Главная',
        show_in_nav: true,
        is_home: true,
        blocks,
      },
    ],
    home_page_id: homeId,
  });
}

export function normalizePages(theme: SiteSettings): SiteSettings {
  const migrated = theme.pages?.length ? theme : migrateThemeToPages(theme);
  const pages = [...(migrated.pages || [])];
  const seen = new Set<string>();
  let homeId = migrated.home_page_id;

  pages.forEach((page, i) => {
    const p = { ...page, blocks: [...(page.blocks || [])] };
    if (!p.id) p.id = newBlockId();
    if (p.is_home || p.slug === '') {
      p.slug = '';
      p.is_home = true;
      homeId = p.id;
    } else {
      let slug = (p.slug || '').trim().toLowerCase();
      if (!slug) slug = slugify(p.title || `page-${i}`, `page-${i}`);
      let base = slug;
      let n = 1;
      while (seen.has(slug) || RESERVED.has(slug)) {
        slug = `${base}-${n}`;
        n += 1;
      }
      p.slug = slug;
      seen.add(slug);
    }
    p.blocks = p.blocks.map((b) => ({ ...b, id: b.id || newBlockId() }));
    pages[i] = p;
  });

  return { ...migrated, pages, home_page_id: homeId };
}

export function findPageBySlug(theme: SiteSettings, slugParts?: string[]): SitePage | null {
  const normalized = normalizePages(theme);
  const pages = normalized.pages || [];
  const slug = slugParts?.join('/') || '';
  if (!slug) {
    return pages.find((p) => p.is_home || p.slug === '') || pages[0] || null;
  }
  const found = pages.find((p) => p.slug === slug);
  if (found) return found;

  const fallbacks: Record<string, { title: string; type: string; blockTitle: string }> = {
    program: { title: 'Программа', type: 'program', blockTitle: 'Программа конференции' },
    proceedings: { title: 'Сборники', type: 'proceedings', blockTitle: 'Архив сборников' },
    gallery: { title: 'Галерея', type: 'gallery', blockTitle: 'Фотогалерея' },
    venue: { title: 'Место проведения', type: 'venue', blockTitle: 'Место проведения' },
    contacts: { title: 'Контакты', type: 'contact', blockTitle: 'Контакты' },
    committee: { title: 'Комитет', type: 'committee', blockTitle: 'Программный комитет' },
    invitation: { title: 'Приглашение', type: 'text', blockTitle: 'Приглашение к участию' },
    partners: { title: 'Партнёры', type: 'sponsors', blockTitle: 'Партнёры и спонсоры' },
  };
  const fallback = fallbacks[slug];
  if (!fallback) return null;

  return {
    id: `fallback-${slug}`,
    slug,
    title: fallback.title,
    show_in_nav: false,
    blocks: [{ id: newBlockId(), type: fallback.type, title: fallback.blockTitle }],
  };
}

export function pageHref(shortName: string, page: SitePage): string {
  if (page.is_home || !page.slug) return `/c/${shortName}`;
  return `/c/${shortName}/${page.slug}`;
}

const NAV_IN_MENU = new Set(['', 'program', 'proceedings', 'gallery']);
const HIDE_FROM_NAV_SLUGS = new Set(['partners', 'contacts', 'invitation', 'committee', 'venue']);

/** Компактная навигация: партнёры/контакты/даты на главную, в меню — программа, сборники, галерея. */
export function consolidatePublicSiteNav(theme: SiteSettings): SiteSettings {
  const normalized = normalizePages(theme);
  const pages = [...(normalized.pages || [])];
  const homeIdx = pages.findIndex((p) => p.is_home || p.slug === '');
  if (homeIdx < 0) return { ...normalized, nav_consolidated: true };

  const home = { ...pages[homeIdx], blocks: [...(pages[homeIdx].blocks || [])] };
  const homeBlockTypes = new Set(home.blocks.map((b) => b.type));

  const ensureBlock = (block: SiteBlock) => {
    if (!homeBlockTypes.has(block.type)) {
      home.blocks.push({ ...block, id: block.id || newBlockId() });
      homeBlockTypes.add(block.type!);
    }
  };

  for (const page of pages) {
    if (page.is_home || page.slug === '') continue;
    for (const block of page.blocks || []) {
      if (page.slug === 'partners' && block.type === 'sponsors') {
        ensureBlock({ ...block, id: newBlockId(), title: block.title || 'Партнёры и спонсоры' });
      }
      if (page.slug === 'contacts' && block.type === 'contact') {
        ensureBlock({ ...block, id: newBlockId(), title: block.title || 'Контакты' });
      }
      if (page.slug === 'invitation') {
        if (block.type === 'text') ensureBlock({ ...block, id: newBlockId(), title: block.title || 'Приглашение' });
        if (block.type === 'topics') ensureBlock({ ...block, id: newBlockId(), title: block.title || 'Тематики' });
      }
    }
  }

  if (!homeBlockTypes.has('deadlines')) {
    home.blocks.splice(1, 0, { id: newBlockId(), type: 'deadlines', title: 'Ключевые даты' });
  }

  pages[homeIdx] = home;

  const updatedPages = pages.map((page) => {
    if (page.is_home || page.slug === '') {
      return { ...page, show_in_nav: true, blocks: home.blocks };
    }
    const slug = page.slug || '';
    const showInNav = NAV_IN_MENU.has(slug);
    if (HIDE_FROM_NAV_SLUGS.has(slug)) {
      return { ...page, show_in_nav: false };
    }
    return { ...page, show_in_nav: showInNav };
  });

  return { ...normalized, pages: updatedPages, home_page_id: home.id, nav_consolidated: true };
}
