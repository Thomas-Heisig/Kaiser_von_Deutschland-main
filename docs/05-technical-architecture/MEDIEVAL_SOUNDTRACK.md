# Drei Mittelalter-Titel · 24.10.2026

Ausgangsstand: sauberer lokaler Git-Stand e231c0d. Keine Remote-Synchronisierung durchgeführt.

| Titel | MP3 in public/music | Cover in public/covers | Originaldatei |
|---|---|---|---|
| Imperial Dawn | imperial-dawn.mp3 | imperial-dawn.webp | davinci_erstelle_ein_zu_kaiser_passendes_thema_der_edicate.mp3 |
| Echowald | echowald.mp3 | echowald.webp | davinci_erstelle_ein_mystisches_thema_der_edicated_track_f.mp3 |
| Ewiger Nebel | ewiger-nebel.mp3 | ewiger-nebel.webp | davinci_erstelle_ein_mystisches_thema_der_edicated_track_f (1).mp3 |

Die beiden mystischen Dateien sind anhand der Screenshot-Reihenfolge und Downloadzeit zugeordnet; die Titelzuordnung ist nicht akustisch bestätigt. Original-MP3s wurden unverändert aus den vom Nutzer genannten Downloads kopiert; SHA-256 steht im Musikkatalog. Im geprüften lokalen public-Verzeichnis lagen diese drei Dateien noch nicht vor.

Zeitraum laut Nutzer-Screenshot: 843–1199. Ab 1200 bleibt das vorhandene Leitmotiv aktiv. Das Startthema Schleier der Vorzeit bleibt unverändert. Der Katalog enthält jetzt 23 Titel. Moderne atmosphärische Musik, keine historische Rekonstruktion.

Cover: 1024 × 1024 WebP, mit dem eingebauten Imagegen-Tool neu gestaltet nach dem Nutzer-Screenshot, keine Original-Extraktion. Titel und Motive: Imperial Dawn (Krone, Berge, goldener Sonnenaufgang), Echowald (mystischer Wald, Bach, blaue Pilze), Ewiger Nebel (nebliges Gebirgstal, violetter Himmel).

Generierungsprompt je Motiv: Create one square polished painterly soundtrack album cover for historical strategy game Kaiser von Deutschland. [Motiv]. Exact title [Titel], readable and beautifully integrated. Full bleed artwork, no UI, no play icons, no borders, no other text. Atmospheric fantasy-inspired modern soundtrack cover, not a historical artifact. Use the corresponding motif in the reference screenshot as inspiration.

## VS-Code-Prompt zur Integrationsabnahme

Prüfe zuerst git status und die aktuellen Projektanweisungen. Bewahre vorhandene Änderungen. Die drei Stücke Imperial Dawn, Echowald und Ewiger Nebel sind bereits in src/data/json/music-catalog.json integriert; MP3s liegen in public/music und WebP-Cover in public/covers. Nicht erneut erzeugen oder doppelt importieren.

Lies dieses Dokument zur Dateizuordnung. Prüfe die Integration im echten Browser: alle 23 Titel sichtbar, drei neue Cover geladen, manuelle Wiedergabe jedes neuen Titels möglich. Prüfe die automatische Playlist bei 842, 843, 1000, 1199 und 1200; nur für 843–1199 sollen die drei neuen Stücke die Epochenplaylist bilden. Prüfe Titelende/Weiter, manuelle Auswahl und Laden eines Spielstands. Startthema und Vorzeitmusik erhalten.

Prüfe Produktions-Basispfad, Offline-Assetliste und Service-Worker-Verhalten. Führe MusicJukebox-Tests, Typprüfung, Build und Asset-Gate aus. Behebe belegte Integrationsfehler. Aktualisiere Status/TODO nur anhand tatsächlich geprüfter Ergebnisse. Keine anderen Spielsysteme ändern, kein Deployment. Unterscheide erfolgreiche Audiodekodierung von tatsächlichem Anhören; die Zuordnung der mystischen Originaldateien bleibt bis zur Bestätigung eine dokumentierte Annahme.
