# Historisches Datenmodell — Epochen, Regionen, Systeme, Ämter

**Stand:** 24.10.2026 · **Status:** Erster Schritt umgesetzt · **Version:** 0.1.0

Dieses Dokument beschreibt das deklarative Datenmodell aus
[`src/history/`](../../src/history/). Es ist **vom Spielcode getrennt** und in
diesem Schritt bewusst **nicht** an `GameEngine`, Karte, UI oder Kampagnen
angebunden.

---

## 1. Zweck und Abgrenzung

| Gehört zu diesem Schritt | Gehört **nicht** zu diesem Schritt |
| --- | --- |
| Deklarative Daten (Epochen, Regionen, Systeme, Ämter) | GameEngine-Regeln oder Simulation |
| Validierungsfunktionen mit deutschen Fehlermeldungen | Karten-, Renderer- oder Retro-Änderungen |
| Unit-Tests für gültige/ungültige Kombinationen | UI, Menüs oder Tutorial-Anbindung |
| Diese Dokumentation | PWA, Deployment oder Online-Multiplayer |

Das Modul ist ein **Fundament**. Es behauptet keine Spielmechanik und keine
historische Vollständigkeit.

---

## 2. Datenmodell

### 2.1 Epochen (`HistoricalEpoch`)

```ts
interface HistoricalEpoch {
  id: string;
  name: string;
  yearStart: number;
  yearEnd: number | null;      // null = offenes Ende
  evidence: EvidenceLevel;     // 'belegt' | 'naeherung' | 'nicht_verifiziert'
  description: string;
  sourceNote: string;          // Begründung des Evidenzgrads
}
```

**Begründung der Feldstruktur**

- `yearStart`/`yearEnd` erlauben die rein informatorische Jahreszuordnung
  (`epochForHistoricalYear`), ohne sie zur Validierungsgrundlage zu machen.
- `evidence` ist ein Pflichtfeld. Damit ist jede Jahresgrenze gezwungen, ihren
  Belastbarkeitsgrad offenzulegen – es gibt keinen „stillen" ungeprüften Wert.
- `sourceNote` dokumentiert die Herkunft direkt am Datensatz, nicht nur in
  externer Prosa.

**Wichtig:** Epochen mit `evidence: 'nicht_verifiziert'` liefern bei
`epochForHistoricalYear()` bewusst `null`. Es wird also **keine** Zuordnung
behauptet, wo keine belastbare Grenze existiert.

### 2.2 Regionen (`HistoricalRegion`)

```ts
interface HistoricalRegion {
  id: string;
  name: string;
  description: string;
  epochIds: string[];          // leer = epochenunabhängig nutzbar
  evidence: EvidenceLevel;
  sourceNote: string;
}
```

**Begründung der Feldstruktur**

- **Keine** Felder für Polygone, Koordinaten, `bounds` oder `geometry`. Eine
  belastbare historische Grenze lässt sich für die meisten Epochen nicht als
  Fläche angeben; Grenzpolygone würden eine Präzision vortäuschen, die die
  Quellen nicht hergeben. Ein Test erzwingt diese Abwesenheit.
- `epochIds: []` kennzeichnet geografische Kulturräume, die als
  Bezugsgröße in allen Epochen taugen (z. B. Rheinland).
- `germanien` ist eine **neutrale Platzhalter-Region** mit
  `evidence: 'nicht_verifiziert'`. Sie behauptet ausdrücklich keinen
  Grenzverlauf und dient nur als Lückenfüller.

### 2.3 Politische Systeme (`PoliticalSystem`)

```ts
interface PoliticalSystem {
  id: string;
  name: string;
  kind: 'verband' | 'monarchie' | 'republik' | 'bund' | 'diktatur';
  epochIds: string[];          // maßgebliche zeitliche Bindung
  regionIds: string[];
  description: string;
  evidence: EvidenceLevel;
  sourceNote: string;
}
```

**Begründung der Feldstruktur**

- `epochIds` ist die **maßgebliche** Bindung. Jahreszahlen sind nur
  beschreibend und werden für die Validierung nicht herangezogen.
- `kind` ist eine **wertungsfreie Kategorie**, keine Hierarchie. Es gibt keine
  Stufenfolge „Verband → Monarchie → Republik".

### 2.4 Ämter (`Office`)

```ts
interface Office {
  id: string;
  name: string;
  systemIds: string[];         // Bindung an das System
  epochIds: string[];          // Bindung an die Epoche
  description: string;
  evidence: EvidenceLevel;
  sourceNote: string;
}
```

**Begründung der Feldstruktur**

- Ein Amt ist **nie** an eine Jahreszahl gebunden. `systemIds` **und**
  `epochIds` müssen beide erfüllt sein. Genau das verhindert „Bundeskanzler im
  Jahr 1200" und „Kaiser in einer Republik".
- Ein Test erzwingt, dass kein Amt Felder wie `year`, `yearStart` oder
  `yearEnd` besitzt.

---

## 3. Validierungsregeln

Alle Funktionen liegen in [`PolityModel.ts`](../../src/history/PolityModel.ts)
und geben `ValidationResult { valid, errors }` mit **deutschen**
Fehlermeldungen zurück.

| Regel | Funktion | Prüft |
| --- | --- | --- |
| **R1** Epoche ↔ System | `validateEpochSystem(epochId, systemId)` | Ist das System für diese Epoche belegt? |
| **R2** System ↔ Amt | `validateOffice(officeId, systemId, epochId)` | Existiert das Amt in System **und** Epoche? |
| **R3** Region ↔ Epoche | `validateRegionEpoch(regionId, epochId)` | Ist die Region für die Epoche sinnvoll (oder epochenunabhängig)? |
| **R4** Gesamtkombination | `validateCombination({…})` | Sammelt alle Fehler aus R1–R3 |

Zusätzlich:

- `epochForHistoricalYear(year)` → Epoche oder `null` (bei `nicht_verifiziert`).
- `officesFor(epochId, systemId)` → alphabetisch sortierte, gültige Ämterliste.

### Beispiele für abgewiesene Kombinationen

| Eingabe | Ergebnis |
| --- | --- |
| `validateOffice('bundeskanzler', 'kaisertum_hrr', 'hochmittelalter')` | ❌ „Das Amt "Bundeskanzler" existiert nicht im System …" und „… ist in der Epoche … nicht belegt." |
| `validateOffice('kaiser', 'parlamentarische_republik', 'bundesrepublik_vereint')` | ❌ „Das Amt "Römisch-deutscher Kaiser" existiert nicht im System …" |
| `validateOffice('herzog', 'herzogtum', 'bundesrepublik_vereint')` | ❌ „… ist in der Epoche … nicht belegt." |
| `validateEpochSystem('hochmittelalter', 'konstitutionelle_monarchie')` | ❌ „Das System "Konstitutionelle Monarchie" ist für die Epoche … nicht belegt." |
| `validateRegionEpoch('hansestaedte', 'bundesrepublik_vereint')` | ❌ „Die Region "Hansestädte" ist für die Epoche … nicht belegt." |

---

## 4. Getroffene Annahmen

1. **„Deutschland" ist eine geografisch-kulturelle Region**, kein zu allen
   Zeiten existierender Nationalstaat. Die Epochenliste führt deshalb
   unterschiedliche politische Gebilde (Ostfrankenreich, Reich, Deutscher
   Bund, Kaiserreich, Weimarer Republik, NS-Diktatur, Bundesrepublik, DDR)
   nebeneinander bzw. nacheinander – ohne Kontinuitätsbehauptung.
2. **Zwei getrennte Kaiserämter.** `kaiser` (römisch-deutsch, 962–1806) und
   `deutscher_kaiser` (ab 1871) sind bewusst **verschiedene** Datensätze. Das
   vermeidet das teleologische Narrativ einer durchgehenden Kaiserlinie.
   Dieser Fehler wurde durch einen Test aufgedeckt und korrigiert.
3. **Diktaturen werden als solche geführt** (`kind: 'diktatur'`), nicht als
   Aufstiegsstufe. Es gibt keine Glorifizierung und keine Wertung im Modell.
4. **NS-Zeit und DDR** erhalten eigene Epochen, damit Ämter und Systeme
   sauber zugeordnet werden können, ohne sie mit Demokratien zu vermischen.
5. **Keine Amtskontinuität über Systemgrenzen.** Ein Amt gilt nur in den
   explizit gelisteten Systemen – auch wenn die Bezeichnung ähnlich klingt.
6. **Regionen ohne Geometrie.** Wo Kulturräume nicht exakt abgrenzbar sind,
   bleibt das Feld leer statt eine Grenze zu erfinden.

---

## 5. Als „nicht verifiziert" markierte Punkte

| Datensatz | Kennzeichnung | Grund |
| --- | --- | --- |
| Epoche `fruehzeit` | `nicht_verifiziert` | Vorgeschichte wird über archäologische Periodisierung, nicht über Jahreszahlen bestimmt. |
| Region `germanien` | `nicht_verifiziert` | „Germanien" ist eine antike Fremdbezeichnung ohne deckungsgleiches politisches Gebiet. Bewusst Platzhalter. |
| Alle Regionen | `naeherung` | Kulturräume haben keine exakt datierbare Grenze. |
| Epochen `hochmittelalter`, `spaetmittelalter`, `fruehe_neuzeit` | `naeherung` | Start bzw. Ende sind Forschungskonvention, kein amtliches Datum. |
| `praesidialrepublik` | `naeherung` | „Präsidialrepublik" ist eine Deutung der Forschung für die Endphase der Weimarer Republik, keine amtliche Bezeichnung. |
| `staedtebund`, `stammesverband`, `herzogtum` | `naeherung` | Quellenlage zu konkreten Organisationsformen und Mitgliedschaften ist lückenhaft. |
| `kurfuerst` | `naeherung` | Das Wahlkollegium verfestigte sich schrittweise; Verfahren erst 1356 (Goldene Bulle) geregelt. |
| `bundesversammlungs_delegierter` | `naeherung` | Bezeichnung der Entsandten variierte; die Bundesversammlung war das einzige Bundesorgan. |
| `buergermeister` | `naeherung` | Städtische Leitungsämter sind belegt, die Bezeichnung variierte regional stark. |

**Nicht** in diesem Schritt geprüft (ungeprüft, nicht behauptet):

- Vollständigkeit der Epochenliste (z. B. fehlen eigenständige Einträge für
  Kurfürstentümer, Rheinbund 1806–1813, Norddeutscher Bund 1867–1870).
- Regionale Herrschaftsstrukturen innerhalb einzelner Epochen.
- Ämter jenseits der exemplarisch aufgenommenen Beispiele.
- Rechtsgrundlagen und Kompetenzabgrenzungen der Ämter im Detail.

---

## 6. Verifizierte Jahresangaben

Recherchiert am 24.10.2026 gegen öffentlich zugängliche Fach- und
Institutionsquellen:

| Jahr | Ereignis | Verwendung |
| --- | --- | --- |
| 843 | Vertrag von Verdun (Ostfrankenreich) | Start `fruehmittelalter` |
| 911 | Ende der ostfränkischen Karolinger | Ende `fruehmittelalter` |
| 962 | Kaiserkrönung Ottos I. | Beleg für `kaisertum_hrr` |
| 1806 | Ende des Heiligen Römischen Reiches | Ende `fruehe_neuzeit` |
| 1815 | Wiener Kongress (Deutscher Bund) | Start `deutscher_bund` |
| 1866 | Ende des Deutschen Bundes | Ende `deutscher_bund` |
| 1871 | Kaiserproklamation (18.01.) | Start `kaiserreich` |
| 1918 | Ende des Kaiserreichs | Ende `kaiserreich` |
| 1919 | Weimarer Verfassung (11.08.) | Start `weimarer_republik` |
| 1933 | Etablierung der NS-Diktatur | Start `nationalsozialismus` |
| 1945 | Kapitulation | Ende `nationalsozialismus` |
| 1949 | Grundgesetz (23.05.) / DDR-Gründung (07.10.) | Start beider Staaten |
| 1990 | Wiedervereinigung (03.10.) | Ende `bundesrepublik`/`ddr` |

Quellen (Auswahl): Deutschlandmuseum (962), bpb (Kaiserreich 1871,
Verfassungen ab 1806), Wikipedia/Heraldik-Wiki (Vertrag von Verdun 843,
Ostfrankenreich 911). Die Jahreszahlen sind in `sourceNote` je Datensatz
begründet.

---

## 7. Tests

[`PolityModel.test.ts`](../../src/history/PolityModel.test.ts) — **31 Tests**:

- **Struktur:** Initialisierung, ID-Eindeutigkeit, keine hängenden Referenzen.
- **R1 Epoche ↔ System:** gültige Kombination, ungültige Kombination,
  unbekannte IDs mit deutschen Meldungen.
- **R2 System ↔ Amt:** gültig; „Bundeskanzler im Jahr 1200"; „Kaiser in einer
  Republik"; „Herzog in der Moderne"; richtiges System mit falscher Epoche;
  Trennung römisch-deutscher Kaiser vs. Deutscher Kaiser.
- **R3 Region ↔ Epoche:** epochenunabhängig, eigene Epoche, fremde Epoche,
  unbekannte IDs.
- **R4 Kombination:** vollständig konsistent; Sammlung mehrerer Fehler.
- **Jahreszuordnung:** belegte Jahre, `null` bei `nicht_verifiziert`, `null`
  außerhalb des Modells.
- **Amtsabfrage:** Filterung, leere Liste, alphabetische Sortierung.
- **Evidenzgrade:** Pflichtfeld, mindestens ein `nicht_verifiziert`,
  **Abwesenheit von Grenzpolygonen**, **keine Jahresbindung an Ämtern**.

Ergebnis: `npm run check` ✅ · `npx vitest run` ✅ (31/31 für dieses Modul).

---

## 8. Nächster sinnvoller Schritt

Vor dem zweiten Schritt zu klären:

1. **Rheinbund (1806–1813) und Norddeutscher Bund (1867–1870)** ergänzen?
   Beide sind belegt, aber im aktuellen Epochenraster nicht eigenständig
   geführt.
2. **Regionen-Liste erweitern** (z. B. Pommern, Posen, Elsass) – nur mit
   belastbarer Quelle und ohne Grenzpolygone.
3. **Amts-Vollständigkeit:** Sollen Reichsstände, Landtage, Ministerien
   systematisch erfasst werden?
4. **Anbindung an das Spiel** erst nach Freigabe: Das Modell ist bewusst noch
   nicht mit `GameEngine`, `Kingdom` oder der Karte verbunden. Eine Anbindung
   würde die bestehende Simulation berühren und braucht eine eigene
   Entscheidung (Feature-Flag oder separater Branch).
5. **Kartendarstellung und Zoom:** Das aktuelle Modell liefert *keine*
   Geometrie. Für eine Karte mit Zoom wären zusätzlich entweder
   (a) ein bewusst grober, klar als Annäherung gekennzeichneter
   Regionsumriss oder (b) eine rein schematische, nicht-geografische
   Anordnung nötig. Beides ist eine eigene Produktentscheidung und **nicht**
   Teil dieses Schritts.
