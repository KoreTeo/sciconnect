import { expect, request, test } from '@playwright/test';
import { API_BASE, apiLogin, authHeaders, createPaper, loginAs } from './support/helpers';

test.describe('Proceedings', () => {
  test('organizer publishes proceedings and public site shows metadata', async ({ page, request: browserRequest }) => {
    const api = await request.newContext();
    const organizerToken = await apiLogin(api, 'organizer@sciconnect.demo', 'org123456');
    const authorToken = await apiLogin(api, 'author@sciconnect.demo', 'user123456');
    const suffix = Date.now().toString(36);
    const title = `E2E proceedings paper ${suffix}`;
    const doi = `10.5555/sciconnect.${suffix}`;

    const paper = await createPaper(
      api,
      authorToken,
      title,
      'E2E проверка публикации статьи в сборнике конференции и экспорта метаданных.'
    );

    const decisionRes = await api.put(`${API_BASE}/papers/${paper.id}/decision`, {
      headers: authHeaders(organizerToken),
      data: { status: 'accepted' },
    });
    expect(decisionRes.ok()).toBeTruthy();

    await loginAs(page, 'organizer');
    await page.goto('/conference-proceedings/1');
    await expect(page.getByRole('heading', { name: /сборник:/i })).toBeVisible();
    await page.getByLabel('DOI prefix').fill('10.5555/sciconnect');
    await page.getByRole('button', { name: 'Сохранить', exact: true }).click();

    const acceptedPaper = page.locator('li').filter({ hasText: title }).first();
    await expect(acceptedPaper).toBeVisible();
    await acceptedPaper.getByRole('button', { name: 'Добавить' }).click();
    const entryItem = page.locator('section').filter({ hasText: 'Записи сборника' }).locator('li').last();
    await expect(entryItem.getByLabel('Заголовок')).toHaveValue(title);
    await entryItem.getByLabel('DOI статьи').fill(doi);
    await entryItem.getByLabel('Страницы').fill('12-20');
    await entryItem.getByRole('button', { name: 'Сохранить запись' }).click();
    await expect(entryItem.getByLabel('DOI статьи')).toHaveValue(doi);
    const publishButton = page.getByRole('button', { name: 'Опубликовать' });
    if (await publishButton.count()) {
      await publishButton.click();
    }
    await expect(page.getByText('Опубликован')).toBeVisible();

    await page.goto('/c/iccs2026/proceedings');
    await expect(page.getByRole('heading', { name: 'Сборники', exact: true })).toBeVisible();
    await expect(page.getByText(title)).toBeVisible();

    await expect
      .poll(async () => {
        const exportRes = await browserRequest.get(`${API_BASE}/conferences/1/proceedings/export`, {
          headers: authHeaders(organizerToken),
        });
        if (!exportRes.ok()) return false;
        const exported = await exportRes.json();
        return exported.entries.some((entry: { title: string }) => entry.title === title);
      })
      .toBeTruthy();
  });
});
