## Heimnetz-Download ohne HTTPS (17.10.2026)

Nach `npm ci && npm run build` enthält `dist/downloads/kaiser-von-deutschland-offline.zip` die statische Anwendung samt aller MP3, Cover und fünf MP4, plus `OFFLINE-LESEN.txt` und `START_WINDOWS.cmd`. Der Download-Link steht im laufenden Spiel unter **Einstellungen → Offline spielen / Heimnetz-Download**. Auf einem **vertrauenswürdigen Heimnetz** darf das ZIP über HTTP heruntergeladen werden (beispielsweise `http://192.168.x.x:4173/downloads/kaiser-von-deutschland-offline.zip` nach `npm run build` und `npm run serve:lan` auf dem Heimnetz-PC). Entpackt auf Windows startet `START_WINDOWS.cmd` das Spiel mit Python 3 lokal unter `http://localhost:8765`, ohne Internet. Windows-Startskript bindet nur an 127.0.0.1.

**Einschränkung:** Ein reiner HTTP-LAN-Zugriff vom Tablet ist kein sicherer Browserkontext. Browser unterbinden dort Service Worker, PWA-Installation und ggf. WebGPU. Für den Tablet-/Smartphone-PWA-Betrieb wird später eine echte HTTPS-Spielseite benötigt (**offenes TODO**). Keine Router-Portweiterleitung auf einen Entwicklungsserver einrichten.

Die fünf Medien unter `public/video/` (zwei Intros und `Video 3.mp4`, `Video 4.mp4`, `Video 5.mp4`) werden automatisch im Auswahlmenü angeboten. Die inhaltliche Zuordnung der drei neuen Filme ist nach Sichtung noch offen.

## Videothek und Bürgerlebensläufe (17.10.2026)

Der Videokatalog wird beim Build automatisch aus tatsächlich vorhandenen Dateien in `public/video/` erzeugt (MP4, WebM, M4V). In den Spieleinstellungen lassen sich alternative Intro-/Outrofilme und ein optionales Zwischenvideo für historische Meilensteine auswählen und probeweise abspielen. Ohne ausgewählten Zwischenfilm wird keiner abgespielt. Zurzeit liegen nach Repository-Prüfung nur `intro-original.mp4` und `intro.mp4` vor: drei weitere angekündigte Dateien sind **noch nicht im GitHub-Verzeichnis nachgewiesen**, daher können sie erst nach Upload ausgewählt werden. Ton-Autoplay unterliegt Browserrestriktionen; Start/Überspringen bleiben möglich.

Zivile Bürgeraufträge berücksichtigen zusätzlich Berufserfahrung und Disziplin. Abgeschlossene Missionen verbessern Berufserfahrung und Ansehen und erzeugen ein Lebenslaufereignis, das mit dem Bürger gespeichert wird. Die aktuelle Lösung ist ein weiterer Schritt zur lebendigen Bürgergesellschaft, noch keine vollständige autonome Berufs-/Familiensimulation.

## Bürgeraufträge nach Epoche (17.10.2026)

Neuer Menüpunkt **Bürgeraufträge**: Acht epochengebundene zivile Missionen in Versorgung, Zunftwesen, Handel, Bildung, Mechanisierung, Hygiene, Wiederaufbau und Digitalisierung. Bis zu drei lebende erwachsene Bürger übernehmen Aufgaben über mehrere Spielmonate. Ressourcen werden bei Annahme belastet; nach Abschluss folgen begrenzte Erträge, Fähigkeitsfortschritt und soziale Effekte. Aufträge samt Chronik werden im Spielstand gesichert. KI- oder Ollama-Aktivierung ist nicht nötig; Spieler vergeben Aufträge ausdrücklich.

## Epochenabhängige militärische Spielmechanik (17.10.2026)

Die Feldzugsimulation nutzt historische Doktrinen ab Antike, Mittelalter, früher Feuerwaffenzeit, Linientaktik, Industrialisierung, Motorisierung und vernetzter Gegenwart. Die drei vorhandenen Armeekategorien bleiben für ältere Spielstände gespeichert, werden jedoch epochenabhängig benannt und mit unterschiedlichen Kampfstärken berechnet. Mauern und Burgen verlieren über die Jahrhunderte relativ an Wirkung. Auch die Rivalennamen und Beschreibungen passen zum Zeitalter. Vorschau und tatsächliche Schlacht verwenden dieselbe historische Kampflogik. Die Struktur bleibt eine abstrahierte alternative Geschichte – keine genaue historische Simulation einzelner Nationen oder Waffenmodelle.

## Offline-Browserinstallation, Audioprüfung und Einstellungen (17.10.2026)

Unter **⚙ Einstellungen** stehen nun ein Audio-Diagnosetest für sämtliche 15 MP3-Dateien, Musiklautstärke, Kartenanimation und **„Spiel im Browser speichern“** bereit. Über ein Service-Worker-/PWA-Paket werden bei ausdrücklicher Zustimmung die gebauten Anwendungsdateien, beide Introfilme, Titelcover und alle 15 MP3-Dateien lokal zwischengespeichert. Das Herunterladen braucht beim ersten Mal eine erreichbare HTTPS-Spielseite und genügend freien Gerätespeicher. Offline-Nutzung ist browser-/gerätgebunden; iOS darf Cache bei Speichermangel löschen. WebGPU-Prüfung fordert jetzt tatsächlich einen Grafikadapter an und meldet das Ergebnis.

**Die Veröffentlichung ist eine eigene Aufgabe:** Das Repository ist privat und kein öffentlich erreichbares Hosting. Für Internetzugriff muss `dist/` bei einem HTTPS-Host veröffentlicht werden; anschließend die Medien-URLs prüfen. Siehe `docs/06-development/public-deployment.md`.

## Originalcover und sichtbarer WebGPU-Start (17.10.2026)

Die fünfzehn Original-Covermotive wurden aus den drei vom Projektinhaber bereitgestellten Screenshots den Titel-IDs zugeordnet und ersetzen die SVG-Platzhalter. Die WebP-Dateien liegen unter `public/covers/`. Aufgrund der begrenzten Screenshot-Auflösung sind sie eine Übergangslösung bis zum Vorliegen der höher aufgelösten Originalcover.

Im Menü **⚙ Einstellungen → WebGPU** zeigt das Spiel nun einen expliziten Button **„KI-Modell starten“**, den prozentualen Download-/Initialisierungsfortschritt, den Bereit- bzw. Fehlerstatus und **„Modellantwort testen“**. Die WebGPU-KI startet nur nach ausdrücklichem Klick und bleibt standardmäßig deaktiviert. Ein sichtbarer bereiter Zustand setzt ein erfolgreich geladenes Modell voraus; tatsächliche Antworten müssen separat getestet werden.

## Integrierte Mini-KI und optionale Modelle (17.10.2026)

**Standard: KI aus.** Ein kleines, vollständig mitgeliefertes neuronales Entscheidungsnetz (`EmbeddedMiniModel.ts`, sechs festgewichtete Neuronen) kann in **⚙ Einstellungen** ausdrücklich eingeschaltet werden. Es arbeitet offline und benötigt keinen Modelldownload. Es ist ein heuristisches Mini-Neuronennetz, **kein** vortrainiertes Sprachmodell und kein generativer Chatbot. Das Netz bewertet ausschließlich bezahlbare Ratsoptionen und verändert Spielstände nicht selbstständig.

Alternativ können Regelberater, experimentelles WebGPU-Sprachmodell (Download erst auf Wunsch) oder ein **lokaler** Ollama-Dienst über `http://localhost:11434` mit wählbarem Modell genutzt werden. Ollama und WebGPU bleiben standardmäßig vollständig deaktiviert. Die WebGPU- und Ollama-Modi sind experimentell; Browser-Sicherheitsregeln, CORS und HTTPS können die tatsächliche Nutzung begrenzen.

**iPad / Tablet / Handy:** Der Spielcontainer übernimmt die sichtbare Viewporthöhe unter Safari einschließlich eingeblendeter Browserleisten. Tablet-Hoch- und Querformat, kompakte Navigationsleiste, Hauptbereich mit internem Scrollen und bildschirmfüllende Modalansichten wurden neu gestaltet. Die Oberfläche nutzt die gesamte nutzbare Breite und Höhe; die Darstellung auf realen Geräten muss noch abgenommen werden.

## Historisch passende Entscheidungen und KI im Browser (17.10.2026)

Der Reichsrat enthält weitere Ereignisse zu Arbeitskonflikten, Eisenbahnen, Wiederaufbau, Energieversorgung und digitalen Vorfällen. Ereignisse werden nach Epoche gefiltert; die bisherige Ereignisbibliothek bleibt erhalten, soweit zeitlich passend. Im dringenden Ratsdialog können Entscheidungen an lebende Bürger delegiert werden: Der Regelberater wählt eine bezahlbare Option, die Entscheidung wird sofort ausgeführt und inklusive des Bürgernamens in der Chronik gespeichert.

**KI-Status:** Bürger-NPCs besitzen bereits regelbasierte KI-Steuerung; `OllamaService` existiert, wird im Standardspiel aber nicht aktiviert. Neu ist eine **experimentelle**, ausdrücklich einschaltbare WebGPU-Beratung im Menü **Einstellungen**. Als Standard arbeitet ein lokaler deterministischer Regelberater. Der optionale Browser-Modus lädt die WebLLM-Laufzeit und das kleine Modell erst beim ersten Ratsvorschlag. Er setzt HTTPS, WebGPU-fähige Hardware, genügend Arbeitsspeicher und die Verfügbarkeit der Modellressourcen voraus. Es gibt keine Garantie, dass die Modellkennung auf jedem Gerät verfügbar ist; ein misslungener Download muss als Fehler angezeigt werden. Die KI darf keine Beschlüsse automatisch ausführen.

## Filmischer Einstieg, Epochenkampagnen und PixiJS (17.10.2026)

Beim ersten Öffnen folgt nach einer kurzen Pause die Einblendung **„Eine Thomas Heisig Produktion“** mit synthetischem Whoosh-Effekt. Das längere Original-Intro unter `public/video/intro-original.mp4` wird danach mit Ton abgespielt, sofern der Browser dies erlaubt. Das bisherige kurze Intro ist als Outro über **Beenden** im Spiel eingebunden. Überblendeffekte verbinden Studioeinblendung, Film und Menü. Im Hauptmenü gibt es direkt neben dem Titel „Zeit vergeht“ Play/Pause.

Kampagnen richten sich nun nach dem gewählten Startjahr. Neue Szenarien führen durch Industrialisierung, Wiederaufbau und Digitalisierung; die offene Kampagne bleibt epochenübergreifend. Im PixiJS-Siedlungsbild kommen saisonale Atmosphären, weitere Gebäudedetails und moderne Infrastrukturakzente hinzu.

**Internetnutzung:** Anleitung zur Veröffentlichung unter [Öffentliches Deployment](docs/06-development/public-deployment.md). Das private GitHub-Repository ist noch keine öffentlich erreichbare Spielwebsite. Für eine Live-URL braucht es ein mit GitHub verbundenes Static Hosting bzw. eine veröffentlichte `dist/`-Ausgabe.

## Musik, Bedienung und Figuren (17.10.2026)

Die Playlist bietet kompakte Auswahl für **Nach Epoche**, **Reihenfolge** und **Zufällig**. Die Wiederholung ist zwischen **Alle**, **Titel** und **Aus** wählbar. Bei aktiver Epochenmusik folgt die Originalaufnahme dem aktuellen Spieljahr; alternative Playlist-Modi spielen die Titel nacheinander oder zufällig. Die Einstellungen werden im Browser gespeichert. Die Covergalerie ist einklappbar.

Spielbereiche in der Sidebar werden auf Desktop, Tablet und Handy als modale Dialoge angezeigt. Sie sind über Schließen, Escape oder Klick auf den verdunkelten Hintergrund schließbar; umfangreiche Inhalte scrollen **innerhalb** der Dialoge. Die Hauptansicht nutzt die verfügbare Bildschirmbreite und -höhe. Die spielbaren Figuren sind nicht auf Adelige beschränkt: Die Rollenliste enthält auch Bürgertum und Bauernstand, soweit solche lebenden Bürger vorhanden sind.

## Kompakte Bedienung, Epoche und automatische Zeit (17.10.2026)

Die Hauptansicht erhält weniger Abstände, eine verkürzte Karte, engere Navigationszeilen und direkte Schaltflächen für Herrschaftsbereiche. Die aktuelle Epoche und das Spieljahr sind als klickbare Information rechts im Kopf angeordnet; ein Dialog erläutert den historischen Zeitraum.

Im Einzelspielermodus wird eine zuvor laufende automatische Zeit nach einer Ratsentscheidung und nach einer manuellen Speicherung fortgesetzt. Bewusst angehaltene Spiele bleiben angehalten. Hotseat arbeitet weiterhin zugbasiert. Der Fußbereich enthält Angaben zu Thomas Heisig, Software-/Medienrechten, KI-Einsatz und lokaler Spielstandspeicherung; vollständige Kontaktdaten und titelbezogene Credits sind vor öffentlicher Veröffentlichung zu ergänzen.

## Aktueller Stand – Spiel, Filmstart und Original-Soundtrack (17.10.2026)

Der produktive Quellcode liegt auf **main**. Der Spieleinstieg erfolgt über `src/main.ts` → `src/ui/KingdomGameUI.ts` → `src/core/GameEngine.ts`. Die Anwendung ist eine browserlokale TypeScript-/Vite-Simulation, kein installierter Backenddienst. Den aktuellen Auslieferungsstand der tatsächlich verwendeten Website gesondert verifizieren.

### Video und Musik
- Filmischer Programmstart: `public/video/intro.mp4` (kurze Fassung), mit Schaltfläche zum Überspringen; alternative Originalfassung in `public/video/intro-original.mp4`. Das Video versucht mit Originalton automatisch zu starten. Sperrt der Browser tonhaltiges Autoplay, erscheint direkt auf dem Intro die Schaltfläche „Intro mit Ton starten“.
- Anschließend Hauptmenü und **„Zeit vergeht“** als Hauptthema. Die Hauptmusik wird ohne separaten Startknopf unmittelbar nach dem Intro angestoßen; sollte der Browser Audiowiedergabe blockieren, wird sie bei der nächsten Nutzerinteraktion erneut versucht.
- **15 Originalaufnahmen** sind fest in `public/music/*.mp3` gespeichert und über `src/data/json/music-catalog.json` benannt. Für alle 15 Titel existieren vorläufige, einzeln gestaltete Cover in `public/covers/*.svg`.
- Im Spiel: **Original-Soundtrack & Titelcover** öffnen, Titel per Dropdown oder Cover wählen und herunterladen. Separate Lautstärkeregler, Musik- und Effektschalter sowie eine zusätzliche Starttaste wurden zugunsten eines einfachen Ablaufs entfernt. Lokaler Dateiimport bleibt zusätzlich möglich.
- Die frühere prozedurale Hintergrundmusik (`RoyalMusicScore`) wurde entfernt. `GameAudio` erzeugt nur kurze Bedien-/Spieleffekte; `GameAmbience` liefert separat aktivierbare Umgebungsgeräusche.
- Die 15 Covers sind **vorläufige Illustrationen**, keine vom Komponisten bereitgestellten Originalcover. Künstler, Lizenz und ausführliche Stückinformationen sind noch zu ergänzen.

### Schnellstart und Freigabe
```bash
npm ci
npm run dev
# Prüfungen
npm run check
npm run build
npx vitest run
```

- Entwicklungsserver: standardmäßig `http://localhost:4100`; Produktionsausgabe nach `dist/` (`npm run build`).
- GitHub Actions auf `main`: CI mit Typecheck, Build und Unit-Tests; Browser Smoke mit Chromium Desktop und 320px Mobile.
- Für den Release zusätzlich selbst testen: Videoende/Überspringen, Startmusik mit und ohne Autoplay-Freigabe, reale Audioausgabe, Lautstärke, Downloadlinks, Spieleinstieg, bestehende Spielstände und Mobile-Layout.
- Deployment ist **nicht** mit einer erfolgreichen GitHub-Pipeline gleichzusetzen. Das Hosting muss explizit die aktuelle `main`-Version mitsamt `public/music/`, `public/video/` und `public/covers/` ausliefern.

Siehe [Projektstatus](docs/00-meta/status.md), [Betrieb](docs/06-development/operations-guide.md) und [offene Aufgaben](TODO.md).

## Neue Spielstart- und Anzeigeoptionen (17.10.2026)
Startepoche und Kampagne sind getrennte Entscheidungen. Die Startepochen reichen von 1200 über Renaissance und Industrialisierung bis 2000. Jede Kampagne kann in einem gewählten Startjahr beginnen; die früheren Kampagnenziele bleiben bestehen, sodass historische Ziele bei einem späten Start naturgemäß anders ausfallen. Zusätzlich steht **Offenes Spiel** ohne verpflichtende Siegziele zur Verfügung. Die Uhr und der gespeicherte Spielstand verwenden dasselbe Jahr.

Die Jukebox ist nicht mehr im Hauptmenü. Im Spiel finden sich unter **Musik & Klangeinstellungen** Titelwahl, Lautstärke, Klang und Epochenautomatik. Alle 15 Originalaufnahmen sind im Repository unter `public/music/` enthalten; die prozedurale Hintergrundmusik wurde entfernt.

Die Siedlung kann als 2D-Karte oder in einer isometrischen **3D-Look-Projektion** betrachtet werden. Ein echtes 3D-Modell ist damit noch nicht implementiert. Bei fehlender Hardwarebeschleunigung erscheint stattdessen eine interaktive, hardwarefreie 2D-Bezirkskarte, deren Gebäude zur normalen Bauverwaltung führen. Das Design passt sich in vier groben Farbstilen an Mittelalter, Neuzeit, Industrialisierung und Moderne an; Forschungs-, Gebäude- und Bevölkerungsmodelle sind nicht für jede Epoche vollständig ausbalanciert.

# ⚜️ Kaiser von Deutschland ⚜️

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF.svg)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Eine umfassende historische Königreichssimulation von Jahr 0 bis in die Zukunft - Ein modernes Remake des Klassikers "Kaiser" mit massiven Erweiterungen.

## 🚧 Entwicklungsstatus

Die Standardoberfläche ist eine **spielbare lokale Aufbaukampagne ab 1200**.
Die frühere Canvas-Menüführung mit Platzhalteraktionen wurde durch eine responsive,
tastaturbedienbare Verwaltung mit interaktiver PixiJS-Siedlungskarte ersetzt.

### Jetzt im Hauptspiel bedienbar

- Neuer Spielstart mit eigenen Namen, drei Schwierigkeiten und optionalen Zufallsereignissen.
- 16 Infrastrukturkategorien mit echten, gemeinsamen Baukosten und Ressourcenprüfung.
- Monatliche Produktion, Verbrauch, Steuern, Zufriedenheit und Bevölkerungsentwicklung.
- Markthandel mit sichtbaren Preisen sowie Rekrutierung von drei Truppentypen.
- Pause, Einzelschritte und 1×/2×/4× Geschwindigkeit; eine gemeinsame Simulationszeit.
- Automatisches Speichern nach jedem abgeschlossenen Monat sowie manuelles Speichern und Laden im Browser, einschließlich Bürgern und Kalender.
- Feldzüge gegen drei rivalisierende Reiche, Nachschub, Verluste, Überfälle und Tribut.
- Spielbare Bürger mit Rollenwechsel und vier persönlichen Monatsaktionen.
- Lokaler Hotseat für zwei bis vier Herrscher mit Spielerübergabe und gegenseitigen Angriffen.
- Reichsspezifische Forschung aus Schulen, Universitäten und der persönlichen Studienaktion;
  Technologien schalten passende Handelsrouten und Transportmittel frei.
- Handelsrouten im Wirtschaftsbereich aktivieren und beenden; Kosten, Ära, Hafen- und
  Technologievoraussetzungen werden vor dem Einsatz geprüft.
- Sechs erreichbare Kampagnenziele; danach ist freies Weiterspielen möglich.

**Start:** `npm ci`, danach `npm run dev`, Browser unter `http://localhost:4100`.
Das Spiel beginnt pausiert. „Monat →“ berechnet genau einen Monat; 1× entspricht
vier Sekunden pro Monat. Nach jedem abgeschlossenen Monat wird automatisch im Slot `autosave` gespeichert; manuelles Speichern bleibt möglich. Laden pausiert immer die Zeit.
Spielstände sind an Browserprofil und Origin gebunden und kein Cloud-Backup.

**Abgrenzung:** Die Karte ist schematisch und stellt keine historischen Grenzen dar.
Schlachten werden statistisch aufgelöst, nicht als taktische Echtzeitkämpfe.
Mehrspieler bedeutet hier **Hotseat an einem Gerät**, nicht Online-Multiplayer.
Nach dem letzten Spielerzug vergeht ein Monat; es gibt dabei keine automatische Zeit.
Rollenwechsel verändert den gespielten Bürger und seinen Feldherrenbonus, nicht die
Verwaltungsoberfläche. Die weiter unten beschriebenen älteren Systeme und
Roadmap-Features sind **nicht mit vollständig integriertem Gameplay gleichzusetzen**.
Das Gesamtprojekt bleibt in Entwicklung.

Prüfanleitung: [GAMEPLAY_TESTING_GUIDE.md](GAMEPLAY_TESTING_GUIDE.md).
Feedback: [CONTRIBUTING.md](CONTRIBUTING.md).

## 🎧 Musik-Jukebox und Originalaufnahmen
Die 15 Originalaufnahmen liegen als echte Dateien in `public/music/`. Auf dem Startbildschirm wird **„Zeit vergeht“** als Hauptthema verwendet; die Stückauswahl befindet sich ausschließlich während des Spiels unter „Musik & Klangeinstellungen“. Alle Titel können als MP3 heruntergeladen werden.

Die Musikauswahl umfasst Covergalerie, Wiedergabe, Stopp, Lautstärke und automatischen Epochenwechsel. Zusätzlich dürfen Spieler private MP3-/OGG-/WAV-Aufnahmen (bis 30 MB pro Datei) importieren. Diese verbleiben im jeweiligen Browserprofil über LocalForage.

Der frühere Abschnitt „Ein Reich, viele Zeiten / Krone und Land“ beschreibt ein **entferntes** prozedurales Musiksystem und gilt nicht mehr. Kurze synthetisierte UI-Effekte und separat aktivierbare Umweltklänge bestehen weiterhin.

## 🏘️ Erweiterte Siedlungsansicht
Die PixiJS-Siedlungskarte berücksichtigt jetzt **alle 16 Infrastrukturarten** statt
nur acht Bezirke. Versorgung, Stadt, Bildung und Verteidigung sind filterbar.
Ein zugänglicher Bezirkswähler zeigt die echten Gebäudebestände; ein ausgewählter
Bezirk führt weiterhin zum regulären Bau-Menü und berechnet keinerlei gesonderte
Wirtschaftsdaten. Kartenoptik unterscheidet Felder, Häfen, Straßen und Mauern.
Im Winter werden Schneeakzente gezeigt. Abgeschlossene Modernisierungsprojekte
ändern die Darstellung bestimmter Viertel (Werkstätten, Straßen, Lager, Märkte,
Schulen und Hospitäler). Nicht gebaute Bezirke bleiben als Bauorte sichtbar.
Die Szene wird bei identischem Spielzustand nicht unnötig neu erzeugt.

Die Gebäude sind **schematisch**, keine reale Stadtgeografie; animierte Bürger sind
Darstellungsfiguren, nicht die einzelnen gespeicherten Bürger. Ein frei platzierbares
Gebäuderaster, realistische Stadtwege, Fahrzeugverkehr und Gebäudeschäden bleiben offen.

## ⚙️ Modernisierung vom Dampfzeitalter zur Zukunft
Im neuen Bereich **Modernisierung** stehen sechs konkrete und optionale
Epochenprojekte zur Wahl: mechanisierte Manufakturen, Eisenbahnnetz,
Elektrizitätsnetz, Rundfunkhäuser, digitale Verwaltung und vernetzte Städte.
Die Umsetzung benötigt das jeweilige historische Mindestjahr, eine **tatsächlich
im eigenen Reich abgeschlossene Technologie** sowie Gold, Holz, Stein und Eisen.
Jede Errungenschaft wird einmalig pro Reich bezahlt, gibt einen gedeckelten,
wirksamen Bonus auf Kultur, Stabilität oder Handelsmacht und wird gespeichert.
Alte Spielstände bleiben kompatibel.

Diese erste Modernisierungswelle ist **keine komplette Wirtschafts- und
Berufssimulation des 19.–22. Jahrhunderts**. Die alten 16 Infrastrukturklassen,
mittelalterliche Kriegsführung und Bürgerberufe werden dadurch noch nicht
epochenabhängig ersetzt. Die bisherigen Systeme und Dokumentationsabschnitte
bleiben ausdrücklich erhalten.

## 📚 Weltgeschichte: Erfindungen, Wissenschaft, Kunst und Kultur

Im neuen Hauptspielbereich **Weltgeschichte** erscheinen historisch datierte Informationskarten
zu Erfindungen, Forschung, Architektur, Kunst, Kultur und gesellschaftlichen Veränderungen.
Quellenlinks und Orte sind direkt an den Karten hinterlegt. Mit dem Jahreswechsel informiert
das Spiel bei passenden Meilensteinen über neue Einträge; das Epochenschild ändert sich
von Antike über Mittelalter und Industrialisierung bis zur Moderne und alternativen Zukunft.
Der Katalog deckt ausgewählte Einträge ab 1088 bis 2012 ab; **2050 und 2150 sind
explizit als spekulative Zukunftsszenarien** gekennzeichnet.

**Wichtig:** Historische Informationen sind zunächst **ein Wissens- und Chroniksystem**:
Dass beispielsweise der Buchdruck historisch existierte, bedeutet nicht, dass dein Reich
die entsprechende Technologie automatisch entwickelt hat. Es muss weiterhin selbst forschen.
Die langfristig geplante durchgehende Simulation von Mittelalter bis Zukunft mit
epochenabhängigen Gebäuden, Wirtschaft, Armeen, Medien und Bürgerberufen ist
**noch nicht fertig**. Die bisherigen Roadmap- und Legacy-Beschreibungen bleiben erhalten.

### Historische Ausstellungen als optionale Spielaktion

Historische Karten bleiben reine Wissensinformationen, aber der Herrscher kann
für bereits vergangene kulturelle, künstlerische, wissenschaftliche und
technische Meilensteine eine **freiwillige Ausstellung** finanzieren.
Jede Ausstellung kostet Gold (Basispreis 350, im Zeitverlauf angepasst),
bringt einmalig +2 kulturellen Einfluss sowie Prestige und wird pro Reich
gespeichert. Eine Ausstellung erfindet keine historische Technologie und kann
pro Reich nur einmal gefördert werden. Spekulative Zukunftskarten sind
nicht förderbar. Die Spieldaten älterer Saves bleiben nutzbar.

## 🏛️ Hofverwaltung und Delegation (neue spielbare Erweiterung)

Die umfangreiche Reichsverwaltung kann optional an **Bürger mit eigenen Fähigkeiten** delegiert werden.
Im Menü **Hofverwaltung** stehen Kämmerer, Hofgelehrte und Marschall zur Verfügung.
Jedem Amt wird ein freier lebender Bürger zugeordnet; derselbe Bürger darf nicht mehrere
Ämter übernehmen, und gespielte Figuren bleiben von einer Ernennung ausgeschlossen.
Während der Amtszeit steigt die passende Bürgerfähigkeit monatlich um einen Punkt.

Jedes Amt startet ausdrücklich im Modus **Nur beraten**. Auf Wunsch lässt sich
**Begrenzt automatisch** aktivieren. Der Kämmerer kauft bei knappen Vorräten
höchstens 100 Nahrung pro Monat und nur bei ausreichender Goldreserve; die Hofgelehrte
darf bei freier Forschung ein bezahlbares Forschungsprojekt beginnen, wobei höchstens
20 % des vorhandenen Goldes eingesetzt werden. Der Marschall übernimmt keine
Angriffe oder eigenmächtigen militärischen Ausgaben. Eine externe generative KI
(Ollama o. Ä.) wird hierfür **nicht benötigt**; eine beratende LLM-Erweiterung
ist nur eine spätere Option. Entlassung und Umschaltung sind jederzeit möglich.

Ernennungen, Automatikmodi und Dienstmonate werden pro Spieler gespeichert.
Die Bürgerwerte stammen weiterhin aus dem existierenden Bürger- und Speichersystem;
alte Spielstände ohne Hofverwaltung bleiben benutzbar.

### Hanserouten und überprüfbare Voraussetzungen

Für die Route **Hanserouten (Lübeck–Novgorod)** gelten im Spiel:
- Forschung **Hochseesegeln** (`sailing`), Kosten 900 Gold und 120 Forschungspunkte;
- mindestens **ein Hafen** (auch die Hanseroute wird jetzt als Seeroute erkannt);
- **15.030 Gold** Aktivierungskosten, zusätzlich zu vorherigen Forschungs-/Baukosten.

Die Route ist im Bereich Wirtschaft auswählbar, sobald die Technologie abgeschlossen
wurde. Eine fehlende Voraussetzung verhindert die Aktivierung; die Oberflächenmeldung
zeigt die fehlende Hafen- oder Goldbedingung. Der Test
`src/core/GameEngine.test.ts` prüft die gesamte Freischaltung mit den Grenzfällen
15.029 bzw. 15.030 Gold. Für einen vollständig manuell ausgeführten
End-to-End-Test im Chromium-Browser bleibt eine eigene Abnahme erforderlich.

### Ideen für mehr Spielspaß – geplant, nicht bereits implementiert

**Ratsdilemmata mit Charakteren:** Ein fähiger Verwalter kann ehrgeizig,
illoyal oder überfordert sein; Entscheidungen können Loyalität, Rivalität und
persönliche Biografien verändern. **Karrieren und Dynastien:** Lehrlinge werden
zu erfahrenen Amtsinhabern, die später wichtige Forderungen stellen oder
konkurrierende Familien fördern. **Krisenaktionen:** Bei Hungersnot, Pest oder
einem Überfall wählt der Spieler zwischen schnellen, teuren und langfristigen
Lösungen. **Handel und Entdeckungen:** Seefahrt, Bündnisse und neue Technologien
eröffnen tatsächlich unterschiedliche Wege zum Kampagnensieg.
**Ereignisketten:** Politische Entscheidungen lösen über Jahre hinweg
verschiedene Folgeereignisse und historische Wendepunkte aus.

Die alte Funktions- und Roadmap-Dokumentation weiter unten wird bewusst **nicht
gelöscht**: Bestehende Kernsysteme, historische Vorarbeiten und vollständige
Integration in die Standardkampagne sind drei unterschiedliche Reifegrade.

## 🎮 Spielkonzept

Kaiser von Deutschland ist eine komplexe Strategie- und Rollenspielsimulation, die es Spielern ermöglicht, verschiedene historische und moderne Rollen zu übernehmen - vom einfachen Arbeiter bis zum mächtigen Kaiser. Das Spiel deckt eine Zeitspanne von über 2000 Jahren ab und kombiniert historische Genauigkeit mit strategischer Tiefe.

> **Aktuelle Version:** v2.6.0  
> **NEU in 2.6.0:** 🎭 **Life Simulation System** - Wechsle nahtlos zwischen Charakteren und erlebe die Geschichte aus verschiedenen Perspektiven!
> - **👤 Rollenwechsel-System**: Spiele jederzeit jeden lebenden Charakter
> - **🤖 AI Controller**: Intelligente KI steuert nicht-gespielte Charaktere
> - **⏱️ Drei Zeit-Modi**: Detail (1s=1 Tag), Ausgewogen (1s=1 Monat), Strategisch (1s=1 Jahr)
> - **🎨 Dynamische Ansichten**: UI passt sich der Rolle an (Kaiser, Bauer, Händler, etc.)
> **Neu in 2.5.1:** ⚔️ **Kriegsgefangene-System (PoW)** - Manage prisoners of war with historical accuracy!
> **Neu in 2.3.6:** 💰 **Kriegsfinanzierung & Kriegsanleihen** - Finanziere Kriege mit historischen Methoden!
> **Neu in 2.5.0:** 🎮 **Lebensphasen-basiertes Gameplay-System** + **20 Roadmap Features**  
> **MASSIV ERWEITERT in v2.4.0:** 🚀 **17 neue Kernsysteme** für Population, Krieg, Spionage, Städte, Kultur & Recht!  
> Siehe [ROADMAP](docs/00-meta/roadmap.md) für geplante Features und [STATUS](docs/00-meta/status.md) für Details.

## ✨ Hauptmerkmale

### 🎭 15 Verschiedene Spielerrollen
- **Imperial**: Kaiser, Kaiserin
- **Royal**: König, Königin
- **Religious**: Papst, Bischof, Mönch, Nonne
- **Noble**: Herzog, Herzogin
- **Administrative**: Minister, Bürgermeister
- **Economic**: Händler, Gildenmeister, Handwerker
- **Labor**: Bauer, Arbeiter
- **Academic**: Gelehrter

Jede Rolle hat einzigartige Fähigkeiten, spezifische Anforderungen und verschiedene Startressourcen.

### 📅 Historische Zeitlinie (Jahr 0 - 2050)
- **27 historische Ereignisse** von der Geburt Christi bis zur Weltraumkolonisierung
- Automatische Ereignisse basierend auf dem Jahr
- Zufällige Ereignisse für dynamisches Gameplay
- Zukunfts-Szenarien (KI-Revolution, Fusionsenergie, etc.)

### 🏗️ 23 Gebäudetypen
Von antiken Bauernhöfen bis zu futuristischen Rechenzentren.

### 🔬 24 Technologien
Vollständiger Technologie-Baum von der Antike bis zur digitalen Zukunft.

### 📊 Umfangreiches Statistik-System
Wirtschaft, Militär, Soziales, Kultur und Politik - alles detailliert simuliert.

### 🏛️ Politik-System (NEU)
**33 politische Maßnahmen** in 8 Kategorien:
- Asyl und Zuwanderung
- Wirtschaft (Inland & Außenhandel)
- Gesundheitswesen
- Soziale Förderung & Restriktion
- Soziale Spannungen
- Ballungsräume

### 🤖 KI-Integration (NEU)
- **Ollama AI**: 6 verschiedene KI-Modelle als Spieler oder Berater
- Intelligente Entscheidungshilfe
- Event-Analyse und Empfehlungen
- Chat-Funktion

### 🌐 Multiplayer-System (NEU)
- Bis zu 6 Spieler (Menschen + KI)
- Echtzeit- oder Rundenbasiert
- In-Game Chat (öffentlich & privat)
- Session-Management mit Lobby

### 📚 Wikipedia-Integration (NEU)
- Historische Ereignisse mit echten Wikipedia-Artikeln anreichern
- Kontextwissen und verwandte Themen
- Intelligentes Caching

### 🧬 Bevölkerungsdynamik (v2.1.5 - NEU!)
- **Individuelle Bürger-Simulation**: Jeder Bürger hat Name, Alter, Beruf, Bedürfnisse
- **Familienbildung und Dynastien**: Verwandtschaftsbeziehungen über Generationen
- **Demografische Simulation**: Realistische Geburten- und Sterberaten, Alterspyramiden
- **Epidemien & Hungersnöte**: Mit individueller Krankheitsverbreitung
- **Soziale Netzwerke**: Freundschaften, Feindschaften, Informationsverbreitung
- **Soziale Bewegungen**: Revolutionen, Reformen, Proteste
- **Multiplayer**: Jeder Spieler kann jeden Bürger übernehmen!
- **PixiJS Visualisierung**: Interaktive Bevölkerungskarten und Alterspyramiden

### 🌍 Ökologische Simulation (v2.2.3)
- **Dynamisches Klima-System**: Jahreszeiten, Klimawandel über Jahrhunderte, Wettervorhersage-Technologien
- **Naturkatastrophen**: Überschwemmungen, Dürren, Stürme, Erdbeben, Waldbrände, Heuschrecken
- **Ressourcen-Management**: Erschöpfung und Regeneration von Holz, Stein, Eisen, Wildtieren
- **Landschafts-Veränderung**: Entwaldung, Wiederaufforstung, Flussläufe, Bodenerosion
- **Terraforming**: Sumpftrockenlegung, Landgewinnung, Bewässerung, Bodenverbesserung
- **Tierpopulationen**: Wildtiere (Hirsche, Wildschweine, Wölfe, Bären), Viehzucht, Fischerei
- **Artenschutz**: Jagdbeschränkungen, Schutzgebiete, Zuchtprogramme, Aussterbe-Events
- **Multiplayer**: Gemeinsame Umweltkrisen, Jagdkonflikte, Grenzstreitigkeiten

### 🤝 Diplomatie-System (v2.3.0 - NEU!)
- **Diplomatische Beziehungen**: Verwaltung von Beziehungen zu anderen Königreichen mit Vertrauens- und Beziehungswerten
- **Verträge & Allianzen**: Vollständiges Vertragssystem (Frieden, Bündnis, Handel, Nicht-Angriff, Vasallentum)
- **Handelsabkommen**: Umfassendes Handelssystem mit Ressourcenaustausch und Goldzufluss
- **Kriegserklärungen**: Kriegssystem mit Causus Belli, Verbündeten und Kriegspunkten
- **Friedensverhandlungen**: Friedensangebote mit Bedingungen für Gold, Territorium und Handel
- **Multiplayer**: Verhandlungen zwischen echten Spielern, Mehrspieler-Verträge

### 🎭 Life Simulation System (v2.6.0 - NEU!)
- **👤 Rollenwechsel**: Wechsle nahtlos zwischen allen lebenden Charakteren
- **🤖 AI Controller**: 4-Schichten-KI-System (Grundbedürfnisse, Rollen, Beziehungen, Ambitionen)
- **4 AI-Typen**: Reactive, Proactive, Historical, Dynamic
- **⏱️ Drei Zeit-Modi**: Detail (1s=1 Tag), Ausgewogen (1s=1 Monat), Strategisch (1s=1 Jahr)
- **🎨 Dynamische Ansichten**: UI passt sich der Rolle an (8 verschiedene Ansichtstypen)
- **📊 Charakter-Dashboard**: Vermögen, Ruf, Gesundheit, Glück, Bedürfnisse
- **🔄 Meta-Wissen**: Wissen bleibt über Charakterwechsel erhalten
- **💡 Empfohlene Charaktere**: Basierend auf Familie und sozialen Beziehungen
- **🎯 Rollenspezifische Ziele**: Jeder Beruf hat eigene AI-Verhaltensweisen

**Siehe [LIFE_SIMULATION.md](docs/LIFE_SIMULATION.md) für Details**

### 🎮 Lebensphasen-basiertes Gameplay (v2.5.0 - NEU!)
- **🎬 Intro-Sequenz**: Historisches Cinematic + Philosophische Fragen für Persönlichkeitsprofil
- **⏳ 9 Zeitperioden**: Von Antike (500) bis Zukunft (2100) - Wähle deine Ära!
- **👶 3 Lebensphasen**: Starte als Kind (5-10J), Schüler (10-14J) oder Erwachsener (18-25J)
- **📅 Monatliche Zyklen**: 24h-Zeitmanagement (Arbeit, Familie, Bildung, Freizeit, Schlaf)
- **🎯 5 Karrierepfade**: Handwerk, Politik, Militär, Klerus, Gelehrte (je 5 Aufstiegsstufen)
- **⚡ 3 Geschwindigkeitsmodi**: Detailreich (Tag), Ausgewogen (Monat), Strategisch (Jahr)
- **💼 Berufsspezifische Aktionen**: Jede Rolle hat einzigartige monatliche Entscheidungen
- **📈 Aufstiegssystem**: Vom Lehrling zum Meister - realistische Karriereentwicklung
- **🧠 Persönlichkeitssystem**: Charisma, Intellekt, Pragmatismus, Spiritualität beeinflussen Gameplay
- **📜 Historische Szenarien**: Vordefinierte Startpunkte in verschiedenen Epochen

**Siehe [GAMEPLAY_SYSTEM.md](docs/03-game-design/GAMEPLAY_SYSTEM.md) für Details**

### ⛪ Religions- & Kultursystem (v2.3.0 - NEU!)
- **7 Religionen**: Katholizismus, Protestantismus, Orthodoxie, Islam, Judentum, Heidentum, Atheismus
- **Kulturelle Identität**: 8 verschiedene Kulturen (Germanisch, Lateinisch, Slawisch, etc.)
- **Religiöse Gebäude**: 4 Gebäudetypen (Kapelle, Kirche, Kathedrale, Kloster)
- **Kulturelle Ereignisse**: 5 Festivals (Ostern, Weihnachten, Erntedank, etc.)
- **Bekehrung & Spannungen**: Vollständiges Konversionssystem mit religiösen Konflikten
- **Multiplayer**: Glaubenskriege, Bekehrungskampagnen

### 📜 Erweiterte Historische Inhalte (v2.3.0 - NEU!)
- **70 Historische Ereignisse**: Von Wikingerüberfällen bis Klimastabilisierung (Jahr 793-2080)
- **Event-Ketten**: Kreuzzüge, Hanse, 30-jähriger Krieg, Weltkriege, Digitale Revolution
- **Regionale Ereignisse**: Deutschland, Europa, globale Events
- **Alternative Geschichte**: Was-Wäre-Wenn-Szenarien mit Spieler-Entscheidungen
- **Dynamische Events**: 8 Event-Vorlagen mit Wahrscheinlichkeiten

### 👥 Neue Rollen & Gebäude (v2.3.0 - NEU!)
- **35 Spielbare Rollen**: +10 neue Rollen (Bankier, Architekt, Spion, Admiral, General, Journalist, Erfinder, Diplomat, Fabrikbesitzer, Philosoph)
- **68 Gebäudetypen**: +30 neue Gebäude (Banken, Museen, Parlamente, Raumhäfen, etc.)
- **3 Weltwunder**: Kolosseum, Eiffelturm, Brandenburger Tor
- **Spezialgebäude**: Mit einzigartigen Boni und Effekten

### 🏛️ Erweiterte Politik (v2.3.0 - NEU!)
- **53 Politik-Maßnahmen**: +20 neue Maßnahmen in 4 neuen Kategorien
- **Umweltpolitik**: CO2-Steuer, Erneuerbare Energien, Emissionsgrenzwerte, Naturschutz, Plastikverbot
- **Digitalpolitik**: Datenschutz, Internet-Zensur, Digitale Infrastruktur, Cybersicherheit
- **Wissenschaftspolitik**: Forschungsförderung, Universitätsausbau, Nobelpreis, Weltraumprogramm
- **Sicherheitspolitik**: Polizeireform, Unabhängige Justiz, Strafrechtsreform, Grenzsicherung

### 🎯 Roadmap Features (v2.3.1 - NEU!)
- **🎭 10 Historische Persönlichkeiten**: Karl der Große, Bismarck, Luther, Einstein, Goethe, Beethoven
- **⚔️ 10 Historische Schlachten**: Von Teutoburger Wald (9 n.Chr.) bis Kursk (1943)
- **🦠 8 Krankheiten & Epidemien**: Pest, Cholera, Spanische Grippe mit vollständiger Simulation
- **🌪️ 8 Naturkatastrophen**: Erdbeben, Überschwemmungen, Dürren mit historischen Beispielen
- **🚂 15 Transportsysteme**: Von Pferd bis Hochgeschwindigkeitszug
- **🛤️ 10 Handelsrouten**: Bernsteinstraße, Hanserouten, EU-Binnenmarkt
- **🎨 11 Kunststile**: Von Romanik bis Postmoderne
- **🎭 12 Kulturelle Events**: Oktoberfest, Weihnachtsmarkt, Karneval, Berlinale
- **🔬 15 Wissenschaftliche Entdeckungen**: Buchdruck, Relativitätstheorie, Internet
- **⚖️ 10 Rechtssysteme**: Von Stammesrecht bis EU-Recht
- **💰 12 Steuersysteme**: Von Zehnt bis CO2-Steuer
- **⚔️ 15 Militäreinheiten**: Von Miliz bis Mechanisierte Infanterie

### 🎮 Integrierte Gameplay-Systeme (v2.4.0 - NEU!)
- **⛪ Religionssystem**: 10 Religionen, religiöse Gebäude, Konversion, religiöse Spannungen
- **🚶 Migrationssystem**: Bevölkerungsbewegungen zwischen Regionen basierend auf Wirtschaft, Sicherheit, Lebensqualität
- **📈 Soziale Mobilitätssystem**: Klassenwechsel, Berufsaufstieg, soziale Bewegungen
- **🌾 Hungersnot-System**: Regionale Hungersnöte mit Ursachen und Auswirkungen
- **💰 Ökonomische Kohorten**: Skalierbare Wirtschaft für bis zu 80 Millionen Bürger
- **⚔️ Gelände & Wetter im Kampf**: Terraineffekte (Höhen, Wälder, Flüsse) und Wettereinflüsse in Schlachten
- **🎖️ Militärformationen**: Keil, Phalanx, Linie und weitere taktische Formationen
- **📦 Versorgungslogistik**: Versorgungslinien, Winterquartiere, Lager für Armeen
- **🏰 Belagerungs-System**: Stadtbelagerungen mit Werkzeugen (Katapulte, Kanonen), Mauern, Versorgung
- **🛡️ Befestigungssystem**: Stadtmauern von Holzpalisaden bis Bunkern
- **⚓ Marinekriegsführung**: 8 Schiffstypen, 10 Naval-Technologien, Seeschlachten, Blockaden, Piraterie
- **🕵️ Spionage-System**: Agentennetzwerke, Missionen, Sabotage, Attentate, Doppelagenten
- **⚔️ Kriegsgefangene-System (v2.5.1)**: 
  - Gefangenennahme aus Schlachten und Belagerungen
  - 6 Behandlungsrichtlinien (Menschlich, Standard, Hart, Zwangsarbeit, Lösegeld, Hinrichtung)
  - Gefangenenlager mit konfigurierbarer Sicherheit und Bedingungen
  - Gefangenenaustausch und Lösegeldverhandlungen
  - Fluchtversuche mit sicherheitsbasierten Erfolgsraten
  - Genfer Konvention Compliance (ab 1929)
  - Diplomatische Konsequenzen für Behandlung
  - Monatliche Gesundheit, Moral und Wirtschaftskosten
  - Historische Ereignisse und berühmte Gefangene
  - Umfassendes PoW-Verwaltungs-UI-Panel
- **💰 Kriegsfinanzierung & Kriegsanleihen (v2.3.6 - NEU!)**:
  - 12 historische Finanzierungsmethoden (Plünderung, Kriegssteuern, Kriegsanleihen, etc.)
  - Authentische Kriegsanleihen aus WW1 & WW2 (Liberty Bonds, Deutsche Kriegsanleihen)
  - Kreditsystem mit Zinsen und Rückzahlungsfristen
  - 5 Rückzahlungsstrategien (Regulär, Sparpolitik, Zahlungsausfall, Neuverhandlung, Inflation)
  - Historische Events (Hyperinflation 1923, Marshall-Plan 1948, Bretton Woods)
  - Wirtschaftliche Konsequenzen: Inflation, Popularität, Stabilität, Schuldenmanagement
  - Monatliche Schuldenzahlungen mit automatischem Management
  - Umfassendes UI-Panel mit 5 Tabs (Übersicht, Methoden, Kredite, Rückzahlung, Geschichte)
- **🏙️ Stadtbezirks-System**: Slums, Nobelviertel, Gentrifizierung, Kriminalität
- **🌙 Tag/Nacht-Zyklus**: Tagesrhythmus mit unterschiedlichen Aktivitäten (Märkte morgens, Theater abends)
- **🎨 Kunst & Kultur**: Künstler, Kunstwerke, Aufführungen, kulturelle Kreise, Konzerte
- **📰 Informationsverbreitung**: Nachrichten, Gerüchte, Propaganda, Medien von Flugblättern bis Internet
- **⚖️ Rechtssystem & Gerichte**: Gerichtsverfahren, Richter, Gefängnisse, Bürokratie, Korruption
- **📚 Bibliothekssystem**: Büchersammlungen, Zensur, digitale Bibliotheken, Open Access
- **🎓 Universitätssystem**: Historische deutsche Universitäten, Nobelpreise, Forschung
- **📜 Historische Events**: Erweiterte Event-Datenbank mit Event-Ketten

### 🚢 Handelsrouten & Transport (v2.6.0 - NEU!)
- **🗺️ Handelsrouten-System**: 10 historische Handelsrouten aktivieren und verwalten
  - Bernsteinstraße, Hanseatic Trade, Seidenstraße-Extension, EU-Binnenmarkt, etc.
  - Kosten-basierte Aktivierung (Länge × Gefahr)
  - Voraussetzungen: Infrastruktur (Häfen) und Technologie
- **💰 Wirtschaftliche Integration**:
  - Monatliches Einkommen aus aktiven Routen
  - Modifikatoren: Infrastruktur (+Märkte, Häfen, Straßen, Lagerhäuser)
  - Bonus: Kultureinfluss, Prestige, Trade Power
  - Malus: Stabilität, Kriegsstatus
- **🚂 15 Transporttypen**: Vom Fußgänger bis Hochgeschwindigkeitszug
  - Kategorien: Zu Fuß, Reittiere, Gespanne, Schiffe, Eisenbahn, Kraftfahrzeuge, Luftfahrt
  - Historische Epochen: Antike → Zeitgenössisch
  - Eigenschaften: Geschwindigkeit, Kapazität, Kosten, Wartung, Reichweite
- **📊 Umfangreiches UI-Panel**:
  - Tab: Aktive Routen (mit Deaktivierungs-Option)
  - Tab: Verfügbare Routen (mit Aktivierungs-Button)
  - Tab: Transportmittel-Galerie
  - Tab: Statistiken-Dashboard (Einkommen, Kultureinfluss, Modifikatoren)

## 🚀 Technologie-Stack

- **TypeScript** - Type-safe Entwicklung
- **Vite** - Schnelles Build-Tool
- **PixiJS** - High-Performance 2D Grafik-Engine
- **LocalForage** - Persistente Datenspeicherung (IndexedDB)
- **JSON-basierte Datenarchitektur** - Vollständig modular und erweiterbar
- **Responsive Design** - Funktioniert auf Desktop, Tablet und Mobile

## 🛠️ Installation & Ausführung

### Voraussetzungen
- Node.js 18+ LTS
- npm, yarn oder pnpm

### Setup
```bash
# Dependencies installieren
npm install

# Development Server starten (Port 4100)
npm run dev

# Build für Produktion
npm run build

# TypeScript Type-Check
npm run check

# Tests ausführen
npm test
```

### Port ändern
```bash
# Windows PowerShell
$env:PORT = 4200
npm run dev

# Linux/macOS
PORT=4200 npm run dev
```

## 📁 Projektstruktur

```
src/
├── core/                       # Kern-Spiellogik
│   ├── GameEngine.ts           # Haupt-Spiel-Engine
│   ├── Player.ts               # Spieler-System
│   ├── Kingdom.ts              # Königreich-Management
│   ├── RoleSystem.ts           # Rollen-Management
│   ├── BuildingSystem.ts       # Gebäude-Management
│   ├── TechnologySystem.ts     # Technologie-Baum
│   ├── HistoricalEventSystem.ts # Historische Ereignisse
│   ├── PolicySystem.ts         # 33 Politik-Maßnahmen (NEU)
│   ├── OllamaService.ts        # KI-Integration (NEU)
│   ├── MultiplayerSystem.ts    # Multiplayer-Framework (NEU)
│   ├── WikiIntegration.ts      # Wikipedia-Anbindung (NEU)
│   ├── Economy.ts              # Wirtschafts-Engine
│   ├── Events.ts               # Event-System
│   └── RegionalSystem.ts       # Regional-Verwaltung
├── ui/                         # UI-Komponenten
│   ├── GameUI.ts               # Haupt-UI
│   ├── Graphics.ts             # Canvas-Rendering
│   ├── NewFeaturesPanel.ts     # Panel für neue Features (NEU)
│   ├── NotificationSystem.ts   # Benachrichtigungen
│   └── SaveManager.ts          # Speicher-Verwaltung
├── data/                       # Daten und Definitionen
│   ├── json/                   # JSON-Datenbanken
│   │   ├── roles.json          # 15 Rollen-Definitionen
│   │   ├── buildings.json      # 23 Gebäude
│   │   ├── technologies.json   # 24 Technologien
│   │   ├── historical-events.json # 27 Ereignisse
│   │   ├── policy-categories.json # Politik-Kategorien (NEU)
│   │   ├── regions.json        # Regionen
│   │   └── achievements.json   # Erfolge
│   └── Titles.ts               # Titel-System
├── utils/                      # Hilfsfunktionen
└── main.ts                     # Einstiegspunkt
```

## 🎯 Design-Philosophie

- **Modularität**: Alle Systeme sind voneinander getrennt
- **Datengetrieben**: JSON-Dateien für einfache Erweiterung
- **Historische Genauigkeit**: Basierend auf echten Ereignissen
- **Moderne Technologie**: Beste Performance durch moderne Web-Tech
- **Responsive**: Funktioniert auf allen Geräten

## 📖 Ursprung & Inspiration

Inspiriert vom klassischen **Kaiser** (1984) und **Kaiser II** - legendäre Strategiespiele für Commodore 64. Dieses Projekt erweitert die ursprüngliche Spielidee massiv mit modernen Technologien und umfassendem Content.

## 📖 Dokumentation

### 🚀 Schnelleinstieg

- **[Benutzerhandbuch](docs/USER_GUIDE.md)** - Spielanleitung und Features
- **[Roadmap](docs/00-meta/roadmap.md)** - Geplante Features und Entwicklung
- **[Beitragen](CONTRIBUTING.md)** - Wie Sie zum Projekt beitragen können

### 📚 Vollständige Dokumentation

Wir verwenden eine **strukturierte Dokumentation** nach professionellen Standards:

- **[docs/](docs/README.md)** - Dokumentations-Übersicht und Navigation
- **[Vision & Status](docs/00-meta/)** - Projektziele und aktueller Stand
- **[Überblick](docs/01-overview/)** - Spielidee, Zielgruppen, Grundannahmen
- **[Simulation](docs/02-simulation-model/)** - Ökonomische und soziale Modelle
- **[Game Design](docs/03-game-design/)** - Spielmechaniken und Regeln
- **[Domänen](docs/04-domains/)** - Spezielle Bereiche (Wirtschaft, Arbeit, Ökologie)
- **[Technische Architektur](docs/05-technical-architecture/)** - System-Design und Datenbank
- **[Entwicklung](docs/06-development/)** - Setup, Guidelines, Testing
- **[Operations](docs/07-operations/)** - Build, Deployment, Configuration
- **[Entscheidungen](docs/08-decisions/)** - ADRs (Architecture Decision Records)
- **[Anhang](docs/99-appendix/)** - Referenzen, Quellen, Validierung

### 👨‍💻 Für Entwickler

- **[System-Architektur](docs/05-technical-architecture/ARCHITECTURE.md)** - Technischer Überblick
- **[API-Referenz](docs/05-technical-architecture/API_REFERENCE.md)** - Code-Dokumentation
- **[Datenbank-Implementation](docs/06-development/database-implementation.md)** - SQLite Integration (NEU)
- **[ADR-0001: Database Technology](docs/08-decisions/adr-0001-database-technology.md)** - Datenbank-Entscheidung

## 🤝 Beitragen

Beiträge sind willkommen! Besonders:
- Neue historische Ereignisse
- Zusätzliche Rollen und Gebäude
- Weitere Politik-Maßnahmen
- Verbesserte Grafiken
- Lokalisierung in andere Sprachen
- Bug-Fixes und Performance-Optimierungen

Bitte lesen Sie [CONTRIBUTING.md](CONTRIBUTING.md) für Details zum Entwicklungsprozess.

## 🐛 Probleme melden

Haben Sie einen Bug gefunden oder einen Feature-Wunsch? Bitte [erstellen Sie ein Issue](https://github.com/Thomas-Heisig/Kaiser_von_Deutschland/issues) auf GitHub.

## 📜 Lizenz

MIT License - siehe [LICENSE](LICENSE) für Details.

## 🙏 Danksagungen

- Inspiriert vom klassischen **Kaiser** (1984) und **Kaiser II** für Commodore 64
- Basiert auf historischen Ereignissen und Strukturen
- Community-Beiträge und Feedback

---

**Entwickelt mit ❤️ für Geschichts- und Strategiespiel-Fans**

_Erlebe Geschichte. Erschaffe Deine Dynastie. Herrsche über Deutschland._
