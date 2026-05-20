export function LoadingSpinner({ label = 'Загрузка...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12" role="status" aria-live="polite">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" aria-hidden="true" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
