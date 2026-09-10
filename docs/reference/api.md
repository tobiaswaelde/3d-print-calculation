---
title: HTTP API
description: Endpunkte, Authentifizierung, DTOs, Pagination, Validierung und Fehlerformat der ersten Version.
---

# HTTP API

Alle Pfade liegen unter derselben Origin wie die Weboberfläche. Authentifizierung erfolgt per
`print-cost-session`-Cookie; schreibende Requests benötigen dieselbe `Origin`. Dezimalwerte sind JSON-Strings,
Zeitpunkte ISO-8601-Strings und Dauern Sekunden.

## Endpunkte

| Methode und Pfad                       | Auth     | Vertrag                                                        |
| -------------------------------------- | -------- | -------------------------------------------------------------- |
| `GET /api/health`                      | nein     | `{ status, database }`, 503 bei nicht lesbarer DB              |
| `GET /api/auth/setup-status`           | nein     | `{ initialized }`                                              |
| `POST /api/auth/setup`                 | nein     | Erstkonto plus Einstellungen; nur einmal, danach 409           |
| `POST /api/auth/login`                 | nein     | E-Mail/Passwort; setzt Session-Cookie                          |
| `GET /api/auth/session`                | optional | `{ user }`, sonst `null`                                       |
| `POST /api/auth/logout`                | ja       | Löscht aktuelle Session                                        |
| `PATCH /api/auth/preferences`          | ja       | `{ locale }`                                                   |
| `GET/PATCH /api/settings`              | ja       | Währung, Standardsprache, Strompreis; Währung kann 409 liefern |
| `GET/POST /api/customers`              | ja       | Liste oder neuer Kunde                                         |
| `GET/PATCH/DELETE /api/customers/:id`  | ja       | Lesen, ersetzen/archivieren oder sicher löschen                |
| `GET/POST /api/printers`               | ja       | Liste oder neuer Drucker                                       |
| `GET/PATCH/DELETE /api/printers/:id`   | ja       | Lesen, ersetzen/archivieren oder sicher löschen                |
| `GET/POST /api/components`             | ja       | Liste oder Komponente mit `printerIds`                         |
| `GET/PATCH/DELETE /api/components/:id` | ja       | Lesen, ersetzen/archivieren oder sicher löschen                |
| `GET/POST /api/filaments`              | ja       | Liste oder Filament                                            |
| `GET/PATCH/DELETE /api/filaments/:id`  | ja       | Lesen, ersetzen/archivieren oder sicher löschen                |
| `POST /api/prints/calculate`           | ja       | Vorschau aus einem Print-Draft-DTO                             |
| `GET/POST /api/prints`                 | ja       | Gefilterte Liste oder neuer Entwurf                            |
| `GET/PATCH /api/prints/:id`            | ja       | Detail oder Aktualisierung eines `DRAFT`                       |
| `POST /api/prints/:id/complete`        | ja       | Unveränderlich abschließen                                     |
| `POST /api/prints/:id/duplicate`       | ja       | Neuen `DRAFT` zu aktuellen Preisen erzeugen                    |
| `GET /api/dashboard?period=30d`        | ja       | KPIs, Kostenserien und offene Entwürfe; `30d`, `90d`, `all`    |

Listen verwenden `search`, `page` ab 1, `pageSize` 1–100 und `includeArchived=true|false`. Drucklisten akzeptieren
zusätzlich `status=DRAFT|COMPLETED` und `customerId`. Die Antwort enthält `items`, `total`, `page`, `pageSize`.

## Wesentliche Request-DTOs

Setup erwartet `displayName`, `email`, ein mindestens 12 Zeichen langes `password`, `locale` (`de-DE` oder
`en-US`), `currency` (`EUR`, `USD`, `CHF`, `GBP`) und `electricityPrice`. Ein Druckentwurf erwartet `name`, optional
`customerId`, `printerId`, `buildPlateId`, mindestens ein `{ componentId, durationSeconds }` in `hotends`, optionale
`otherComponentIds`, mindestens ein `{ filamentId, usedGrams }` in `filaments` und optionale `notes`.

Master-Data-PATCH ersetzt das vollständige editierbare DTO; Archivierung verwendet stattdessen `{ archived }` am
selben PATCH-Endpunkt. Die geprüften Zod-Verträge stehen unter
[`shared/schemas`](https://github.com/tobiaswaelde/3d-print-calculation/tree/main/shared/schemas).

## Fehler

Fehler verwenden den HTTP-Status plus einen stabilen maschinenlesbaren Umschlag:

```json
{
  "data": {
    "code": "VALIDATION_ERROR",
    "messageKey": "errors.validation",
    "fieldErrors": {},
    "requestId": "..."
  }
}
```

Typisch sind 401 ohne Session, 403 bei fremder Origin, 409 bei unveränderlichen Drucken, referenziertem Löschen,
gesperrter Währung oder wiederholtem Setup sowie 422 bei ungültigen oder inkompatiblen Eingaben. Clients sollen
`code` auswerten und `requestId` für die Log-Korrelation anzeigen, nicht englische Servertexte parsen.
