---
title: Self-hosted Deployment
description: Voraussetzungen, Container-Tags, Compose-Konfiguration, Migrationen, Healthcheck und Betriebsgrenzen.
---

# Self-hosted Deployment

## Voraussetzungen

Benötigt werden ein aktueller Docker-Daemon mit Compose-Plugin, Zugang zu GHCR sowie ein beschreibbares lokales
Dateisystem für das persistente Volume. Die Anwendung unterstützt genau **eine Replik**: SQLite ist eine
Single-Writer-Datenbank und das Setup-Lock gilt pro Prozess.

Das veröffentlichte Image lautet `ghcr.io/tobiaswaelde/3d-print-calculation`. Verwende in Produktion einen festen
Tag `vMAJOR.MINOR.PATCH`; `latest` folgt dem neuesten Release und `sha-…` bezeichnet einen Build-Commit.

## Installation

Kopiere [`compose.example.yml`](https://github.com/tobiaswaelde/3d-print-calculation/blob/main/compose.example.yml)
als `compose.yml` und pinne den Image-Tag:

```yaml
services:
  app:
    image: ghcr.io/tobiaswaelde/3d-print-calculation:v1.0.0
    restart: unless-stopped
    environment:
      DATABASE_URL: file:/data/app.db
      NUXT_SESSION_TTL_HOURS: 168
      DATA_DIR: /data
    ports: ['3000:3000']
    volumes: [app-data:/data]
```

Es gibt kein vorgegebenes Anmeldegeheimnis in Umgebungsvariablen. Das erste Konto entsteht ausschließlich im
Browser-Setup. Begrenze Port `3000` per Firewall oder Reverse Proxy und stelle für externen Zugriff TLS bereit.

```bash
docker compose pull
docker compose up -d
docker compose ps
curl --fail http://127.0.0.1:3000/api/health
```

Der Container läuft als UID/GID `1001`, prüft `/data` auf Schreibbarkeit, erstellt die SQLite-Datei bei Bedarf und
führt vor jedem Serverstart `prisma migrate deploy` aus. Der Healthcheck meldet nur dann HTTP 200, wenn die
Datenbank tatsächlich lesbar ist. Ein Neustart verwendet dasselbe Volume und wendet nur ausstehende Migrationen
an.

Nach einem gesunden Start öffne `http://HOST:3000` und folge der [Ersteinrichtung](/guide/setup). Richte danach
zuerst [Stammdaten](/guide/master-data) ein. Vor Änderungen am Image gilt immer der
[Upgrade- und Backup-Ablauf](/operations/upgrades). Sicherheitslücken werden gemäß der
[Security Policy](https://github.com/tobiaswaelde/3d-print-calculation/blob/main/SECURITY.md) privat gemeldet.
