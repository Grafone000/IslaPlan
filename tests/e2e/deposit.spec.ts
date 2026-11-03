import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { expect, test, type Page } from '@playwright/test';

try {
  process.loadEnvFile('.env.local');
} catch {
  // No local env file: the suite below skips itself.
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRAFT_KEY = 'event-planner:draft:v1';
const SUCCESS_CARD = '4242 4242 4242 4242';
const DECLINED_CARD = '4000 0000 0000 0002';

const contact = {
  firstName: 'Deposit',
  lastName: 'Test',
  email: 'deposit-e2e@example.com',
  phone: '07700900000',
};

const event = {
  type: 'wedding',
  typeNote: null,
  date: '2027-05-14',
  startTime: '18:30',
  endTime: '23:00',
  endsNextDay: false,
  guests: 50,
  food: { items: ['dinner'], menus: {}, ownFoodNote: null },
  drinks: {
    items: ['wine-only'],
    packages: { 'wine-only': 'wine-175ml' },
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

test.describe('deposit', () => {
  test.skip(!url || !serviceKey, 'Supabase is not configured');

  let admin: SupabaseClient;

  test.beforeAll(() => {
    admin = createClient(url as string, serviceKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  });

  async function openDeposit(page: Page) {
    const id = crypto.randomUUID();
    const created = await page.request.post('/api/requests', { data: { id, contact, event } });
    expect(created.status()).toBe(201);
    let request;
    for (const type of ['accept-estimate', 'skip-consultation', 'proceed']) {
      const response = await page.request.patch(`/api/requests/${id}`, { data: { type } });
      expect(response.status()).toBe(200);
      ({ request } = await response.json());
    }
    await page.goto('/');
    await page.evaluate(
      ([key, draft]) => localStorage.setItem(key as string, JSON.stringify(draft)),
      [DRAFT_KEY, { draftVersion: 2, id, event, contact, furthest: 'contact', request }],
    );
    await page.goto('/plan/deposit');
    await expect(page.getByRole('button', { name: 'Pay £1,175' })).toBeEnabled();
    return id;
  }

  async function fillCard(page: Page, number: string) {
    await page.getByLabel('Name on card').fill('Test Client');
    await page.getByLabel('Card number').fill(number);
    await page.getByLabel('Expiry (MM/YY)').fill('12/30');
    await page.getByLabel('CVC').fill('987');
  }

  const payButton = (page: Page) => page.getByRole('button', { name: 'Pay £1,175' });

  const row = async (id: string) => {
    const { data } = await admin.from('event_requests').select('status, payload').eq('id', id).single();
    return data;
  };

  test('a test card pays the deposit and shows the confirmation', async ({ page }) => {
    const id = await openDeposit(page);
    await expect(page.getByText(/Demo: no card will be charged/)).toBeVisible();

    await fillCard(page, SUCCESS_CARD);
    await payButton(page).click();

    await expect(page).toHaveURL(/\/plan\/outcome/);
    await expect(page.getByText(/Your deposit is paid/)).toBeVisible();

    const saved = await row(id);
    expect(saved?.status).toBe('deposit-paid');
    expect(saved?.payload.payment).toMatchObject({
      provider: 'stub',
      amount: 117_500,
      currency: 'GBP',
      status: 'paid',
    });
    expect(saved?.payload.payment.paidAt).toBeTruthy();
  });

  test('a declined card can be retried', async ({ page }) => {
    const id = await openDeposit(page);
    await fillCard(page, DECLINED_CARD);
    await payButton(page).click();

    await expect(page.getByText('Your card was declined. Please try another card.')).toBeVisible();
    await expect(page).toHaveURL(/\/plan\/deposit/);
    const declined = await row(id);
    expect(declined?.status).toBe('deposit-pending');
    expect(declined?.payload.payment.status).toBe('failed');

    await page.getByLabel('Card number').fill(SUCCESS_CARD);
    await payButton(page).click();
    await expect(page).toHaveURL(/\/plan\/outcome/);
    expect((await row(id))?.status).toBe('deposit-paid');
  });

  test('any other card number is refused before anything happens', async ({ page }) => {
    const id = await openDeposit(page);
    await fillCard(page, '5555 5555 5555 4444');
    await payButton(page).click();
    await expect(page.getByRole('main').getByRole('alert')).toContainText('This is a demo');
    expect((await row(id))?.payload.payment.status).toBe('pending');
  });

  test('checks the expiry date and the CVC', async ({ page }) => {
    await openDeposit(page);
    await fillCard(page, SUCCESS_CARD);
    await page.getByLabel('Expiry (MM/YY)').fill('01/20');
    await payButton(page).click();
    await expect(page.getByRole('main').getByRole('alert')).toContainText('valid expiry date');

    await page.getByLabel('Expiry (MM/YY)').fill('12/30');
    await page.getByLabel('CVC').fill('1');
    await payButton(page).click();
    await expect(page.getByRole('main').getByRole('alert')).toContainText('CVC');
  });

  test('card data never leaves the form', async ({ page }) => {
    const leaks: string[] = [];
    const looksLikeCard = (text: string) =>
      /4242\s?4242\s?4242\s?4242|12\/30|Test Client/.test(text);

    page.on('console', (message) => leaks.push(`console: ${message.text()}`));
    page.on('request', (request) => {
      leaks.push(`url: ${request.url()}`);
      leaks.push(`body: ${request.postData() ?? ''}`);
    });

    const id = await openDeposit(page);
    await fillCard(page, SUCCESS_CARD);
    await payButton(page).click();
    await expect(page).toHaveURL(/\/plan\/outcome/);

    const storage = await page.evaluate(() =>
      JSON.stringify({ ...localStorage, ...sessionStorage, cookie: document.cookie }),
    );
    const saved = JSON.stringify(await row(id));

    expect(leaks.filter(looksLikeCard)).toEqual([]);
    expect(looksLikeCard(storage)).toBe(false);
    expect(looksLikeCard(saved)).toBe(false);
    expect(looksLikeCard(page.url())).toBe(false);
  });

  test('the API cannot mark an unrelated payment as paid', async ({ page }) => {
    const id = await openDeposit(page);
    const response = await page.request.post(`/api/requests/${id}/deposit/confirm`, {
      data: { paymentId: 'made-up', reported: 'paid' },
    });
    expect(response.status()).toBe(409);
    expect((await row(id))?.status).toBe('deposit-pending');
  });

  test('the deposit page has no horizontal scroll', async ({ page }) => {
    await openDeposit(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
