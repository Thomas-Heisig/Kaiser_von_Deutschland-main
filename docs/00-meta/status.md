# Aktueller Projektstatus — Kaiser von Deutschland
**Stand 24.10.2026 · Codebasis: main · Live unter https://thomas-heisig.github.io/Kaiser_von_Deutschland-main/**

## Belegt
- [Bürgerleben und Charakterautomatik](../05-technical-architecture/CITIZEN_LIFECYCLE.md): Versorgung statt dauerhaftem Bedürfnisverfall, Haushaltsgründung, fünf Charakterpläne und nachvollziehbare erwachsene Nachfolge. Zugewiesene Bürger sichtbar; automatische Hof-/Auftragsnachfolge erhält Aufgabenfortschritt. 60-Jahre-Demografie, Zehnjahres-Engine, Save/Load und Hotseat geprüft. Vollständige Suite: 328 bestanden, sieben vorhandene übersprungen.
- [Regionale Versorgung und Bedienbarkeit](../05-technical-architecture/REGIONAL_PROVISIONING.md): drei modellierte Versorgungsgebiete je Reich, bezahlte Hilfe, dauerhafte Speicher, tatsächliche Abwanderungsfolgen, Bürgeraufträge und budgetierte Automatik. Hotseat/BCE/Save/Load geprüft. Dauerhafte Zufriedenheits-/Stabilitätsanzeige, lesbare Chronik, sechs Bürgerrollen pro Seite und tragfähigerer Holzausbau; 317 Tests bestanden, sieben vorhandene übersprungen.
- [Ganderkesee](../05-technical-architecture/GANDERKESEE.md): amtliches Gelände, echtes Gewässernetz und zeitabhängige Ortsmarken; sechs Verwaltungsbereiche mit Sicher/Normal/Gewagt, Kassenabschluss, direkte Steuern, Garnisonsentwicklung und zusätzliche zeitabhängige Projekte. Abhängigkeiten und offene Dependabot-PRs integriert.
- [Frühstart ab 2000 v. Chr. und Geschichte & Zeitbild](../09-history-model/ZEITBILD.md): belegte Datierungen, Unsicherheitshinweise, regionale Kunst-/Kulturkarten, Monatsfilter und Save/Load vor der Zeitenwende. 20 historische Starts in Chromium geprüft; keine lückenlose Weltchronik und keine vollständige Regionalstil-Enzyklopädie.
- Persistente Strategiewelt mit Reisen, Entdeckung und Regionsfokus; 20 Nachbarn und 320/768/1024-px-Oberfläche automatisiert geprüft. Handelsverträge, Bündnisse, nachvollziehbarer Vertragsbruch und jährliche Rivalenreaktionen. [Spezifikation](../05-technical-architecture/STRATEGY_WORLD.md).
- Vier friedliche Kampagnenwege bis Sieg mit Save/Load getestet; Tests verwenden zusätzliche Startressourcen und ersetzen keine Balance-Abnahme.
- [Lastmessung](../reports/strategy-population-2026-10-24.md) mit 1.000/5.000/20.000 Bürgern, kompakteres rückwärtskompatibles Speicherformat. 20.000 Bürger benötigen weiterhin etwa 380 ms pro Monat inklusive Autosave; Worker und Mobilmessungen bleiben offen.
- Gemeinsames Epochenlayout ohne Seitenscrollen, virtueller Schreibtisch, sichtbare Flüsse; Lagebericht mit Tutorial, Quellen zur Jahresgeschichte und optionaler Ereignisautomatik (PR #96/#97).
- Standardspiel `src/main.ts` → `KingdomGameUI` → `GameEngine`, Build mit Vite/TypeScript.
- **Öffentlich spielbar via GitHub Pages** – HTTPS, PWA, Offline-Modus bestätigt.
- Lokaler Hotseat (2–4), Siedlung, Wirtschaft, Forschung, Bürgeraufträge, Ratsdialoge, Krieg, Kultur, Musik-/Filmmenü.
- 15 MP3- und fünf MP4-Dateien im Produktionsbuild, temporäre Cover, Browser-Download des ZIP; automatische Asset-Prüfung in CI.
- Ratsdelegation und historisch begrenzte Bürgeraufträge; reale Geburten, einfache familiäre Schwangerschaftsbedingungen, historische Namenslisten. Langzeitdemografie nicht validiert.
- **Echte Niederlagebedingungen** (Bankrott, Hungersnot, Anarchie) als monatliche Prüfung mit Erholungsrücksetzung und dauerhafter Festhaltung; Untergang pausiert das Spiel, schreibt die Chronik und öffnet die Niederlageseite. 12 Unit-Tests und 7 Engine-Integrationstests; Save/Load-Migration und Fehlalarmfreiheit belegt.
- **Interaktive Tutorial-Kampagne** (Bauen → Handeln → Forschen → Reichsrat → Speichern) mit Fortschrittskarte, Navigation, Ressourcen-Hilfe, Überspringen und Save/Load-Persistenz; 11 Unit-Tests und 9 Engine-Integrationstests.
- **Automatisierter End-to-End-Kampagnenabschluss**: vollständiger Lauf bis Sieg mit Zufallsereignissen und Zwischen-Save/Load, vollständiger Niederlage-Lauf mit Save/Load, Ausschluss „Niederlage ≠ Sieg", 10-Jahres-Balancing-Protokoll und 5-Jahres-Digitallauf; sechs Systemkopplungen über konkrete Zustandsänderungen nachgewiesen (12 Tests).
- CI, Unit-Tests, Produktionsbuild und Chromium-Smoke bestanden für `main`.

## Wichtige Grenzen
- **GitHub Pages ist aktiv – HTTPS, PWA und Offline-Modus bestätigt.** Reale Installation auf Windows/iPad/Android noch nicht umfassend getestet.
- Online-Multiplayer, detaillierte Berufe/Familien, durchgehende Jahrhunderte-Balance und 3D-Schlachtfelder sind nicht fertig.
- Versorgungsgebiete sind ein Spielmodell; individuelle Familien werden dadurch nicht geografisch umgesiedelt. Namenslisten sind zeitlich inspirierte Auswahl, keine belegte lokale Bevölkerungsliste.
- Ältere Berichte dokumentieren teils **Klassen, Prototypen oder alte Einstiege**; daraus folgt keine Hauptspiel-Freigabe.
- Paketmanifest-Version `2.5.1` beschreibt die Paketversion, nicht den vollständigen Fortschritt historischer Pläne oder eine neue produktive Veröffentlichung.

## Inventarisierung alter Feature-Zusagen

Die ursprüngliche README nennt unter anderem 15/35 Rollen, 23/68 Gebäude, 24 Technologien, 27/70 historische Ereignisse, sieben/zehn Religionen sowie zahlreiche spezialisierte Simulationssysteme. Diese Zahlen stammen aus unterschiedlichen historischen Entwicklungsständen und wurden **nicht als funktionsfähiger Umfang der aktuellen Spieloberfläche verifiziert**. Für jede Gruppe stehen jetzt konkrete Nachweis- und Integrationsaufgaben in [TODO](../../TODO.md) und [Roadmap](roadmap.md).

Die gemeinsame Einstellungsoberfläche mit fünf Tabs ist in CI und Browser-Smoke geprüft. Der frühere Pages-Berechtigungsfehler ist behoben; die Veröffentlichung erfolgt über den Vite-Workflow auf GitHub Pages.

## Aktuelle Priorität
[TODO](../../TODO.md) (P0 zuerst), [Roadmap](roadmap.md) und [Changelog](../../CHANGELOG.md). Vollständige historische Ideen: [README-Backlog](backlog-from-readme.md). Aktive Dokumente sind maßgeblich, Archivschnappschüsse bleiben lesbar.
