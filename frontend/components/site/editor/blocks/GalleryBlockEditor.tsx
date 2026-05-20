'use client';

import type { SiteBlock } from '@/lib/types';
import { newBlockId } from '@/lib/siteUtils';
import { SiteImageUpload } from '@/components/site/SiteImageUpload';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type Props = {
  conferenceId: string | string[];
  items: SiteBlock['items'];
  onChange: (items: NonNullable<SiteBlock['items']>) => void;
};

export function GalleryBlockEditor({ conferenceId, items, onChange }: Props) {
  const list = items || [];

  const updateItem = (idx: number, patch: Partial<NonNullable<SiteBlock['items']>[number]>) => {
    onChange(list.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  return (
    <div className="mt-3 space-y-4">
      {list.map((item, i) => (
        <div key={item.id || i} className="rounded-lg border p-3">
          <SiteImageUpload
            conferenceId={conferenceId}
            label={`Фото ${i + 1}`}
            assetType="image"
            value={item.url}
            onChange={(url) => updateItem(i, { url, id: item.id || newBlockId() })}
          />
          <Input
            label="Год"
            type="number"
            value={item.year ?? ''}
            onChange={(e) =>
              updateItem(i, { year: Number(e.target.value) || undefined, id: item.id || newBlockId() })
            }
          />
          <Input
            label="Подпись"
            value={item.caption || ''}
            onChange={(e) => updateItem(i, { caption: e.target.value })}
          />
          <Button type="button" variant="ghost" onClick={() => onChange(list.filter((_, j) => j !== i))}>
            Удалить
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        onClick={() =>
          onChange([...list, { id: newBlockId(), url: '', caption: '', year: new Date().getFullYear() }])
        }
      >
        Добавить фото
      </Button>
    </div>
  );
}
