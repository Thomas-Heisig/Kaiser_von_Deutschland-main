# Historisches Datenmodell — Epochen, Regionen, Systeme, Ämter

**Stand:** 24.10.2026 · **Status:** In die Engine integriert (Schritt 2) · **Version:** 0.2.0

Dieses Dokument beschreibt das historische Datenmodell aus
[`src/history/`](../../src/history/) **und seine Anbindung an das Spiel** über
[`src/core/HistoricalContext.ts`](../../src/core/HistoricalContext.ts).

---

## 0. Integrationsstand

| Ebene | Datei | Rolle |
| --- | --- | --- |
| Datenmodell | `src/history/PolityModel.ts`, `PolityData.ts` | Deklarative Daten + Validierung |
| **Brücke** | `src/core/HistoricalContext.ts` | Jahre → Epoche/System/Würde, Evidenz, System-Mapping |
| **Engine** | `GameEngine.getHistoricalContext()`, `getRulerDignity()` | Öffentliche API, Epochenwechsel-Event |
| **UI** | `KingdomGameUI` (`#era-label`, `#ruler-dignity`) | Sichtbare Einordnung mit Evidenzgrad |
| Tests | `PolityModel.test.ts` (31), `HistoricalContext.test.ts` (13), `GameEngine.test.ts` (+5) | 49 Tests gesamt |

**Wichtig:** Das Modell ist **kein** isoliertes Modul mehr. Es ist über die
Brücke fest in der Engine verankert. Die **Simulation** bleibt unverändert: Das
Modell liefert ausschließlich einordnende Information, es greift nicht in
Ressourcen, Kampagnen oder Spielstände ein.

---

## 1. Zweck und Abgrenzung

| Gehört zu diesem Umfang | Gehört **nicht** dazu |
| --- | --- |
| Deklarative Daten (Epochen, Regionen, Systeme, Ämter) | Änderung von Spielregeln oder Balance |
| Validierung mit deutschen Fehlermeldungen | Karten-, Renderer- oder Retro-Änderungen |
| Engine-Anbindung (Kontext, Würde, Epochenwechsel) | Automodus / Menschheitssimulation (später) |
| Sichtbare Einordnung mit Evidenzgrad | Online-Multiplayer, PWA |

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
  sourceNote: string;
}
```

**Begründung:** `evidence` und `sourceNote` sind Pflichtfelder — keine
Jahresgrenze kann „still" ungeprüft bleiben. Epochen mit
`nicht_verifiziert` liefern bei `epochForHistoricalYear()` bewusst `null`.

### 2.2 Regionen (`HistoricalRegion`)

```ts
interface HistoricalRegion {
  id: string; name: string; description: string;
  epochIds: string[];          // leer = epochenunabhängig nutzbar
  evidence: EvidenceLevel; sourceNote: string;
}
```

**Begründung:** **Keine** Felder für Polygone, Koordinaten, `bounds` oder
`geometry`. Ein Test erzwingt diese Abwesenheit. `germanien` ist eine neutrale
Platzhalter-Region mit `nicht_verifiziert`.

### 2.3 Politische Systeme (`PoliticalSystem`)

```ts
interface PoliticalSystem {
  id: string; name: string;
  kind: 'verband' | 'monarchie' | 'republik' | 'bund' | 'diktatur';
  epochIds: string[];          // maßgebliche Bindung
  regionIds: string[]; description: string;
  evidence: EvidenceLevel; sourceNote: string;
}
```

`kind` ist eine **wertungsfreie Kategorie**, keine Hierarchie.

### 2.4 Ämter (`Office`)

```ts
interface Office {
  id: string; name: string;
  systemIds: string[];         // Bindung an System
  epochIds: string[];          // UND an Epoche
  description: string; evidence: EvidenceLevel; sourceNote: string;
}
```

Kein Amt trägt `year`/`yearStart`/`yearEnd` — das erzwingt ein Test.

### 2.5 Brücke (`HistoricalContext`)

```ts
interface HistoricalContext {
  year: number;
  epoch: HistoricalEpoch | null;
  epochEvidence: EvidenceLevel;
  system: PoliticalSystem | null;
  rulerDignity: Office | null;
  summary: string;
  alternateHistory: boolean;   // im Spiel immer true
}
```

---

## 3. Validierungs- und Auflösungsregeln

| Regel | Funktion | Prüft |
| --- | --- | --- |
| **R1** Epoche ↔ System | `validateEpochSystem` | Ist das System für die Epoche belegt? |
| **R2** System ↔ Amt | `validateOffice` | Existiert das Amt in System **und** Epoche? |
| **R3** Region ↔ Epoche | `validateRegionEpoch` | Region für Epoche sinnvoll (oder epochenunabhängig)? |
| **R4** Kombination | `validateCombination` | Sammelt alle Fehler aus R1–R3 |
| **A1** Jahr → Epoche | `epochForHistoricalYear` | `null` bei `nicht_verifiziert` |
| **A2** Epoche → System | `referenceSystemFor` | Reichhaltigstes belegtes System, deterministisch |
| **A3** Rang → Würde | `dignityFor(rank, epochId)` | Präferenzliste, nur belegte Amts-Epochen-Paare |

### Rang-zu-Würde-Mapping (explizit, nicht alphabetisch)

| Spielrang | Präferenzfolge | Ergebnis im Hochmittelalter |
| --- | --- | --- |
| 1 | Stammesoberhaupt | Stammesoberhaupt |
| 2 | Herzog | Herzog |
| 3 | Herzog → König | Herzog |
| 4 | König | König |
| 5 | Kaiser → König | König (Kaiser nicht im Hochmittelalter belegt) |
| 6–7 | Römisch-deutscher Kaiser → Deutscher Kaiser | Kaiser / Deutscher Kaiser je Epoche |
| 8 | Bundespräsident → Bundeskanzler → Reichspräsident → Reichskanzler | `null` im Mittelalter |

**Kein teleologisches Fortschreiben:** Rang 6 ergibt 1600 „Römisch-deutscher
Kaiser", 1900 aber „Deutscher Kaiser" — zwei getrennte Ämter.

### Abgewiesene Kombinationen

| Eingabe | Ergebnis |
| --- | --- |
| `validateOffice('bundeskanzler', 'kaisertum_hrr', 'hochmittelalter')` | ❌ zwei Fehler (System + Epoche) |
| `validateOffice('herzog','herzogtum','bundesrepublik_vereint')` | ❌ „nicht belegt" |
| `dignityFor(8, 'hochmittelalter')` | `null` |
| `epochForHistoricalYear(-500)` | `null` (Frühzeit ungeprüft) |

---

## 4. Engine- und UI-Anbindung

| API | Verhalten |
| --- | --- |
| `engine.getHistoricalContext(playerId)` | Vollständiger Kontext mit Evidenz |
| `engine.getRulerDignity(playerId)` | Nur die Würde (für häufige Anzeige) |
| Event `historicalEpochChanged` | Wird beim Jahreswechsel gefeuert, **nur** wenn sich die belegte Epoche ändert; schreibt zusätzlich in die Chronik |
| UI `#era-label` | Zeigt Kampagnen-Epoche; bei Abweichung zusätzlich die historische Epoche mit Evidenzzusatz („Grenzen genähert"/„Grenzen ungeprüft") |
| UI `#ruler-dignity` | „Historische Würde: …" oder „nicht belegt" |

Die UI behauptet **keine** Gleichsetzung von Kampagnen- und Modell-Epoche: Bei
Abweichung werden beide genannt.

---

## 5. Getroffene Annahmen

1. „Deutschland" ist eine geografisch-kulturelle Region, kein zeitloser Staat.
2. **Zwei getrennte Kaiserämter** (`kaiser` bis 1806, `deutscher_kaiser` ab 1871) — ein Test deckte die ursprüngliche Vermischung auf.
3. Diktaturen werden als `kind: 'diktatur'` geführt, ausdrücklich nicht als Aufstiegsstufe.
4. Eigene Epochen für NS-Zeit und DDR, damit Ämter sauber zuordenbar bleiben.
5. Keine Amtskontinuität über Systemgrenzen.
6. Regionen ohne Geometrie.
7. **Das Spiel bleibt Alternativgeschichte** (`alternateHistory: true`): Das Modell ist Referenzrahmen, keine Vorschrift für den Spielverlauf.

---

## 6. Als „nicht verifiziert" markierte Punkte

| Datensatz | Grad | Grund |
| --- | --- | --- |
| Epoche `fruehzeit` | `nicht_verifiziert` | Archäologische Periodisierung, keine Jahresgrenze |
| Region `germanien` | `nicht_verifiziert` | Antike Fremdbezeichnung ohne deckungsgleiches Gebiet |
| Alle Regionen | `naeherung` | Kulturräume ohne exakt datierbare Grenze |
| `hochmittelalter`, `spaetmittelalter`, `fruehe_neuzeit` | `naeherung` | Start/Ende sind Konvention |
| `praesidialrepublik` | `naeherung` | Forschungsdeutung, keine amtliche Bezeichnung |
| `stammesverband`, `herzogtum`, `staedtebund` | `naeherung` | Lückenhafte Quellenlage |
| `kurfuerst` | `naeherung` | Kollegium verfestigte sich schrittweise (Goldene Bulle 1356) |
| `buergermeister`, `bundesversammlungs_delegierter` | `naeherung` | Bezeichnungen variierten regional |

**Ungeprüft (nicht behauptet):** Vollständigkeit der Epochenliste (Rheinbund
1806–1813, Norddeutscher Bund 1867–1870 fehlen), regionale Herrschaftsstrukturen,
Ämter jenseits der Beispiele, Rechtsgrundlagen und Kompetenzabgrenzungen,
Kontinuität der Rangfolge im Spielsystem.

---

## 7. Verifizierte Jahresangaben

843 Verdun · 911 Ende der Karolinger · 962 Kaiserkrönung Ottos I. · 1806 Ende
des Reiches · 1815/1866 Deutscher Bund · 1871/1918 Kaiserreich · 1919/1933
Weimar · 1933/1945 NS-Diktatur · 1949 Grundgesetz & DDR · 1990 Wiedervereinigung.

Quellen (Auswahl): Deutschlandmuseum (962), bpb (1871, Verfassungen ab 1806),
Wikipedia/Heraldik-Wiki (843, 911). Je Datensatz in `sourceNote` begründet.

---

## 8. Tests

| Datei | Anzahl | Inhalt |
| --- | --- | --- |
| `PolityModel.test.ts` | 31 | Struktur, R1–R4, Jahreszuordnung, Amtsabfrage, Evidenzgrade, keine Polygone, keine Jahresbindung |
| `HistoricalContext.test.ts` | 13 | Jahr→Epoche, `null` bei ungeprüft, Systemwahl deterministisch, Rang→Würde, Kaiser-Trennung, Alternativgeschichte |
| `GameEngine.test.ts` | +5 | `getHistoricalContext`, `getRulerDignity`, `historicalEpochChanged` (1908→1919), Chronik-Eintrag, `null`-Epoche bei 700 |

Ergebnis: `npm run check` ✅ · `npx vitest run` ✅ **234 Tests bestanden**
(7 übersprungen: bash-abhängige CI-Deploy-Tests unter Windows) · Build ✅

---

## 9. Nächster sinnvoller Schritt

1. **Automodus / Menschheitssimulation** (vom Nutzer angekündigt): Das Modell
   liefert dafür bereits die zeitliche Struktur. Offen ist, ob der Automodus
   die **belegte** Epoche als Startpunkt nutzt oder bewusst alternative
   Verläufe erzeugt — Letzteres sollte sichtbar gekennzeichnet bleiben.
2. **Epochenliste ergänzen:** Rheinbund (1806–1813), Norddeutscher Bund
   (1867–1870) — beide belegt.
3. **Karte mit Zoom und Klartendarstellung:** Das Modell liefert weiterhin
   **keine** Geometrie. Nötig ist eine eigene Entscheidung: (a) grober, als
   Annäherung gekennzeichneter Regionsumriss oder (b) rein schematisches,
   nicht-geografisches Layout. Variante **(b)** hält „keine erfundenen Grenzen"
   am saubersten ein.
4. **Regionen erweitern** (Pommern, Posen, Elsass) nur mit belastbarer Quelle.


Dieses Dokument beschreibt das deklarative Datenmodell aus
[`src/history/`](../../src/history/). Es ist **vom Spielcode getrennt** und in
diesem Schritt bewusst **nicht** an `GameEngine`, Karte, UI oder Kampagnen
angebunden.

---
