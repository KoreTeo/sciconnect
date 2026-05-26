import { expect, type APIRequestContext, type Page } from '@playwright/test';

export const API_BASE = process.env.PLAYWRIGHT_API_BASE || 'http://localhost:8000';

export const USERS = {
  admin: { email: 'admin@sciconnect.demo', password: 'admin123' },
  organizer: { email: 'organizer@sciconnect.demo', password: 'org123456' },
  reviewer: { email: 'reviewer1@sciconnect.demo', password: 'rev123456' },
  author: { email: 'author@sciconnect.demo', password: 'user123456' },
} as const;

export async function apiLogin(api: APIRequestContext, email: string, password: string): Promise<string> {
  const res = await api.post(`${API_BASE}/auth/login`, { data: { email, password } });
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  return data.access_token;
}

export function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function authenticatePage(page: Page, token: string) {
  await page.context().addCookies([
    {
      name: 'access_token',
      value: token,
      domain: new URL(page.url() || 'http://localhost:3000').hostname,
      path: '/',
      httpOnly: false, // Playwright sets it non-httpOnly; backend sets real httpOnly on login
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

export async function loginAs(page: Page, role: keyof typeof USERS) {
  const user = USERS[role];
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/пароль/i).fill(user.password);
  await page.getByRole('button', { name: /войти/i }).click();
  await page.waitForURL(/dashboard|my-papers/);
}

export async function createParticipant(api: APIRequestContext) {
  const suffix = Date.now().toString(36);
  const email = `e2e-${suffix}@sciconnect.demo`;
  const password = 'user123456';
  const res = await api.post(`${API_BASE}/auth/register`, {
    data: {
      email,
      password,
      full_name: `E2E Участник ${suffix}`,
      affiliation: 'E2E Lab',
      country: 'RU',
    },
  });
  expect(res.ok()).toBeTruthy();

  const tokenRes = await api.get(`${API_BASE}/auth/debug/verification-token`, {
    params: { email },
  });
  expect(tokenRes.ok()).toBeTruthy();
  const { token } = await tokenRes.json();
  const verifyRes = await api.post(`${API_BASE}/auth/verify-email`, { data: { token } });
  expect(verifyRes.ok()).toBeTruthy();

  return { email, password };
}

export function futureConferenceDates() {
  const now = new Date();
  return {
    now,
    submission_deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    review_deadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    start_date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    end_date: new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  };
}

export async function createConference(
  api: APIRequestContext,
  organizerToken: string,
  data: Partial<Record<string, unknown>> = {}
) {
  const suffix = Date.now().toString(36);
  const dates = futureConferenceDates();
  const res = await api.post(`${API_BASE}/conferences/`, {
    headers: authHeaders(organizerToken),
    data: {
      title: `E2E conference ${suffix}`,
      short_name: `e2e-${suffix}`,
      description: 'E2E conference',
      topics: ['e2e'],
      start_date: dates.start_date,
      end_date: dates.end_date,
      submission_deadline: dates.submission_deadline,
      review_deadline: dates.review_deadline,
      location: 'Online',
      format: 'online',
      ...data,
    },
  });
  expect(res.ok()).toBeTruthy();
  return res.json();
}

export async function createPaper(api: APIRequestContext, authorToken: string, title: string, abstract: string) {
  const res = await api.post(`${API_BASE}/papers/`, {
    headers: authHeaders(authorToken),
    params: { conference_id: 1 },
    data: {
      title,
      abstract,
      keywords: ['e2e'],
    },
  });
  expect(res.ok()).toBeTruthy();
  return res.json();
}
