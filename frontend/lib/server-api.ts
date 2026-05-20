/** URL для server-side fetch (в Docker — backend:8000, в браузере — localhost). */
export function getServerApiUrl(): string {
  return (
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000'
  );
}

export async function serverFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const base = getServerApiUrl().replace(/\/$/, '');
  try {
    const res = await fetch(`${base}${path}`, {
      ...init,
      cache: init?.cache ?? 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
