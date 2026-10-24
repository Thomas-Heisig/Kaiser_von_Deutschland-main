# Frühstart, historische Ereignisse und Zeitbilder

Stand: 24.10.2026. Einstieg im Hauptspiel: **Neue Herrschaft → Startepoche**, frühester auswählbarer Beginn **2000 v. Chr.**. Die Standardauswahl 1200 bleibt erhalten. **Geschichte → Mehr Geschichte** beziehungsweise die Verwaltungsansicht **Geschichte** öffnet Kunst, Baustil/Wohnen, Kultur/Wissen, Alltag, Monatsereignisse, Zeiträume und Chronologie. Alle Karten enthalten Quellenlinks und räumliche Einordnung.

## Datierung und Spielkalender

- Intern gilt astronomische Jahreszählung: `0 = 1 v. Chr.`, `-1999 = 2000 v. Chr.`. `HistoricalCalendar.ts` übernimmt die bürgerliche Anzeige ohne Jahr null. Positive Jahreszahlen und bisherige nachchristliche Spielstände bleiben unverändert. Ein früherer interner Jahr-0-Stand wird als 1 v. Chr. angezeigt.
- Die bestehende Simulation rechnet monatsweise und benutzt einen vereinfachten Kalender ohne Schaltjahre. Ein historisch belegter Tag ist eine Datumsangabe innerhalb der Monatsübersicht, kein neuer täglicher Simulationsschritt.
- Tag und Monat werden nur gespeichert, wenn die verlinkten Belege sie tragen. Ein fehlender Monat bedeutet Jahreskontext; solche Einträge werden nicht als am 1. Januar geschehen ausgegeben. Echte Monatsdatensätze erscheinen erst im jeweiligen Monat, einschließlich bezahlter Kulturförderung.
- `endYear` bildet Zeiträume oder Datierungsspannen ab. Eine Spanne wie 60/61 bedeutet nicht automatisch einen zwei Jahre dauernden Vorgang; der Hinweis erklärt die Aussage.
- `certainty`, `approximate` und `dateNote` trennen Überlieferung, umstrittene Datierung und archäologische Näherung. Die antiken Kalender werden nicht stillschweigend in einen modernen gregorianischen Kalender umgerechnet.
- Stile besitzen redaktionelle Lesefenster, keine behaupteten exakten Geburts- und Endtage. Mehrere Stile können gleichzeitig vorkommen. Das monatlich wechselnde Zeitbild ist eine Leseempfehlung, kein erfundenes Monatsereignis.
- Die historische Information ändert weder Ressourcen noch Politik oder Forschungsstand. Die ausdrücklich betätigte Kulturförderung kostet Gold und wirkt einmalig. Fiktive Zukunftsszenarien bleiben gekennzeichnet und aus dem historischen Lagebericht ausgeschlossen.

## Quellenprüfung der eingereichten Antikenliste

Die vollständigen Einzelnachweise stehen bei den Datensätzen in `AncientHistoryCatalog.ts`. Wichtige Abweichungen von der Vorlage:

| Angabe | Übernahme und Korrektur |
| --- | --- |
| 2000 v. Chr. | Spielbeginn; kein erfundener tagesgenauer Beginn aller Bronzekulturen. Ägypten, Ägäis und Mitteleuropa werden getrennt beschrieben. |
| Urnenfelderkultur | Regional ca. 1300–800 v. Chr., nicht ein allgemeiner Gründungsakt um 1200. [Germanisches Nationalmuseum](https://www.gnm.de/ausstellungen/sonderausstellungen-rueckblick/letzte-fahrt). |
| Marathon, Thermopylen, Plataiai, Leuktra | Jahre übernommen; vorgeschlagene Tageswerte nicht als gesichert hinterlegt. Datierungshinweise nennen die Unsicherheit. |
| Salamis | September 480 v. Chr.; 28./29. September in der verwendeten Quelle, deshalb ohne einzelnen Tag. [Griechisches Kulturministerium](https://2500years.culture.gov.gr/en/chapters/i-naumachia-tis-salaminas/triiris). |
| Rom | 21. April 753 v. Chr. ausdrücklich Überlieferung, keine archäologisch bewiesene Stadtgründung. |
| Parthenon | Bauphase 447–438 v. Chr.; nicht alle Bildhauerarbeiten müssen damit abgeschlossen sein. |
| Peloponnesischer Krieg | Beginn 431, Zeitraum 431–404 v. Chr.; die Aussage „erstes absolutes Datum der griechischen Geschichte“ wird nicht übernommen. |
| Königsfrieden | 387/386 v. Chr. statt einer unbestimmten Dekadenbehauptung. [DAI/Chiron](https://publications.dainst.org/journals/chiron/article/download/1393/5742). |
| Philipp II. und Alexandria | Jahr gesichert; Oktober beziehungsweise 7. April aus der Vorlage durch die verwendeten Quellen nicht belegt. |
| Issos und Alexanders Tod | November 333 beziehungsweise Juni 323 v. Chr.; konkurrierende Tagesrekonstruktionen bleiben im Hinweis. |
| Cannae | 2. August 216 v. Chr. als römische Datierung; abweichende Zuordnung zum Sonnenkalender ausdrücklich genannt. |
| Zama | Jahr 202 v. Chr.; 19. Oktober nicht als gesichert übernommen. |
| Caesar, Actium, Augustus | 15. März 44, 2. September 31 und 16. Januar 27 v. Chr.; Augustus stirbt am 19. August 14 n. Chr. Actium ist kein einzelner rechtlicher Abschaffungsakt der Republik. [Plutarch, Caesar 63](https://lexundria.com/plut_caes/1.63.3/prr), [Kapitel 66](https://lexundria.com/plut_caes/66/prr), [Livius: Augustus](https://www.livius.org/articles/person/augustus/). |
| Augsburg | Alpenfeldzug/traditionelles Gründungsjahr 15 v. Chr. getrennt von Siedlungsanfängen 5–20 n. Chr. [Regio Augsburg](https://www.augsburg-tourismus.de/files/augsburgtourismus/media/infomaterial/pdf/2025/regio_roemer_faltprospekt_2025_web.pdf). |
| Varusschlacht | 9 n. Chr.; die Tagesfolge 9.–11. September ist im Museumsbeleg nicht abgesichert. |
| Boudicca und Judäa | Boudicca 60/61 als Datierungsspanne, Aufstand in Judäa 66, Zerstörung Jerusalems/Tempels 70. Tempelbrand und gesamte Stadteroberung nicht zu einem Septembertag zusammengezogen. |
| Kolosseum | Rekonstruierte Bauinschrift belegt Beutefinanzierung. Keine Behauptung, allein ein genau bezifferter Tempelgoldschatz habe alles bezahlt. [Parco archeologico del Colosseo](https://colosseo.it/opere/iscrizione-del-prefetto-di-roma-c-v-lampadius/). |
| Terra Sigillata | Formen und Stempel helfen bei Zuordnung und Datierung. Keine pauschale Garantie, dass jede Scherbe jahrzehntgenau datierbar sei. [Stadtarchäologie Wien](https://stadtarchaeologie.at/start/erleben/ausstellungen/tischgespraech/tischgespraech/). |

## Kunst, Kultur und Architektur

`EraKnowledgeCatalog.ts` enthält regionale Zeitbilder vom Mittleren Reich und den ägäischen Bronzekulturen über griechische/römische Kunst, Vorromanik, Romanik und Gotik bis zur Netzkultur. `ArtStyleCatalog.ts` ergänzt unter anderem Manierismus, Empire, Naturalismus, Impressionismus und seine Weiterentwicklungen, Symbolismus, Jugendstil, Fauvismus, Expressionismus, Kubismus/Orphismus, Futurismus, Konstruktivismus, Suprematismus, Dada, De Stijl, Bauhaus, Neue Sachlichkeit, Surrealismus, Informel, Art brut, Action Painting, Op Art, Pop Art, Minimal Art, Fluxus, Konzeptkunst und postmoderne Strömungen.

Quellen sind vor allem Museen, Denkmalinstitutionen, Hochschulen und Fachpublikationen. Alle Beschreibungstexte sind kurze eigene Zusammenfassungen; keine fremden Abbildungen oder vollständigen Artikel werden ausgeliefert. Die Quellenrechte werden durch Verlinkung nicht zu einer Lizenz für fremde Medien.

Die Stilvorlage wird nicht als starre universelle Reihenfolge übernommen: Fauvismus ist nicht notwendig ungegenständlich, Suprematismus nicht einfach ein Unterzweig des Konstruktivismus und Art brut kein Synonym des Informel. Regionale Gotik ist exemplarisch durch englische Varianten vertreten. Weitere regionale Untergliederungen (etwa einzelne französische Schulen, Chiaramontestil oder Sondergotik) brauchen eigene Prüfung und sind nicht vollständig katalogisiert.

## Spielbarkeit und Grenzen

Frühe Starts verwenden dieselbe validierte Wirtschaft und dieselben Aktionen, mit Siedlungsbegriffen, eigener Farbgebung und schematischen frühen Gebäuden. Grundtechnologien sind erreichbar; ihre Verfügbarkeitsjahre sind Spielregeln, keine weltweiten Erfindungsdaten. Mittelalterliche Gildenentscheidungen erscheinen erst ab 1000. Frühe Bewohner erhalten neutrale fiktive Kennungen statt rückprojizierter mittelalterlicher Namen. Die Karte rekonstruiert keine belegten politischen Grenzen für 2000 v. Chr.; das damalige Deutschland wird nicht als existierender Staat behauptet.

Geprüft: negative Jahreszahlen, Bauen/Forschung/Reisen über zwölf Monate, Kulturförderung mit Save/Load, Jahreswechsel 1 v. Chr. → 1 n. Chr., monatsabhängige Ereignisse und Freischaltungen, zeitlich passende Wissenskarten. `history-smoke.mjs` prüft 20 historische Starts sowie Monatswechsel 44 v. Chr., 1945 und 1970, Quellen, Themenfilter, Paginierung und Speichern. `atlas-smoke.mjs` prüft den echten Frühstart aus dem Menü und den Schreibtisch bei schmalen Ansichten. Langzeitbalance über Jahrtausende, eine lückenlose Weltchronik und die vollständige Großsystem-Roadmap sind damit nicht abgeschlossen.
