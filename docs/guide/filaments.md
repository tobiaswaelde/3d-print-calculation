---
title: Filaments
description: Maintain filament identity, spool pricing, usable weight, derived cost per gram, and availability.
---

# Filaments

Filaments at `/filaments` provide material identity and cost per usable gram.

![Filaments page with material metadata and cost per gram](/screenshots/filaments.jpg)

## Fields and derived rate

| Field              | Requirement                 | Use                                       |
| ------------------ | --------------------------- | ----------------------------------------- |
| **Name**           | Required                    | Spool label in selectors and snapshots    |
| **Manufacturer**   | Required                    | Searchable identity                       |
| **Material**       | Required                    | Material family such as PLA, PETG, or ABS |
| **Color**          | Optional                    | Searchable descriptive value              |
| **Purchase price** | Required, zero or greater   | Full spool cost                           |
| **Net weight (g)** | Required, greater than zero | Usable material in the spool              |
| **Note**           | Optional                    | Batch, storage, or purchasing context     |

The form and table calculate **Cost per gram** as `purchase price / net weight`. Print cost multiplies this value by
the **Used weight (g)** entered for each selected filament. A draft may use multiple unique filaments.

Use the standard search, create, edit, archive, restore, and safe-delete actions. Archived filament remains visible
in historical usages but is not available for a new calculation.
