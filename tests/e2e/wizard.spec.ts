import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { expect, test, type Page } from '@playwright/test';
import { pickBookableDay } from './helpers';

try {
  process.loadEnvFile('.env.local');
} catch {
  // No local env file: the suite below skips itself.
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = 'e2e-test-password';
const DRAFT_KEY = 'event-planner:draft:v1';

const option = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

const continueButton = (page: Page) => page.getByRole('button', { name: 'Continue' });

async function pickDateAndTime(page: Page) {
  await pickBookableDay(page);
  await page.getByLabel('Start time').selectOption('18:30');
  await page.getByLabel('End time').selectOption({ label: '01:00 (next day)' });
  await continueButton(page).click();
}

const budgetSlider = (page: Page) => page.getByRole('slider', { name: 'Your budget' });

async function pickWine(page: Page, name: RegExp, glass: string, bottles: number) {
  await page.getByRole('button', { name }).click();
  const label = name.source;
  await page.getByLabel(new RegExp(`${label}: how to pour it`)).selectOption({ label: glass });
  await page.getByLabel(new RegExp(`${label}: bottles`)).fill(String(bottles));
}

async function setBudget(page: Page, pounds: number) {
  await budgetSlider(page).fill(String(pounds * 100));
  await continueButton(page).click();
}

async function answerUpToBudget(page: Page) {
  await page.goto('/');
  await page.getByRole('link', { name: 'Let’s start planning' }).click();
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

  await expect(page).toHaveURL(/\/plan\/package-wine-only/);
  await page.getByRole('tab', { name: 'Wine', exact: true }).click();
  await pickWine(page, /House Red/, '5 glasses of 150 ml', 10);
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
  await pickBookableDay(page);
  await page.getByLabel('Start time').selectOption('18:30');
  await expect(continueButton(page)).toBeDisabled();
  await page.getByLabel('End time').selectOption('20:00');
  await expect(continueButton(page)).toBeEnabled();
});

test('days less than a month away can be seen but not picked', async ({ page }) => {
  await page.goto('/plan');
  await option(page, 'Birthday').click();
  await expect(page.getByText(/We can plan events from .*, one month from today\./)).toBeVisible();
  // Today is in the month on show, and every day of it before next month is disabled.
  const todayButton = page.locator('[data-today] button');
  await expect(todayButton).toBeDisabled();
});

test('party size is a choice of bands that moves on at a tap', async ({ page }) => {
  await page.goto('/plan');
  await option(page, 'Wedding').click();
  await pickDateAndTime(page);
  for (const band of [
    'From 10 to 20',
    'From 20 to 40',
    'From 40 to 60',
    'From 60 to 80',
    'Up to 100',
  ]) {
    await expect(option(page, band)).toBeVisible();
  }
  await option(page, 'From 60 to 80').click();
  await expect(page).toHaveURL(/\/plan\/food/);
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

test('menus, drinks packages and service times follow the choices', async ({ page }) => {
  await page.goto('/plan');
  await option(page, 'Birthday').click();
  await pickDateAndTime(page);
  await option(page, 'From 10 to 20').click();

  await option(page, 'Brunch').click();
  await option(page, 'I bring my own food').click();
  await page.getByLabel('What will you bring? (optional)').fill('A birthday cake');
  await continueButton(page).click();

  await expect(page).toHaveURL(/\/plan\/menu-brunch/);
  await expect(page.getByRole('heading', { name: 'Choose your brunch menu' })).toBeVisible();
  // Each menu reads like a restaurant menu, with its dishes in full.
  await expect(page.getByText('Eggs Benedict with honey-glazed ham')).toBeVisible();
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
  await option(page, '2 cocktails per person').click();
  await expect(page).toHaveURL(/\/plan\/package-wine-only/);
  await expect(continueButton(page)).toBeDisabled();
  await pickWine(page, /Prosecco Extra Dry/, '3 glasses of 250 ml', 12);
  await page.getByRole('tab', { name: 'Wine', exact: true }).click();
  await pickWine(page, /Rioja Reserva/, '4 glasses of 175 ml', 6);
  await expect(page.getByText('2 wines chosen')).toBeVisible();
  await continueButton(page).click();

  await expect(page).toHaveURL(/\/plan\/entertainment/);
  await option(page, 'DJ').click();
  await option(page, 'Live music').click();
  // The second act starts where the first ends, so they never overlap by default.
  await expect(page.getByLabel('DJ: end time')).toHaveValue('21:30');
  await expect(page.getByLabel('Live music: start time')).toHaveValue('21:30');
  await page.getByLabel('DJ: end time').selectOption({ label: '23:00' });
  await expect(page.getByRole('main').getByRole('alert')).toContainText('take turns');
  await expect(continueButton(page)).toBeDisabled();
  await page.getByLabel('DJ: end time').selectOption({ label: '21:30' });
  await expect(continueButton(page)).toBeEnabled();
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
  expect(draft.drinks.packages).toEqual({ 'cocktails-spirits-only': 'two-cocktails' });
  expect(draft.drinks.wineBottles).toEqual([
    { product: 'prosecco-extra-dry', glass: 'glass-250', quantity: 12 },
    { product: 'rioja-reserva', glass: 'glass-175', quantity: 6 },
  ]);
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
  await option(page, 'From 20 to 40').click();
  await option(page, 'Dinner').click();
  await continueButton(page).click();
  await option(page, 'Private sommelier').click();
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
    // The estimate is a magazine: the cover, the event, then the numbers.
    await expect(page.getByRole('article', { name: 'Magazine cover' })).toBeVisible();
    await page.getByRole('button', { name: 'Turn the page' }).click();
    await expect(page.getByText('10 × House Red (5 glasses of 150 ml)')).toBeVisible();
    await page.getByRole('button', { name: 'Turn the page' }).click();
    await expect(page.getByText('£3,200 - £7,360')).toBeVisible();

    const id = await draftId(page);
    requestIds.push(id);
    const { data: row } = await admin.from('event_requests').select('*').eq('id', id).single();
    expect(row.status).toBe('estimated');
    expect(row.account_id).toBeNull();
    expect(row.payload.event.endTime).toBe('01:00');
    expect(row.payload.event.endsNextDay).toBe(true);
    expect(row.payload.schemaVersion).toBe(3);
    expect(row.payload.event.partySize).toBe('size-40-60');
    expect(row.payload.event.budget).toBe(500_000);
    expect(row.payload.event.drinks.wineBottles).toEqual([
      { product: 'house-red', glass: 'glass-150', quantity: 10 },
    ]);
    expect(row.payload.estimate.bottleLines[0]).toMatchObject({
      quantityLow: 10,
      amountLow: 16_000,
    });
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
    await expect(page).toHaveURL(/\/$/);

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
