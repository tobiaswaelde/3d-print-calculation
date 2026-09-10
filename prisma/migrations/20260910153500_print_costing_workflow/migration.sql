CREATE TABLE "PrintJob" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "customerId" TEXT,
  "printerId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "notes" TEXT,
  "totalDurationSeconds" INTEGER NOT NULL,
  "formulaVersion" TEXT NOT NULL,
  "currency" TEXT NOT NULL,
  "totalCost" DECIMAL NOT NULL,
  "completedAt" DATETIME,
  "archivedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "PrintJob_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PrintJob_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "Printer"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "PrintJob_name_idx" ON "PrintJob"("name");
CREATE INDEX "PrintJob_status_archivedAt_idx" ON "PrintJob"("status", "archivedAt");
CREATE INDEX "PrintJob_customerId_idx" ON "PrintJob"("customerId");
CREATE INDEX "PrintJob_printerId_idx" ON "PrintJob"("printerId");
CREATE INDEX "PrintJob_completedAt_idx" ON "PrintJob"("completedAt");

CREATE TABLE "PrintComponentUsage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "printJobId" TEXT NOT NULL,
  "componentId" TEXT NOT NULL,
  "componentType" TEXT NOT NULL,
  "componentName" TEXT NOT NULL,
  "purchasePrice" DECIMAL NOT NULL,
  "expectedLifetimeHours" DECIMAL NOT NULL,
  "hourlyRate" DECIMAL NOT NULL,
  "appliedDurationSeconds" INTEGER NOT NULL,
  "lineCost" DECIMAL NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PrintComponentUsage_printJobId_fkey" FOREIGN KEY ("printJobId") REFERENCES "PrintJob"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PrintComponentUsage_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "PrintComponentUsage_printJobId_idx" ON "PrintComponentUsage"("printJobId");
CREATE INDEX "PrintComponentUsage_componentId_idx" ON "PrintComponentUsage"("componentId");

CREATE TABLE "PrintFilamentUsage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "printJobId" TEXT NOT NULL,
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
  CONSTRAINT "PrintFilamentUsage_printJobId_fkey" FOREIGN KEY ("printJobId") REFERENCES "PrintJob"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PrintFilamentUsage_filamentId_fkey" FOREIGN KEY ("filamentId") REFERENCES "Filament"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "PrintFilamentUsage_printJobId_idx" ON "PrintFilamentUsage"("printJobId");
CREATE INDEX "PrintFilamentUsage_filamentId_idx" ON "PrintFilamentUsage"("filamentId");

CREATE TABLE "PrintCostSnapshot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "printJobId" TEXT NOT NULL,
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
  CONSTRAINT "PrintCostSnapshot_printJobId_fkey" FOREIGN KEY ("printJobId") REFERENCES "PrintJob"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PrintCostSnapshot_printJobId_key" ON "PrintCostSnapshot"("printJobId");
