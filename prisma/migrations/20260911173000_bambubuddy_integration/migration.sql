/*
  Warnings:

  - A unique constraint covering the columns `[bambuId]` on the table `Printer` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Printer" ADD COLUMN "bambuError" TEXT;
ALTER TABLE "Printer" ADD COLUMN "bambuId" INTEGER;
ALTER TABLE "Printer" ADD COLUMN "bambuState" TEXT;
ALTER TABLE "Printer" ADD COLUMN "bambuSyncedAt" DATETIME;

-- CreateTable
CREATE TABLE "BambuPrintLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "printJobId" TEXT NOT NULL,
    "remoteLogId" INTEGER NOT NULL,
    "cachedJson" TEXT NOT NULL,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "error" TEXT,
    "importedJson" TEXT,
    "importedAt" DATETIME,
    CONSTRAINT "BambuPrintLink_printJobId_fkey" FOREIGN KEY ("printJobId") REFERENCES "PrintJob" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BambuTrayMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "printerId" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "spoolId" TEXT NOT NULL,
    CONSTRAINT "BambuTrayMapping_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "Printer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BambuTrayMapping_spoolId_fkey" FOREIGN KEY ("spoolId") REFERENCES "Spool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BambuPrintLink_printJobId_key" ON "BambuPrintLink"("printJobId");

-- CreateIndex
CREATE UNIQUE INDEX "BambuPrintLink_remoteLogId_key" ON "BambuPrintLink"("remoteLogId");

-- CreateIndex
CREATE UNIQUE INDEX "BambuTrayMapping_printerId_slot_key" ON "BambuTrayMapping"("printerId", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "Printer_bambuId_key" ON "Printer"("bambuId");
