---
title: Einrichtung und Zugang
description: Ersteinrichtung, Anmeldung, Sprache, Darstellung, Einstellungen und Passwort-Reset.
---

# Einrichtung und Zugang

## Ersteinrichtung

Beim ersten Aufruf leitet die Anwendung auf **Ersteinrichtung** um. Erfasse Anzeigename, E-Mail-Adresse, ein
Passwort mit mindestens 12 Zeichen, Sprache, Währung und Strompreis pro kWh. Genau ein Setup kann erfolgreich
sein; danach ist diese Seite gesperrt. Das erfolgreiche Setup meldet den Benutzer direkt an.

Die Währung gilt für die gesamte Instanz. Sobald Drucker, Komponenten, Filamente oder Drucke existieren, ist ein
Währungswechsel gesperrt, damit bestehende Geldbeträge nicht umgedeutet werden. Der Strompreis und die
Standardsprache bleiben änderbar.

## Anmeldung und persönliche Einstellungen

Melde dich mit E-Mail und Passwort an. **Sprache** schaltet zwischen Deutsch und Englisch um und wird am Konto
gespeichert. **Darstellung** bietet Hell, Dunkel und System. **Abmelden** löscht die aktuelle Sitzung.

## Passwort zurücksetzen

Es gibt absichtlich keinen E-Mail-Reset. Ein Betreiber setzt das Passwort lokal im laufenden Container zurück:

```bash
docker compose exec app pnpm db:reset-password operator@example.test 'neues-langes-passwort'
```

Der Befehl löscht alle Sitzungen dieses Kontos. Danach ist eine neue Anmeldung erforderlich. Verwende in Shell-
Historien keine produktiven Geheimnisse; eine interaktive Secret-Verwaltung des Hosts ist vorzuziehen.

## Fehler beheben

- **Validierungsfehler:** Pflichtfelder, Dezimalpunkt und Mindestlänge prüfen.
- **Bereits eingerichtet:** Zur Anmeldung wechseln; Setup ist nicht wiederholbar.
- **Ungültige Zugangsdaten:** Adresse und Passwort prüfen oder den lokalen Reset verwenden.
- **Leere Ansicht:** Zuerst die für den Arbeitsschritt benötigten [Stammdaten](/guide/master-data) anlegen.
