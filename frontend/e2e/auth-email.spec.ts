import { expect, test } from '@playwright/test';
import { API_BASE, loginAs } from './support/helpers';

test.describe('Email verification', () => {
  test('verify email via debug token endpoint', async ({ page, request }) => {
    const email = `verify-e2e-${Date.now()}@test.local`;
    const password = 'TestPass123!';

    const registerRes = await request.post(`${API_BASE}/auth/register`, {
      data: {
        email,
        password,
        full_name: 'E2E Verify User',
        affiliation: 'Test University',
      },
    });
    expect(registerRes.ok()).toBeTruthy();

    const tokenRes = await request.get(`${API_BASE}/auth/debug/verification-token`, {
      params: { email },
    });
    expect(tokenRes.ok()).toBeTruthy();
    const { token } = await tokenRes.json();

    await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
    await expect(page.getByText(/подтверждён/i)).toBeVisible({ timeout: 15000 });

    await page.goto('/login');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/пароль/i).fill(password);
    await page.getByRole('button', { name: /войти/i }).click();
    await page.waitForURL(/\/(dashboard|my-papers)/, { timeout: 15000 });
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Профиль' })).toBeVisible();
    await expect(page.getByText(/email подтверждён/i)).toBeVisible({ timeout: 15000 });
  });

  test('unverified banner hidden for demo author', async ({ page }) => {
    await loginAs(page, 'author');
    await page.goto('/dashboard');
    await expect(page.getByText(/подтвердите email/i)).not.toBeVisible();
  });
});
