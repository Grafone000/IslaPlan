import type { Page } from '@playwright/test';

// The menu hides behind the three lines at the top right: open it if it is closed.
export async function menu(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Menu' });
  if (!(await dialog.isVisible())) {
    await page.getByRole('button', { name: 'Open menu' }).click();
  }
  return dialog.getByRole('navigation', { name: 'Menu' });
}

// Events are booked at least a month ahead, so two months on is always bookable.
export async function pickBookableDay(page: Page) {
  await page.getByRole('button', { name: /next month/i }).click();
  await page.getByRole('button', { name: /next month/i }).click();
  await page.locator('[data-day]:not([data-outside]) button').nth(14).click();
}
