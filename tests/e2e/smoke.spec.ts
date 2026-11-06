import { expect, test } from '@playwright/test';
import { menu } from './helpers';

test('home is white with plain type and a big IslaPlan name', async ({ page }) => {
  await page.goto('/');
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(background).toBe('rgb(255, 255, 255)');
  const name = page.getByRole('heading', { level: 1, name: 'IslaPlan' });
  await expect(name).toHaveCSS('font-family', /Bodoni/i);
  await expect(page.locator('body')).toHaveCSS('font-family', /Jost/i);
});

test('has no horizontal scroll', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('the IslaPlan name fades away as the page scrolls', async ({ page }) => {
  await page.goto('/');
  const name = page.getByRole('heading', { level: 1, name: 'IslaPlan' });
  await expect(name).toHaveCSS('opacity', '1');
  await page.evaluate(() => window.scrollTo(0, window.innerHeight));
  await expect(name).toHaveCSS('opacity', '0');
});

test('the links on the second photo jump down the page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '• See what we do' }).click();
  await expect(page.locator('#events')).toBeInViewport();
  await page.getByRole('link', { name: '• Plan your event' }).click();
  await expect(page.getByRole('link', { name: 'Let’s start planning' })).toBeInViewport();
});

test('the menu button and its links are at least 44px tall', async ({ page }) => {
  await page.goto('/');
  const button = await page.getByRole('button', { name: 'Open menu' }).boundingBox();
  expect(button?.height).toBeGreaterThanOrEqual(44);
  for (const link of await (await menu(page)).getByRole('link').all()) {
    const box = await link.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
});

test('Let’s start planning opens the wizard', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Let’s start planning' }).click();
  await expect(page).toHaveURL(/\/plan\/event-type/);
  await expect(
    page.getByRole('heading', { name: 'Tell us, what are you planning?' }),
  ).toBeVisible();
});
