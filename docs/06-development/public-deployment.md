# Öffentliches Deployment – Kaiser von Deutschland

Der Quellcode liegt in einem **privaten** GitHub-Repository. Das Spiel läuft als Vite/TypeScript-Browseranwendung mit statischen MP3-/MP4-Dateien und speichert Spielstände lokal im jeweiligen Browser. Ein öffentliches Deployment ist noch **nicht** bestätigt.

## Empfohlener Weg: Cloudflare Pages oder ähnliches Static Hosting
1. Im Hosting-Dienst das GitHub-Konto autorisieren und das Repository `Thomas-Heisig/Kaiser_von_Deutschland-main` auswählen. Bei einem privaten Repo muss die Installation explizit Zugriff erhalten.
2. Als Produktionsbranch `main`, Buildbefehl `npm ci && npm run build` und Ausgabeverzeichnis `dist` konfigurieren.
3. Die bereitgestellte HTTPS-URL auf Desktop und Smartphone öffnen, Video und alle 15 MP3-Dateien sowie Cover kontrollieren. Insbesondere `/video/intro-original.mp4` und `/video/intro.mp4` sowie `/music/*.mp3` müssen mit korrekten MIME-Typen erreichbar sein.
4. Bei späterem eigenen Domainnamen dessen DNS gemäß Hosting-Anbieter eintragen und HTTPS einschalten. Ein eigener Domainname ist nicht zwingend erforderlich.
5. Zum Veröffentlichen der aktuellsten Version muss der Hosting-Dienst die aktuellen Änderungen von `main` übernehmen; GitHub-CI allein veröffentlicht **nicht**.
6. Vor öffentlicher Bereitstellung Impressum, Kontakt, Datenschutzangaben und die Medien-/KI-Nutzungsrechte prüfen. Eine öffentliche Website überträgt möglicherweise Hosting-Zugriffslogs an den Anbieter.
   
**Sicherheit:** Nicht `npm run dev -- --host 0.0.0.0` als öffentlich erreichbare Produktionslösung nutzen, und keine Portweiterleitung auf den Entwicklungs-PC ohne geeignete Serverabsicherung einrichten.

**Spielstände:** IndexedDB/LocalForage sind geräte- und browsergebunden, es gibt keine automatische Synchronisation zwischen Telefon und PC. Das gilt auch bei einer öffentlich gehosteten Version.

**Audioeinschränkung:** Browser können tonhaltigen Autoplay verhindern. Beim Start wird dann die vorhandene Schaltfläche zum Filmstart sichtbar; danach wird „Zeit vergeht“ gestartet.
