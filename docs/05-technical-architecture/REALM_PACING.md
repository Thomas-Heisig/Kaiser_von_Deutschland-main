# Spielzeit, Vorhaben und langfristige Risiken

Stand: 24.10.2026. Diese Ausbaustufe ergänzt echte **verstrichene Spielmonate**, keine an die reale Uhr gebundenen Wartefristen. Die Monatsgeschwindigkeit und Pause bleiben bedienbar. Die Dauerwerte sind Spielregeln, keine behaupteten historischen Baudauern.

## Vorhaben

Bis zu zwölf Vorhaben pro Reich, mit sofortiger einmaliger Zahlung und Wirkung erst nach Abschluss. Kosten und Start sowie Abschluss stehen in der Chronik; Restzeiten bleiben nach Save/Load erhalten. Alte Spielstände ohne Vorhabenliste bleiben lesbar. Beispiele vor 1750: Anbauflächen 3, Werkstätten/Marktplatz 6, Mine 9, Kultstätte 12, Hafen 18, Hochschule 24, Herrschaftssitz 36 Monate. Ab 1750 Faktor 0,75, ab 1900 Faktor 0,5, aufgerundet und mindestens zwei Monate.

Infanterie/Bogenschützen werden drei, Kavallerie sechs Monate ausgebildet; Bevölkerung und Kosten werden bei Bestellung reserviert, einsatzfähige Einheiten erst am Ende ergänzt. Modernisierungen sechs bzw. zwölf Monate, Garnisonsverbesserungen zwei. Feldzüge dauern drei bis sechs Monate; menschliche Gegner im Hotseat drei. Nachschub wird beim Aufbruch bezahlt; laufender Unterhalt bleibt bestehen. Ungültige Ziele oder inzwischen geschlossene Verträge verhindern den Kampf; Aufbruchskosten werden nicht erstattet. Verwaltungsautomatik nutzt dieselben Vorhaben.

Die alten direkten `attackRival`/`attackPlayer`-Methoden bleiben als Kompatibilitäts- und Testzugang erhalten; die Spieloberfläche verwendet `launchCampaign`/`launchPlayerCampaign`. Ausgefeilte Arbeitskräfte-, Transport- und Bauplatzsimulation ist weiterhin offen.

## Reise durch die Zeit

In der Reichsübersicht: 1, 10 oder 100 Jahre mit vollständiger Monatsberechnung (12/120/1200 Schritte), Fortschritt und Abbruch. Nach der Reise bleibt das Spiel pausiert. Offene Ratsentscheidungen und Kampagnenabschluss/-niederlage unterbrechen; Zuschauerautomatik kann Entscheidungen übernehmen. Für Hotseat ist diese Sammelreise gesperrt. Jährliche Autosaves während der Reise und abschließendes Speichern reduzieren Speicherarbeit. Ein Jahrhundert ist kein Überspringen der Simulation und kann bei großen Bevölkerungen länger dauern.

„Geschichte & Zeitbild“ besitzt zusätzlich eine **reine Lese-Zeitreise** mit Jahresfeld und Schritten von 1/10/100 Jahren; sie verändert den Spielstand nicht. Bürgerliche Jahresangaben ohne Jahr null.

## Karte und Gegner

Siedlung und Umgebung verwenden dieselbe reale Ganderkesee-Geländetextur und das Gewässernetz. Bauplätze und sichtbare Gebäude sind modelliert, keine belegten historischen Standorte. Die drei Ausgangsnachbarn sind bekannt; neue entfernte Grenzmächte können weiterhin unerkundet sein. Angezeigt werden tatsächliche Simulationswerte für Heer, Befestigung und Beziehung. Neutralität ist bei friedlichen Beziehungen weiterhin ein gültiger Zustand. Kontakte und Überfälle aktualisieren Entdeckung und Diplomatie.

Sind alle Rivalen unterworfen, entstehen beim nächsten Jahreswechsel drei neue fiktive Grenzmächte. Sie beginnen mit mindestens dem 1,25-Fachen der bisherigen Ausgangsstärke (anschließend weitere Staffelung), begrenzter Stärke und Befestigung. Alte Vasallen bleiben erhalten. In abgeschlossenen Kampagnen ist zuerst die Fortsetzung ins freie Spiel nötig. Dies sind Spielgegner, keine behaupteten historischen Staaten oder Grenzverläufe.

## Nahrung und Meldungen

Geschützte Kapazität: mindestens 12.000 bzw. 18 Monatsverbräuche, plus 6.000 je Speicher. Ungeschützter Überschuss verliert monatlich 2,5 %. Bei aktivierten Zufallsereignissen steigen Schädlings-/Flutrisiken mit Anbauflächen und ungeschütztem Überschuss, begrenzt auf 12 % pro Monat. Speicher mindern Vorratsverluste. Fluten können ab zwölf Anbauflächen 8 % davon (abgerundet, mindestens eine) zerstören; Wiederaufbau ist nötig. Nahrung und Zufriedenheit sinken nachvollziehbar, nicht mehrfach für dieselbe Meldung. Gute Versorgung bleibt sinnvoll; diese Regeln garantieren keine Niederlage.

„Was ist passiert?“ filtert wichtige Meldungen, alle Meldungen oder Finanzen. Kassenabschlüsse bleiben vollständig in der Chronik. Kampfberichte werden in der Engine einmal je betroffenem Reich erfasst. „Dein Weg durch das Spiel“ lässt sich direkt oder in Anzeige-Einstellungen ausblenden; die Präferenz bleibt gespeichert. Ein separat aktives interaktives Tutorial lässt sich wie bisher überspringen.

## Geschichte und Nachweise

Sieben zusätzliche Lesekarten zu karolingischer Schrift, Kunst und Aachen sowie Bauhaus-Lehre, Wohnungsbau und Dessauer Architektur. Institutionelle Quellen: [Metropolitan Museum – Carolingian Art](https://www.metmuseum.org/essays/carolingian-art), [Bauhaus Kooperation – Baulehre](https://bauhauskooperation.de/wissen/das-bauhaus/lehre/unterricht/baulehre), [Deutsches Historisches Museum – Bauhaus](https://www.dhm.de/lemo/kapitel/weimarer-republik/kunst-und-kultur/bauhaus). Gelesen am 24.10.2026; Karten-Zeitfenster sind redaktionelle Einordnungen. Eine lückenlose Chronik bleibt offen.

## Prüfung und Grenzen

Engine-Tests: laufende Bau-/Militärvorhaben und Save/Load, Hotseat, Jahrhundertreise mit echter Alterung/Nachfolge und Bauabschluss, Abbruch, BCE-Kalender, Vorratsverluste/Feldschäden, stärkere Rivalengenerationen. Die 1200-Monate-Probe nutzt ein finanziertes friedliches Reich: keine allgemeine Jahrhunderte-Balance-Abnahme. Browser-Smokes prüfen Siedlungsgewässer, Gegnerangaben, Baufortschritt, Jahresreise, Geschichte-Navigation und gespeichertes Ausblenden der Spielbegleitung bei 375/1280 px. Weitere Szenarien und echte Mobilgeräte bleiben Roadmap-Arbeit.
