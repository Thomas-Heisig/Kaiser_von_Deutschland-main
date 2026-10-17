# Ideenbestand aus der alten README · 17.10.2026

> **Planungsarchiv, keine Implementierungszusage.** Dies ist eine wörtliche Übernahme
> der Ideen und Funktionsversprechen aus der README zum Stichtag, damit beim
> Umbau keine Ideen verschwinden. „NEU“, Versionen und „implementiert“ in den
> historischen Abschnitten sind **keine** Prüfung der aktuell spielbaren
> Standard-Oberfläche. Die verbindlichen Prioritäten stehen in
> [TODO](../../TODO.md), der [Roadmap](roadmap.md) und dem [Status](status.md).
> Gesamter ursprünglicher README-Wortlaut: [Archiv-Snapshot](../outdated/README-snapshot-2026-10-17.md).

## Noch ausstehende bzw. weiterführende Spielideen aus dem README-Text

- Unterschiedliche Rollen und Perspektiven (Bauer bis Kaiser), mit vollständiger
  Integration der älteren Rollen- und Lebensphasen-UI in die aktive Aufbaukampagne.
- Historisch skalierte Ereignisse und Ereignisketten mit echten Folgeentscheidungen,
  alternativer Geschichte und langfristigen Konsequenzen.
- Ratsdilemmata mit individuellen Charakteren: Loyalität, Rivalitäten, Biografien,
  Überforderung, Folgen für ihr Umfeld; Karrieren und Dynastien samt Lehrlingszeit.
- Krisenmaßnahmen bei Pest, Hungersnot, Überfällen (schnell/teuer vs. langfristig).
- Handel, Entdeckungsfahrten, Seefahrt und Bündnisse als unterschiedliche Siegespfade.
- Individuelle Bürgerbedürfnisse, Geburten, Krankheit, Tod und Generationen;
  langfristiges Balancing sowie persistente Familiengeschichten.
- Produktionsketten, Arbeitsmarkt, Inflation, Bildungswesen, Zensur und Open Access.
- Regionale Verwaltung und Migration, Umwelt- und Klimaereignisse mit Spielwirkungen.
- Religion, Kunst, gesellschaftliche Bewegungen, Propaganda und Medienentwicklung.
- Realistische Mobilität und Transportketten, Häfen, Wege, Bahn, Flugverkehr.
- Militärische Logistik, Versorgung, Gelände, Marine, Gefangenenverwaltung und
  alternative friedliche Lösungen (alles zeitgerecht, nicht automatisch spielbar).
- Diplomatische Beziehungen, Nichtangriffspakte, Vertragsbrüche und Bündnisse.
- Variierende Spieleinstellungen, Schwierigkeit, Erfolge, Tutorial, Hotseat-Ausbau,
  perspektivisch Online-Mehrspieler.
- Lokale KI-Begleitung als **Opt-in**, KI-Autonomie mit nachvollziehbaren Grenzen.
- 2D/3D-Look-Grafik, echtes taktisches 3D, lebendige Stadtansicht,
  animierte Bürger und historische Filme; Touch- und Barrierefreiheit.
- Originalsoundtrack mit Metadaten, hochauflösenden Covers, Musikrechten,
  alternativen Filmintros/Outros und historisch passenden Sequenzen.
- Offline-Installation per PWA, HTTPS-Hosting, Datenschutz, Impressum,
  geräteübergreifende Qualitätstests und optionale Desktop-/Mobil-App.
- Internationale Sprachen, schulischer Einsatz, Modding-API, Community und Replays.

## Vollständige damalige Feature- und Ideensammlung (unverändert übertragen)

Die folgenden Abschnitte wurden **ohne Streichung** aus der historischen
README übernommen; sie enthalten nicht nur Ideen, sondern auch ältere
Implementierungsbehauptungen. Daher sind sie nicht die aktuelle Featureliste.

### Ideen für mehr Spielspaß – geplant, nicht bereits implementiert

**Ratsdilemmata mit Charakteren:** Ein fähiger Verwalter kann ehrgeizig,
illoyal oder überfordert sein; Entscheidungen können Loyalität, Rivalität und
persönliche Biografien verändern. **Karrieren und Dynastien:** Lehrlinge werden
zu erfahrenen Amtsinhabern, die später wichtige Forderungen stellen oder
konkurrierende Familien fördern. **Krisenaktionen:** Bei Hungersnot, Pest oder
einem Überfall wählt der Spieler zwischen schnellen, teuren und langfristigen
Lösungen. **Handel und Entdeckungen:** Seefahrt, Bündnisse und neue Technologien
eröffnen tatsächlich unterschiedliche Wege zum Kampagnensieg.
**Ereignisketten:** Politische Entscheidungen lösen über Jahre hinweg
verschiedene Folgeereignisse und historische Wendepunkte aus.

Die alte Funktions- und Roadmap-Dokumentation weiter unten wird bewusst **nicht
gelöscht**: Bestehende Kernsysteme, historische Vorarbeiten und vollständige
Integration in die Standardkampagne sind drei unterschiedliche Reifegrade.

## 🎮 Spielkonzept

Kaiser von Deutschland ist eine komplexe Strategie- und Rollenspielsimulation, die es Spielern ermöglicht, verschiedene historische und moderne Rollen zu übernehmen - vom einfachen Arbeiter bis zum mächtigen Kaiser. Das Spiel deckt eine Zeitspanne von über 2000 Jahren ab und kombiniert historische Genauigkeit mit strategischer Tiefe.

> **Aktuelle Version:** v2.6.0  
> **NEU in 2.6.0:** 🎭 **Life Simulation System** - Wechsle nahtlos zwischen Charakteren und erlebe die Geschichte aus verschiedenen Perspektiven!
> - **👤 Rollenwechsel-System**: Spiele jederzeit jeden lebenden Charakter
> - **🤖 AI Controller**: Intelligente KI steuert nicht-gespielte Charaktere
> - **⏱️ Drei Zeit-Modi**: Detail (1s=1 Tag), Ausgewogen (1s=1 Monat), Strategisch (1s=1 Jahr)
> - **🎨 Dynamische Ansichten**: UI passt sich der Rolle an (Kaiser, Bauer, Händler, etc.)
> **Neu in 2.5.1:** ⚔️ **Kriegsgefangene-System (PoW)** - Manage prisoners of war with historical accuracy!
> **Neu in 2.3.6:** 💰 **Kriegsfinanzierung & Kriegsanleihen** - Finanziere Kriege mit historischen Methoden!
> **Neu in 2.5.0:** 🎮 **Lebensphasen-basiertes Gameplay-System** + **20 Roadmap Features**  
> **MASSIV ERWEITERT in v2.4.0:** 🚀 **17 neue Kernsysteme** für Population, Krieg, Spionage, Städte, Kultur & Recht!  
> Siehe [ROADMAP](docs/00-meta/roadmap.md) für geplante Features und [STATUS](docs/00-meta/status.md) für Details.

## ✨ Hauptmerkmale

### 🎭 15 Verschiedene Spielerrollen
- **Imperial**: Kaiser, Kaiserin
- **Royal**: König, Königin
- **Religious**: Papst, Bischof, Mönch, Nonne
- **Noble**: Herzog, Herzogin
- **Administrative**: Minister, Bürgermeister
- **Economic**: Händler, Gildenmeister, Handwerker
- **Labor**: Bauer, Arbeiter
- **Academic**: Gelehrter

Jede Rolle hat einzigartige Fähigkeiten, spezifische Anforderungen und verschiedene Startressourcen.

### 📅 Historische Zeitlinie (Jahr 0 - 2050)
- **27 historische Ereignisse** von der Geburt Christi bis zur Weltraumkolonisierung
- Automatische Ereignisse basierend auf dem Jahr
- Zufällige Ereignisse für dynamisches Gameplay
- Zukunfts-Szenarien (KI-Revolution, Fusionsenergie, etc.)

### 🏗️ 23 Gebäudetypen
Von antiken Bauernhöfen bis zu futuristischen Rechenzentren.

### 🔬 24 Technologien
Vollständiger Technologie-Baum von der Antike bis zur digitalen Zukunft.

### 📊 Umfangreiches Statistik-System
Wirtschaft, Militär, Soziales, Kultur und Politik - alles detailliert simuliert.

### 🏛️ Politik-System (NEU)
**33 politische Maßnahmen** in 8 Kategorien:
- Asyl und Zuwanderung
- Wirtschaft (Inland & Außenhandel)
- Gesundheitswesen
- Soziale Förderung & Restriktion
- Soziale Spannungen
- Ballungsräume

### 🤖 KI-Integration (NEU)
- **Ollama AI**: 6 verschiedene KI-Modelle als Spieler oder Berater
- Intelligente Entscheidungshilfe
- Event-Analyse und Empfehlungen
- Chat-Funktion

### 🌐 Multiplayer-System (NEU)
- Bis zu 6 Spieler (Menschen + KI)
- Echtzeit- oder Rundenbasiert
- In-Game Chat (öffentlich & privat)
- Session-Management mit Lobby

### 📚 Wikipedia-Integration (NEU)
- Historische Ereignisse mit echten Wikipedia-Artikeln anreichern
- Kontextwissen und verwandte Themen
- Intelligentes Caching

### 🧬 Bevölkerungsdynamik (v2.1.5 - NEU!)
- **Individuelle Bürger-Simulation**: Jeder Bürger hat Name, Alter, Beruf, Bedürfnisse
- **Familienbildung und Dynastien**: Verwandtschaftsbeziehungen über Generationen
- **Demografische Simulation**: Realistische Geburten- und Sterberaten, Alterspyramiden
- **Epidemien & Hungersnöte**: Mit individueller Krankheitsverbreitung
- **Soziale Netzwerke**: Freundschaften, Feindschaften, Informationsverbreitung
- **Soziale Bewegungen**: Revolutionen, Reformen, Proteste
- **Multiplayer**: Jeder Spieler kann jeden Bürger übernehmen!
- **PixiJS Visualisierung**: Interaktive Bevölkerungskarten und Alterspyramiden

### 🌍 Ökologische Simulation (v2.2.3)
- **Dynamisches Klima-System**: Jahreszeiten, Klimawandel über Jahrhunderte, Wettervorhersage-Technologien
- **Naturkatastrophen**: Überschwemmungen, Dürren, Stürme, Erdbeben, Waldbrände, Heuschrecken
- **Ressourcen-Management**: Erschöpfung und Regeneration von Holz, Stein, Eisen, Wildtieren
- **Landschafts-Veränderung**: Entwaldung, Wiederaufforstung, Flussläufe, Bodenerosion
- **Terraforming**: Sumpftrockenlegung, Landgewinnung, Bewässerung, Bodenverbesserung
- **Tierpopulationen**: Wildtiere (Hirsche, Wildschweine, Wölfe, Bären), Viehzucht, Fischerei
- **Artenschutz**: Jagdbeschränkungen, Schutzgebiete, Zuchtprogramme, Aussterbe-Events
- **Multiplayer**: Gemeinsame Umweltkrisen, Jagdkonflikte, Grenzstreitigkeiten

### 🤝 Diplomatie-System (v2.3.0 - NEU!)
- **Diplomatische Beziehungen**: Verwaltung von Beziehungen zu anderen Königreichen mit Vertrauens- und Beziehungswerten
- **Verträge & Allianzen**: Vollständiges Vertragssystem (Frieden, Bündnis, Handel, Nicht-Angriff, Vasallentum)
- **Handelsabkommen**: Umfassendes Handelssystem mit Ressourcenaustausch und Goldzufluss
- **Kriegserklärungen**: Kriegssystem mit Causus Belli, Verbündeten und Kriegspunkten
- **Friedensverhandlungen**: Friedensangebote mit Bedingungen für Gold, Territorium und Handel
- **Multiplayer**: Verhandlungen zwischen echten Spielern, Mehrspieler-Verträge

### 🎭 Life Simulation System (v2.6.0 - NEU!)
- **👤 Rollenwechsel**: Wechsle nahtlos zwischen allen lebenden Charakteren
- **🤖 AI Controller**: 4-Schichten-KI-System (Grundbedürfnisse, Rollen, Beziehungen, Ambitionen)
- **4 AI-Typen**: Reactive, Proactive, Historical, Dynamic
- **⏱️ Drei Zeit-Modi**: Detail (1s=1 Tag), Ausgewogen (1s=1 Monat), Strategisch (1s=1 Jahr)
- **🎨 Dynamische Ansichten**: UI passt sich der Rolle an (8 verschiedene Ansichtstypen)
- **📊 Charakter-Dashboard**: Vermögen, Ruf, Gesundheit, Glück, Bedürfnisse
- **🔄 Meta-Wissen**: Wissen bleibt über Charakterwechsel erhalten
- **💡 Empfohlene Charaktere**: Basierend auf Familie und sozialen Beziehungen
- **🎯 Rollenspezifische Ziele**: Jeder Beruf hat eigene AI-Verhaltensweisen

**Siehe [LIFE_SIMULATION.md](docs/LIFE_SIMULATION.md) für Details**

### 🎮 Lebensphasen-basiertes Gameplay (v2.5.0 - NEU!)
- **🎬 Intro-Sequenz**: Historisches Cinematic + Philosophische Fragen für Persönlichkeitsprofil
- **⏳ 9 Zeitperioden**: Von Antike (500) bis Zukunft (2100) - Wähle deine Ära!
- **👶 3 Lebensphasen**: Starte als Kind (5-10J), Schüler (10-14J) oder Erwachsener (18-25J)
- **📅 Monatliche Zyklen**: 24h-Zeitmanagement (Arbeit, Familie, Bildung, Freizeit, Schlaf)
- **🎯 5 Karrierepfade**: Handwerk, Politik, Militär, Klerus, Gelehrte (je 5 Aufstiegsstufen)
- **⚡ 3 Geschwindigkeitsmodi**: Detailreich (Tag), Ausgewogen (Monat), Strategisch (Jahr)
- **💼 Berufsspezifische Aktionen**: Jede Rolle hat einzigartige monatliche Entscheidungen
- **📈 Aufstiegssystem**: Vom Lehrling zum Meister - realistische Karriereentwicklung
- **🧠 Persönlichkeitssystem**: Charisma, Intellekt, Pragmatismus, Spiritualität beeinflussen Gameplay
- **📜 Historische Szenarien**: Vordefinierte Startpunkte in verschiedenen Epochen

**Siehe [GAMEPLAY_SYSTEM.md](docs/03-game-design/GAMEPLAY_SYSTEM.md) für Details**

### ⛪ Religions- & Kultursystem (v2.3.0 - NEU!)
- **7 Religionen**: Katholizismus, Protestantismus, Orthodoxie, Islam, Judentum, Heidentum, Atheismus
- **Kulturelle Identität**: 8 verschiedene Kulturen (Germanisch, Lateinisch, Slawisch, etc.)
- **Religiöse Gebäude**: 4 Gebäudetypen (Kapelle, Kirche, Kathedrale, Kloster)
- **Kulturelle Ereignisse**: 5 Festivals (Ostern, Weihnachten, Erntedank, etc.)
- **Bekehrung & Spannungen**: Vollständiges Konversionssystem mit religiösen Konflikten
- **Multiplayer**: Glaubenskriege, Bekehrungskampagnen

### 📜 Erweiterte Historische Inhalte (v2.3.0 - NEU!)
- **70 Historische Ereignisse**: Von Wikingerüberfällen bis Klimastabilisierung (Jahr 793-2080)
- **Event-Ketten**: Kreuzzüge, Hanse, 30-jähriger Krieg, Weltkriege, Digitale Revolution
- **Regionale Ereignisse**: Deutschland, Europa, globale Events
- **Alternative Geschichte**: Was-Wäre-Wenn-Szenarien mit Spieler-Entscheidungen
- **Dynamische Events**: 8 Event-Vorlagen mit Wahrscheinlichkeiten

### 👥 Neue Rollen & Gebäude (v2.3.0 - NEU!)
- **35 Spielbare Rollen**: +10 neue Rollen (Bankier, Architekt, Spion, Admiral, General, Journalist, Erfinder, Diplomat, Fabrikbesitzer, Philosoph)
- **68 Gebäudetypen**: +30 neue Gebäude (Banken, Museen, Parlamente, Raumhäfen, etc.)
- **3 Weltwunder**: Kolosseum, Eiffelturm, Brandenburger Tor
- **Spezialgebäude**: Mit einzigartigen Boni und Effekten

### 🏛️ Erweiterte Politik (v2.3.0 - NEU!)
- **53 Politik-Maßnahmen**: +20 neue Maßnahmen in 4 neuen Kategorien
- **Umweltpolitik**: CO2-Steuer, Erneuerbare Energien, Emissionsgrenzwerte, Naturschutz, Plastikverbot
- **Digitalpolitik**: Datenschutz, Internet-Zensur, Digitale Infrastruktur, Cybersicherheit
- **Wissenschaftspolitik**: Forschungsförderung, Universitätsausbau, Nobelpreis, Weltraumprogramm
- **Sicherheitspolitik**: Polizeireform, Unabhängige Justiz, Strafrechtsreform, Grenzsicherung

### 🎯 Roadmap Features (v2.3.1 - NEU!)
- **🎭 10 Historische Persönlichkeiten**: Karl der Große, Bismarck, Luther, Einstein, Goethe, Beethoven
- **⚔️ 10 Historische Schlachten**: Von Teutoburger Wald (9 n.Chr.) bis Kursk (1943)
- **🦠 8 Krankheiten & Epidemien**: Pest, Cholera, Spanische Grippe mit vollständiger Simulation
- **🌪️ 8 Naturkatastrophen**: Erdbeben, Überschwemmungen, Dürren mit historischen Beispielen
- **🚂 15 Transportsysteme**: Von Pferd bis Hochgeschwindigkeitszug
- **🛤️ 10 Handelsrouten**: Bernsteinstraße, Hanserouten, EU-Binnenmarkt
- **🎨 11 Kunststile**: Von Romanik bis Postmoderne
- **🎭 12 Kulturelle Events**: Oktoberfest, Weihnachtsmarkt, Karneval, Berlinale
- **🔬 15 Wissenschaftliche Entdeckungen**: Buchdruck, Relativitätstheorie, Internet
- **⚖️ 10 Rechtssysteme**: Von Stammesrecht bis EU-Recht
- **💰 12 Steuersysteme**: Von Zehnt bis CO2-Steuer
- **⚔️ 15 Militäreinheiten**: Von Miliz bis Mechanisierte Infanterie

### 🎮 Integrierte Gameplay-Systeme (v2.4.0 - NEU!)
- **⛪ Religionssystem**: 10 Religionen, religiöse Gebäude, Konversion, religiöse Spannungen
- **🚶 Migrationssystem**: Bevölkerungsbewegungen zwischen Regionen basierend auf Wirtschaft, Sicherheit, Lebensqualität
- **📈 Soziale Mobilitätssystem**: Klassenwechsel, Berufsaufstieg, soziale Bewegungen
- **🌾 Hungersnot-System**: Regionale Hungersnöte mit Ursachen und Auswirkungen
- **💰 Ökonomische Kohorten**: Skalierbare Wirtschaft für bis zu 80 Millionen Bürger
- **⚔️ Gelände & Wetter im Kampf**: Terraineffekte (Höhen, Wälder, Flüsse) und Wettereinflüsse in Schlachten
- **🎖️ Militärformationen**: Keil, Phalanx, Linie und weitere taktische Formationen
- **📦 Versorgungslogistik**: Versorgungslinien, Winterquartiere, Lager für Armeen
- **🏰 Belagerungs-System**: Stadtbelagerungen mit Werkzeugen (Katapulte, Kanonen), Mauern, Versorgung
- **🛡️ Befestigungssystem**: Stadtmauern von Holzpalisaden bis Bunkern
- **⚓ Marinekriegsführung**: 8 Schiffstypen, 10 Naval-Technologien, Seeschlachten, Blockaden, Piraterie
- **🕵️ Spionage-System**: Agentennetzwerke, Missionen, Sabotage, Attentate, Doppelagenten
- **⚔️ Kriegsgefangene-System (v2.5.1)**: 
  - Gefangenennahme aus Schlachten und Belagerungen
  - 6 Behandlungsrichtlinien (Menschlich, Standard, Hart, Zwangsarbeit, Lösegeld, Hinrichtung)
  - Gefangenenlager mit konfigurierbarer Sicherheit und Bedingungen
  - Gefangenenaustausch und Lösegeldverhandlungen
  - Fluchtversuche mit sicherheitsbasierten Erfolgsraten
  - Genfer Konvention Compliance (ab 1929)
  - Diplomatische Konsequenzen für Behandlung
  - Monatliche Gesundheit, Moral und Wirtschaftskosten
  - Historische Ereignisse und berühmte Gefangene
  - Umfassendes PoW-Verwaltungs-UI-Panel
- **💰 Kriegsfinanzierung & Kriegsanleihen (v2.3.6 - NEU!)**:
  - 12 historische Finanzierungsmethoden (Plünderung, Kriegssteuern, Kriegsanleihen, etc.)
  - Authentische Kriegsanleihen aus WW1 & WW2 (Liberty Bonds, Deutsche Kriegsanleihen)
  - Kreditsystem mit Zinsen und Rückzahlungsfristen
  - 5 Rückzahlungsstrategien (Regulär, Sparpolitik, Zahlungsausfall, Neuverhandlung, Inflation)
  - Historische Events (Hyperinflation 1923, Marshall-Plan 1948, Bretton Woods)
  - Wirtschaftliche Konsequenzen: Inflation, Popularität, Stabilität, Schuldenmanagement
  - Monatliche Schuldenzahlungen mit automatischem Management
  - Umfassendes UI-Panel mit 5 Tabs (Übersicht, Methoden, Kredite, Rückzahlung, Geschichte)
- **🏙️ Stadtbezirks-System**: Slums, Nobelviertel, Gentrifizierung, Kriminalität
- **🌙 Tag/Nacht-Zyklus**: Tagesrhythmus mit unterschiedlichen Aktivitäten (Märkte morgens, Theater abends)
- **🎨 Kunst & Kultur**: Künstler, Kunstwerke, Aufführungen, kulturelle Kreise, Konzerte
- **📰 Informationsverbreitung**: Nachrichten, Gerüchte, Propaganda, Medien von Flugblättern bis Internet
- **⚖️ Rechtssystem & Gerichte**: Gerichtsverfahren, Richter, Gefängnisse, Bürokratie, Korruption
- **📚 Bibliothekssystem**: Büchersammlungen, Zensur, digitale Bibliotheken, Open Access
- **🎓 Universitätssystem**: Historische deutsche Universitäten, Nobelpreise, Forschung
- **📜 Historische Events**: Erweiterte Event-Datenbank mit Event-Ketten

### 🚢 Handelsrouten & Transport (v2.6.0 - NEU!)
- **🗺️ Handelsrouten-System**: 10 historische Handelsrouten aktivieren und verwalten
  - Bernsteinstraße, Hanseatic Trade, Seidenstraße-Extension, EU-Binnenmarkt, etc.
  - Kosten-basierte Aktivierung (Länge × Gefahr)
  - Voraussetzungen: Infrastruktur (Häfen) und Technologie
- **💰 Wirtschaftliche Integration**:
  - Monatliches Einkommen aus aktiven Routen
  - Modifikatoren: Infrastruktur (+Märkte, Häfen, Straßen, Lagerhäuser)
  - Bonus: Kultureinfluss, Prestige, Trade Power
  - Malus: Stabilität, Kriegsstatus
- **🚂 15 Transporttypen**: Vom Fußgänger bis Hochgeschwindigkeitszug
  - Kategorien: Zu Fuß, Reittiere, Gespanne, Schiffe, Eisenbahn, Kraftfahrzeuge, Luftfahrt
  - Historische Epochen: Antike → Zeitgenössisch
  - Eigenschaften: Geschwindigkeit, Kapazität, Kosten, Wartung, Reichweite
- **📊 Umfangreiches UI-Panel**:
  - Tab: Aktive Routen (mit Deaktivierungs-Option)
  - Tab: Verfügbare Routen (mit Aktivierungs-Button)
  - Tab: Transportmittel-Galerie
  - Tab: Statistiken-Dashboard (Einkommen, Kultureinfluss, Modifikatoren)
