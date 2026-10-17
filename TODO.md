## Roadmap: Generationen und Lebensläufe (17.10.2026)
- [x] Zeittypische Vornamen für geborene Bürger, verschiedene Namensgruppen vom Mittelalter bis Moderne (fiktionale Simulation).
- [x] Einfache regelgebundene Schwangerschaftsentstehung für zusammenlebende erwachsene Ehepaare, Gesundheits- und Nahrungsschranken, Geburtenabstand.
- [ ] Automatische Eheschließungen und Partnerfindung, regionale kulturelle Namensräume und Geburten-/Sterblichkeitsbalance in langen Spielserien.
- [ ] Integrationstests mit festen Zufallsquellen und umfangreichen Generationssimulationen; echte Geräteabnahme.

## HTTPS/PWA Freischaltung und Fallback (17.10.2026)
- [x] PWA-App-Icons als echte PNGs (192/512 px) automatisch beim Build generieren und im Manifest referenzieren.
- [x] HTTPS-Workflow versucht GitHub Pages mit enablement=true zu aktivieren.
- [x] Separates buildbares Website-Artefakt in GitHub Actions hinterlegen, falls GitHub Pages nicht für privates Repository verfügbar ist.
- [~] GitHub Pages scheitert nach enablement=true mit `Resource not accessible by integration` (17.10.2026, Workflow 39067803181). Pages muss vom Kontoinhaber in Settings aktiviert werden, alternativ privaten Cloudflare-Pages-Host verbinden.
- [ ] Exakte HTTPS-Adresse mit echtem Gerät öffnen, Installation sowie Offline-Modus verifizieren.

## Browserinstallation – PWA-Bedienung (17.10.2026)
- [x] Sichtbaren „Spiel installieren“-Button in der Spielleiste und den Einstellungen eingebaut.
- [x] Browser-Installationsdialog bei entsprechender Browserfreigabe anbieten; iPad/Safari-Fallback mit „Zum Home-Bildschirm“ erläutern.
- [ ] Nach GitHub-Pages-Freischaltung echte HTTPS-Installation auf iPad, Android und Windows kontrollieren.
- [x] PNG-App-Icons 192/512 px beim Build erzeugen und in der PWA referenzieren.
- [ ] Installability-Abnahme auf echtem HTTPS-Host und Mobilgeräten (Pages derzeit nicht freigeschaltet).

## HTTPS-Installation (17.10.2026)
- [x] GitHub-Pages-Build für Projekt-Unterpfad, PWA/Service-Worker-Scope und Medienpfade vorbereitet.
- [x] GitHub Actions Deployment-Workflow ergänzt, Auslieferung nur nach erfolgreichem Build/Tests.
- [ ] GitHub Pages in Repository-Einstellungen unter Settings → Pages mit Source GitHub Actions aktivieren; bei privatem Repo Planberechtigung prüfen.
- [ ] HTTPS-URL nach Deployment tatsächlich öffnen und PWA-Installation, 15 Titel, fünf Filme und Offline-Modus auf Geräten abnehmen.
- [ ] Falls Pages bei privatem Repo nicht verfügbar ist: Cloudflare Pages mit privatem GitHub-Repo verbinden (Build npm ci && npm run build; Output dist; Basis-Pfad root).
- [ ] Nutzungsrechte, Datenschutz und Impressum vor öffentlicher Veröffentlichung prüfen. HTTPS alleine schützt diese Anforderungen nicht.

## Bürgerpersönlichkeit bei delegierten Ratsentscheidungen (17.10.2026)
- [x] Bürger wählen bei ausdrücklich delegierten Ratsentscheidungen anhand von Beruf, Fähigkeiten, Mut, Ehrgeiz, Disziplin und Mitgefühl.
- [x] Nur finanzierbare Antworten zulassen; keine externe KI oder automatisches Ausführen einer Ratsentscheidung.
- [x] Delegierte Ratsentscheidungen beeinflussen Ansehen und Führungsfähigkeit des Bürgers; Ergebnis in persönlichem Lebenslauf dokumentiert.
- [ ] Langfristiges Vertrauen und Beziehungen zu Familien und regionalen Interessengruppen aus Entscheidungen ableiten.
- [ ] Browserabnahme von erneutem Ratsereignis nach Charaktertod und Hotseat.

## Wiederkehrende Ratsereignisse – Bürgerauswahl (17.10.2026)
- [x] Beim wiederkehrenden Ratsereignis bevorzugt denselben zuvor beauftragten Bürger, wenn er noch lebt und verfügbar ist.
- [x] Falls es keine lebende frühere Bezugsperson gibt, nach fünf Sekunden einen zufälligen lebenden Erwachsenen vorauswählen.
- [x] Manuelle Änderung unterbricht die automatische Auswahl; die eigentliche Ratsentscheidung wird **nicht** automatisch ausgelöst.
- [x] Bestehende im Spielstand gespeicherte Ratschronik als Identitätsgedächtnis nutzen; keine neue ungesicherte Parallelstruktur.
- [ ] Langzeit-Browserabnahme: wiederkehrendes Ereignis, Tod des Delegierten, manuelle Auswahl, Hotseat und Save/Load.

## Sichtbarkeit der Bürgeraufträge und echte Geburten (17.10.2026)
- [x] Bürgeraufträge direkt in der oberen Spielleiste als hervorgehobene Schaltfläche anbieten (auch bei langer Navigation).
- [x] Schwangerschaftsende erzeugt tatsächlich einen neuen Bürger mit Familienzuordnung und beidseitigen Eltern-Kind-Relationen.
- [x] Bereits vorhandene Familien- und Spielstanddatenfelder verwenden; Geburt beim monatlichen Bürgerdurchlauf ohne Map-Mutation-Probleme.
- [ ] Historisch und kulturell angepasste Vornamen und geregelte Partner-/Schwangerschaftslogik ergänzen (derzeit Platzhaltername).
- [x] Demografische Geburtenzählung aus tatsächlich erzeugten Kindern im aktuellen Spieljahr ableiten; keine simulierten Phantomgeburten mehr.
- [ ] Prüfen, ob bei alten Speicherständen unterschiedliche Geburtsdaten und Datumsübergänge eine Migration benötigen.
- [ ] Generationsübergreifende Vermögensverteilung, Jugend-/Ausbildungsphase, Familiengründung und Sterbefälle langfristig balancieren.
- [ ] Live-Deployment prüfen, damit die neue Schaltfläche auf der tatsächlich geöffneten Spielseite sichtbar ist.

## Historische Filmsequenzen und Bürgerbiografien (17.10.2026)
- [x] Dynamischer Filmkatalog aus tatsächlich vorhandenen Dateien beim Build; Auswahl von Intro, Outro und Zwischenfilm.
- [x] Optionale Zwischenfilme für historische Meilensteine mit Überspringen, Tonsteuerung und Vorschau.
- [x] Bürgeraufträge bewerten auch Berufserfahrung/Disziplin; Abschlüsse schreiben Lebenslaufereignisse.
- [x] Drei weitere Videos (`Video 3.mp4`, `Video 4.mp4`, `Video 5.mp4`) liegen auf `main` und erscheinen automatisch im Filmkatalog; Offline-Medienliste ergänzt.
- [ ] Inhaltliche Epochenzuordnung der drei Clips nach tatsächlicher Sichtung, endgültige Filmtitel, passende Zwischenszenen festlegen.
- [ ] Authentische Zeitabschnitte, historische Sprechertexte, Filmrechte und Fades am tatsächlichen Endgerät abnehmen.
- [ ] Echte mehrstufige Familien-, Berufs- und Gesellschaftsentwicklung inklusive Spielerentscheidungen erweitern.

## Lebendige Geschichte: zivile Bürgeraufträge (17.10.2026)
- [x] Epochengebundene Bürgeraufträge vom Mittelalter bis zur Digitalisierung.
- [x] Mehrmonatiger Verlauf, Vorabkosten, reale Abschlussbelohnung und Fähigkeitenentwicklung.
- [x] Aufträge speichern/laden und im eigenen Spielfenster verwalten.
- [x] Fachberufe, Disziplin, Erfahrung und lokales Sicherheitsniveau wirken sich begrenzt auf zivile Auftragsresultate aus (Tests ergänzt).
- [x] Fünf weitere zeitgebundene zivile Aufträge: Fischfang, Mühlen, Buchdruck, Eisenbahn, Elektrifizierung.
- [ ] Regionales Produktionsmodell und echte Berufs-/Familienwechsel mit Bürgeraufträgen verbinden; bisher nur die persönliche Sicherheitskennzahl als lokaler Faktor.
- [x] Bürgerauswahl für Aufträge priorisiert passende Berufe und Fähigkeiten, blendet bereits Beauftragte aus und zeigt Erfahrung.
- [ ] Zusätzliche Berufsgruppen und zivile Geschichten mit fortlaufenden Beziehungen ergänzen.

## Geschichte & Gameplay – Militär (17.10.2026)
- [x] Historische Militärdoktrinen, Einheitenbezeichnungen und Stärkeverhältnisse nach Spieljahr.
- [x] Rivalennamen und Konflikt-/Angriffsbezeichnungen nach Epoche.
- [x] Fortifikationswirkung der historischen Waffenentwicklung angepasst.
- [x] Schlachtvorschau und tatsächliche Kampfauflösung auf denselben Jahreswert ausgerichtet.
- [x] Tests für Epochen, Einheiten, Rivalen und Speicherstandskompatibilität.
- [ ] Weitere zivile Aufträge, NPC-Lebensläufe und diplomatische Systeme dynamisch an die Epoche binden.
- [ ] Spätere Epochen um eigenständige technische Einheiten und nichtmilitärische Konfliktlösung ergänzen.

## Heimnetz-HTTP und Offline-ZIP (17.10.2026)
- [x] Direktdownload der vollständigen Spielversion als erzeugtes ZIP über LAN-HTTP bereitstellen; Spiel, 15 Musikstücke, Cover, fünf MP4 und lokale Windows-Startanleitung.
- [x] Service-Worker-Caching bleibt auf HTTPS/localhost begrenzt; HTTP-ZIP-Download benötigt keinen sicheren Browserkontext.
- [ ] **HTTPS-Spielseite erzeugen und veröffentlichen**: Hosting-Anbieter, Domain, TLS-Zertifikat, automatische Deployments aus `main`, echte öffentliche URL und PWA-Installation auf Mobilgeräten.
- [ ] Vollständigen ZIP-LAN-Download auf Windows im Heimnetz prüfen, lokal entpacken und ohne Internet starten; Browser-Cache und Speicherplatz beobachten.
- [ ] Neues ZIP und Dateiversion auf dem echten Heimnetzserver nach jedem Release prüfen; Vite-Dev-Server nicht als öffentliches Hosting verwenden.

## Offlinezugriff & Medienfehler (17.10.2026)
- [x] Audiofehler beim Abspielen mit konkreter Netzwerk-/Formatdiagnose und 15-Titel-Check.
- [x] WebGPU-Prüfung mit tatsächlicher Grafikkartenadapter-Abfrage repariert.
- [x] Einstellungsfenster um Musiklautstärke, Kartenanimation und Offline-Paket erweitert.
- [x] Service Worker + Installationsmanifest; alle produktiven JS/CSS/HTML-Ressourcen und Medien nach Klick vollständig cachen.
- [ ] Website auf HTTPS-Hosting veröffentlichen, konkrete öffentliche Adresse prüfen.
- [ ] Reale Offline-Abnahme auf iPad/Android/Windows im Flugmodus (inkl. Musik und Video).
- [ ] Fehlgeschlagene MP3-URLs auf dem Live-Hosting kontrollieren und gegebenenfalls nachdeployen.

## Musikcover und WebGPU-Betriebszustand (17.10.2026)
- [x] Alle 15 Screenshot-Cover den Musiktiteln zugeordnet und statt SVG-Platzhaltern eingebaut.
- [x] WebGPU-KI erhält expliziten Startbutton und prozentuale Lade-/Initialisierungsanzeige.
- [x] Sichtbare Statusmeldungen für „nicht geladen“, „lädt“, „bereit“, Fehler und Antworttest.
- [ ] Hochauflösende originale Coverdateien ergänzen (Screenshots sind nur begrenzt aufgelöst).
- [ ] Echten WebGPU-Modelldownload und Inferenz auf Ziel-PC und iPad testen.

## Integriertes Mininetz & iPad-Layout (17.10.2026)
- [x] Mini-Neuronennetz mit festen eingebetteten Gewichten, komplett offline ohne Downloads oder Netzaufrufe, als Opt-in-Berater.
- [x] KI-Unterstützung standardmäßig aus; optionales WebGPU/Ollama nur nach Auswahl.
- [x] Ollama-Option ausschließlich lokaler Host, Modellname konfigurierbar.
- [x] Sichtbarer Viewport auf iPad/Safari: visualViewport-Berechnung, Touch- und Querformat-CSS.
- [x] Tablet-Kompaktlayout für 761–1180 px und mobile Ansichten; bildschirmfüllende Sidebar-Dialoge.
- [ ] Reale iPadOS Safari-, Android Chrome- und Tablet-Landscape-Prüfungen; WebGPU-/Ollama-Modelltests.
- [ ] Epochengetreue KI-Autonomie (historische Aktionsräume, delegierte mehrmonatige Arbeitsaufträge) implementieren.

## Historische Ratsereignisse, Bürger und WebGPU (17.10.2026)
- [x] Rat um fünf epochengebundene Krisentypen ergänzt und frühere Ratsereignisse zeitlich eingegrenzt.
- [x] Vorhandene zufällige Ereignisse um grundlegende historische Begriffsfilter ergänzt.
- [x] Ratsbeschluss an lebenden Bürger delegieren, Name und ID in Chronik/Speicherstand vermerken.
- [x] Schaltfläche Einstellungen mit WebGPU-Prüfung und lokaler Regelberatung.
- [x] Optionale WebLLM-Prototyp-Anbindung für kleinen Ratsberater, Start nur nach Nutzeraktion.
- [ ] End-to-End-Download, Latenz, Gerätespeicher und Lizenz der WebGPU-Modellkennung auf realen Geräten prüfen; Modellanbieter/Version ggf. aktualisieren.
- [ ] Ereignisse/Kriege/Bauaufgaben systematisch statt nur erzählerisch nach Epoche balancieren (Kampfklassen, Waffen, Technik, Kosten, Siegbedingungen).
- [ ] KI-Beratung stärker mit Bürgerfähigkeiten, Ressort und Reputation verbinden.
- [ ] Browser-Smoke für Delegationsablauf und Einstellungsdialog erweitern.

## Startfilm, Epochenkampagnen, Grafik und Web-Zugang (17.10.2026)
- [x] Längere Filmversion als Intro nach Studiokarte „Eine Thomas Heisig Produktion“ mit Whoosh.
- [x] Kurzes Intro als Outro beim Beenden in das Hauptmenü.
- [x] Startmenü: Titel „Zeit vergeht“ mit Play/Pause.
- [x] Kampagnen anhand der Startepoche auswählbar, zusätzliche Industrie-/Nachkriegs-/Digital-Kampagnen.
- [x] Jahreszeitliche Atmosphäre und weitere PIXI-Grafikdetails ergänzt.
- [x] Anleitung für sicheren öffentlichen HTTPS-Betrieb erstellt.
- [ ] Hosting-Konto verbinden, `main` aus `dist` öffentlich bereitstellen und Live-URL prüfen.
- [ ] Audio-/Videoübergänge und Spielgrafik auf tatsächlichen Geräten visuell und akustisch kontrollieren.
- [ ] Nutzungsrechte/Impressum vor öffentlicher Freigabe finalisieren.

## Playlist, Bildschirm und Charaktere (17.10.2026)
- [x] Playback: epochenabhängig, zufällig, sequenziell; wiederholen alle/ein Titel/aus, lokal gespeichert.
- [x] Kompakte Playlist mit einklappbarer Titelcovergalerie.
- [x] Sidebar-Bereiche als responsives Dialogfenster mit Außenklick, Escape und Schließen.
- [x] Layout für Desktop, Tablet und Handy auf verfügbare Breite/Höhe angepasst.
- [x] Figurenangebot ausgewogen nach sozialen Klassen statt vorwiegend Adelige.
- [ ] Manuelle Touch-/Portrait-/Landscape-Prüfungen auf Zielgeräten und echter Test von Epoche-Playlist-Wechseln.

## Kompakter Hauptscreen und Ton-Autoplay (17.10.2026)
- [x] Film versucht Wiedergabe mit Originalton; bei Browser-Autoplay-Sperre kann das Intro mit einem Klick freigegeben werden.
- [x] „Zeit vergeht“ startet im Anschluss automatisch; kein separater Musikstartknopf. Browserautoplay kann dennoch eine Interaktion erfordern.
- [x] Musik-/Klangregler und überzählige Audioknöpfe entfernt; Titelgalerie und Downloads bleiben.
- [x] Kompaktere Desktop-Oberfläche mit verkleinerter Karte, reduzierten Abständen und direkten Herrschaftsaktionen.
- [x] Spieljahr/Epocheninformationen per Klick im Header erreichbar.
- [x] Automatische Zeit nach erledigter Ratsentscheidung und Speichern wieder aufnehmen, sofern vorher aktiv.
- [x] Rechte/KI/Datenschutz-Informationen als Dialog ergänzt (Projektinhaber Thomas Heisig).
- [ ] Vollständiges Impressum mit ladungsfähiger Kontaktanschrift und titelbezogenen Rechten/KI-Quellen ergänzen.
- [ ] Abnahme auf Live-Browser: akustische Tonspur im Intro, lückenloser Übergang, Scrollfreiheit bei Desktop-Auflösung, Spielzeitlogik, Kontrast und Zugänglichkeit.

## Repository-Konsolidierung (17.10.2026)
- [x] PR #32 nach grüner CI und Chromium-Smoke-Prüfung per Squash in `main` zusammengeführt.
- [x] Legacy-Synthesizer-Musikengine und alte numerische Medienpfade aus der produktiven Struktur entfernt.
- [x] Dokumentation und README an 15 Originaltitel, Filmstart und Cover angepasst.
- [x] 24 ältere Feature-/Fix-/Testbranches gegen `main` geprüft: viele historisch divergiert, obwohl ihr Funktionsumfang bereits via frühere PRs integriert wurde.
- [ ] Divergierte Altbranches **nicht** blind mergen; bei konkreter Funktionslücke gezielt nacharbeiten oder selektiv übernehmen.
- [ ] Altbranches nach archivierter Zuordnung/Abgleich über GitHub-Oberfläche löschen (keine historisch wertvolle Arbeit ohne Abgleich löschen).
- [ ] Live-Deployment-Pipeline für `main` dokumentieren und End-to-End prüfen.

## Musik-/Intro-Integration (17.10.2026, Folge-Pull-Request)
- [x] Neue GitHub-Uploads erkannt: 15 MP3s (001–015), zwei MP4-Intros.
- [x] MP3-Dateien unter `public/music/` mit lesbaren Namen versioniert; Git-Blob-Inhalte unverändert.
- [x] Videos unter `public/video/` umbenannt; `intro.mp4` als Filmstart mit Überspringen, Stummschaltung für Browser-Autoplay.
- [x] 15 visuelle Cover-Platzhalter, Titel- und Epochenmetadaten, Covergalerie, Downloadlinks.
- [x] Procedural-Musikmotor `RoyalMusicScore` entfernt; `GameAudio` nur für UI-Effekte.
- [x] Bedienung verbessert: echte Musik statt Synthesizer, kompakter Header, mobile Coverkarten.
- [x] CI und Chromium Browser Smoke für PR #32 bestanden; Integration nach `main` erfolgt.
- [ ] Medienwiedergabe auf Zielgerät inkl. Ton, Video und Browser-Autoplay manuell prüfen.
- [ ] Original-Cover, Entstehungsjahr, Künstler/Komponist, Lizenz und ausführliche Titelbeschreibungen nachreichen.
- [ ] Live-Deployment von `main` prüfen; Web-Browser lassen tonhaltigen Autoplay meist nur nach Interaktion zu.
- [ ] Covergrafik-Ersetzung mit vom Rechteinhaber bereitgestellten Bildern; die SVGs sind vorläufige Albumillustrationen.

## Offizielle Musikbibliothek – alle 15 Stücke (17.10.2026)
- [x] Alle 15 hochgeladenen MP3-Originale per Dateigröße und SHA-256 im lokalen ZIP geprüft und in sauber benanntem Einbaupaket `public/music/` aufbereitet.
- [x] In GitHub: zentraler, erweiterbarer 15-Titel-Katalog mit Sonderstücken und Epoche.
- [x] `Zeit vergeht` als Startthema mit Autoplay-Versuch und Klick-Ersatz, ohne Titelwahl im Startmenü.
- [x] In-Game-Titelauswahl und Downloadlink für feste Musikdateien.
- [x] 15 originale MP3-Binärdateien unter `public/music/` eingebunden (PR #32).
- [ ] Reale Hörabnahme mit den 15 Medien auf Live-Deployment durchführen.
- [ ] Vom Nutzer gelieferte weitergehende Angaben zu Komponist, Lizenz, Cover, Stil und Szeneneinsatz im Katalog nachtragen.
- [ ] Hörabnahme: Ein-/Ausblenden, Lautheitsabgleich, Wiedergabe bei Speicher/Ladewechsel und Mobile-Autoplay.

## Spielstart, Jahresauswahl, Musik und Fallback – 17.10.2026 (PR #30)
- [x] Musiktitelauswahl aus dem Startmenü entfernt; der Player liegt eingeklappt bei den Audiooptionen im Spiel.
- [x] Elf Zeitepochen von 1200 bis 2000 als spielbare Startjahre.
- [x] Offenes Spiel ohne Zielvorgaben als zusätzliche Kampagnenart, mit eigenen Save-Daten im bestehenden Format.
- [x] Ratsentscheidungen als echte modale Auswahl, weiterhin über den Reichsrat erreichbar.
- [x] 2D / isometrische 3D-Look-Umschaltung und interaktive 2D-Bezirksansicht als Pixi-/WebGL-Fallback.
- [x] Responsive CSS und sichtbare epochenspezifische Stadt- und Oberflächenmerkmale.
- [x] Elf historische Aufnahmen und ein Bonus-Leitmotiv mit festen Namen und Dateipfaden im Musikkatalog registriert.
- [x] Anstelle des früheren 12er-Pakets jetzt alle 15 Originaltitel im Git unter `public/music/` integriert.
- [ ] Echtes 3D (WebGL-Szene mit Kamera) statt isometrischer 2D-Projektion, weiterführende moderne Gebäudemodelle und historische Rebalancing-Abnahme.
- [ ] Laufende Veröffentlichung aus `main` und reale Browser-/Audio-/Mobile-/Langzeit-Tests auf dem Zielsystem ergänzen.

## 🎧 Musik-Jukebox (PR #28 gemergt; Folgeverbesserung 17.10.2026)
- [x] Sechs benannte Epochenaufnahmen (1200/1300/1400/1500/1600/1750) als optionaler Bibliothekskatalog und Import-Metadaten.
- [x] Mehrfachimport der MP3-Dateien, sichtbare Version und wählbarer automatischer Titelwechsel bei Epochenfortschritt.
- [x] Originaldateien als echte Binärassets in `public/music/` übertragen.
- [ ] Zielserver-Auslieferung und Hörtests mit echten MP3s prüfen.
- [ ] Deployment/Release-Pipeline verbindlich an main anschließen und Live-Version im ausgelieferten HTML prüfen.

## 🎧 Musik-Jukebox (PR #28 gemergt)
- [x] Echte MP3-/OGG-/WAV-Dateien lokal importieren, auswählen, speichern und abspielen.
- [x] Jukebox im Menü und Spiel, Lautstärke mit vorhandener Steuerung verbunden.
- [x] Veralteten Einzeltitel-Upload durch vollständige 15-Titel-Bibliothek ersetzt (PR #32).
- [ ] Weitere Epochenstücke, Titelverwaltung und automatische Wechsel weiter ausbauen.

## 🎼 Ein Reich, viele Zeiten – Musik (PR #27 gemergt)
- [x] Eigenes Leitmotiv (76 BPM, Moll/Dur), 48-Takte-Menüfassung, 16-Takte-Spielszenen.
- [x] Epochenfarben für Mittelalter/Hanse/Neuzeit/Industrie/Moderne/Zukunft und Spielsituationen Aufbau/Handel/Hof/Krise/Krieg.
- [x] Nur nach Nutzerinteraktion aktiv, getrennte Musiklautstärke, Browsertab-Pause, Aufräumen von Synthesizerstimmen.
- [ ] Echte instrumentale Einspielungen, Studiomischung, Hörabnahme, Crossfade von Orchesteraufnahmen, 3D-Audio und weiterführende historische Musikthemen.

## 🏘️ Siedlungsansicht (PR #26 gemergt)
- [x] Alle 16 realen Infrastrukturbezirke auf der PixiJS-Siedlungskarte, mit filterbarer und tastaturbedienbarer Liste.
- [x] Hafen, Felder, Straßen und Stadtmauern differenziert dargestellt; Winterüberlagerung und abgeschlossene Modernisierungsprojekte sichtbar.
- [x] Kartenaktualisierungen bei identischem Zustand übersprungen, Bezirkswahl führt zur echten Bauverwaltung.
- [ ] Individuelle Gebäudeplatzierung, animierter Baufortschritt, Fahrzeuge, Bevölkerungsdichte, Stadtbrände und langfristige Stadtentwicklung.
- [ ] Manuelle visuelle Abnahme auf verschiedenen Geräten und längere Performanceprofile.

## ⚙️ Spielbare Modernisierung (PR #25 gemergt)
- [x] Sechs optional finanzierbare Modernisierungsprojekte von Dampf bis KI-Zukunft.
- [x] Zeit-/Forschungs-/Materialgates, gebuchte Ressourcen und einmalige reale Kultur-/Stabilitäts-/Handelsboni.
- [x] Eigener UI-Bereich und kompatible Save-/Load-Daten je Reich.
- [ ] Echte Fabriken, Stromnetze, Bahnlinien, Gebäude-Upgrades, Karrierewechsel und moderne Kriegsführung in ein ganzheitliches Simulationsmodell integrieren.
- [ ] Jahrhundert-Zeitsprünge und Kohorten mit reproduzierbarer Simulation und Performanceprofilen.

## 🎨 Kulturförderung aus historischer Weltgeschichte (PR #24 gemergt)
- [x] Vergangenheit liefert optionale Ausstellungen mit echtem Goldpreis und +2 kulturellem Einfluss.
- [x] Historische Forschung wird dabei ausdrücklich nicht automatisch freigeschaltet.
- [x] Einmalige Förderung je Reich, im Spielstand erhalten; Zukunftsszenarien ausgeschlossen.
- [ ] Museen als Baugebäude, Kunstsammlungen, historische Künstler und Langzeit-Kulturkarrieren verknüpfen.

## 📚 Weltgeschichte und langfristiger Epochenwechsel (PR #23 gemergt)
- [x] Separate zugängliche Weltgeschichte-Oberfläche für ausgewählte reale Erfindungen, Wissenschaft, Kunst, Architektur und Kultur mit Datierung, Ort, Beschreibung und Quellen.
- [x] Zeitabhängige Epochenüberschrift, Jahrgangs-Ereignisse und deutlich gekennzeichnete spekulative Zukunftsinhalte.
- [x] Informationsereignisse vergeben keine automatischen Fortschritte in der eigentlichen Technologie-Forschung.
- [x] Unit-Tests für Sichtbarkeit, Datierung und Zukunftskennzeichnung; Browser-Smoke für neues Menü.
- [ ] Breitere kuratierte und geprüfte Datenbasis mit exakten Fachquellen, Regionen, Kulturkreisen und Filtern.
- [ ] Epochenabhängige Wirtschafts-, Bau-, Militär-, Bürger- und Politiksysteme bis Moderne und Zukunft voll spielbar machen.
- [ ] Balance- und Zeitsprungkonzept für Jahrhunderte ohne Millionen einzelne Monatsticks.

## 👥 Hofverwaltung / KI-Assistenz (PR in Prüfung)
- [x] Drei optionale Hofämter mit lebenden Bürgern und monatlichem Kompetenzzuwachs.
- [x] Beratungsmodus als Standard und begrenzte regelbasierte Automatik für Handel und Forschung, ohne Fremdmodell oder autonome Kriege.
- [x] Pro-Spieler-Trennung und Save/Load kompatibel zu alten Spielständen.
- [ ] Loyalität, Beraterkonflikte, echte Empfehlungen, ausgefeilte KI-Strategien sowie UI-Browser-E2E weiter ausbauen.
- [~] Hanseroute: Hafenprüfung für Route korrigiert und Aktivierung einschließlich 15.029-/15.030-Gold-Grenze im Engine-Integrationstest erfasst; echte Playwright-UI-Aktivierung noch offen.

## 🏰 Belagerungen und Versorgung – neue Integration (PR in Prüfung)
- [x] Feindliche Steinmauern durch spielbare mehrmonatige Belagerungen angreifen; Beginn 500 Gold/250 Nahrung und mindestens 40 Soldaten.
- [x] Belagerungen verursachen monatlich 100 Gold und 100 Nahrung, laufen 5 Simulations-Tage je Monat und haben einen Rückzugs- sowie Nachschubbefehl.
- [x] Bei Kapitulation oder Mauerbruch wird die Festungsstärke des Rivalen tatsächlich gesenkt; Eroberung erfordert danach weiterhin einen echten Feldzug.
- [x] Spielstände sichern/stellen Belagerungsstände wieder her; Hotseat-Zugbindung und Waffen-/Nachschub-Eingabe validiert.
- [~] Noch offen: reale Truppenverluste in Belagerung und Abgleich der aktiven Feldarmee, animierte Belagerungsmaschinen, Balance-Langläufe.

## 🏰 Zwei weitere Kampagnen (PR #20 gemergt)
- [x] „Glaube und Kultur“: drei Kapitel zu Kirchen, Bildung, Kultur und Zufriedenheit.
- [x] „Der Weg zur Kaiserkrone“: Burgen, Märkte, aktive Nichtangriffspakte, Handel, Eroberungen.
- [x] Ziele werden aus echtem Staats- und Vertragszustand berechnet; Spielstände bleiben kompatibel.
- [x] Kapitel- und Chromium-Browser-Tests um die beiden Kampagnen erweitert.

## 🛡️ Grenzwache und Spieleraktionen (PR #19 gemergt)
- [x] Spieler kann für 300 Gold und 150 Holz eine Grenzwache alarmieren.
- [x] Der nächste Simulationsmonat erhält echten Verteidigungsbonus (+30 Prozentpunkte Führungsbonus, gedeckelt auf 50 %); Aktion wird auch ohne Überfall verbraucht.
- [x] Hotseat-Reichstrennung, Speichern/Laden, doppelte Vorbereitung und Kosten geprüft.
- [ ] Ausführliche Gelände-, Belagerungs- und Logistikentscheidungen samt Interaktionsanimationen.

## ⚔️ Game-Action-Animationen (PR #17 gemergt)
- [x] Gegensätzliche Truppformationen (14 Figuren) laufen bei Gefechten sichtbar aufeinander zu.
- [x] Der Sieger erhält eigene farbliche Hervorhebung; Animation verändert nie das Kampfergebnis.
- [x] Begrenzte Laufzeit, Timer-Cleanup und Abschaltung bei reduzierter Bewegung berücksichtigt.
- [ ] Echte Schlachtkartographie, Pfeilsalven, Gebäudeschäden, authentische Audio-Samples und umfassende visuelle Abnahme.

## 🔬 Wissenschaftliche Errungenschaften mit echten Auswirkungen (PR #16 gemergt)
- [x] Abgeschlossene Technologien verbessern nun tatsächlich Bildung, Kultur, Handelsmacht, Stabilität und teilweise Militärausrüstung.
- [x] Nahrung, Rohstoffe und Gold erhalten begrenzte, pro Monat berechnete Forschungsboni, ohne kumulativ den Produktionsbasiswert zu verändern.
- [x] Forschungsgeschwindigkeit wirkt auf neue monatliche Forschungspunkte.
- [x] Forschungsansicht zeigt aktuelle Boni an; Rechenlogik mit Unit-Tests abgedeckt.
- [ ] Langzeit-Balancing von Forschungseffekten, Rückwirkungsstrategie für ältere Spielstände und vollständige Prüfung im Browser.

## 🎮 Mehr Kampagnen und Game-Actions (PR #14 gemergt, Kapitel-Fortsetzung in Prüfung)
- [x] Sechs auswählbare Kampagnen: Aufbau, Hanse, Wissenschaft, Grenzland, Kultur und Kaiserkrone, mit jeweils sechs Live-Zielen.
- [x] Wissenschaftliche Errungenschaften erscheinen als sichtbare Ereignisaktion mit Map-Puls und Klang.
- [x] Überfälle und Feldschlachten lösen Game-Action-Banner und Kartenmarkierung aus.
- [~] Je drei Kampagnenkapitel und dauerhafte Belohnungen integriert; komplexe Verzweigungen, realistische Audio-Samples und tiefere historische Geschichten offen.

# ✅ TODO – Kaiser von Deutschland

**Stand**: 16. Oktober 2026 · **Paketversion**: 2.5.1 · **Standard-Einstieg**: Aufbaukampagne (`KingdomGameUI`)

Konsolidierte Aufgabenliste aus allen Roadmaps, Statusberichten und Implementierungsreports.
Abgeschlossene Arbeiten stehen im [CHANGELOG](./CHANGELOG.md).

**Quellen**: [Roadmap](./docs/00-meta/roadmap.md) (382 offene / 180 erledigte Punkte),
[Status](./docs/00-meta/status.md), [Vision](./docs/00-meta/vision.md),
[Gameplay-Prüfung](./GAMEPLAY_TESTING_GUIDE.md), [Reports](./docs/reports/), Code- und Git-Stand.

**Legende**: 🔴 P0 blockierend · 🟠 P1 hoch · 🟡 P2 mittel · 🟢 P3 niedrig · 🔮 Vision ·
👥 = Mehrspieler-Anteil · `[~]` = teilweise umgesetzt

---

## ✅ Erste Gameplay-Ausbaustufe – Reichsrat (PR #1 bereits gemergt)

- [x] Sechs spielbare Ratsdilemmata (Ernte, Grenze, Gilden, Intrige, Winter, Gelehrte).
- [x] Jeweils drei Entscheidungen mit überprüften Kosten, konkreten Folgen und teils Erfolgschance.
- [x] Reichsrat als Bereich der Aufbaukampagne mit Warnhinweis, Ergebnis und Ereignisverlauf.
- [x] Reichsspezifische offene Beschlüsse und Verlauf im Savegame; alte Spielstände bleiben ladbar.
- [x] Hotseat: keine Weitergabe des Zuges bei ungeklärtem Beschluss.
- [x] Unit-Tests für das neue Ratssystem hinzugefügt (lokale Ausführung und CI noch prüfen).
- [x] CI, Typecheck und Build bestanden; automatisierter Chromium-Smoke-Test für Desktop und 320 × 740 mit Navigation in PR #8 erfolgreich. Vollständige manuelle Abnahme separat offen.
- [~] Ereignispool von 6 auf 12 Dilemmata erweitert; deterministische 10.000er Kalibrierungstests für Risikowahrscheinlichkeiten ergänzt. Langzeit-Kampagnensimulation und ökonomisches Balancing noch offen.

## ✅ Lebendige Welt – PR #3 gemergt, Erweiterung in Prüfung

- [x] Prozedurale Umgebungsgeräusche mit Ein-/Ausschalter und szenenbezogener Umschaltung.
- [x] Dezente Kartenbewegungen mit Pausenmechanismus, 30-FPS-Limit und Reduced-Motion-Unterstützung.
- [x] Bereits vorhandenes Diplomatiesystem in NPC-Nachbarschaft eingebunden (Gesandtschaften/Beziehungen).
- [x] Diplomatie wird im Spielstand persistiert; Integrationstest hinzugefügt.
- [~] CI/Build und Desktop/320px Chromium-Smoke-Test erfolgreich; Lautstärkeregler, Reduced Motion und stumme Voreinstellung vorhanden. Hör- und vollständige WCAG-Prüfung noch offen.
- [~] Pfadgebundene animierte Passanten und Schornsteinrauch ergänzt; zusätzliche Kulturklänge und Lautstärke steuerbar. Vollständige Gebäudeanimationen, realistische Sample-Geräusche und echte Bürgerpositionsdaten noch offen.

## ✅ Kulturkalender in der Aufbaukampagne – PR #4 gemergt, Integration fortgesetzt

- [x] Bestehende Kulturevent-Daten für Jahrestage und Jahreszeiten spielbar.
- [x] Feste verbrauchen Gold und Nahrung und beeinflussen Zufriedenheit/Stabilität.
- [x] Jährliche Obergrenze pro Reich, Save/Load und Integrationstest ergänzt.
- [~] CI/Build und Chromium-Smoke-Test der Kulturansicht erfolgreich; Religion (dominanter Glaube, Einfluss, Religionsfreiheit) im Kulturpanel lesbar. Reichsspezifische Verwaltung noch offen.

## ✅ Rivalen-Dynamik – PR #5/#6 gemergt
- [x] Drei strategische NPC-Profile mit unterschiedlicher jährlicher Entwicklung.
- [x] Militärisches Wachstum auf das Fünffache des Ausgangswertes begrenzt.
- [x] NPC-Entwicklung als Chronikmeldung angezeigt und im vorhandenen Kriegsspeicher gesichert.
- [x] Tests für Strategievarianten, Speicherstände und vorbereitete Angriffsunterdrückung ergänzt.
- [x] Verhandelte zweijährige Nichtangriffspakte mit realer Angriffssperre und Überfallschutz integriert; Ablauffrist und Save/Load berücksichtigt.
- [~] CI für PR #5/#6 bestanden; Chromium-Smoke-Test Desktop/320px für PR #8 erfolgreich; umfassende visuelle QA und manuelle Abnahme offen.

## 🔴 P0 – Sofort (Build & laufende Arbeit)

- [x] **Build reparieren**: Forschungsansicht integriert; `npm run check`, Tests und Produktionsbuild
      bestehen wieder.
- [~] **Forschung pro Reich abschließen** (`PlayerTechnologySystem` ist in `src/core/TechnologySystem.ts` bereits committed):
  - [x] Forschungspunkte aus Schulen/Universitäten, ein Projekt je Reich
  - [x] Speichern/Laden des Forschungsstands (`technologyProgress` im Spielstand)
  - [x] Handelsrouten prüfen erforschte Technologien (neue Technologie „Hochseesegeln“)
  - [x] Forschungsansicht und Handelsrouten im Hauptspiel bedienbar gemacht
  - [x] Browserablauf für Hochseesegeln manuell geprüft (Forschung nach zwei Monaten abgeschlossen)
  - [x] Hanseroute im echten Chromium-Browser über die UI aktiviert; Smoke-Test baut Hafen und Forschung auf, prüft Routenzustand.
  - [x] Unit- und Integrationstests für `PlayerTechnologySystem` und `GameEngine.startResearch()`
  - [x] [GAMEPLAY_TESTING_GUIDE.md](./GAMEPLAY_TESTING_GUIDE.md) und
        [API_REFERENCE.md](./docs/05-technical-architecture/API_REFERENCE.md) ergänzt
  - [x] Committed und durch CI-Typprüfung abgedeckt
- [x] **Repository aufräumen**: Playwright-Artefakte (`.playwright-mcp/`, 5 getrackte Dateien) aus Git entfernen
      und in `.gitignore` aufnehmen

## 🟠 P1 – Stabilisierung & Konsistenz

### Bekannte Probleme (aus Status-Bericht)
- [~] Soziale jährliche Beziehungsbildung: quadratische Gesamtsuche durch regional begrenztes Sampling ersetzt (PR #8); Lasttest für >5.000, 100.000+ Bürger und vollständige Simulation noch offen.
- [~] Ablauf alter Gerüchte und Begrenzung der Verbreitungsereignisse implementiert; systemweites Profiling und Objekt-Pooling noch offen.
- [~] Große Spielstände: gzip-Kompression mit Rückwärtskompatibilität implementiert; vollständige Kohortenmigration und Größen-/Latenzbenchmarks stehen noch aus.
- [~] Chromium-Smoke-Test bei 320 × 740 prüft Layoutüberlauf und Navigation erfolgreich (PR #8); manuelle Detailprüfung weiterer Screens offen.
- [ ] ⚠️ Einige historische Events fehlen
- [~] Erste spielbare Anleitung im Hilfebereich und Handelsrouten-Voraussetzungen ergänzt; interaktiver mehrstufiger Tutorial-Modus noch offen.

### Code-Duplikate & technische Schulden
- [~] Stadtviertel-Varianten klassifiziert und Legacy markiert; Datenmodell-Konverter und vollständige Zusammenführung offen
- [~] Belagerungs-Varianten klassifiziert und Legacy markiert; Semantik-/Savegame-Migration offen
- [~] SQL-Adapter kontrastiert: `core/database/*` als Zielarchitektur dokumentiert, alte Variante markiert; API-Bridge/Migration offen
- [~] Migrationsschemata 001/002 dokumentiert und ältere Schiene als Legacy markiert; Datenmigration offen
- [x] Alte Oberflächen (`UIFlowManager`, `GameUI`, `EnhancedPixiRenderer`, Roadmap-Panels) als Legacy gekennzeichnet;
      Funktionsübernahme in die Aufbaukampagne und anschließendes Entfernen bleibt offen (siehe Konsolidierungsplan).
- [~] `any` aus JSON-Initialisierung und Ressourcenbudgets in `TechnologySystem` entfernt; verbleibende Typen in weiteren Modulen offen

### Dokumentation synchronisieren
- [x] Paketversion 2.5.1 als Referenz in aktuellem Status/Architektur/Roadmap gesetzt; historische Reports bleiben als datierte Entwicklungsberichte
- [x] [status.md](./docs/00-meta/status.md) auf 17.10.2026 aktualisiert, inklusive belegter Kampagnenfunktionen und offener Lücken
- [~] Roadmap-Status abgeglichen: implementierte Klassen vs. spielbar integrierte Features unterschieden
- [x] Kapitel=Funktionskatalog, Episoden=Content-Roadmap, alte Zeitpläne=Archiv in Roadmap explizit eingeordnet
- [~] Betriebshandbuch und Systemkonsolidierungsleitfaden ergänzt; fehlende Domains weiterhin offen

### Qualitätssicherung
- [ ] Testabdeckung von ~40 % auf 70 % erhöhen (Kernsysteme zuerst)
- [ ] Integrationstests für die Aufbaukampagne erweitern
- [ ] E2E-Tests mit Playwright (Startseite, Bauen, Hotseat, Speichern/Laden)
- [ ] Accessibility-Tests (WCAG 2.1) und Cross-Browser-Tests
- [ ] Profiling & Benchmarks (FPS: < 30 bei > 10.000 Bürgern)

## 🟡 P2 – Nächste Features (v2.6.x – v2.7)

### Integration vorhandener Systeme in die Aufbaukampagne
Viele Systeme existieren in `src/core/`, sind aber nicht im Standard-Einstieg erreichbar.
- [~] Diplomatie (`DiplomacySystem`) – Gesandtschaften, Beziehungen und zweijährige Nichtangriffspakte mit tatsächlichem Überfallschutz integriert; Allianzen, Handel und komplexe Vertragsbrüche noch offen
- [~] Religion & Kultur: saisonale Feste aus `ReligionSystem` mit tatsächlichen Kosten/Effekten integriert; Religion, Künste und Kulturkreise noch offen
- [~] Bevölkerungsdynamik, Migration, soziale Mobilität und Hungersnöte: Weltansicht zeigt Bürger, Migration und Hungersnöte aus bestehenden Systemen; steuerbare Reichsmaßnahmen und kohärente regionale Simulation noch offen
- [~] Klima, Naturkatastrophen, Landschaft und Tierpopulationen: Spielansicht „Welt & Volk“ zeigt vorhandene Echtzeitstatistiken; stärkere Gameplay-Effekte noch offen
- [~] Belagerung, Formationen, Logistik, Marine, Kriegsfinanzierung, Kriegsgefangene: spielbare Rüstungsdarlehen mit echten Tilgungsraten und Spielstandintegration; Belagerungen, Logistik, Formationen, Marine und Gefangenenverwaltung noch nicht in der Hauptkampagne spielbar
- [~] Spionage mit Agentenanwerbung und Informationsmissionen in der Kampagne, pro Spieler getrennt und gespeichert; Sabotage, Untergrundbewegungen und Propaganda noch offen
- [ ] Universitäten, Bibliotheken, Nobelpreise, Bildungsreformen
- [ ] Recht & Gerichte, Bürgerrechte, Währung/Finanzen, Mode
- [ ] Lebensphasen-System (`LifePhaseSystem`, `MonthlyPlannerSystem`, `CareerPathSystem`)

### Datenbank-Integration (v2.4.0 – Restarbeiten)
- [ ] Daten-Migration von LocalForage zu SQLite
- [ ] GameEngine Save/Load über `DatabaseAdapter`
- [ ] Performance-Tests mit 100.000+ Datensätzen
- [ ] Cloud-Sync-Prototyp

### Gameplay-Modi-System (v2.4.0)
- [~] `GameplayModeManager` und Typdefinitionen vorhanden, Migration `002_gameplay_modes`
- [ ] `IntensityScaler` für 4 Achsen
- [ ] `PerspectiveFilter` für Rollen
- [ ] UI: `GameModeSelector`, `IntensityConfigurator` (Slider), `RoleSelector` mit Perspektiven
- [ ] 👥 Individuelle Spielereinstellungen
- [ ] Tests für Modi und Intensitäten

### Offene Kern-Features
- [ ] Wissenschaftliche Kontroversen und Paradigmenwechsel (v3.1.2)
- [ ] Verwaltungsreformen und Digitalisierung (v3.2.0)
- [ ] Steuerhinterziehung und Steueroasen (v3.3.0)
- [ ] 3D-Schlachtfeld-Ansicht als optionales Overlay (v2.3.5)

### Spielerlebnis & UX
- [ ] Interaktives Tutorial / Tutorial-Kampagne
- [ ] Historische Szenarien (z. B. „Der Dreißigjährige Krieg“), Herausforderungs- und Sandbox-Modus
- [x] Autosave nach jedem abgeschlossenen Monat (`autosave`), manueller Slot `campaign` bleibt erhalten; Fehler werden gemeldet.
- [ ] Chronik über Sitzungen hinweg speichern (aktuell nur letzte 100 Meldungen pro Sitzung)
- [~] KI-Gegner: drei eigenständige NPC-Entwicklungsprofile (Räuber, Festungsbau, Handel), jährliche Entwicklungen und Chronik umgesetzt; adaptive Reaktionen, Verhandlungen und Schwierigkeitsgrade folgen
- [ ] Automatisierung: Gouverneure, Auto-Handel, Produktionsketten, Vorlagen, Shortcuts

## 🟢 P3 – Mittelfristig (v2.8 – v3.x)

### Mehrspieler (online)
Aktuell gibt es nur lokales Hotseat (2–4 Spieler). Online-Mehrspieler fehlt.
- [ ] WebSocket-Server, Lobby mit Matchmaking, Zustandssynchronisierung, Reconnect, Anti-Cheat
- [ ] Kooperative Modi: Teams, gemeinsame Siegbedingungen, Ressourcenhandel unter Verbündeten
- [ ] Ranglisten, Saisons, Achievements, Spielerprofile
- [ ] 👥 Rollen-Mehrspieler aus allen Roadmap-Kapiteln (~150 Punkte, z. B. Bürger übernehmen,
      Bewegungen anführen, Spionage zwischen Spielern, Richter/Anwälte, Bürgermeister von Vierteln,
      Händler/Bankiers, Delegierte, Diplomaten in Echtzeit)

### Content-Erweiterung (v2.3.0-Plan)
- [ ] 50+ weitere historische Ereignisse, Ereignisketten (Renaissance, Aufklärung), regionale Events
- [ ] Alternative Geschichte (What-If) und dynamische Event-Generierung
- [ ] 10 neue Rollen, 30+ neue Gebäude, Weltwunder
- [ ] 20+ neue Politikmaßnahmen (Umwelt, Digital, Wissenschaft, Sicherheit)

### Globalisierung & Kolonialismus (v3.4.0 – v3.5.0)
- [~] Kolonialverwaltung datenseitig vorhanden (`colonial-systems.json`, `RoadmapFeaturesManager`)
- [ ] Überseegebiete erkunden, Plantagenwirtschaft, Unabhängigkeitsbewegungen spielbar machen
- [ ] Handelskompanien, Warenbörsen, globale Lieferketten (ab 1950), Fair Trade (ab 1990)
- [ ] Internationale Organisationen: HRR (bis 1806), Deutscher Bund, Völkerbund, UN, EU
- [ ] Diplomatie 2.0: Botschafter, Sanktionen, Embargos, humanitäre Interventionen, Klimadiplomatie

### UI/UX-Revolution (v2.4.0-Plan)
- [~] Kartenanimation (bewegte Markierungen, 30 FPS, Bewegung abschaltbar) und optionale prozedurale Geräuschkulisse (Dorf, Markt, Krieg, Winter) integriert; Gebäude-/Einheitenanimationen, visuelles Wetter und Tag/Nacht folgen
- [ ] Animierte Übergänge, Hilfe-Overlays
- [ ] PWA mit Offline-Modus, Touch-Optimierung; später native Apps (Capacitor)

### Performance & Infrastruktur
- [ ] Code-Splitting und Lazy Loading, Caching-Strategien
- [ ] Web Worker für Simulationsberechnungen
- [ ] Service Worker für Offline-Betrieb
- [ ] Automatisch generierte API-Dokumentation

### Barrierefreiheit & Lokalisierung
- [ ] Barrierearme Steuerung, Screenreader-Unterstützung
- [ ] Übersetzungen (EN, FR, ES, IT, PL, TR)
- [ ] Transparente Kennzeichnung von Spekulation/Fiktion, Quellenangaben für Ereignisse

## 🔮 Vision (2027 – 2030)

- [ ] **v3.0.0 Große Expansion**: Prähistorie (10.000 v. Chr.), ferne Zukunft (bis 2200), Mod-Loader
      und Plugin-System, Modding-API, Beispiel-Mods
- [ ] **v3.1.0 Social & Community**: Freundeslisten, Gilden, Zuschauermodus, Replays, Streaming
- [ ] **v4.0.0 Futuristische Erweiterung**: KI-Herrschaft, Transhumanismus, Raumfahrt und Kolonisierung
- [ ] **v4.1.0 Alternative Realitäten**: Parallelwelten, Zeitreise-Paradoxien
- [ ] **Immersive Interfaces**: VR-Thronraum, AR-Stadtplanung
- [ ] **Adaptive KI**: dynamische Schwierigkeit, emotionale NPCs mit Gedächtnis
- [ ] **Plattformen**: Electron-Desktop, Steam, Epic, GOG, Cross-Platform-Play
- [ ] **Cloud & Services**: Server-Cluster, persistente Welten, Spielstand-Cloud, historische Daten-API
- [ ] **Modding 2.0 / Creator Economy**: Skripting-Engine, Steam Workshop, Mod-Wettbewerbe
- [ ] **Akademische Edition**: Lehrplan-Szenarien, Quellenintegration, Datenexport, Klassenraum-Modi
- [ ] **Esports & Community**: Turniere, Ranked Matchmaking, Discord, Forum, Dev-Blogs

### Episoden-Plan (aus Roadmap)
| Episode | Titel | Ziel | Schwerpunkt |
|---|---|---|---|
| 1 | Sturm des Mittelalters | Q2 2026 (überfällig) | Bürger, Demografie, soziale Netzwerke, Formationen |
| 2 | Funken der Renaissance | Q3 2026 | Kunst, Stadtviertel, Tagesrhythmus, Handelsrouten |
| 3 | Donner der Revolution | Q4 2026 | Industrialisierung, Gewerkschaften, revolutionäre Zellen |
| 4 | Flammen der Weltkriege | Q1 2027 | Total War, Belagerung, Spionage, Logistik |
| 5 | Licht der Moderne | Q2 2027 | Justiz, Bürokratie, internationale Organisationen, Finanzen |
| 6 | Schatten der Zukunft | Q3–Q4 2027 | KI-Herrschaft, Transhumanismus, Raumfahrt |
| 7 | Ewigkeit der Geschichte | 2028+ | Prozedurale Narrative, persistente Welten |

Die meisten Kernsysteme der Episoden 1–4 sind als Code vorhanden. Es fehlen die Integration in die
Aufbaukampagne und die Mehrspieler-Anteile (siehe P2/P3).
