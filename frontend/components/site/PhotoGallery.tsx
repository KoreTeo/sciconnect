'use client';

import { useState } from 'react';
import { getUploadUrl } from '@/lib/urls';
import { groupItemsByYear, sortedYearKeys, yearGroupLabel } from '@/lib/site/groupByKey';
import { GalleryPlaceholderGrid } from '@/components/ui/MediaPlaceholder';
import type { SiteBlockItem } from '@/lib/types';

export function PhotoGallery({ items }: { items: SiteBlockItem[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const photos = items.filter((i) => i.url);

  if (photos.length === 0) {
    const years = [String(new Date().getFullYear()), String(new Date().getFullYear() - 1)];
    return (
      <div className="space-y-8">
        {years.map((year) => (
          <section key={year}>
            <h3 className="mb-4 border-b border-slate-200 pb-2 text-xl font-bold text-slate-900">{year}</h3>
            <GalleryPlaceholderGrid count={4} />
          </section>
        ))}
      </div>
    );
  }

  const grouped = groupItemsByYear(photos, (item) => item.year);
  const yearKeys = sortedYearKeys([...grouped.keys()]);

  return (
    <>
      <div className="space-y-10">
        {yearKeys.map((yearKey) => (
          <section key={yearKey}>
            <h3 className="mb-4 border-b border-slate-200 pb-2 text-xl font-bold text-slate-900">
              {yearGroupLabel(yearKey)}
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {grouped.get(yearKey)!.map((item) => {
                const src = getUploadUrl(item.url);
                if (!src) return null;
                return (
                  <button
                    key={item.id || item.url}
                    type="button"
                    className="group overflow-hidden rounded-lg border bg-slate-50 text-left"
                    onClick={() => setLightbox(src)}
                  >
                    <img
                      src={src}
                      alt={item.caption || ''}
                      className="aspect-square w-full object-cover transition group-hover:scale-105"
                    />
                    {item.caption && <p className="p-2 text-xs text-slate-600">{item.caption}</p>}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
          role="presentation"
        >
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </>
  );
}
