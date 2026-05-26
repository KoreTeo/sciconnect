import axios from 'axios';
import { getApiBaseUrl } from './urls';

const API_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20_000,
  withCredentials: true,
});

let refreshing: Promise<void> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/refresh') &&
      typeof window !== 'undefined'
    ) {
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
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { getUploadUrl } from './urls';

export default api;
