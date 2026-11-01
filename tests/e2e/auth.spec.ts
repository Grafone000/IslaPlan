import { expect, test } from '@playwright/test';

test('Log in opens the page with both log in and create account', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('tab', { name: 'Log in' })).toBeVisible();

  await page.getByRole('tab', { name: 'Create account' }).click();
  await expect(page.getByLabel('First name')).toBeVisible();
  await expect(page.getByLabel('Phone')).toBeVisible();
});

test('the login form checks its fields', async ({ page }) => {
  await page.goto('/login');
  await page.locator('form').getByRole('button', { name: 'Log in' }).click();
  await expect(page.locator('form').getByRole('alert')).toHaveText('Please fill in every field.');
});

test('forgot password is reachable from the login page', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('link', { name: 'Forgot your password?' }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await expect(page.getByLabel('Email')).toBeVisible();
});

test('the private area sends visitors to log in', async ({ page }) => {
  await page.goto('/account');
  await expect(page).toHaveURL(/\/login\?next=%2Faccount$/);
});

test('auth pages have no horizontal scroll', async ({ page }) => {
  for (const path of ['/login', '/forgot-password', '/reset-password']) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
