---
title: Dokumentation veröffentlichen
description: GitHub-Pages-Pipeline, Versionszuordnung, Sicherheitsgrenzen und Rollback der Dokumentation.
---

# Dokumentation veröffentlichen

Pull Requests bauen und prüfen die Dokumentation, veröffentlichen sie aber nicht. Nur ein Push auf `main` startet
den Pages-Job mit `contents: read`, `pages: write` und `id-token: write`; das gebaute `docs/.vitepress/dist` wird als
Pages-Artefakt deployt. Es sind keine Repository-Geheimnisse erforderlich.

Die Seite unter `https://tobiaswaelde.github.io/3d-print-calculation/` beschreibt den neuesten `main`-Stand. Jeder
Produkt-Commit enthält einen Changeset. Nach Merge des Changesets-Version-PRs verbinden Git-Tag, GitHub Release und
Container-Tag dieselbe App-Version. Unveränderliche historische Dokumentation ist über `docs/` im jeweiligen Git-
Tag verfügbar; Release Notes verlinken den passenden Tag.

## Veröffentlichung prüfen

1. CI muss Doku-Check, Build und Browser-Smoke-Test bestanden haben.
2. Nach Deployment Startseite, Sprachwechsel, Suche, Sitemap und mindestens einen tiefen Link öffnen.
3. Mit Tastatur und 390-px-Viewport prüfen; die automatisierte Prüfung dient als Mindestschutz.

## Rollback

Pages speichert kein Anwendungsdatum. Bei fehlerhafter Dokumentation revertiere den verursachenden Commit auf
`main` mit einem neuen Changeset; die normale Pipeline veröffentlicht den vorherigen Inhalt erneut. Historie nicht
umschreiben und kein altes Build-Artefakt manuell hochladen. Wenn die Dokumentation absichtlich zu einer älteren
App-Version zurückkehren soll, revertiere Inhalt und Navigation gemeinsam und kennzeichne die unterstützte Version
sichtbar.
