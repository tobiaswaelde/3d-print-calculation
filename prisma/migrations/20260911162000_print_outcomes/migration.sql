-- CreateTable
CREATE TABLE "PrintOutcome" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "printJobId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "failureReason" TEXT,
    "note" TEXT,
    "inputSnapshot" TEXT NOT NULL,
    "costSnapshot" TEXT NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrintOutcome_printJobId_fkey" FOREIGN KEY ("printJobId") REFERENCES "PrintJob" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "retryOfId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PrintJob_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PrintJob_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "Printer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PrintJob_retryOfId_fkey" FOREIGN KEY ("retryOfId") REFERENCES "PrintJob" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PrintJob" ("archivedAt", "completedAt", "createdAt", "currency", "customerId", "formulaVersion", "id", "name", "notes", "paidAt", "printerId", "quantity", "status", "totalCost", "totalDurationSeconds", "updatedAt") SELECT "archivedAt", "completedAt", "createdAt", "currency", "customerId", "formulaVersion", "id", "name", "notes", "paidAt", "printerId", "quantity", "status", "totalCost", "totalDurationSeconds", "updatedAt" FROM "PrintJob";
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

-- CreateIndex
CREATE UNIQUE INDEX "PrintOutcome_printJobId_key" ON "PrintOutcome"("printJobId");
