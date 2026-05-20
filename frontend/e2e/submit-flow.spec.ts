import { expect, request, test } from '@playwright/test';
import { API_BASE, apiLogin, authHeaders, createPaper, loginAs } from './support/helpers';

test.describe('Paper submit flow', () => {
  test('draft upload and submit via UI', async ({ page }) => {
    const api = await request.newContext();
    const authorToken = await apiLogin(api, 'author@sciconnect.demo', 'user123456');
    const suffix = Date.now().toString(36);
    const title = `E2E submit flow ${suffix}`;

    const paper = await createPaper(
      api,
      authorToken,
      title,
      'E2E статья для проверки пошаговой подачи через интерфейс автора.'
    );

    await loginAs(page, 'author');
    await page.goto(`/submit-paper?paperId=${paper.id}`);
    await expect(page.getByText(/черновик/i).first()).toBeVisible();

    await page.getByLabel('PDF файл').setInputFiles({
      name: 'submit-flow.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 submit flow test'),
    });
    await page.getByRole('button', { name: /загрузить pdf и подать/i }).click();
    await page.waitForURL(new RegExp(`/papers/${paper.id}`));

    const detailRes = await api.get(`${API_BASE}/papers/${paper.id}`, {
      headers: authHeaders(authorToken),
    });
    expect(detailRes.ok()).toBeTruthy();
    const detail = await detailRes.json();
    expect(['submitted', 'under_review']).toContain(detail.status);
  });
});
