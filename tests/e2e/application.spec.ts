import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('setup, navigation, persistence, accessibility, and responsive shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ersteinrichtung' })).toBeVisible();
  await page.getByLabel('Anzeigename').fill('Browser Test');
  await page.getByLabel('E-Mail').fill('browser@example.test');
  await page.getByLabel('Passwort').fill('browser-test-password-123');
  const electricityPrice = page.getByLabel('Strompreis pro kWh');
  await expect(electricityPrice).toHaveAttribute('type', 'number');
  await expect(electricityPrice.locator('..')).toContainText('EUR/kWh');
  await electricityPrice.fill('0.32');
  await page.getByRole('button', { name: 'Ersteinrichtung' }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();
  const tablerIcon = page.locator('.iconify[class*="i-tabler:"]').first();
  await expect(tablerIcon).toBeVisible();
  expect(await tablerIcon.evaluate((element) => getComputedStyle(element).maskImage)).toContain(
    'data:image/svg+xml',
  );

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(
    accessibility.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? '')),
  ).toEqual([]);

  await page.getByRole('link', { name: 'Kunden' }).click();
  await page.getByRole('button', { name: 'Erstellen' }).first().click();
  const resourceDialog = page.getByRole('dialog');
  await expect(resourceDialog).toBeVisible();
  await expect(resourceDialog.getByLabel('Name')).toBeFocused();
  await resourceDialog.getByLabel('Name').fill('Acme');
  await resourceDialog.getByLabel('E-Mail').fill('hello@example.test');
  await resourceDialog.getByRole('button', { name: 'Speichern' }).click();
  await expect(resourceDialog).toBeHidden();
  await expect(page.getByRole('cell', { name: 'Acme' })).toBeVisible();

  const customerRow = page.getByRole('row', { name: /Acme/ });
  await customerRow.getByRole('button', { name: 'Bearbeiten' }).click();
  await expect(resourceDialog).toBeVisible();
  await resourceDialog.getByLabel('Name').fill('Discarded name');
  await page.keyboard.press('Escape');
  await expect(resourceDialog).toBeHidden();
  await expect(page.getByRole('cell', { name: 'Acme' })).toBeVisible();

  await customerRow.getByRole('button', { name: 'Bearbeiten' }).click();
  await resourceDialog.getByLabel('Name').fill('Acme Updated');
  await resourceDialog.getByRole('button', { name: 'Speichern' }).click();
  await expect(resourceDialog).toBeHidden();
  await expect(page.getByRole('cell', { name: 'Acme Updated' })).toBeVisible();

  await page.getByRole('button', { name: 'Globale Suche öffnen' }).click();
  const globalSearch = page.getByRole('search', { name: 'Globale Suche' });
  await globalSearch.getByRole('searchbox').fill('Acme');
  await expect(globalSearch.getByRole('link', { name: /Acme/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('/');
  await expect(globalSearch.getByRole('searchbox')).toBeFocused();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Benutzermenü öffnen' }).click();
  await page.getByRole('menuitem', { name: 'Sprache' }).hover();
  await page.getByRole('menuitem', { name: 'English' }).click();
  await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible();

  await page.getByRole('button', { name: 'Open user menu' }).click();
  await page.getByRole('menuitem', { name: 'Appearance' }).hover();
  await page.getByRole('menuitem', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible();
  const geometry = await page.evaluate(() => ({
    viewportWidth: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyOverflow: getComputedStyle(document.body).overflow,
  }));
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.bodyOverflow).toBe('hidden');
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});
