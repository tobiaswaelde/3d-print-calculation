---
title: Upgrade und Rollback
description: Versionen sicher aktualisieren, Datenverträglichkeit prüfen und mit klaren Grenzen zurückrollen.
---

# Upgrade und Rollback

## Upgrade

1. Lies die [GitHub Releases](https://github.com/tobiaswaelde/3d-print-calculation/releases) vom aktuellen bis zum
   Ziel-Tag und beachte Breaking Changes oder Migrationshinweise.
2. Erstelle ein [externes, geprüftes Backup](/operations/backup-restore).
3. Ändere in Compose ausschließlich den festen Image-Tag, ziehe das Image und starte neu.
4. Warte auf den Healthcheck und prüfe Login, Dashboard, Stammdaten und einen abgeschlossenen Snapshot.

```bash
docker compose pull app
docker compose up -d app
docker compose ps
docker compose logs --tail=100 app
```

Dokumentation auf `main` beschreibt den neuesten Stand. Der Changeset-Release verbindet App-Version, Git-Tag,
Release Notes und Image-Tag. Für einen älteren Betrieb nutze die Dokumentation am entsprechenden Git-Tag.

## Rollback

Ein reiner Image-Rollback ist nur zulässig, wenn die Release Notes die Datenbank als rückwärtskompatibel ausweisen.
Andernfalls:

1. Stoppe die Anwendung.
2. Pinne den vorherigen Image-Tag.
3. Stelle das unmittelbar vor dem Upgrade erzeugte Datenbank-Backup wieder her.
4. Starte genau eine Replik und prüfe Healthcheck sowie bekannte Daten.

Alle nach dem Upgrade geschriebenen Daten gehen bei diesem vollständigen Rollback verloren. Ohne passendes Backup
ist ein Downgrade nicht sicher; bleibe dann auf der neuen Version, sichere den Zustand und kläre den Fehler anhand
der [Fehlerbehebung](/operations/troubleshooting) oder eines GitHub-Issues.
