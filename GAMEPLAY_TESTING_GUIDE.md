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
Handel und Speichern/Laden in eine neue Engine ab. Zusätzlich werden Schlachten,
Tribut, Überfälle, Rollenwechsel, Monatsaktionen und Hotseat-Züge geprüft.
Ein Integrationstest erreicht alle sechs Kampagnenziele durch finanzierte
Spielaktionen, ohne Ressourcen zu setzen.

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
- Mindestens einen rivalisierenden Nachbarn unterwerfen.

Verkaufe Überschüsse, importiere bei Bedarf Holz und investiere in Höfe und Märkte.
Drei Marktplätze sind nur ein Mindestziel; zusätzliche Märkte können für eine
positive Goldbilanz nötig sein. Es gibt kein Zeitlimit. Nach der Zielmeldung
kann weitergespielt werden.

## Feldzüge und Charaktere

1. „Feldzüge“ öffnen: Heer, Nachschubkosten, Gegner und Siegchancen müssen erscheinen.
2. Gegen die Raubritter ausrücken. Gold und Nahrung werden abgebucht; der Bericht
   zeigt Ergebnis und Verluste. Ein zweiter Feldzug im selben Monat ist gesperrt.
3. Bei Sieg ist der Gegner unterworfen und zahlt monatlich Tribut. Bei Niederlage
   bleibt er angreifbar, sobald ein neuer Monat beginnt und genug Nachschub vorhanden ist.
4. „Charakter“ öffnen und studieren, arbeiten, trainieren oder dem Reich dienen.
   Genau eine persönliche Aktion pro Spieler und Monat ist möglich.
5. Eine andere Rolle übernehmen: Name und Fähigkeiten ändern sich. Der Wechsel
   darf keine zweite Monatsaktion freischalten. Militärische Fähigkeiten beeinflussen
   den Feldherrenbonus im Kriegsrat.
6. Speichern und Laden müssen Rollenwahl, Aktionssperre, Gegner und Berichte erhalten.
   Zufällige Überfälle treten nur bei aktivierten Zufallsereignissen auf.

## Lokaler Mehrspielermodus

1. Auf der Startseite zwei bis vier Spieler wählen und unterschiedliche Reichsnamen eintragen.
2. Im Hotseat gibt es „Zug beenden“ statt Echtzeitsteuerung. Nach dem ersten Zug
   bleibt das Datum unverändert; die Übergabe zeigt den nächsten Herrscher.
3. Während der Übergabe dürfen Tab und Shift+Tab keine Aktionen im Hintergrund erreichen.
4. „Reich übernehmen“ bestätigt den Wechsel. Ressourcen und Charakter gehören jetzt
   zum neuen aktiven Herrscher.
5. Erst nach dem letzten Spielerzug beginnt der nächste Monat für alle Reiche.
6. Im Kriegsrat kann auch ein Mitspieler angegriffen werden. Beide sehen den Bericht;
   der Sieger erhält 15 % des gegnerischen Goldes.
7. Speichern, einen Zug weitergehen und Laden: aktiver Spieler und Datum müssen
   wiederhergestellt werden, auch nach einem Neuladen der Seite.

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
Zusätzlich enthält der Speicherstand Kriegsdaten und den Hotseat-Zugindex.
Alte Speicherstände ohne Kriegsdaten erhalten die anfänglichen Nachbarn.

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
