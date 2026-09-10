---
title: Architektur
description: Nuxt-, Nitro-, Authentifizierungs- und Persistenzgrenzen der Anwendung.
---

# Architektur

Die Anwendung ist ein Nuxt-4-SPA mit Nuxt UI. Seiten und Komponenten unter `app/` sprechen ausschließlich über
`$fetch` mit Nitro-Endpunkten unter `server/api/`. Zod-Schemas in `shared/schemas/` validieren HTTP-Eingaben;
`shared/domain/print-calculation.ts` enthält die seiteneffektfreie Kostenformel.

```text
Browser → globale Route-Middleware → Nitro API → Service → Prisma → SQLite /data/app.db
                                    ↘ Zod       ↘ Decimal-Kalkulation
```

Die Ersteinrichtung erzeugt `User` und `AppSettings` atomar. Passwörter werden mit Argon2 gehasht. Zufällige
Session-Tokens liegen nur im `HttpOnly`-/`SameSite=Lax`-Cookie; gespeichert wird ihr SHA-256-Hash. Schreibende
Requests akzeptieren keine fremde Origin. Außer Setup-Status, Setup, Login und Health benötigen alle
Geschäftsendpunkte eine gültige Session.

Prisma nutzt den synchronen Better-SQLite3-Adapter. Deshalb sind Setup und Writes auf einen Prozess und eine
Container-Replik ausgelegt. Der Container führt Migrationen vor dem Serverstart aus und beendet den Prisma-Client
beim Nitro-Shutdown. Weitere Grenzen stehen im [Deployment-Runbook](/operations/deployment).

Bewusste Nicht-Ziele der ersten Version sind Mehrbenutzer-Rollen, Cloud-Synchronisation, mehrere Währungen in einer
Instanz, Slicer-Import, Angebote/Rechnungen, E-Mail-Passwortreset und horizontale Skalierung. Erweiterungen sollen
neue versionierte Domain-Verträge ergänzen, nicht gespeicherte Snapshots rückwirkend verändern.
