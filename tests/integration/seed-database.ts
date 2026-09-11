import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { assertSafeTestDatabaseUrl } from '../utils/test-database';

const testRoot = mkdtempSync(join(tmpdir(), 'print-cost-seed-'));
const databasePath = join(testRoot, 'app.db');
const databaseUrl = `file:${databasePath}`;
assertSafeTestDatabaseUrl(databaseUrl, testRoot);
const environment = { ...process.env, DATABASE_URL: databaseUrl, NODE_ENV: 'test' };

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function runSeed() {
  return spawnSync(
    'pnpm',
    ['db:seed', '--', '--email', 'demo@example.test', '--password', 'synthetic-password-123'],
    { env: environment, encoding: 'utf8' },
  );
}

try {
  execFileSync('pnpm', ['db:deploy'], { env: environment, stdio: 'inherit' });
  const first = runSeed();
  check(first.status === 0, `Seed failed: ${first.stderr}`);

  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  const count = (table: string) =>
    (database.prepare(`SELECT COUNT(*) AS count FROM "${table}"`).get() as { count: number }).count;
  check(count('User') === 1, 'Seed must create one demo user.');
  check(count('Customer') === 2, 'Seed must create two customers.');
  check(count('Manufacturer') === 4, 'Seed must create four manufacturers.');
  check(count('Printer') === 1, 'Seed must create one printer.');
  check(count('Component') === 3, 'Seed must create three components.');
  check(count('Filament') === 3, 'Seed must create three filaments.');
  check(count('Spool') === 3, 'Seed must create three spools.');
  check(count('PrintSeries') === 1, 'Seed must create one series.');
  check(count('PrintJob') === 8, 'Seed must create all workflow examples.');
  check(count('PrintCostSnapshot') === 8, 'Every seeded print must have an immutable snapshot.');
  check(count('PrintOutcome') === 3, 'Seed must create successful and failed outcomes.');

  const user = database.prepare('SELECT email, passwordHash FROM User').get() as {
    email: string;
    passwordHash: string;
  };
  check(user.email === 'demo@example.test', 'Seed must use the provided email address.');
  check(
    !user.passwordHash.includes('synthetic-password-123'),
    'Seed must never persist the plain-text password.',
  );

  const statuses = database
    .prepare('SELECT status, COUNT(*) AS count FROM PrintJob GROUP BY status')
    .all() as Array<{ status: string; count: number }>;
  check(
    ['DRAFT', 'PRINTING', 'PRINTED', 'SHIPPED', 'DONE'].every((status) =>
      statuses.some((row) => row.status === status && row.count > 0),
    ),
    'Seed must cover every print workflow status.',
  );
  const outcomes = database.prepare('SELECT status FROM PrintOutcome').all() as Array<{ status: string }>;
  check(
    outcomes.some(({ status }) => status === 'SUCCESS'),
    'Seed must include a successful outcome.',
  );
  check(
    outcomes.some(({ status }) => status === 'FAILED'),
    'Seed must include a failed outcome.',
  );
  const blackBalance = database
    .prepare(
      "SELECT TOTAL(CAST(grams AS REAL)) AS grams FROM StockMovement WHERE spoolId = 'demo-spool-black'",
    )
    .get() as { grams: number };
  check(blackBalance.grams < 250, 'Seed must include a low-stock filament example.');
  const beforeSecondRun = count('PrintJob');
  database.close();

  const second = runSeed();
  check(second.status !== 0, 'A second seed run must be rejected.');
  check(
    second.stderr.includes('already contains application data'),
    `Second seed failure must explain the safety check: ${second.stderr}`,
  );
  const unchanged = new Database(databasePath, { readonly: true, fileMustExist: true });
  check(
    (unchanged.prepare('SELECT COUNT(*) AS count FROM PrintJob').get() as { count: number }).count ===
      beforeSecondRun,
    'Rejected seed must leave existing data unchanged.',
  );
  unchanged.close();

  const invalid = spawnSync('pnpm', ['db:seed', '--', '--email', 'invalid'], {
    env: environment,
    encoding: 'utf8',
  });
  check(invalid.status !== 0 && invalid.stderr.includes('Usage:'), 'Invalid credentials must be rejected.');

  const production = spawnSync('pnpm', ['db:seed'], {
    env: { ...environment, NODE_ENV: 'production' },
    encoding: 'utf8',
  });
  check(
    production.status !== 0 && production.stderr.includes('NODE_ENV=production'),
    'Production seed attempts must be rejected.',
  );
  process.stdout.write('Database seed integration checks passed.\n');
} finally {
  rmSync(testRoot, { recursive: true, force: true });
}
