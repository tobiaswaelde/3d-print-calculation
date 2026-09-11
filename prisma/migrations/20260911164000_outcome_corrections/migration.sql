-- CreateTable
CREATE TABLE "PrintOutcomeCorrection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "outcomeId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "operationKey" TEXT NOT NULL,
    "inputSnapshot" TEXT NOT NULL,
    "costSnapshot" TEXT NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrintOutcomeCorrection_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "PrintOutcome" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PrintOutcomeCorrection_operationKey_key" ON "PrintOutcomeCorrection"("operationKey");

-- CreateIndex
CREATE UNIQUE INDEX "PrintOutcomeCorrection_outcomeId_revision_key" ON "PrintOutcomeCorrection"("outcomeId", "revision");
