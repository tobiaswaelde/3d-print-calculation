import Database from 'better-sqlite3';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

it('migrates printer manufacturer text to required shared manufacturer relations', () => {
  const database = new Database(':memory:');
  try {
    const migrations = readdirSync('prisma/migrations')
      .filter((name) => name.startsWith('20'))
      .sort();
    for (const name of migrations.filter((name) => name < '20260911175000'))
      database.exec(readFileSync(join('prisma/migrations', name, 'migration.sql'), 'utf8'));

    database.exec(`
      INSERT INTO Manufacturer (id, name, updatedAt) VALUES ('existing-maker', 'Existing Maker', CURRENT_TIMESTAMP);
      INSERT INTO Printer (id, name, manufacturer, purchasePrice, expectedLifetimeHours, averagePowerWatts, bambuId, bambuState, bambuError, updatedAt)
      VALUES
        ('existing', 'Existing printer', ' Existing Maker ', 100, 1000, 100, 7, 'IDLE', NULL, CURRENT_TIMESTAMP),
        ('new-a', 'New printer A', 'New Maker', 100, 1000, 100, NULL, NULL, NULL, CURRENT_TIMESTAMP),
        ('new-b', 'New printer B', 'New Maker', 100, 1000, 100, NULL, NULL, NULL, CURRENT_TIMESTAMP),
        ('missing', 'Missing maker', NULL, 100, 1000, 100, NULL, NULL, 'OFFLINE', CURRENT_TIMESTAMP);
    `);

    database.exec(
      readFileSync(
        join('prisma/migrations', '20260911175000_printer_manufacturer_relation', 'migration.sql'),
        'utf8',
      ),
    );

    expect(
      database.prepare('SELECT COUNT(*) AS count FROM Manufacturer WHERE name = ?').get('New Maker'),
    ).toEqual({
      count: 1,
    });
    expect(
      database
        .prepare(
          `SELECT Printer.id, Manufacturer.name AS manufacturer
           FROM Printer JOIN Manufacturer ON Manufacturer.id = Printer.manufacturerId
           ORDER BY Printer.id`,
        )
        .all(),
    ).toEqual([
      { id: 'existing', manufacturer: 'Existing Maker' },
      { id: 'missing', manufacturer: 'Unknown' },
      { id: 'new-a', manufacturer: 'New Maker' },
      { id: 'new-b', manufacturer: 'New Maker' },
    ]);
    expect(database.pragma('foreign_key_check')).toEqual([]);
    expect(database.prepare('SELECT bambuId, bambuState FROM Printer WHERE id = ?').get('existing')).toEqual({
      bambuId: 7,
      bambuState: 'IDLE',
    });
    expect(database.prepare('SELECT bambuError FROM Printer WHERE id = ?').get('missing')).toEqual({
      bambuError: 'OFFLINE',
    });
  } finally {
    database.close();
  }
});
