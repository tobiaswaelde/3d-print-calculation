---
title: Manufacturers
description: Maintain reusable manufacturer records for components and filaments.
---

# Manufacturers

Manufacturers at `/manufacturers` provide the shared manufacturer list used by component and filament forms.
Create a manufacturer once, then select it from the **Manufacturer** dropdown on either inventory form.

Existing component and filament manufacturer text is converted to shared manufacturer records during the database
migration. Identical names are reused by both resource types.

Manufacturers can be searched, edited, archived, restored, and safely deleted. Archived manufacturers are hidden
from new selections. A manufacturer referenced by a component or filament cannot be permanently deleted.
