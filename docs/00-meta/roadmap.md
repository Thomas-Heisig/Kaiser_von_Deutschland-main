# Roadmap — Kaiser von Deutschland
**Aktiver Entwicklungsplan · Stand 17.10.2026**

## Leseregel
Die [TODO](../../TODO.md) ist die *einzige operative Aufgabenliste*. Diese Roadmap zeigt Abhängigkeiten und Entwicklungsziele, **kein selbst attestiertes Fertigstellungsprotokoll**. [Status](status.md) beschreibt ausschließlich nachprüfbare Ergebnisse. Frühere Visionen, Zeitpläne und alle Ideen der bisherigen Dokumentation wurden vollständig archiviert: [Original-Roadmap](../outdated/roadmap-snapshot-2026-10-17.md), [Original-TODO](../outdated/TODO-snapshot-2026-10-17.md), [README-Ideen](backlog-from-readme.md). Keine historischen Ideen wurden gestrichen.

## Jetzt — Gate A: zuverlässige Veröffentlichung (P0)
**Ziel:** eine nachweislich erreichbare HTTPS-PWA mit echter Offline-Nutzung.
1. Pages-Berechtigung in privatem Repo klären oder anderes HTTPS-Hosting verbinden.
2. HTTPS, Service-Worker-Scope, PWA-Manifest, PNG-Icons, MP3-/Video-Status 200/206 und Installation messen.
3. Medienrechte, Credits, Datenschutz und vollständiges Impressum vor öffentlicher Freigabe.
**Vorhanden:** automatischer Build, Veröffentlichungsworkflow, Offline-ZIP, Medien-Gate, 15 MP3s, 5 Videos. **Blocker:** GitHub Pages `Resource not accessible by integration`.

## Danach — Gate B: lebendige Generationen (P1)
- Bestehende Familien-Kernlogik (echte Kinder, Namensgruppen, Ehepartner-Abhängigkeit) zu Partnersuche, Ausbildung, Ehe, Beruf, Erbe und Tod verknüpfen.
- Demografische Langläufe und Save/Load-Migration nachweisen; Beziehungen und Reputation mit Rats-/Bürgeraufträgen verbinden.
- UI und Browser-E2E für Bürgerentscheidungen, Hotseat und persistente Chronik.
**Definition fertig:** 100+ Simulationsjahre ohne inkonsistente Familien, nachvollziehbare Tests und bedienbare Oberfläche.

## Gate C: kausale historische Simulation (P1–P2)
- Epoche verändert wirtschaftliche Produktion, Berufe, Technik, Militär, Friedenslösungen und Ereignisketten **mechanisch**.
- Dynamische Siedlungen, Transport und Diplomatie mit realen Ressourcenflüssen, nicht nur Beschreibungen.
- Historische Narrationen, Quellen/Unsicherheit und Zwischenszenen sorgfältig einordnen.

## Gate D: Stabilität und Portabilität (P1–P2)
- Performance-Budgets für 5.000+ Bürger, moderne Browser, Touch, Barrierefreiheit.
- Tests, Code-Splitting, Datenbankmigration, Versionierung, lokale/optional Cloud-Speicherung.
- Offene Legacy-Panels erst integrieren, testen und im Status ändern — nicht durch Existenz als abgeschlossen deklarieren.

## Langfristig — Vision (P3)
- Online-Mehrspieler, individuelle Bürgerrollen, Diplomatie, Gemeinschaft.
- Modding, Live-Geschichtsserver, akademische Inhalte und pädagogische Szenarien.
- Mehrsprachen, Spieleplattformen und spätere Desktop-/Mobil-Distribution.
- Optional echte 3D-Schlachten, VR/AR, transhumanistische und futuristische Szenarien bis 2200, parallele Geschichtsverläufe.
Die vollständig erhaltenen 2025/2026-Episoden **Sturm des Mittelalters, Funken der Renaissance, Donner der Revolution, Flammen der Weltkriege, Licht der Moderne, Schatten der Zukunft und Ewigkeit der Geschichte** stehen im [unveränderten Roadmap-Archiv](../outdated/roadmap-snapshot-2026-10-17.md).

## Abnahmeregel pro Ticket
Kernlogik + UI-Erreichbarkeit + Tests + Savegame-Verhalten (falls zustandsbehaftet) + Dokumentation; Veröffentlichung zusätzlich mit echtem Server-/Gerätenachweis. `main`-Merge != Internet-Deployment.
