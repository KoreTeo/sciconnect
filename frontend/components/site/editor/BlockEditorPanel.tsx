'use client';

import type { SiteBlock, SitePage, SiteSettings } from '@/lib/types';
import { BLOCK_TYPE_LABELS } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { RichTextEditor } from '@/components/site/RichTextEditor';
import { SiteImageUpload } from '@/components/site/SiteImageUpload';
import { GalleryBlockEditor } from '@/components/site/editor/blocks/GalleryBlockEditor';
import { ProceedingsBlockEditor } from '@/components/site/editor/blocks/ProceedingsBlockEditor';

type Props = {
  conferenceId: string;
  theme: SiteSettings;
  activePage: SitePage | null;
  activePageId: string | null;
  editBlockId: string | null;
  blockForm: SiteBlock;
  onActivePageIdChange: (pageId: string) => void;
  onBlockFormChange: (block: SiteBlock) => void;
  onMoveBlock: (pageId: string, index: number, dir: -1 | 1) => void;
  onStartBlock: (block?: SiteBlock) => void;
  onRemoveBlock: (pageId: string, blockId: string) => void;
  onSaveBlock: () => void;
};

export function BlockEditorPanel({
  conferenceId,
  theme,
  activePage,
  activePageId,
  editBlockId,
  blockForm,
  onActivePageIdChange,
  onBlockFormChange,
  onMoveBlock,
  onStartBlock,
  onRemoveBlock,
  onSaveBlock,
}: Props) {
  return (
    <>
      <Card>
        <label className="mb-2 block text-sm font-medium text-slate-700">Страница</label>
        <Select value={activePageId || ''} onChange={(e) => onActivePageIdChange(e.target.value)}>
          {(theme.pages || []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </Select>
        {activePage && (
          <ul className="mt-4 space-y-2">
            {(activePage.blocks || []).map((b, i) => (
              <li key={b.id} className="flex items-center justify-between gap-2 rounded border p-2 text-sm">
                <span className="truncate">
                  {b.title}{' '}
                  <span className="text-slate-400">({BLOCK_TYPE_LABELS[b.type || 'text'] || b.type})</span>
                </span>
                <span className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => onMoveBlock(activePage.id, i, -1)} className="px-1">
                    ↑
                  </button>
                  <button type="button" onClick={() => onMoveBlock(activePage.id, i, 1)} className="px-1">
                    ↓
                  </button>
                  <button type="button" onClick={() => onStartBlock(b)} className="text-brand-600">
                    ✎
                  </button>
                  <button type="button" onClick={() => b.id && onRemoveBlock(activePage.id, b.id)} className="text-red-600">
                    ×
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <Button type="button" variant="secondary" className="mt-3" onClick={() => onStartBlock()}>
          Новый блок
        </Button>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold">{editBlockId ? 'Редактирование блока' : 'Новый блок'}</h2>
        <Select
          label="Тип"
          value={blockForm.type || 'text'}
          onChange={(e) =>
            onBlockFormChange({
              ...blockForm,
              type: e.target.value,
              content: '',
              items: [],
            })
          }
        >
          {Object.entries(BLOCK_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <Input
          label="Заголовок"
          value={blockForm.title || ''}
          onChange={(e) => onBlockFormChange({ ...blockForm, title: e.target.value })}
        />

        {blockForm.type === 'text' && (
          <div className="mt-3">
            <p className="mb-1 text-sm font-medium text-slate-700">Содержание</p>
            <RichTextEditor
              value={blockForm.content || ''}
              onChange={(html) => onBlockFormChange({ ...blockForm, content: html })}
            />
          </div>
        )}

        {blockForm.type === 'image' && (
          <SiteImageUpload
            conferenceId={conferenceId}
            label="Изображение"
            assetType="image"
            value={blockForm.content}
            onChange={(url) => onBlockFormChange({ ...blockForm, content: url })}
          />
        )}

        {(blockForm.type === 'committee' || blockForm.type === 'sponsors') && (
          <Textarea
            label="Строки (каждая с новой строки)"
            value={blockForm.content || ''}
            onChange={(e) => onBlockFormChange({ ...blockForm, content: e.target.value })}
            rows={5}
          />
        )}

        {blockForm.type === 'venue' && (
          <>
            <div className="mt-3">
              <p className="mb-1 text-sm font-medium text-slate-700">Описание</p>
              <RichTextEditor
                value={blockForm.content || ''}
                onChange={(html) => onBlockFormChange({ ...blockForm, content: html })}
              />
            </div>
            <Input
              label="Ссылка на карту"
              value={blockForm.items?.[0]?.url || ''}
              onChange={(e) =>
                onBlockFormChange({
                  ...blockForm,
                  items: [{ ...blockForm.items?.[0], url: e.target.value }],
                })
              }
            />
          </>
        )}

        {blockForm.type === 'cta' && (
          <>
            <Input
              label="Текст кнопки"
              value={blockForm.title || ''}
              onChange={(e) => onBlockFormChange({ ...blockForm, title: e.target.value })}
            />
            <Input
              label="Ссылка"
              value={blockForm.content || ''}
              onChange={(e) => onBlockFormChange({ ...blockForm, content: e.target.value })}
              placeholder={`/conferences/${conferenceId}`}
            />
          </>
        )}

        {blockForm.type === 'contact' && (
          <div className="mt-3">
            <RichTextEditor
              value={blockForm.content || ''}
              onChange={(html) => onBlockFormChange({ ...blockForm, content: html })}
            />
          </div>
        )}

        {blockForm.type === 'gallery' && (
          <GalleryBlockEditor
            conferenceId={conferenceId}
            items={blockForm.items || []}
            onChange={(items) => onBlockFormChange({ ...blockForm, items })}
          />
        )}

        {blockForm.type === 'proceedings' && (
          <ProceedingsBlockEditor
            conferenceId={conferenceId}
            items={blockForm.items || []}
            onChange={(items) => onBlockFormChange({ ...blockForm, items })}
          />
        )}

        {['program', 'deadlines', 'topics'].includes(blockForm.type || '') && (
          <p className="mt-2 text-sm text-slate-500">Данные подставляются из карточки конференции и API программы.</p>
        )}

        <Button type="button" className="mt-4" onClick={onSaveBlock}>
          {editBlockId ? 'Сохранить блок' : 'Добавить блок'}
        </Button>
      </Card>
    </>
  );
}
