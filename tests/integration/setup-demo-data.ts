import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertSafeTestDatabaseUrl } from '../utils/test-database';

const testRoot = mkdtempSync(join(tmpdir(), 'print-cost-setup-demo-'));
const databaseUrl = `file:${join(testRoot, 'app.db')}`;
assertSafeTestDatabaseUrl(databaseUrl, testRoot);
process.env.DATABASE_URL = databaseUrl;
process.env.NODE_ENV = 'test';

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

try {
  execFileSync('pnpm', ['db:deploy'], { env: process.env, stdio: 'inherit' });
  const [{ createDemoData }, { db }] = await Promise.all([
    import('../../server/services/demo-data'),
    import('../../server/utils/db'),
  ]);
  try {
    await db.$transaction(async (transaction) => {
      await transaction.user.create({
        data: {
          email: 'setup-demo@example.test',
          displayName: 'Demo Setup',
          passwordHash: 'synthetic-test-hash',
          locale: 'en-US',
        },
      });
      await transaction.appSettings.create({
        data: {
          id: 1,
          currency: 'CHF',
          defaultLocale: 'en-US',
          electricityPricePerKwh: '0.41',
          printSeriesEnabled: false,
          spoolManagementEnabled: false,
        },
      });
      await createDemoData(transaction, {
        currency: 'CHF',
        electricityPrice: '0.41',
        printSeriesEnabled: false,
        spoolManagementEnabled: false,
      });
    });

    const counts = await Promise.all([
      db.user.count(),
      db.customer.count(),
      db.manufacturer.count(),
      db.printer.count(),
      db.component.count(),
      db.filament.count(),
      db.printJob.count(),
      db.printCostSnapshot.count(),
      db.printOutcome.count(),
    ]);
    check(
      counts.join(',') === '1,2,4,1,3,3,8,8,3',
      `Setup must create the complete applicable demo dataset: ${counts.join(',')}`,
    );
    check((await db.spool.count()) === 0, 'Disabled spool management must not create demo spools.');
    check(
      (await db.stockMovement.count()) === 0,
      'Disabled spool management must not create stock movements.',
    );
    check((await db.printSeries.count()) === 0, 'Disabled print series must not create a demo series.');
    check(
      (await db.printJob.count({ where: { seriesId: { not: null } } })) === 0,
      'Prints must not reference a series when the feature is disabled.',
    );
    check(
      (await db.printFilamentUsage.count({ where: { spoolId: { not: null } } })) === 0,
      'Filament usages must not reference spools when spool management is disabled.',
    );
    check(
      (await db.printOutcome.count({ where: { stockTracked: true } })) === 0,
      'Demo outcomes must be marked as not stock-tracked when spool management is disabled.',
    );
    check(
      (await db.printCostSnapshot.count({
        where: { currency: 'CHF', electricityPricePerKwh: '0.41' },
      })) === 8,
      'Demo snapshots must use the currency and electricity price selected during setup.',
    );
    process.stdout.write('First-run demo data integration checks passed.\n');
  } finally {
    await db.$disconnect();
  }
} finally {
  rmSync(testRoot, { recursive: true, force: true });
}
