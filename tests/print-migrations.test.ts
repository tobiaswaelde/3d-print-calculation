import Database from 'better-sqlite3';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

it('preserves version 1 snapshot values when adding quantity and exact unit costs', () => {
  const database = new Database(':memory:');
  try {
    const migrations = readdirSync('prisma/migrations')
      .filter((name) => name.startsWith('20'))
      .sort();
    for (const name of migrations.filter((name) => name < '20260911160000'))
      database.exec(readFileSync(join('prisma/migrations', name, 'migration.sql'), 'utf8'));
    database.exec(`
      INSERT INTO Manufacturer (id, name, updatedAt) VALUES ('maker', 'Synthetic maker', CURRENT_TIMESTAMP);
      INSERT INTO Filament (id, name, manufacturerId, material, colorName, purchasePrice, netWeightGrams, updatedAt) VALUES ('filament', 'Legacy PLA', 'maker', 'PLA', 'White', 20, 1000, CURRENT_TIMESTAMP);
      INSERT INTO Printer (id, name, purchasePrice, expectedLifetimeHours, averagePowerWatts, updatedAt)
      VALUES ('printer', 'Historical printer', 100, 1000, 100, CURRENT_TIMESTAMP);
      INSERT INTO PrintJob (id, name, printerId, status, totalDurationSeconds, formulaVersion, currency, totalCost, updatedAt)
      VALUES ('print', 'Historical print', 'printer', 'DONE', 3600, '1', 'EUR', 1.782175, CURRENT_TIMESTAMP);
      INSERT INTO PrintCostSnapshot (id, printJobId, electricityPricePerKwh, printerName, printerPurchasePrice,
        printerExpectedLifetimeHours, printerHourlyRate, printerPowerWatts, printerCost, componentCost,
        filamentCost, electricityCost, totalCost, currency, formulaVersion)
      VALUES ('snapshot', 'print', 0.32, 'Historical printer', 100, 1000, 0.1, 100, 0.3, 0.15, 1.274575, 0.0576, 1.782175, 'EUR', '1');
    `);
    const original = database.prepare('SELECT * FROM PrintCostSnapshot').get();
    for (const name of migrations.filter((name) => name >= '20260911160000'))
      database.exec(readFileSync(join('prisma/migrations', name, 'migration.sql'), 'utf8'));
    expect(database.prepare('SELECT * FROM PrintCostSnapshot').get()).toEqual({
      ...original!,
      quantity: 1,
      costPerUnit: null,
      calculationJson: null,
      salesValue: null,
    });
    expect(database.prepare('SELECT quantity, totalCost FROM PrintJob').get()).toEqual({
      quantity: 1,
      totalCost: 1.782175,
    });
    expect(
      database
        .prepare('SELECT legacy, initialNetWeightGrams FROM Spool WHERE filamentId = ?')
        .get('filament'),
    ).toEqual({ legacy: 1, initialNetWeightGrams: '1000' });
    expect(database.prepare('SELECT kind, grams FROM StockMovement').get()).toEqual({
      kind: 'RECEIPT',
      grams: '1000',
    });
    database.prepare('UPDATE PrintCostSnapshot SET costPerUnit = ?').run('0.59405833333333333333');
    expect(database.prepare('SELECT costPerUnit FROM PrintCostSnapshot').get()).toEqual({
      costPerUnit: '0.59405833333333333333',
    });
  } finally {
    database.close();
  }
});
