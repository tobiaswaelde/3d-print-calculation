import { parsePrintCsv } from '../utils/parse-print-csv';
import { startFakeIntegrations } from '../utils/fake-integrations';
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { assertSafeTestDatabaseUrl } from '../utils/test-database';

// The smoke client intentionally consumes several heterogeneous JSON endpoint shapes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiBody = Record<string, any>;

const testRoot = mkdtempSync(join(tmpdir(), 'print-cost-integration-'));
const databaseUrl = `file:${join(testRoot, 'app.db')}`;
assertSafeTestDatabaseUrl(databaseUrl, testRoot);
const port = 34000 + (process.pid % 1000);
const origin = `http://127.0.0.1:${port}`;
const fake = await startFakeIntegrations();
const environment = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  PORT: String(port),
  NODE_ENV: 'test',
  SPOOLMAN_URL: fake.url,
  SPOOLMAN_AUTHORIZATION: 'Bearer synthetic-secret',
  BAMBUBUDDY_URL: fake.url,
  BAMBUBUDDY_API_KEY: 'synthetic-key',
};

execFileSync('pnpm', ['db:deploy'], { env: environment, stdio: 'inherit' });
const server = spawn(process.execPath, ['.output/server/index.mjs'], {
  env: environment,
  stdio: ['ignore', 'pipe', 'pipe'],
});

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function waitUntilReady() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      if ((await fetch(`${origin}/api/health`)).ok) return;
    } catch {
      // The server is still starting.
    }
    await delay(100);
  }
  throw new Error('Application did not become ready.');
}

async function json(path: string, options: RequestInit = {}, cookie?: string) {
  const response = await fetch(`${origin}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'content-type': 'application/json', origin } : {}),
      ...(cookie ? { cookie } : {}),
      ...options.headers,
    },
  });
  return { response, body: (await response.json()) as ApiBody };
}

try {
  await waitUntilReady();
  const setup = JSON.stringify({
    displayName: 'Integration Test',
    email: 'integration@example.test',
    password: 'integration-password-123',
    locale: 'de-DE',
    currency: 'EUR',
    electricityPrice: '0.32',
  });
  const setupResponses = await Promise.all([
    json('/api/auth/setup', { method: 'POST', body: setup }),
    json('/api/auth/setup', { method: 'POST', body: setup }),
  ]);
  check(
    setupResponses.filter(({ response }) => response.ok).length === 1,
    'Exactly one concurrent setup must succeed.',
  );
  check(
    setupResponses.some(({ response }) => response.status === 409),
    'The losing setup request must return 409.',
  );
  const successfulSetup = setupResponses.find(({ response }) => response.ok)!;
  const cookie = successfulSetup.response.headers.getSetCookie()[0]?.split(';')[0];
  check(cookie, 'Setup must establish a session cookie.');
  const setupSession = await json('/api/auth/session', {}, cookie);
  check(
    setupSession.response.ok && setupSession.body.user?.email === 'integration@example.test',
    `Setup session must be immediately usable (cookie name: ${cookie.split('=')[0]}, response: ${JSON.stringify(setupSession.body)}).`,
  );
  const initialIntegrationSettings = await json('/api/settings/integrations', {}, cookie);
  check(
    initialIntegrationSettings.body.spoolman.enabled &&
      initialIntegrationSettings.body.bambubuddy.enabled &&
      initialIntegrationSettings.body.spoolman.authorizationConfigured &&
      initialIntegrationSettings.body.bambubuddy.apiKeyConfigured &&
      !JSON.stringify(initialIntegrationSettings.body).includes('synthetic-secret') &&
      !JSON.stringify(initialIntegrationSettings.body).includes('synthetic-key'),
    'Legacy environment configuration is visible without exposing credentials.',
  );
  const savedIntegrationSettings = await json(
    '/api/settings/integrations',
    {
      method: 'PATCH',
      body: JSON.stringify({
        spoolman: {
          enabled: true,
          url: fake.url,
          authorization: 'Bearer synthetic-secret',
        },
        bambubuddy: { enabled: true, url: fake.url, apiKey: 'synthetic-key' },
      }),
    },
    cookie,
  );
  check(
    savedIntegrationSettings.response.ok &&
      savedIntegrationSettings.body.spoolman.authorizationConfigured &&
      savedIntegrationSettings.body.bambubuddy.apiKeyConfigured &&
      !JSON.stringify(savedIntegrationSettings.body).includes('synthetic-secret') &&
      !JSON.stringify(savedIntegrationSettings.body).includes('synthetic-key'),
    'Integration settings persist server-side without returning credentials.',
  );
  await json(
    '/api/settings/integrations',
    {
      method: 'PATCH',
      body: JSON.stringify({
        spoolman: { enabled: false, url: fake.url },
        bambubuddy: { enabled: true, url: fake.url },
      }),
    },
    cookie,
  );
  check(
    !(await json('/api/integrations/spoolman', {}, cookie)).body.configured,
    'Disabling an integration in settings takes effect without a restart.',
  );
  await json(
    '/api/settings/integrations',
    {
      method: 'PATCH',
      body: JSON.stringify({
        spoolman: { enabled: true, url: fake.url },
        bambubuddy: { enabled: true, url: fake.url },
      }),
    },
    cookie,
  );

  const customer = await json(
    '/api/customers',
    { method: 'POST', body: JSON.stringify({ name: 'Acme', email: 'hello@example.test', note: '' }) },
    cookie,
  );
  const printer = await json(
    '/api/printers',
    {
      method: 'POST',
      body: JSON.stringify({
        name: 'MK4',
        manufacturer: 'Prusa',
        model: 'MK4S',
        purchasePrice: '1200',
        expectedLifetimeHours: '6000',
        averagePowerWatts: 120,
        note: '',
      }),
    },
    cookie,
  );
  check(
    printer.body.hourlyRate === '0.2',
    `Printer hourly rate must be deterministic: ${JSON.stringify(printer.body)}`,
  );
  const componentManufacturer = await json(
    '/api/manufacturers',
    { method: 'POST', body: JSON.stringify({ name: 'Test', note: '' }) },
    cookie,
  );
  const filamentManufacturer = await json(
    '/api/manufacturers',
    { method: 'POST', body: JSON.stringify({ name: 'Maker', note: '' }) },
    cookie,
  );
  const component = async (name: string, type: string, price: string, lifetime: string) =>
    (
      await json(
        '/api/components',
        {
          method: 'POST',
          body: JSON.stringify({
            name,
            type,
            manufacturerId: componentManufacturer.body.id,
            model: '',
            purchasePrice: price,
            expectedLifetimeHours: lifetime,
            printerIds: [printer.body.id],
            note: '',
          }),
        },
        cookie,
      )
    ).body;
  const hotend = await component('Hotend', 'HOTEND', '100', '2000');
  const plate = await component('Plate', 'BUILD_PLATE', '60', '1200');
  const filament = (
    await json(
      '/api/filaments',
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'PLA',
          manufacturerId: filamentManufacturer.body.id,
          material: 'PLA',
          colorName: 'Black',
          colorHex: '#111111',
          purchasePrice: '29.99',
          netWeightGrams: '1000',
          note: '',
        }),
      },
      cookie,
    )
  ).body;
  check(
    filament.name === 'Maker PLA - Black' &&
      filament.manufacturer === 'Maker' &&
      filament.colorHex === '#111111',
    `Filament must resolve its manufacturer relation: ${JSON.stringify(filament)}`,
  );
  await json(
    `/api/manufacturers/${filamentManufacturer.body.id}`,
    { method: 'PATCH', body: JSON.stringify({ name: 'Maker Updated', note: '' }) },
    cookie,
  );
  const renamedFilament = await json(`/api/filaments/${filament.id}`, {}, cookie);
  check(
    renamedFilament.body.name === 'Maker Updated PLA - Black',
    `Manufacturer renames must update derived filament names: ${JSON.stringify(renamedFilament.body)}`,
  );
  const unusedFilament = await json(
    '/api/filaments',
    {
      method: 'POST',
      body: JSON.stringify({
        name: 'Unused',
        manufacturerId: filamentManufacturer.body.id,
        material: 'PETG',
        colorName: 'Clear',
        colorHex: '#FFFFFF',
        purchasePrice: '24',
        netWeightGrams: '750',
        note: '',
      }),
    },
    cookie,
  );
  const unusedSpools = await json(`/api/spools?filamentId=${unusedFilament.body.id}`, {}, cookie);
  check(unusedSpools.body.items.length === 1, 'New filaments receive an opening spool.');
  const unusedDelete = await json(`/api/filaments/${unusedFilament.body.id}`, { method: 'DELETE' }, cookie);
  check(unusedDelete.response.ok, 'Unused filaments and their pristine opening spool can be deleted.');
  const deletedSpools = await json(
    `/api/spools?filamentId=${unusedFilament.body.id}&includeArchived=true`,
    {},
    cookie,
  );
  check(deletedSpools.body.items.length === 0, 'Deleting an unused filament removes its opening spool.');

  const payload = {
    name: 'Bracket',
    quantity: 3,
    salesValue: '5',
    customerId: customer.body.id,
    printerId: printer.body.id,
    buildPlateId: plate.id,
    hotends: [{ componentId: hotend.id, durationSeconds: 5400 }],
    otherComponentIds: [],
    filaments: [{ filamentId: filament.id, usedGrams: '42.5' }],
    notes: 'integration',
  };
  const preview = await json(
    '/api/prints/calculate',
    { method: 'POST', body: JSON.stringify(payload) },
    cookie,
  );
  check(preview.body.totalCost === '1.782175', 'Preview total must match the independent expected value.');
  const draft = await json('/api/prints', { method: 'POST', body: JSON.stringify(payload) }, cookie);
  check(draft.body.snapshot.totalCost === preview.body.totalCost, 'Draft snapshot must match the preview.');
  check(
    draft.body.quantity === 3 && draft.body.costPerUnit === preview.body.costPerUnit,
    'Quantity and unit cost must match preview.',
  );
  const edited = await json(
    `/api/prints/${draft.body.id}`,
    { method: 'PATCH', body: JSON.stringify({ ...payload, quantity: 5 }) },
    cookie,
  );
  check(
    edited.body.quantity === 5 && edited.body.costPerUnit === '0.356435',
    'Editing quantity must divide the unchanged total.',
  );
  const printing = await json(
    `/api/prints/${draft.body.id}`,
    { method: 'PATCH', body: JSON.stringify({ status: 'PRINTING' }) },
    cookie,
  );
  check(
    printing.body.status === 'PRINTING' && printing.body.completedAt === null,
    'A draft must transition to printing without being done.',
  );
  const printed = await json(
    `/api/prints/${draft.body.id}`,
    { method: 'PATCH', body: JSON.stringify({ status: 'PRINTED' }) },
    cookie,
  );
  check(printed.body.status === 'PRINTED', 'A printing job must transition to printed.');
  const shipped = await json(
    `/api/prints/${draft.body.id}`,
    { method: 'PATCH', body: JSON.stringify({ status: 'SHIPPED' }) },
    cookie,
  );
  check(shipped.body.status === 'SHIPPED', 'A printed job must transition to shipped.');
  const shippedList = await json('/api/prints?status=SHIPPED', {}, cookie);
  check(
    shippedList.body.items?.some((item: { id: string }) => item.id === draft.body.id),
    'Print lists must filter by every workflow status.',
  );
  const completed = await json(`/api/prints/${draft.body.id}/complete`, { method: 'POST' }, cookie);
  check(completed.body.status === 'DONE' && completed.body.completedAt, 'A print must transition to done.');
  const paid = await json(
    `/api/prints/${draft.body.id}`,
    { method: 'PATCH', body: JSON.stringify({ paid: true }) },
    cookie,
  );
  check(typeof paid.body.paidAt === 'string', 'Marking a print as paid must store paidAt.');
  const unpaid = await json(
    `/api/prints/${draft.body.id}`,
    { method: 'PATCH', body: JSON.stringify({ paid: false }) },
    cookie,
  );
  check(unpaid.body.paidAt === null, 'Marking a print as unpaid must clear paidAt.');
  const reopened = await json(
    `/api/prints/${draft.body.id}`,
    { method: 'PATCH', body: JSON.stringify({ status: 'DRAFT' }) },
    cookie,
  );
  check(reopened.response.status === 409, 'A finalized print must not return to draft.');
  const immutable = await json(
    `/api/prints/${draft.body.id}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
    cookie,
  );
  check(immutable.response.status === 409, 'Completed print must reject updates.');
  const duplicate = await json(`/api/prints/${draft.body.id}/duplicate`, { method: 'POST' }, cookie);
  check(
    completed.body.snapshot.quantity === 5 && completed.body.snapshot.costPerUnit === '0.356435',
    'Completion must freeze unit values.',
  );
  check(duplicate.body.quantity === 5, 'Duplication must preserve quantity.');
  check(
    completed.body.salesValue === '5' && duplicate.body.salesValue === null,
    'Completion freezes sales value; duplication clears it.',
  );
  check(duplicate.body.status === 'DRAFT', 'Duplicate must be an editable draft.');
  const dashboard = await json('/api/dashboard?period=30d', {}, cookie);
  check(
    dashboard.body.kpis.activeDrafts === 1 && dashboard.body.kpis.completedPrints === 1,
    'Dashboard must separate drafts and completed prints.',
  );
  check(
    dashboard.body.kpis.totalCost === completed.body.totalCost,
    'Dashboard totals must reconcile with stored snapshots.',
  );
  const actualInput = {
    status: 'FAILED',
    failureReason: 'Adhesion',
    durationSeconds: 1800,
    filaments: completed.body.filamentUsages.map((line: { id: string }) => ({
      usageId: line.id,
      usedGrams: '10',
    })),
  };
  const draftOutcome = await json(
    `/api/prints/${duplicate.body.id}/outcome`,
    { method: 'POST', body: JSON.stringify(actualInput) },
    cookie,
  );
  check(draftOutcome.response.status === 409, 'Drafts must reject outcomes.');
  const unauthenticatedOutcome = await json(`/api/prints/${completed.body.id}/outcome`, {
    method: 'POST',
    body: JSON.stringify(actualInput),
  });
  check(unauthenticatedOutcome.response.status === 401, 'Outcomes require authentication.');
  const missingReason = await json(
    `/api/prints/${completed.body.id}/outcome`,
    { method: 'POST', body: JSON.stringify({ ...actualInput, failureReason: '' }) },
    cookie,
  );
  check(missingReason.response.status === 422, 'Failures require a reason.');
  const invalidUsage = await json(
    `/api/prints/${completed.body.id}/outcome`,
    {
      method: 'POST',
      body: JSON.stringify({ ...actualInput, filaments: [{ usageId: 'unknown', usedGrams: '10' }] }),
    },
    cookie,
  );
  check(invalidUsage.response.status === 422, 'Actual usage must reference planned usage rows.');
  const actual = await json(
    `/api/prints/${completed.body.id}/outcome`,
    { method: 'POST', body: JSON.stringify(actualInput) },
    cookie,
  );
  check(
    actual.response.ok && actual.body.outcome.costs.totalCost === '0.4691',
    'Actual costs use frozen rates and actual quantities.',
  );
  const again = await json(
    `/api/prints/${completed.body.id}/outcome`,
    { method: 'POST', body: JSON.stringify(actualInput) },
    cookie,
  );
  check(
    JSON.stringify(again.body.outcome) === JSON.stringify(actual.body.outcome),
    'Repeated outcomes must be idempotent.',
  );
  const changedOutcome = await json(
    `/api/prints/${completed.body.id}/outcome`,
    { method: 'POST', body: JSON.stringify({ ...actualInput, durationSeconds: 1 }) },
    cookie,
  );
  check(changedOutcome.response.status === 409, 'An outcome cannot be silently rewritten.');
  check(
    JSON.stringify(actual.body.snapshot) === JSON.stringify(completed.body.snapshot),
    'Outcomes never change planned snapshots.',
  );
  const retry = await json(`/api/prints/${completed.body.id}/retry`, { method: 'POST' }, cookie);
  check(
    retry.body.retryOf.id === completed.body.id &&
      retry.body.status === 'DRAFT' &&
      retry.body.outcome === null &&
      retry.body.quantity === 5,
    'Retry creates a linked current-price draft.',
  );
  const sourceWithRetry = await json(`/api/prints/${completed.body.id}`, {}, cookie);
  check(
    sourceWithRetry.body.retries.some((job: { id: string }) => job.id === retry.body.id),
    'The source exposes its retries.',
  );
  const failedDashboard = await json('/api/dashboard?period=30d', {}, cookie);
  check(
    failedDashboard.body.kpis.failures === 1 &&
      failedDashboard.body.kpis.successes === 0 &&
      failedDashboard.body.kpis.successRate === '0' &&
      failedDashboard.body.kpis.failedCost === '0.4691',
    'Failed outcomes contribute waste cost, not successes.',
  );
  const failedList = await json('/api/prints?outcome=FAILED', {}, cookie);
  check(
    failedList.body.total === 1 && failedList.body.items[0].id === completed.body.id,
    'Outcome filters select only matching records.',
  );
  const pendingList = await json('/api/prints?outcome=PENDING', {}, cookie);
  check(pendingList.body.total === 0, 'Drafts are not completed prints with pending outcomes.');
  const spoolId = completed.body.filamentUsages[0].spoolId;
  const consumedSpool = await json(`/api/spools/${spoolId}`, {}, cookie);
  check(
    consumedSpool.body.remainingGrams === '990' &&
      consumedSpool.body.movements.filter((entry: { kind: string }) => entry.kind === 'PRINT').length === 1,
    'Repeated outcomes consume native stock once.',
  );
  const correctionInput = {
    ...actualInput,
    expectedRevision: 1,
    operationKey: '11111111-1111-4111-8111-111111111111',
    note: 'Verified weight',
    filaments: actualInput.filaments.map((line: { usageId: string }) => ({ ...line, usedGrams: '12' })),
  };
  const correction = await json(
    `/api/prints/${completed.body.id}/outcome/correct`,
    { method: 'POST', body: JSON.stringify(correctionInput) },
    cookie,
  );
  check(
    correction.response.ok &&
      correction.body.outcome.revision === 2 &&
      correction.body.outcome.history[0].costs.totalCost === '0.4691',
    'Corrections append a revision while preserving original actual costs.',
  );
  const correctionRetry = await json(
    `/api/prints/${completed.body.id}/outcome/correct`,
    { method: 'POST', body: JSON.stringify(correctionInput) },
    cookie,
  );
  check(correctionRetry.body.outcome.revision === 2, 'Correction retries must be idempotent.');
  check(
    (await json(`/api/spools/${spoolId}`, {}, cookie)).body.remainingGrams === '988',
    'Corrections book only the consumption delta.',
  );
  const staleCorrection = await json(
    `/api/prints/${completed.body.id}/outcome/correct`,
    {
      method: 'POST',
      body: JSON.stringify({ ...correctionInput, operationKey: '22222222-2222-4222-8222-222222222222' }),
    },
    cookie,
  );
  check(staleCorrection.response.status === 409, 'Stale concurrent corrections must be rejected.');
  const stockOperation = {
    kind: 'CORRECTION',
    grams: '-1000',
    note: 'Physical count',
    operationKey: '33333333-3333-4333-8333-333333333333',
  };
  const stockCorrection = await json(
    `/api/spools/${spoolId}/movements`,
    { method: 'POST', body: JSON.stringify(stockOperation) },
    cookie,
  );
  check(stockCorrection.body.remainingGrams === '-12', 'Negative factual balances must remain visible.');
  await json(
    `/api/spools/${spoolId}/movements`,
    { method: 'POST', body: JSON.stringify(stockOperation) },
    cookie,
  );
  check(
    (await json(`/api/spools/${spoolId}`, {}, cookie)).body.remainingGrams === '-12',
    'Manual movement retries must be idempotent.',
  );
  const unavailable = await json(
    '/api/prints/calculate',
    { method: 'POST', body: JSON.stringify(payload) },
    cookie,
  );
  check(unavailable.response.status === 422, 'Empty or negative spools cannot enter a new calculation.');
  await json(
    `/api/filaments/${filament.id}/stock`,
    { method: 'PATCH', body: JSON.stringify({ minimumStockGrams: '100' }) },
    cookie,
  );
  check(
    (await json('/api/dashboard', {}, cookie)).body.lowStock.some(
      (entry: { filamentId: string }) => entry.filamentId === filament.id,
    ),
    'Dashboard reports low stock including negative balances.',
  );
  const extraSpool = await json(
    '/api/spools',
    {
      method: 'POST',
      body: JSON.stringify({
        code: 'REPEATING-RATE',
        filamentId: filament.id,
        purchasePrice: '1',
        initialNetWeightGrams: '3',
      }),
    },
    cookie,
  );
  const otherSpool = await json(
    '/api/spools',
    {
      method: 'POST',
      body: JSON.stringify({
        code: 'SECOND-SPOOL',
        filamentId: filament.id,
        purchasePrice: '2',
        initialNetWeightGrams: '100',
      }),
    },
    cookie,
  );
  const multiSpoolPayload = {
    ...payload,
    filaments: [
      { filamentId: filament.id, spoolId: extraSpool.body.id, usedGrams: '1' },
      { filamentId: filament.id, spoolId: otherSpool.body.id, usedGrams: '2' },
    ],
  };
  const multiPreview = await json(
    '/api/prints/calculate',
    { method: 'POST', body: JSON.stringify(multiSpoolPayload) },
    cookie,
  );
  const multiDraft = await json(
    '/api/prints',
    { method: 'POST', body: JSON.stringify(multiSpoolPayload) },
    cookie,
  );
  check(
    multiDraft.response.ok &&
      multiDraft.body.totalCost === multiPreview.body.totalCost &&
      multiDraft.body.filamentUsages.length === 2,
    'Distinct spools of one filament retain exact rates and preview totals.',
  );
  const availableSpools = await json(
    `/api/spools?filamentId=${filament.id}&availableOnly=true&pageSize=1`,
    {},
    cookie,
  );
  check(
    availableSpools.body.total === 2 && availableSpools.body.items.length === 1,
    'Available-spool pagination counts only usable stock.',
  );
  const qr = await fetch(`${origin}/api/spools/${extraSpool.body.id}/qr`, { headers: { cookie } });
  check(
    qr.ok && qr.headers.get('content-type')?.includes('image/svg+xml') && (await qr.text()).includes('<svg'),
    'QR labels are authenticated SVG output.',
  );
  check(
    (await fetch(`${origin}/api/spools/${extraSpool.body.id}/qr`)).status === 401,
    'QR output requires authentication.',
  );
  await json(
    `/api/spools/${extraSpool.body.id}/archive`,
    { method: 'POST', body: JSON.stringify({ archived: true }) },
    cookie,
  );
  const archivedSpool = await json(
    '/api/prints/calculate',
    { method: 'POST', body: JSON.stringify(multiSpoolPayload) },
    cookie,
  );
  check(archivedSpool.response.status === 422, 'Archived spools are unavailable to drafts.');
  const salesDraft = await json(
    '/api/prints',
    {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        name: 'Negative margin',
        salesValue: '0.1',
        quantity: 2,
        filaments: [{ filamentId: filament.id, spoolId: otherSpool.body.id, usedGrams: '1' }],
      }),
    },
    cookie,
  );
  const salesCompleted = await json(`/api/prints/${salesDraft.body.id}/complete`, { method: 'POST' }, cookie);
  const salesOutcome = await json(
    `/api/prints/${salesDraft.body.id}/outcome`,
    {
      method: 'POST',
      body: JSON.stringify({
        status: 'SUCCESS',
        durationSeconds: 3600,
        filaments: salesCompleted.body.filamentUsages.map((line: { id: string }) => ({
          usageId: line.id,
          usedGrams: '1',
        })),
      }),
    },
    cookie,
  );
  check(
    salesOutcome.body.financials.realizedMargin === '-0.2584' &&
      salesOutcome.body.financials.realizedMarginPerUnit === '-0.1292',
    'Realized margins support loss-making successful runs and per-unit amounts.',
  );
  const revenueDashboard = await json('/api/dashboard', {}, cookie);
  check(
    revenueDashboard.body.kpis.revenue === '0.1' && revenueDashboard.body.kpis.margin === '-0.2584',
    'Only successful explicit sales values enter revenue and margin totals.',
  );

  await json(
    `/api/prints/${salesDraft.body.id}`,
    { method: 'PATCH', body: JSON.stringify({ archived: true }) },
    cookie,
  );
  const archivedRevenue = await json('/api/dashboard', {}, cookie);
  check(
    archivedRevenue.body.kpis.revenue === '0' && archivedRevenue.body.kpis.margin === '0',
    'Archived successful prints are excluded from financial totals.',
  );
  const series = await json(
    '/api/series',
    {
      method: 'POST',
      body: JSON.stringify({ name: 'Bracket batch', customerId: customer.body.id, targetQuantity: 2 }),
    },
    cookie,
  );
  check(series.response.ok, 'Series creation succeeds.');
  const seriesDraft = await json(
    '/api/prints',
    {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        quantity: 2,
        customerId: null,
        seriesId: series.body.id,
        filaments: [{ filamentId: filament.id, spoolId: otherSpool.body.id, usedGrams: '1' }],
      }),
    },
    cookie,
  );
  check(seriesDraft.body.customerId === customer.body.id, 'Series customer is inherited.');
  await json(
    `/api/prints/${seriesDraft.body.id}`,
    { method: 'PATCH', body: JSON.stringify({ status: 'DONE' }) },
    cookie,
  );
  const seriesDone = await json(`/api/prints/${seriesDraft.body.id}`, {}, cookie);
  check(
    (await json(`/api/series/${series.body.id}`, {}, cookie)).body.summary.pending === 1,
    'Unrecorded results remain pending.',
  );
  const successfulSeries = await json(
    `/api/prints/${seriesDraft.body.id}/outcome`,
    {
      method: 'POST',
      body: JSON.stringify({
        status: 'SUCCESS',
        durationSeconds: 60,
        filaments: seriesDone.body.filamentUsages.map((usage: { id: string }) => ({
          usageId: usage.id,
          usedGrams: '1',
        })),
      }),
    },
    cookie,
  );
  check(successfulSeries.response.ok, 'Series result succeeds.');
  const progress = await json(`/api/series/${series.body.id}`, {}, cookie);
  check(
    progress.body.status === 'COMPLETED' && progress.body.summary.producedQuantity === 2,
    'Only successful quantity completes the series.',
  );
  const repeat = await json(`/api/prints/${seriesDraft.body.id}/repeat`, { method: 'POST' }, cookie);
  check(
    repeat.body.repeatOf?.id === seriesDraft.body.id &&
      repeat.body.retryOf === null &&
      repeat.body.salesValue === null &&
      repeat.body.seriesId === series.body.id,
    'Repeat retains intent with separate relationship and no inherited sale.',
  );
  const history = await json(
    `/api/customers/${customer.body.id}/history?seriesId=${series.body.id}&pageSize=1`,
    {},
    cookie,
  );
  check(
    history.body.items.length === 1 &&
      history.body.total === 2 &&
      history.body.summary.producedQuantity === 2 &&
      history.body.summary.drafts === 1,
    'History aggregates across bounded pages with the same filters.',
  );
  const reopenedSeries = await json(
    `/api/series/${series.body.id}/state`,
    { method: 'POST', body: JSON.stringify({ status: 'OPEN' }) },
    cookie,
  );
  check(
    reopenedSeries.body.status === 'OPEN' && !reopenedSeries.body.autoComplete,
    'Manual reopening overrides automatic completion.',
  );
  await json(
    `/api/prints/${seriesDraft.body.id}`,
    { method: 'PATCH', body: JSON.stringify({ archived: true }) },
    cookie,
  );
  check(
    (await json(`/api/series/${series.body.id}`, {}, cookie)).body.summary.producedQuantity === 0,
    'Archived runs leave active progress without rewriting snapshots.',
  );
  const csvResponse = await fetch(
    `${origin}/api/prints/export?seriesId=${series.body.id}&includeArchived=true`,
    { headers: { cookie } },
  );
  const csvText = await csvResponse.text();
  check(
    csvResponse.ok &&
      csvText.includes('planned_cost_per_unit') &&
      csvText.includes(seriesDraft.body.id) &&
      !csvText.includes(repeat.body.id),
    'CSV includes matching completed snapshots only.',
  );
  check((await fetch(`${origin}/api/prints/export`)).status === 401, 'CSV requires authentication.');
  check(
    (await json(`/api/prints/${repeat.body.id}/report`, {}, cookie)).response.status === 409,
    'Drafts cannot produce reports.',
  );
  const parsedCsv = parsePrintCsv(csvText);
  check(
    parsedCsv.rows.length === 1 &&
      parsedCsv.rows[0]!.planned_cost === seriesDone.body.totalCost &&
      parsedCsv.rows[0]!.quantity === '2',
    'Parsed CSV values reconcile exactly with the saved DTO.',
  );
  await json(
    `/api/printers/${printer.body.id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ ...printer.body, name: 'Renamed current printer', purchasePrice: '9999' }),
    },
    cookie,
  );
  const historicalCsv = await (
    await fetch(`${origin}/api/prints/export?seriesId=${series.body.id}&includeArchived=true`, {
      headers: { cookie },
    })
  ).text();
  check(
    historicalCsv === csvText,
    'Inventory name and price edits do not reinterpret historical CSV snapshots.',
  );
  const unsafeName = '=HYPERLINK("test")\r\nnext';
  const escapedDraft = await json(
    '/api/prints',
    {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        name: unsafeName,
        filaments: [{ filamentId: filament.id, spoolId: otherSpool.body.id, usedGrams: '1' }],
      }),
    },
    cookie,
  );
  await json(`/api/prints/${escapedDraft.body.id}/complete`, { method: 'POST' }, cookie);
  const escapedCsv = parsePrintCsv(
    await (
      await fetch(`${origin}/api/prints/export?search=${encodeURIComponent('HYPERLINK')}`, {
        headers: { cookie },
      })
    ).text(),
  );
  check(
    escapedCsv.rows.length === 1 &&
      escapedCsv.rows[0]!.name === "'" + unsafeName &&
      escapedCsv.rows[0]!.outcome === '',
    'CSV parsing preserves quotes/newlines, escapes formulas, and leaves missing outcomes blank.',
  );
  check(
    parsePrintCsv(
      await (
        await fetch(`${origin}/api/prints/export?search=does-not-exist`, { headers: { cookie } })
      ).text(),
    ).rows.length === 0,
    'Empty exports produce a valid header-only file.',
  );
  const report = await json(`/api/prints/${seriesDraft.body.id}/report`, {}, cookie);
  check(
    report.body.totalCost === seriesDone.body.totalCost &&
      report.body.snapshot.totalCost === seriesDone.body.snapshot.totalCost,
    'Reports reuse immutable persisted totals.',
  );
  const historical = await json(`/api/prints/${completed.body.id}`, {}, cookie);
  check(
    JSON.stringify(historical.body.snapshot) === JSON.stringify(completed.body.snapshot),
    'Stock operations do not rewrite planned snapshots.',
  );
  const globalSearch = await json('/api/search?q=Bracket', {}, cookie);
  check(
    globalSearch.body.groups?.some(
      (group: { type: string; items: { id: string }[] }) =>
        group.type === 'prints' && group.items.some((item) => item.id === draft.body.id),
    ),
    'Global search must find matching prints.',
  );

  const locked = await json(
    '/api/settings',
    {
      method: 'PATCH',
      body: JSON.stringify({ currency: 'USD', defaultLocale: 'de-DE', electricityPricePerKwh: '0.32' }),
    },
    cookie,
  );
  check(locked.response.status === 409, 'Currency must lock after cost-bearing data exists.');
  const referencedDelete = await json(`/api/printers/${printer.body.id}`, { method: 'DELETE' }, cookie);
  check(referencedDelete.response.status === 409, 'Referenced master data must not be hard-deleted.');
  const referencedFilamentDelete = await json(`/api/filaments/${filament.id}`, { method: 'DELETE' }, cookie);
  check(referencedFilamentDelete.response.status === 409, 'Used filaments must not be hard-deleted.');
  const referencedManufacturerDelete = await json(
    `/api/manufacturers/${componentManufacturer.body.id}`,
    { method: 'DELETE' },
    cookie,
  );
  check(
    referencedManufacturerDelete.response.status === 409,
    'Referenced manufacturers must not be hard-deleted.',
  );

  const sm = (body: unknown) =>
    json('/api/integrations/spoolman', { method: 'POST', body: JSON.stringify(body) }, cookie);
  const smPreview = await json('/api/integrations/spoolman?view=preview', {}, cookie);
  check(smPreview.body.items.length === 1, 'Remote spool import is previewed.');
  check(
    (await sm({ action: 'IMPORT', data: { remoteId: 101, previewHash: '0'.repeat(64) } })).response.status ===
      409,
    'Changed remote data requires a fresh preview.',
  );
  const imported = await sm({
    action: 'IMPORT',
    data: { remoteId: 101, previewHash: smPreview.body.items[0].previewHash },
  });
  check(imported.response.ok, `Import succeeds: ${JSON.stringify(imported.body)}`);
  const importAgain = await sm({
    action: 'IMPORT',
    data: { remoteId: 101, previewHash: smPreview.body.items[0].previewHash },
  });
  check(importAgain.body.id === imported.body.id, 'Repeated imports preserve stable local identity.');
  let remoteSpool = (await json(`/api/spools/${imported.body.id}`, {}, cookie)).body;
  check(
    remoteSpool.stockAuthority === 'SPOOLMAN_READ_ONLY' &&
      remoteSpool.remainingGrams === '900' &&
      remoteSpool.movementCount === 0,
    'Remote balances are cached without native receipt fabrication.',
  );
  check(
    (
      await json(
        `/api/spools/${remoteSpool.id}/movements`,
        {
          method: 'POST',
          body: JSON.stringify({
            kind: 'RECEIPT',
            grams: '1',
            note: 'blocked',
            operationKey: crypto.randomUUID(),
          }),
        },
        cookie,
      )
    ).response.status === 409,
    'Spoolman-owned stock rejects native movements.',
  );
  fake.state.spool.remaining_weight = null;
  await sm({ action: 'SYNC', spoolId: remoteSpool.id });
  check(
    (await json(`/api/spools/${remoteSpool.id}`, {}, cookie)).body.remainingGrams === null,
    'Unknown remote weight is not converted to zero.',
  );
  fake.state.spool.remaining_weight = -2;
  await sm({ action: 'SYNC', spoolId: remoteSpool.id });
  check(
    (await json(`/api/spools/${remoteSpool.id}`, {}, cookie)).body.remainingGrams === '-2',
    'Negative remote weight remains visible.',
  );
  fake.state.spool.remaining_weight = 900;
  await sm({ action: 'SYNC', spoolId: remoteSpool.id });
  fake.state.mode = 'offline';
  await sm({ action: 'SYNC', spoolId: remoteSpool.id });
  remoteSpool = (await json(`/api/spools/${remoteSpool.id}`, {}, cookie)).body;
  check(
    remoteSpool.stale && remoteSpool.remainingGrams === '900',
    'Outages retain cached inventory with an explicit stale warning.',
  );
  const remotePayload = {
    ...payload,
    filaments: [{ filamentId: remoteSpool.filamentId, spoolId: remoteSpool.id, usedGrams: '2' }],
  };
  const remoteDraft = await json(
    '/api/prints',
    { method: 'POST', body: JSON.stringify(remotePayload) },
    cookie,
  );
  check(remoteDraft.response.ok, 'Cached remote metadata permits manual calculations during outages.');
  const remoteCompleted = await json(
    `/api/prints/${remoteDraft.body.id}/complete`,
    { method: 'POST' },
    cookie,
  );
  const remoteOutcome = {
    status: 'SUCCESS',
    durationSeconds: 60,
    filaments: remoteCompleted.body.filamentUsages.map((line: { id: string }) => ({
      usageId: line.id,
      usedGrams: '2',
    })),
  };
  await json(
    `/api/prints/${remoteDraft.body.id}/outcome`,
    { method: 'POST', body: JSON.stringify(remoteOutcome) },
    cookie,
  );
  check(
    (await json(`/api/spools/${remoteSpool.id}`, {}, cookie)).body.movementCount === 0,
    'Read-only outcomes create no duplicate deductions.',
  );
  fake.state.mode = 'ok';
  const optInPreview = await json('/api/integrations/spoolman?view=preview', {}, cookie);
  await sm({
    action: 'IMPORT',
    data: {
      remoteId: 101,
      previewHash: optInPreview.body.items[0].previewHash,
      authority: 'EZPRINT_CONSUMPTION',
    },
  });
  const consuming = await json(
    '/api/prints',
    { method: 'POST', body: JSON.stringify(remotePayload) },
    cookie,
  );
  const consumingDone = await json(`/api/prints/${consuming.body.id}/complete`, { method: 'POST' }, cookie);
  await json(
    `/api/prints/${consuming.body.id}/outcome`,
    {
      method: 'POST',
      body: JSON.stringify({
        ...remoteOutcome,
        filaments: consumingDone.body.filamentUsages.map((line: { id: string }) => ({
          usageId: line.id,
          usedGrams: '2',
        })),
      }),
    },
    cookie,
  );
  const op = (await json('/api/integrations/spoolman', {}, cookie)).body.operations[0];
  check(op.state === 'PENDING', 'Opt-in consumption persists an operation before sending.');
  await Promise.all([
    sm({ action: 'OPERATION', data: { operationId: op.id, action: 'SEND' } }),
    sm({ action: 'OPERATION', data: { operationId: op.id, action: 'SEND' } }),
  ]);
  check(fake.state.consumptionRequests === 1, 'Concurrent retries submit additive usage exactly once.');
  fake.state.mode = 'redirect';
  const redirect = await json('/api/integrations/spoolman?view=preview', {}, cookie);
  check(
    redirect.response.status === 502 &&
      fake.state.redirectedRequests === 0 &&
      !JSON.stringify(redirect.body).includes(fake.url),
    'Redirects are blocked without exposing server URLs.',
  );
  fake.state.mode = 'malformed';
  check(
    (await json('/api/integrations/spoolman?view=preview', {}, cookie)).response.status === 502,
    'Malformed remote payloads fail safely.',
  );
  fake.state.mode = 'ok';
  const bb = (body: unknown) =>
    json('/api/integrations/bambubuddy', { method: 'POST', body: JSON.stringify(body) }, cookie);
  check(
    (await bb({ action: 'LINK_PRINTER', printerId: printer.body.id, remoteId: 7 })).response.ok,
    'Explicit printer linking succeeds.',
  );
  const bambuStatus = await json('/api/integrations/bambubuddy', {}, cookie);
  check(
    !JSON.stringify(bambuStatus.body).includes('synthetic-secret') &&
      !JSON.stringify(bambuStatus.body).includes(fake.url),
    'Upstream printer credentials and server configuration are stripped.',
  );
  check(
    bambuStatus.body.printers[0].state.trays[0].spoolId === remoteSpool.id,
    'AMS proposals prefer shared stable Spoolman IDs.',
  );
  const nativeBefore = (await json(`/api/spools/${otherSpool.body.id}`, {}, cookie)).body.remainingGrams;
  const bambuDraft = await json(
    '/api/prints',
    {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        filaments: [{ filamentId: filament.id, spoolId: otherSpool.body.id, usedGrams: '2' }],
      }),
    },
    cookie,
  );
  const bambuDone = await json(`/api/prints/${bambuDraft.body.id}/complete`, { method: 'POST' }, cookie);
  await bb({ action: 'ATTACH', printId: bambuDraft.body.id, remoteLogId: 401 });
  let linkedBambu = (await json(`/api/integrations/bambubuddy?printId=${bambuDraft.body.id}`, {}, cookie))
    .body;
  check(linkedBambu.link.terminal === null, 'IDLE never supplies a successful result.');
  fake.state.logs[0]!.status = 'completed';
  fake.state.logs[0]!.completed_at = '2026-09-11T01:00:00Z';
  await bb({ action: 'SYNC_PRINT', printId: bambuDraft.body.id });
  linkedBambu = (await json(`/api/integrations/bambubuddy?printId=${bambuDraft.body.id}`, {}, cookie)).body;
  const importBambu = {
    action: 'IMPORT',
    printId: bambuDraft.body.id,
    previewHash: linkedBambu.link.previewHash,
    outcome: {
      status: 'SUCCESS',
      durationSeconds: 60,
      filaments: bambuDone.body.filamentUsages.map((line: { id: string }) => ({
        usageId: line.id,
        usedGrams: '2',
      })),
    },
  };
  const importedBambu = await bb(importBambu);
  check(importedBambu.response.ok, `Terminal import succeeds: ${JSON.stringify(importedBambu.body)}`);
  check((await bb(importBambu)).response.ok, 'Repeated terminal imports are idempotent.');
  check(
    Number((await json(`/api/spools/${otherSpool.body.id}`, {}, cookie)).body.remainingGrams) ===
      Number(nativeBefore) - 2,
    'Bambu outcomes deduct native usage once.',
  );
  check(
    (await bb({ action: 'ATTACH', printId: repeat.body.id, remoteLogId: 401 })).response.status === 409,
    'One remote log cannot attach to multiple prints.',
  );
  fake.state.logs.push({ ...fake.state.logs[0]!, id: 402 });
  const remoteBambuDraft = await json(
    '/api/prints',
    { method: 'POST', body: JSON.stringify(remotePayload) },
    cookie,
  );
  const remoteBambuDone = await json(
    `/api/prints/${remoteBambuDraft.body.id}/complete`,
    { method: 'POST' },
    cookie,
  );
  await bb({ action: 'ATTACH', printId: remoteBambuDraft.body.id, remoteLogId: 402 });
  const remoteBambuLink = (
    await json(`/api/integrations/bambubuddy?printId=${remoteBambuDraft.body.id}`, {}, cookie)
  ).body.link;
  const opsBefore = (await json('/api/integrations/spoolman', {}, cookie)).body.operations.length;
  check(
    (
      await bb({
        action: 'IMPORT',
        printId: remoteBambuDraft.body.id,
        previewHash: remoteBambuLink.previewHash,
        outcome: {
          status: 'SUCCESS',
          durationSeconds: 60,
          filaments: remoteBambuDone.body.filamentUsages.map((line: { id: string }) => ({
            usageId: line.id,
            usedGrams: '2',
          })),
        },
      })
    ).response.ok,
    'Bambu result import also supports remote-owned stock.',
  );
  const correctedRemote = await json(
    `/api/prints/${remoteBambuDraft.body.id}/outcome/correct`,
    {
      method: 'POST',
      body: JSON.stringify({
        status: 'SUCCESS',
        durationSeconds: 60,
        filaments: remoteBambuDone.body.filamentUsages.map((line: { id: string }) => ({
          usageId: line.id,
          usedGrams: '3',
        })),
        note: 'Confirmed measured usage',
        expectedRevision: 1,
        operationKey: crypto.randomUUID(),
      }),
    },
    cookie,
  );
  check(
    correctedRemote.response.ok &&
      (await json('/api/integrations/spoolman', {}, cookie)).body.operations.length === opsBefore,
    'Bambu results and corrections never send duplicate Spoolman consumption.',
  );
  const ambiguousDraft = await json(
    '/api/prints',
    { method: 'POST', body: JSON.stringify(remotePayload) },
    cookie,
  );
  const ambiguousDone = await json(
    `/api/prints/${ambiguousDraft.body.id}/complete`,
    { method: 'POST' },
    cookie,
  );
  await json(
    `/api/prints/${ambiguousDraft.body.id}/outcome`,
    {
      method: 'POST',
      body: JSON.stringify({
        status: 'SUCCESS',
        durationSeconds: 60,
        filaments: ambiguousDone.body.filamentUsages.map((line: { id: string }) => ({
          usageId: line.id,
          usedGrams: '2',
        })),
      }),
    },
    cookie,
  );
  const uncertain = (await json('/api/integrations/spoolman', {}, cookie)).body.operations.find(
    (entry: { state: string }) => entry.state === 'PENDING',
  );
  fake.state.mode = 'ambiguous';
  await sm({ action: 'OPERATION', data: { operationId: uncertain.id, action: 'SEND' } });
  const requestsAfterUncertain = fake.state.consumptionRequests;
  await sm({ action: 'OPERATION', data: { operationId: uncertain.id, action: 'SEND' } });
  check(
    fake.state.consumptionRequests === requestsAfterUncertain,
    'Ambiguous writes are never blindly retried.',
  );
  fake.state.mode = 'ok';
  check(
    (await json('/api/integrations/spoolman', {}, cookie)).body.operations.find(
      (entry: { id: string }) => entry.id === uncertain.id,
    ).state === 'UNKNOWN',
    'Uncertain operation remains visible for reconciliation.',
  );
  check(
    (
      await sm({
        action: 'UNLINK',
        data: { spoolId: remoteSpool.id, ownership: 'NATIVE', openingBalance: '800' },
      })
    ).response.status === 409,
    'Unresolved outbound writes block unlinking.',
  );
  await sm({ action: 'OPERATION', data: { operationId: uncertain.id, action: 'CONFIRM_APPLIED' } });
  fake.state.mode = 'timeout';
  const timeoutStart = Date.now();
  const timeoutResponse = await json('/api/integrations/spoolman?view=preview', {}, cookie);
  check(
    timeoutResponse.response.status === 502 && Date.now() - timeoutStart < 3800,
    'Remote requests use a bounded timeout.',
  );
  fake.state.mode = 'missing';
  await sm({ action: 'SYNC', spoolId: remoteSpool.id });
  check(
    (await json(`/api/spools/${remoteSpool.id}`, {}, cookie)).body.remoteState === 'MISSING',
    'Remote deletions preserve local history and expose missing state.',
  );
  fake.state.mode = 'ok';
  await sm({
    action: 'UNLINK',
    data: { spoolId: remoteSpool.id, ownership: 'NATIVE', openingBalance: '800' },
  });
  const unlinked = (await json(`/api/spools/${remoteSpool.id}`, {}, cookie)).body;
  check(
    unlinked.stockAuthority === 'NATIVE' && unlinked.remainingGrams === '800' && unlinked.spoolmanId === 101,
    'Explicit unlink preserves identity and reconciles native opening stock.',
  );
  check(fake.state.authenticated > 0, 'Remote calls authenticate through server-only credentials.');

  execFileSync('pnpm', ['db:reset-password', 'integration@example.test', 'new-integration-password-456'], {
    env: environment,
    stdio: 'ignore',
  });
  check(
    (await json('/api/auth/session', {}, cookie)).body.user === null,
    'Password reset must invalidate sessions.',
  );
  const oldLogin = await json('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'integration@example.test', password: 'integration-password-123' }),
  });
  check(oldLogin.response.status === 401, 'Old password must stop working.');
  const newLogin = await json('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'integration@example.test', password: 'new-integration-password-456' }),
  });
  check(newLogin.response.ok, 'New password must authenticate.');
  const newCookie = newLogin.response.headers.getSetCookie()[0]?.split(';')[0];
  await json('/api/auth/logout', { method: 'POST' }, newCookie);
  check(
    (await json('/api/auth/session', {}, newCookie)).body.user === null,
    'Logout must invalidate the session.',
  );

  process.stdout.write('API integration smoke test passed.\n');
} finally {
  fake.close();
  server.kill('SIGTERM');
  await Promise.race([new Promise((resolve) => server.once('exit', resolve)), delay(5000)]);
  rmSync(testRoot, { recursive: true, force: true });
}
