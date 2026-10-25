# Karten-Zoom: Ein durchgehender Zoomweg mit korrekten Größen

**Stand:** 29.01.2026 · **Status:** Kontinuierlicher Zoom Schreibtisch → Europa implementiert · Ich-Perspektive als separate, optionale
Nahansicht geplant (siehe [RENDERER.md](RENDERER.md))

Ein **durchgehender Zoomweg** statt unabhängiger Ansichten: Alle Stufen — Schreibtisch, Behausung, Siedlung, Umgebung, Region,
Herrschaftsraum und Europa — sind **dieselbe Ansicht in verschiedenen Zoomstufen**, nicht getrennte Karten. Damit Gebäude,
Abstände und Beschriftungen zusammenpassen, rechnet alles über dieselbe Kette:

```
Weltmeter  →  Basispixel (Siedlungsmaßstab)  →  Bildschirmpixel (Kamera-Zoom)
```

Die Simulation bleibt unberührt: Die Karte **liest** nur.

---

## 1. Maßstabskette

| Größe | Wert | Quelle |
| --- | --- | --- |
| Siedlungsbasis | 960 × 672 px | `MapScale.BASE_WIDTH` / `BASE_HEIGHT` |
| Entsprechung | 20 × 14 km (EPSG:25832, UTM 32N) | Kartendaten Ganderkesee |
| Meter je Basispixel | 20.000 / 960 ≈ 20,83 m | `METRES_PER_BASE_PIXEL` — **einzige** Geometrieumrechnung |
| Kamerazoom | 0,02 – 6 (kontinuierlich) | `MapScale.ZOOM_MIN` / `ZOOM_MAX`, `clampZoom` |

`zoom = 1` zeigt die Siedlung in natürlicher Größe; kleinere Werte zoomen nach Europa heraus, größere zum Schreibtisch hinein.
`pixelsPerMetre(zoom)`, `metresToBase()` und `baseToMetres()` sind die einzige Umrechnung zwischen Weltmetern und Basispixeln.

---

## 2. Die sieben Detailstufen

| Stufe | ab Zoom | Sichtbar |
| --- | --- | --- |
| Schreibtisch | ≥ 4 | Epochenabhängiger virtueller Schreibtisch (Einstieg bei Zoom 0) |
| Behausung | ≥ 2 | Eigene Behausung als Ganzes; Symbolgrößen, keine Grundrisse |
| Siedlung | ≥ 1 | Die 16 Bezirke (`SettlementSceneModel`) |
| Umgebung | ≥ 0,55 | Nachbarorte, Verbundlandschaft |
| Region | ≥ 0,25 | Relief, Flüsse, belegte Regionsnamen |
| Herrschaftsraum | ≥ 0,03 | Regionspunkte, keine Grenzpolygone |
| Europa | < 0,03 | Ganze Karte |

Namensgebung zentral in `MapScale.stageForZoom(zoom)`. Es gibt **keine Hysterese** wie im früheren 3-Ebenen-Slider-System:
die Stufen sind reine Beschriftung über einem kontinuierlichen Zoom, ein Flackern ist ausgeschlossen, weil nichts umgeschaltet
wird. Alle Zoomstufen teilen sich einen Kamerazustand `{ zoom, x, y }` (`KingdomMap.CameraState`) — es gibt keinen
stufenabhängigen Offset.

---

## 3. Bedienung

| Element | Verhalten |
| --- | --- |
| Buttons `data-map-control` (`center`, `north`, `in`, `out`) | Zentrieren, Ausrichten, Plus, Minus — oben rechts über der Karte |
| Scrollrad über der Canvas | Zoom zum Zeiger |
| Ziehen mit Maus/Zeiger | Verschiebt die Karte |
| `<input type="range" id="zoom-slider">` | **Legacy:** Kein Markup mehr erzeugt diesen Slider. `levelForSlider`/`zoomToSlider` bleiben als reine Utility-Funktionen für Tests bestehen. |

Der frühere logarithmische Slider (`0.4 * (4.0/0.4)^(slider/100)`) ist **kein** Bedienelement mehr; sein Bereich (0,4–4,0)
deckte den heutigen Bereich (0,02–6) nicht ab. `KingdomMap.setZoomSlider` ist eine leere Kompatibilitätsmethode.

---

## 4. Größenkorrektheit und bewusste Vereinfachungen

**Ehrliche Grenzen (bewusst so, nicht als Mangel versteckt):**

| Vereinfachung | Konsequenz | Warum akzeptabel |
| --- | --- | --- |
| **Skalenkette mit einem Meter-Faktor** | X- und Y-Achse nutzen denselben Faktor (20,83 m/px). `METRES_PER_BASE_PIXEL_Y` existiert als Dokumentation, wird aber **nicht** separat gerechnet. | Abweichung < 0,1 %, messbar irrelevant. |
| **Scale-Bar-Schrittauswahl** | `scaleBar()` wählt aus 1-2-5-Schritten (1 m … 1.000 km) die kleinste ≥ Zielgröße. Kein stufenabhängiges Raster. | Für einen Maßstab genug; exakte Teilung wäre Kosmetik. |
| **Detail-Fade statt Stufenlogik** | Sichtbarkeit der Layer hängt **direkt** am Zoom: Gebäude ≥ 0,35, Nachbarn < 0,9, Region/Relief < 0,16. Kein Umschalten, kein Flackern. | Übergänge sind gestaffelt, nicht hart. |
| **Symbolische Gebäude-Footprints** | Gebäude ≥ Zoom 0,35 als Sprites fester Symbolgröße — **keine** vermessenen Grundrisse. Symbole dürfen bildschirmgroß bleiben; Grundflächen nicht. | Der Siedlungsplan ist ein Spielmodell, keine Vermessung. |
| **`stageForZoom`-Namenslücke** | Die Stufen sind reine Beschriftung. Es gibt keine Validierung, dass „Behausung" bei Zoom ≥ 2 wirklich ein Haus zeigt — die Symbolgröße ist willkürlich gewählt. | Beschriftung ist konsistent, Inhalt ist Spielmodell. |
| **ResizeObserver-Refit** | `KingdomMap` registriert einen `ResizeObserver`, der bei Containergrößenänderung Canvas-Auflösung (bis `devicePixelRatio`, max. 2) und Kamera anpasst. Fokus/Zoom bleiben erhalten. | Verhindert Verzerrung; exaktes Wiedereinpassen ist nicht möglich, wenn das Fenster kleiner wird. |
| **`longitudeStretch` ohne Anwendung** | Die Mercator-Streckung ist exportiert, aber für Europa **nicht** in die Zeichenroutine integriert. | Europa ist Schematik mit Maßstab, keine Kartografie. |

**Was NICHT behauptet wird:**

- Regionenpositionen sind **Ortsreferenzen** (Prozent der Kartenfläche, `xPercent`/`yPercent`), **keine Geokoordinaten** und
  **keine Gebietsgrenzen**. Die Regionsansicht zeichnet nur Punkte, Namen und eine Legende mit dem Hinweis „Regionen schematisch,
  Grenzverläufe nicht belegt". Es gibt **keine** Polygone, Linien oder Flächeneinfärbung. Tests prüfen, dass die gelieferten
  Daten keine Felder wie `polygon`, `path`, `boundary` oder `geometry` enthalten.
- Moderne Geodaten (Natural Earth Relief) werden **nicht** als Beleg historischer Bebauung ausgegeben; sie sind Hintergrundtextur.
- Fehlende Nahbereichsdetails sind **modellierte Spielwelt**, nicht belegte Historie. Kennzeichnung über `LOCAL_MAP_NOTE`
  (`StartLocations.ts`).

---

## 5. `null`-Fälle und fehlende Daten

| Fall | Verhalten |
| --- | --- |
| Heimatkarte nicht ladbar | `drawRegionLayer()` + `fit()` als Fallback; Warnung in der Konsole |
| Region ohne hinterlegte Position | Wird **nicht geraten** und entfällt |
| Epoche ohne verifizierte Region | Definierter Hinweistext statt Ausnahme; Karte bleibt bedienbar |
| `nicht_verifiziert`-Regionen | Werden immer ausgefiltert, erscheinen nie auf der Karte |
| Kartendaten fehlen in der Regionsansicht | Expliziter Hinweis „Kartendaten fehlen" statt erfundener Geografie |

---

## 6. Dateien

| Datei | Rolle |
| --- | --- |
| `src/ui/MapScale.ts` | **Reine Logik** — Skalenkette, Stufenbenennung, Klemmung, Maßstab, Distanzformatierung. Kein PixiJS, kein DOM → testbar |
| `src/ui/MapScale.test.ts` | 36 Tests (Skalenkette, Stufen, Klemmung, Scale-Bar, Mercator-Faktor) |
| `src/ui/KingdomMap.ts` | PixiJS-Renderer — Kamera, Layer-Sichtbarkeiten, Detail-Fade, ResizeObserver |
| `src/ui/KingdomGameUI.ts` | Integration — Karten-Init, Kamera-Sync (`syncMapCamera`), Stufen-Label (`updateMapStage`), Steuerbuttons |
| `styles/kingdom.css` | `.map-card` füllt den zentralen Bereich (`position:absolute; inset:0`), `.map-hud`, `.map-tools` |

**Architektur:** Die Skalen- und Stufenlogik liegt bewusst **außerhalb** von `KingdomMap`. Der PixiJS-Renderer ist in Unit-Tests
nicht instanziierbar; die Logik wäre dort ungetestet geblieben.

---

## 7. Tests und offene Punkte

**Automatisiert:** `npm run check` ✅ · `npx vitest run src/ui/MapScale.test.ts` ✅ 10 Tests · `npm run build` ✅

1. **`longitudeStretch` ist exportiert, aber ungenutzt.** Entweder in die Europa-Zeichnung integrieren oder entfernen.
2. **Geräteabnahme:** Zoomverhalten nur Chromium/Windows geprüft, nicht iPad/iPhone.
3. **Barrierefreiheit:** Steuerbuttons sind tastaturbedienbar; Stufenwechsel werden nicht per `aria-live` angekündigt.
4. **Ich-Perspektive:** Separate Nahansicht am DWELLING_ANCHOR — Umfang und Grenzen siehe [RENDERER.md](RENDERER.md).
