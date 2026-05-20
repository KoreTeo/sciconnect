export function MetricCard({ label, value, loading }: { label: string; value?: number; loading?: boolean }) {
  return (
    <article className="stat-card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-brand-700">{loading ? '...' : value ?? 0}</p>
    </article>
  );
}

export function MetricList({ items, values }: { items: Record<string, string>; values?: Record<string, number> }) {
  return (
    <ul className="space-y-2 text-sm">
      {Object.entries(items).map(([key, label]) => (
        <li key={key} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0">
          <span>{label}</span>
          <span className="font-semibold text-brand-700">{values?.[key] ?? 0}</span>
        </li>
      ))}
    </ul>
  );
}
