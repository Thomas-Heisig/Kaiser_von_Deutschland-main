> **Aktualisierung 18.10.2026:** Variante A ist durch Nutzerentscheidung abgelöst: **Kenney Retro Fantasy** und **Retro Textures Fantasy** für die mittelalterliche Szene, **Retro Urban** für spätere Epochen. Der isolierte Prototyp ist unter `/workshop-prototype.html` mit einem kompakten PNG-Atlas aus originalen Kenney-Preview-PNGs bestückt, **noch nicht** mit eigenen GLB-Renderings. Die darunterstehenden Sketch-Town-Bezüge dokumentieren den früheren Plan und sind nicht mehr maßgeblich. Vor einer Integration in die Hauptkarte sind Browser-/Gerätetests und bessere Modellkomposition nötig. 16 feste Bezirke und Engine bleiben unverändert.

# RENDERER – Variante A / Phase 2 (Planung)

**Stand: 18.10.2026 · Status: geplant, kein implementierter Prototyp.** Dieses Dokument hält die durch den Nutzer freigegebene Richtung fest. **Keine Änderungen an der GameEngine, Simulationsregeln oder dem vorhandenen UI-Flow.** Phase 3 (Code/Assets) beginnt erst nach Assetprüfung.

## Verifizierte technische Grundlage

- GitHub `main` zum Beginn der Planung: `7bfad744f1a7680b58b35d6ac0cce5313fc3039a`.
- `package-lock.json`: PixiJS **8.14.3**, TypeScript **5.9.3**, Vite **7.3.0**, Vitest **4.0.16**; `tsconfig.json` mit `strict: true`.
- `src/main.ts → src/ui/KingdomGameUI.ts → src/ui/KingdomMap.ts`, Daten aus `src/core/GameEngine.ts`. `UIFlowManager` und `EnhancedPixiRenderer` sind historische alternative Oberflächen, nicht der produktive UI-Flow.
- `KingdomMap`: `world`, `atmosphere`, `neighbors`, `settlements`, `animation`. Landschaft wird noch geometrisch gezeichnet.
- `SettlementSceneModel.ts`: 16 **feste** Bezirke mit `type`, `name`, `category`, `x`, `y` und `color`.
- `KingdomMap` wird bereits dynamisch geladen; Kamera besitzt Pan, Zoom und Zentrieren. Keine Änderung am vorhandenen `data-projection`-Schalter innerhalb des isolierten Prototyps.
- CI: `npm ci`, `npm run check`, `npm run build`, `npx vitest run`; Browser Smoke mit `node scripts/browser-smoke.mjs`. `npm run build` erzeugt auch Offline-ZIP.
- Referenz-Build auf `main` aus GitHub CI 18.10.2026: `KingdomMap` 12,45 KB / 4,80 KB gzip; `graphics` 505,57 KB / 144,87 KB gzip; `index` 640,97 KB / 182,88 KB gzip; `vendor` 30,42 KB / 9,96 KB gzip. **Nicht** die gesamte Downloadgröße einschließlich Medien.

## Freigegebene Auswahl und harte Grenzen

1. **Variante A:** Kenney **Sketch Town** als konsistente visuelle Referenz; der konkret zu verwendende Archivinhalt und die tatsächlich enthaltenen einzelnen Assets sind vor dem Einchecken zu prüfen.
2. **Keine freie Bebauung:** Es bleiben 16 feste Bezirkspositionen. Keine neue Tilemap als Pflicht, keine Änderungen am Savegame und keine neuen Platzierungsregeln.
3. **Referenzjahr 1200:** Antike/Industrie erhalten erst später eigene Asset-Sets; die Kartenlogik wird nicht epochenabhängig umgebaut.
4. **Geräte:** Nutzer kann auf **iPad und iPhone** testen; Modelle und Safari-/iOS-Versionen sind noch nicht bekannt. Deshalb sind Ergebnisse ausdrücklich **ungeprüft**.
5. **Keine neuen npm-Abhängigkeiten in Phase 2**, kein `Tiled`-Format, keine Shader-/Lighting-Bibliothek als Voraussetzung.
6. Bestehende DOM-basierte Navigation, Startscreen und Einstellungen bleiben unverändert. Die rollenabhängigen Legacy-Ansichten werden nicht entfernt.

## Vorgeschlagene isolierte Szene – genau eine Werkstatt

| Merkmal | Konkrete Vorgabe |
|---|---|
| Name | `Werkstatt um 1200` |
| Raster (nur visuell) | 12 × 12 = 144 isometrisch gezeichnete Kacheln |
| Kachelmaß | 64 × 32 logische Pixel |
| Gebäude | 1 historisch plausibles Werkstatt-/Dorfhaussprite |
| Licht | 1 statische transparente Lichtmaske (kein dynamisches Lighting-Paket) |
| Partikel | 24 sichtbare Rauchpartikel, gebündelt und deterministisch bewegt |
| Personen/Nachbarn | 0 |
| Kamera | Fest zentriert, kein Pan/Zoom im Basistest |
| Jahreszeit | Sommer |
| Renderer | Vorhandenes PixiJS 8, vorhandene `Sprite`/`Container`/Texturen; kein `any` |
| Simulationsdaten | Im Prototyp **feststehende Testdaten**; keine GameEngine-Instanz erforderlich |
| Laufzeit | Auf 30 FPS begrenzen, analog zum aktuellen `KingdomMap` |

### Nur bei Phase 3 benötigte (vorgeschlagene) Dateien

- `src/ui/map-prototype/WorkshopScene.ts`: isolierte Szene, Lebenszyklus und PixiJS-Aufbau.
- `src/ui/map-prototype/WorkshopSceneModel.ts`: unveränderliche Testdaten, Größen und Positionen.
- `src/ui/map-prototype/WorkshopSceneModel.test.ts`: Raster, Sprite-Metadaten und Grenzen deterministisch prüfen.
- `public/assets/kenney/sketch-town/`: **nur benötigte** Dateien und das zugehörige Lizenz-/Quellenmaterial; nicht das komplette Archiv ungeprüft importieren.
- `docs/05-technical-architecture/ASSETS.md`: Inventar mit Ursprungslinks, Lizenz, Dateihashes und Freigabestatus.

Diese Dateien wurden in Phase 2 **nicht** erstellt (mit Ausnahme des vorliegenden Planungsdokuments und `ASSETS.md` als Manifest-Vorlage).

### Schnittstellenentwurf (noch keine Implementierung)

- `SzenenBezirk`: `type: keyof KingdomInfrastructure`, `x: number`, `y: number`, `gebäudeAnzahl: number`, `ausgewählt: boolean`.
- `SzenenKontext`: `jahr: number`, `jahreszeit: Season`, `modernisierungen: readonly string[]`, `bezirke: readonly SzenenBezirk[]`.
- `GrafikAsset`: `id: string`, `url: string`, `breite: number`, `höhe: number`, `ankerX: number`, `ankerY: number`, `quelle: string`.
- Späterer **reiner Datenadapter außerhalb der Engine**: `KingdomInfrastructure` + `SETTLEMENT_DISTRICTS` + Jahr/Jahreszeit → unveränderliche `SzenenKontext`-Ansicht.
- Visualisierte `TileData` ist **kein neues persistiertes Savegame-Schema**.

## Geplanter Renderingablauf

`Asset-URL prüfen → Textur laden → Grundkacheln → vorgerendeter Schatten → Gebäudesprite → eine Lichtmaske → 24 Rauchpartikel → Renderer freigeben`.

Die vorhandenen PixiJS-8-Klassen `Application`, `Container`, `Sprite` und `Assets` genügen als konzeptionelle Basis. Konkrete Asset-Dateinamen und Texturabmessungen werden erst nach Sichtung des Originalpakets verbindlich eingetragen. Es werden keine Tiled-/Normalmap-/Lighting-Integrationen unterstellt.

## Messplan: vom Nutzer auf tatsächlichen iOS-Geräten auszuführen

- **Vorab erfassen:** iPad-Modell, iPhone-Modell, iPadOS/iOS-Version, Safari-Version soweit bestimmbar, verfügbare Bildschirmgröße.
- Auf jedem Gerät: Safari, Energiesparmodus aus, Spiel neu geladen, 30 s Warmlauf, drei Messungen zu je 120 s, danach 10 Minuten Dauertest. Desktop-Chrome als zusätzlicher Referenztest.
- Aufzeichnen: mittlere und P95-Frame-Abstände, Anteil Frames >50 ms, WebGL-Kontextverluste, Ladezeit, sichtbare Grafikfehler, ggf. über Safari Web Inspector ermittelten Speicherverbrauch.
- **Vorläufiges Abbruchkriterium auf derselben 144-Kachel-Szene:** iPhone und iPad jeweils P95-Bildabstand >50 ms oder wiederholter WebGL-Kontextverlust; über 10 Minuten stabiler Speicherzuwachs >40 MB nach dem Warmlauf → Test abbrechen/Ansatz überarbeiten. Beim festen 30-FPS-Takt sind 33,3 ms Bildabstand normal.
- Wenn bereits die geometrische Referenzszene die Grenze reißt, **zuerst Baseline untersuchen**; kein unzulässiger Vergleich.
- Im CI vor/nach der späteren Umsetzung dieselben Bundle-Chunks erfassen. Vorläufiges Prototyp-Budget: <50 KB zusätzlicher gzip-JS-Code, <2 MB zusätzliche komprimierte Assets.
- **Kein Testergebnis ist zum Zeitpunkt dieses Dokuments gemessen.**

## Abnahme- und Migrationsgates

1. Asset-Lizenz **des konkreten Downloads** inklusive Archivinhalt protokolliert; Dateinamen und Hashes inventarisiert.
2. Ein isolierter Prototyp ohne Gameplay- oder Engine-Änderung vorhanden; `npm run check`, `npx vitest run`, `npm run build` erfolgreich.
3. Desktop-Chrome und Safari auf den echten iPad-/iPhone-Geräten nach Messplan dokumentiert.
4. Erst danach einen einzigen festen Bezirk in der produktiven `KingdomMap` optional auf vorgerenderte Assets umstellen; Fallback auf geometrische Darstellung erhalten.
5. Weitere Bezirke und spätere Epochen ausschließlich nach erfolgreicher Einzelintegration.

## Offene Klärungen für Phase 3

- Exakte iPad- und iPhone-Modelle und iOS-Versionen.
- Archivdateien, Pixelgrößen und grafische Eignung des konkreten Sketch-Town-Downloads vor Codeänderungen.
- Sichere HTTPS-Testadresse oder lokal/vertrauenswürdig erreichbare Testumgebung; GitHub Pages ist zum Zeitpunkt der Planung nicht erfolgreich deployt.

**Nicht umsetzen:** Neuer Karteneditor, freies Bauen, Simulationseingriffe, kompletter Rendererwechsel oder sofortige neue Grafikbibliotheken.
