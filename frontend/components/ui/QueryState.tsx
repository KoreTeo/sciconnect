import { Alert } from './Alert';
import { LoadingSpinner } from './LoadingSpinner';

export function QueryState({
  loading,
  error,
  onRetry,
  children,
}: {
  loading: boolean;
  error?: unknown;
  onRetry?: () => void;
  children?: React.ReactNode;
}) {
  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <Alert variant="error">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>Не удалось загрузить данные</span>
          {onRetry && (
            <button type="button" className="font-medium underline" onClick={onRetry}>
              Повторить
            </button>
          )}
        </div>
      </Alert>
    );
  }
  return <>{children}</>;
}
