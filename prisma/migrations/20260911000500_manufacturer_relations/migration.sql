PRAGMA foreign_keys=OFF;

CREATE TABLE "Manufacturer" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "note" TEXT,
  "archivedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "Manufacturer_name_key" ON "Manufacturer"("name");
CREATE INDEX "Manufacturer_archivedAt_idx" ON "Manufacturer"("archivedAt");

INSERT INTO "Manufacturer" ("id", "name", "createdAt", "updatedAt")
SELECT
  'manufacturer_' || lower(hex(randomblob(16))),
  "name",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT trim("manufacturer") AS "name"
  FROM "Component"
  WHERE "manufacturer" IS NOT NULL AND trim("manufacturer") <> ''
  UNION
  SELECT trim("manufacturer") AS "name"
  FROM "Filament"
  WHERE trim("manufacturer") <> ''
);

CREATE TABLE "new_Component" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "type" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "manufacturerId" TEXT,
  "model" TEXT,
  "purchasePrice" DECIMAL NOT NULL,
  "expectedLifetimeHours" DECIMAL NOT NULL,
  "note" TEXT,
  "archivedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "alwaysUsed" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "Component_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Component" (
  "id",
  "type",
  "name",
  "manufacturerId",
  "model",
  "purchasePrice",
  "expectedLifetimeHours",
  "note",
  "archivedAt",
  "createdAt",
  "updatedAt",
  "alwaysUsed"
)
SELECT
  "Component"."id",
  "Component"."type",
  "Component"."name",
  "Manufacturer"."id",
  "Component"."model",
  "Component"."purchasePrice",
  "Component"."expectedLifetimeHours",
  "Component"."note",
  "Component"."archivedAt",
  "Component"."createdAt",
  "Component"."updatedAt",
  "Component"."alwaysUsed"
FROM "Component"
LEFT JOIN "Manufacturer" ON "Manufacturer"."name" = trim("Component"."manufacturer");

DROP TABLE "Component";
ALTER TABLE "new_Component" RENAME TO "Component";
CREATE INDEX "Component_name_idx" ON "Component"("name");
CREATE INDEX "Component_type_idx" ON "Component"("type");
CREATE INDEX "Component_manufacturerId_idx" ON "Component"("manufacturerId");
CREATE INDEX "Component_archivedAt_idx" ON "Component"("archivedAt");

CREATE TABLE "new_Filament" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "manufacturerId" TEXT NOT NULL,
  "material" TEXT NOT NULL,
  "color" TEXT,
  "purchasePrice" DECIMAL NOT NULL,
  "netWeightGrams" DECIMAL NOT NULL,
  "note" TEXT,
  "archivedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Filament_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Filament" (
  "id",
  "name",
  "manufacturerId",
  "material",
  "color",
  "purchasePrice",
  "netWeightGrams",
  "note",
  "archivedAt",
  "createdAt",
  "updatedAt"
)
SELECT
  "Filament"."id",
  "Filament"."name",
  "Manufacturer"."id",
  "Filament"."material",
  "Filament"."color",
  "Filament"."purchasePrice",
  "Filament"."netWeightGrams",
  "Filament"."note",
  "Filament"."archivedAt",
  "Filament"."createdAt",
  "Filament"."updatedAt"
FROM "Filament"
JOIN "Manufacturer" ON "Manufacturer"."name" = trim("Filament"."manufacturer");

DROP TABLE "Filament";
ALTER TABLE "new_Filament" RENAME TO "Filament";
CREATE INDEX "Filament_name_idx" ON "Filament"("name");
CREATE INDEX "Filament_manufacturerId_idx" ON "Filament"("manufacturerId");
CREATE INDEX "Filament_material_idx" ON "Filament"("material");
CREATE INDEX "Filament_archivedAt_idx" ON "Filament"("archivedAt");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
