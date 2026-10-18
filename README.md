# Kaiser von Deutschland

Historische Strategiesimulation mit einer spielbaren, lokalen Aufbaukampagne, Gesellschafts- und Bürgerentwicklung sowie optionalen KI-Hilfen. **Aktueller Einstieg:** `src/main.ts` → `src/ui/KingdomGameUI.ts` → `src/core/GameEngine.ts`. Ältere Frameworks und Planungsstände sind nicht automatisch im Hauptspiel enthalten.

> **Stand 18.10.2026:** Quellcode und Builds auf `main` geprüft. CI und Chromium-Smoke bestanden.

## Spielen

### 🌐 Online (GitHub Pages)

Das Spiel ist öffentlich spielbar unter:

**https://thomas-heisig.github.io/Kaiser_von_Deutschland-main/**

> PWA-Installation, Offline-Modus und alle Medien sind auf diesem Weg verfügbar.  
> Spielstände liegen lokal im Browser (IndexedDB) – kein Cloud-Backup.  
> Bei Audio-Problemen: Einmal auf die Seite klicken, dann startet der Ton.

### 💻 Lokal

Node.js 20+ und npm erforderlich.

```bash
npm ci
npm run dev
# Browser: http://localhost:4100
```

```bash
npm run check
npx vitest run
npm run build
node scripts/verify-release-assets.mjs
npm run preview
```

`npm run build` erstellt `dist/` mit den 15 MP3-Titeln, fünf Videos, Albumcovern, PWA-Icons und `dist/downloads/kaiser-von-deutschland-offline.zip`.

## Im aktiven Hauptspiel verfügbar

## Im aktiven Hauptspiel verfügbar

- Einzelspieler und lokaler Hotseat mit 2–4 Herrschern (kein Online-Mehrspieler).
- Aufbauwirtschaft, Markt, Forschung, Handel/Schifffahrt, Diplomatie, Kultur und Hofverwaltung; Epoche und Startjahr wählbar.
- Historisch begrenzte Bürgeraufträge mit Kosten, mehrmonatigem Fortschritt und Lebensläufen; im Spiel über **⚒ Bürgeraufträge** erreichbar.
- Ratsdilemmata: Wiederkehrende Ereignisse merken sich den früheren Delegierten, wenn er lebt. Sonst wird nach fünf Sekunden ein zufälliger lebender Erwachsener **vorausgewählt**. Die eigentliche Entscheidung verlangt weiterhin Delegation durch den Spieler; Berufs- und Persönlichkeitsmerkmale beeinflussen sie.
- Familien: reale Kinder bei Schwangerschaftsende, Eltern-Kind-Relationen, einfache Schwangerschaftsbedingungen und historisch angelehnte Vornamen. Komplexe Partnervermittlung, Erbschaften und lange Generationenbalance fehlen.
- Soundtrack mit **15 MP3s**, Covergalerie, **fünf MP4-Videos**, alternativen Intros/Outros und optionalen Zwischensequenzen.
- Service Worker, Installationsbutton und offline vorbereitbares ZIP. Auf HTTP im Heimnetz ist ZIP-Download möglich; PWA-/Service-Worker-Installation benötigt HTTPS oder localhost.

Alle angegebenen Bereiche sind Teil der aktuellen Aufbaukampagne; die Reife einzelner Inhalte steht im [Status](docs/00-meta/status.md).

## Ideen und Vorarbeiten aus der alten README

Die historische README beschreibt zahlreiche Erweiterungen, die teils in Quellcode oder separaten Panels existieren, aber noch nicht vollständig mit der laufenden Aufbaukampagne verbunden sind: zusätzliche Rollen und Lebensphasen, Religions- und Kulturgruppen, historische Ereignisketten, Migrations-, Umwelt-, Marine-, Spionage-, Gefangenen- und Finanzsysteme sowie Online-Mehrspieler. Die **vollständige, konkret nach Themen gegliederte Integrationsliste** steht in [TODO](TODO.md) und [Roadmap](docs/00-meta/roadmap.md). Keine der früheren Ideen wurde gelöscht; die Zahlen aus alten Releases sind keine aktuelle Zusage.

## Veröffentlichung und Sicherheit

Das Spiel ist live unter **GitHub Pages**:  
[https://thomas-heisig.github.io/Kaiser_von_Deutschland-main/](https://thomas-heisig.github.io/Kaiser_von_Deutschland-main/)

Der Deployment-Workflow `.github/workflows/deploy-pages.yml` baut bei jedem Push auf `main` und veröffentlicht automatisch auf GitHub Pages. Voraussetzung: In **Settings → Pages → Source: GitHub Actions** muss diese Quelle ausgewählt sein.

Für öffentliche Veröffentlichung müssen vollständiges Impressum, Datenschutz und Rechte an Medien geprüft werden. Details: [Deployment-Anleitung](docs/06-development/public-deployment.md).

## Dokumentation – verbindliche Orientierung

| Dokument | Zweck |
| --- | --- |
| [Projektstatus](docs/00-meta/status.md) | Belegter Ist-Zustand, Tests, Grenzen und Blocker |
| [TODO](TODO.md) | **Einzige operative Aufgabenliste**, nach P0–P3 |
| [Roadmap](docs/00-meta/roadmap.md) | Geplante Entwicklung/Meilensteine; kein Fertigstellungsbeweis |
| [Ideen aus der alten README](docs/00-meta/backlog-from-readme.md) | Sämtliche früheren Ideen und Behauptungen, ohne Verlust |
| [Changelog](CHANGELOG.md) | Tatsächlich integrierte Änderungen nach Git-Stand |
| [Dokumentationsindex](docs/INDEX.md) | Aktive, historische und archivierte Dokumentation |
| [Gameplay-Tests](GAMEPLAY_TESTING_GUIDE.md) | Manuelle Testfälle und Grenzen |
| [Betrieb](docs/06-development/operations-guide.md) | Betrieb und Releases |
| [Beitragen](CONTRIBUTING.md) / [Sicherheit](SECURITY.md) | Entwicklungs- und Meldeprozess |

Die vollständige frühere README mit allen historischen Featurebeschreibungen bleibt [unverändert im Archiv](docs/outdated/README-snapshot-2026-10-17.md). Die früheren Planstände sind ebenfalls archiviert. Ihre Ideen sind in den [Ideenbestand](docs/00-meta/backlog-from-readme.md) überführt und in TODO/Roadmap als Planungsquelle berücksichtigt. Historische Aussagen wie „15 Rollen“ oder „fertig“ belegen **nicht**, dass diese Rolle in der gegenwärtigen Benutzeroberfläche verfügbar ist.

## Mitarbeit, Lizenzen und Grenzen

Quellcode: [MIT-Lizenz](LICENSE); Musik, Cover, Videos und Rechte Dritter fallen **nicht automatisch** unter MIT. Die KI-Funktionen sind optional, WebGPU/Ollama standardmäßig nicht aktiv. Spielstände liegen lokal im Browser und sind kein Cloud-Backup.

Das Projekt orientiert sich an klassischen Kaiser-Strategiespielen, ist jedoch eine eigene alternative Geschichtssimulation. Weitere Konzepte (Online-Mehrspieler, Rollen für jeden NPC, Stadtleben, Schulen, Politik, Zukunft, Modding) bleiben ausdrücklich im Backlog erhalten.
