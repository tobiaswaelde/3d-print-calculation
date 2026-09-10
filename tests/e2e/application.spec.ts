import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('setup, navigation, persistence, accessibility, and responsive shell', async ({ page }) => {
  test.setTimeout(90_000);
  await page.route('**/api/version-latest', (route) => route.fulfill({ json: { latest: '999.0.0' } }));
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
  await expect(page.getByRole('heading', { name: 'Druckkosten im Zeitverlauf' })).toBeVisible();
  await expect(page).toHaveTitle('ezPrint');
  const brandLink = page.getByRole('link', { name: 'ezPrint' });
  await expect(brandLink).toHaveText('ezPrint');
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toHaveCount(0);
  const collapseButton = page.getByRole('button', { name: 'Navigation einklappen' });
  const globalSearchButton = page.getByRole('button', { name: 'Globale Suche öffnen' });
  await expect(collapseButton).toHaveCount(1);
  const [collapseBox, searchBox] = await Promise.all([
    collapseButton.boundingBox(),
    globalSearchButton.boundingBox(),
  ]);
  expect(collapseBox!.x).toBeLessThan(searchBox!.x);
  expect(searchBox!.width).toBeGreaterThan(256);
  await collapseButton.click();
  await expect(brandLink).toHaveText('ez');
  await page.getByRole('button', { name: 'Navigation ausklappen' }).click();
  await expect(brandLink).toHaveText('ezPrint');
  const changelogButton = page.getByRole('button', { name: 'Changelog öffnen' });
  const updateBadge = changelogButton.getByText('Update verfügbar', { exact: true });
  await expect(updateBadge).toBeVisible();
  await expect(updateBadge.locator('[data-update-indicator]')).toHaveClass(/bg-success/);
  await changelogButton.click();
  await expect(page.getByRole('dialog', { name: 'Changelog' })).toContainText('v0.2.0');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('link', { name: 'Dokumentation öffnen' })).toHaveAttribute(
    'href',
    'https://tobiaswaelde.github.io/ezprint/',
  );
  const tablerIcon = page.locator('.iconify[class*="i-tabler:"]').first();
  await expect(tablerIcon).toBeVisible();
  expect(await tablerIcon.evaluate((element) => getComputedStyle(element).maskImage)).toContain(
    'data:image/svg+xml',
  );
  const filamentIcon = page.getByRole('link', { name: 'Filamente' }).locator('.iconify');
  await expect(filamentIcon).toBeVisible();
  expect(await filamentIcon.evaluate((element) => getComputedStyle(element).maskImage)).toContain(
    'data:image/svg+xml',
  );

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(
    accessibility.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? '')),
  ).toEqual([]);

  await page.getByRole('link', { name: 'Drucke', exact: true }).click();
  const printsToolbar = page.locator('[data-table-toolbar]');
  await expect(printsToolbar.getByText('Drucke', { exact: true })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Status' })).toContainText('Alle Status');
  await expect(printsToolbar.getByText('Archivierte anzeigen')).toHaveCount(0);
  await printsToolbar.getByRole('button', { name: 'Tabellenoptionen' }).click();
  await expect(page.getByRole('menuitemcheckbox', { name: 'Archivierte anzeigen' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(printsToolbar.getByRole('button', { name: 'New' })).toBeVisible();
  await page.keyboard.press('Control+n');
  const createPrintDialog = page.getByRole('dialog', { name: 'Neuer Druck' });
  await expect(createPrintDialog).toBeVisible();
  await expect(createPrintDialog.getByText('Allgemein')).toBeVisible();
  await createPrintDialog.getByRole('button', { name: 'Weiter' }).click();
  await expect(createPrintDialog.getByLabel('Name')).toBeVisible();
  await createPrintDialog.getByRole('button', { name: 'Abbrechen' }).click();
  await expect(createPrintDialog).toBeHidden();

  await page.getByRole('link', { name: 'Kunden' }).click();
  const tableToolbar = page.locator('[data-table-toolbar]');
  const tableRegion = page.locator('[data-table-region]');
  await expect(tableToolbar).toBeVisible();
  await expect(tableToolbar.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await expect(tableToolbar.getByText('Kunden')).toBeVisible();
  await expect(tableToolbar.getByRole('searchbox')).toBeVisible();
  await expect(tableRegion).toBeVisible();
  await expect(tableToolbar.getByRole('button', { name: 'New' })).toBeVisible();
  await page.keyboard.press('Control+n');
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

  const deleteButton = customerRow.getByRole('button', { name: 'Löschen' });
  await expect(deleteButton).toHaveText('');
  await deleteButton.click();
  const deleteConfirmation = page.getByText(
    'Dieser Eintrag wird dauerhaft gelöscht, sofern er nicht verwendet wird.',
  );
  await expect(deleteConfirmation).toBeVisible();
  await page.getByRole('button', { name: 'Abbrechen' }).click();
  await expect(deleteConfirmation).toBeHidden();

  await page.getByRole('button', { name: 'Globale Suche öffnen' }).click();
  const globalSearch = page.getByRole('search', { name: 'Globale Suche' });
  await globalSearch.getByRole('searchbox').fill('Acme');
  await expect(globalSearch.getByRole('link', { name: /Acme/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('/');
  await expect(globalSearch.getByRole('searchbox')).toBeFocused();
  await page.keyboard.press('Escape');

  await page.getByRole('link', { name: 'Einstellungen' }).click();
  await expect(page.getByRole('heading', { name: 'Allgemein' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Berechnung' })).toBeVisible();
  await page.getByRole('combobox', { name: 'Sprache' }).click();
  await page.getByRole('option', { name: 'English' }).click();
  const dateFormat = page.getByRole('combobox', { name: 'Datumsformat' });
  await dateFormat.click();
  await page.getByRole('option', { name: 'ISO (2026-09-10)' }).click();
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByText('Settings saved.')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Date format' })).toContainText('ISO (2026-09-10)');
  await page.getByRole('link', { name: 'Customers' }).click();
  await expect(tableToolbar.getByText('Customers')).toBeVisible();
  await page.reload();
  await expect(tableToolbar.getByText('Customers')).toBeVisible();

  await page.getByRole('button', { name: 'Open user menu' }).click();
  await page.getByRole('menuitem', { name: 'Appearance' }).hover();
  await page.getByRole('menuitem', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(tableToolbar.getByText('Customers')).toBeVisible();
  const geometry = await page.evaluate(() => ({
    viewportWidth: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyOverflow: getComputedStyle(document.body).overflow,
    toolbarBottom: document.querySelector<HTMLElement>('[data-table-toolbar]')?.getBoundingClientRect()
      .bottom,
    tableTop: document.querySelector<HTMLElement>('[data-table-region]')?.getBoundingClientRect().top,
    tableOverflowX: getComputedStyle(document.querySelector<HTMLElement>('[data-table-region]')!).overflowX,
    tableOverflowY: getComputedStyle(document.querySelector<HTMLElement>('[data-table-region]')!).overflowY,
    tableScrollWidth: document.querySelector<HTMLElement>('[data-table-region]')?.scrollWidth,
    tableClientWidth: document.querySelector<HTMLElement>('[data-table-region]')?.clientWidth,
  }));
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.bodyOverflow).toBe('hidden');
  expect(geometry.toolbarBottom).toBeLessThanOrEqual(geometry.tableTop!);
  expect(geometry.tableOverflowX).toBe('auto');
  expect(geometry.tableOverflowY).toBe('auto');
  expect(geometry.tableScrollWidth!).toBeGreaterThan(geometry.tableClientWidth!);
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});
