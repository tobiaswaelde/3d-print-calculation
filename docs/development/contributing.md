---
title: Mitwirken
description: Lokale Entwicklung, Migrationen, Tests, Changesets und Regeln für zweisprachige Dokumentation.
---

# Mitwirken

Benötigt werden Node.js 24, Corepack/pnpm aus `packageManager`, Git und für E2E-/Container-Tests Chromium sowie
Docker. Ein sauberer Checkout startet so:

```bash
corepack enable
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm dev
```

Es gibt absichtlich kein Seed-Skript; die Ersteinrichtung und Stammdaten werden über UI oder API angelegt. Neue
Prisma-Änderungen benötigen eine Migration via `pnpm db:migrate`; Produktionsstarts verwenden ausschließlich
`pnpm db:deploy`.

Vor einem Commit laufen mindestens die betroffenen Checks, vor Übergabe die vollständige Kette:

```bash
pnpm format:check
pnpm lint
pnpm i18n:check
pnpm typecheck
pnpm test
pnpm build
pnpm test:integration
pnpm test:e2e
pnpm docs:check && pnpm docs:build && pnpm test:docs:e2e
sh tests/container-smoke.sh
```

Jeder Produkt-Commit enthält eine Datei unter `.changeset/`. Änderungen bleiben eng geschnitten; API-, Formel- und
Snapshot-Verträge benötigen Tests. Erweiterungspunkte sind neue Nitro-Routen, Zod-Schemas, versionierte Domain-
Funktionen und Nuxt-Module. Die [Architekturgrenzen](/reference/architecture) und Nicht-Ziele gelten, bis ein
expliziter Produktentscheid sie ändert.

## Dokumentationsregeln

Jede Markdown-Seite erhält `title` und `description`, eine gleichnamige Übersetzung unter `docs/en/`, interne Links
ohne Dateiendung und aussagekräftigen Alt-Text für jedes Bild. Seiten müssen in Navigation/Sidebar eingetragen sein.
Bezeichnungen, Einheiten und Beispiele folgen der Anwendung; Geheimnisse und persönliche Daten gehören weder in
Screenshots noch in Beispiele. `pnpm docs:check` prüft Parität, Frontmatter, Orphans und Bild-Alt-Texte;
`pnpm docs:build` validiert Ziele und Anker.
