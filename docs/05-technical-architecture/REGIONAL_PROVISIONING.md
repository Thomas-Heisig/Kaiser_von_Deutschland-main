# Regionale Versorgung und lesbarer Reichszustand

Stand: 24.10.2026. Einstieg im Hauptspiel: **Welt & Volk**, ergänzend **Bürgeraufträge** und **Hofverwaltung**.

## Spielmodell und Folgen

Drei Verwaltungsgebiete (Geest, Bachniederungen, entlegene Höfe) teilen den tatsächlichen Nahrungsvorrat des jeweiligen Spielerreichs. Das sind modellierte Einzugsgebiete, keine historischen Bezirksgrenzen oder belegten Einwohnerzahlen. Ihre Belastungsfaktoren 0,85/1,15/1,3 sind Spielbalance.

Unter zwei Monatsverbräuchen Reserve steigt der Versorgungsdruck; negativer Nahrungssaldo erhöht ihn. Straßen, örtliche Speicher und laufende Nothilfe mindern ihn. Hunger verändert sich höchstens um 15 Punkte je Monat. Ab 60 beginnt eine Krise und Vertrauen sinkt. Nach drei Krisenmonaten mit mindestens 70 Hunger wandern pro Gebiet bis zu zwölf Menschen (abgerundet 0,2 % der vorhandenen Bauern) ab. Die tatsächliche Bauernzahl, damit künftige Arbeitskraft, Steuerbasis und Verbrauch, sinkt. Bereits vorhandene reichsweite Hungerfolgen gelten zusätzlich.

| Maßnahme | Kosten | Wirkung |
|---|---|---|
| Nothilfe | 120 Gold, 180 Nahrung | Sofort −25 Hunger, +4 Vertrauen; drei Monatswechsel −35 Versorgungsdruck |
| Speicher | 400 × neue Stufe Gold, 160 Holz, 80 Stein | Dauerhaft −8 Versorgungsdruck je Stufe, +3 Vertrauen, maximal drei Stufen |
| Haushaltshilfe | 220 Gold, 80 Nahrung, 100 Holz | +10 Vertrauen; drei Monatswechsel keine zusätzliche regionale Abwanderung |

Speicher verbessern die Verteilungsvorsorge; sie erzeugen keine Nahrung und eröffnen keinen separaten Ressourcenpool. Pro Gebiet ist eine Aktion je Monat möglich. Kosten werden erst nach vollständiger Prüfung gemeinsam gebucht. Erfolgreiche Versorgungsaufträge der Bürger verbessern das belastetste Gebiet. Die Bürgerautomatik berücksichtigt das gemeinsame Verwaltungsbudget und die Vorratsreserve. Politische Fraktionen und individuelle Familienwanderungen sind weiterhin offen.

`RegionalProvisioning` speichert Zustände je Spieler, auch vor Christus. Fehlende Daten alter Spielstände beginnen ohne Krise; beschädigte Daten werden vor Übernahme in die laufende Partie zurückgewiesen. Hotseat trennt Gebiete und Handlungserlaubnis. Kassenabschluss und Chronik dokumentieren Ausgaben und Folgen.

## Oberfläche und Holzbalance

Bevölkerung, Zufriedenheit, Stabilität und die statische Nahrungsreichweite sind dauerhaft unter den Ressourcen sichtbar. Die Reichweite teilt den aktuellen Vorrat durch den aktuellen Monatsverbrauch; sie ist keine Vorhersage künftiger Ernten. Anklicken öffnet den ausführlichen Reichszustand. Lange Meldungen sind innerhalb der Berichtskarte scrollbar, die Hauptseite bleibt fest. Chronik und Kurzberichte strukturieren gespeicherten Klartext durch Absätze, Überschriften und Listen; HTML aus Meldungen wird escaped.

Holzproduktion verwendet nun jährlich `Waldanteil × 32 + Werkstätten × 300` statt `× 20 + × 15`. Der bisherige Werkstattzuwachs von rund einem Holz monatlich konnte den Holzpreis von 500 kaum ausgleichen. Der neue saisonale Zuwachs beträgt durch Abrundung 17–28 Holz monatlich vor Forschungsboni. Baukarte und Wirtschaft nennen den aktuellen Zuwachs. Winterverbrauch bleibt erhöht; Holz lässt sich weiterhin zukaufen. Das gilt auch nach Laden älterer Spielstände. Eine vollständige ökologische Forstsimulation oder jahrhundertelange Balance wird damit nicht behauptet.

## Bürgernamen

Neu erzeugte Bürger verwenden wie Neugeborene die Namensauswahl nach **Geburtsjahr**, nicht pauschal mittelalterliche Namen. Die Rollenliste zeigt sechs Personen pro Seite, weitere bleiben erreichbar. Vor 500 bleiben lokale Namen ausdrücklich neutrale Bewohnerbezeichnungen, weil keine geeignete örtliche Namensgrundlage vorliegt. Frühe Beinamen, spätere Familiennamen und die groben Namensperioden sind ein fiktives Spielmodell. Vorhandene Personen und selbst gewählte Namen werden beim Laden nicht umbenannt; regionale Namensräume bleiben eine spätere Ausbaustufe.

Grundlagen der Einordnung, keine Behauptung einer lokalen Ganderkeseer Namensstatistik:

- [Universität Hamburg: Familiennamen](https://www.spaetmittelalter.uni-hamburg.de/spaetmittelalter/propaedeutik/hilfswissenschaften/onomastik/familiennamen.html): allmählicher Übergang von Beinamen zu Familiennamen, mit regionalen Unterschieden.
- [GfdS: beliebteste Vornamen](https://gfds.de/vornamen/beliebteste-vornamen/): historische Namensmoden und Berliner Vergleichsdaten.
- [Knud Bielefeld: 1900er Jahre](https://www.beliebte-vornamen.de/3747-1900er-jahre.htm) und [1960er Jahre](https://www.beliebte-vornamen.de/3772-1960er-jahre.htm): eigene Stichprobenerhebungen, ausdrücklich keine amtliche Vollstatistik. Die Spielauswahl ist keine übernommene Rangliste.

## Nachweis

- `RegionalProvisioning.test.ts`: Versorgung, Abwanderung, Erholung, atomare Kosten, Laufzeiten, Speicherausbau, Bürgerfolgen und Datenvalidierung.
- `GameEngine.test.ts`: Bürgerauftrag → Gebiet, automatische Nothilfe → Kassenabschluss, Hotseat/BCE/Save/Load, Altdaten und beschädigte Saves.
- `Kingdom.test.ts`, `HistoricalNames.test.ts`, `JournalFormatting.test.ts`: tatsächlicher saisonaler Holzertrag, Geburtskohorten und sichere Klartextdarstellung.
- `scripts/provisioning-smoke.mjs`: sichtbare Statuswerte, sechs Rollen mit Blättern, Holzausbau, Gebietsaktionen, exakte Kosten, Monatssperren, Speichern/Laden und Chronik bei 320/375/768/1024 px. Unterstützt die veröffentlichte URL über `KAISER_TEST_URL`.
- Vollständige Testsuite: 317 bestanden, sieben bereits vorhandene übersprungen. Reale Touchgeräte und Langzeitbalance bleiben offen.
