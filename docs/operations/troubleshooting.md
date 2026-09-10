---
title: Fehlerbehebung
description: Diagnose für Speicherrechte, Migrationen, Healthchecks, Konfiguration und beschädigte SQLite-Dateien.
---

# Fehlerbehebung

Beginne mit `docker compose ps`, `docker compose logs --tail=200 app` und dem HTTP-Status von `/api/health`. Sichere
eine noch lesbare Datenbank, bevor du Reparaturversuche startest.

| Symptom                          | Ursache und sichere Reaktion                                                                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Data directory is not writable` | Volume muss UID/GID 1001 Schreibzugriff geben. Mount und Host-Rechte korrigieren; Container nicht als root umgehen.                                            |
| Migration schlägt fehl           | Image-Tag, freie Kapazität und vollständigen Log prüfen. Nicht mehrfach parallel starten. Backup bewahren und erst nach geklärter Ursache erneut starten.      |
| Healthcheck ist rot              | `/api/health` direkt abrufen und Log prüfen. Ein DB-Fehler liefert 503; Netzwerkfehler oder noch laufende Migrationen sind davon zu unterscheiden.             |
| Datenbank fehlt                  | `DATABASE_URL=file:/data/app.db` und das persistente `/data`-Volume prüfen. Ohne das erwartete Volume nicht weiterarbeiten, sonst entsteht eine leere Instanz. |
| Datenbank beschädigt             | Container stoppen und ein [geprüftes Backup wiederherstellen](/operations/backup-restore). Nicht an der einzigen Kopie experimentieren.                        |
| Login nicht möglich              | E-Mail prüfen und den lokalen [Passwort-Reset](/guide/setup#passwort-zurucksetzen) ausführen; bestehende Sitzungen werden dabei ungültig.                      |
| Daten verschwinden nach Neustart | Sicherstellen, dass Compose weiterhin dasselbe benannte Volume `app-data` verwendet.                                                                           |

Fehlt Konfiguration, verwende die drei expliziten Werte aus dem [Deployment-Beispiel](/operations/deployment). Lege
keine zweite Replik zur vermeintlichen Verfügbarkeitssteigerung an; das verletzt die SQLite-Betriebsgrenze.
