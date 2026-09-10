import { expect, test } from '@playwright/test';

const base = '/3d-print-calculation';

test('US English docs support search, screenshots, branding, keyboard access, and narrow viewports', async ({
  page,
}) => {
  await page.goto(`${base}/guide/setup`);
  await expect(page.locator('main h1')).toContainText('Setup and sign-in');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/3d-print-calculation/favicon.svg');
  await expect(page.locator('main img').first()).toHaveJSProperty('complete', true);

  await page.getByRole('button', { name: 'Search' }).click();
  await page.getByRole('searchbox').fill('Backup');
  await expect(page.getByRole('link', { name: /Backup and restore/ }).first()).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Search' }).click();
  await page.getByRole('searchbox').fill('decimal');
  await expect(page.getByRole('link', { name: /Calculation rules/ }).first()).toBeVisible();
  await page.keyboard.press('Escape');

  await page.goto(`${base}/`);
  await expect(page.locator('.VPHero .image-bg')).toHaveCSS('background-image', /linear-gradient/);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/guide/setup`);
  await expect(page.locator('main h1')).toContainText('Setup and sign-in');
  const geometry = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(geometry.document).toBeLessThanOrEqual(geometry.viewport);
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});
