# Wirtschaftssimulations-Modell

## Theoretische Grundlage: Die Perspektivenabhängigkeit

Die zentrale Prämisse unseres Modells ist, dass **"Ökonomie" nicht einheitlich, sondern rollenabhängig erfahrbar ist**.

### Grundannahme

Keine Rolle in der realen Wirtschaft hat:
- Vollständige Informationen
- Uneingeschränkte Kontrolle
- Ein perfektes Verständnis des Gesamtsystems

### Konsequenz fürs Design

Ein authentisches Spiel muss diese begrenzte Perspektive simulieren. Statt einen allwissenden "Gott-Modus" als Standard zu setzen, wird er zur bewussten Ausnahme, die andere Perspektiven kontrastiert.

### Ziel

Das Spiel soll weniger ein Instrument zur Optimierung, sondern eher ein **Modell sozialer Wirklichkeit** sein, in dem:
- Missverständnisse Teil des Gameplays sind
- Informationsasymmetrien existieren
- Unbeabsichtigte Konsequenzen auftreten können

## Die sechs Gameplay-Varianten

Geordnet nach zunehmender Komplexität und abnehmender Spielerkontrolle:

### 1. Abstrakte Tabellenmodelle

**Beispiele**: Kaiser (1984), Hanse  
**Kern-Perspektive**: Buchhalter/Planer  
**Mechanik**: Steuerung via Menüs, Tabellen, Kennzahlen

**Realitätsgrad**: Sehr gering  
**Lernwert**: Zeigt ökonomische Grundprinzipien (Angebot/Nachfrage) in Reinform

**Charakteristika**:
- Vollständige Information über alle Zahlen
- Direkte Kontrolle über Variablen
- Klare Ursache-Wirkung-Zusammenhänge
- Minimale Verzögerungen zwischen Aktion und Reaktion

### 2. Handels- & Karrieresimulationen

**Beispiele**: Der Patrizier, Ports of Call  
**Kern-Perspektive**: Einzelunternehmer/Kaufmann  
**Mechanik**: Handel, Routen, Gewinnmaximierung

**Realitätsgrad**: Gering-mittel  
**Lernwert**: Vermittelt Marktverständnis und betriebswirtschaftliches Denken aus begrenzter Perspektive

**Charakteristika**:
- Sichtbarkeit nur auf eigene Geschäfte
- Marktpreise als externe Variable
- Konkurrenz als abstrakte Kraft
- Fokus auf individuellem Erfolg

### 3. Aufbau- & Produktionsketten

**Beispiele**: Anno 1800, Transport Tycoon  
**Kern-Perspektive**: Planer & Logistiker  
**Mechanik**: Management komplexer Lieferketten und Versorgungsnetze

**Realitätsgrad**: Mittel  
**Lernwert**: Lehrt systemisches Denken und die Logistik der Wertschöpfung, funktionalisiert aber Gesellschaft

**Charakteristika**:
- Ressourcen-Flüsse visualisiert
- Produktionsketten als Optimierungsproblem
- Bevölkerung als Produktionsfaktor
- Komplexe Interdependenzen

### 4. Management-Simulationen

**Beispiele**: Capitalism Lab, Industry Giant  
**Kern-Perspektive**: Konzernlenker  
**Mechanik**: Steuerung eines Unternehmens in dynamischem Markt mit KI-Konkurrenz

**Realitätsgrad**: Mittel-hoch  
**Lernwert**: Simuliert betriebswirtschaftliche Herausforderungen wie Preisbildung, Marketing und Forschung

**Charakteristika**:
- Konkurrenz durch KI-Spieler
- Marktdynamik aus Angebot und Nachfrage
- Forschung und Innovation als Wettbewerbsfaktor
- Begrenzte Marktinformationen

### 5. Makroökonomische Simulationen

**Beispiele**: Victoria 3  
**Kern-Perspektive**: Staatslenker/Historiker  
**Mechanik**: Steuerung einer Volkswirtschaft mit Klassen, Steuern, Handelspolitik

**Realitätsgrad**: Hoch  
**Lernwert**: Verknüpft Wirtschaft, Politik und Gesellschaft, zeigt langfristige und unbeabsichtigte Effekte

**Charakteristika**:
- Soziale Klassen mit eigenen Interessen
- Politische Maßnahmen mit verzögerter Wirkung
- Internationale Abhängigkeiten
- Komplexe Feedback-Schleifen
- Unbeabsichtigte Konsequenzen häufig

### 6. Spielergetriebene Realökonomie

**Beispiele**: EVE Online  
**Kern-Perspektive**: Marktteilnehmer in lebendigem Ökosystem  
**Mechanik**: Echte Spieler schaffen Angebot und Nachfrage

**Realitätsgrad**: Variabel, emergent  
**Lernwert**: Kommt realen Märkten mit Spekulation und Krisen nahe, ist aber kaum kontrollierbar

**Charakteristika**:
- Emergentes Verhalten aus Spieler-Interaktionen
- Echte Marktpsychologie (Spekulation, Panik)
- Keine zentrale Kontrolle möglich
- Unvorhersehbare Entwicklungen
- Krisen und Blasen möglich

## Validierung durch existierende Spiele

Die Evolution von Kaiser (abstrakt) über Anno (Produktionsketten) zu Victoria 3 (Makro) und EVE Online (emergent) zeigt genau die beschriebene Entwicklung hin zu komplexeren, weniger kontrollierbaren Systemen.

## Implementierung in Kaiser von Deutschland

### Modus-Auswahl beim Spielstart

Spieler können wählen zwischen:
1. **Tabellen-Modus** - Klassisches Kaiser-Feeling
2. **Handels-Modus** - Fokus auf Handel und Karriere
3. **Aufbau-Modus** - Produktionsketten und Logistik
4. **Management-Modus** - Unternehmerische Herausforderungen
5. **Strategie-Modus** - Makroökonomische Steuerung (Standard)
6. **Multiplayer-Modus** - Emergente Wirtschaft mit echten Spielern

### Technische Umsetzung

- Jeder Modus hat eigene UI-Layouts
- Informationsfilter je nach Modus
- Unterschiedliche Steuerungsmöglichkeiten
- Anpassbare Komplexität

---

**Version**: 2.4.0  
**Letzte Aktualisierung**: Dezember 2025  
**Status**: In Entwicklung
