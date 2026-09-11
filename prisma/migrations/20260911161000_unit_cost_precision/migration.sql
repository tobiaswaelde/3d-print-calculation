-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PrintCostSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "printJobId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "costPerUnit" TEXT,
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
INSERT INTO "new_PrintCostSnapshot" ("calculatedAt", "componentCost", "costPerUnit", "currency", "electricityCost", "electricityPricePerKwh", "filamentCost", "formulaVersion", "id", "printJobId", "printerCost", "printerExpectedLifetimeHours", "printerHourlyRate", "printerName", "printerPowerWatts", "printerPurchasePrice", "quantity", "totalCost") SELECT "calculatedAt", "componentCost", "costPerUnit", "currency", "electricityCost", "electricityPricePerKwh", "filamentCost", "formulaVersion", "id", "printJobId", "printerCost", "printerExpectedLifetimeHours", "printerHourlyRate", "printerName", "printerPowerWatts", "printerPurchasePrice", "quantity", "totalCost" FROM "PrintCostSnapshot";
DROP TABLE "PrintCostSnapshot";
ALTER TABLE "new_PrintCostSnapshot" RENAME TO "PrintCostSnapshot";
CREATE UNIQUE INDEX "PrintCostSnapshot_printJobId_key" ON "PrintCostSnapshot"("printJobId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
