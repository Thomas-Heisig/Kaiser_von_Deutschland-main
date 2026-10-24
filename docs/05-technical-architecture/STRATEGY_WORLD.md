# Strategiewelt und Diplomatie · 24.10.2026

Die erste Open-World-Ausbaustufe ist eine erkundbare **Strategiekarte**. Sie verwendet generierte Spielregionen, keine historischen Grenzen. Die 16 Heimatbezirke bleiben erhalten. Freie Bebauung, ein 3D-RPG, Online-Mehrspieler und VR sind weiterhin eigenständige offene Vorhaben.

## Spielablauf

Unter **Welt & Volk** stehen alle Nachbarn mit den tatsächlich vorhandenen Kennzahlen. Hauptstadt und gesamte Wirtschaftsleistung werden als unbekannt ausgewiesen. „Auf der Karte zeigen“ zentriert und vergrößert auch bei vielen Nachbarn die betreffende Region. Die Weltansicht passt alle Regionen ein; Pfeiltasten bewegen die fokussierte Karte, Pos1 zentriert sie. Maus-/Touch-Ziehen bleibt verfügbar.

Eine Reise von der Heimat zum Nachbarn dauert einen Monat und kostet 150 Gold und 50 Nahrung. Zwischen zwei Nachbarn führt die Route über die Heimat: zwei Monate, 300 Gold und 100 Nahrung. Heimkehr kostet nichts. Währenddessen bleibt die Reichsverwaltung bedienbar. Die Ankunft entdeckt das Gelände und erscheint in der Chronik. Eine laufende Reise bleibt beim Laden erhalten.

## Schnittstellen und Persistenz

`StrategyWorld` verwaltet stabile Regions-IDs, Positionen, Gelände, Verbindungen, Entdeckungsstand und Reise. Der Seed bestimmt das Gelände; Positionen folgen einem schematischen Raster. Neue Nachbarn verschieben bestehende Positionen nicht. Entfernte Nachbarn verschwinden aus der Übersicht, ihre Position bleibt für eine Wiederkehr reserviert. Entfällt ein Reiseziel, wird die Reise beendet; Kosten werden nicht erstattet. Ein entfallener Aufenthaltsort fällt auf Heimat zurück.

`GameEngine.getStrategyWorld`, `getWorldTravelPlan` und `travelWorld` sind die Schnittstellen der Oberfläche. Die Engine prüft Ressourcen und aktiven Hotseat-Spieler. Im vorhandenen Version-2-Spielstand ist `strategyWorlds` ein optionales Feld mit eigenem Schema `version:1`. Altstände erhalten beim ersten Abruf eine Welt. Ungültige Weltversionen, Koordinaten, Referenzen oder Reisen werden vor dem Zustandswechsel zurückgewiesen.

## Verträge und Rivalen

| Aktion | Voraussetzung | Kosten und Wirkung |
| --- | --- | --- |
| Gesandtschaft | Keine parallele Mission zum Ziel | 350 Gold; nächster Jahreswechsel: bei Erfolg Beziehung +10/Vertrauen +5, sonst jeweils −5 |
| Nichtangriffspakt | Beziehung 10, Vertrauen 40 | 500 Gold, zwei Jahre gegenseitiger Angriffsschutz |
| Handelsvertrag | Beziehung 10, Vertrauen 40 | 600 Gold, drei Jahre 80 Gold/Monat; kein Angriffsschutz |
| Schutzbündnis | Beziehung 30, Vertrauen 40 | 1.200 Gold, drei Jahre Angriffsschutz; +15 % Führung gegen andere Überfälle, nicht stapelbar |
| Vertragsbruch | Eigener aktiver Vertrag | Alle Verträge mit Partner enden; Beziehung −30, Vertrauen −40, Prestige −5; andere Nachbarn Vertrauen −10 |

Neue Verträge laufen monatsgenau aus. Ein eigener Feldzug oder eine Belagerung erfordert vorherigen Vertragsbruch. Überfällt ein Handelspartner das Reich, endet der Handel ohne Prestigeabzug für den überfallenen Spieler. Erfolgreiche Gesandtschaften können verlorenes Vertrauen wiederherstellen. Zwei Schutzbündnisse ersetzen die Eroberung im letzten Kapitel der Kaiserkrone.

Jährliche Rivalenreaktionen unterscheiden Räuber (Gold/Handelswege), Verteidiger (Heer/Forschung) und Händler (Wirtschaft/Handel/Forschung). Eingaben, Schwierigkeit und Wachstum sind begrenzt; die Chronik nennt den Auslöser. Das ist regelbasierte Strategie, keine generative KI.

## Nachweise und Grenzen

- `StrategyWorld.test.ts`: 20 Nachbarn, stabile Positionen, Hin-/Weiter-/Heimreise, Entdeckung, Migration und ungültige Zustände; Reaktionsregeln und Schwierigkeit.
- `GameEngine.test.ts`: bezahlte Reise, Zwischen-Save/Load, Verträge, Einkommen, monatsgenaues Ende, Überfall, Vertragsbruch.
- `CampaignEndToEnd.test.ts`: Hanse, Wissenschaft, Kultur und Kaiserkrone ohne Eroberung bis zum Sieg, mit Zwischen- und Ergebnis-Spielstand. **Finanzierte Testpartien**, kein Nachweis normaler Startbalance.
- `scripts/strategy-smoke.mjs`: echte Hauptoberfläche, 20-Nachbarn-Testspielstand, 320/768/1024 px, Kartenfokus per Button/Tastatur, Reise/Save/Load, Verträge/Bruch.
- [Lastmessung](../reports/strategy-population-2026-10-24.md): 1.000/5.000/20.000 Bürger.

Minikarte, Pinch-Zoom, ereignisabhängige regionale Aufgaben, freie Bauplätze, Culling-Budgets und reale Mobilgeräte bleiben offen. Die Übersicht mit 20 Nachbarn ist zum Auffinden gedacht; zum Lesen verwendet man den Regionsfokus oder die Textansicht.
