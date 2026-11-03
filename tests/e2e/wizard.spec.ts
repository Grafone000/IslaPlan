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

const guestsSlider = (page: Page) => page.getByRole('slider', { name: 'Number of guests' });
const budgetSlider = (page: Page) => page.getByRole('slider', { name: 'Your budget' });

async function setGuests(page: Page, guests: number) {
  await guestsSlider(page).fill(String(guests));
  await continueButton(page).click();
}

async function setBudget(page: Page, pounds: number) {
  await budgetSlider(page).fill(String(pounds * 100));
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
  await setGuests(page, 50);

  await expect(page).toHaveURL(/\/plan\/food/);
  await option(page, 'Dinner').click();
  await continueButton(page).click();

  await expect(page).toHaveURL(/\/plan\/drinks/);
  await option(page, 'Wine only').click();
  await continueButton(page).click();

  await expect(page).toHaveURL(/\/plan\/package-wine-only/);
  await option(page, 'Wine, 175 ml glass').click();

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
  await setGuests(page, 15);

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
  await setGuests(page, 33);
  await expect(page).toHaveURL(/\/plan\/food/);

  await page.reload();
  await expect(page).toHaveURL(/\/plan\/food/);
  await expect(page.getByRole('heading', { name: 'Food' })).toBeVisible();

  await page.getByRole('link', { name: 'Back' }).click();
  await expect(page).toHaveURL(/\/plan\/party-size/);
  await expect(guestsSlider(page)).toHaveValue('33');

  await page.goBack();
  await expect(page).toHaveURL(/\/plan\/food/);

  await page.goto('/plan');
  await expect(page).toHaveURL(/\/plan\/food/);
});

test('menus, drinks packages and service times follow the choices', async ({ page }) => {
  await page.goto('/plan');
  await option(page, 'Birthday').click();
  await pickDateAndTime(page);
  await setGuests(page, 20);

  await option(page, 'Brunch').click();
  await option(page, 'I bring my own food').click();
  await page.getByLabel('What will you bring? (optional)').fill('A birthday cake');
  await continueButton(page).click();

  await expect(page).toHaveURL(/\/plan\/menu-brunch/);
  await expect(page.getByRole('heading', { name: 'Choose your brunch menu' })).toBeVisible();
  await page.getByRole('button', { name: /Maple & Rye/ }).click();

  await expect(page).toHaveURL(/\/plan\/drinks/);
  await option(page, 'Cocktails/spirits only').click();
  await option(page, 'Wine only').click();
  await option(page, 'Private bartender').click();
  // The bartender card opens with the hours of the event, and they can be narrowed.
  await expect(page.getByLabel('Private bartender: start time')).toHaveValue('18:30');
  await page.getByLabel('Private bartender: end time').selectOption({ label: '23:00' });
  await continueButton(page).click();

  await expect(page).toHaveURL(/\/plan\/package-cocktails-spirits-only/);
  await option(page, '2 cocktails per person, or ½ bottle of wine each').click();
  await expect(page).toHaveURL(/\/plan\/package-wine-only/);
  await option(page, 'Prosecco/Champagne, 6 glasses').click();

  await expect(page).toHaveURL(/\/plan\/entertainment/);
  await option(page, 'Live music').click();
  await expect(page.getByLabel('Live music: end time')).toBeVisible();
  await option(page, 'Activities | share your preference').click();
  await expect(page.getByLabel('Share your preference')).toBeVisible();

  const draft = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) as string).event,
    DRAFT_KEY,
  );
  expect(draft.food).toEqual({
    items: ['brunch', 'own-food'],
    menus: { brunch: 'maple-and-rye' },
    ownFoodNote: 'A birthday cake',
  });
  expect(draft.drinks.packages).toEqual({
    'cocktails-spirits-only': 'two-cocktails-or-half-bottle',
    'wine-only': 'prosecco-champagne-6-glasses',
  });
  expect(draft.drinks.times['private-bartender']).toEqual({
    startTime: '18:30',
    startsNextDay: false,
    endTime: '23:00',
    endsNextDay: false,
  });
});

test('the budget slider moves in steps of £50 and tops out at "or more"', async ({ page }) => {
  await page.goto('/plan');
  await option(page, 'Wedding').click();
  await pickDateAndTime(page);
  await setGuests(page, 40);
  await option(page, 'Dinner').click();
  await continueButton(page).click();
  await option(page, 'Wine tasting').click();
  await continueButton(page).click();
  await page.getByRole('button', { name: 'Skip this step' }).click();
  await page.getByRole('button', { name: 'Skip this step' }).click();
  await page.getByRole('button', { name: 'Skip this step' }).click();

  await expect(page).toHaveURL(/\/plan\/budget/);
  const slider = budgetSlider(page);
  await expect(slider).toHaveAttribute('step', '5000');
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveAttribute('aria-valuetext', '£2,550');
  await slider.fill('2000000');
  await expect(slider).toHaveAttribute('aria-valuetext', '£20,000 or more');
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
    await setBudget(page, 5000);

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
    await expect(page.getByText('£4,500 - £7,250')).toBeVisible();

    const id = await draftId(page);
    requestIds.push(id);
    const { data: row } = await admin.from('event_requests').select('*').eq('id', id).single();
    expect(row.status).toBe('estimated');
    expect(row.account_id).toBeNull();
    expect(row.payload.event.endTime).toBe('01:00');
    expect(row.payload.event.endsNextDay).toBe(true);
    expect(row.payload.estimate.depositAmount).toBe(117_500);
    expect(row.payload.schemaVersion).toBe(2);
    expect(row.payload.event.guests).toBe(50);
    expect(row.payload.event.budget).toBe(500_000);
    expect(row.payload.event.drinks.packages).toEqual({ 'wine-only': 'wine-175ml' });
    expect(row.payload.event.entertainment.times.dj).toEqual({
      startTime: '18:30',
      startsNextDay: false,
      endTime: '01:00',
      endsNextDay: true,
    });
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
    await expect(page.getByText('Step 10 of 10')).toBeVisible();
    await setBudget(page, 5000);

    await expect(page).toHaveURL(/\/plan\/estimate/);
    const id = await draftId(page);
    requestIds.push(id);
    const { data: row } = await admin.from('event_requests').select('*').eq('id', id).single();
    expect(row.account_id).toBe(data.user.id);
    expect(row.contact_email).toBe(email);
    expect(row.payload.contact.firstName).toBe('Logged');
  });
});
