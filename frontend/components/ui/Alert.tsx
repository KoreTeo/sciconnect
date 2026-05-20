export function Alert({
  children,
  variant = 'info',
  className = '',
  live = variant === 'error' ? 'assertive' : 'polite',
}: {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'error' | 'warning';
  className?: string;
  live?: 'off' | 'polite' | 'assertive';
}) {
  const styles = {
    info: 'border-blue-200 bg-blue-50 text-blue-900',
    success: 'border-green-200 bg-green-50 text-green-900',
    error: 'border-red-200 bg-red-50 text-red-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
  };
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={live}
      className={`rounded-lg border px-4 py-3 text-sm ${styles[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
