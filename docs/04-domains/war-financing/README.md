# War Financing System - Implementierungshandbuch

## 📋 Überblick

Das War Financing System (v2.3.6) bietet umfassende Kriegsfinanzierungsmechaniken mit historischer Genauigkeit. Spieler können ihre Kriege durch verschiedene Methoden finanzieren - von mittelalterlicher Plünderung bis zu modernen Staatsanleihen.

## 🚀 Schnellstart

### 1. System-Integration

Das WarFinancingSystem ist bereits im GameEngine integriert:

```typescript
// Zugriff auf das System über GameEngine
const warFinancingSystem = gameEngine.getWarFinancingSystem();
```

### 2. UI-Panel verwenden

```typescript
import { WarFinancingPanel } from '../ui/WarFinancingPanel';
import { GameEngine } from '../core/GameEngine';

// Panel erstellen
const gameEngine = new GameEngine();
const warFinancingSystem = gameEngine.getWarFinancingSystem();
const warFinancingPanel = new WarFinancingPanel(warFinancingSystem);

// Spielzustand setzen
const player = gameEngine.getPlayer('player-id');
const kingdom = player.getKingdom();
const currentYear = gameEngine.getCurrentYear();
const victories = 3; // Anzahl gewonnener Schlachten

warFinancingPanel.setState(kingdom, currentYear, 1, victories);

// Panel anzeigen
warFinancingPanel.show();
```

### 3. Finanzierungsmethode aktivieren

```typescript
const result = warFinancingSystem.activateFinancingMethod(
  kingdom,
  'war_bonds_ww1', // Methoden-ID
  1917, // Jahr
  6 // Monat
);

if (result.success) {
  console.log(result.message);
  console.log('Gold erhalten:', result.goldGained);
  console.log('Effekte:', result.effects);
}
```

### 4. Monatliche Zahlungen verarbeiten

```typescript
// In der monatlichen Update-Schleife
const paymentResult = warFinancingSystem.processMonthlyPayments(kingdom);

console.log('Gezahlt:', paymentResult.totalPayment);
console.log('Kredite abgeschlossen:', paymentResult.loansCompleted);

if (paymentResult.cannotAfford) {
  console.warn('Kann Schulden nicht bezahlen! Strafen angewendet.');
}
```

## 📊 Verfügbare Finanzierungsmethoden

### Mittelalter (500-1500)
- **Plünderung und Beute**: 1.000-5.000 Gold, -10 Popularität
- **Söldner-Darlehen**: 10.000 Gold, 15% Zinsen, 5 Jahre

### Neuzeit (1500-1900)
- **Kriegssteuer**: 1.5x Einkommen für 12 Monate
- **Vermögensbeschlagnahmung**: 5.000-20.000 Gold
- **Verkauf von Adelstiteln**: 10.000-50.000 Gold

### Weltkriege (1914-1945)
- **Kriegsanleihen WW1**: 50.000 Gold, 5% Zinsen, 10 Jahre
- **Kriegsanleihen WW2**: 100.000 Gold, 2.5% Zinsen, 20 Jahre
- **Leih-und-Pacht**: 150.000 Materialwert, diplomatischer Bonus

### Modern (1900-2100)
- **Moderne Staatsanleihen**: 200.000 Gold, 3% Zinsen, 30 Jahre
- **Gelddrucken**: 50.000 Gold, +15% Inflation

## 💰 Rückzahlungsstrategien

1. **Reguläre Rückzahlung**: Normale Tilgung
2. **Sparpolitik**: 1.5x schneller, -20 Popularität
3. **Zahlungsausfall**: Schulden gestrichen, -50 Diplomatische Beziehungen
4. **Neuverhandlung**: 30% Zinsreduktion, benötigt Diplomatie 60+
5. **Inflationserosion**: 20% Schuldenabbau durch Inflation

## 🎯 Historische Ereignisse

- **Hyperinflation 1923**: Wirtschaftlicher Kollaps nach WW1
- **Bretton-Woods 1944**: Neue Weltwährungsordnung
- **Marshall-Plan 1948**: 100.000 Gold Wiederaufbauhilfe

## 📈 Statistiken

```typescript
const stats = warFinancingSystem.getStats();
// - totalWarDebt: Gesamtschulden
// - monthlyDebtPayment: Monatliche Zahlung
// - activeLoans: Anzahl aktiver Kredite
// - totalGoldRaisedFromWar: Gesamt beschafft
// - popularityFromWarFinancing: Popularitätseffekt
// - inflationFromWarFinancing: Inflationseffekt
```

## ⚠️ Wichtige Hinweise

- Zu hohe Schulden können zu wirtschaftlichem Kollaps führen
- Kriegsverbrechen (z.B. Zwangsarbeit) haben schwere Konsequenzen
- Zahlungsausfall kann zu Kriegen führen
- Historische Events sind unvermeidlich

## 🔮 Roadmap

- [ ] Multiplayer-Integration (Kredite zwischen Spielern)
- [ ] Börsenhandel von Kriegsanleihen
- [ ] Kriegsentschädigungen und Reparationen

---

**Version:** 2.5.1  
**Letzte Aktualisierung:** 17. Oktober 2026  
**Status:** [Aktueller Projektstatus](../../00-meta/status.md) · [TODO](../../../TODO.md)
