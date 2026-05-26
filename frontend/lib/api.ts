import axios, { type InternalAxiosRequestConfig } from 'axios';
import { getApiBaseUrl } from './urls';

const API_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20_000,
  withCredentials: true,
});

let refreshing: Promise<void> | null = null;

/** Pages where 401 must not trigger a hard redirect (avoids reload loop on /login). */
function isPublicAuthPage(): boolean {
  const path = window.location.pathname;
  return (
    path === '/' ||
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/forgot-password') ||
    path.startsWith('/reset-password') ||
    path.startsWith('/verify-email') ||
    path.startsWith('/terms') ||
    path.startsWith('/c/')
  );
}

function isSessionProbe(config: InternalAxiosRequestConfig): boolean {
  const url = config.url ?? '';
  return url.includes('/users/me');
}

function isAuthEndpoint(config: InternalAxiosRequestConfig): boolean {
  const url = config.url ?? '';
  return url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      typeof window === 'undefined' ||
      isAuthEndpoint(original)
    ) {
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      if (!refreshing) {
        refreshing = api
          .post('/auth/refresh')
          .then(() => undefined)
          .finally(() => {
            refreshing = null;
          });
      }
      await refreshing;
      return api(original);
    } catch {
      // Session check on public pages: stay put, let AuthProvider set user=null
      if (!isSessionProbe(original) && !isPublicAuthPage()) {
        window.location.assign('/login');
      }
      return Promise.reject(error);
    }
  }
);

export { getUploadUrl } from './urls';

export default api;
