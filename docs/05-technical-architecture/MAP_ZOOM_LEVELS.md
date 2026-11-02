> Ergänzung 01.11.2026: [Begehbarer Ortskern und Asset-Integration](WALKABLE_VILLAGE.md). Frühere Abnahmewerte weiter unten dokumentieren den damaligen Stand.

# Karten-Zoom: Ein durchgehender Zoomweg mit korrekten Größen

**Stand:** 01.11.2026 · **Status:** Vektor-/Kameragrundlage und lokale Three.js-Perspektive browsergeprüft.
Geografische Kontrollpunkte und vollständige regionale/historische Inhalte bleiben offen (siehe [RENDERER.md](RENDERER.md)).

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
| Geografische Verankerung | näherungsweise 8,5459°O / 53,0336°N | `HOME_LON` / `HOME_LAT`; keine unabhängig verifizierte EPSG-Transformation |
| Kameragrenzen | tatsächlich 3 m bis 4.000 km sichtbare Breite | `clampZoomForViewport(zoom, cssWidth, fitFactor)`; alte rohe Konstanten nur zur Kompatibilität |

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
| Behausung | ≤ 15 m | Metrische Wände und Möbel; ob das ganze Haus passt, hängt auch von der sichtbaren Höhe ab |
| Siedlung | ≤ 1,5 km | Metrische Spielbauten an realen Ortsbezügen, heutige Wege; Startbreite 520 m bzw. mobil 260 m |
| Umgebung | ≤ 120 km | Lokale Referenz und schematische Nachbarn; zusammenhängende regionale Spielgeometrie fehlt |
| Region | ≤ 500 km | Generalisierte Natural-Earth-Vektoren ab ca. 176 km Breite, keine vermessenen regionalen Bauplätze |
| Herrschaftsraum | ≤ 2.000 km | Regionspunkte, keine Grenzpolygone |
| Europa | > 2.000 km | Europa-Übersicht (`europeLayer`, Natural Earth 50m) |

Die Stufenbezeichnung verwendet `MapScale.stageForVisibleWidth()` mit der echten Canvasbreite und dem effektiven Metermaßstab.
Interne Layerübergänge verwenden dieselbe Weltbreite und Hysterese gegen Flackern. So verschieben sich die Übergänge nicht
durch einen anderen Viewport oder eine abweichende Geräte-Pixeldichte. Alle Stufen teilen sich einen Kamerazustand
`{ zoom, x, y, metresPerCssPixel? }` (`MapCameraState`) — es gibt keinen stufenabhängigen Offset.
Resize erhält Mittelpunkt und Meter/CSS-Pixel; der rohe Zoom wird dem neuen Fit-Faktor angepasst.
Neue Spielstände erhalten diesen Maßstab auch auf anderen Viewports. Alte Zoom-only-Zustände bleiben lesbar;
die noch älteren Bildschirmversätze sind mangels ursprünglicher Viewportdaten nicht geografisch korrekt rekonstruierbar.

---

## 3. Bedienung

| Element | Verhalten |
| --- | --- |
| Buttons `data-map-control` (`center`, `north`, `in`, `out`) | Zentrieren, Ausrichten, Plus, Minus — oben rechts über der Karte |
| Scrollrad über der Canvas | Zoom zum Zeiger |
| Ziehen mit Maus/Zeiger | Verschiebt die Karte |
| `<input type="range" id="zoom-slider">` | **Legacy:** Kein Markup mehr erzeugt diesen Slider. `levelForSlider`/`zoomToSlider` bleiben als reine Utility-Funktionen für Tests bestehen. |

Der frühere logarithmische Slider (`0.4 * (4.0/0.4)^(slider/100)`) ist **kein** Bedienelement mehr; sein Bereich (0,4–4,0)
deckte den benötigten Weltmaßstabsbereich nicht ab. `KingdomMap.setZoomSlider` ist eine leere Kompatibilitätsmethode.

---

## 4. Größenkorrektheit und bewusste Vereinfachungen

**Ehrliche Grenzen (bewusst so, nicht als Mangel versteckt):**

| Vereinfachung | Konsequenz | Warum akzeptabel |
| --- | --- | --- |
| **Skalenkette mit einem Meter-Faktor** | Beide lokalen Achsen haben exakt denselben Faktor: 20.000/960 = 14.000/672. | Keine unterschiedliche Raster-/Vektor-Auflösung vermischt. |
| **Europa-Verankerung am Bezugsbreitengrad** | Lineare Lon/Lat-Darstellung, um 53,0336°N angenähert; keine europaweit unverzerrte UTM-Abbildung. | Näherung ausdrücklich in `europe-vectors.json` und im bildschirmfesten Kartenhinweis markiert; unabhängige Kontrollpunkte noch offen. |
| **Scale-Bar-Schrittauswahl** | `scaleBarForMetresPerPixel()` wählt den größten passenden 1-2-5-Schritt, dessen Bildschirmbreite 120 CSS-Pixel nicht überschreitet. | Label und gezeichnete Länge folgen derselben CSS-Skalierung. |
| **Detail-Fade statt Stufenlogik** | Die Stufenlabels beruhen auf sichtbaren Weltbreiten; interne Layer-Schwellen und Hysterese stehen zentral in `MapScale.MAP_LAYER_WIDTHS`. | Übergänge sind gestaffelt, nicht hart und viewportunabhängig in realen Metern ausgedrückt. |
| **Modellierter Nahbereich** | Kartenansicht und Ich-Perspektive teilen dieselbe metrische Haus-, Tür-, Möbel- und Offsetdefinition. Eintritt in die Ich-Perspektive verändert den Kartenkamerazustand nicht. | Grundrisse und Ausstattung sind weiterhin Spielmodelle, keine Vermessung oder archäologische Befunde. |
| **Symbolische Infrastruktur** | Bei breitem Ausschnitt Bezirks-/Infrastruktursymbole; unter 2 km ausgeblendet. Das Haus und seine Wände/Möbel verwenden feste Metergrundflächen. | Symbole sind keine geografischen Baugrundstücke. |
| **Heutige Gemeindegrenze** | Die OSM-Grenze (ODbL) ist eine **heutige** Verwaltungsgrenze mit Quellenangabe auf der Karte — keine historische Reichs- oder Herrschaftsgrenze. | Quellen- und Lizenzvermerk sichtbar (`LocalMap.ts`, `ganderkesee-boundary.json`). |
| **ResizeObserver ohne geografisches Refit** | Canvasmaß ändern, bisherigen effektiven Maßstab beibehalten, relativen Zoom neu berechnen. | Der Ausschnitt ändert sich, nicht die Objektgröße in CSS-Pixeln. |

**Was NICHT behauptet wird:**

- Regionenpositionen sind **Ortsreferenzen** (Prozent der Kartenfläche, `xPercent`/`yPercent`), **keine Geokoordinaten** und
  **keine Gebietsgrenzen**. Die Regionsansicht zeichnet nur Punkte, Namen und eine Legende mit dem Hinweis „Regionen schematisch,
  Grenzverläufe nicht belegt". Es gibt **keine** Polygone, Linien oder Flächeneinfärbung. Tests prüfen, dass die gelieferten
  Daten keine Felder wie `polygon`, `path`, `boundary` oder `geometry` enthalten.
- Moderne Natural-Earth-Vektoren werden **nicht** als Beleg historischer Bebauung ausgegeben.
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

**Browserabnahme:** `scripts/map-renderer-smoke.mjs` exportiert `runMapRendererSmoke(page, outputDir, url)`
für einen vorhandenen Playwright-Browser. Das Ausgabeverzeichnis muss existieren. Der geprüfte Lauf nutzt einen
frischen Kontext ohne Service Worker, echte Wheel-/Drag-/Tastaturereignisse, Desktop-Seitenblatt, mobiles Dialogverhalten,
Three.js-Maus-Look/WASD sowie Escape/Exit mit Fokus-Rückgabe. Kein zusätzlicher Server pro Test.

**Abschließende Validierung:** `npm run check` bestanden; `npx vitest run`:
50 Testdateien, 446 bestanden, 7 übersprungen; `npm run build` bestanden
(Chunk-Warnung, darunter der lazy geladene Three.js-Chunk mit ca. 134 KB gzip);
`git diff --check` bestanden. `runMapRendererSmoke(...)` mit nativer Chromium-Pinch-Prüfung bestanden,
keine JavaScript-Seitenfehler. Kein Deployment.

### Messtabelle (Chromium, derselbe Canvas und Hausanker)

| Ausschnitt | Canvas CSS-px | m/CSS-px | sichtbare Welt (m) | 8-m-Referenz (CSS-px) |
| --- | --- | --- | --- | --- |
| Europa | 1276 × 601 | 3070,73 | 3.918.256 × 1.845.511 | 0,002605 |
| Region | 1276 × 601 | 356,533 | 454.936 × 214.276 | 0,022438 |
| Siedlung | 1276 × 601 | 16,7191 | 21.333,58 × 10.048,18 | 0,478495 |
| Ganzes Haus (Dach sichtbar) | 1276 × 601 | 0,0166308 | 21,22093 × 9,995124 | 481,035 |
| Behausung (Innenraum) | 1276 × 601 | 0,0105692 | 13,48628 × 6,352082 | 756,916 |
| Schreibtisch | 1276 × 601 | 0,0023511 | 3 × 1,413009 | 3402,663 |

Die 8-m-Referenz ist eine **rechnerische Länge**, kein künstlich eingeblendetes Gebäude in der Europastufe.
Zum Tisch wurde ausdrücklich um 2,6 m nach Süden gezogen, nicht beim Zoomen gesprungen.
Beim Schreibtisch beträgt der 0,2-m-Maßstabsbalken 85,0667 CSS-Pixel.
Resize auf 1436 × 701 CSS-Pixel erhält 0,0023511 m/CSS-Pixel und den Mittelpunkt; sichtbar sind dann
3,376176 × 1,648119 m. DPR 1 und 2 liefern bei identischem CSS-Canvas denselben Maßstab
29,4647809207 m/CSS-Pixel, aber 1276 × 601 bzw. 2552 × 1202 Backing-Pixel.

Mausanker und nativer Chromium-Pinch wurden zusätzlich geometrisch geprüft: Restabweichung unter 1 mm
bei auf vier Dezimalen ausgegebenem Basispixel-Mittelpunkt. Das ist keine reale iPad-/iPhone-Abnahme.
Screenshots und Messdaten werden beim Arbeitslauf separat aufbewahrt; eine Vorher-Browseraufnahme des alten
Rasterstands wurde nicht erstellt. Vorher/Nachher ist daher für die Architektur durch den Quelldiff belegt,
nicht durch eine behauptete visuelle Altstandsabnahme.

1. **Geräteabnahme:** Zoomverhalten nur Chromium/Windows geprüft, nicht iPad/iPhone.
2. **Barrierefreiheit:** Steuerbuttons sind tastaturbedienbar; Stufenwechsel werden nicht per `aria-live` angekündigt.
3. **Ich-Perspektive:** Dritte Kameraperspektive derselben Welt — Umfang und Grenzen siehe [RENDERER.md](RENDERER.md).
4. **Politische Grenzen:** Europa zeigt keine historischen Reichsgrenzen; die OSM-Gemeindegrenze ist eine heutige Referenz.
