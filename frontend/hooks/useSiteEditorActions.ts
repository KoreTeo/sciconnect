'use client';

import { useState } from 'react';
import type { SiteBlock, SitePage, SiteSettings } from '@/lib/types';
import { buildConferenceSiteTemplate } from '@/lib/siteTemplate';
import { consolidatePublicSiteNav, newBlockId, slugify } from '@/lib/siteUtils';
import { getActiveSitePage, updateSitePage } from '@/components/site/editor/useSiteBuilderState';
import type { Conference } from '@/lib/types';

type Tab = 'general' | 'pages' | 'editor';

interface UseSiteEditorActionsOptions {
  conferenceId: string;
  conf: Conference | null;
  theme: SiteSettings;
  setSettings: (settings: SiteSettings) => void;
  activePageId: string | null;
  setActivePageId: (id: string | null) => void;
  setPreviewPageId: (id: string | null) => void;
  setTab: (tab: Tab) => void;
  setMsg: (msg: string) => void;
  confirm: (message: string) => Promise<boolean>;
}

export function useSiteEditorActions({
  conf,
  theme,
  setSettings,
  activePageId,
  setActivePageId,
  setPreviewPageId,
  setTab,
  setMsg,
  confirm,
}: UseSiteEditorActionsOptions) {
  const [editBlockId, setEditBlockId] = useState<string | null>(null);
  const [blockForm, setBlockForm] = useState<SiteBlock>({
    id: '',
    type: 'text',
    title: '',
    content: '',
    items: [],
  });

  const activePage = getActiveSitePage(theme, activePageId);

  const applyCompactNav = async () => {
    if (!(await confirm('Перенести партнёров и контакты на главную и упростить меню?'))) return;
    setSettings(consolidatePublicSiteNav(theme));
    setMsg('Компактная навигация применена — сохраните изменения');
  };

  const applyTemplate = async () => {
    if (!conf) return;
    if (!(await confirm('Заменить текущую структуру сайта шаблоном? Несохранённые изменения будут потеряны.'))) return;
    const tpl = buildConferenceSiteTemplate({
      id: conf.id,
      title: conf.title,
      description: conf.description,
      location: conf.location,
      contact_email: theme.contact_email,
    });
    setSettings(tpl);
    const home = tpl.pages?.find((p) => p.is_home) || tpl.pages?.[0];
    if (home) {
      setActivePageId(home.id);
      setPreviewPageId(home.id);
    }
    setMsg('Шаблон применён — сохраните изменения');
  };

  const addPage = () => {
    const title = 'Новая страница';
    const page: SitePage = {
      id: newBlockId(),
      slug: slugify(title, 'page'),
      title,
      show_in_nav: true,
      blocks: [],
    };
    setSettings({ ...theme, pages: [...(theme.pages || []), page] });
    setActivePageId(page.id);
    setTab('pages');
  };

  const removePage = async (pageId: string) => {
    const page = theme.pages?.find((p) => p.id === pageId);
    if (page?.is_home) {
      setMsg('Главную страницу удалить нельзя');
      return;
    }
    if (!(await confirm('Удалить страницу?'))) return;
    const pages = (theme.pages || []).filter((p) => p.id !== pageId);
    setSettings({ ...theme, pages });
    if (activePageId === pageId) setActivePageId(pages[0]?.id || null);
  };

  const moveBlock = (pageId: string, index: number, dir: -1 | 1) => {
    const page = theme.pages?.find((p) => p.id === pageId);
    if (!page) return;
    const blocks = [...(page.blocks || [])];
    const j = index + dir;
    if (j < 0 || j >= blocks.length) return;
    [blocks[index], blocks[j]] = [blocks[j], blocks[index]];
    setSettings(updateSitePage(theme, pageId, { blocks }));
  };

  const startBlock = (block?: SiteBlock) => {
    if (block) {
      setEditBlockId(block.id || null);
      setBlockForm({
        id: block.id || newBlockId(),
        type: block.type || 'text',
        title: block.title || '',
        content: block.content || '',
        items: block.items ? [...block.items] : [],
      });
    } else {
      setEditBlockId(null);
      setBlockForm({ id: newBlockId(), type: 'text', title: '', content: '', items: [] });
    }
    setTab('editor');
  };

  const saveBlock = () => {
    if (!activePage || !blockForm.title?.trim()) return;
    const blocks = [...(activePage.blocks || [])];
    const payload = { ...blockForm, id: blockForm.id || newBlockId() };
    const idx = editBlockId ? blocks.findIndex((b) => b.id === editBlockId) : -1;
    if (idx >= 0) blocks[idx] = payload;
    else blocks.push(payload);
    setSettings(updateSitePage(theme, activePage.id, { blocks }));
    setEditBlockId(null);
    setBlockForm({ id: newBlockId(), type: 'text', title: '', content: '', items: [] });
    setMsg('Блок сохранён');
  };

  const removeBlock = (pageId: string, blockId: string) => {
    const page = theme.pages?.find((p) => p.id === pageId);
    if (!page) return;
    setSettings(updateSitePage(theme, pageId, { blocks: (page.blocks || []).filter((b) => b.id !== blockId) }));
  };

  return {
    activePage,
    editBlockId,
    blockForm,
    setBlockForm,
    applyTemplate,
    applyCompactNav,
    addPage,
    removePage,
    moveBlock,
    startBlock,
    saveBlock,
    removeBlock,
  };
}
