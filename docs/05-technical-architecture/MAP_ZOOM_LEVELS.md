# Karten-Zoom: Ein durchgehender Zoomweg mit korrekten Größen

**Stand:** 01.11.2026 · **Status:** Kontinuierlicher Zoom Schreibtisch → Europa implementiert · Ich-Perspektive als dritte
Kameraperspektive derselben Welt (siehe [RENDERER.md](RENDERER.md))

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
| Geografische Verankerung | 8,5459°O / 53,0336°N | `MapScale.HOME_LON` / `HOME_LAT` — **einzige** Brücke Grad ↔ Basispixel |
| Kamerazoom | 0,00703 – 9.375 (kontinuierlich) | `MapScale.ZOOM_MIN` / `ZOOM_MAX`, `clampZoom` |

Der Zoom ist kontinuierlich; der tatsächlich sichtbare Maßstab ergibt sich aus der vollständigen Pixi-Transformation:

```
Meter je CSS-Pixel = METRES_PER_BASE_PIXEL / (Fit-Faktor × Zoom)
Sichtbare Weltbreite = Canvasbreite in CSS-Pixeln × Meter je CSS-Pixel
```

`DevicePixelRatio` beeinflusst nur die Renderauflösung. Detailstufen und Maßstabsleiste verwenden die effektive CSS-Skalierung und damit dieselbe sichtbare Weltbreite. `pixelsPerMetre(zoom)`, `metresToBase()` und `baseToMetres()` beschreiben weiter die Basisskalierung; für den aktuellen Bildschirmmaßstab ist `KingdomMap.getMetresPerScreenPixel()` maßgeblich.

---

## 2. Die sieben Detailstufen

| Stufe | Sichtbare Weltbreite | Sichtbar |
| --- | --- | --- |
| Schreibtisch | ≤ 3 m | Nahgeometrie: Möbel und Innenraum; Ich-Perspektive optional |
| Behausung | ≤ 15 m | Hof und Behausung als Ganzes |
| Siedlung | ≤ 40 km | Die 16 Bezirke (`SettlementSceneModel`) |
| Umgebung | ≤ 120 km | Nachbarorte, Verbundlandschaft |
| Region | ≤ 500 km | Relief, Flüsse, belegte Regionsnamen |
| Herrschaftsraum | ≤ 2.000 km | Regionspunkte, keine Grenzpolygone |
| Europa | > 2.000 km | Europa-Übersicht (`europeLayer`, Natural Earth 50m) |

Die Stufenbezeichnung verwendet `MapScale.stageForVisibleWidth()` mit der echten Canvasbreite und dem effektiven Metermaßstab.
Interne Layerübergänge verwenden dieselbe Weltbreite und Hysterese gegen Flackern. So verschieben sich die Übergänge nicht
durch einen anderen Viewport oder eine abweichende Geräte-Pixeldichte. Alle Stufen teilen sich einen Kamerazustand
`{ zoom, x, y }` (`KingdomMap.CameraState`) — es gibt keinen stufenabhängigen Offset.

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
| **Europa-Verankerung am Bezugsbreitengrad** | Die Europa-Ebene nutzt eine lineare Plate-carrée-Abbildung mit dem Lon/Lat-Verhältnis von 53,0336°N (`HOME_LON`). Der Maßstab ist nur dort exakt; die Verzerrung wächst mit der Breite. | Dokumentiert in `europe-source.json` und auf der Karte. |
| **Scale-Bar-Schrittauswahl** | `scaleBarForMetresPerPixel()` wählt den größten passenden 1-2-5-Schritt, dessen Bildschirmbreite 120 CSS-Pixel nicht überschreitet. | Label und gezeichnete Länge folgen derselben CSS-Skalierung. |
| **Detail-Fade statt Stufenlogik** | Die Stufenlabels beruhen auf sichtbaren Weltbreiten; interne Layer-Schwellen und Hysterese stehen zentral in `MapScale.MAP_LAYER_WIDTHS`. | Übergänge sind gestaffelt, nicht hart und viewportunabhängig in realen Metern ausgedrückt. |
| **Modellierter Nahbereich** | Kartenansicht und Ich-Perspektive teilen dieselbe metrische Haus-, Tür-, Möbel- und Offsetdefinition. Eintritt in die Ich-Perspektive verändert den Kartenkamerazustand nicht. | Grundrisse und Ausstattung sind weiterhin Spielmodelle, keine Vermessung oder archäologische Befunde. |
| **Symbolische Gebäude-Footprints** | Gebäude ≥ Zoom 0,35 als Sprites fester Symbolgröße — **keine** vermessenen Grundrisse. Symbole dürfen bildschirmgroß bleiben; Grundflächen nicht. | Der Siedlungsplan ist ein Spielmodell, keine Vermessung. |
| **Heutige Gemeindegrenze** | Die OSM-Grenze (ODbL) ist eine **heutige** Verwaltungsgrenze mit Quellenangabe auf der Karte — keine historische Reichs- oder Herrschaftsgrenze. | Quellen- und Lizenzvermerk sichtbar (`LocalMap.ts`, `ganderkesee-boundary.json`). |
| **ResizeObserver-Refit** | `KingdomMap` registriert einen `ResizeObserver`, der bei Containergrößenänderung Canvas-Auflösung (bis `devicePixelRatio`, max. 2) und Kamera anpasst. Fokus/Zoom bleiben erhalten. | Verhindert Verzerrung; exaktes Wiedereinpassen ist nicht möglich, wenn das Fenster kleiner wird. |

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
| `src/ui/MapScale.ts` | **Reine Logik** — Skalenkette, Stufenbenennung anhand sichtbarer Breite, LOD-Schwellen, Klemmung, Maßstabsleiste. Kein PixiJS, kein DOM → testbar |
| `src/ui/MapScale.test.ts` | 36 Tests (Skalenkette, Stufen, Klemmung, Scale-Bar, Mercator-Faktor) |
| `src/ui/KingdomMap.ts` | PixiJS-Renderer — Kamera, Layer-Sichtbarkeiten, Detail-Fade, ResizeObserver |
| `src/ui/KingdomGameUI.ts` | Integration — Karten-Init, Kamera-Sync (`syncMapCamera`), Stufen-Label (`updateMapStage`), Steuerbuttons |
| `styles/kingdom.css` | `.map-card` füllt den zentralen Bereich (`position:absolute; inset:0`), `.map-hud`, `.map-tools` |

**Architektur:** Die Skalen- und Stufenlogik liegt bewusst **außerhalb** von `KingdomMap`. Der PixiJS-Renderer ist in Unit-Tests
nicht instanziierbar; die Logik wäre dort ungetestet geblieben.

---

## 7. Tests und offene Punkte

**Automatisiert:** `npm run check` ✅ · gezielte Maßstabs-, Karten- und Ich-Perspektive-Tests ✅. Der jüngste Stand der
Gesamttests und Build-Abnahme ist im aktuellen Arbeitsprotokoll nachzutragen. Die frühere Browser-Abnahme prüfte die sieben
Stufen und Kartendaten; Nahansicht, Tabellenblick und Rückkehr nach den jüngsten Änderungen müssen erneut visuell bestätigt werden.

1. **Geräteabnahme:** Zoomverhalten nur Chromium/Windows geprüft, nicht iPad/iPhone.
2. **Barrierefreiheit:** Steuerbuttons sind tastaturbedienbar; Stufenwechsel werden nicht per `aria-live` angekündigt.
3. **Ich-Perspektive:** Dritte Kameraperspektive derselben Welt — Umfang und Grenzen siehe [RENDERER.md](RENDERER.md).
4. **Politische Grenzen:** Europa zeigt keine historischen Reichsgrenzen; die OSM-Gemeindegrenze ist eine heutige Referenz.
