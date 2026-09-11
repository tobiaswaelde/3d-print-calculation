/*
  Warnings:

  - A unique constraint covering the columns `[spoolmanId]` on the table `Filament` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[spoolmanId]` on the table `Manufacturer` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Filament" ADD COLUMN "spoolmanId" INTEGER;

-- AlterTable
ALTER TABLE "Manufacturer" ADD COLUMN "spoolmanId" INTEGER;

-- CreateTable
CREATE TABLE "SpoolSyncOperation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operationKey" TEXT NOT NULL,
    "spoolId" TEXT NOT NULL,
    "remoteId" INTEGER NOT NULL,
    "grams" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SpoolSyncOperation_spoolId_fkey" FOREIGN KEY ("spoolId") REFERENCES "Spool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Spool" (
    "spoolmanId" INTEGER,
    "stockAuthority" TEXT NOT NULL DEFAULT 'NATIVE',
    "remoteRemainingGrams" TEXT,
    "remoteState" TEXT,
    "syncedAt" DATETIME,
    "syncError" TEXT,
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
INSERT INTO "new_Spool" ("acquiredAt", "archivedAt", "code", "createdAt", "filamentId", "id", "initialNetWeightGrams", "legacy", "location", "purchaseLot", "purchasePrice", "updatedAt") SELECT "acquiredAt", "archivedAt", "code", "createdAt", "filamentId", "id", "initialNetWeightGrams", "legacy", "location", "purchaseLot", "purchasePrice", "updatedAt" FROM "Spool";
DROP TABLE "Spool";
ALTER TABLE "new_Spool" RENAME TO "Spool";
CREATE UNIQUE INDEX "Spool_spoolmanId_key" ON "Spool"("spoolmanId");
CREATE UNIQUE INDEX "Spool_code_key" ON "Spool"("code");
CREATE INDEX "Spool_filamentId_archivedAt_idx" ON "Spool"("filamentId", "archivedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SpoolSyncOperation_operationKey_key" ON "SpoolSyncOperation"("operationKey");

-- CreateIndex
CREATE INDEX "SpoolSyncOperation_state_createdAt_idx" ON "SpoolSyncOperation"("state", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Filament_spoolmanId_key" ON "Filament"("spoolmanId");

-- CreateIndex
CREATE UNIQUE INDEX "Manufacturer_spoolmanId_key" ON "Manufacturer"("spoolmanId");
