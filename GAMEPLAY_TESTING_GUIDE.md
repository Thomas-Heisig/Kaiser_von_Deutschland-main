# Gameplay-Prüfung: Aufbaukampagne

Diese Anleitung gilt für den Standard-Einstieg über `src/main.ts`, nicht für die
älteren Pixi-Menüs oder die noch nicht eingebundenen Roadmap-Oberflächen.

## Automatische Prüfungen

```sh
npm ci
npm run check
node node_modules/vitest/vitest.mjs run
npm run build
```

Die Tests decken Kosten, monatliche Prognosen, Hunger, Rekrutierung,
Kalendergrenzen, Pause/Fortsetzen, Schutz gegen parallele Monatsschritte,
Handel und Speichern/Laden in eine neue Engine ab. Ein Integrationstest erreicht
alle fünf Kampagnenziele durch finanzierte Spielaktionen, ohne Ressourcen zu setzen.

## Start und Bedienung

1. `npm run dev` starten und `http://localhost:4100` öffnen.
2. Herrscher- und Reichsnamen eintragen; Schwierigkeit und Ereignisse wählen.
3. „Herrschaft beginnen“ anklicken. Erwartung: Januar 1200, pausierte Zeit,
   sichtbare Vorräte und eine gerenderte Siedlungskarte.
4. „Monat →“ anklicken. Genau ein Monat wird verarbeitet; die Zeit bleibt pausiert.
5. „Fortsetzen“ aktivieren. Bei 1× dauert ein Monat vier Sekunden. 2×/4× verkürzen
   die nächsten Intervalle. Mit „Pausieren“, Leertaste oder Escape anhalten.
   Leertaste verändert keine Zeitsteuerung, wenn gerade ein Formular bedient wird.

## Bauen, Handel und Garnison

1. Einen Kartenbezirk anklicken oder „Bauvorhaben“ öffnen.
2. Den Bauernhof bauen: Gold und Holz müssen exakt um die angezeigten Kosten
   sinken, der Zähler und die Produktionsprognose steigen.
3. Nicht finanzierbare Bauten sind gesperrt; ein fehlgeschlagener Bau darf keine
   Teilkosten abbuchen. Werkstätten und Burgen benötigen auch das angezeigte Eisen.
4. „Wirtschaft“ öffnen: Prognose mit Verbrauch und Steuern vergleichen.
   Ereignisse und jährliche Titelboni können die tatsächliche Bilanz verändern.
5. 500 Nahrung kaufen und wieder verkaufen. Der Kauf kostet 300 Gold, der Verkauf
   bringt 200 Gold; der Weiterverkauf darf keinen Gewinn erzeugen.
6. Steuern ändern und einen Monat berechnen. Über 15 % entsteht
   Zufriedenheitsdruck; darunter kann sich die Zufriedenheit erholen.
7. Zehn Soldaten rekrutieren: Vorräte werden abgebucht, die Garnison wächst,
   die bäuerliche Bevölkerung schrumpft um zehn. Die Gesamtbevölkerung bleibt gleich.
8. Bei Nahrung null und negativer Versorgung müssen Zufriedenheit und Bevölkerung
   sinken. Vorräte dürfen nicht negativ werden.

## Kampagne abschließen

Alle Ziele müssen gleichzeitig gelten:

- Mindestens zwölf Bauernhöfe.
- Mindestens drei Marktplätze.
- Mindestens zwei Schulen.
- Mindestens 65 % Zufriedenheit.
- Mindestens 8.000 Gold sowie nichtnegative monatliche Nahrungs- und Goldbilanz.

Verkaufe Überschüsse, importiere bei Bedarf Holz und investiere in Höfe und Märkte.
Drei Marktplätze sind nur ein Mindestziel; zusätzliche Märkte können für eine
positive Goldbilanz nötig sein. Es gibt kein Zeitlimit. Nach der Zielmeldung
kann weitergespielt werden.

## Persistenz

1. Speichern anklicken: Das Spiel pausiert und bestätigt die erfolgreiche Ablage.
2. Vorräte, Gebäude und Datum notieren, danach einen Monat weitergehen.
3. Laden anklicken: Die notierten Werte müssen wiederhergestellt sein.
4. Seite neu laden und „Spielstand fortsetzen“ wählen. Auch dann müssen dieselben
   Werte erscheinen; die Zeit ist pausiert und lässt sich wieder fortsetzen.
5. Ohne vorhandenen Spielstand muss Laden eine sichtbare Fehlermeldung anzeigen.

Manuelles Speichern verwendet den Slot `campaign`. Es gibt kein Autosave.
Die letzten 100 Chronikmeldungen gelten nur für die laufende Sitzung.
Der neue Speicherstand hat Version 2 und enthält die Bürgerdatensätze, auf die
gespeicherte Rollen und KI-Controller verweisen. Ältere Spielstände ohne Bürger
können diesen zuvor nicht gespeicherten Teil nicht rekonstruieren.

## Darstellung und Zugänglichkeit

- Desktop: 1440 × 900; Tablet: 820 × 1180; Mobil: 390 × 844 und 320 × 740.
- Kein horizontales Überlaufen; Navigation, Zeitsteuerung und Formulare sind erreichbar.
- Tab und Enter bedienen alle Verwaltungsaktionen ohne Canvas-Interaktion.
- Kartenbezirke sind zusätzlich über die Bauauswahl erreichbar.
- Zoom und Zentrieren prüfen; nach Größenwechsel muss die Karte neu eingepasst werden.
- Browserzoom darf nicht durch die Viewport-Konfiguration gesperrt sein.
- Wenn Grafikinitialisierung fehlschlägt, erscheint eine sichtbare Warnung; die
  HTML-Verwaltung bleibt erreichbar.

## Produktionsbuild

`npm run build` und anschließend `npm run preview` ausführen. Dieselben Abläufe
prüfen und in den Browser-Netzwerkanfragen sicherstellen, dass Spieldaten aus
gebündelten Assets geladen werden, nicht aus ausschließlich im Dev-Server
vorhandenen `/src/data/json/`-Pfaden.
