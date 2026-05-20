import { expect, request, test } from '@playwright/test';
import { API_BASE, apiLogin, authHeaders, createPaper, loginAs } from './support/helpers';

test.describe('Reviews', () => {
  test('review workflow shows progress and completed assignment', async ({ page }) => {
    const api = await request.newContext();
    const organizerToken = await apiLogin(api, 'organizer@sciconnect.demo', 'org123456');
    const authorToken = await apiLogin(api, 'author@sciconnect.demo', 'user123456');
    const adminToken = await apiLogin(api, 'admin@sciconnect.demo', 'admin123');
    const suffix = Date.now().toString(36);
    const title = `E2E review workflow ${suffix}`;

    const usersRes = await api.get(`${API_BASE}/admin/users`, {
      headers: authHeaders(adminToken),
      params: { q: 'reviewer1@sciconnect.demo' },
    });
    expect(usersRes.ok()).toBeTruthy();
    const reviewer = (await usersRes.json())[0];
    expect(reviewer?.id).toBeTruthy();

    const paper = await createPaper(
      api,
      authorToken,
      title,
      'E2E проверка процесса рецензирования и прогресса для организатора.'
    );

    const assignRes = await api.post(`${API_BASE}/conferences/1/assign-reviewer`, {
      headers: authHeaders(organizerToken),
      data: { user_id: reviewer.id, paper_id: paper.id },
    });
    expect(assignRes.ok()).toBeTruthy();

    await loginAs(page, 'organizer');
    await page.goto('/conference-manage/1');
    await expect(page.getByText('Назначений')).toBeVisible();
    const paperItem = page.locator('li').filter({ hasText: title }).first();
    await expect(paperItem).toBeVisible();
    await expect(paperItem.getByText(/пётр рецензент/i).first()).toBeVisible();
    await expect(paperItem.getByText(/в работе/i).first()).toBeVisible();

    await page.getByRole('button', { name: 'Выйти' }).click();
    await loginAs(page, 'reviewer');
    await page.goto('/reviews');
    await expect(page.getByText(title)).toBeVisible();
    await expect(page.getByText(/в работе/i).first()).toBeVisible();

    await page.goto(`/reviews/${paper.id}`);
    await expect(page.getByText(/дедлайн рецензии/i)).toBeVisible();
    await page.getByLabel(/комментарий автору/i).fill('Рецензия подготовлена в рамках E2E проверки.');
    await page.getByRole('button', { name: /отправить рецензию/i }).click();
    await page.getByRole('button', { name: /отправить окончательно/i }).click();
    await expect(page).toHaveURL(/\/reviews$/);

    await page.getByRole('button', { name: 'Выйти' }).click();
    await loginAs(page, 'organizer');
    await page.goto('/conference-manage/1');
    const completedPaperItem = page.locator('li').filter({ hasText: title }).first();
    await expect(completedPaperItem).toBeVisible();
    await expect(completedPaperItem.getByText(/принять/i).first()).toBeVisible();
  });
});
