# UI Flow Documentation

## Übersicht

Das Spiel verwendet ein dreistufiges UI-Flow-System, das den Spieler durch folgende Screens führt:

1. **Startseite** (Start Screen)
2. **Spieleinstellungen** (Setup Screen)
3. **Hauptspiel** (Game Screen)

## 1. Startseite (Start Screen)

### Funktionen
- Willkommensnachricht mit Spielbeschreibung
- Animierter Hintergrund mit schwebenden Partikeln
- "Weiter" Button zur Navigation zur Spieleinstellungsseite
- "Dokumentation" Button für Hilfe und Anleitung
- Versionsanzeige
- Tastenkürzel-Hinweise

### Interaktionen
- **Maus-Klick**: Buttons anklicken
- **Enter-Taste**: Weiter zur Spieleinstellungsseite
- **F1-Taste**: Dokumentation anzeigen

### Design-Elemente
- Goldener Titel mit Glow-Effekt
- Transparentes Informations-Panel
- Animierte Hintergrundpartikel
- Responsive Canvas-Rendering

## 2. Spieleinstellungen (Setup Screen)

### Konfigurationsoptionen

#### Spielerinformationen
- **Spielername**: Textfeld für den Namen des Spielers
- **Königreichsname**: Textfeld für den Namen des Königreichs
- **Geschlecht**: Männlich (♂) oder Weiblich (♀)

#### Spielstart-Parameter
- **Startjahr / Epoche**: Auswahl aus historischen Perioden
  - Antike (Jahr 0)
  - Frühmittelalter (800)
  - Hochmittelalter (1200)
  - Renaissance (1500)
  - Industrialisierung (1800)
  - 20. Jahrhundert (1900)
  - Moderne (2000)

#### Charakter-Einstellungen
- **Beruf / Stand**: Auswahl der Spielerrolle
  - Kaiser, König, Herzog
  - Bürgermeister
  - Händler, Handwerker
  - Bauer, Arbeiter
  - Gelehrter, Bischof, Mönch

- **Alter**: Slider (18-80 Jahre)

#### Spiel-Einstellungen
- **Schwierigkeit**: 5 Stufen (Sehr leicht bis Sehr schwer)
- **Spielgeschwindigkeit**: 4 Stufen (Langsam, Normal, Schnell, Sehr schnell)
- **Zufallsereignisse**: Ein/Aus Toggle

#### Spielstand-Verwaltung
- **Laden**: Gespeicherten Spielstand laden (in Entwicklung)

### Interaktionen
- **Maus-Klick**: Alle Eingabefelder und Buttons
- **Enter-Taste**: Spiel starten
- **Esc-Taste**: Zurück zur Startseite
- **F1-Taste**: Dokumentation anzeigen

### Validierung
Das System validiert vor dem Spielstart:
- Spielername muss eingegeben werden
- Königreichsname muss eingegeben werden
- Bei Fehler erscheint eine Fehlermeldung

## 3. Hauptspiel (Game Screen)

### Layout-Struktur

#### Oben: Informationsleiste
- Spieltitel
- Aktuelles Jahr
- Gold-Anzeige
- Weitere Ressourcen

#### Links: Informations-Panel
- Bevölkerungszahl
- Zufriedenheit
- Wirtschaftsstatus
- Militärstärke
- Technologie-Stufe

#### Zentral: Lebensumfeld-Visualisierung
Die zentrale Darstellung passt sich der gewählten Rolle an:

- **Kaiser/König**: Politische Karte mit Regionen
  - Zeigt verschiedene Reichsteile
  - Interaktive Regionen
  
- **Bauer/Arbeiter**: Arbeitsstätten-Ansicht
  - Felder oder Werkstatt-Grid
  - Produktionsanzeigen

- **Andere Rollen**: Standard-Statistik-Ansicht
  - Balkendiagramme für Gesundheit, Bildung, Wohlstand
  - Prozentuale Anzeigen

#### Rechts: Aktions-Panel
Rollenspezifische Aktionen:
- 💰 Steuern erheben
- ⚖️ Gesetz erlassen
- 🤝 Handel treiben
- ⚔️ Krieg führen
- 🏗️ Bauen

#### Unten: Kontroll-Panel
- ⏭️ Nächstes Jahr
- ⏸️ Pause
- 💾 Speichern
- ⚙️ Einstellungen

### Interaktionen
- **Maus-Klick**: Alle Buttons und Panels
- **Esc-Taste**: Zurück zu Einstellungen
- **F1-Taste**: Dokumentation anzeigen

## Tastenkürzel

### Globale Shortcuts
- **Enter**: Weiter/Starten (kontextabhängig)
- **Esc**: Zurück (kontextabhängig)
- **F1**: Dokumentation/Hilfe anzeigen

### Navigation-Flow
```
Startseite [Enter] → Einstellungen [Enter] → Hauptspiel
    ↑ [Esc] ←────────┘           ↑ [Esc] ←─────┘
```

## Responsive Design

Das UI-System verwendet PixiJS Canvas-Rendering und ist vollständig responsiv:

- **Desktop**: Optimale Darstellung mit allen Panels
- **Tablet**: Angepasste Panel-Größen
- **Mobile**: Touch-optimierte Bedienung (geplant)

### Canvas-Größenanpassung
- Automatische Anpassung an Fenstergröße
- Device Pixel Ratio Unterstützung
- Anti-Aliasing für glatte Darstellung

## Technische Implementation

### Komponenten
- **UIFlowManager**: Hauptklasse für Screen-Management
- **PixiUISystem**: UI-Komponenten-System
- **GameEngine**: Spiel-Logik Backend

### Rendering
- PixiJS 8.x für Hardware-beschleunigte Grafik
- Layered Rendering-System:
  1. Background Layer (Animierter Hintergrund)
  2. Game Layer (Spiel-Inhalte)
  3. Particle Layer (Effekte)
  4. UI Layer (Interaktive Elemente)
  5. Overlay Layer (Modals, Tooltips)

### Animation
- Partikel-System für atmosphärische Effekte
- Smooth Transitions zwischen Screens
- Twinkling Stars Hintergrund-Animation

## Best Practices

### Für Entwickler
1. Verwende `UIFlowManager` für Screen-Navigation
2. Nutze `PixiUISystem` für konsistente UI-Komponenten
3. Halte das Design-Theme in `defaultTheme` konsistent
4. Teste alle Interaktionen auf verschiedenen Bildschirmgrößen

### Für Spieler
1. Nutze Tastenkürzel für schnellere Navigation
2. F1 jederzeit für Hilfe drücken
3. Alle Eingabefelder ausfüllen vor Spielstart
4. Bei Problemen: Esc-Taste zum Zurückgehen

## Erweiterungsmöglichkeiten

### Geplante Features
- [ ] Vollständiges Canvas-basiertes Texteingabe-System
- [ ] Erweiterte Animationen zwischen Screens
- [ ] Soundtrack und Sound-Effekte
- [ ] Tutorial-System für neue Spieler
- [ ] Mehrsprachigkeit
- [ ] Accessibility-Features
- [ ] Touch-Gesten für Mobile
- [ ] Gamepad-Unterstützung

### Mögliche Verbesserungen
- Erweiterte Tooltips
- Kontextsensitive Hilfe
- Achievement-System Integration
- Statistik-Dashboard
- Replay-System

## Fehlerbehebung

### Canvas wird nicht angezeigt
- Prüfe Browser-Konsole auf WebGL-Fehler
- Stelle sicher, dass PixiJS korrekt geladen wurde
- Überprüfe Canvas-Dimensionen

### Buttons reagieren nicht
- Prüfe Event-Listener in Browser DevTools
- Stelle sicher, dass Container `eventMode = 'static'` gesetzt ist
- Checke z-Index / Layer-Reihenfolge

### Performance-Probleme
- Reduziere Partikel-Anzahl
- Deaktiviere Animationen auf schwachen Geräten
- Nutze Performance-Profiler

## Support

Bei Fragen oder Problemen:
- GitHub Issues: https://github.com/Thomas-Heisig/Kaiser_von_Deutschland/issues
- README.md im Hauptverzeichnis
- Inline-Dokumentation im Code
