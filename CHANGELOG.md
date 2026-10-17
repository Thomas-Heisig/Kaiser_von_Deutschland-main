# TODO — Kaiser von Deutschland
**Verbindliche operative Aufgabenliste · Stand 17.10.2026 · Referenz main: 28e35c82**

Die Aufgaben entsprechen dem nachgeprüften [Status](docs/00-meta/status.md) und den Meilensteinen der [Roadmap](docs/00-meta/roadmap.md). `[x]` bedeutet im Hauptspiel **implementiert und mindestens automatisiert geprüft**, `[~]` teilweise, `[ ]` offen. Ein in alten Unterlagen als „fertig“ bezeichnetes Modul ist ohne Benutzeroberfläche **nicht** abgeschlossen. Frühere Einträge gingen nicht verloren: [TODO-Archiv](docs/outdated/TODO-snapshot-2026-10-17.md), [README-Ideenbestand](docs/00-meta/backlog-from-readme.md), [historische Roadmap](docs/outdated/roadmap-snapshot-2026-10-17.md).

## P0 — Veröffentlichung und zuverlässiger Betrieb
- [ ] **HTTPS live schalten:** Pages wurde selbst mit `enablement: true` nicht erstellt (`Resource not accessible by integration`); Eigentümer aktiviert Pages in Settings oder verbindet privaten Cloudflare-Pages-Host. **Nicht als deployed deklarieren.**
- [ ] Anschließend echte URL mit HTTPS, HTTP 200/206 für MP3/MP4, korrektes Manifest, Scope und Service Worker messen.
- [ ] PWA-Installation auf iPad/Safari, Android/Chrome und Windows/Edge sowie Offlinebetrieb mit Musik und Video im Flugmodus prüfen.
- [ ] Vor öffentlicher Freigabe Impressum, Datenschutz, Musik-/Video- und Coverrechte, Urheber-/KI-Credits vervollständigen.
- [x] Installationsbutton, PNG-App-Icons 192/512, Offline-ZIP, dynamischer Videokatalog sowie Release-Prüfung der 15 MP3 und 5 MP4 im Build.
- [x] CI Typecheck, Vitest, Build und Chromium-Smoke der aktuellen `main`-Version bestanden.

## P1 — Stabilität, Gameplay, Bürger und Generationen
- [ ] Echte Partnervermittlung und Eheschließungen, regionale Namensräume sowie Geburten-/Sterblichkeitsbalance bei mehrjährigen Simulationen.
- [ ] Ausbildung, Berufe, Arbeitsplätze, Karrierewechsel, Familienbesitz und generationsübergreifende Erbschaften kohärent verbinden.
- [ ] Ratsdelegation: lebender früherer Delegierter / Zufall nach fünf Sekunden / manuelle Auswahl / Tod / Hotseat / Save-Load in vollständigen E2E-Tests abnehmen.
- [ ] Langfristiges Vertrauen, Loyalität, Rivalitäten, politische Fraktionen und regionale Produktion als Folgen von Rats-/Bürgeraufträgen.
- [ ] Ereignis- und Kampagnenschleifen mit historischen Epochen, Konfliktlösung ohne Krieg, technische Einheiten und Balance über Jahrhunderte.
- [ ] Chronik über Sitzungen hinweg speichern und bei großen Spielständen mit Begrenzung/Migration testen.
- [ ] Größere Spielstände, Bürgerzahlen >5.000 / 100.000, Browser-Latenz, Profiling, Benchmarks, deterministische Langläufe prüfen.
- [ ] Browser-E2E für Hotseat, Save/Load, Ratsentscheidungen, Tutorials und Fortschritt; WCAG und Touchgeräte ergänzen.

- [x] Einstellungen als fünf Tabs bereits im Startmenü und laufenden Spiel zugänglich; Bürgeraufträge nur in Navigation, Animation/Installation ausschließlich in Einstellungen.
- [ ] Einstellungen auf echtem iPad/Android mit Tastatur und Touch abnehmen.

## P2 — Spielerlebnis und Module
- [ ] Historische Video-3/4/5-Inhalte nach tatsächlicher Sichtung epochengetreu benennen und verorten; Audio-/Video-Übergänge auf Geräten prüfen.
- [ ] Hochauflösende Originalcover und vollständige Metadaten/Credits für 15 Musikstücke.
- [ ] WebGPU-Gerätetest (Modell, Lizenz, Download, Speicher, Inferenz), optionale Ollama-/Mini-KI-Reaktionen; KI bleibt Opt-in.
- [ ] Bürgeraufträge und Regionen, Produktion, Transport sowie lokale Sicherheit mit Wirtschaft und Familien verbinden.
- [ ] Vorhandene Legacy-Module (Religion, Marine, Recht, Bildung, Lebensphasen, Tagesrhythmus, Stadt, Ökologie) einzeln im Standardspiel zugänglich machen, nur danach als spielbar markieren.
- [ ] Geführtes Tutorial, historische Szenarien, achtsame Barrierefreiheit und internationales UI.
- [ ] Code-Splitting, Worker, verlässliche lokale Speicherung und optionales Cloud-Sync-Konzept.
- [ ] Vollständige, reproduzierbare Tests für LAN-ZIP und Versionen am Heimnetzserver durchführen.

## P3 — Langfristige Vision / aus README und Roadmap übernommen
- [ ] Online-Mehrspieler mit WebSocket, Reconnect, Lobby, Synchronisation, Schutz vor Betrug; kooperative Herrschaften.
- [ ] Perspektivwechsel für jede Bevölkerungsschicht, Rollen-Mehrspieler, soziale Bewegungen, Bürgerämter und individuelle Politik.
- [ ] Erweiterte historische Ereignisketten, Entdeckungsreisen, Finanzsysteme, Gerichte, Universitäten, Kunst, Medien, ökologische Wirkungen, Globalisierung.
- [ ] Modding-API, Plugins, eigene Szenarien, Replays, Communities, Schul-/Wissenschaftsversion.
- [ ] Electron/Capacitor, Desktop-/Mobile-Distribution, optionale Cloud-Spielstände, lokalisierte Sprachversionen.
- [ ] Perspektivisch 3D-Schlachtfeld, VR/AR, Raumfahrt, Zukunft, alternative Realitäten und prozedurale Narrative.

## Qualität und Dokumentation
- [ ] Testabdeckung nachvollziehbar messen und für Kernsysteme schrittweise auf 70 % bringen; Ist-Wert bisher nicht bestätigt.
- [~] Legacy-Architektur und veraltete Berichte systematisch von Live-Dokumentation getrennt; API-Referenz und Handbuch regelmäßig weiter aktualisieren.
- [x] Lokale Markdown-Links in README/TODO/Roadmap/Changelog/Status/Index/Ideenbestand automatisch in CI prüfen.
- [x] Verbindliche Ist-/Plan-Trennung, historische README-, TODO- und Roadmap-Snapshots, aktive Dokumentationsnavigation und Changelog-Reihenfolge angelegt.

**Vollständige historische Ideen:** [README-Ideenbestand](docs/00-meta/backlog-from-readme.md). Ausführliche technische Einträge, frühere PR-Notizen und alle Legacy-TODOs bleiben lesbar im [unveränderten TODO-Snapshot](docs/outdated/TODO-snapshot-2026-10-17.md); ein Archiv-Eintrag ist nicht stillschweigend erledigt.
