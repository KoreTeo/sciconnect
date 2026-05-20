import { expect, request, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import {
  API_BASE,
  USERS,
  apiLogin,
  authHeaders,
  authenticatePage,
  loginAs,
} from './support/helpers';

const OUT_DIR = path.resolve(process.cwd(), '..', 'docs', 'site-screenshots');

async function waitReady(page: import('@playwright/test').Page) {
  await page.waitForLoadState('domcontentloaded');
  const spinner = page.locator('[role="status"]');
  try {
    await spinner.first().waitFor({ state: 'hidden', timeout: 20000 });
  } catch {
    // no spinner or timeout — capture current state
  }
  await page.waitForTimeout(400);
}

async function snap(page: import('@playwright/test').Page, name: string) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`Saved: ${file}`);
}

async function snapOptional(page: import('@playwright/test').Page, name: string, action: () => Promise<void>) {
  try {
    await action();
    await page.waitForTimeout(500);
    await snap(page, name);
  } catch (err) {
    console.warn(`Skipped ${name}:`, err instanceof Error ? err.message : err);
    await snap(page, `${name}-fallback`);
  }
}

test.describe.configure({ mode: 'serial' });

test('capture all site sections', async ({ page, browser }) => {
  test.setTimeout(120_000);
  const api = await request.newContext();
  const organizerToken = await apiLogin(api, USERS.organizer.email, USERS.organizer.password);
  const authorToken = await apiLogin(api, USERS.author.email, USERS.author.password);
  const reviewerToken = await apiLogin(api, USERS.reviewer.email, USERS.reviewer.password);

  const conferencesRes = await api.get(`${API_BASE}/conferences`, { headers: authHeaders(organizerToken) });
  expect(conferencesRes.ok()).toBeTruthy();
  const conferences = await conferencesRes.json();
  const demoConf = conferences.find((c: { short_name?: string }) => c.short_name === 'iccs2026') || conferences[0];
  const confId = demoConf?.id ?? 1;

  const papersRes = await api.get(`${API_BASE}/papers/my`, { headers: authHeaders(authorToken) });
  const papers = papersRes.ok() ? await papersRes.json() : [];
  const submittedPaper = papers.find((p: { status?: string }) => p.status && p.status !== 'draft');
  const paperId = submittedPaper?.id ?? papers[0]?.id;

  const reviewsRes = await api.get(`${API_BASE}/reviews/my`, { headers: authHeaders(reviewerToken) });
  const reviews = reviewsRes.ok() ? await reviewsRes.json() : [];
  const reviewPaperId = reviews[0]?.paper_id ?? paperId;

  // Public
  for (const [route, name] of [
    ['/', '01-home'],
    ['/login', '02-login'],
    ['/register', '03-register-participant'],
    ['/register/organizer', '04-register-organizer'],
    ['/forgot-password', '05-forgot-password'],
    ['/terms', '06-terms'],
    ['/conferences', '07-conferences-catalog'],
  ] as const) {
    await page.goto(route);
    await waitReady(page);
    await snap(page, name);
  }

  await page.goto('/c/iccs2026');
  await waitReady(page);
  await snap(page, '08-public-site-home');

  await page.goto('/c/iccs2026/program');
  await waitReady(page);
  await snap(page, '09-public-site-program');

  // Author
  await loginAs(page, 'author');
  for (const [route, name] of [
    ['/dashboard', '10-author-dashboard'],
    ['/my-papers', '11-author-my-papers'],
    ['/my-registrations', '12-author-my-registrations'],
    ['/submit-paper', '13-author-submit-paper'],
    ['/profile', '14-author-profile'],
    ['/notifications', '15-author-notifications'],
  ] as const) {
    await page.goto(route);
    await waitReady(page);
    await snap(page, name);
  }

  if (paperId) {
    await page.goto(`/papers/${paperId}`);
    await waitReady(page);
    await snap(page, '16-author-paper-detail');
  }

  await page.goto(`/conferences/${confId}/register`);
  await waitReady(page);
  await snap(page, '17-author-register-wizard');

  // Reviewer
  await loginAs(page, 'reviewer');
  await page.goto('/reviews');
  await waitReady(page);
  await snap(page, '18-reviewer-reviews-list');

  if (reviewPaperId) {
    await page.goto(`/reviews/${reviewPaperId}`);
    await waitReady(page);
    await snap(page, '19-reviewer-review-form');
  }

  // Organizer
  await loginAs(page, 'organizer');
  for (const [route, name] of [
    ['/my-conferences', '20-organizer-my-conferences'],
    ['/conferences/new', '21-organizer-new-conference'],
    [`/conferences/${confId}`, '22-organizer-conference-detail'],
    [`/conferences/${confId}/edit`, '23-organizer-conference-edit'],
    [`/conference-manage/${confId}`, '24-organizer-manage-papers'],
    [`/conference-program/${confId}`, '29-organizer-program'],
    [`/conference-proceedings/${confId}`, '30-organizer-proceedings'],
  ] as const) {
    await page.goto(route);
    await waitReady(page);
    await snap(page, name);
  }

  await page.goto(`/conference-site/${confId}`);
  await waitReady(page);
  await snap(page, '31-organizer-site-editor');

  await snapOptional(page, '25-organizer-manage-reviewers', async () => {
    await page.goto(`/conference-manage/${confId}`);
    await page.getByRole('tab', { name: 'Рецензенты' }).click();
  });

  await snapOptional(page, '26-organizer-manage-overview', async () => {
    await page.getByRole('tab', { name: 'Обзор' }).click();
  });

  await snapOptional(page, '27-organizer-manage-participants', async () => {
    await page.getByRole('tab', { name: 'Участники' }).click();
  });

  await snapOptional(page, '28-organizer-manage-tracks', async () => {
    await page.getByRole('tab', { name: 'Треки' }).click();
  });

  // Admin
  await loginAs(page, 'admin');
  await page.goto('/admin');
  await waitReady(page);
  await snap(page, '32-admin-panel');

  // Payment
  const paymentRes = await api.post(`${API_BASE}/payments/create`, {
    headers: authHeaders(authorToken),
    data: { conference_id: confId, purpose: 'registration' },
  });
  if (paymentRes.ok()) {
    const payment = await paymentRes.json();
    const payPage = await browser.newPage();
    await authenticatePage(payPage, authorToken);
    await payPage.goto(`/payments/${payment.id}`);
    await payPage.waitForLoadState('domcontentloaded');
    await snap(payPage, '33-author-payment-page');
    await payPage.close();
  }

  await api.dispose();
});
