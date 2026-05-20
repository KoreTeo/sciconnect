'use client';

import { useState } from 'react';
import { getUploadUrl } from '@/lib/urls';
import type { ProceedingsIssue } from '@/lib/types';
import { publicTableWrap } from '@/components/site/publicSiteStyles';

export function ProceedingsCurrentIssue({ issue }: { issue: ProceedingsIssue }) {
  const entries = [...(issue.entries || [])].sort((a, b) => a.order - b.order);

  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">Статьи текущего выпуска пока не опубликованы.</p>;
  }

  return (
    <section className="space-y-4">
      <header className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
        <h2 className="text-xl font-semibold text-slate-900">{issue.title}</h2>
        {issue.description && <p className="mt-2 text-sm text-slate-600">{issue.description}</p>}
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
          {issue.isbn && <span>ISBN: {issue.isbn}</span>}
          {issue.published_at && <span>Опубликовано: {new Date(issue.published_at).toLocaleDateString('ru-RU')}</span>}
        </div>
      </header>

      <div className={publicTableWrap}>
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">№</th>
              <th className="px-4 py-3 font-medium">Статья</th>
              <th className="px-4 py-3 font-medium">Авторы</th>
              <th className="px-4 py-3 font-medium">Стр.</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((entry, idx) => {
              const authors = [
                entry.author_name,
                ...(entry.co_authors || []).map((a) => a.full_name),
              ]
                .filter(Boolean)
                .join(', ');
              const pdfUrl = getUploadUrl(entry.paper_file_url);
              return (
                <tr key={entry.id} className="bg-white">
                  <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{entry.published_title || entry.paper_title}</p>
                    {entry.doi && <p className="mt-0.5 text-xs text-slate-500">DOI: {entry.doi}</p>}
                    {(entry.published_abstract || entry.paper_abstract) && (
                      <AbstractToggle text={entry.published_abstract || entry.paper_abstract || ''} />
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{authors || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{entry.pages || '—'}</td>
                  <td className="px-4 py-3">
                    {pdfUrl ? (
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="whitespace-nowrap text-brand-600 hover:underline"
                      >
                        PDF
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AbstractToggle({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  if (!text.trim()) return null;
  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-brand-600 hover:underline"
      >
        {open ? 'Скрыть аннотацию' : 'Аннотация'}
      </button>
      {open && <p className="mt-1 text-xs leading-relaxed text-slate-600">{text}</p>}
    </div>
  );
}
