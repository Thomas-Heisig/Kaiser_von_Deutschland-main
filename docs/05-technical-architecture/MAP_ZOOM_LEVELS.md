# Karten-Zoom-Ebenen — Architektur

**Stand:** 24.10.2026 · **Status:** Schreibtisch, Relief/Flüsse und Siedlung im Hauptspiel

Ein umschaltbares Zoom-System mit drei Ebenen und gleichwertigen Bedienelementen.
Die Simulation bleibt unberührt: Die Karte **liest** nur.

---

## 1. Ebenen

| Ebene | Inhalt | Quelle | Status |
| --- | --- | --- | --- |
| **L0 „Schreibtisch"** | Epochenabhängiger virtueller Schreibtisch, Einstieg bei Zoom 0 | `KingdomGameUI` | Implementiert |
| **L1 „Dorf"** | Die 16 bestehenden Bezirke | `SettlementSceneModel.ts` (unverändert) | Vollständig |
| **L3 „Zentraleuropa"** | Relief, sichtbare Flüsse, belegte Regionsnamen und Legende | Natural Earth, `REGIONS` + `HistoricalContext` | Implementiert; keine historischen Grenzpolygone |

**Noch offen:** separate Nahregion und reale Geräteabnahme. Die zusätzliche Nachbaransicht mit Reisen und Regionsfokus wird in [Strategiewelt](STRATEGY_WORLD.md) beschrieben.

---

## 2. Zoom-Steuerung

Drei gleichwertige Bedienwege, ein gemeinsamer Zustand:

| Element | Verhalten |
| --- | --- |
| `<input type="range" id="zoom-slider">` | 0–100, primäre Steuerung, tastaturbedienbar |
| Buttons `data-zoom="0.2"` / `"-0.2"` | Schritt von **6** Slider-Einheiten |
| Button `data-zoom="0"` | Zentriert (Offset zurück, Zoom 1) |

Zusätzlich weiterhin: **Ziehen** mit der Maus/Zeiger verschiebt die Karte.

### Slider → Kamera (logarithmisch)

```
zoom = 0.4 * (4.0 / 0.4)^(slider / 100)
```

Gleichmäßiges Zoom-Gefühl: jeder Slider-Schritt wirkt gleich stark. Die
Umkehrfunktion `zoomToSlider` hält Slider und Kamera synchron, wenn über die
Buttons oder `changeZoom` gezoomt wird. Der Kamera-Bereich wurde von
**0.8–2.2** auf **0.4–4.0** erweitert.

---

## 3. Ebenenschwellen mit Hysterese

| Wechsel | Schwelle |
| --- | --- |
| Dorf → Zentraleuropa | Slider **< 35** |
| Zentraleuropa → Dorf | Slider **≥ 40** |

Die Lücke (35–39) verhindert Flackern, wenn der Slider auf einem Grenzwert
steht. Beide Werte liegen in `LEVEL_THRESHOLDS` und sind getestet.

---

## 4. Keine erfundenen Grenzen — technisch erzwungen

Die Regionsansicht zeichnet **ausschließlich**:

- einen **Punkt** je Region (Bezugspunkt, keine Ausdehnung),
- den **Namen** darüber,
- eine **Legende** mit dem Hinweis „Regionen schematisch, Grenzverläufe nicht
  belegt".

Es gibt **keine** Polygone, keine Linien, keine Flächeneinfärbung. Tests
prüfen, dass die gelieferten Daten keine Felder wie `polygon`, `path`,
`boundary` oder `geometry` enthalten.

### Positionsangaben

Die Positionen sind **Prozent der Kartenfläche** (`xPercent`/`yPercent`),
bewusst **keine** Geokoordinaten. Die Anordnung ordnet Kulturräume grob
nach ihrer Lage zueinander (Norden oben), behauptet aber keine Kartografie.
Regionen ohne hinterlegte Position werden **nicht geraten** und entfallen.

---

## 5. Umgang mit fehlender Quelle (`null`-Fälle)

| Fall | Verhalten |
| --- | --- |
| Jahr mit `nicht_verifiziert`-Epoche (z. B. 700) | `labels: []`, `epochName: null`, Text: „Keine belegte Region für dieses Jahr – die Epoche ist nicht verifiziert." |
| Region mit `evidence: 'nicht_verifiziert'` (z. B. `germanien`) | Wird **immer** ausgefiltert, erscheint nie auf der Karte |
| Unbekannte Epochen-ID | `filterRegionsForEpoch` liefert `[]` — nichts wird behauptet |
| Epoche ohne verortbare Region | Definierter Hinweistext statt Ausnahme |

In allen Fällen bleibt die Karte bedienbar; es gibt keinen Fehlerzustand.

---

## 6. Feature-Flag

`VITE_MAP_ZOOM_LEVELS` — **standardmäßig aktiv**.

| Wert | Wirkung |
| --- | --- |
| nicht gesetzt | Ebenen aktiv |
| `false`, `0`, `off` | Slider ausgeblendet, `changeZoom` wie bisher (0.4–4.0) |

Geprüft in `isZoomLevelsEnabled()`. Damit ist der Umbau ohne Codeänderung
rückrollbar.

---

## 7. Dateien

| Datei | Rolle |
| --- | --- |
| `src/ui/MapZoomLevels.ts` | **Reine Logik** — Slider-Mapping, Schwellen, Regionsabruf. Kein PixiJS, kein DOM → testbar |
| `src/ui/MapZoomLevels.test.ts` | 22 Tests |
| `src/ui/KingdomMap.ts` | Additiver `regionLayer`, `setZoomSlider`, `setHistoricalRegions`, `applyLevel` |
| `src/ui/KingdomGameUI.ts` | Slider-Markup, `bindZoomSlider`, `applyZoomStep`, `updateZoomHint`, Jahresabruf in `refresh` |
| `styles/kingdom.css` | `.zoom-slider`, `.zoom-hint` (responsiv) |

**Architekturentscheidung:** Die Schwellen- und Mapping-Logik liegt bewusst
**außerhalb** von `KingdomMap`. Der PixiJS-Renderer ist in Unit-Tests nicht
instanziierbar; die Logik wäre dort ungetestet geblieben.

---

## 8. Tests

| Bereich | Geprüft |
| --- | --- |
| Slider-Mapping | Enden, Monotonie, Klemmen, Roundtrip, `NaN` |
| Buttons | Schrittweite, Grenzen, `NaN`-Erholung |
| Schwellen | Wechsel beide Richtungen, Hysterese-Band, Ordnung |
| Regionsabruf | gültiges Jahr, Platzhalter nie sichtbar, `null`-Fallback, Epochenfilter, keine Geometriefelder |
| Filter | unverifizierte Regionen raus, epochenunabhängige rein, fremde Epoche raus, unbekannte Epoche → `[]` |

Ergebnis: `npm run check` ✅ · `npx vitest run` ✅ **256 Tests** (7 übersprungen:
bash-abhängige CI-Deploy-Tests unter Windows) · `npm run build` ✅

---

## 9. Offene Punkte / Schritt 4

1. **Echte Relief-Textur.** Vorschlag: Natural Earth 1:50m Shaded Relief
   (Public Domain) als PNG, zugeschnitten auf Zentraleuropa, als PixiJS-Textur
   unter `regionLayer`. Braucht Lizenzprüfung, Zuschnitt und eigene
   Performancetests auf Mobilgeräten.
2. **Kameraführung in L3.** Aktuell gilt die bestehende `fit()`-Skalierung.
   Für eine echte Karte wären eigenes Pan/Zoom-Fenster und Begrenzung sinnvoll.
3. **L2 Nahregion** (`SettlementExpansion`-Adapter) — eigene Siedlungen.
4. **L0 Tisch** — atmosphärischer Einstieg.
5. **Geräteabnahme.** Slider und Ebenenwechsel sind bisher nur automatisiert
   getestet (Chromium unter Windows), **nicht** auf iPad/iPhone.
6. **Barrierefreiheit.** Slider ist tastaturbedienbar; ob der Ebenenwechsel
   für Screenreader ausreichend angekündigt wird (`aria-live` im Hinweis),
   ist **nicht** mit echten Screenreadern geprüft.
7. **Regionspositionen** sind illustrativ und nicht geografisch validiert.
