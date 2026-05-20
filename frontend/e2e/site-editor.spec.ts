import { expect, test } from '@playwright/test';
import { loginAs } from './support/helpers';

test.describe('Site editor', () => {
  test('organizer can open site editor tabs and save', async ({ page }) => {
    await loginAs(page, 'organizer');

    await page.goto('/conference-site/1');
    await expect(page.getByRole('tab', { name: 'Общее', exact: true })).toBeVisible();
    await page.getByRole('tab', { name: 'Общее', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Страницы', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('button', { name: 'Добавить' })).toBeVisible();
    await page.getByRole('tab', { name: 'Редактор страницы', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Новый блок' })).toBeVisible();
    await page.getByRole('button', { name: 'Сохранить' }).click();
    await expect(page.getByText(/настройки сохранены/i)).toBeVisible();
  });
});
