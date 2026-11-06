import { expect, test, type Page } from '@playwright/test';

const ON_ACCENT = 'rgb(255, 255, 255)';

async function checkBasics(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

  const unnamed = await page.evaluate(() => {
    const controls = Array.from(
      document.querySelectorAll('main a, main button, main input, main select, main textarea, header a, header button'),
    );
    return controls
      .filter((element) => {
        const el = element as HTMLElement;
        if (el.closest('[aria-hidden="true"]') || el.offsetParent === null) return false;
        const labelled =
          el.getAttribute('aria-label') ||
          el.textContent?.trim() ||
          (el.id && document.querySelector(`label[for="${el.id}"]`)) ||
          el.closest('label');
        return !labelled;
      })
      .map((el) => el.outerHTML.slice(0, 80));
  });
  expect(unnamed, path).toEqual([]);

  const missingAlt = await page.evaluate(() =>
    Array.from(document.querySelectorAll('img'))
      .filter((img) => !img.hasAttribute('alt'))
      .map((img) => img.src),
  );
  expect(missingAlt, path).toEqual([]);
}

for (const path of ['/', '/login', '/forgot-password', '/plan/event-type']) {
  test(`${path} has a single title, named controls and image text`, async ({ page }) => {
    await checkBasics(page, path === '/plan/event-type' ? '/plan' : path);
  });
}

test('accent buttons keep their light text', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Let’s start planning' })).toHaveCSS(
    'color',
    ON_ACCENT,
  );
  await page.goto('/login');
  await expect(page.locator('form').getByRole('button', { name: 'Log in' })).toHaveCSS(
    'color',
    ON_ACCENT,
  );
});

test('keyboard focus is visible on fields and buttons', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').focus();
  await expect(page.getByLabel('Email')).toHaveCSS('outline-style', 'solid');

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  await expect(focused).toHaveCSS('outline-style', 'solid');
});
