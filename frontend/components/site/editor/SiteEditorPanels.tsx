'use client';

import type { Conference, ProgramSession, SitePage, SiteSettings } from '@/lib/types';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SiteImageUpload } from '@/components/site/SiteImageUpload';
import { PublicSiteLayout } from '@/components/site/PublicSiteLayout';
import { PublicSitePageContent } from '@/components/site/PublicSitePageContent';
import { slugify } from '@/lib/siteUtils';
import { updateSitePage } from './useSiteBuilderState';

export function SiteGeneralSettings({
  conferenceId,
  theme,
  onChange,
}: {
  conferenceId: string | string[];
  theme: SiteSettings;
  onChange: (theme: SiteSettings) => void;
}) {
  return (
    <Card>
      <h2 className="mb-4 font-semibold">Основное</h2>
      <div className="space-y-3">
        <Input label="Заголовок" value={theme.hero_title || ''} onChange={(e) => onChange({ ...theme, hero_title: e.target.value })} />
        <Input label="Подзаголовок" value={theme.hero_subtitle || ''} onChange={(e) => onChange({ ...theme, hero_subtitle: e.target.value })} />
        <Input label="Цвет акцента" type="color" value={theme.accent_color} onChange={(e) => onChange({ ...theme, accent_color: e.target.value })} />
        <SiteImageUpload conferenceId={conferenceId} label="Логотип" assetType="logo" value={theme.logo_url} onChange={(url) => onChange({ ...theme, logo_url: url })} />
        <SiteImageUpload conferenceId={conferenceId} label="Баннер" assetType="banner" value={theme.banner_url} onChange={(url) => onChange({ ...theme, banner_url: url })} />
        <Input label="Email контакта" value={theme.contact_email || ''} onChange={(e) => onChange({ ...theme, contact_email: e.target.value })} />
      </div>
    </Card>
  );
}

export function SitePagesManager({
  theme,
  onChange,
  onAddPage,
  onRemovePage,
  onEditPage,
}: {
  theme: SiteSettings;
  onChange: (theme: SiteSettings) => void;
  onAddPage: () => void;
  onRemovePage: (pageId: string) => void;
  onEditPage: (pageId: string) => void;
}) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Страницы</h2>
        <Button type="button" variant="secondary" onClick={onAddPage}>
          Добавить
        </Button>
      </div>
      <ul className="space-y-3">
        {(theme.pages || []).map((page) => (
          <li key={page.id} className="rounded-lg border p-3 text-sm">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Input label="" value={page.title} onChange={(e) => onChange(updateSitePage(theme, page.id, { title: e.target.value }))} />
              {!page.is_home && (
                <Input
                  label=""
                  placeholder="slug"
                  value={page.slug}
                  onChange={(e) => onChange(updateSitePage(theme, page.id, { slug: slugify(e.target.value, page.slug) }))}
                />
              )}
            </div>
            <label className="mb-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={page.show_in_nav}
                onChange={(e) => onChange(updateSitePage(theme, page.id, { show_in_nav: e.target.checked }))}
              />
              В меню
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" onClick={() => onEditPage(page.id)}>
                Редактировать блоки
              </Button>
              {!page.is_home && (
                <Button type="button" variant="ghost" onClick={() => onRemovePage(page.id)}>
                  Удалить
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function SitePublishControls({
  published,
  onSave,
  onPublish,
  onUnpublish,
}: {
  published: boolean;
  onSave: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
}) {
  return (
    <nav className="flex flex-wrap gap-2">
      <Button onClick={onSave}>Сохранить</Button>
      <Button variant="secondary" onClick={onPublish}>
        Опубликовать
      </Button>
      {published && (
        <Button variant="ghost" onClick={onUnpublish}>
          Снять с публикации
        </Button>
      )}
    </nav>
  );
}

export function SitePreviewPanel({
  conference,
  theme,
  program,
  previewPage,
  previewPageId,
  published,
  onPreviewPageChange,
}: {
  conference: Conference | null;
  theme: SiteSettings;
  program: ProgramSession[];
  previewPage: SitePage | null;
  previewPageId: string | null;
  published?: boolean;
  onPreviewPageChange: (pageId: string) => void;
}) {
  const publicBase =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const publicUrl = conference?.short_name ? `${publicBase}/c/${conference.short_name}` : null;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">Предпросмотр</h2>
        <Select value={previewPageId || ''} onChange={(e) => onPreviewPageChange(e.target.value)}>
          {(theme.pages || []).map((page) => (
            <option key={page.id} value={page.id}>
              {page.title}
            </option>
          ))}
        </Select>
        {publicUrl && published && (
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:underline">
            Открыть публичный сайт
          </a>
        )}
        {publicUrl && (
          <a
            href={`${publicUrl}${previewPage && !previewPage.is_home ? `/${previewPage.slug}` : ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-600 hover:underline"
          >
            Превью для соцсетей
          </a>
        )}
      </div>
      <p className="mb-2 text-xs text-slate-500">Узкая колонка — пример мобильного вида</p>
      <div className="mx-auto max-w-sm overflow-hidden rounded-xl border shadow-lg">
        {conference && previewPage && (
          <PublicSiteLayout conference={conference} theme={theme} pages={theme.pages || []} shortName={conference.short_name || 'preview'}>
            <PublicSitePageContent
              conference={conference}
              theme={theme}
              page={previewPage}
              program={program}
            />
          </PublicSiteLayout>
        )}
      </div>
    </section>
  );
}
