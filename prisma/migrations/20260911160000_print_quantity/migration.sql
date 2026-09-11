-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PrintCostSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "printJobId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "costPerUnit" DECIMAL,
    "electricityPricePerKwh" DECIMAL NOT NULL,
    "printerName" TEXT NOT NULL,
    "printerPurchasePrice" DECIMAL NOT NULL,
    "printerExpectedLifetimeHours" DECIMAL NOT NULL,
    "printerHourlyRate" DECIMAL NOT NULL,
    "printerPowerWatts" INTEGER NOT NULL,
    "printerCost" DECIMAL NOT NULL,
    "componentCost" DECIMAL NOT NULL,
    "filamentCost" DECIMAL NOT NULL,
    "electricityCost" DECIMAL NOT NULL,
    "totalCost" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL,
    "formulaVersion" TEXT NOT NULL,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrintCostSnapshot_printJobId_fkey" FOREIGN KEY ("printJobId") REFERENCES "PrintJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PrintCostSnapshot" ("calculatedAt", "componentCost", "currency", "electricityCost", "electricityPricePerKwh", "filamentCost", "formulaVersion", "id", "printJobId", "printerCost", "printerExpectedLifetimeHours", "printerHourlyRate", "printerName", "printerPowerWatts", "printerPurchasePrice", "totalCost") SELECT "calculatedAt", "componentCost", "currency", "electricityCost", "electricityPricePerKwh", "filamentCost", "formulaVersion", "id", "printJobId", "printerCost", "printerExpectedLifetimeHours", "printerHourlyRate", "printerName", "printerPowerWatts", "printerPurchasePrice", "totalCost" FROM "PrintCostSnapshot";
DROP TABLE "PrintCostSnapshot";
ALTER TABLE "new_PrintCostSnapshot" RENAME TO "PrintCostSnapshot";
CREATE UNIQUE INDEX "PrintCostSnapshot_printJobId_key" ON "PrintCostSnapshot"("printJobId");
CREATE TABLE "new_PrintJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "customerId" TEXT,
    "printerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalDurationSeconds" INTEGER NOT NULL,
    "formulaVersion" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "totalCost" DECIMAL NOT NULL,
    "completedAt" DATETIME,
    "paidAt" DATETIME,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PrintJob_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PrintJob_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "Printer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PrintJob" ("archivedAt", "completedAt", "createdAt", "currency", "customerId", "formulaVersion", "id", "name", "notes", "paidAt", "printerId", "status", "totalCost", "totalDurationSeconds", "updatedAt") SELECT "archivedAt", "completedAt", "createdAt", "currency", "customerId", "formulaVersion", "id", "name", "notes", "paidAt", "printerId", "status", "totalCost", "totalDurationSeconds", "updatedAt" FROM "PrintJob";
DROP TABLE "PrintJob";
ALTER TABLE "new_PrintJob" RENAME TO "PrintJob";
CREATE INDEX "PrintJob_name_idx" ON "PrintJob"("name");
CREATE INDEX "PrintJob_status_archivedAt_idx" ON "PrintJob"("status", "archivedAt");
CREATE INDEX "PrintJob_customerId_idx" ON "PrintJob"("customerId");
CREATE INDEX "PrintJob_printerId_idx" ON "PrintJob"("printerId");
CREATE INDEX "PrintJob_completedAt_idx" ON "PrintJob"("completedAt");
CREATE INDEX "PrintJob_paidAt_idx" ON "PrintJob"("paidAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
