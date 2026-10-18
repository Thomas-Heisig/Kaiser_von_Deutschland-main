# ASSETS – Karten-Prototyp Variante A

**Stand 18.10.2026 | Arbeitsmanifest, kein Nachweis bereits eingebauter Assets.**

## Regeln für Asset-Aufnahme

1. Originalquelle und **konkretes Paket** erfassen, nicht nur den Marktplatz.
2. Lizenzdatei/Pack-Infoseite mit Lizenzversion, Datum und Link sichern.
3. Dateien, Dateigröße, Bildabmessungen und SHA-256 nach Download prüfen.
4. Zulässigkeit von **kommerzieller Nutzung, Bearbeitung und Weitergabe im Offline-ZIP** dokumentieren.
5. Nur wirklich verwendete Dateien unter `public/assets/` übernehmen, keine unbekannt lizenzierten Assets.
6. Ohne belegte Lizenz bleibt `status = ungeprüft`; keine Verwendung im öffentlichen Spiel.

## Paketauswahl

| Quelle / konkreter Pack | Lizenz-Status | Bearbeitung/Weitergabe | Inhalt und Einsatz | Einbau |
| --- | --- | --- | --- | --- |
| [Kenney Sketch Town](https://kenney.nl/assets/sketch-town) | Herausgeber gibt CC0 an; **Archiv-/Dateiinhalt noch nicht verifiziert** | CC0 gestattet grundsätzlich beides | Bevorzugte abgestimmte Quelle für 1 Werkstatt, Bodenkacheln und Umgebung | **Noch nicht eingebaut** |
| [Kenney Isometric Tiles Landscape](https://kenney.nl/assets/isometric-tiles-landscape) | Herausgeber gibt CC0 an; Archiv ungeprüft | Grundsätzlich erlaubt | Ausweichquelle für Terrain, falls Sketch Town kein geeignetes Gelände enthält | Nicht eingebaut |
| [Kenney Light Masks](https://kenney.nl/assets/light-masks) | Herausgeber gibt CC0 an; Archiv ungeprüft | Grundsätzlich erlaubt | Einfache vorgelagerte Lichtmaske ohne Lighting-Paket | Nicht eingebaut |
| [Kenney Smoke Particles](https://kenney.nl/assets/smoke-particles) | Herausgeber gibt CC0 an; Archiv ungeprüft | Grundsätzlich erlaubt | Optional Rauchtexturen; alternativ kleine Sprites mit vorhandenem PixiJS | Nicht eingebaut |
| [Quaternius Medieval Village Pack](https://quaternius.com/packs/medievalvillage.html) | Für Variante B gesondert erneut prüfen | Noch nicht für unser Build inventarisiert | Spätere vorgerenderte 3D-Alternative | **Nicht Bestandteil von A** |

**CC0 ist eine Aussage zur Lizenz**, kein Beleg, dass eine bestimmte Datei im aktuell angebotenen Archiv existiert. Dieses Manifest ist zunächst eine Planungsquelle, keine Freigabe eines fertigen Asset-Bundles.

## Datei-Metadaten vor dem ersten Commit vervollständigen

| Asset-ID | Quelle/Pack | Dateiname | SHA-256 | Abmessungen | Lizenzdatei | Freigabe |
| --- | --- | --- | --- | --- | --- | --- |
| `tile-wiese` | Kenney Sketch Town | ungeprüft | ungeprüft | ungeprüft | aus Archiv sichern | ausstehend |
| `gebäude-werkstatt` | Kenney Sketch Town | ungeprüft | ungeprüft | ungeprüft | aus Archiv sichern | ausstehend |
| `lichtmaske-01` | Kenney Light Masks oder Sketch Town | ungeprüft | ungeprüft | ungeprüft | aus Archiv sichern | ausstehend |
| `rauch-01` | Kenney Smoke Particles oder vorhandene PixiJS-Grafik | ungeprüft | ungeprüft | ungeprüft | aus Archiv sichern | ausstehend |

Keine KI-generierten Bilder oder fremde Medien ohne individuellen Rechtenachweis als Ersatz verwenden. Für technische Schnittstellen und Messgrößen siehe [RENDERER.md](RENDERER.md).
