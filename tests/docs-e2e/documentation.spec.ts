import { expect, test } from '@playwright/test';

const base = '/3d-print-calculation';

test('localized docs support search, keyboard access, and narrow viewports', async ({ page }) => {
  await page.goto(`${base}/guide/setup`);
  await expect(page.locator('main h1')).toContainText('Einrichtung und Zugang');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de-DE');

  await page.getByRole('button', { name: /Search|Suchen/ }).click();
  await page.getByRole('searchbox').fill('Backup');
  await expect(page.getByRole('link', { name: /Backup und Restore/ }).first()).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Change language' }).click();
  await page.getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL(`${base}/en/guide/setup`);
  await expect(page.locator('main h1')).toContainText('Setup and access');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  await page.getByRole('button', { name: /Search|Suchen/ }).click();
  await page.getByRole('searchbox').fill('decimal');
  await expect(page.getByRole('link', { name: /Calculation rules/ }).first()).toBeVisible();
  await page.keyboard.press('Escape');

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('main h1')).toContainText('Setup and access');
  const geometry = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(geometry.document).toBeLessThanOrEqual(geometry.viewport);
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});
