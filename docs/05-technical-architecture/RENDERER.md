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
