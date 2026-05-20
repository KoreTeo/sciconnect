import { expect, request, test } from '@playwright/test';
import { API_BASE, apiLogin, authHeaders, createPaper, loginAs } from './support/helpers';

test.describe('Paper revisions', () => {
  test('paper revision cycle stores versions and resolves request', async ({ page }) => {
    const api = await request.newContext();
    const organizerToken = await apiLogin(api, 'organizer@sciconnect.demo', 'org123456');
    const authorToken = await apiLogin(api, 'author@sciconnect.demo', 'user123456');
    const suffix = Date.now().toString(36);
    const title = `E2E revision paper ${suffix}`;
    const comment = `Добавьте уточнение методики ${suffix}`;

    const paper = await createPaper(api, authorToken, title, 'E2E статья для проверки цикла доработки и истории версий.');

    const uploadRes = await api.post(`${API_BASE}/papers/${paper.id}/upload`, {
      headers: authHeaders(authorToken),
      multipart: {
        file: {
          name: 'initial.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('%PDF-1.4 initial revision cycle'),
        },
      },
    });
    expect(uploadRes.ok()).toBeTruthy();

    const submitRes = await api.post(`${API_BASE}/papers/${paper.id}/submit`, {
      headers: authHeaders(authorToken),
    });
    expect(submitRes.ok()).toBeTruthy();

    await loginAs(page, 'organizer');
    await page.goto('/conference-manage/1');
    const paperItem = page.locator('li').filter({ hasText: title }).first();
    await expect(paperItem).toBeVisible();
    await paperItem.getByLabel('Комментарий для доработки').fill(comment);
    await paperItem.getByRole('button', { name: 'Запросить доработку' }).click();
    await expect(paperItem.getByText(/раунд 1/i)).toBeVisible();

    await page.getByRole('button', { name: 'Выйти' }).click();
    await loginAs(page, 'author');
    await page.goto(`/papers/${paper.id}`);
    await expect(page.getByText(comment).first()).toBeVisible();
    await expect(page.getByText(/история версий/i)).toBeVisible();
    await page.getByRole('button', { name: /загрузить новую версию/i }).click();
    await expect(page.getByText(/это повторная подача/i)).toBeVisible();
    await page.getByLabel('PDF файл').setInputFiles({
      name: 'revision.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 updated revision cycle'),
    });
    await page.getByRole('button', { name: /отправить новую версию/i }).click();
    await expect(page).toHaveURL(new RegExp(`/papers/${paper.id}`));

    await page.getByRole('button', { name: 'Выйти' }).click();
    await loginAs(page, 'organizer');
    await page.goto('/conference-manage/1');
    const updatedPaperItem = page.locator('li').filter({ hasText: title }).first();
    await expect(updatedPaperItem).toBeVisible();
    await expect(updatedPaperItem.getByText('Версий: 2')).toBeVisible();
  });
});
