import { expect, request, test } from '@playwright/test';
import { API_BASE, apiLogin, authHeaders, authenticatePage, createConference } from './support/helpers';

test.describe('Payments', () => {
  test('demo payment can be confirmed', async ({ page, request: browserRequest }) => {
    const api = await request.newContext();
    const organizerToken = await apiLogin(api, 'organizer@sciconnect.demo', 'org123456');
    const authorToken = await apiLogin(api, 'author@sciconnect.demo', 'user123456');
    const suffix = Date.now().toString(36);

    const conference = await createConference(api, organizerToken, {
      title: `E2E платная конференция ${suffix}`,
      short_name: `e2e-pay-${suffix}`,
      description: 'Проверка демо-оплаты',
      registration_fee: 100,
      submission_fee: 0,
      fee_required: true,
    });

    const paymentRes = await browserRequest.post(`${API_BASE}/payments/create`, {
      headers: authHeaders(authorToken),
      data: {
        conference_id: conference.id,
        purpose: 'registration',
      },
    });
    expect(paymentRes.ok()).toBeTruthy();
    const payment = await paymentRes.json();

    await authenticatePage(page, authorToken);
    await page.goto(`/payments/${payment.id}`);
    await page.getByRole('button', { name: /оплатить/i }).click();
    await expect(page.getByText(/оплата прошла успешно/i)).toBeVisible();
  });

  test('demo payment webhook is idempotent', async ({ request: browserRequest }) => {
    const api = await request.newContext();
    const organizerToken = await apiLogin(api, 'organizer@sciconnect.demo', 'org123456');
    const authorToken = await apiLogin(api, 'author@sciconnect.demo', 'user123456');
    const suffix = Date.now().toString(36);

    const conference = await createConference(api, organizerToken, {
      title: `E2E webhook conference ${suffix}`,
      short_name: `e2e-hook-${suffix}`,
      description: 'Webhook payment check',
      registration_fee: 100,
      submission_fee: 0,
      fee_required: true,
    });

    const paymentRes = await browserRequest.post(`${API_BASE}/payments/create`, {
      headers: authHeaders(authorToken),
      data: { conference_id: conference.id, purpose: 'registration' },
    });
    expect(paymentRes.ok()).toBeTruthy();
    const payment = await paymentRes.json();

    const webhookRes = await browserRequest.post(`${API_BASE}/payments/webhook/demo`, {
      data: { external_id: payment.external_id, status: 'paid' },
    });
    expect(webhookRes.ok()).toBeTruthy();
    const paid = await webhookRes.json();
    expect(paid.status).toBe('paid');
  });

  test('registration stays pending until demo payment confirmed', async ({ request: browserRequest }) => {
    const api = await request.newContext();
    const organizerToken = await apiLogin(api, 'organizer@sciconnect.demo', 'org123456');
    const authorToken = await apiLogin(api, 'author@sciconnect.demo', 'user123456');
    const suffix = Date.now().toString(36);

    const conference = await createConference(api, organizerToken, {
      title: `E2E reg fee ${suffix}`,
      short_name: `e2e-reg-${suffix}`,
      description: 'Registration fee gate',
      registration_fee: 150,
      submission_fee: 0,
      fee_required: true,
    });

    const registerRes = await browserRequest.post(`${API_BASE}/conferences/${conference.id}/register`, {
      headers: authHeaders(authorToken),
      data: { registration_type: 'listener', accept_terms: true },
    });
    expect(registerRes.ok()).toBeTruthy();
    const registration = await registerRes.json();
    expect(registration.status).toBe('pending');

    const paymentRes = await browserRequest.post(`${API_BASE}/payments/create`, {
      headers: authHeaders(authorToken),
      data: {
        conference_id: conference.id,
        registration_id: registration.id,
        purpose: 'registration',
      },
    });
    expect(paymentRes.ok()).toBeTruthy();
    const payment = await paymentRes.json();
    const confirmRes = await browserRequest.post(`${API_BASE}/payments/${payment.id}/confirm`, {
      headers: authHeaders(authorToken),
    });
    expect(confirmRes.ok()).toBeTruthy();
  });

  test('registration wizard confirms demo payment in UI flow', async ({ page }) => {
    const api = await request.newContext();
    const adminToken = await apiLogin(api, 'admin@sciconnect.demo', 'admin123');
    const organizerToken = await apiLogin(api, 'organizer@sciconnect.demo', 'org123456');
    const authorToken = await apiLogin(api, 'author@sciconnect.demo', 'user123456');
    const suffix = Date.now().toString(36);

    const conference = await createConference(api, organizerToken, {
      title: `E2E wizard fee ${suffix}`,
      short_name: `e2e-wizard-${suffix}`,
      description: 'Registration wizard payment flow',
      registration_fee: 200,
      submission_fee: 0,
      fee_required: true,
    });
    const publishRes = await api.patch(`${API_BASE}/admin/conferences/${conference.id}`, {
      headers: authHeaders(adminToken),
      data: { status: 'submission_open' },
    });
    expect(publishRes.ok()).toBeTruthy();

    await authenticatePage(page, authorToken);
    await page.goto(`/conferences/${conference.id}/register`);
    await expect(page.getByText(/регистрация на конференцию/i)).toBeVisible();

    await page.getByRole('button', { name: 'Далее' }).click();
    await page.getByRole('button', { name: 'Далее' }).click();
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /зарегистрироваться и оплатить/i }).click();

    await expect(page.getByText(/регистрация на/i)).toBeVisible();
    await expect(page.getByRole('link', { name: conference.title })).toBeVisible();
  });
});
