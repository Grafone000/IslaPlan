import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { expect, test, type Page } from '@playwright/test';

// Runs against the Supabase project in .env.local. Test users are created through the admin
// API, which sends no email, and everything is removed at the end.
try {
  process.loadEnvFile('.env.local');
} catch {
  // No local env file: the suite below skips itself.
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const configured = Boolean(url && anonKey && serviceKey);

const PASSWORD = 'e2e-test-password';

const contact = {
  firstName: 'Test',
  lastName: 'User',
  email: 'placeholder@example.com',
  phone: '07700900000',
};

const event = {
  type: 'wedding',
  typeNote: null,
  date: '2027-05-14',
  startTime: '18:30',
  endTime: '23:00',
  endsNextDay: false,
  partySize: 'size-40-60',
  food: ['dinner'],
  drinks: ['wine-only'],
  entertainment: { items: ['dj'], activitiesPreference: null },
  decorations: { items: ['flowers'], note: null },
  additionalInfo: '',
  budget: '2500-5000',
};

test.describe('with Supabase', () => {
  test.skip(!configured, 'Supabase is not configured');
  test.describe.configure({ mode: 'serial' });

  let admin: SupabaseClient;
  let email: string;
  let userId: string;
  const requestIds: string[] = [];
  const extraUserIds: string[] = [];

  test.beforeAll(async ({}, testInfo) => {
    admin = createClient(url as string, serviceKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    email = `e2e-${testInfo.project.name}-${Date.now()}@example.com`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { first_name: 'Test', last_name: 'User', phone: contact.phone },
    });
    if (error) throw error;
    userId = data.user.id;
  });

  test.afterAll(async () => {
    if (requestIds.length > 0) {
      await admin.from('event_requests').delete().in('id', requestIds);
    }
    for (const id of [userId, ...extraUserIds]) {
      if (id) await admin.auth.admin.deleteUser(id);
    }
  });

  async function logIn(page: Page, password = PASSWORD) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.locator('form').getByRole('button', { name: 'Log in' }).click();
  }

  const nav = (page: Page) => page.getByRole('navigation', { name: 'Main' });

  test('a wrong password shows a friendly error', async ({ page }) => {
    await logIn(page, 'wrong-password');
    await expect(page.locator('form').getByRole('alert')).toHaveText(
      'That email and password do not match.',
    );
    await expect(page).toHaveURL(/\/login/);
  });

  test('logging in returns to the Home, and logging out works', async ({ page }) => {
    await logIn(page);
    await expect(page).toHaveURL(/\/$/);
    await expect(nav(page).getByRole('link', { name: 'My area' })).toBeVisible();

    await nav(page).getByRole('button', { name: 'Log out' }).click();
    await expect(nav(page).getByRole('link', { name: 'Log in' })).toBeVisible();

    await page.reload();
    await expect(nav(page).getByRole('link', { name: 'Log in' })).toBeVisible();
  });

  test('the private area lets a logged-in user through', async ({ page }) => {
    await logIn(page);
    await expect(nav(page).getByRole('link', { name: 'My area' })).toBeVisible();
    await page.goto('/account');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('creating an account from the form builds the profile', async ({ page }, testInfo) => {
    const settings = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: anonKey as string },
    }).then((response) => response.json());
    test.skip(!settings.mailer_autoconfirm, 'Would send a real email: confirmation is still on');

    const newEmail = `e2e-signup-${testInfo.project.name}-${Date.now()}@example.com`;
    await page.goto('/login');
    await page.getByRole('tab', { name: 'Create account' }).click();
    await page.getByLabel('First name').fill('Sign');
    await page.getByLabel('Last name').fill('Up');
    await page.getByLabel('Email').fill(newEmail);
    await page.getByLabel('Phone').fill(contact.phone);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.locator('form').getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(nav(page).getByRole('link', { name: 'My area' })).toBeVisible();

    const { data } = await admin.auth.admin.listUsers();
    const created = data.users.find((user) => user.email === newEmail);
    extraUserIds.push(created?.id as string);
    const { data: profile } = await admin
      .from('profiles')
      .select('first_name, last_name, phone')
      .eq('id', created?.id)
      .single();
    expect(profile).toEqual({ first_name: 'Sign', last_name: 'Up', phone: contact.phone });
  });

  test('a request is stored, recalculated by the server and tied to the account', async ({
    page,
    playwright,
    baseURL,
  }) => {
    await logIn(page);
    await expect(nav(page).getByRole('link', { name: 'My area' })).toBeVisible();

    const id = crypto.randomUUID();
    requestIds.push(id);
    const created = await page.request.post('/api/requests', {
      data: {
        id,
        contact: { ...contact, email },
        event,
        status: 'deposit-paid',
        accountId: 'someone-else',
        estimate: { midpoint: 1, depositAmount: 1 },
      },
    });
    expect(created.status()).toBe(201);

    const { data: row } = await admin.from('event_requests').select('*').eq('id', id).single();
    expect(row.status).toBe('estimated');
    expect(row.account_id).toBe(userId);
    expect(row.contact_email).toBe(email);
    expect(row.event_date).toBe('2027-05-14');
    expect(row.payload.estimate.totalLow).toBe(336_000);
    expect(row.payload.estimate.totalHigh).toBe(900_000);
    expect(row.payload.estimate.depositAmount).toBe(123_600);

    const notYet = await page.request.patch(`/api/requests/${id}`, { data: { type: 'proceed' } });
    expect(notYet.status()).toBe(409);

    const stranger = await playwright.request.newContext({ baseURL });
    const hidden = await stranger.patch(`/api/requests/${id}`, {
      data: { type: 'accept-estimate' },
    });
    expect(hidden.status()).toBe(404);
    await stranger.dispose();

    const accepted = await page.request.patch(`/api/requests/${id}`, {
      data: { type: 'accept-estimate' },
    });
    expect(accepted.status()).toBe(200);

    const { data: updated } = await admin
      .from('event_requests')
      .select('status, revision, payload')
      .eq('id', id)
      .single();
    expect(updated?.status).toBe('accepted');
    expect(updated?.revision).toBe(row.revision + 1);
    expect(updated?.payload.decisions.estimateAccepted).toBe(true);
  });

  test('a guest request is stored with no account', async ({ playwright, baseURL }) => {
    const guest = await playwright.request.newContext({ baseURL });
    const id = crypto.randomUUID();
    requestIds.push(id);
    const created = await guest.post('/api/requests', { data: { id, contact, event } });
    expect(created.status()).toBe(201);

    const declined = await guest.patch(`/api/requests/${id}`, {
      data: { type: 'reject-estimate' },
    });
    expect(declined.status()).toBe(200);
    await guest.dispose();

    const { data: row } = await admin
      .from('event_requests')
      .select('status, account_id')
      .eq('id', id)
      .single();
    expect(row).toEqual({ status: 'revising', account_id: null });
  });
});
