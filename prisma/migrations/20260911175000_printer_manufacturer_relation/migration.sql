PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

INSERT INTO "Manufacturer" ("id", "name", "createdAt", "updatedAt")
SELECT
  'manufacturer_' || lower(hex(randomblob(16))),
  "name",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT trim("manufacturer") AS "name"
  FROM "Printer"
  WHERE "manufacturer" IS NOT NULL AND trim("manufacturer") <> ''
) AS "PrinterManufacturer"
WHERE NOT EXISTS (
  SELECT 1 FROM "Manufacturer" WHERE "Manufacturer"."name" = "PrinterManufacturer"."name"
);

INSERT INTO "Manufacturer" ("id", "name", "createdAt", "updatedAt")
SELECT 'manufacturer_' || lower(hex(randomblob(16))), 'Unknown', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE EXISTS (
  SELECT 1 FROM "Printer" WHERE "manufacturer" IS NULL OR trim("manufacturer") = ''
)
AND NOT EXISTS (
  SELECT 1 FROM "Manufacturer" WHERE "name" = 'Unknown'
);

CREATE TABLE "new_Printer" (
  "bambuId" INTEGER,
  "bambuState" TEXT,
  "bambuSyncedAt" DATETIME,
  "bambuError" TEXT,
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "manufacturerId" TEXT NOT NULL,
  "model" TEXT,
  "purchasePrice" DECIMAL NOT NULL,
  "expectedLifetimeHours" DECIMAL NOT NULL,
  "averagePowerWatts" INTEGER NOT NULL,
  "note" TEXT,
  "archivedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Printer_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Printer" (
  "bambuId",
  "bambuState",
  "bambuSyncedAt",
  "bambuError",
  "id",
  "name",
  "manufacturerId",
  "model",
  "purchasePrice",
  "expectedLifetimeHours",
  "averagePowerWatts",
  "note",
  "archivedAt",
  "createdAt",
  "updatedAt"
)
SELECT
  "Printer"."bambuId",
  "Printer"."bambuState",
  "Printer"."bambuSyncedAt",
  "Printer"."bambuError",
  "Printer"."id",
  "Printer"."name",
  "Manufacturer"."id",
  "Printer"."model",
  "Printer"."purchasePrice",
  "Printer"."expectedLifetimeHours",
  "Printer"."averagePowerWatts",
  "Printer"."note",
  "Printer"."archivedAt",
  "Printer"."createdAt",
  "Printer"."updatedAt"
FROM "Printer"
JOIN "Manufacturer" ON "Manufacturer"."name" = CASE
  WHEN "Printer"."manufacturer" IS NULL OR trim("Printer"."manufacturer") = '' THEN 'Unknown'
  ELSE trim("Printer"."manufacturer")
END;

DROP TABLE "Printer";
ALTER TABLE "new_Printer" RENAME TO "Printer";
CREATE UNIQUE INDEX "Printer_bambuId_key" ON "Printer"("bambuId");
CREATE INDEX "Printer_name_idx" ON "Printer"("name");
CREATE INDEX "Printer_manufacturerId_idx" ON "Printer"("manufacturerId");
CREATE INDEX "Printer_archivedAt_idx" ON "Printer"("archivedAt");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
