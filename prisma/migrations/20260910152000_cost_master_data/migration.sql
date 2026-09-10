CREATE TABLE "Customer" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "note" TEXT,
  "archivedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE INDEX "Customer_name_idx" ON "Customer"("name");
CREATE INDEX "Customer_archivedAt_idx" ON "Customer"("archivedAt");

CREATE TABLE "Printer" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "manufacturer" TEXT,
  "model" TEXT,
  "purchasePrice" DECIMAL NOT NULL,
  "expectedLifetimeHours" DECIMAL NOT NULL,
  "averagePowerWatts" INTEGER NOT NULL,
  "note" TEXT,
  "archivedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE INDEX "Printer_name_idx" ON "Printer"("name");
CREATE INDEX "Printer_archivedAt_idx" ON "Printer"("archivedAt");

CREATE TABLE "Component" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "type" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "manufacturer" TEXT,
  "model" TEXT,
  "purchasePrice" DECIMAL NOT NULL,
  "expectedLifetimeHours" DECIMAL NOT NULL,
  "note" TEXT,
  "archivedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE INDEX "Component_name_idx" ON "Component"("name");
CREATE INDEX "Component_type_idx" ON "Component"("type");
CREATE INDEX "Component_archivedAt_idx" ON "Component"("archivedAt");

CREATE TABLE "PrinterComponent" (
  "printerId" TEXT NOT NULL,
  "componentId" TEXT NOT NULL,
  PRIMARY KEY ("printerId", "componentId"),
  CONSTRAINT "PrinterComponent_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "Printer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PrinterComponent_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "PrinterComponent_componentId_idx" ON "PrinterComponent"("componentId");

CREATE TABLE "Filament" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "manufacturer" TEXT NOT NULL,
  "material" TEXT NOT NULL,
  "color" TEXT,
  "purchasePrice" DECIMAL NOT NULL,
  "netWeightGrams" DECIMAL NOT NULL,
  "note" TEXT,
  "archivedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE INDEX "Filament_name_idx" ON "Filament"("name");
CREATE INDEX "Filament_manufacturer_idx" ON "Filament"("manufacturer");
CREATE INDEX "Filament_material_idx" ON "Filament"("material");
CREATE INDEX "Filament_archivedAt_idx" ON "Filament"("archivedAt");
