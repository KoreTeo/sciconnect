import { expect, request, test } from '@playwright/test';
import { API_BASE, apiLogin, authHeaders, createConference, createParticipant, loginAs } from './support/helpers';

test.describe('Admin workflows', () => {
  test('keyboard users can open notifications and close moderation modal', async ({ page }) => {
    const api = await request.newContext();
    const organizerToken = await apiLogin(api, 'organizer@sciconnect.demo', 'org123456');
    const suffix = Date.now().toString(36);
    const title = `E2E accessibility moderation ${suffix}`;

    const conference = await createConference(api, organizerToken, {
      title,
      short_name: `e2e-a11y-${suffix}`,
      description: 'Accessibility moderation modal check',
    });
    const submitRes = await api.post(`${API_BASE}/conferences/${conference.id}/submit-for-approval`, {
      headers: authHeaders(organizerToken),
      data: { comment: 'Ready for accessibility modal check' },
    });
    expect(submitRes.ok()).toBeTruthy();

    await loginAs(page, 'admin');

    await page.getByRole('button', { name: /уведомления/i }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Список уведомлений')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByLabel('Список уведомлений')).toBeHidden();

    await page.goto('/admin');
    const moderationItem = page.locator('li').filter({ hasText: title }).first();
    await expect(moderationItem).toBeVisible();
    await moderationItem.getByRole('button', { name: 'На доработку' }).click();
    await expect(page.getByRole('dialog', { name: /причина возврата/i })).toBeVisible();
    await expect(page.getByLabel('Комментарий модератора')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: /причина возврата/i })).toBeHidden();
  });

  test('admin page filters users and updates a test user role', async ({ page, request: browserRequest }) => {
    const participant = await createParticipant(browserRequest);
    await loginAs(page, 'admin');
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /администрирование/i })).toBeVisible();
    await expect(page.getByText(/пользователи по ролям/i)).toBeVisible();

    await page.getByRole('tab', { name: 'Пользователи' }).click();
    await expect(page.getByRole('table').getByText('admin@sciconnect.demo')).toBeVisible();

    await page.getByRole('tab', { name: 'Конференции' }).click();
    await expect(page.getByRole('heading', { name: 'Конференции', exact: true })).toBeVisible();

    await page.getByRole('tab', { name: 'Пользователи' }).click();
    await page.getByPlaceholder(/поиск по email/i).fill(participant.email);
    await expect(page.getByText(participant.email)).toBeVisible();
    const userRow = page.getByRole('row').filter({ hasText: participant.email });
    await userRow.getByRole('combobox').selectOption('reviewer');
    await expect(page.getByText(/роль пользователя обновлена/i)).toBeVisible();

    await page.getByRole('tab', { name: 'Аудит' }).click();
    await expect(page.getByRole('heading', { name: /последние действия/i })).toBeVisible();
    await expect(page.getByText(/изменение пользователя/i).first()).toBeVisible();

    await page.getByRole('tab', { name: 'Пользователи' }).click();
    await page.getByLabel('Роль пользователя', { exact: true }).selectOption('reviewer');
    await expect(page.getByText(participant.email)).toBeVisible();
  });

  test('conference moderation lifecycle approves a submitted draft', async ({ page, request: browserRequest }) => {
    const api = await request.newContext();
    const organizerToken = await apiLogin(api, 'organizer@sciconnect.demo', 'org123456');
    const suffix = Date.now().toString(36);
    const title = `E2E moderation conference ${suffix}`;
    const shortName = `e2e-mod-${suffix}`;

    const conference = await createConference(api, organizerToken, {
      title,
      short_name: shortName,
      description: 'Moderation lifecycle check',
    });
    expect(conference.status).toBe('draft');

    const submitRes = await api.post(`${API_BASE}/conferences/${conference.id}/submit-for-approval`, {
      headers: authHeaders(organizerToken),
      data: { comment: 'Ready for moderation' },
    });
    expect(submitRes.ok()).toBeTruthy();
    expect((await submitRes.json()).status).toBe('pending_approval');

    await loginAs(page, 'admin');
    await page.goto('/admin');

    const moderationItem = page.locator('li').filter({ hasText: title }).first();
    await expect(moderationItem).toBeVisible();
    await moderationItem.getByRole('button', { name: 'Принять' }).click();
    await expect(page.getByText(/конференция одобрена/i)).toBeVisible();

    await page.getByRole('tab', { name: 'Аудит' }).click();
    await expect(page.getByText(/модерация: принято/i).first()).toBeVisible();

    const approvedRes = await browserRequest.get(`${API_BASE}/conferences/by-short-name/${shortName}`);
    expect(approvedRes.ok()).toBeTruthy();
    expect((await approvedRes.json()).status).toBe('submission_open');
  });
});
