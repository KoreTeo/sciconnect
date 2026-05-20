import { expect, test } from '@playwright/test';
import { loginAs } from './support/helpers';

test.describe('Authenticated shell smoke', () => {
  test('author login and my papers', async ({ page }) => {
    await loginAs(page, 'author');
    await page.goto('/my-papers');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('organizer manage and public site', async ({ page }) => {
    await loginAs(page, 'organizer');
    await page.goto('/c/iccs2026');
    await expect(page.locator('h1').first()).toBeVisible();
  });
});
