import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { expect, test, type Page } from '@playwright/test';

// Starts each test at the estimate: the wizard itself is covered in wizard.spec.ts.
try {
  process.loadEnvFile('.env.local');
} catch {
  // No local env file: the suite below skips itself.
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRAFT_KEY = 'event-planner:draft:v1';

const contact = {
  firstName: 'Estimate',
  lastName: 'Test',
  email: 'estimate-e2e@example.com',
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
  food: { items: ['dinner'], menus: {}, ownFoodNote: null },
  drinks: {
    items: ['wine-only'],
    packages: {},
    drinksAllBottle: null,
    wineBottles: [{ product: 'house-red', glass: 'glass-150', quantity: 10 }],
    times: {},
    ownDrinksNote: null,
  },
  entertainment: {
    items: ['dj'],
    times: {
      dj: { startTime: '18:30', startsNextDay: false, endTime: '23:00', endsNextDay: false },
    },
    activitiesPreference: null,
  },
  decorations: { items: ['flowers'], note: null },
  additionalInfo: '',
  budget: 500_000,
};

test.describe('after the estimate', () => {
  test.skip(!url || !serviceKey, 'Supabase is not configured');

  let admin: SupabaseClient;

  test.beforeAll(() => {
    admin = createClient(url as string, serviceKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  });

  async function openEstimate(page: Page, overrides: Partial<typeof event> = {}) {
    const id = crypto.randomUUID();
    const finalEvent = { ...event, ...overrides };
    const created = await page.request.post('/api/requests', {
      data: { id, contact, event: finalEvent },
    });
    expect(created.status()).toBe(201);
    const { request } = await created.json();

    await page.goto('/');
    await page.evaluate(
      ([key, draft]) => localStorage.setItem(key as string, JSON.stringify(draft)),
      [
        DRAFT_KEY,
        { draftVersion: 3, id, event: finalEvent, contact, furthest: 'contact', request },
      ],
    );
    await page.goto('/plan/estimate');
    // The first look opens on the magazine cover: turn to the numbers.
    await page.getByRole('button', { name: 'Turn the page' }).click();
    await page.getByRole('button', { name: 'Turn the page' }).click();
    return id;
  }

  const answer = (page: Page, question: string, choice: 'Yes' | 'No') =>
    page
      .locator('section', { has: page.getByRole('heading', { name: question }) })
      .getByRole('button', { name: choice, exact: true })
      .click();

  async function savedRow(id: string, status: string) {
    await expect
      .poll(async () => {
        const { data } = await admin.from('event_requests').select('status').eq('id', id).single();
        return data?.status;
      })
      .toBe(status);
    const { data } = await admin.from('event_requests').select('payload').eq('id', id).single();
    return data?.payload;
  }

  test('shows the indicative estimate and what was chosen', async ({ page }) => {
    await openEstimate(page);
    await expect(page.getByText('£3,200 - £7,360')).toBeVisible();
    await expect(page.getByText(/indicative estimate/)).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: 'Dinner' })).toBeVisible();
  });

  test('rejecting the estimate helps the client lower it', async ({ page }) => {
    const id = await openEstimate(page);
    await answer(page, 'Are you happy with this estimate?', 'No');

    await expect(page).toHaveURL(/\/plan\/revise/);
    await expect(page.getByText('£3,550 (67%)')).toBeVisible();
    await expect(page.getByText('Plan for 20 to 40 guests')).toBeVisible();
    await expect(page.getByText('Switch Dinner to Brunch')).toBeVisible();
    await expect(page.getByText('Saves about £1,450')).toBeVisible();
    await expect(page.getByText(/about £280 above your budget of £5,000/)).toBeVisible();
    await savedRow(id, 'revising');

    await page.getByRole('link', { name: 'Change this: Switch Dinner to Brunch' }).click();
    await expect(page).toHaveURL(/\/plan\/food\?return=estimate/);
    await page.getByRole('button', { name: 'Dinner', exact: true }).click();
    await page.getByRole('button', { name: 'Brunch', exact: true }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Brunch has menus, so its menu is asked before going back to the estimate.
    await expect(page).toHaveURL(/\/plan\/menu-brunch\?return=estimate/);
    await page.getByRole('button', { name: /The Sunday Table/ }).click();

    await expect(page).toHaveURL(/\/plan\/estimate/);
    // Back from a change, the magazine opens straight on the numbers.
    await expect(page.getByText('£2,400 - £5,260')).toBeVisible();
    await expect(page.getByText(': The Sunday Table')).toBeVisible();
    const payload = await savedRow(id, 'estimated');
    expect(payload.estimate.midpoint).toBe(383_000);
    expect(payload.event.food.menus).toEqual({ brunch: 'sunday-table' });
    expect(payload.estimateHistory).toHaveLength(1);

    await answer(page, 'Are you happy with this estimate?', 'Yes');
    await savedRow(id, 'accepted');
    await expect(page.getByText('Would you like a phone consultation?')).toBeVisible();
  });

  test('a rejected estimate can still be kept', async ({ page }) => {
    const id = await openEstimate(page);
    await answer(page, 'Are you happy with this estimate?', 'No');
    await page.getByRole('button', { name: 'Keep this estimate' }).click();
    await expect(page).toHaveURL(/\/plan\/estimate/);
    await expect(page.getByText('Are you happy with this estimate?')).toBeVisible();
    await savedRow(id, 'estimated');
  });

  test('stopping at the revision closes the request politely', async ({ page }) => {
    const id = await openEstimate(page);
    await answer(page, 'Are you happy with this estimate?', 'No');
    await page.getByRole('button', { name: 'No thanks, I would rather stop here' }).click();

    await expect(page).toHaveURL(/\/plan\/outcome/);
    await expect(page.getByText(/Thank you for considering us/)).toBeVisible();
    const payload = await savedRow(id, 'declined');
    expect(payload.decisions.declinedAt).toBe('estimate');
  });

  test('no consultation still asks to proceed, and no closes politely', async ({ page }) => {
    const id = await openEstimate(page);
    await answer(page, 'Are you happy with this estimate?', 'Yes');
    await answer(page, 'Would you like a phone consultation?', 'No');
    await answer(page, 'Would you like to proceed?', 'No');

    await expect(page).toHaveURL(/\/plan\/outcome/);
    await expect(page.getByText(/No problem at all/)).toBeVisible();
    const payload = await savedRow(id, 'declined');
    expect(payload.decisions.declinedAt).toBe('proceed');
    expect(payload.decisions.consultationWanted).toBe(false);
  });

  test('a consultation shows the details and stays after a call', async ({ page }) => {
    const id = await openEstimate(page);
    await answer(page, 'Are you happy with this estimate?', 'Yes');
    await answer(page, 'Would you like a phone consultation?', 'Yes');

    await expect(page.getByText('ilaria@grafone.com')).toBeVisible();
    await expect(page.getByText('3519844008')).toBeVisible();
    await expect(page.getByText(/Phone calls cost/)).toHaveCount(0);
    const call = page.getByRole('link', { name: 'Call us' });
    await expect(call).toHaveAttribute('href', 'tel:+393519844008');

    await call.dispatchEvent('click');
    await expect
      .poll(async () => {
        const { data } = await admin.from('event_requests').select('payload').eq('id', id).single();
        return data?.payload.consultation.method;
      })
      .toBe('phone');

    await page.reload();
    await expect(page.getByText('ilaria@grafone.com')).toBeVisible();
    await expect(page.getByText('Would you like to proceed?')).toBeVisible();
  });

  test('proceeding ends with a thank you, and no deposit is asked', async ({ page }) => {
    const id = await openEstimate(page);
    await answer(page, 'Are you happy with this estimate?', 'Yes');
    await answer(page, 'Would you like a phone consultation?', 'No');
    await answer(page, 'Would you like to proceed?', 'Yes');

    await expect(page).toHaveURL(/\/plan\/outcome/);
    await expect(page.getByText(/We'll be in touch soon/)).toBeVisible();
    await expect(page.getByText(/deposit/i)).toHaveCount(0);
    const payload = await savedRow(id, 'accepted');
    expect(payload.decisions.proceed).toBe(true);
    expect(payload.payment).toBeNull();
  });

  test('an on-request event has no amount and no deposit', async ({ page }) => {
    const id = await openEstimate(page, {
      type: 'other-bespoke',
      drinks: { ...event.drinks, items: ['byo-drinks'], wineBottles: [] },
      decorations: { items: [], note: null },
    });
    await expect(page.getByText('Priced on request')).toBeVisible();
    await expect(page.getByText(/not included above/)).toHaveCount(0);
    await expect(page.getByText(/£\d/)).toHaveCount(0);

    await answer(page, 'Are you happy with this estimate?', 'Yes');
    await answer(page, 'Would you like a phone consultation?', 'No');
    await answer(page, 'Would you like to proceed?', 'Yes');

    await expect(page).toHaveURL(/\/plan\/outcome/);
    await expect(page.getByText(/We'll be in touch soon/)).toBeVisible();
    const payload = await savedRow(id, 'accepted');
    expect(payload.decisions.proceed).toBe(true);
    expect(payload.estimate.depositAmount).toBeNull();
  });

  test('a closed request starts a new event next time', async ({ page }) => {
    const id = await openEstimate(page);
    await answer(page, 'Are you happy with this estimate?', 'No');
    await page.getByRole('button', { name: 'No thanks, I would rather stop here' }).click();
    await expect(page).toHaveURL(/\/plan\/outcome/);

    await page.getByRole('link', { name: 'Back to the home page' }).click();
    await page.getByRole('link', { name: 'Let’s start planning' }).click();
    await expect(page).toHaveURL(/\/plan\/event-type/);
    await expect(page.getByRole('button', { name: 'Wedding', exact: true })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    const newId = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) as string).id,
      DRAFT_KEY,
    );
    expect(newId).not.toBe(id);
  });

  test('the revision page has no horizontal scroll', async ({ page }) => {
    await openEstimate(page);
    await answer(page, 'Are you happy with this estimate?', 'No');
    await expect(page).toHaveURL(/\/plan\/revise/);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
