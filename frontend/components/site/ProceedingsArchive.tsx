import { getUploadUrl } from '@/lib/urls';
import { MediaPlaceholder } from '@/components/ui/MediaPlaceholder';
import { publicBtnPrimary } from '@/components/site/publicSiteStyles';
import type { SiteBlockItem } from '@/lib/types';

export function ProceedingsArchive({ items }: { items: SiteBlockItem[] }) {
  const rows = [...items].sort((a, b) => (b.year || 0) - (a.year || 0));

  if (rows.length === 0) {
    const years = [new Date().getFullYear(), new Date().getFullYear() - 1];
    return (
      <div className="space-y-8">
        {years.map((year) => (
          <section key={year}>
            <h3 className="mb-4 text-2xl font-bold text-slate-900">{year}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <MediaPlaceholder variant="card" className="mb-3 max-h-32" />
                <p className="text-sm text-slate-500">Материалы {year}</p>
              </div>
            </div>
          </section>
        ))}
      </div>
    );
  }

  const byYear = new Map<number, SiteBlockItem[]>();
  for (const item of rows) {
    const y = item.year ?? 0;
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(item);
  }
  const years = [...byYear.keys()].sort((a, b) => b - a);

  return (
    <div className="space-y-10">
      {years.map((year) => (
        <section key={year}>
          <h3 className="mb-4 border-b border-slate-200 pb-2 text-2xl font-bold text-slate-900">
            {year || 'Без года'}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {byYear.get(year)!.map((item) => {
              const href = getUploadUrl(item.file_url || item.url);
              return (
                <article
                  key={item.id || `${year}-${item.title}`}
                  className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <MediaPlaceholder variant="card" className="mb-4 max-h-36" hideLabel />
                  <h4 className="mb-1 font-semibold text-slate-900">{item.title || 'Сборник материалов'}</h4>
                  {item.file_name && <p className="mb-4 text-xs text-slate-500">{item.file_name}</p>}
                  <div className="mt-auto">
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className={publicBtnPrimary}>
                        Скачать PDF
                      </a>
                    ) : (
                      <span className="text-sm text-slate-400">Файл не загружен</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
