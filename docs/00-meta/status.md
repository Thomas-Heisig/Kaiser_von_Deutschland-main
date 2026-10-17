# Projektstatus – Kaiser von Deutschland

**Stand:** 17. Oktober 2026  
**Paketversion:** 2.5.1 (`package.json`; kein neues Release-Tag)  
**Phase:** Spielbarer browserlokaler Aufbau-/Kampagneneinstieg, weitere Systeme im Ausbau

## Produktionspfad
`src/main.ts → KingdomGameUI → GameEngine`. Spielstände liegen im Browser (LocalForage, teils `gzip-json-v1`). Die alternative SQL-Schicht ist kein Live-Savepfad.

## Nachgewiesen in GitHub
- PR #32 integriert: 15 Original-MP3s, zwei Intro-Videodateien, 15 SVG-Cover, neu benannte Assets, Musikauswahl und Download; kein prozeduraler Hintergrundmusikmotor mehr.
- Auf PR #32: CI (Typecheck/Build/Unit-Tests) und Chromium Browser Smoke erfolgreich. Ein erfolgreicher Browser Smoke ist kein menschlicher Hörtest.
- Hauptmenü mit Startjahrwahl, Kampagnen inklusive offenem Spiel, Reichsrat, Responsive-Layout und PixiJS/2D-Fallback.
- Wirtschaft, Forschung, Militär/Feldzüge, Spielstände und Hotseat im aktiven Einstieg vorhanden; nicht jede historisch dokumentierte Klasse ist vollständig spielbar.

## Video- und Audiostart
- `public/video/intro.mp4`: stummes Autoplay, Skip; nach Video „Zeit vergeht“ mit Browser-Autoplay-Fallback.
- `public/music/`: 15 benannte Originaltitel; `public/covers/`: 15 vorläufige Coverillustrationen.
- `GameAudio` gibt nur kurze UI-Spieleffekte aus, `MusicJukebox` spielt Originalaufnahmen und `GameAmbience` liefert optionale Atmosphäre.

## Nach wie vor offen
- Aktuelles `main`-Deployment auf der Live-Spielseite, Downloadlinks sowie echte Audio-/Videowiedergabe auf Geräten prüfen.
- Original-Cover und Titeldaten (Urheber, Stil, Nutzungsrecht) ergänzen.
- Bürgerperformance über 5.000/100.000, Langzeit-Balancing, Accessibility, Crossbrowser und Speicherstände testen.
- Legacy-UI und SQL-Adapter nur nach Migrations-/Testnachweis konsolidieren.
- Divergierte historische Featurebranches vor Löschung einzeln mit der tatsächlich auf `main` implementierten Funktion vergleichen; blindes Mergen vermeiden.

Aktive Aufgaben: [TODO](../../TODO.md). Für Auslieferung: [Betriebshandbuch](../06-development/operations-guide.md).


## Release-Gate 17.10.2026
- CI und Chromium-Smoke für `main` erfolgreich; Browser-Smoke deckt Hanse-UI inkl. echter Routenaktivierung ab.
- GitHub Pages **nicht aktiv**: Automatischer Enablement-Versuch endet mit GitHub-Permissionsfehler. HTTPS-Erreichbarkeit und installierte PWA sind unbestätigt.
- Roadmap-Fortsetzung im Branch: Geburten, historische Namensgruppen und partnergebundene Familienentwicklung; Langzeitbalance noch offen.
