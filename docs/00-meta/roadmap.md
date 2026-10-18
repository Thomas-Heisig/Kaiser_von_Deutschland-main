# Roadmap — Kaiser von Deutschland

## Aktiver Entwicklungsplan · Stand 17.10.2026

## Leseregel

Die [TODO](../../TODO.md) ist die *einzige operative Aufgabenliste*. Diese Roadmap zeigt Abhängigkeiten und Entwicklungsziele, **kein selbst attestiertes Fertigstellungsprotokoll**. [Status](status.md) beschreibt ausschließlich nachprüfbare Ergebnisse. Frühere Visionen, Zeitpläne und alle Ideen der bisherigen Dokumentation wurden vollständig archiviert: [Original-Roadmap](../outdated/roadmap-snapshot-2026-10-17.md), [Original-TODO](../outdated/TODO-snapshot-2026-10-17.md), [README-Ideen](backlog-from-readme.md). Keine historischen Ideen wurden gestrichen.

## P1-Balancing-Befund (18.10.2026)
Die monatliche Spielschleife verwendete bisher keine jahreszeitliche Ernte- und Holzproduktion, obwohl der alte Jahrespfad solche Faktoren vorsah. Die monatliche Prognose und die Buchung berücksichtigen nun übereinstimmend Winter und Sommer. Mehrjährige Balance-Kalibrierung bleibt offen.

## P1-Testabdeckung (17.10.2026)
Eine Industriekampagne wird automatisiert mit echten Bauten, Forschung, Save/Load und Sieg getestet. Ein zusätzlicher 60-Monats-Lauf sichert endliche Werte und zentrale Grenzen. Andere Kampagnen, echte Niederlagebedingungen, freie Wirtschaftsbalance und Lasttests bleiben offen.

## Gameplay-P1-Befunde (17.10.2026)

- Industrie und Wiederaufbau hatten Startinfrastruktur, die einen Großteil des ersten Kapitels ohne Spielerhandlung erfüllte; Anfangsziele verschärft.
- Die Zielanzeige verwendete bislang globale Ziel-Schwellen anstelle abgeschlossener Kapitel für die Siegmeldung. Siegstatus und Fortschrittsanzeige sind jetzt an Kapitelabschluss gebunden.
- Noch offen: vollständiger automatisierter Spielabschluss, mehrjährige Wirtschaftsbalance und reale Niederlagebedingungen.

## Kartenoberfläche (18.10.2026)
Vollflächige Siedlungskarte unter transparenten Panels, Kartenfilter, Bezirksausbau und Zoom als Grafik-Overlays implementiert. Die zuvor duplizierte Gebäudeliste entfällt; Nachbarreiche erscheinen schematisch am Kartenrand. Echte geopolitische Grenzen und Endgeräteabnahme bleiben offen.

## Karte – genehmigte Grafikrichtung, Phase 2 (18.10.2026)

**Freigegeben:** Variante A mit Kenney Sketch Town als Referenz, Jahr 1200, 16 feste Bezirke (keine freie Bebauung), vorhandenes PixiJS 8 und unveränderte GameEngine. Zwei Apple-Testgeräte (iPad/iPhone) stehen beim Nutzer für spätere manuelle Tests bereit. Ein Prototyp ist **noch nicht erstellt**, Performance auf Geräten **ungeprüft**. [Renderer- und Prototyp-Plan](../05-technical-architecture/RENDERER.md) · [Asset-Lizenzmanifest](../05-technical-architecture/ASSETS.md).

**Reihenfolge:** konkretes Pack inventarisieren und Rechte nachweisen → isolierte 144-Kachel-Werkstattszene → CI/Browserbuild → echte iPad-/iPhone-Messung → bei Bestehen genau einen bestehenden Bezirk optisch umstellen. Rendering bleibt ein separates Vorhaben, das P1-Kampagnenqualität nicht als abgeschlossen ersetzt.

## Gameplay-Freigabereihenfolge (verbindlich)

1. **Kampagnenabschluss als End-to-End-Ablauf:** Start, Bau, Handel, Forschung, Reichsrat, Monatswechsel, Save/Load, Sieg und Niederlage.
2. **Langzeit-Balancing:** viele Spieljahre und reale Wechselwirkungen messen, statt nur Funktionen zu zählen.
3. **Systemintegration:** Forschung/Handel/Kultur/Diplomatie/Rivalen als wechselseitige strategische Entscheidungen.
4. **Tutorial, reaktive Rivalen und dauerhafte Chronik:** Chronikspeicherung ist implementiert, E2E und Tutorial stehen aus.
5. **Qualität:** Mobile/Barrierefreiheit, Hotseat und große Bevölkerungen. Erst danach neue große Legacy-Systeme erweitern.

Diese Reihenfolge betrifft die Gameplay-Arbeit; HTTPS/PWA bleibt unabhängig als blockiertes Veröffentlichungs-Gate P0 offen.

## Jetzt — Gate A: zuverlässige Veröffentlichung (P0)

**Ziel:** eine nachweislich erreichbare HTTPS-PWA mit echter Offline-Nutzung.

1. Pages-Berechtigung in privatem Repo klären oder anderes HTTPS-Hosting verbinden.
2. HTTPS, Service-Worker-Scope, PWA-Manifest, PNG-Icons, MP3-/Video-Status 200/206 und Installation messen.
3. Medienrechte, Credits, Datenschutz und vollständiges Impressum vor öffentlicher Freigabe.
**Vorhanden:** automatischer Build, Veröffentlichungsworkflow, Offline-ZIP, Medien-Gate, 15 MP3s, 5 Videos. **Blocker:** GitHub Pages `Resource not accessible by integration`.

## Danach — Gate B: lebendige Generationen (P1)

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
