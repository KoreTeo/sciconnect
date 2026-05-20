import axios from 'axios';
import { accessTokenCookie } from './cookies';
import { getApiBaseUrl } from './urls';

const API_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20_000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && typeof window !== 'undefined') {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) return Promise.reject(error);
      try {
        if (!refreshing) {
          refreshing = api
            .post('/auth/refresh', { refresh_token: refresh })
            .then((res) => {
              localStorage.setItem('access_token', res.data.access_token);
              localStorage.setItem('refresh_token', res.data.refresh_token);
              document.cookie = accessTokenCookie(res.data.access_token);
              return res.data.access_token;
            })
            .finally(() => {
              refreshing = null;
            });
        }
        const token = await refreshing;
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { getUploadUrl } from './urls';

export default api;
