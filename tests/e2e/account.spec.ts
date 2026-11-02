import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

try {
  process.loadEnvFile('.env.local');
} catch {
  // No local env file: the suite below skips itself.
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = 'e2e-test-password';

// The smallest valid PNG, one pixel.
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

const contact = {
  firstName: 'Account',
  lastName: 'Test',
  email: 'account-e2e@example.com',
  phone: '07700900000',
};

const eventOn = (date: string) => ({
  type: 'birthday',
  typeNote: null,
  date,
  startTime: '18:30',
  endTime: '23:00',
  endsNextDay: false,
  partySize: 'size-20-40',
  food: ['dinner'],
  drinks: ['wine-only'],
  entertainment: { items: [], activitiesPreference: null },
  decorations: { items: [], note: null },
  additionalInfo: '',
  budget: '2500-5000',
});

const FUTURE = '2030-06-01';
const PAST = '2024-03-10';

test.describe('private area', () => {
  test.skip(!url || !serviceKey, 'Supabase is not configured');

  let admin: SupabaseClient;

  test.beforeAll(() => {
    admin = createClient(url as string, serviceKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  });

  async function logInNewUser(page: Page, label: string) {
    const email = `e2e-${label}-${crypto.randomUUID()}@example.com`;
    const { error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { first_name: 'Account', last_name: 'Test', phone: contact.phone },
    });
    if (error) throw error;

    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.locator('form').getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByRole('link', { name: 'My area' })).toBeVisible();
  }

  async function createEvent(api: APIRequestContext, date: string) {
    const id = crypto.randomUUID();
    const response = await api.post('/api/requests', {
      data: { id, contact, event: eventOn(date) },
    });
    expect(response.status()).toBe(201);
    return id;
  }

  test('lists upcoming and past events and hides declined ones', async ({ page }) => {
    await logInNewUser(page, 'list');
    await page.goto('/account');
    await expect(page.getByText('You have no upcoming events yet.')).toBeVisible();

    await createEvent(page.request, FUTURE);
    await createEvent(page.request, PAST);
    const declined = await createEvent(page.request, '2031-01-01');
    await page.request.patch(`/api/requests/${declined}`, { data: { type: 'reject-estimate' } });
    await page.request.patch(`/api/requests/${declined}`, { data: { type: 'decline' } });

    await page.reload();
    const upcoming = page.locator('section', {
      has: page.getByRole('heading', { name: 'Upcoming events' }),
    });
    const past = page.locator('section', {
      has: page.getByRole('heading', { name: 'Past events' }),
    });
    await expect(upcoming.getByRole('link')).toHaveCount(1);
    await expect(upcoming.getByText(FUTURE)).toBeVisible();
    await expect(past.getByRole('link')).toHaveCount(1);
    await expect(past.getByText(PAST)).toBeVisible();
    await expect(page.getByText('2031-01-01')).toHaveCount(0);

    const blocked = await page.goto(`/account/events/${declined}`);
    expect(blocked?.status()).toBe(404);
  });

  test('shows event details, photos and the conversation', async ({ page }) => {
    await logInNewUser(page, 'detail');
    const id = await createEvent(page.request, PAST);

    const upload = await admin.storage
      .from('event-photos')
      .upload(`${id}/first.png`, PIXEL, { contentType: 'image/png' });
    expect(upload.error).toBeNull();

    await page.goto('/account');
    await page.getByRole('link', { name: `View Birthday, ${PAST}` }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Birthday' })).toBeVisible();
    await expect(page.getByText('From 20 to 40')).toBeVisible();
    await expect(page.getByText('Estimate ready')).toBeVisible();

    const photo = page.getByRole('img', { name: 'Photo from your event: first.png' });
    await expect(photo).toBeVisible();
    await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1);
    await expect(photo).toHaveAttribute('src', /token=/);

    await expect(page.getByLabel('Subject')).toHaveValue('About my Birthday');
    await page.getByRole('textbox', { name: 'Message' }).click();
    await page.keyboard.type('Can we move the start time?');
    await page.locator('input[type="file"]').setInputFiles({
      name: 'ideas.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('some ideas'),
    });
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: 'Can we move the start time?' })).toBeVisible();

    const link = page.getByRole('link', { name: 'ideas.txt' });
    await expect(link).toHaveAttribute('href', /token=/);
    const file = await page.request.get((await link.getAttribute('href')) as string);
    expect(await file.text()).toBe('some ideas');

    await admin.from('event_messages').insert({
      request_id: id,
      direction: 'organiser',
      subject: 'Re: About my Birthday',
      body: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Of course, no problem.' }] }],
      },
      body_text: 'Of course, no problem.',
    });
    await page.reload();
    const reply = page.getByRole('listitem').filter({ hasText: 'Of course, no problem.' });
    await expect(reply).toContainText('Your organiser');
  });

  test('hides the photos section when there are none', async ({ page }) => {
    await logInNewUser(page, 'nophoto');
    const id = await createEvent(page.request, FUTURE);
    await page.goto(`/account/events/${id}`);
    await expect(page.getByRole('heading', { level: 1, name: 'Birthday' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Photos' })).toHaveCount(0);
  });

  test('another client sees nothing of an event', async ({ page, browser, baseURL }) => {
    await logInNewUser(page, 'owner');
    const id = await createEvent(page.request, FUTURE);

    const context = await browser.newContext({ baseURL });
    const stranger = await context.newPage();
    await logInNewUser(stranger, 'stranger');

    const response = await stranger.goto(`/account/events/${id}`);
    expect(response?.status()).toBe(404);

    const post = await stranger.request.post(`/api/requests/${id}/messages`, {
      multipart: {
        message: JSON.stringify({
          subject: 'Hi',
          body: {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hi' }] }],
          },
        }),
      },
    });
    expect(post.status()).toBe(404);
    await context.close();
  });

  test('a logged-out visitor is sent to log in, also for an event', async ({ page }) => {
    await page.goto(`/account/events/${crypto.randomUUID()}`);
    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test('Create new event opens the wizard', async ({ page }) => {
    await logInNewUser(page, 'create');
    await page.goto('/account');
    await page.getByRole('link', { name: 'Create new event' }).click();
    await expect(page).toHaveURL(/\/plan\/event-type/);
    await expect(page.getByText('Step 1 of 9')).toBeVisible();
  });

  test('the private area has no horizontal scroll', async ({ page }) => {
    await logInNewUser(page, 'scroll');
    const id = await createEvent(page.request, FUTURE);
    for (const path of ['/account', `/account/events/${id}`]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
});
