import { expect, request, test } from '@playwright/test';
import { API_BASE, apiLogin, authHeaders, loginAs } from './support/helpers';

test.describe('Integration smoke', () => {
  test('conference manage CSV export endpoints return text/csv', async () => {
    const api = await request.newContext();
    const token = await apiLogin(api, 'organizer@sciconnect.demo', 'org123456');
    const headers = authHeaders(token);
    const conferenceId = 1;

    const endpoints = [
      `${API_BASE}/papers/conference/${conferenceId}/export`,
      `${API_BASE}/conference/${conferenceId}/export`,
      `${API_BASE}/conferences/${conferenceId}/registrations/export`,
      `${API_BASE}/conferences/${conferenceId}/proceedings/export?format=csv`,
    ];

    for (const url of endpoints) {
      const res = await api.get(url, { headers });
      expect(res.ok(), url).toBeTruthy();
      const contentType = res.headers()['content-type'] || '';
      expect(contentType, url).toMatch(/text\/csv|application\/csv/i);
      const body = await res.text();
      expect(body.length, url).toBeGreaterThan(0);
    }
  });

  test('organizer manage page shows CSV export actions', async ({ page }) => {
    await loginAs(page, 'organizer');
    await page.goto('/conference-manage/1');
    await expect(page.getByRole('button', { name: 'Экспорт статей' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Экспорт рецензий' })).toBeVisible();

    await page.getByRole('tab', { name: 'Участники' }).click();
    await expect(page.getByRole('button', { name: 'Экспорт CSV' })).toBeVisible();
  });

  test('submit-paper page renders form shell', async ({ page }) => {
    await loginAs(page, 'author');
    await page.goto('/submit-paper');
    await expect(page.getByRole('heading', { name: /новая статья/i })).toBeVisible();
    await expect(page.getByLabel(/конференция/i)).toBeVisible();
  });

  test('proceedings page offers CSV download', async ({ page }) => {
    await loginAs(page, 'organizer');
    await page.goto('/conference-proceedings/1');
    await expect(page.getByRole('button', { name: 'CSV' })).toBeVisible();
  });

  test('reviewer my-reviews page uses single list fetch', async ({ page }) => {
    const reviewRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/reviews/my')) reviewRequests.push(url);
    });

    await loginAs(page, 'reviewer');
    await page.goto('/reviews');
    await expect(page.getByRole('heading', { name: /мои рецензии/i })).toBeVisible();

    await expect.poll(() => reviewRequests.length).toBeLessThanOrEqual(1);
  });

  test('author can toggle notification preferences on profile', async ({ page }) => {
    await loginAs(page, 'author');
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Уведомления' })).toBeVisible();

    const emailToggle = page.getByLabel('Статьи: email');
    await expect(emailToggle).toBeVisible();
    await emailToggle.click();
    await expect(page.getByText('Настройки уведомлений сохранены')).toBeVisible();
  });

  test('organizer can save program after adding a session', async ({ page }) => {
    await loginAs(page, 'organizer');
    await page.goto('/conference-program/1');
    await page.getByRole('button', { name: 'Добавить секцию' }).click();
    await page.getByRole('button', { name: 'Сохранить программу' }).click();
    await expect(page.getByText(/программа сохранена/i)).toBeVisible();
  });

  test('organizer can add gallery and proceedings blocks in site editor', async ({ page }) => {
    await loginAs(page, 'organizer');
    await page.goto('/conference-site/1');
    await page.getByRole('tab', { name: 'Редактор страницы', exact: true }).click();
    await page.getByRole('button', { name: 'Новый блок' }).click();

    await page.getByLabel('Тип').selectOption('gallery');
    await page.getByLabel('Заголовок').fill(`E2E Gallery ${Date.now()}`);
    await page.getByRole('button', { name: 'Добавить фото' }).click();
    await page.getByRole('button', { name: 'Добавить блок' }).click();
    await expect(page.getByText(/блок сохранён/i)).toBeVisible();

    await page.getByRole('button', { name: 'Новый блок' }).click();
    await page.getByLabel('Тип').selectOption('proceedings');
    await page.getByLabel('Заголовок').fill(`E2E Proceedings ${Date.now()}`);
    await page.getByRole('button', { name: 'Добавить сборник' }).click();
    await page.getByRole('button', { name: 'Добавить блок' }).click();
    await expect(page.getByText(/блок сохранён/i)).toBeVisible();
  });
});
