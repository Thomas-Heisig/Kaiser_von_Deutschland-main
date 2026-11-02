# Begehbarer Ortskern und PixiJS-Assets · 01.11.2026

## Ergebnis

Die Ortskarte verwendet das Paket unter `public/pixijs-assets-2026-11-01/`.
Sechs benannte Spritesheets liefern 24 Gebäude-/Bezirksgrafiken. Fehlende oder
unvollständige Paketdateien fallen auf die bisherigen Kenney-Atlanten zurück.
Transparente Bildränder werden ausgeschnitten; die Grafiken werden gleichmäßig
skaliert und passen in die metrisch definierten Grundflächen.

Die neue Kampagne startet an der eigenen Behausung mit 520 m sichtbarer Breite
(260 m auf schmalen Bildschirmen). Ein vorhandener gespeicherter Kamerazustand
bleibt erhalten. Die Bezeichnung „Siedlung“ endet bei 1,5 km statt 40 km.

Die 16 Infrastrukturtypen besitzen jeweils einen örtlichen Anlaufpunkt an einem
realen Gebäude-Lagebezug. Infrastrukturzahlen bleiben Bestandszahlen; eine
Grafik behauptet nicht, alle zugehörigen Gebäude einzeln darzustellen. Nicht
gebaute Einrichtungen erscheinen als dezente Bauplatzkonturen. Moderne
Grundrisse werden erst ab 1900 als zusätzliche Referenz eingeblendet.

## Geografie und Maßstab

- Bestehende LGLN-Geländekarte und Gewässer bleiben erhalten. Das Relief wird
  ab 2 km sichtbarer Breite eingeblendet; im Nahbereich werden Vektoren gezeichnet.
- Neuer Offline-Auszug: `public/maps/ganderkesee-village.json`, 480 vollständige
  Gebäude-Ways, 293 Straßen-/Wege-Ways, 35 Landnutzungsflächen, eine Wasserfläche
  und 27 Baumstandorte. Relationsflächen sind nicht enthalten.
- Quelle: [OpenStreetMap-API, Ortsausschnitt](https://api.openstreetmap.org/api/0.6/map.json?bbox=8.5405,53.0305,8.5515,53.0365),
  abgerufen am 01.11.2026. [© OpenStreetMap contributors, ODbL](https://www.openstreetmap.org/copyright).
  URL, SHA-256 der Rohantwort, Lizenz und Einschränkungen stehen in der JSON-Datei.
  Reproduktion: `node scripts/build-village-map.mjs PFAD_ZUR_OSM_JSON`.
- Ortsanker aus dem ursprünglichen `scripts/build-ganderkesee.py`:
  8,5465° O / 53,0327° N; projizierter Marker `[604.25, 383.79]`.
  Die bisherige grobe Rückrechnung wurde korrigiert. Hausversatz bleibt 20 m
  östlich und 15 m südlich; Hausgröße unverändert 6 × 8 m.
- Lokale Grad-zu-Meter-Umrechnung nutzt dieselbe Näherung wie die bestehende
  Karte. Sie ist keine katastergenaue Projektion und kein Höhenmodell.

`SettlementWorld.ts` liefert Standorte, modellierte Gebäudegrößen und Fußwege
gemeinsam für PixiJS, Three.js und Kollision. Normale Anlaufpunkte sind höchstens
10 × 12 m groß, der Kirchenstandort 16 × 24 m. Das sind Spielmaße, keine behaupteten
historischen Grundrisse. Der Kirchenbau wird vor 1052 nicht als Kirche gezeigt.

## Fußwege und Perspektiven

Die Wege folgen dem verbundenen heutigen OSM-Netz. Private und ausdrücklich
für Fußgänger gesperrte Abschnitte werden nicht zur Routenberechnung benutzt.
Die kurzen Verbindungen zwischen Eingang und Wegenetz sind modelliert. Die
Suche prüft Gebäudeabstände und vermeidet Wanddurchquerungen. Alle 16 Ziele
liegen innerhalb von 243 m Wegstrecke (aufgerundet); ein Test begrenzt sie auf
500 m und läuft jede Route mit der tatsächlichen Kollisionslogik ab.

Die Three.js-Szene bleibt bestehen. Ergänzt wurden örtliche Gebäude mit denselben
Maßen, Wege, Baumstandorte und geneigte Dachflächen. Aktive Gebäude folgen dem
Infrastrukturbestand. Die Bewegung endet nicht mehr an der alten 12-m-Hofgrenze,
sondern erlaubt einen örtlichen Ausschnitt von ±330 m. Außenbauten besitzen
keine betretbaren Innenräume; nur die eigene Behausung ist eingerichtet.

## Einordnung

Das heutige Wegenetz ist eine räumliche Referenz. Es belegt weder mittelalterliche
Straßenverläufe noch historische Gebäudenutzungen. Bauten, Baumkronengrößen und
Einrichtung bleiben Spielmodelle. Diese Trennung ist in der Karte und in der
Ich-Perspektive sichtbar. Die regionale Reliefkarte wird nicht als Nahtextur
gestreckt. Kartenkamera, Zoom, Pinch und gespeicherte Blickposition bleiben erhalten.

## Prüfung

- `npm run check`
- `npx vitest run`: 454 bestanden, sieben vorhandene übersprungen.
- `npm run build`: Produktionsbundle und Offline-Archiv.
- `node scripts/village-smoke.mjs` gegen den lokalen Vite-Server: Desktop und
  Smartphone, Bronzezeit/Mittelalter/Moderne, blockiertes Asset-Paket mit Fallback,
  CSS-Maßstab, durchgehender Zoom, Pinch, Three.js und Kamerarückkehr.
- Screenshots und Messwerte: `output/village-acceptance/`.

Grundlage ist der zuvor geprüfte GitHub-Stand `6cc23f1`. Die vorherigen lokalen
Änderungen wurden vor dem Fast-forward gesichert und mit dem neueren Stand
abgeglichen. Neuere Musik-Korrekturen aus GitHub bleiben erhalten.
