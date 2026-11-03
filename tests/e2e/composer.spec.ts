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

const contact = {
  firstName: 'Composer',
  lastName: 'Test',
  email: 'composer-e2e@example.com',
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

test.describe('consultation email', () => {
  test.skip(!url || !serviceKey, 'Supabase is not configured');

  let admin: SupabaseClient;

  test.beforeAll(() => {
    admin = createClient(url as string, serviceKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  });

  async function openComposer(page: Page) {
    const id = crypto.randomUUID();
    const created = await page.request.post('/api/requests', { data: { id, contact, event } });
    expect(created.status()).toBe(201);
    for (const type of ['accept-estimate', 'request-consultation']) {
      const response = await page.request.patch(`/api/requests/${id}`, { data: { type } });
      expect(response.status()).toBe(200);
    }
    const final = await page.request.patch(`/api/requests/${id}`, {
      data: { type: 'set-consultation-method', method: 'email' },
    });
    const { request } = await final.json();

    await page.goto('/');
    await page.evaluate(
      ([key, draft]) => localStorage.setItem(key as string, JSON.stringify(draft)),
      [DRAFT_KEY, { draftVersion: 2, id, event, contact, furthest: 'contact', request }],
    );
    await page.goto('/plan/estimate');
    await page.getByRole('button', { name: 'Email us' }).click();
    await expect(page).toHaveURL(/\/plan\/email/);
    return id;
  }

  const editor = (page: Page) => page.getByRole('textbox', { name: 'Message' });
  const tool = (page: Page, name: string) =>
    page.getByRole('toolbar', { name: 'Formatting' }).getByRole('button', { name });

  test('sends formatted text, a link and an attachment', async ({ page }) => {
    const id = await openComposer(page);

    await expect(page.getByRole('textbox', { name: 'To' })).toHaveValue('ilaria@grafone.com');
    await expect(page.getByRole('textbox', { name: 'To' })).toHaveAttribute('readonly');
    await page.getByLabel('Subject').fill('About my wedding');

    await editor(page).click();
    await tool(page, 'Bold').click();
    await page.keyboard.type('Bold words');
    await tool(page, 'Bold').click();
    await page.keyboard.type(' then ');
    await tool(page, 'Italic').click();
    await page.keyboard.type('italic');
    await tool(page, 'Italic').click();
    await page.keyboard.press('Enter');
    await tool(page, 'Bullet list').click();
    await page.keyboard.type('First point');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await tool(page, 'Numbered list').click();
    await page.keyboard.type('Numbered point');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.type('our site');
    await page.keyboard.press('Shift+Home');
    await tool(page, 'Link').click();
    await page.getByLabel('Web address').fill('https://example.com/menu');
    await page.getByRole('button', { name: 'Add link' }).click();

    await page.locator('input[type="file"]').setInputFiles({
      name: 'My plan.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('seating plan'),
    });
    await expect(page.getByText('My plan.txt')).toBeVisible();

    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page).toHaveURL(/\/plan\/estimate/);
    await expect(page.getByText('Would you like to proceed?')).toBeVisible();

    const { data: messages } = await admin.from('event_messages').select('*').eq('request_id', id);
    expect(messages).toHaveLength(1);
    const [message] = messages ?? [];
    expect(message.subject).toBe('About my wedding');
    expect(message.direction).toBe('client');

    const stored = JSON.stringify(message.body);
    expect(stored).toContain('"bold"');
    expect(stored).toContain('"italic"');
    expect(stored).toContain('"bulletList"');
    expect(stored).toContain('"orderedList"');
    expect(stored).toContain('https://example.com/menu');
    expect(message.body_text).toContain('Bold words then italic');

    expect(message.attachments).toHaveLength(1);
    expect(message.attachments[0].name).toBe('My plan.txt');
    const { data: file } = await admin.storage
      .from('message-attachments')
      .download(message.attachments[0].storagePath);
    expect(await file?.text()).toBe('seating plan');

    const { data: row } = await admin.from('event_requests').select('payload').eq('id', id).single();
    expect(row?.payload.consultation).toEqual({ method: 'email', messageId: message.id });
  });

  test('asks for a subject and a message', async ({ page }) => {
    await openComposer(page);
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      'Please add a subject and a message.',
    );
  });

  test('refuses an unsafe link address', async ({ page }) => {
    await openComposer(page);
    await editor(page).click();
    await page.keyboard.type('click me');
    await page.keyboard.press('Shift+Home');
    await tool(page, 'Link').click();
    await page.getByLabel('Web address').fill('javascript:alert(1)');
    await page.getByRole('button', { name: 'Add link' }).click();
    await expect(page.getByRole('main').getByRole('alert')).toContainText('full web address');
  });

  test('refuses a file that is too large', async ({ page }) => {
    await openComposer(page);
    await page.locator('input[type="file"]').setInputFiles({
      name: 'huge.bin',
      mimeType: 'application/octet-stream',
      buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
    });
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      'huge.bin is larger than 10 MB.',
    );
  });

  test('the composer has no horizontal scroll', async ({ page }) => {
    await openComposer(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
