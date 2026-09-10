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
const environment = { ...process.env, DATABASE_URL: databaseUrl, PORT: String(port), NODE_ENV: 'test' };

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
          color: 'Black',
          purchasePrice: '29.99',
          netWeightGrams: '1000',
          note: '',
        }),
      },
      cookie,
    )
  ).body;
  check(
    filament.name === 'Maker PLA - Black' && filament.manufacturer === 'Maker',
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

  const payload = {
    name: 'Bracket',
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
  const completed = await json(`/api/prints/${draft.body.id}/complete`, { method: 'POST' }, cookie);
  check(completed.body.status === 'COMPLETED', 'Draft must complete.');
  const immutable = await json(
    `/api/prints/${draft.body.id}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
    cookie,
  );
  check(immutable.response.status === 409, 'Completed print must reject updates.');
  const duplicate = await json(`/api/prints/${draft.body.id}/duplicate`, { method: 'POST' }, cookie);
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
  const referencedManufacturerDelete = await json(
    `/api/manufacturers/${componentManufacturer.body.id}`,
    { method: 'DELETE' },
    cookie,
  );
  check(
    referencedManufacturerDelete.response.status === 409,
    'Referenced manufacturers must not be hard-deleted.',
  );

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
  server.kill('SIGTERM');
  await Promise.race([new Promise((resolve) => server.once('exit', resolve)), delay(5000)]);
  rmSync(testRoot, { recursive: true, force: true });
}
