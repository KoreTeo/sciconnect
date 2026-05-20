'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { SiteSettings } from '@/lib/types';
import { useConference, useConferenceProgram, useConferenceSite } from '@/lib/queries';
import { useSiteEditorMutations } from '@/hooks/useSiteEditorMutations';
import { useSiteEditorActions } from '@/hooks/useSiteEditorActions';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { BlockEditorPanel } from '@/components/site/editor/BlockEditorPanel';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Tabs } from '@/components/ui/Tabs';
import { defaultSiteSettings, getActiveSitePage, useSiteBuilderState } from '@/components/site/editor/useSiteBuilderState';
import { normalizePages } from '@/lib/siteUtils';
import {
  SiteGeneralSettings,
  SitePagesManager,
  SitePreviewPanel,
  SitePublishControls,
} from '@/components/site/editor/SiteEditorPanels';
import { QueryState } from '@/components/ui/QueryState';

type Tab = 'general' | 'pages' | 'editor';

function SiteEditorContent() {
  const { id } = useParams();
  const conferenceId = id as string;
  const confirm = useConfirm();
  const confQuery = useConference(conferenceId);
  const siteQuery = useConferenceSite(conferenceId);
  const conf = confQuery.data || null;
  const { setSettings, theme } = useSiteBuilderState();
  const [published, setPublished] = useState(false);
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState<Tab>('general');
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [previewPageId, setPreviewPageId] = useState<string | null>(null);
  const needsProgram = tab === 'editor' || tab === 'general';
  const programQuery = useConferenceProgram(conferenceId, needsProgram);
  const program = programQuery.data || [];

  useEffect(() => {
    if (siteQuery.data) {
      const raw = (siteQuery.data.theme_json || {}) as SiteSettings;
      const merged = normalizePages({ ...defaultSiteSettings(), ...raw });
      if (conf && !raw.hero_title) {
        merged.hero_title = conf.title;
        merged.hero_subtitle = conf.description?.slice(0, 120) || '';
      }
      setSettings(merged);
      const home = merged.pages?.find((p) => p.is_home) || merged.pages?.[0];
      if (home) {
        setActivePageId(home.id);
        setPreviewPageId(home.id);
      }
      setPublished(siteQuery.data.is_published);
    }
  }, [conf, setSettings, siteQuery.data]);

  const { saveMutation, publishMutation, unpublishMutation } = useSiteEditorMutations(conferenceId, theme, {
    onMessage: setMsg,
    onPublishedChange: setPublished,
    onSettingsSaved: setSettings,
  });

  const actions = useSiteEditorActions({
    conferenceId,
    conf,
    theme,
    setSettings,
    activePageId,
    setActivePageId,
    setPreviewPageId,
    setTab,
    setMsg,
    confirm,
  });

  const previewPage = getActiveSitePage(theme, previewPageId || activePageId);

  return (
    <QueryState
      loading={confQuery.isLoading || siteQuery.isLoading || (needsProgram && programQuery.isLoading)}
      error={confQuery.error || siteQuery.error || (needsProgram ? programQuery.error : null)}
    >
      <PageHeader
        title="Конструктор сайта"
        breadcrumbs={[{ label: 'Управление', href: `/conference-manage/${id}` }, { label: 'Сайт' }]}
        action={
          published && conf?.short_name ? (
            <Link href={`/c/${conf.short_name}`} target="_blank">
              <Button variant="secondary">Открыть сайт</Button>
            </Link>
          ) : undefined
        }
      />
      {msg && (
        <Alert variant="success" className="mb-4">
          {msg}
        </Alert>
      )}

      <div className="mb-4 flex flex-wrap items-start gap-2">
        <Tabs
          tabs={[
            { id: 'general', label: 'Общее' },
            { id: 'pages', label: 'Страницы' },
            { id: 'editor', label: 'Редактор страницы' },
          ]}
          active={tab}
          onChange={(next) => setTab(next as Tab)}
        />
        <Button type="button" variant="ghost" onClick={actions.applyTemplate}>
          Применить шаблон
        </Button>
        <Button type="button" variant="ghost" onClick={actions.applyCompactNav}>
          Компактная навигация
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-6">
          {tab === 'general' && <SiteGeneralSettings conferenceId={id!} theme={theme} onChange={setSettings} />}

          {tab === 'pages' && (
            <SitePagesManager
              theme={theme}
              onChange={setSettings}
              onAddPage={actions.addPage}
              onRemovePage={actions.removePage}
              onEditPage={(pageId) => {
                setActivePageId(pageId);
                setTab('editor');
              }}
            />
          )}

          {tab === 'editor' && (
            <BlockEditorPanel
              conferenceId={conferenceId}
              theme={theme}
              activePage={actions.activePage}
              activePageId={activePageId}
              editBlockId={actions.editBlockId}
              blockForm={actions.blockForm}
              onActivePageIdChange={setActivePageId}
              onBlockFormChange={actions.setBlockForm}
              onMoveBlock={actions.moveBlock}
              onStartBlock={actions.startBlock}
              onRemoveBlock={actions.removeBlock}
              onSaveBlock={actions.saveBlock}
            />
          )}

          <SitePublishControls
            published={published}
            onSave={() => saveMutation.mutateAsync()}
            onPublish={() => publishMutation.mutateAsync()}
            onUnpublish={() => unpublishMutation.mutateAsync()}
          />
        </section>

        <SitePreviewPanel
          conference={conf}
          theme={theme}
          program={program}
          previewPage={previewPage}
          previewPageId={previewPageId}
          published={published}
          onPreviewPageChange={setPreviewPageId}
        />
      </div>
    </QueryState>
  );
}

export default function ConferenceSitePage() {
  return (
    <RequireAuth roles={['organizer', 'admin']}>
      <SiteEditorContent />
    </RequireAuth>
  );
}
