import { expect, test, type Page } from '@playwright/test';
import { menu } from './helpers';

// Which full-screen slide the Home rests on, counting from 0.
const slideIndex = (page: Page) =>
  page.evaluate(() => {
    const scroller = document.querySelector('[data-home-scroller]') as HTMLElement;
    return scroller.scrollTop / scroller.clientHeight;
  });

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
  await page.evaluate(() => {
    const scroller = document.querySelector('[data-home-scroller]') as HTMLElement;
    scroller.scrollTo({ top: scroller.clientHeight, behavior: 'instant' });
  });
  await expect(name).toHaveCSS('opacity', '0');
});

test('the Home is one full screen at a time, and the slide leaving shrinks', async ({ page }) => {
  await page.goto('/');
  const height = await page.evaluate(() => window.innerHeight);
  const slides = page.locator('[data-slide]');
  await expect(slides).toHaveCount(5);
  for (const slide of await slides.all()) {
    expect((await slide.boundingBox())?.height).toBeCloseTo(height, 0);
  }
  await page.evaluate(() => {
    const scroller = document.querySelector('[data-home-scroller]') as HTMLElement;
    scroller.style.scrollSnapType = 'none';
    scroller.scrollTo({ top: scroller.clientHeight / 2, behavior: 'instant' });
  });
  const inner = slides.first().locator('.home-slide-inner');
  await expect
    .poll(() => inner.evaluate((el) => el.getBoundingClientRect().width / window.innerWidth))
    .toBeLessThan(0.9);
});

test('the story sits over a full-screen photo', async ({ page }) => {
  await page.goto('/#story');
  const story = page.getByRole('region', { name: 'About us' });
  const photo = await story.getByRole('img').boundingBox();
  const title = await story.getByRole('heading', { level: 2 }).boundingBox();
  const viewport = page.viewportSize();
  expect(photo?.width).toBeCloseTo(viewport?.width ?? 0, 0);
  expect(
    title && photo && title.y >= photo.y && title.y + title.height <= photo.y + photo.height,
  ).toBe(true);
});

test('the links on the second photo jump down the page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '• See what we do' }).click();
  // Wait for the smooth scroll to rest on the fourth slide.
  await expect.poll(() => slideIndex(page)).toBe(3);
  // The second slide is now covered by the ones above it: go back to it first.
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await expect.poll(() => slideIndex(page)).toBe(1);
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
