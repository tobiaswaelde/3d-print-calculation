ALTER TABLE "PrintJob" ADD COLUMN "paidAt" DATETIME;

UPDATE "PrintJob"
SET "status" = 'DONE'
WHERE "status" = 'COMPLETED';

CREATE INDEX "PrintJob_paidAt_idx" ON "PrintJob"("paidAt");
