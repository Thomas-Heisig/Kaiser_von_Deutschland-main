# Lastmessung Bevölkerung · 24.10.2026

Reproduzierbar mit laufendem Vite auf `127.0.0.1:4173`, Playwright 1.56.1 in `.browser-tools` und `node scripts/population-benchmark.mjs`. Rohdaten: [JSON](strategy-population-2026-10-24.json). Basis-Commit und Kennzeichnung des geänderten Arbeitsbaums stehen in den Rohdaten; der zugehörige Implementierungsstand ist der Commit dieses Berichts.

Gemessen wurde die echte GameEngine über zwölf Monate einschließlich Jahreswechsel und monatlichem IndexedDB-Autosave, danach explizites Speichern/Laden. Windows, Ryzen 5 9600X, Chromium 141 headless. RNG-Seed 20261024 ab Initialisierung; UUIDs und Uhrzeit bleiben variabel. Neue Browserseite pro Größe. Keine anderen Tests liefen parallel. Dies ist **ein Lauf pro Größe**, kein statistisch belastbarer Gerätevergleich. P95 bei zwölf Messpunkten entspricht hier dem Maximum.

| Bürger am Start | Monatsmedian | Maximum/P95 | Speichern | Laden | JS-Heap am Ende |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1.000 | 35 ms | 47 ms | 34 ms | 13 ms | 10,6 MB |
| 5.000 | 110 ms | 155 ms | 144 ms | 42 ms | 43,6 MB |
| 20.000 | 380 ms | 540 ms | 472 ms | 134 ms | 52,5 MB |

Heap-Werte stammen aus CDP `Performance.getMetrics`, **ohne erzwungene Garbage Collection**, nach dem Durchlauf. Sie belegen weder Spitzenverbrauch noch Leckfreiheit; GPU-, DOM- und native Speicheranteile fehlen. Die Simulation verändert die Bevölkerung während des Jahres: 972/4.858/19.437 verbleibende Bürger.

## Behobener Engpass

Komprimierte Saves speicherten GZIP-Daten als JavaScript-Zahlenarray. Nun verwendet die JSON-kompatible Hülle `gzip-base64-v2` eine Zeichenkette; sowohl `gzip-json-v1` als auch unkomprimierte Version-2-Spielstände bleiben lesbar. Die reine Bürgerliste bei 20.000 Startbürgern umfasst rund 27,35 MB JSON, 5,35 MB GZIP beziehungsweise 7,14 MB inklusive Base64-Hülle.

Eine vorläufige Messung mit dem alten Format ergab bei 20.000 Bürgern etwa 636 ms Speichern und 393 ms Laden. Wegen abweichendem RNG-Start und Hintergrundlast ist dies nur ein Hinweis auf den vermiedenen Kopieraufwand, kein kontrollierter Beschleunigungsfaktor.

## Weiterhin offene Leistungsarbeit

Ein Monatswechsel mit 20.000 Bürgern liegt deutlich über einem interaktiven 50-ms-Ziel. Monatssimulation, Serialisierung und Speicherung benötigen weitere Aufteilung/Worker und Profiling. Keine Freigabe für 100.000 oder die historisch behaupteten 80 Millionen Bürger. Es fehlen wiederholte Langläufe, Spitzen-/Leckmessungen, vollständige Kartenlast sowie reale iPhone-/iPad-/Android-Messungen. Die gemessenen Werte werden nicht als Mobilgerätebudget ausgegeben.
