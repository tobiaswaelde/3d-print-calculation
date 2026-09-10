---
title: Backup und Restore
description: Konsistente SQLite-Backups erstellen, extern sichern und kontrolliert wiederherstellen.
---

# Backup und Restore

## Online-Backup

Kopiere niemals nur eine laufende `app.db`: SQLite kann gleichzeitig WAL-Dateien verwenden. Der mitgelieferte
Befehl nutzt die SQLite-Backup-API und prüft das Ergebnis mit `integrity_check`.

```bash
docker compose exec app pnpm db:backup /data/app-backup.db
docker compose cp app:/data/app-backup.db ./app-backup.db
```

Speichere die kopierte Datei verschlüsselt außerhalb des Hosts und prüfe Größe, Zugriffsrechte und Aufbewahrung.
Backups enthalten Konten, Passwort-Hashes, Sitzungen und sämtliche Geschäftsdaten. Ein Backup im selben Volume ist
kein Schutz gegen Volume-Verlust.

## Verifizierter Restore

Ein Restore ersetzt Daten. Stoppe Schreibzugriffe und bewahre zuerst ein zusätzliches Backup des aktuellen Zustands:

```bash
docker compose exec app pnpm db:backup /data/before-restore.db
docker compose cp app:/data/before-restore.db ./before-restore.db
docker compose down
docker compose run --rm --no-deps \
  -v "$PWD/app-backup.db:/restore/app.db:ro" \
  --entrypoint sh app -c 'cp /restore/app.db /data/app.db'
docker compose up -d
curl --fail http://127.0.0.1:3000/api/health
```

Beim Start werden Migrationen angewendet, falls das Backup älter als das Image ist. Prüfe anschließend Anmeldung,
Stammdaten, Anzahl abgeschlossener Drucke und einen bekannten Snapshot. Bei Fehlern stoppe den Container und stelle
`before-restore.db` auf dieselbe Weise wieder her.

Teste Backup und Restore regelmäßig auf einer wegwerfbaren Instanz. Ein Restore in eine ältere Anwendungsversion
ist nur mit einem Backup aus genau dieser Version sicher; Migrationen werden nicht automatisch rückgängig gemacht.
