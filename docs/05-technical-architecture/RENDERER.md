# Renderer – verbindliche Grafikrichtung (18.10.2026)

## Einzige aktive Entscheidung
**Kenney Retro Fantasy Kit + Retro Textures Fantasy** für die mittelalterliche Karte. **Kenney Retro Urban Kit** für spätere industrielle und moderne Epochen. **Sketch Town ist verworfene Erstwahl und ausschließlich Reserve**, nicht der aktive Plan. Änderungen an dieser Entscheidung nur über aktualisierte Repository-Dokumentation und Review.

## Nachweisbarer Ist-Stand in main
- PR #67 wurde nach grüner CI und grünem Chromium Browser-Smoke auf `main` integriert.
- Isolierte Vorschauseite: `/workshop-prototype.html`, PixiJS 8.14.3.
- Acht echte Kenney-Preview-PNGs in einem 256 × 128 Sprite-Atlas; sie stellen **einzelne Bauteile dar**, kein fertig gerendertes GLB-Haus.
- Festes Testgerüst: 12 × 12 = **144 Kacheln**, **ein modular dargestelltes Gebäude**, **eine Lichtfläche**, **24 Rauchpartikel**, 30-FPS-Limit und Frame-Abstandsbericht (Mittel/P95).
- Browser-Test prüft die Preview, den tatsächlich geladenen PNG-Atlas und grundlegende Navigation. **Keine iOS-Messungen**; ein Browser-Smoke ist keine Freigabe der Optik oder Performance auf Endgeräten.
- `KingdomMap.ts` bleibt eine geometrisch gezeichnete Hauptkarte; 16 feste Bezirke, Filter, Pan/Zoom und `GameEngine`/Spielstände bleiben unverändert.

## Genau ein nächster vertikaler Grafikschritt: GLB → 2D
1. Aus `kenney_retro-fantasy-kit.zip` **genau ein vollständiges Gebäude** auswählen oder aus modularen GLBs zu einem Gebäude zusammensetzen.
2. Reproduzierbare Blender-Pipeline mit festem orthografischem Blickwinkel (Azimut 45°, Elevation 30°), einheitlichem Maßstab, Beleuchtung und transparentem PNG; Blender-Version protokollieren.
3. Render **einer** Werkstatt, Bildquelle und SHA-256 ins `ASSETS.md` aufnehmen.
4. Genau diese Grafik im isolierten Prototyp als optionalen Spritetest einbauen; bisherige Preview-/Geometrie-Fallbacks beibehalten.
5. Desktop-Browser-Test und danach Safari-Test auf tatsächlichem iPad/iPhone dokumentieren. Erst dann auf einen einzigen festen Bezirk der produktiven Karte ausdehnen.

**Geräte:** iPad-/iPhone-Modell und OS-Version derzeit **unbekannt; beim ersten realen Test dokumentieren**, kein Blocker für die Desktop-Pipeline.

## Qualitätsgrenzen
- Keine neue Engine und kein neues Savegame-Schema; keine freie Bebauung.
- Vorläufiges Performance-Testgate: auf iPhone/iPad nach 30 s Warmlauf drei Läufe à 120 s plus 10 min Stabilität; P95-Frame-Abstand ≤ 50 ms bei 30-FPS-Deckel; keine wiederholten WebGL-Kontextverluste; keine >40 MB dauerhafte Speicherzunahme.
- Prototyp-Asset-Budget: < 2 MB zusätzliche komprimierte Grafikassets; JS-Gzip-Differenz < 50 KB.
- Keine behaupteten iOS-Benchmarks ohne reale Messdaten.

## Reproduzierbare GLB→2D-Erstpipeline (18.10.2026)

Das erste vollständige Gebäude wurde lokal aus **fünf Positionen mit vier unterschiedlichen Original-GLBs** gerendert. Das Ergebnis ist ein echtes transparentes 384 × 384 PNG aus 3D-Geometrie (keine Kenney-Vorschau). Der unmittelbar reproduzierbare Code steht in `scripts/render_kenney_house.py` und liest das originale Nutzerarchiv `kenney_retro-fantasy-kit.zip`. Abhängigkeiten für diesen getrennten Offline-Build: Python, trimesh, VTK/EGL, numpy und Pillow. Blender ist **nicht installiert**; das Tool behauptet keinen Blender-Render. Die GLB-Materialtexturen werden zurzeit durch eine dokumentierte deterministische Mittelalter-Palette ersetzt.

Die lokal erzeugte PNG-Datei ist ein **Vorzeigeergebnis außerhalb des GitHub-Builds**. Ein Transfer der binären PNG-Datei nach `public/assets/kenney/` und der anschließende Einbau in `WorkshopScene.ts` stehen noch aus. Bis dahin zeigt die produktive Prototypseite weiterhin den 8-Grafiken-Preview-Atlas. iPad-/iPhone-Messungen weiterhin offen.

## Schritt abgeschlossen: echtes GLB-Haus im isolierten Spielprototyp

Das aus Kenney-GLB-Modellen gerenderte, optimierte `retro-house-1200.png` ist jetzt als primäre Gebäudegrafik in `WorkshopScene` integriert. Bei fehlender Datei folgt der bisherige Preview-Atlas, bei dessen Ausfall die geometrische Ersatzdarstellung. Die 144 Kacheln, genau ein Haus, eine Lichtfläche und 24 Rauchpartikel bleiben erhalten. Browser-Smoke prüft die reale PNG-Ladung. **Keine** Aussage über die endgültige grafische Qualität oder iOS-FPS.

## Retro-Landschaft und öffentliche Pfade

Die Hauptkarte verwendet den CC0-Kenney-Atlas für eine begrenzte, deterministische Landschafts-Dekoration zusätzlich zu ihren 16 Retro-Bezirken (bis zu 65 mögliche Objekte, Bezirke werden freigehalten). Im flachen 2D-Modus wird diese Schicht ausgeblendet. Es handelt sich weiterhin um Kenney-Preview-Sprites, nicht um eine vollständige GLB-3D-Stadt. Die Werkstatt lädt ihre Grafiken nun relativ zur von Vite vorgegebenen BASE_URL und ist damit unter dem GitHub-Pages-Unterpfad erreichbar. Weitere vorbereitete Atlanten der drei Pakete sind noch nicht im Repository enthalten.

## Differenzierte Bezirkssilhouetten

Die 16 festen Bezirke sind jetzt im Retro-Modus nach Kategorien differenziert (Felder, Straßen, Hafen, Bergwerk, Befestigung, Bildung und städtische Gebäude). Kennzeichen nicht gebauter Bezirke werden transparent dargestellt; spätere Epochen erhalten vorläufig andere Kombinationen des vorhandenen Kenney-Atlas. Es sind noch **keine vollständigen Retro-Urban-Assets** eingebunden; die Unterscheidung ist eine Zwischenstufe. Dokumentiert für die nächste Ausbaustufe: Die extern vorbereiteten zusätzlichen Atlanten müssen erst als echte Binärdateien eingecheckt und unter GitHub Pages getestet werden.

## Fehlertoleranz der Asset-Pipeline (18.10.2026)

Der Kartenrenderer lädt den verpflichtenden Kenney-Atlas und das optionale vorgerenderte GLB-Haus **unabhängig**. Fehlt nur das Haus, bleibt die Retro-Karte aktiv und nutzt Kenney-Bauteile. Fehlt der Atlas, bleibt die geometrische Karte sichtbar. Diagnosedaten auf dem Canvas: `data-retro-loaded`, `data-retro-house`, `data-retro-visible`. Dieser Schritt ist eine technische Zuverlässigkeitsverbesserung und **keine** Freigabe der drei erweiterten Retro-Pakete.

## Epochengrafik – Asset-Routing

Das Kartenmodul kann jetzt drei **optionale** 128×16 PNG-Thumbnailstreifen unter `public/assets/kenney/retro-{fantasy,urban,textures}-atlas.png` laden. Die acht Felder pro Streifen sind je 16×16 px. Die Fantasy-Grafiken werden für frühere Epochen, Urban für Industrialisierung und Moderne gewählt. Fehlen die Dateien, bleibt der vorherige Kenney-Atlas als visueller Fallback aktiv. **Wichtig:** Die drei neuen Binärdateien wurden noch nicht in GitHub eingecheckt; das Routing allein ist keine vollständige Asset-Integration.

## Vollständiger Abschlussplan

Die verbindliche, überprüfbare Aufgabenmatrix für **Darstellung der Nachbarn, Strategiekarten-Open-World, 16 Bezirke, vollständige Kenney-Grafikproduktion, Mobile und Veröffentlichung** steht in [TODO.md](../../TODO.md) unter **G0–G4**. Die Open World ist ausdrücklich ein künftig zu bauendes Regions-/Weltmodell, keine bereits existierende frei begehbare Spielwelt. Die bisherige `drawNeighbors()`-Ansicht umfasst maximal sechs schematische Ellipsen ohne vollständig modellierte regionale Interaktion. PR #80 brachte nur kompakte 16px-Vorschaustreifen; die eigentliche Komplettproduktion und echte iOS-Abnahme sind ausstehend.

## Ich-Perspektive – lokale erste Ausbaustufe (Paket 4)

Die optionale Ich-Perspektive ist eine **dritte Kameraperspektive derselben Welt** und keine zweite strategische Kartenart. Der Einstieg erfolgt ausschließlich über den 👁-Button in den Kartensteuerungen (`data-fp-control`); beim Hineinzoomen wechselt nichts automatisch. Kartenposition und Zoom bleiben beim Verlassen unangetastet.

**Technische Wahl:** Der lokale Blick nutzt bewusst **rohes WebGL** (`FirstPersonView`) statt des PixiJS-8-Szenengraphen der Karte. Begründung: PixiJS ist als 2D-Renderer ohne echte Perspektivprojektion; eine Augenhöhen-Kamera mit konsistenten Metern erfordert eine Projektionsmatrix, die der Strategierenderer nicht bereitstellt. Der zusätzliche Renderer ist streng auf den lokalen Bereich am Behausungsanker (`DWELLING_ANCHOR` aus `FirstPersonLogic.ts`) begrenzt, teilt **keine** Simulation mit dem Spiel (reine Darstellung) und wird erst beim ersten Öffnen dynamisch importiert (LAZY-Init), damit ein fehlender WebGL-Kontext die Strategiekarte nie blockiert.

**Was gezeigt wird:** Ein 24 × 24 m Hof mit einer 6 × 8 m Behausung (Wände 2,6 m, Augenhöhe 1,6 m, FOV 70°) samt Türöffnung, Tisch, Bank, Bett und Herd. Alle Größen stammen aus `FirstPersonLogic.ts` und nutzen dieselben Meter-Einheiten wie der Zoomweg des Pakets 3. Umschauen per Ziehen oder optionaler Zeigersperre (Escape beendet die Sperre immer), kurzes Gehen mit WASD; Kollisionen verhindern Wanddurchquerung und das Verlassen des Hofs. Die Rückkehr erfolgt über „Zurück zur Karte", Escape oder Klick außerhalb des Canvas.

**Beenden und Robustheit (geprüft):**
- **Escape-Priorität:** Die Sperre (Pointer Lock) wird zuerst gelöst, ein zweiter Escape verlässt die Ansicht; ein nativer, offener Dialog (z. B. Einstellungen) behält Escape für sich, und die Ansicht beendet sich nicht durch dahinterliegende Tastendrücke.
- **`requestExit`-Muster:** Der Exit-Button ruft `requestExit()` statt `exit()` direkt; die Ansicht bestätigt die Absicht über das echte „pointerlockchange"/Verlassen-Handling und hält den Host (`#first-person`) bis zum Abschluss sichtbar. Das verhindert den früheren Fehler, dass ein abgebrochener Kamera-Wechsel die Ansicht unsichtbar, aber aktiv ließ.
- **Zeigersperre-Fehlertoleranz:** `tryRequestPointerLock()` fängt Browser-Ablehnung (z. B. ohne Nutzer-Geste oder in automatisierten Browsern) per try/catch und Promise-`.catch()` ab; es erscheint dann kein Konsolenfehler, die Ansicht bleibt über das Ziehen bedienbar. Der Sperr-Button spiegelt den Zustand als `aria-pressed`.
- **Reduced Motion:** Bei „Bewegung reduzieren" ist Wenden auf 25 % und Gehen auf 30 % der Geschwindigkeit gedrosselt; die Einstellung wirkt sofort auf die laufende Ansicht, wird in den Anzeigeeinstellungen gespeichert und beim OS-Präferenz `prefers-reduced-motion` erzwungen. Kein vollständiges Einfrieren der Ansicht.
- **Rückkehr:** Kartenposition und Zoom bleiben beim Verlassen unangetastet; der Spielort ändert sich durch Umschauen nicht.

**Ehrliche Grenzen dieser Stufe:** Es existiert **keine 3D-Asset-Pipeline** für Innenräume; die Szene besteht aus einfarbigen Farbflächen (keine Texturen), das Dach ist flach und die Einrichtung eine **gestalterische Annäherung ohne historischen Beleg** — sie ist im HUD ausdrücklich als modellierte Spielwelt gekennzeichnet (`FIRST_PERSON_NOTE`). Bebaute Umgebung, Nachbardörfer und Landschaft sind hier nicht sichtbar. Solange die Sicht aktiv ist, liegt das Overlay über den vier kompakten Kartensteuerungen; diese sind dadurch nicht bedienbar, der Rückweg ist der dedizierte Exit-Button beziehungsweise Escape. Die Ansicht ist bei „Bewegung reduzieren" gedrosselt statt vollständig statisch. Die vier Kartensteuerungen besitzen `aria-label`s, der 👁-Button zusätzlich `data-fp-control`; ein `aria-pressed`-Zustand für die Steuerungsbuttons ist noch offen. Zeigersperre mit echter Sperre ist nur mit realer Nutzer-Geste im echten Browser verifizierbar (automatisierte Browser lehnen sie ab; dort bleibt Ziehen funktional).
