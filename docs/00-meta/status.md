# Aktueller Projektstatus — Kaiser von Deutschland
**Stand 24.10.2026 · Codebasis: main · Live unter https://thomas-heisig.github.io/Kaiser_von_Deutschland-main/**

## Belegt
- Standardspiel `src/main.ts` → `KingdomGameUI` → `GameEngine`, Build mit Vite/TypeScript.
- **Öffentlich spielbar via GitHub Pages** – HTTPS, PWA, Offline-Modus bestätigt.
- Lokaler Hotseat (2–4), Siedlung, Wirtschaft, Forschung, Bürgeraufträge, Ratsdialoge, Krieg, Kultur, Musik-/Filmmenü.
- 15 MP3- und fünf MP4-Dateien im Produktionsbuild, temporäre Cover, Browser-Download des ZIP; automatische Asset-Prüfung in CI.
- Ratsdelegation und historisch begrenzte Bürgeraufträge; reale Geburten, einfache familiäre Schwangerschaftsbedingungen, historische Namenslisten. Langzeitdemografie nicht validiert.
- **Echte Niederlagebedingungen** (Bankrott, Hungersnot, Anarchie) als monatliche Prüfung mit Erholungsrücksetzung und dauerhafter Festhaltung; Untergang pausiert das Spiel, schreibt die Chronik und öffnet die Niederlageseite. 12 Unit-Tests und 7 Engine-Integrationstests; Save/Load-Migration und Fehlalarmfreiheit belegt.
- CI, Unit-Tests, Produktionsbuild und Chromium-Smoke bestanden für `main`.

## Wichtige Grenzen
- **GitHub Pages ist aktiv – HTTPS, PWA und Offline-Modus bestätigt.** Reale Installation auf Windows/iPad/Android noch nicht umfassend getestet.
- Online-Multiplayer, detaillierte Berufe/Familien, durchgehende Jahrhunderte-Balance und 3D-Schlachtfelder sind nicht fertig.
- Ältere Berichte dokumentieren teils **Klassen, Prototypen oder alte Einstiege**; daraus folgt keine Hauptspiel-Freigabe.
- Paketmanifest-Version `2.5.1` beschreibt die Paketversion, nicht den vollständigen Fortschritt historischer Pläne oder eine neue produktive Veröffentlichung.

## Inventarisierung alter Feature-Zusagen

Die ursprüngliche README nennt unter anderem 15/35 Rollen, 23/68 Gebäude, 24 Technologien, 27/70 historische Ereignisse, sieben/zehn Religionen sowie zahlreiche spezialisierte Simulationssysteme. Diese Zahlen stammen aus unterschiedlichen historischen Entwicklungsständen und wurden **nicht als funktionsfähiger Umfang der aktuellen Spieloberfläche verifiziert**. Für jede Gruppe stehen jetzt konkrete Nachweis- und Integrationsaufgaben in [TODO](../../TODO.md) und [Roadmap](roadmap.md).

Im neuesten `main` ist die gemeinsame Einstellungsoberfläche mit fünf Tabs bereits in CI und Browser-Smoke geprüft. Der HTTPS-Pages-Workflow scheiterte weiterhin an GitHub-Berechtigungen.

## Aktuelle Priorität
[TODO](../../TODO.md) (P0 zuerst), [Roadmap](roadmap.md) und [Changelog](../../CHANGELOG.md). Vollständige historische Ideen: [README-Backlog](backlog-from-readme.md). Aktive Dokumente sind maßgeblich, Archivschnappschüsse bleiben lesbar.
