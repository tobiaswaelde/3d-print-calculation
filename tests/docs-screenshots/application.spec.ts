import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Browser, type Page } from '@playwright/test';

const appUrl = 'http://127.0.0.1:3001';
const screenshotDirectory = resolve('docs/public/screenshots');
const screenshotOptions = {
  animations: 'disabled' as const,
  caret: 'hide' as const,
  quality: 88,
  scale: 'css' as const,
  type: 'jpeg' as const,
};

type Resource = { id: string };

async function api<T>(page: Page, path: string, method: 'POST', body?: unknown): Promise<T> {
  return page.evaluate(
    async ({ path, method, body }) => {
      const response = await fetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`${method} ${path} failed (${response.status}): ${text}`);
      return JSON.parse(text) as T;
    },
    { path, method, body },
  );
}

async function capture(page: Page, name: string) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  await page.screenshot({
    path: resolve(screenshotDirectory, name),
    ...screenshotOptions,
  });
}

async function captureSignIn(browser: Browser) {
  const context = await browser.newContext({
    baseURL: appUrl,
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
    locale: 'en-US',
    timezoneId: 'UTC',
  });
  const page = await context.newPage();
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await capture(page, 'sign-in.jpg');
  await context.close();
}

async function selectOption(page: Page, label: string, option: string) {
  await page.getByLabel(label, { exact: true }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

test('regenerates every application screenshot used by the documentation', async ({ page, browser }) => {
  mkdirSync(screenshotDirectory, { recursive: true });

  await page.route('**/api/version-latest', async (route) => {
    await route.fulfill({ json: { latest: null } });
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'First-run setup' })).toBeVisible({ timeout: 30_000 });
  await capture(page, 'first-run-setup.jpg');

  await page.getByLabel('Display name').fill('Alex Morgan');
  await page.getByLabel('Email').fill('alex@example.test');
  await page.getByLabel('Password').fill('documentation-demo-2026');
  await page.getByLabel('Electricity price per kWh').fill('0.32');
  await page.getByRole('button', { name: 'First-run setup' }).click();
  await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).toBeVisible();

  await captureSignIn(browser);

  const customer = await api<Resource>(page, '/api/customers', 'POST', {
    name: 'Studio North',
    email: 'hello@studio-north.example',
    note: 'Synthetic documentation customer',
  });
  const printer = await api<Resource>(page, '/api/printers', 'POST', {
    name: 'Workshop Prusa MK4',
    manufacturer: 'Prusa Research',
    model: 'MK4',
    purchasePrice: '1199',
    expectedLifetimeHours: '5000',
    averagePowerWatts: 120,
    note: 'Primary documentation printer',
  });
  const prusa = await api<Resource>(page, '/api/manufacturers', 'POST', {
    name: 'Prusa Research',
    note: null,
  });
  const e3d = await api<Resource>(page, '/api/manufacturers', 'POST', {
    name: 'E3D',
    note: null,
  });
  const workshop = await api<Resource>(page, '/api/manufacturers', 'POST', {
    name: 'Workshop',
    note: null,
  });
  const polymaker = await api<Resource>(page, '/api/manufacturers', 'POST', {
    name: 'Polymaker',
    note: null,
  });
  const buildPlate = await api<Resource>(page, '/api/components', 'POST', {
    type: 'BUILD_PLATE',
    name: 'Textured PEI plate',
    manufacturerId: prusa.id,
    model: 'MK4 textured sheet',
    purchasePrice: '44.90',
    expectedLifetimeHours: '1800',
    printerIds: [printer.id],
    note: null,
  });
  const hotend = await api<Resource>(page, '/api/components', 'POST', {
    type: 'HOTEND',
    name: '0.4 mm high-flow hotend',
    manufacturerId: e3d.id,
    model: 'Revo High Flow',
    purchasePrice: '89.90',
    expectedLifetimeHours: '2500',
    printerIds: [printer.id],
    note: null,
  });
  const enclosure = await api<Resource>(page, '/api/components', 'POST', {
    type: 'OTHER',
    name: 'Heated enclosure',
    manufacturerId: workshop.id,
    model: 'Enclosure V2',
    purchasePrice: '249',
    expectedLifetimeHours: '6000',
    printerIds: [printer.id],
    note: null,
  });
  const filament = await api<Resource>(page, '/api/filaments', 'POST', {
    name: 'PolyTerra PLA Teal',
    manufacturerId: polymaker.id,
    material: 'PLA',
    color: 'Teal',
    purchasePrice: '24.99',
    netWeightGrams: '1000',
    note: null,
  });

  const printInput = {
    customerId: customer.id,
    printerId: printer.id,
    buildPlateId: buildPlate.id,
    hotends: [{ componentId: hotend.id, durationSeconds: 23_400 }],
    otherComponentIds: [enclosure.id],
    filaments: [{ filamentId: filament.id, usedGrams: '185' }],
    notes: 'Synthetic data used to keep the documentation screenshots reproducible.',
  };
  const completed = await api<Resource>(page, '/api/prints', 'POST', {
    ...printInput,
    name: 'Architectural Lamp',
  });
  await api(page, `/api/prints/${completed.id}/complete`, 'POST');
  const draft = await api<Resource>(page, '/api/prints', 'POST', {
    ...printInput,
    name: 'Prototype Housing',
  });

  await page.route('**/api/dashboard?**', async (route) => {
    const response = await route.fetch();
    const body = (await response.json()) as {
      completedCostSeries?: Array<{ date: string }>;
      unfinishedPrints?: Array<{ updatedAt: string }>;
    };
    body.completedCostSeries?.forEach((entry) => (entry.date = '2026-09-10'));
    body.unfinishedPrints?.forEach((entry) => (entry.updatedAt = '2026-09-10T18:54:00.000Z'));
    await route.fulfill({ response, json: body });
  });
  await page.route(`**/api/prints/${completed.id}`, async (route) => {
    const response = await route.fetch();
    const body = (await response.json()) as { snapshot?: { calculatedAt: string } };
    if (body.snapshot) body.snapshot.calculatedAt = '2026-09-10T18:54:00.000Z';
    await route.fulfill({ response, json: body });
  });

  await page.goto('/');
  await expect(page.getByText('Prototype Housing', { exact: true })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(2);
  await expect(page.locator('canvas').first()).toHaveCSS('height', '320px');
  await page.waitForTimeout(1_200);
  await capture(page, 'dashboard.jpg');
  await page.getByRole('heading', { name: 'Unfinished prints' }).scrollIntoViewIfNeeded();
  await capture(page, 'dashboard-unfinished.jpg');

  await page.goto('/prints');
  await expect(page.getByRole('link', { name: 'Prototype Housing', exact: true })).toBeVisible();
  await capture(page, 'prints.jpg');

  await page.goto('/customers');
  await expect(page.getByText('Studio North', { exact: true })).toBeVisible();
  await capture(page, 'customers.jpg');

  await page.goto('/printers');
  await expect(page.getByText('Workshop Prusa MK4', { exact: true })).toBeVisible();
  await capture(page, 'printers.jpg');

  await page.goto('/components');
  await expect(page.getByText('Textured PEI plate', { exact: true })).toBeVisible();
  await capture(page, 'components.jpg');

  await page.goto('/filaments');
  await expect(page.getByText('Polymaker PLA - Teal', { exact: true })).toBeVisible();
  await capture(page, 'filaments.jpg');

  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'General' })).toBeVisible();
  await capture(page, 'settings.jpg');

  await page.getByRole('button', { name: 'Open global search' }).click();
  await page.getByRole('searchbox').fill('Prusa');
  await expect(page.getByText('Workshop Prusa MK4', { exact: true })).toBeVisible();
  await capture(page, 'global-search.jpg');
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Open user menu' }).click();
  await expect(page.getByRole('menuitem', { name: 'Appearance', exact: true })).toBeVisible();
  await capture(page, 'user-menu.jpg');
  await page.keyboard.press('Escape');

  await page.goto('/prints?create=true');
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('New print', { exact: true })).toBeVisible();
  await dialog.getByLabel('Name', { exact: true }).fill('Architectural Lamp Preview');
  await selectOption(page, 'Customers', 'Studio North');
  await selectOption(page, 'Printers', 'Workshop Prusa MK4');
  await selectOption(page, 'Build plate', 'Textured PEI plate');
  await dialog.getByRole('button', { name: 'Next' }).click();
  await selectOption(page, 'Hotend', '0.4 mm high-flow hotend');
  await dialog.getByLabel('Hours', { exact: true }).fill('6');
  await dialog.getByLabel('Minutes', { exact: true }).fill('30');
  await dialog.getByRole('button', { name: 'Next' }).click();
  await dialog.getByRole('button', { name: 'Show popup' }).click();
  await page.getByRole('option', { name: 'Heated enclosure', exact: true }).click();
  await page.keyboard.press('Escape');
  await selectOption(page, 'Filaments', 'Polymaker PLA - Teal');
  await dialog.getByLabel('Used weight (g)', { exact: true }).fill('185');
  await dialog.getByRole('button', { name: 'Next' }).click();
  await expect(dialog.getByText('Total cost', { exact: true })).toBeVisible();
  await capture(page, 'new-print-review.jpg');
  await page.keyboard.press('Escape');

  await page.goto(`/prints/${draft.id}`);
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Prototype Housing');
  await page.getByRole('heading', { name: 'Hotends and durations' }).scrollIntoViewIfNeeded();
  await capture(page, 'print-draft.jpg');

  await page.goto(`/prints/${completed.id}`);
  await expect(
    page.getByText('This snapshot is immutable. You can duplicate it using current inventory.'),
  ).toBeVisible();
  await page
    .getByText('This snapshot is immutable. You can duplicate it using current inventory.')
    .scrollIntoViewIfNeeded();
  await capture(page, 'completed-print.jpg');
  await page.getByRole('heading', { name: 'Stored calculation sources' }).scrollIntoViewIfNeeded();
  await capture(page, 'completed-print-sources.jpg');
});
