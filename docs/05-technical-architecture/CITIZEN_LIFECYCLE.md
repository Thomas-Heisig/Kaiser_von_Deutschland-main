# Bürgerleben, Automatik und Nachfolge

Stand: 24.10.2026. Dies ist ein Spielmodell, keine belegte Rekonstruktion historischer Lebenserwartung, Eheschließung oder Fertilität.

## Ursache und Versorgung

Bisher sanken sämtliche Bedürfnisse monatlich, ohne dass vorhandene Nahrung oder Infrastruktur sie auffüllten. Daraus folgten Gesundheitsschäden auch in versorgten Reichen. Zudem starteten Personen ohne Partnerschaften; die vorhandene schwangerschaftsgebundene Geburt konnte daher kaum Nachwuchs erzeugen.

Bedürfnisse nähern sich jetzt den Lebensbedingungen an. Nahrungsvorrat relativ zum Monatsverbrauch, Werkstätten, Krankenhäuser, Schulen, Kirchen, Tavernen und Stabilität beeinflussen die entsprechenden Werte. Gut versorgte Personen können sich erholen; Hunger, Krankheiten und zunehmendes Alter bleiben gefährlich. Alter wird aus Geburtsjahr und -monat berechnet. Ein gespeicherter Monatsmarker verhindert doppelte Verarbeitung derselben Person.

Benannte Bürger sind eine Stichprobe der bereits gezählten Bevölkerung: Es wird keine zweite Nahrungsrechnung erhoben. Gespielte und beauftragte Personen erhalten die Bedingungen ihres Reiches. Für unzugeordnete Personen verwendet der noch gemeinsame Bürgerpool die mittleren Bedingungen aller Spielerreiche. Individuelle Wohnorte und Haushaltsbudgets sind weiterhin nicht vollständig mit den regionalen Versorgungsgebieten gekoppelt.

## Familien und Beruf

Ein jährlicher, begrenzter Suchlauf verbindet erwachsene, ungebundene Personen desselben Ortes zu Haushalten. Minderjährige, direkte Verwandte, gleiche Familienzugehörigkeit und gemeinsame Vorfahren bis drei Generationen werden ausgeschlossen. Pro Suchpool werden höchstens 64 Kandidaten geprüft. Das vereinfachte Modell umfasst weder historische Ehegesetze noch eine vollständige Beziehungs- oder Adoptionssimulation.

Die bestehende Schwangerschaftsmechanik benötigt eine lebende Partnerperson am selben Ort, ausreichende Gesundheit und Versorgung sowie Abstand zur letzten Geburt. Kinder erhalten echte Elternbeziehungen und altern regulär. Ab 16 beginnen bislang arbeitslose Nachkommen eine einfache Bauern- oder Handwerkstätigkeit. Rollen und Nachfolge sind erst ab 18 möglich. Ausbildung, Arbeitsplätze und Eigentumsvererbung bleiben eigene Roadmap-Aufgaben.

## Bedienung und Automatik

Unter **Charakter** oder **Hofverwaltung** lässt sich **Charakter & Nachfolge** aktivieren. Pläne: Ausgewogen, Arbeiten, Studieren, Waffenübung und Dem Reich dienen. Ausgewogen priorisiert persönliches Einkommen, Bildung und Kampffähigkeit. Dem Reich dienen spendet die Hälfte des persönlichen Vermögens und wird nur ausdrücklich gewählt. Pro Monat ist weiterhin nur eine persönliche Handlung erlaubt; manuelle Aktionen haben Vorrang.

Die Zuschauer-Voreinstellung aktiviert auch die Charakterautomatik und schaltet bestehende Hofämter auf automatische Arbeit. Einzelne Bereiche bleiben abschaltbar. Alte Spielstände erhalten die neue Charakterautomatik zunächst ausgeschaltet und den Plan Ausgewogen.

Hofverwaltung und Bürgeraufträge zeigen alle dort zugewiesenen Personen mit Namen, Aufgabe, Modus und Fortschritt. Namen aktiver Aufträge werden direkt über die Bürger-ID aufgelöst, auch außerhalb der begrenzten Kandidatenliste. Hofamt, Auftrag und gespielte Rolle können nicht gleichzeitig derselben Person zugeteilt werden.

## Todesfälle und Nachfolge

- Die Herrschaft bleibt beim Tod ihrer gespielten Figur bestehen. Bei aktiver Charakterautomatik werden freie erwachsene Kinder, Partner, weitere Familienmitglieder und dann andere Erwachsene bevorzugt. Ohne Automatik wählt der Spieler selbst.
- Ist kein freier benannter Erwachsener verfügbar, obwohl die aggregierte Bevölkerung größer als die benannte lebende Bevölkerung ist, wird eine bereits vorhandene erwachsene Person namentlich erfasst. Die Chronik erklärt ausdrücklich, dass sie kein erfundener Nachkomme ist; die Reichsbevölkerung steigt dadurch nicht.
- Automatische Hofämter erhalten eine verfügbare erwachsene Nachfolge. Beratende Ämter bleiben sichtbar vakant, bis der Spieler sie neu besetzt.
- Bei aktiver Bürgerauftragsautomatik übernimmt ein freier Erwachsener verwaiste Arbeit. Fortschritt und schon bezahlte Mittel bleiben erhalten. Ohne geeignete Person wartet der Auftrag. Ohne Automatik gilt weiterhin der bisherige Abbruch beim nächsten Verarbeitungsschritt.
- Todesfälle der gespielten Rolle, vakante Hofämter und automatische Übergaben erscheinen in der gespeicherten Chronik. Alte Spielstände mit verstorbenen Amtsinhabern bleiben ladbar. Andere Hotseat-Figuren werden nicht übernommen.

## Prüfung und Grenzen

`CitizenLongevity.test.ts` startet je 120 Erwachsene im Alter 20–39 mit festem Zufallsstartwert 724. In den versorgten Läufen ab 1200 bzw. -100 leben nach zehn Jahren jeweils 101 der Ausgangspersonen; nach 60 Jahren leben 49 erwachsene Nachkommen. Nach 30 Jahren wird gespeichert und geladen. Diese Ergebnisse sind reproduzierbare Regressionen unter kontrollierten Bedingungen, keine Garantie für jede Partie oder historische Statistik.

Engine-Tests prüfen zehn versorgte Spieljahre, manuelle Aktionspriorität, Nachfolge, fehlende freie Erwachsene, Doppelbelegung, Auftragsfortschritt, Hotseat und Speicherkompatibilität. `scripts/lifecycle-smoke.mjs` prüft sichtbare Personen, Charakterplan, Monatsaktionen und Wiederladen bei 375/768/1024 Pixeln in drei Epochen. Die vollständige Suite umfasst 328 bestandene Tests und sieben bereits vorhandene übersprungene Tests.

Noch offen: mindestens 100 Jahre durch alle gekoppelten Systeme, historisch differenzierte Haushaltsmodelle, regionale Namensräume, Familienwanderung, Eigentumsvererbung, große Bevölkerungen und reale Touchgeräte.
