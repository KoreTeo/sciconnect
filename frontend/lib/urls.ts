const DEFAULT_API = 'http://localhost:8000';

function clientApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API;
}

function serverApiUrl(): string {
  return process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_API;
}

/** Public origin for /uploads (not under /api prefix in production). */
function uploadsBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const api = clientApiUrl();
    if (api.endsWith('/api')) return api.slice(0, -4);
    return api.replace(/\/api\/?$/, '') || api;
  }
  return serverApiUrl();
}

/** Абсолютный URL для файлов с API (/uploads/...). */
export function getUploadUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = uploadsBaseUrl();
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getApiBaseUrl(): string {
  return typeof window !== 'undefined' ? clientApiUrl() : serverApiUrl();
}
