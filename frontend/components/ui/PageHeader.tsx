import Link from 'next/link';

export function PageHeader({
  title,
  description,
  action,
  breadcrumbs,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}) {
  return (
    <header className="mb-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-2 flex flex-wrap gap-1 text-sm text-slate-500">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span>/</span>}
              {b.href ? (
                <Link href={b.href} className="hover:text-brand-600">
                  {b.label}
                </Link>
              ) : (
                <span className="text-slate-700">{b.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <section>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-slate-600">{description}</p>}
        </section>
        {action}
      </div>
    </header>
  );
}
