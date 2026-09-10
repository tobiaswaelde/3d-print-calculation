import { expect, test } from '@playwright/test';

test('manufacturer inventory supplies component and filament dropdowns', async ({ page }) => {
  await page.goto('/');
  const setupHeading = page.getByRole('heading', { name: 'Ersteinrichtung' });
  const loginHeading = page.getByRole('heading', { name: 'Anmelden' });
  await expect(setupHeading.or(loginHeading)).toBeVisible();

  if (await setupHeading.isVisible()) {
    await page.getByLabel('Anzeigename').fill('Browser Test');
    await page.getByLabel('E-Mail').fill('browser@example.test');
    await page.getByLabel('Passwort').fill('browser-test-password-123');
    await page.getByLabel('Strompreis pro kWh').fill('0.32');
    await page.getByRole('button', { name: 'Ersteinrichtung' }).click();
  } else {
    await page.getByLabel('E-Mail').fill('browser@example.test');
    await page.getByLabel('Passwort').fill('browser-test-password-123');
    await page.getByRole('button', { name: 'Anmelden' }).click();
  }

  const manufacturersLink = page.getByRole('link', { name: /^(Hersteller|Manufacturers)$/ });
  await expect(manufacturersLink).toBeVisible();
  const german = await page.getByRole('link', { name: 'Hersteller' }).isVisible();
  const labels = german
    ? {
        components: 'Komponenten',
        filaments: 'Filamente',
        manufacturer: 'Hersteller',
        colorName: 'Farbname',
        colorHex: 'Farbe (HEX-Code)',
        save: 'Speichern',
        cancel: 'Abbrechen',
      }
    : {
        components: 'Components',
        filaments: 'Filaments',
        manufacturer: 'Manufacturer',
        colorName: 'Color name',
        colorHex: 'Color (hex code)',
        save: 'Save',
        cancel: 'Cancel',
      };
  const toolbar = page.locator('[data-table-toolbar]');
  await manufacturersLink.click();
  await toolbar.getByRole('button', { name: 'New' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name').fill('Dropdown Maker');
  await dialog.getByRole('button', { name: labels.save }).click();
  await expect(page.getByRole('cell', { name: 'Dropdown Maker' })).toBeVisible();

  await page.getByRole('link', { name: labels.components }).click();
  await toolbar.getByRole('button', { name: 'New' }).click();
  await dialog.getByLabel(labels.manufacturer).click();
  await expect(page.getByRole('option', { name: 'Dropdown Maker' })).toBeVisible();
  await page.getByRole('option', { name: 'Dropdown Maker' }).click();
  await dialog.getByRole('button', { name: labels.cancel }).click();
  await expect(dialog).toBeHidden();

  await page.getByRole('link', { name: labels.filaments }).click();
  await toolbar.getByRole('button', { name: 'New' }).click();
  const derivedName = dialog.getByLabel(/^Name/);
  await expect(derivedName).toHaveAttribute('readonly');
  await dialog.getByLabel(labels.manufacturer).click();
  await page.getByRole('option', { name: 'Dropdown Maker' }).click();
  await expect(page.getByRole('option', { name: 'Dropdown Maker' })).toBeHidden();
  await expect(derivedName).toHaveValue('Dropdown Maker');
  const material = dialog.getByLabel('Material');
  await material.fill('PLA');
  await expect(material).toHaveValue('PLA');
  await expect(derivedName).toHaveValue('Dropdown Maker PLA');
  await dialog.getByLabel(labels.colorName).fill('Ocean Blue');
  await expect(derivedName).toHaveValue('Dropdown Maker PLA - Ocean Blue');
  await dialog.getByLabel(labels.colorHex).fill('#112233');
  await dialog.getByRole('button', { name: labels.save }).click();
  await expect(page.getByRole('cell', { name: 'Dropdown Maker PLA - Ocean Blue' })).toBeVisible();
});
