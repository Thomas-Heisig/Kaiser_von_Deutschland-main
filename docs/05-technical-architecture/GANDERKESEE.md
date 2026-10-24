# Ortskarte und Verwaltung · 24.10.2026

Die Heimatkarte startet in Ganderkesee. Sie zeigt einen 20 × 14 km großen, maßstäblichen Ausschnitt in ETRS89 / UTM 32N (EPSG:25832), Rechtswerte 457000–477000 und Hochwerte 5870000–5884000. Der separate Siedlungsplan mit 16 Bezirken bleibt eine Spielabstraktion.

## Geodaten und Nachweise

- Gelände: [LGLN DGM1 WCS](https://opendata.geoservices.lgln.niedersachsen.de/dgm_wcs/), bilinear auf 1200 × 840 Bildpunkte abgerufen, Schummerung und geglättete 5-m-Höhenlinien offline erzeugt. Farbton bedeutet Höhe, nicht rekonstruierte Vegetation. Quellenvermerk: © GeoBasis-DE/LGLN 2026, Daten geändert, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Gewässer: [Gewässernetz Niedersachsen, ArcGIS-Layer 20](https://www.umweltkarten-niedersachsen.de/arcgis/rest/services/Hydro_wms/MapServer/20). 301 Liniensegmente unter anderem von Welse, Dummbäke, Brookbäke, Kimmer Bäke und Delme. LGLN 2023, bearbeitet durch das Nds. Umweltministerium; Auswahl, Vereinfachung und Zuschnitt für das Spiel, [Datenlizenz Deutschland – Namensnennung 2.0](https://www.govdata.de/dl-de/by-2-0).
- Ortsgeschichte: [Niedersächsisches Landesarchiv](https://www.arcinsys.niedersachsen.de/arcinsys/showFondsDetails?fondsId=2877), erste Erwähnung um 860; vorher heißt der Kartenanker „Geest am heutigen Ganderkesee“.
- Kirche: [Gemeinde Ganderkesee](https://www.ganderkesee.de/leben/kultur/), Gründung 1052, Turm aus dem 12. Jahrhundert, gotische Hallenkirche aus dem 15. Jahrhundert, Schnitger-Orgel 1699. Die Einträge erscheinen zeitabhängig; es wird kein Einweihungsmonat erfunden.
- Steinkimmen und Stenum: [offizieller Routenführer zur Megalithkultur](https://os1.meinecloud.io/b10294/wildeshausergeest.org/pdf/Broschueren/Routenfuehrer_Radroute_der_Megalithkultur_2022_komprimiert.pdf), jungsteinzeitliche Gräber und Koordinaten. Die heutige Erhaltung wird nicht als bronzezeitlicher Bauzustand dargestellt.
- Hasbruch: [NLWKN](https://www.nlwkn.niedersachsen.de/naturschutzgebiete/naturschutzgebiet-hasbruch-41382.html), Waldgeschichte im Ortswissen. Keine erfundene historische Waldgrenze auf der Karte.

Die Daten beschreiben heutiges Gelände und heutige Gewässerachsen. Historische Bachbetten, Waldflächen und Siedlungsgrenzen sind nicht rekonstruiert. Der Hinweis steht in Karte und Ortswissen. Über ⓘ oder Geschichte → Ganderkesee sind Quellen und zeitabhängige Geländemarken erreichbar. Weitere Startorte benötigen eigene belegte Kartenpakete; die Registry ist dafür vorbereitet.

## Offline-Erzeugung

`scripts/build-ganderkesee.py` benötigt Python, NumPy, Pillow, Matplotlib und pyproj. `python scripts/build-ganderkesee.py --refresh` ruft DGM und Gewässerdaten ab; ohne `--refresh` werden vorhandene Downloads in `.temp/` verwendet. Das Skript schreibt Terrain-WebP, Linien-/Ortsdaten und Quellenmanifest nach `public/maps/`. Exakte Anfragen, Eingangs-SHA256 und Lizenzen stehen in `ganderkesee-source.json`. Python läuft niemals im Browser. PixiJS lädt die fertigen Dateien, zeichnet die Flüsse und blendet passende Ortsinformationen ein.

## Spielbedienung und Automatik

Fenster unterstützen Mausrad und vertikales Touch-Wischen, während die Hauptseite im Viewport bleibt. Der Schließenknopf bleibt außerhalb des Scrollbereichs. Audio befindet sich im Header. Der Steuerregler wendet 0–50 % sofort an; Handelsgut und Menge bleiben nach Transaktionen erhalten. Die Wirtschaft zeigt Vorräte und Monatsbilanz.

Hofverwaltung delegiert Wirtschaft, Bauen, Forschung, Garnison, Kultur und Bürgeraufträge einzeln. „Zuschauen“ aktiviert alle Bereiche und Ereignisentscheidungen; „Fortsetzen“ startet die Zeit. Manuell übernommene Bereiche bleiben unberührt. Die bisherige Ämterautomatik wird für neu delegierte Wirtschaft/Forschung nicht doppelt ausgeführt.

| Profil | Gold-Unterhaltsrücklage | Anteil des übrigen Goldes als gemeinsames Monatsbudget |
|---|---:|---:|
| Sicher | 6 Monate, mindestens 500 Gold | 5 % |
| Normal | 3 Monate, mindestens 500 Gold | 12 % |
| Gewagt | 1 Monat, mindestens 500 Gold | 25 % |

Das Budget wird nach laufenden Monatsfolgen einmal berechnet. Verkäufe füllen es nicht erneut auf. Nahrung hat eigene Reserveschwellen; Ausgaben werden vor jeder Aktion geprüft. Diese Begrenzung schützt vor freiwilliger Überinvestition, garantiert aber keinen Schutz vor Unterhalt, Kriegsfolgen oder Ereignissen. Automatik nimmt keine Kredite auf und beginnt keine Angriffskriege. Alle Einstellungen werden pro Spieler gespeichert; Altstände bleiben manuell.

Neun zusätzliche Bau-/Modernisierungsvorhaben ergänzen den bisherigen Bestand. Gebäudevoraussetzungen, Zeitfenster und Forschung begrenzen das Angebot. Zeitfenster sind Spielregeln, keine Behauptungen über lokale Baujahre. Garnisonsausbau verbessert Ausbildung oder Ausrüstung kostenpflichtig um höchstens fünf Punkte. Kleine Zusammenkünfte sind monatlich wiederholbare Spielaktionen, keine datierten historischen Meldungen. Forschungskarten zeigen die tatsächlich implementierten Einzelwirkungen.

## Gold und Regressionen

Jeder Monatsabschluss gleicht Anfangsbestand, tatsächliche Buchungen und Endbestand ab. Er umfasst Unterhalt, Darlehen, Forschungserträge, Politik, Überfälle, Delegation, Bürgeraufträge, Weltfolgen und Ratsentscheidungen. Eine Zusammenfassung steht in der Chronik, die vollständige letzte Abrechnung in Wirtschaft; sie bleibt beim Speichern erhalten.

Ein Fehler ließ ungelöste Naturkatastrophen bei späteren Jahreswechseln erneut Gold abziehen. Schäden werden jetzt einmal im Ereignismonat angewendet, protokolliert und als abgewickelt gespeichert. Bei deaktivierten Zufallsereignissen entstehen daraus keine Verluste. Bereits verlorenes Gold alter Spielstände lässt sich ohne frühere Einzelbuchungen nicht zuverlässig zurückrechnen.

Tests prüfen unter anderem Kosten, Grenzen, monatliche Feste, BCE-Speicherung von Bürgeraufträgen, Darlehensnachweise und einmalige Katastrophenschäden. `scripts/ganderkesee-smoke.mjs` prüft echte Kartenassets, historische Ortsmarken, Mausrad/Touch-Wischen, Handel, Steuerregler, Garnison und Delegationsbedienung in Chromium bei 375, 1024 und 1280 px. Echte Geräte sowie Langzeitbalance bleiben separate Abnahmen.
