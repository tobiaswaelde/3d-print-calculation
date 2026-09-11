-- CreateTable
CREATE TABLE "Spool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "filamentId" TEXT NOT NULL,
    "purchaseLot" TEXT,
    "location" TEXT,
    "acquiredAt" DATETIME,
    "purchasePrice" TEXT NOT NULL,
    "initialNetWeightGrams" TEXT NOT NULL,
    "legacy" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Spool_filamentId_fkey" FOREIGN KEY ("filamentId") REFERENCES "Filament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spoolId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "grams" TEXT NOT NULL,
    "note" TEXT,
    "operationKey" TEXT NOT NULL,
    "printUsageId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_spoolId_fkey" FOREIGN KEY ("spoolId") REFERENCES "Spool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_printUsageId_fkey" FOREIGN KEY ("printUsageId") REFERENCES "PrintFilamentUsage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Filament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "manufacturerId" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "minimumStockGrams" TEXT NOT NULL DEFAULT '0',
    "colorName" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL DEFAULT '#FFFFFF',
    "purchasePrice" DECIMAL NOT NULL,
    "netWeightGrams" DECIMAL NOT NULL,
    "note" TEXT,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Filament_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Filament" ("archivedAt", "colorHex", "colorName", "createdAt", "id", "manufacturerId", "material", "name", "netWeightGrams", "note", "purchasePrice", "updatedAt") SELECT "archivedAt", "colorHex", "colorName", "createdAt", "id", "manufacturerId", "material", "name", "netWeightGrams", "note", "purchasePrice", "updatedAt" FROM "Filament";
DROP TABLE "Filament";
ALTER TABLE "new_Filament" RENAME TO "Filament";
CREATE INDEX "Filament_name_idx" ON "Filament"("name");
CREATE INDEX "Filament_manufacturerId_idx" ON "Filament"("manufacturerId");
CREATE INDEX "Filament_material_idx" ON "Filament"("material");
CREATE INDEX "Filament_archivedAt_idx" ON "Filament"("archivedAt");
CREATE TABLE "new_PrintFilamentUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "printJobId" TEXT NOT NULL,
    "spoolId" TEXT,
    "spoolCode" TEXT,
    "filamentId" TEXT NOT NULL,
    "filamentName" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "purchasePrice" DECIMAL NOT NULL,
    "netWeightGrams" DECIMAL NOT NULL,
    "costPerGram" DECIMAL NOT NULL,
    "usedGrams" DECIMAL NOT NULL,
    "lineCost" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrintFilamentUsage_printJobId_fkey" FOREIGN KEY ("printJobId") REFERENCES "PrintJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PrintFilamentUsage_spoolId_fkey" FOREIGN KEY ("spoolId") REFERENCES "Spool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PrintFilamentUsage_filamentId_fkey" FOREIGN KEY ("filamentId") REFERENCES "Filament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PrintFilamentUsage" ("costPerGram", "createdAt", "filamentId", "filamentName", "id", "lineCost", "manufacturer", "material", "netWeightGrams", "printJobId", "purchasePrice", "usedGrams") SELECT "costPerGram", "createdAt", "filamentId", "filamentName", "id", "lineCost", "manufacturer", "material", "netWeightGrams", "printJobId", "purchasePrice", "usedGrams" FROM "PrintFilamentUsage";
DROP TABLE "PrintFilamentUsage";
ALTER TABLE "new_PrintFilamentUsage" RENAME TO "PrintFilamentUsage";
CREATE INDEX "PrintFilamentUsage_printJobId_idx" ON "PrintFilamentUsage"("printJobId");
CREATE INDEX "PrintFilamentUsage_filamentId_idx" ON "PrintFilamentUsage"("filamentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Spool_code_key" ON "Spool"("code");

-- CreateIndex
CREATE INDEX "Spool_filamentId_archivedAt_idx" ON "Spool"("filamentId", "archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StockMovement_operationKey_key" ON "StockMovement"("operationKey");

-- CreateIndex
CREATE INDEX "StockMovement_spoolId_id_idx" ON "StockMovement"("spoolId", "id");

-- CreateIndex
CREATE INDEX "StockMovement_printUsageId_idx" ON "StockMovement"("printUsageId");

-- Preserve historical usage rows; only active catalog items receive a marked opening spool.
INSERT INTO "Spool" ("id", "code", "filamentId", "purchasePrice", "initialNetWeightGrams", "legacy", "updatedAt")
SELECT 'legacy-' || "id", 'LEGACY-' || "id", "id", CAST("purchasePrice" AS TEXT), CAST("netWeightGrams" AS TEXT), true, CURRENT_TIMESTAMP
FROM "Filament" WHERE "archivedAt" IS NULL;
INSERT INTO "StockMovement" ("id", "spoolId", "kind", "grams", "note", "operationKey")
SELECT 'opening-' || "id", "id", 'RECEIPT', "initialNetWeightGrams", 'Legacy opening balance; verify physical stock', 'opening-' || "id"
FROM "Spool" WHERE "legacy" = true;
