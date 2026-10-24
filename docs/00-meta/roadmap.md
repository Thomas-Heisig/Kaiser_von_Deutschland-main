# Roadmap — Kaiser von Deutschland

## Aktiver Entwicklungsplan · Stand 24.10.2026

Der Nutzer hat den gesamten Roadmap-Umfang einschließlich der Großsysteme beauftragt. Die Umsetzung erfolgt in prüfbaren Ausbaustufen; offene Systeme bleiben sichtbar offen. Neu umgesetzt: [Strategiewelt und Verträge](../05-technical-architecture/STRATEGY_WORLD.md), reaktive Rivalen, vier friedliche Kampagnenwege und [Lastmessung bis 20.000 Bürger](../reports/strategy-population-2026-10-24.md). Online-Mehrspieler, freie Bebauung, vollständige Grafikproduktion und VR sind damit noch nicht abgeschlossen.

## Leseregel

Aktuelle Ausbaustufe: [regionale Versorgung, sichtbarer Reichszustand und Holzbalance](../05-technical-architecture/REGIONAL_PROVISIONING.md). Bezahlte Entscheidungen und Bürgeraufträge wirken auf drei modellierte Heimatgebiete und die tatsächliche Bauernzahl. Individuelle Familienwanderungen, Produktionsketten und politische Fraktionen bleiben anschließende Schritte. Namen neuer Bürger folgen Geburtskohorten; die Rollenliste ist in Sechsergruppen blätterbar.

Die [TODO](../../TODO.md) ist die *einzige operative Aufgabenliste*. Diese Roadmap zeigt Abhängigkeiten und Entwicklungsziele, **kein selbst attestiertes Fertigstellungsprotokoll**. [Status](status.md) beschreibt ausschließlich nachprüfbare Ergebnisse. Frühere Visionen, Zeitpläne und alle Ideen der bisherigen Dokumentation wurden vollständig archiviert: [Original-Roadmap](../outdated/roadmap-snapshot-2026-10-17.md), [Original-TODO](../outdated/TODO-snapshot-2026-10-17.md), [README-Ideen](backlog-from-readme.md). Keine historischen Ideen wurden gestrichen.

## P1-Balancing-Befund (18.10.2026)

Die monatliche Spielschleife verwendete bisher keine jahreszeitliche Ernte- und Holzproduktion, obwohl der alte Jahrespfad solche Faktoren vorsah. Die monatliche Prognose und die Buchung berücksichtigen nun übereinstimmend Winter und Sommer. Mehrjährige Balance-Kalibrierung bleibt offen.

## P1-Niederlagebedingungen (24.10.2026)

Die Standardkampagne hatte bisher keine echten Niederlagebedingungen; die Niederlageseite wurde nie geöffnet. Das neue `CampaignDefeatSystem` prüft monatlich drei existenzbedrohende Zustände über aufeinanderfolgende Monate: **Bankrott** (drei Monate ohne Gold), **Hungersnot** (zwei Monate ohne Nahrung) und **Anarchie** (sechs Monate Zufriedenheit ≤ 5). Erholung setzt die Zähler zurück; ein eingetretener Untergang bleibt für die laufende Kampagne festgehalten. Der Untergang pausiert das Spiel, schreibt die Chronik und öffnet die Vollbild-Niederlageseite. Die Schwellen liegen bewusst über den Minimum-Werten gesunder Läufe (Gold ~4.700, Nahrung ~11.000, Zufriedenheit ~8) und sind konfigurierbar. Unit- und Engine-Integrationstests belegen Bankrott/Hungersnot/Anarchie, fehlendes Doppelabbruchen, Save/Load-Migration und das Fehlen von Fehlalarmen; Altstände ohne Defeat-Daten bleiben ladbar.

## P1-Interaktives Tutorial (24.10.2026)

Die neue interaktive Tutorial-Kampagne führt neue Herrschaften über die fünf Kernschritte **Bauen → Handeln → Forschen → Reichsrat → Speichern** durch die echte Spielschleife. Die Schritte sind strikt geordnet, werden an den tatsächlichen Engine-Aktionen (Gebäudebau, Markthandel, Forschungsstart, Ratsentscheidung, manuelles Speichern) erkannt und fortlaufend in einer eigenen Karte in der Seitenleiste angezeigt – mit Fortschrittsbalken, Navigation zum passenden Bereich und kontextsensitiver Hilfe bei fehlenden Ressourcen. Für den Rats-Schritt stellt der Rat eine feste, bedingungslose Angelegenheit („Feuer im Dorf") zur Verfügung. Das Tutorial ist im Startmenü aktivierbar, gibt Startguthaben für den ersten Schritt, ist überspringbar und wird im Spielstand persistiert (Altstände ohne Tutorial-Daten bleiben ladbar). 11 Unit-Tests und 9 Engine-Integrationstests sichern Reihenfolge, Events, Save/Load und Überspringen.

## P1-Testabdeckung (24.10.2026)

Ein vollständiger Kampagnendurchlauf ist jetzt automatisiert: Spielstart → Bauen → Handel → Forschung → Reichsrat → Monatswechsel → Speichern/Laden → Sieg (alle drei Kapitel) mit aktivierten Zufallsereignissen und deterministischem RNG. Ergänzt wurden ein vollständiger Niederlage-Lauf (Bankrott) inklusive Save/Load und Sandbox-Fortsetzung, ein Ausschlusstest „Niederlage ≠ Sieg im selben Monat", ein 10-Jahres-Balancing-Lauf mit Jahresprotokoll und ein 5-Jahres-Lauf der Digital-Kampagne. Sechs Systemkopplungen (Rat, Handel, Forschung, Kultur, Diplomatie, Rivalen) sind über konkrete Zustandsänderungen nachgewiesen. Offen: gezielte Grenzwertverbesserung anhand der Protokolle sowie die manuelle Endgeräteabnahme von Sieg-/Niederlageseite.

## Gameplay-P1-Befunde (17.10.2026)

- Industrie und Wiederaufbau hatten Startinfrastruktur, die einen Großteil des ersten Kapitels ohne Spielerhandlung erfüllte; Anfangsziele verschärft.
- Die Zielanzeige verwendete bislang globale Ziel-Schwellen anstelle abgeschlossener Kapitel für die Siegmeldung. Siegstatus und Fortschrittsanzeige sind jetzt an Kapitelabschluss gebunden.
- Automatisierter Spielabschluss, Niederlagebedingungen und Tutorial sind geprüft. Gezielte Balancekalibrierung und reale Endgeräteabnahme bleiben offen.

## Kartenoberfläche (18.10.2026)

Vollflächige Siedlungskarte unter transparenten Panels, Kartenfilter, Bezirksausbau und Zoom als Grafik-Overlays implementiert. Die zuvor duplizierte Gebäudeliste entfällt; Nachbarreiche erscheinen schematisch am Kartenrand. Echte geopolitische Grenzen und Endgeräteabnahme bleiben offen.

## Karte – genehmigte Grafikrichtung, Phase 2 (18.10.2026)

**Aktive Entscheidung:** Kenney Retro Fantasy/Textures für frühe Epochen, Retro Urban für spätere; Sketch Town ist Reserve. Prototyp, drei kleine Atlanten und Darstellungen aller 16 Bezirke sind vorhanden. Die vollständige GLB-Produktion und reale Geräteperformance bleiben ungeprüft. [Renderer](../05-technical-architecture/RENDERER.md) · [Asset-Lizenzmanifest](../05-technical-architecture/ASSETS.md).

**Reihenfolge:** konkretes Pack inventarisieren und Rechte nachweisen → isolierte 144-Kachel-Werkstattszene → CI/Browserbuild → echte iPad-/iPhone-Messung → bei Bestehen genau einen bestehenden Bezirk optisch umstellen. Rendering bleibt ein separates Vorhaben, das P1-Kampagnenqualität nicht als abgeschlossen ersetzt.

## Gameplay-Freigabereihenfolge (verbindlich)

1. **Kampagnenabschluss als End-to-End-Ablauf:** Start, Bau, Handel, Forschung, Reichsrat, Monatswechsel, Save/Load, Sieg und Niederlage — **automatisiert abgeschlossen** (`CampaignEndToEnd.test.ts`); offen ist nur die manuelle Abnahme der Schlusswertungs-Oberfläche.
2. **Langzeit-Balancing:** Jahresprotokolle über 10 Jahre liegen vor; die gezielte Grenzwertverbesserung anhand dieser Daten steht aus.
3. **Systemintegration:** Forschung/Handel/Kultur/Diplomatie/Rivalen als wechselseitige strategische Entscheidungen.
4. **Tutorial, reaktive Rivalen und dauerhafte Chronik:** implementiert und automatisiert geprüft; Langzeit-Balance weiter offen.
5. **Qualität:** Mobile/Barrierefreiheit, Hotseat und große Bevölkerungen. Erst danach neue große Legacy-Systeme erweitern.

HTTPS/Pages ist aktiv; Geräteinstallation und Rechte-/Impressumsnachweise bleiben separate Abnahmen.

## Jetzt — Gate A: zuverlässige Veröffentlichung (P0)

**Ziel:** eine nachweislich erreichbare HTTPS-PWA mit echter Offline-Nutzung.

1. Bestehende Pages-Veröffentlichung und Update-Pfad bei jedem Release prüfen.
2. HTTPS, Service-Worker-Scope, PWA-Manifest, PNG-Icons, MP3-/Video-Status 200/206 und Installation messen.
3. Medienrechte, Credits, Datenschutz und vollständiges Impressum vor öffentlicher Freigabe.
**Vorhanden:** öffentliche HTTPS-Seite, automatischer Vite-Build, Veröffentlichungsworkflow, Offline-ZIP, Medien-Gate, 15 MP3s, 5 Videos. Der alte Pages-Berechtigungsfehler ist behoben.

## Danach — Gate B: lebendige Generationen (P1)

- Erste Integration: [Versorgung, Haushaltsgründung, Charakterautomatik und erwachsene Nachfolge](../05-technical-architecture/CITIZEN_LIFECYCLE.md) samt sichtbarer Hof-/Auftragsbelegung. Zwei deterministische 60-Jahre-Läufe mit Save/Load und zehn versorgte Jahre durch die Engine; historische Haushaltsregeln, Eigentumsvererbung und die folgende 100+-Jahre-Abnahme bleiben offen.
- Bestehende Familien-Kernlogik (echte Kinder, Namensgruppen, Ehepartner-Abhängigkeit) zu Partnersuche, Ausbildung, Ehe, Beruf, Erbe und Tod verknüpfen.
- Demografische Langläufe und Save/Load-Migration nachweisen; Beziehungen und Reputation mit Rats-/Bürgeraufträgen verbinden.
- UI und Browser-E2E für Bürgerentscheidungen, Hotseat und persistente Chronik.
**Definition fertig:** 100+ Simulationsjahre ohne inkonsistente Familien, nachvollziehbare Tests und bedienbare Oberfläche.

## Gate C: kausale historische Simulation (P1–P2)

- Epoche verändert wirtschaftliche Produktion, Berufe, Technik, Militär, Friedenslösungen und Ereignisketten **mechanisch**.
- Dynamische Siedlungen, Transport und Diplomatie mit realen Ressourcenflüssen, nicht nur Beschreibungen.
- Historische Narrationen, Quellen/Unsicherheit und Zwischenszenen sorgfältig einordnen.

## Gate D: Stabilität und Portabilität (P1–P2)

- Performance-Budgets für 5.000+ Bürger, moderne Browser, Touch, Barrierefreiheit.
- Tests, Code-Splitting, Datenbankmigration, Versionierung, lokale/optional Cloud-Speicherung.
- Offene Legacy-Panels erst integrieren, testen und im Status ändern — nicht durch Existenz als abgeschlossen deklarieren.

## Langfristig — Vision (P3)

- Online-Mehrspieler, individuelle Bürgerrollen, Diplomatie, Gemeinschaft.
- Modding, Live-Geschichtsserver, akademische Inhalte und pädagogische Szenarien.
- Mehrsprachen, Spieleplattformen und spätere Desktop-/Mobil-Distribution.
- Optional echte 3D-Schlachten, VR/AR, transhumanistische und futuristische Szenarien bis 2200, parallele Geschichtsverläufe.
Die vollständig erhaltenen 2025/2026-Episoden **Sturm des Mittelalters, Funken der Renaissance, Donner der Revolution, Flammen der Weltkriege, Licht der Moderne, Schatten der Zukunft und Ewigkeit der Geschichte** stehen im [unveränderten Roadmap-Archiv](../outdated/roadmap-snapshot-2026-10-17.md).

## Konkreter Integrationsschritt (17.10.2026)

Drei neue Bürgeraufträge aus den historischen Ideenfeldern Krise, Klima und Kultur werden über die bereits aktive Bürgerauftragsnavigation angeboten. Eine echte Kopplung an Epidemie-, Dürre- und Kunstsystem ist noch offen.

## Themenpakete aus der ursprünglichen README – vollständige Wiedereingliederung

Die alte README wurde auf konkrete, ehemals als „NEU“ deklarierte Bereiche geprüft. Der Status ist **Ideen-/Prototyp-Backlog**, bis eine aktive Hauptspiel-Integration nachgewiesen ist. Die [TODO](../../TODO.md) enthält die einzelnen überprüfbaren Aufgaben; vollständiger Wortlaut im [Original](../outdated/README-snapshot-2026-10-17.md).

| Paket | Früher genannte Funktionsgruppen | Roadmap-Gate |
| --- | --- | --- |
| Rollen und Leben | 15/35 Rollen, Wechsel jeder lebenden Figur, KI-Bürger, Lebensphasen, Tagespläne, Karriere, Ehe, Generationen | B, D |
| Politische Geschichte | 27/70 historische Ereignisse, 10 Persönlichkeiten/Schlachten, 33/53 politische Maßnahmen, 8 Episoden/Dynastien, Ereignisketten | C |
| Gesellschaft | 7/10 Religionen, 8 Kulturen, Migration, Recht, Revolutionen, Soziales, Information, Religion, Bibliothek | B, C |
| Land und Wohlstand | 23/68 Bauten, 24 Technologien, 3 Weltwunder, 10 Handelsrouten, 15 Transportarten, Städte, Ökologie, Tierwelt, Kohorten | C, D |
| Krieg und Frieden | 15 Einheiten, Marine, Wetter, Versorgung, Belagerung, Gefangene, Kriegsanleihen, Friedensverhandlungen, Spionage | C |
| Bildung und Kultur | 11 Kunststile, 12 Feste, 15 Entdeckungen, Gerichte, Universitäten, Bibliotheken, mediale Kommunikation | C |
| Mehrspieler/Technik | 6 Online-Spieler, Bots, Chat, Lobby, Wikipedia-Kontext, Modding, weitere Perspektiven und 3D | D, langfristig |
| Zukunft | 2050/2080/2100/2200, alternative Ereignisse, Raumfahrt und utopische/technische Szenarien | langfristig |

Die früheren Zahlen sind **Prüfziele aus alten Unterlagen**, keine bestätigten Live-Feature-Zahlen. Alle Quellcode-Module müssen schrittweise über Engine, aktive UI, Persistenz und Tests in die Standardkampagne integriert werden.

## Abnahmeregel pro Ticket

Kernlogik + UI-Erreichbarkeit + Tests + Savegame-Verhalten (falls zustandsbehaftet) + Dokumentation; Veröffentlichung zusätzlich mit echtem Server-/Gerätenachweis. `main`-Merge != Internet-Deployment.
