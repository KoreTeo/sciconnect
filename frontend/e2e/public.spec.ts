import { expect, test } from '@playwright/test';
import { apiLogin, authenticatePage, createParticipant } from './support/helpers';

test.describe('Public and auth smoke', () => {
  test('guest sees conference catalog', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Каталог', exact: true })).toBeVisible();
    await page.goto('/conferences');
    await expect(page.locator('h1')).toContainText(/конференц/i);
  });

  test('forgot password page loads', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { name: /восстановление/i })).toBeVisible();
  });

  test('public site navigation opens subpages', async ({ page }) => {
    await page.goto('/c/iccs2026');
    await page.getByRole('link', { name: 'Галерея' }).click();
    await expect(page).toHaveURL(/\/c\/iccs2026\/gallery$/);
    await expect(page.getByRole('heading', { name: 'Галерея', exact: true })).toBeVisible();

    await page.getByRole('link', { name: 'Сборники' }).click();
    await expect(page).toHaveURL(/\/c\/iccs2026\/proceedings$/);
    await expect(page.getByRole('heading', { name: 'Сборники', exact: true })).toBeVisible();
  });

  test('author can open and use conference registration form', async ({ page, request }) => {
    const participant = await createParticipant(request);
    const token = await apiLogin(request, participant.email, participant.password);
    await authenticatePage(page, token);

    await page.goto('/conferences/1/register');
    await expect(page.getByRole('heading', { name: /регистрация на конференцию/i })).toBeVisible();
    await page.getByLabel(/тип участия/i).selectOption('author');
    const nextButtons = page.getByRole('button', { name: 'Далее' });
    if (await nextButtons.first().isVisible()) {
      await nextButtons.first().click();
      await nextButtons.first().click();
    }
    await page.getByRole('checkbox').check();
    await expect(page.getByRole('button', { name: /зарегистрироваться|подтвердить регистрацию/i })).toBeVisible();
  });

  test('guest CTA requires login before submitting a paper', async ({ page }) => {
    await page.goto('/c/iccs2026');
    await page.getByRole('link', { name: /подать статью/i }).first().click();
    await expect(page).toHaveURL(/\/login(\?.*)?$/);
  });
});
