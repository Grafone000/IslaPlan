import { expect, test } from '@playwright/test';

const firstSectionTitle = 'Delicious food and drinks';

test('home uses the Ondari theme and the design fonts', async ({ page }) => {
  await page.goto('/');
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(background).toBe('rgb(247, 238, 220)');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('font-family', /DM.?Serif/i);
  await expect(page.getByRole('heading', { name: firstSectionTitle })).toHaveCSS(
    'font-family',
    /Italiana/i,
  );
});

test('has no horizontal scroll', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('photo section title and text fade in on scroll', async ({ page }) => {
  await page.goto('/');
  const title = page.getByRole('heading', { name: firstSectionTitle });
  const reveal = title.locator('xpath=ancestor::div[contains(@class,"reveal")][1]');
  await expect(reveal).toHaveClass(/reveal-hidden/);

  await title.scrollIntoViewIfNeeded();
  await expect(reveal).not.toHaveClass(/reveal-hidden/);
  await expect(reveal).toHaveCSS('opacity', '1');
});

test('reduced motion shows photo sections with no animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const title = page.getByRole('heading', { name: firstSectionTitle });
  const reveal = title.locator('xpath=ancestor::div[contains(@class,"reveal")][1]');
  await expect(reveal).not.toHaveClass(/reveal-hidden/);
  await expect(reveal).toHaveCSS('opacity', '1');
  await expect(reveal).toHaveCSS('transition-property', 'none');
});

test('navigation targets are at least 44px tall', async ({ page }) => {
  await page.goto('/');
  const links = page.getByRole('navigation', { name: 'Main' }).getByRole('link');
  for (const link of await links.all()) {
    const box = await link.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
});
