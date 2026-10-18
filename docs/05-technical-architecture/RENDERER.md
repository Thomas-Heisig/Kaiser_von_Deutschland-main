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
