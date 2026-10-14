# 🧬 Bevölkerungsdynamik - Benutzerhandbuch

## Version 2.1.5

Diese Anleitung erklärt die neuen Bevölkerungsdynamik-Features in Kaiser von Deutschland v2.1.5.

---

## 📋 Inhaltsverzeichnis

1. [Überblick](#überblick)
2. [Individuelle Bürger](#individuelle-bürger)
3. [Demografische Simulation](#demografische-simulation)
4. [Soziale Netzwerke](#soziale-netzwerke)
5. [Multiplayer-Features](#multiplayer-features)
6. [Visualisierung](#visualisierung)
7. [Tipps & Tricks](#tipps--tricks)

---

## 🎯 Überblick

Mit Version 2.1.5 führt Kaiser von Deutschland ein vollständiges Bevölkerungssimulations-System ein. Jeder Bürger in Ihrem Reich ist nun ein Individuum mit eigenen Eigenschaften, Bedürfnissen und Lebensgeschichten.

### Wichtigste Features

✅ **Individuelle Bürger**: Jeder Bürger hat einen Namen, Alter, Beruf und Persönlichkeit
✅ **Lebendig**: Bürger werden geboren, heiraten, haben Kinder und sterben
✅ **Sozial vernetzt**: Freundschaften, Familien und soziale Bewegungen
✅ **Multiplayer-fähig**: Übernehmen Sie beliebige Bürger als Spielfigur
✅ **Visuell dargestellt**: Interaktive Karten und Grafiken mit PixiJS

---

## 👤 Individuelle Bürger

### Was ist ein Bürger?

Jeder Bürger hat:

- **Persönliche Daten**: Vor- und Nachname, Geschlecht, Alter, Geburtsort
- **Beruf**: 17 verschiedene Berufe (Bauer, Händler, Soldat, etc.)
- **Soziale Klasse**: Bauer, Mittelklasse, Adel oder Königshaus
- **Bedürfnisse**: Nahrung, Unterkunft, Sicherheit, Gesundheit, etc.
- **Gesundheit**: Allgemeinzustand, Krankheiten, Immunität
- **Persönlichkeit**: Mut, Intelligenz, Charisma, Ehrgeiz, etc.
- **Fähigkeiten**: Landwirtschaft, Handwerk, Kampf, Diplomatie, etc.

### Bedürfnisse verstehen

Bürger haben 8 Bedürfnisse (Skala 0-100):

1. **Nahrung** (food): Wichtigstes Grundbedürfnis
2. **Unterkunft** (shelter): Wohnsituation
3. **Sicherheit** (safety): Schutz vor Gewalt
4. **Gesundheit** (health): Medizinische Versorgung
5. **Soziales** (social): Freunde und Familie
6. **Spirituelles** (spiritual): Religion und Glaube
7. **Bildung** (education): Wissen und Lernen
8. **Unterhaltung** (entertainment): Freizeit und Vergnügen

**Tipp**: Das Glück (happiness) eines Bürgers hängt direkt von der Erfüllung seiner Bedürfnisse ab!

### Berufe und Soziale Mobilität

#### Verfügbare Berufe:

- **Landwirtschaft**: Bauer, Fischer
- **Handwerk**: Handwerker, Schmied, Zimmermann, Weber, Bäcker, Brauer
- **Handel**: Händler
- **Militär**: Soldat
- **Bildung**: Gelehrter
- **Religion**: Geistlicher
- **Adel**: Adeliger
- **Dienste**: Diener, Arbeiter
- **Bergbau**: Bergmann
- **Arbeitslos**: Ohne Beschäftigung

**Berufswechsel** (in Entwicklung):
- Bürger können im Laufe ihres Lebens den Beruf wechseln
- Abhängig von Fähigkeiten, Bildung und Persönlichkeit

---

## 📊 Demografische Simulation

### Geburten und Todesfälle

Das System simuliert realistische Bevölkerungsentwicklung:

#### Geburtenrate
- Basierend auf historischen Daten (ca. 35 pro 1000 pro Jahr)
- Beeinflusst durch Lebensqualität und Glück der Bevölkerung
- Höhere Zufriedenheit = mehr Kinder

#### Sterberate
- Basierend auf Alter, Gesundheit und Lebensumständen
- Kindersterblichkeit ist historisch hoch
- Lebenserwartung steigt mit besserer Gesundheitsversorgung

### Alterspyramide

Die Alterspyramide zeigt die Altersverteilung:
- **Breite Basis**: Viele junge Menschen (wachsende Bevölkerung)
- **Schmale Spitze**: Wenige alte Menschen (hohe Sterblichkeit)
- **Einschnürungen**: Zeigen historische Krisen (Kriege, Epidemien)

**Zugriff**: Im Spiel über das Bevölkerungs-Menü

### Epidemien

Epidemien können Ihre Bevölkerung dezimieren:

#### Eigenschaften einer Epidemie:
- **Ansteckungsgrad** (0-100): Wie leicht sie sich verbreitet
- **Sterblichkeitsrate** (0-100): Wie tödlich sie ist
- **Dauer**: Wie lange die Epidemie andauert
- **Immunität**: Ob Überlebende immun werden

#### Berühmte Epidemien:
- **Schwarzer Tod** (1347-1352): Sehr ansteckend, hohe Sterblichkeit
- **Spanische Grippe** (1918-1920): Moderate Sterblichkeit, sehr ansteckend

**Multiplayer**: Spieler können kooperativ gegen Epidemien kämpfen!

### Hungersnöte

Hungersnöte können durch verschiedene Faktoren ausgelöst werden:
- Naturkatastrophen
- Missernten
- Wirtschaftliche Krisen
- Kriege

**Auswirkungen**:
- Reduziertes Nahrungsbedürfnis
- Erhöhte Sterblichkeit
- Soziale Unruhen
- Migration

---

## 🤝 Soziale Netzwerke

### Beziehungen zwischen Bürgern

Bürger bauen natürliche soziale Beziehungen auf:

#### Beziehungstypen:
1. **Familie**: Ehepartner, Eltern, Kinder, Geschwister
2. **Freundschaften**: Positive soziale Bindungen
3. **Feindschaften**: Negative Beziehungen
4. **Rivalitäten**: Wettbewerbsorientierte Beziehungen
5. **Mentor/Schüler**: Bildungsbeziehungen
6. **Kollegen**: Arbeitsbeziehungen

**Beziehungsstärke**: -100 (Todfeind) bis +100 (Bester Freund)

### Informationsverbreitung

Nachrichten verbreiten sich durch soziale Netzwerke:

#### Nachrichtentypen:
- **Nachrichten** (news): Offizielle Informationen
- **Gerüchte** (rumor): Unbestätigte Informationen
- **Propaganda**: Politische Botschaften
- **Klatsch** (gossip): Persönliche Geschichten

**Mechanismus**:
1. Ein Bürger erstellt/empfängt eine Nachricht
2. Er erzählt sie seinen Freunden und Familie
3. Diese erzählen es weiter (basierend auf Charisma)
4. Jeder Empfänger entscheidet ob er glaubt (basierend auf Intelligenz)

**Spieler-Nutzen**:
- Verbreiten Sie Propaganda
- Starten Sie Gerüchte über Feinde
- Beeinflussen Sie öffentliche Meinung

### Soziale Bewegungen

Bürger können soziale Bewegungen gründen oder beitreten:

#### Bewegungstypen:
- **Revolution**: Umsturz der Ordnung
- **Reform**: Politische Veränderung
- **Protest**: Demonstration gegen Missstände
- **Kult**: Religiöse oder ideologische Gruppen
- **Gilde**: Berufsorganisationen
- **Partei**: Politische Parteien

#### Wie Bewegungen wachsen:
1. Ein Bürger gründet eine Bewegung
2. Unglückliche Bürger sind empfänglicher
3. Freunde von Mitgliedern treten eher bei
4. Persönlichkeit spielt eine Rolle (Mut bei Revolution, etc.)

**Einfluss**: Bewegungen mit vielen Anhängern können Politik beeinflussen!

---

## 🎮 Multiplayer-Features

### Bürger übernehmen

In Multiplayer-Spielen kann jeder Spieler **jeden beliebigen Bürger** übernehmen!

#### Wie funktioniert es:
1. Öffnen Sie die Bürger-Liste
2. Wählen Sie einen Bürger aus
3. Klicken Sie auf "Bürger übernehmen"
4. Sie kontrollieren nun diesen Bürger!

**Strategien**:
- Übernehmen Sie einen mächtigen Adeligen für politischen Einfluss
- Wählen Sie einen Händler für wirtschaftliche Macht
- Spielen Sie als einfacher Bauer für eine Herausforderung

### Bewegungen anführen

Spieler können soziale Bewegungen leiten:

1. Finden Sie eine existierende Bewegung oder gründen Sie eine
2. Übernehmen Sie die Führung
3. Rekrutieren Sie Mitglieder
4. Setzen Sie Ziele durch

**Beispiel - Revolution**:
```
1. Gründen Sie "Bauernaufstand 1225"
2. Übernehmen Sie die Führung als Spieler
3. Rekrutieren Sie unzufriedene Bauern
4. Wachsen Sie bis zu 1000+ Unterstützern
5. Fordern Sie politische Veränderungen
```

### Kooperative Seuchenbekämpfung

(In Entwicklung)

Spieler können zusammenarbeiten, um Epidemien zu bekämpfen:
- Teilen Sie Ressourcen
- Koordinieren Sie Quarantänemaßnahmen
- Entwickeln Sie gemeinsam Behandlungen

---

## 📈 Visualisierung

### Alterspyramide

Die interaktive Alterspyramide zeigt:
- **Linke Seite**: Männliche Bevölkerung (blau)
- **Rechte Seite**: Weibliche Bevölkerung (rosa)
- **Höhe**: Altersgruppen (0-5, 6-10, etc.)
- **Breite**: Anzahl der Personen

**Interpretation**:
- Breite Basis = Junge Bevölkerung = Wachstum
- Gleichmäßige Pyramide = Stabile Bevölkerung
- Umgekehrte Pyramide = Alternde Bevölkerung

### Bürger-Karte

Die Bürger-Karte zeigt alle Bürger als Punkte:

**Farben**:
- 🟡 **Gold**: Spieler-kontrollierte Bürger
- 🟣 **Lila**: Adelige
- 🔵 **Blau**: Mittelklasse
- ⚪ **Grau**: Bauern

**Interaktiv**:
- Bewegen Sie die Maus über einen Punkt
- Sehen Sie Tooltip mit Bürger-Informationen
- Klicken Sie für Details

### Performance

Bei sehr großen Bevölkerungen (10.000+):
- Nutzen Sie Filter (z.B. nur eine Region anzeigen)
- Die Visualisierung passt sich automatisch an
- Bei 100.000+ Bürgern kann es zu Verzögerungen kommen

---

## 💡 Tipps & Tricks

### Bevölkerungswachstum fördern

1. **Glück erhöhen**: Erfüllen Sie Bedürfnisse der Bürger
2. **Gesundheit verbessern**: Bauen Sie Krankenhäuser
3. **Nahrung sichern**: Investieren Sie in Landwirtschaft
4. **Sicherheit garantieren**: Reduzieren Sie Kriminalität

### Mit Epidemien umgehen

1. **Früherkennung**: Beobachten Sie Gesundheitsstatistiken
2. **Quarantäne**: Isolieren Sie betroffene Regionen
3. **Hygiene**: Verbessern Sie Sanitäranlagen
4. **Medizin**: Investieren Sie in Forschung

### Soziale Bewegungen nutzen

1. **Als Herrscher**: Unterdrücken oder kooptieren Sie Bewegungen
2. **Als Revolutionär**: Bauen Sie Unterstützung auf
3. **Als Reformer**: Arbeiten Sie mit Bewegungen zusammen

### Multiplayer-Strategien

**Als mächtiger Herrscher**:
- Kontrollieren Sie die Gesetzgebung
- Bauen Sie Infrastruktur
- Führen Sie Kriege

**Als einfacher Bürger**:
- Bauen Sie soziale Netzwerke auf
- Gründen Sie Bewegungen
- Steigen Sie sozial auf

**Als Revolutionär**:
- Sammeln Sie Unterstützer
- Verbreiten Sie Propaganda
- Stürzen Sie die Ordnung

---

## 🔮 Kommende Features

In zukünftigen Versionen geplant:

### Migration
- Bürger ziehen zwischen Regionen um
- Basierend auf Arbeitsmöglichkeiten
- Kulturelle Integration

### Berufswechsel
- Automatische Berufsaufstiege
- Bildung ermöglicht bessere Jobs
- Wirtschaftliche Anreize

### Erweiterte Dynastien
- Vererbung von Besitz
- Familienwappen
- Generationenübergreifende Ziele

### KI-gesteuerte Charaktere
- Bürger mit eigenen Zielen
- Emergentes Verhalten
- Komplexe Persönlichkeiten

---

## ❓ Häufige Fragen

### Wie viele Bürger kann ich haben?

Theoretisch unbegrenzt, aber:
- **Optimal**: 1.000 - 10.000
- **Gut spielbar**: 10.000 - 50.000
- **Möglich**: 50.000 - 100.000+
- **Performance**: Hängt von Ihrem Computer ab

### Wie übernehme ich einen Bürger im Multiplayer?

1. Öffnen Sie das Bevölkerungs-Menü
2. Filtern Sie nach Kriterien (Beruf, Region, etc.)
3. Klicken Sie auf einen Bürger
4. Wählen Sie "Bürger übernehmen"

### Kann ich mehrere Bürger gleichzeitig kontrollieren?

Ja! Sie können so viele Bürger übernehmen, wie Sie möchten.

### Sterben Spieler-Bürger?

Ja, auch Spieler-Bürger können sterben. Sie können dann:
1. Einen anderen Bürger übernehmen
2. Einen Nachfahren übernehmen (wenn vorhanden)
3. Als Herrscher weiterspielen

### Wie verbreite ich ein Gerücht?

(API-Funktion):
```typescript
const socialSystem = engine.getSocialNetworkSystem();
socialSystem.createMessage(
  'rumor',
  'Der König ist krank!',
  meinBürgerID,
  regionID,
  jahr,
  monat
);
```

---

## 📚 Weitere Ressourcen

- **[Population Dynamics API](POPULATION_API.md)** - Entwickler-Dokumentation
- **[Architecture Guide](ARCHITECTURE.md)** - Technische Details
- **[Roadmap](ROADMAP.md)** - Geplante Features
- **[Main User Guide](USER_GUIDE.md)** - Allgemeine Spielanleitung

---

**Version**: 2.1.5  
**Letzte Aktualisierung**: Dezember 2025

_Erlebe Geschichte durch die Augen Deiner Bürger!_ 👥🏰
