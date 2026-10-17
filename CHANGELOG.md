# Changelog
Änderungen im Git-Repository, nach [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Die Paketversion ist weiterhin `2.5.1`; nachstehende Änderungen sind bisher **unveröffentlicht**. Die vollständige historische Änderungsliste wurde vor der Neuordnung archiviert.

## [Unreleased] — Stand 17.10.2026

### Added
- Begrenzte Reichschronik wird mit dem Spielstand gespeichert, beim Laden wiederhergestellt und über einen Save/Load-Test abgesichert.
- Drei historisch begrenzte Bürgeraufträge aus dem ursprünglichen Ideenbestand: Seuchenhilfe, Bewässerung und Kulturförderung.
- Browserbasierte Hauptoberfläche, mehrere Epochen, sechs Kampagnen und Hotseat (2–4) mit Forschungs-, Handels- und Ratsentscheidungen.
- Vollständige Musikbibliothek mit 15 MP3-Titeln, Covergalerie und Download; fünf MP4-Filme mit Intro-/Outro-/Zwischenszene.
- Bürgeraufträge mit Epochenverfügbarkeit, Kosten, Abschluss und Biografie; Bürgerauswahl berücksichtigt Beruf/Fähigkeiten.
- Wiederkehrende Ratsereignisse merken den früheren lebenden Delegierten, andernfalls Vorauswahl nach fünf Sekunden; Entscheidungen bleiben ausdrücklich nutzerbestätigt.
- Auswirkungen von Beruf, Charakterzügen, Ansehen und Führungserfahrung auf delegierte Ratsentscheidungen.
- Echte Familiengeburten, Eltern-Kind-Beziehungen, schwangerschaftsgebundene Familienmechanik, epochenbezogene Vornamen und echte demografische Geburtenzählung.
- Offline-ZIP für vertrauenswürdiges Heimnetz, PWA-Manifest, Service Worker, Installationsbutton, PNG-Icons und HTTPS-Pages-Workflow.
- Release-Gate in CI für 15 MP3s, fünf MP4-Dateien, Filmdatenbank, ZIP und PWA-Pfade.

### Changed
- Frühere README-Featureversprechen (Rollen, Gebäude, Technologie, Geschichte, Politik, Religion, Militär, Marine, Umwelt, Kultur, Wirtschaft und Mehrspieler) mit konkreten Nachweis- und Integrationsaufgaben in Roadmap/TODO zurückgeführt.
- Dokumente TODO und CHANGELOG nach einem früheren fehlerhaften Austausch wieder ihren korrekten Inhalten zugeordnet.
- Einstellungssystem in fünf responsiven Kategorien gruppiert, auf Startbildschirm und im Spiel erreichbar; Bürgeraufträge, Installation und Animationsschalter aus der Kopfzeile entfernt. Anzeigepräferenzen lokal speicherbar.
- Responsives Tablet-/Mobil-Layout, sichtbare Bürgeraufträge, WebGPU-Start-/Statusanzeige und optionale lokale Mini-KI.
- README, Status, Roadmap und operative TODO werden gegen den tatsächlichen aktiven Git-Stand abgegrenzt; sämtliche älteren Planungen bleiben archiviert.

### Fixed
- Historisch eingeschränkte Bürger-/Militäraktionen und Savegame-kompatible Familienbeziehungen.
- Release-Prüfung von Audio-/Filmdateien; Typcheck- und Testfehler aus den zugehörigen Feature-Branches korrigiert.

### Known limitations (unreleased)
- GitHub Pages **nicht öffentlich verfügbar**: Fehler `Resource not accessible by integration` bei automatischem Aktivierungsversuch.
- Keine Endgeräteabnahme für PWA, Medienrechte/Impressum/Datenschutz vor Veröffentlichung offen.
- Generations-Balance, Partnervermittlung, Erbschaften, Online-Mehrspieler und große Epochen-Simulation weiterhin Roadmap-Themen.

## Historische Versionseinträge
Die vollständige alte Versionschronik, einschließlich der alten 2.3.x–2.6.0-Entwicklungsberichte, wurde **wortgetreu** nach [Changelog-Archiv](docs/outdated/CHANGELOG-snapshot-2026-10-17.md) übernommen. Ältere „fertig“-Meldungen sind Projektberichte ihrer Zeit und nicht automatisch Freigaben der jetzigen Standardkampagne.
