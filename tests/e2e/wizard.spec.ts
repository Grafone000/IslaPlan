import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { expect, test, type Page } from '@playwright/test';

try {
  process.loadEnvFile('.env.local');
} catch {
  // No local env file: the suite below skips itself.
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = 'e2e-test-password';
const DRAFT_KEY = 'event-planner:draft:v1';

const option = (page: Page, name: string) =>
  page.getByRole('button', { name, exact: true });

const continueButton = (page: Page) => page.getByRole('button', { name: 'Continue' });

async function pickDateAndTime(page: Page) {
  await page.getByRole('button', { name: /next month/i }).click();
  await page.locator('[data-day]:not([data-outside]) button').nth(14).click();
  await page.getByLabel('Start time').selectOption('18:30');
  await page.getByLabel('End time').selectOption({ label: '01:00 (next day)' });
  await continueButton(page).click();
}

async function answerUpToBudget(page: Page) {
  await page.goto('/');
  await page.getByRole('link', { name: 'Book your event' }).first().click();
  await expect(page).toHaveURL(/\/plan\/event-type/);

  await option(page, 'Wedding').click();
  await expect(page).toHaveURL(/\/plan\/date-time/);
  await pickDateAndTime(page);

  await expect(page).toHaveURL(/\/plan\/party-size/);
  await option(page, 'From 40 to 60').click();

  await expect(page).toHaveURL(/\/plan\/food/);
  await option(page, 'Dinner').click();
  await continueButton(page).click();

  await expect(page).toHaveURL(/\/plan\/drinks/);
  await option(page, 'Wine only').click();
  await continueButton(page).click();

  await expect(page).toHaveURL(/\/plan\/entertainment/);
  await option(page, 'DJ').click();
  await continueButton(page).click();

  await expect(page).toHaveURL(/\/plan\/decorations/);
  await option(page, 'Flowers').click();
  await continueButton(page).click();

  await expect(page).toHaveURL(/\/plan\/additional-info/);
  await page.getByRole('button', { name: 'Skip this step' }).click();

  await expect(page).toHaveURL(/\/plan\/budget/);
}

const draftId = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) as string).id as string, DRAFT_KEY);

test('a step cannot be reached by skipping ahead', async ({ page }) => {
  await page.goto('/plan/budget');
  await expect(page).toHaveURL(/\/plan\/event-type/);
});

test('an unknown step shows the not found page', async ({ page }) => {
  await page.goto('/plan/not-a-step');
  await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
});

test('date and time need a start and an end', async ({ page }) => {
  await page.goto('/plan');
  await option(page, 'Birthday').click();
  await expect(continueButton(page)).toBeDisabled();
  await page.getByRole('button', { name: /next month/i }).click();
  await page.locator('[data-day]:not([data-outside]) button').nth(14).click();
  await page.getByLabel('Start time').selectOption('18:30');
  await expect(continueButton(page)).toBeDisabled();
  await page.getByLabel('End time').selectOption('20:00');
  await expect(continueButton(page)).toBeEnabled();
});

test('picking Private chef removes Dinner and says why', async ({ page }) => {
  await page.goto('/plan');
  await option(page, 'Wedding').click();
  await pickDateAndTime(page);
  await option(page, 'From 10 to 20').click();

  await option(page, 'Dinner').click();
  await option(page, 'Private chef').click();
  await expect(option(page, 'Dinner')).toHaveAttribute('aria-pressed', 'false');
  await expect(option(page, 'Private chef')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('main').getByRole('status')).toContainText(
    "Dinner can't be combined with Private chef",
  );
});

test('answers survive a reload and going back', async ({ page }) => {
  await page.goto('/plan');
  await option(page, 'Graduation').click();
  await pickDateAndTime(page);
  await option(page, 'From 20 to 40').click();
  await expect(page).toHaveURL(/\/plan\/food/);

  await page.reload();
  await expect(page).toHaveURL(/\/plan\/food/);
  await expect(page.getByRole('heading', { name: 'Food' })).toBeVisible();

  await page.getByRole('link', { name: 'Back' }).click();
  await expect(page).toHaveURL(/\/plan\/party-size/);
  await expect(option(page, 'From 20 to 40')).toHaveAttribute('aria-pressed', 'true');

  await page.goBack();
  await expect(page).toHaveURL(/\/plan\/food/);

  await page.goto('/plan');
  await expect(page).toHaveURL(/\/plan\/food/);
});

test('steps have no horizontal scroll', async ({ page }) => {
  await page.goto('/plan');
  await option(page, 'Wedding').click();
  await expect(page).toHaveURL(/\/plan\/date-time/);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test.describe('with Supabase', () => {
  test.skip(!url || !serviceKey, 'Supabase is not configured');
  test.describe.configure({ mode: 'serial' });

  let admin: SupabaseClient;
  const requestIds: string[] = [];
  const userIds: string[] = [];

  test.beforeAll(() => {
    admin = createClient(url as string, serviceKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  });

  test.afterAll(async () => {
    if (requestIds.length > 0) {
      await admin.from('event_requests').delete().in('id', requestIds);
    }
    for (const id of userIds) {
      await admin.auth.admin.deleteUser(id);
    }
  });

  test('a guest reaches the estimate and the request is saved', async ({ page }) => {
    await answerUpToBudget(page);
    await option(page, '£2,500-£5,000').click();

    await expect(page).toHaveURL(/\/plan\/contact/);
    await page.getByRole('button', { name: 'See my estimate' }).click();
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      'Please fill in every field.',
    );

    await page.getByLabel('First name').fill('Guest');
    await page.getByLabel('Last name').fill('Client');
    await page.getByLabel('Email').fill('guest-e2e@example.com');
    await page.getByLabel('Phone').fill('07700900000');
    await page.getByRole('button', { name: 'See my estimate' }).click();

    await expect(page).toHaveURL(/\/plan\/estimate/);
    await expect(page.getByText('£3,360 - £9,000')).toBeVisible();

    const id = await draftId(page);
    requestIds.push(id);
    const { data: row } = await admin.from('event_requests').select('*').eq('id', id).single();
    expect(row.status).toBe('estimated');
    expect(row.account_id).toBeNull();
    expect(row.payload.event.endTime).toBe('01:00');
    expect(row.payload.event.endsNextDay).toBe(true);
    expect(row.payload.estimate.depositAmount).toBe(123_600);
  });

  test('a logged-in client skips the contact step', async ({ page }, testInfo) => {
    const email = `e2e-wizard-${testInfo.project.name}-${Date.now()}@example.com`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { first_name: 'Logged', last_name: 'In', phone: '07700900000' },
    });
    if (error) throw error;
    userIds.push(data.user.id);

    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.locator('form').getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByRole('link', { name: 'My area' })).toBeVisible();

    await answerUpToBudget(page);
    await expect(page.getByText('Step 9 of 9')).toBeVisible();
    await option(page, '£2,500-£5,000').click();

    await expect(page).toHaveURL(/\/plan\/estimate/);
    const id = await draftId(page);
    requestIds.push(id);
    const { data: row } = await admin.from('event_requests').select('*').eq('id', id).single();
    expect(row.account_id).toBe(data.user.id);
    expect(row.contact_email).toBe(email);
    expect(row.payload.contact.firstName).toBe('Logged');
  });
});
