import Link from 'next/link';
import type { SiteBlockRenderContext } from '@/lib/site/blockTypes';
import { formatDate, formatDateRange } from '@/lib/format';
import { getUploadUrl } from '@/lib/urls';
import { MediaPlaceholder } from '@/components/ui/MediaPlaceholder';
import { RichTextBlock } from '@/components/site/RichTextBlock';
import { publicBtnPrimaryLg } from '@/components/site/publicSiteStyles';

export function ImageBlock({ block }: Pick<SiteBlockRenderContext, 'block'>) {
  const src = getUploadUrl(block.content);
  return src ? (
    <img src={src} alt={block.title || ''} className="max-h-96 w-full rounded-lg object-contain" />
  ) : (
    <MediaPlaceholder variant="banner" />
  );
}

export function CommitteeBlock({ block }: Pick<SiteBlockRenderContext, 'block'>) {
  return (
    <ul className="space-y-3">
      {String(block.content || '')
        .split('\n')
        .filter(Boolean)
        .map((line, j) => (
          <li key={j} className="flex items-center gap-3 text-slate-700">
            <MediaPlaceholder variant="avatar" hideLabel />
            <span>{line}</span>
          </li>
        ))}
    </ul>
  );
}

export function SponsorsBlock({ block }: Pick<SiteBlockRenderContext, 'block'>) {
  return (
    <div className="flex flex-wrap gap-4">
      {String(block.content || '')
        .split('\n')
        .filter(Boolean)
        .map((line, j) => (
          <span key={j} className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium">
            <MediaPlaceholder variant="logo" hideLabel />
            {line}
          </span>
        ))}
    </div>
  );
}

export function DeadlinesBlock({ conference }: Pick<SiteBlockRenderContext, 'conference'>) {
  return (
    <ul className="text-sm text-slate-600">
      <li>Подача статей: {formatDate(conference.submission_deadline)}</li>
      <li>Рецензирование: {formatDate(conference.review_deadline)}</li>
      <li>Даты проведения: {formatDateRange(conference.start_date, conference.end_date)}</li>
    </ul>
  );
}

export function TopicsBlock({ conference }: Pick<SiteBlockRenderContext, 'conference'>) {
  if (!conference.topics?.length) return null;
  return (
    <p className="flex flex-wrap gap-2">
      {conference.topics.map((t) => (
        <span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-sm">
          {t}
        </span>
      ))}
    </p>
  );
}

export function VenueBlock({ block }: Pick<SiteBlockRenderContext, 'block'>) {
  return (
    <div className="space-y-2 text-slate-700">
      {block.content && <RichTextBlock html={block.content} />}
      {block.items?.[0]?.url && (
        <a
          href={block.items[0].url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 hover:underline"
        >
          Открыть на карте
        </a>
      )}
    </div>
  );
}

export function CtaBlock({ block, conference }: Pick<SiteBlockRenderContext, 'block' | 'conference'>) {
  return (
    <p>
      <Link
        href={block.content || `/submit-paper?conferenceId=${conference.id}`}
        className={publicBtnPrimaryLg}
      >
        {block.title || 'Перейти'}
      </Link>
    </p>
  );
}

export function ContactBlock({ block }: Pick<SiteBlockRenderContext, 'block'>) {
  return <div className="text-slate-700">{block.content && <RichTextBlock html={block.content} />}</div>;
}
