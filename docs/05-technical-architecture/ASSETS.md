# Kenney Retro – geprüfte Pakete und erster Prototyp

**Stand: 18.10.2026.** Die Originalarchive wurden vom Nutzer bereitgestellt und lokal geöffnet.

| Paket | Version aus `License.txt` | Lizenz | Inhalt | Einsatz |
|---|---|---|---|---|
| Retro Fantasy Kit | 2.0 (19.02.2025) | CC0 | 105 GLB, 105 OBJ/FBX, 105 Previews | Mittelalter |
| Retro Textures Fantasy | 1.0 (15.01.2026) | CC0 | 119 PNGs (inkl. Sample/Preview) | spätere Oberflächen/Materialien |
| Retro Urban Kit | 2.0 (29.01.2025) | CC0 | 124 GLB, 124 OBJ/FBX, 124 Previews | Industrialisierung / Moderne |

Die Licence-Dateien der drei ZIPs nennen ausdrücklich **Creative Commons Zero** mit kommerzieller und bearbeitender Nutzung. Kein zusätzliches npm-Paket nötig.

## Erster eingebauter Atlas

`public/assets/kenney/retro-workshop-atlas.png` (256 × 128 PNG, ca. 5,6 KB), aus **acht echten Kenney Preview-PNGs** mit 64 × 64 Bildpunkten erstellt (zeilenweise vier Spalten):

| Index | ZIP | Pfad im Archiv |
|---|---|---|
| 0 | Retro Fantasy Kit | `Previews/floor-flat.png` |
| 1 | Retro Fantasy Kit | `Previews/wall-pane-wood-door.png` |
| 2 | Retro Fantasy Kit | `Previews/wall-pane-wood-window.png` |
| 3 | Retro Fantasy Kit | `Previews/roof.png` |
| 4 | Retro Fantasy Kit | `Previews/tree-large.png` |
| 5 | Retro Fantasy Kit | `Previews/detail-barrel.png` |
| 6 | Retro Fantasy Kit | `Previews/tower-top.png` |
| 7 | Retro Urban Kit | `Previews/grass.png` |

PNG-Atlas-SHA256: `d8487bf6a8b082ec6cf49e927b9dc536888d08e054a3378e1ff46c9cba58b452`.

**Wichtige Einordnung:** Die Grafiken sind Kenney-Vorschaurenderings der jeweiligen einzelnen GLB-Bauteile, **keine vollständigen Häuser oder vorgerenderten 3D-Kartenmodelle**. Das Werkstattgebäude kombiniert einfache Bauteile in einer PixiJS-Containeransicht. Der erste Prototyp belegt die Asset-Pipeline, nicht die fertige Ästhetik. Die Hauptkarte bleibt unverändert. Textures Fantasy ist inventarisiert, aber für den kleinen Prototyp bewusst noch nicht verwendet.

## Abnahmekriterien vor Produktivintegration

1. Browser-Smoke belegt, dass `data-asset-status=loaded` und der Atlas über HTTP erreichbar ist, Fallback wird eigens getestet.
2. Über das Original-GLB/OBJ-Set ein oder mehrere saubere Gebäude in identischem isometrischen Kamerawinkel **wirklich** vorgerendert.
3. Gesonderte Performance-Messungen auf iPad/iPhone Safari; keine ungeprüften FPS-/Speicherangaben.
4. Erst danach einen festen Bezirk in der produktiven Karte optional auf Retro umstellen, immer mit geometrischem Fallback.

## Reserve (nicht aktiv)

- **Kenney Sketch Town:** frühere Phase-2-Richtung, **verworfen als Primärstil**; nur als mögliche grafische Reserve. Die alte Planung ist im Git-Verlauf und in historischen Einträgen nachvollziehbar, sie ist keine aktuelle Anweisung.
- Das vorliegende `Retro Textures Fantasy`-Paket ist für das Mittelalter vorgesehen, aber noch **nicht** in der Werkstattszene verwendet.

**Freigabestatus:** CC0-Dateien für den Protoyp inventarisiert; eine echte GLB→PNG-Pipeline, vollständige Gebäude und Endgerätetests sind ausstehend.

## Erstes tatsächlich integriertes GLB-Gebäude – 18.10.2026

- `public/assets/kenney/retro-house-1200.png`: transparentes optimiertes PNG, 126 × 192 px, 2192 Bytes, SHA-256 `93eaf1b304377fb262942ae4d208eba9b4ba3fd28b96309df49f34dd4072c54b`.
- Erstellt aus dem transparenten 384×384-VTK/EGL-GLB-Render (Ursprungs-SHA-256 `e44a861683af870efabecfc083ca80e4488642a467350a63dbd7ba993ad65709`), zugeschnitten und für mobile Darstellung indiziert. Kein generiertes Fantasiegebäude, sondern aus tatsächlichen Kenney-GLB-Geometrien zusammengesetzt.
- Quell-GLBs: `roof.glb`, `wall-pane-wood.glb`, `wall-pane-wood-door.glb`, `wall-pane-wood-window.glb`, Kenney Retro Fantasy Kit CC0; Manifest und reproduzierbarer Renderer stehen im bisherigen Renderpaket bzw. `scripts/render_kenney_house.py`.
- Eingebaut **nur** in `/workshop-prototype.html`; Preview- und Geometrie-Fallback bleiben vorhanden. `KingdomMap` unverändert. Noch kein iOS-Gerätetest.
