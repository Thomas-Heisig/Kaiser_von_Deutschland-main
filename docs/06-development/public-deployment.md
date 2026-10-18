> **Ist-Zustand 17.10.2026:** GitHub Pages kann für dieses private Repository trotz `enablement: true` mit `Resource not accessible by integration` nicht automatisch erstellt werden. Die Seite ist **nicht** als online verifiziert. Vorgehensweise: Repository-Eigentümer aktiviert Pages in Settings → Pages mit GitHub Actions oder bindet ein alternatives HTTPS-Hosting (z. B. Cloudflare Pages) an; danach Workflow ausführen, DNS/TLS und reale HTTP-Medienantworten sowie PWA/Offline auf Geräten prüfen. Media-Dateien und eine fertige Website sind als GitHub-Actions-Artefakt vorhanden, aber keine öffentlich abrufbare Website. Vor einer Freigabe Rechte, Impressum und Datenschutz prüfen.

# Öffentliches Deployment – Kaiser von Deutschland

Der Quellcode liegt in einem **privaten** GitHub-Repository. Das Spiel läuft als Vite/TypeScript-Browseranwendung mit statischen MP3-/MP4-Dateien und speichert Spielstände lokal im jeweiligen Browser. Ein öffentliches Deployment ist noch **nicht** bestätigt.

## GitHub-Pages-Workflow und Artefakt-Fallback

Der Workflow prüft nach dem Build lesend, ob eine Pages-Site existiert. Bei HTTP 404 überspringt er die
Veröffentlichung mit einer Warnung und einem Hinweis in der Run-Zusammenfassung. Das Artefakt
`kaiser-https-site` bleibt im Workflow-Run herunterladbar; ein grüner Run mit übersprungener Veröffentlichung
ist **kein Live-Deployment**. Andere API-Fehler sowie Build- und Deploymentfehler lassen den Run weiterhin scheitern.

Der Repository-Eigentümer muss einmalig **Settings → Pages → Build and deployment → Source: GitHub Actions**
auswählen und gegebenenfalls die Pages-Verfügbarkeit im Tarif für private Repositories prüfen. Danach
`Publish HTTPS PWA (GitHub Pages)` über **Run workflow** erneut ausführen. Die automatische Pages-Aktivierung
wird nicht mehr versucht; zusätzliche Administrator-Tokens werden nicht benötigt.

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
