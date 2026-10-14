# Grundannahmen der Simulation

## Einleitung

Dieses Dokument beschreibt die fundamentalen Annahmen, auf denen die Simulation von "Kaiser von Deutschland" basiert. Diese Annahmen sind bewusste Vereinfachungen der Realität, die notwendig sind, um ein spielbares und verständliches System zu schaffen.

## Ökonomische Annahmen

### 1. Rationales Verhalten

**Annahme**: Akteure (Bürger, Händler, etc.) handeln grundsätzlich rational im eigenen Interesse.

**Realität**: Menschen handeln oft irrational, emotional oder altruistisch.

**Begründung**: Vereinfacht die Simulation und macht Verhalten vorhersagbarer. Irrationales Verhalten kann durch Zufalls-Events simuliert werden.

**Einschränkung**: Wird durch "Zufriedenheits"-Werte und soziale Faktoren modifiziert.

### 2. Imperfekte Information

**Annahme**: Akteure haben **unvollständige** Information über Märkte und andere Spieler.

**Realität**: Informationsasymmetrie ist ein zentrales Element realer Märkte.

**Umsetzung**: 
- Händler kennen nur lokale Preise
- Informationsverbreitung dauert Zeit
- Spionage kann zusätzliche Information beschaffen

### 3. Angebot und Nachfrage

**Annahme**: Preise werden durch **Angebot und Nachfrage** bestimmt.

**Modell**: Vereinfachtes lineares Modell mit Preis-Elastizität.

**Formel**: `Preis = Basispreis × (Nachfrage / Angebot)`

**Grenzen**: 
- Ignoriert Marktmacht und Monopole (teilweise)
- Keine spekulativen Märkte
- Keine Finanzderivate

### 4. Produktionsfaktoren

**Annahme**: Produktion erfordert **Arbeit, Kapital und Boden/Ressourcen**.

**Umsetzung**:
- Arbeit = Anzahl Arbeiter × Produktivität
- Kapital = Gebäude, Werkzeuge (Gold-Äquivalent)
- Boden = Ressourcen (Holz, Stein, Eisen, Nahrung)

**Vereinfachung**: Cobb-Douglas-Produktionsfunktion mit festen Koeffizienten.

### 5. Technologischer Fortschritt

**Annahme**: Technologie erhöht die **Produktivität** dauerhaft.

**Modell**: 
- Technologien geben feste Prozent-Boni
- Boni sind kumulativ
- Kein "Vergessen" von Technologie

**Grenzen**: Ignoriert Technologie-Adoption-Kurven und regionale Unterschiede (teilweise).

## Demografische Annahmen

### 6. Bevölkerungswachstum

**Annahme**: Bevölkerungswachstum hängt von **Lebensqualität** ab.

**Modell**: 
- Geburtenrate steigt mit Wohlstand (bis zu einem Maximum)
- Sterberate sinkt mit Gesundheitsversorgung
- Netto-Wachstum = Geburten - Todesfälle + Migration

**Basis**: Vereinfachtes Malthus-Modell mit modernen Korrekturen.

### 7. Lebenserwartung

**Annahme**: Lebenserwartung steigt mit **Technologie und Wohlstand**.

**Epochen**:
- Antike: ~35 Jahre
- Mittelalter: ~30 Jahre (Seuchen!)
- Frühe Neuzeit: ~40 Jahre
- Industrialisierung: ~50 Jahre
- Moderne: ~75 Jahre
- Zukunft: ~85+ Jahre

**Variation**: ±10 Jahre basierend auf Gesundheit, Kriegen, Seuchen.

### 8. Soziale Mobilität

**Annahme**: Bildung ermöglicht **sozialen Aufstieg**.

**Mechanik**:
- Kinder erben meist Beruf der Eltern
- Bildung erhöht Chance auf besseren Beruf
- Epochenabhängig: Mittelalter sehr starr, Moderne mobiler

### 9. Migration

**Annahme**: Menschen migrieren für **bessere Lebensbedingungen**.

**Push-Faktoren**: Krieg, Armut, Verfolgung, Seuchen  
**Pull-Faktoren**: Arbeit, Wohlstand, Sicherheit, Religionsfreiheit

**Modell**: Migrations-Wahrscheinlichkeit steigt mit Wohlstands-Differenz.

## Politische Annahmen

### 10. Machtstrukturen

**Annahme**: Politische Macht folgt **hierarchischen Strukturen**.

**Epochen**:
- Antike/Mittelalter: Feudale Hierarchie (Kaiser → König → Herzog → Bauer)
- Moderne: Demokratische Strukturen mit Gewaltenteilung
- Zukunft: Hybrid aus Demokratie und Technokratie

**Vereinfachung**: Keine komplexen Verfassungsmodelle.

### 11. Diplomatie

**Annahme**: Beziehungen zwischen Reichen sind **rational und interessenbasiert**.

**Faktoren**:
- Machtverhältnisse
- Wirtschaftliche Interdependenz
- Kulturelle Nähe
- Historische Ereignisse

**Mechanik**: Vertrauens- und Beziehungs-Werte (0-100).

### 12. Kriegsführung

**Annahme**: Kriege kosten **Ressourcen und Leben**, bringen aber auch **Territorium und Beute**.

**Modell**:
- Streitkräfte-Stärke bestimmt Siegchancen
- Verluste auf beiden Seiten
- Wirtschaftliche Kosten (Gold, Produktion)
- Moralische Kosten (Zufriedenheit)

**Vereinfachung**: Keine detaillierte Taktik (außer in Battle-System).

## Ökologische Annahmen

### 13. Ressourcen-Regeneration

**Annahme**: Natürliche Ressourcen können sich **regenerieren**, aber auch **erschöpfen**.

**Mechanik**:
- Holz: Regeneriert langsam (Aufforstung beschleunigt)
- Stein/Eisen: Regenerieren nicht (begrenzte Vorkommen)
- Wildtiere: Regenerieren, können aber aussterben
- Boden: Kann degradieren durch Übernutzung

### 14. Klimawandel

**Annahme**: Menschliche Aktivität beeinflusst das **Klima langfristig**.

**Modell**:
- CO₂-Äquivalent-Ausstoß (ab Industrialisierung)
- Temperatur-Anstieg über Jahrhunderte
- Häufigere Extremwetter-Events

**Vereinfachung**: Lineares Modell, keine Kipppunkte.

### 15. Naturkatastrophen

**Annahme**: Naturkatastrophen sind **teilweise zufällig**, teilweise **klimabedingt**.

**Typen**:
- Wetterbedingt: Dürren, Überschwemmungen, Stürme (steigen mit Klimawandel)
- Geologisch: Erdbeben, Vulkanausbrüche (rein zufällig)
- Biologisch: Plagen, Seuchen (abhängig von Hygiene und Dichte)

## Soziale Annahmen

### 16. Soziale Netzwerke

**Annahme**: Menschen haben **begrenzte Beziehungskapazität** (Dunbar-Zahl: ~150).

**Umsetzung**:
- Jeder Bürger hat max. 5-20 enge Beziehungen
- Informationsverbreitung über Netzwerke
- Einfluss über soziale Distanz nimmt ab

### 17. Soziale Bewegungen

**Annahme**: Große Unzufriedenheit führt zu **kollektivem Handeln**.

**Schwellwerte**:
- Unzufriedenheit > 70%: Proteste
- Unzufriedenheit > 85%: Revolten
- Unzufriedenheit > 95%: Revolution

**Modell**: Kipppunkt-Mechanik mit Ansteckungseffekt.

### 18. Religion und Kultur

**Annahme**: Religion beeinflusst **Verhalten und Politik**, verliert aber mit Modernisierung an Einfluss.

**Epochen**:
- Antike/Mittelalter: Religion dominiert (80-90% Einfluss)
- Frühe Neuzeit: Säkularisierung beginnt (60% Einfluss)
- Moderne: Trennung Kirche/Staat (20-30% Einfluss)
- Zukunft: Weitgehend säkular (5-10% Einfluss)

## Technische Annahmen

### 19. Determinismus vs. Zufall

**Annahme**: Die Simulation ist **deterministische Basis mit Zufalls-Elementen**.

**Umsetzung**:
- Gleiche Eingaben führen zu gleichen Ergebnissen (ohne Events)
- Zufalls-Events nutzen Seed für Reproduzierbarkeit
- Multiplayer: Events sind synchronisiert

### 20. Skalierbarkeit

**Annahme**: Simulation muss von **10.000 bis 100.000.000 Bürgern** skalieren.

**Strategie**:
- < 10.000: Volle individuelle Simulation
- 10.000-100.000: Hybrid (VIPs individuell, Rest aggregiert)
- \> 100.000: Statistische Aggregation (Kohorten)

**Begründung**: Performance-Limitierungen von Browser-JavaScript.

## Grenzen und Bewusste Auslassungen

### Was die Simulation NICHT modelliert

1. **Internationale Finanzmärkte**: Keine Börsen, Derivate, Währungsspekulation
2. **Komplexe Psychologie**: Keine individuellen Persönlichkeiten, Emotionen vereinfacht
3. **Detaillierte Geografie**: Keine topografischen Karten, nur abstrakte Regionen
4. **Mikro-Management**: Keine Kontrolle einzelner Gebäude (außer Spezial-Features)
5. **Echtzeit-Physik**: Keine physikalischen Simulationen (Flüssigkeiten, etc.)
6. **Komplette historische Genauigkeit**: Einige Events sind vereinfacht oder fiktiv

## Validierung der Annahmen

### Historische Plausibilität

Alle Annahmen wurden gegen historische Quellen geprüft:
- Wirtschaftsgeschichte (North, Acemoglu)
- Demografische Studien (Maddison Database)
- Politikwissenschaft (Tilly, Mann)

### Spielbarkeit

Annahmen wurden justiert für:
- Verständlichkeit (Spieler müssen System verstehen)
- Balance (Keine "dominante Strategie")
- Spaß (Zu realistische Simulation wäre langweilig)

## Änderungshistorie

**v2.3.1** (Dez 2025): Erste vollständige Dokumentation  
**v2.4.0** (geplant): Integration von Datenbank-Modell

---

**Wichtig**: Diese Annahmen sind **Designentscheidungen**, keine absolute Wahrheit. Sie können in zukünftigen Versionen angepasst werden, wenn bessere Modelle verfügbar sind.

**Feedback**: Kritik und Vorschläge zu diesen Annahmen sind willkommen! → [GitHub Issues](https://github.com/Thomas-Heisig/Kaiser_von_Deutschland/issues)

---

**Version**: 2.3.1  
**Letzte Aktualisierung**: Dezember 2025
