import type { SiteBlockVariant } from '@/lib/site/blockTypes';

export function SiteBlockShell({
  title,
  showTitle = true,
  variant = 'card',
  children,
}: {
  title?: string;
  showTitle?: boolean;
  variant?: SiteBlockVariant;
  children: React.ReactNode;
}) {
  const wrapperClass = variant === 'plain' ? 'py-2' : 'section-card';

  return (
    <section className={wrapperClass}>
      {showTitle && title && <h2 className="mb-3 text-xl font-semibold">{title}</h2>}
      {children}
    </section>
  );
}
