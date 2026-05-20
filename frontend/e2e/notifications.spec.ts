import { test, expect } from '@playwright/test';
import { loginAs } from './support/helpers';

test.describe('Notifications center', () => {
  test('author can open notifications page and filter unread', async ({ page }) => {
    await loginAs(page, 'author');
    await page.goto('/notifications');
    await expect(page.getByRole('heading', { name: 'Уведомления' })).toBeVisible();
    await page.getByRole('button', { name: 'Непрочитанные' }).click();
    await expect(page.getByRole('button', { name: 'Все' })).toBeVisible();
  });
});
