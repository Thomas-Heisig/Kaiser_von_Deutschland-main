# Life Simulation Integration - Developer Quick Reference

## 🔧 Integration Summary

The life simulation system (v2.6.0) has been fully integrated into the game. This document provides a quick reference for developers.

## Key Components

### 1. GameEngine (Core Integration Point)

**Location:** `src/core/GameEngine.ts`

**New Methods:**
- `initializeLifeSimulation()` - Called in `startGame()`, sets up the entire life simulation
- `generateInitialCitizens()` - Creates 50-100 citizens across 5 German regions

**Flow:**
```typescript
startGame() 
  → initializeLifeSimulation()
    → createSession(playerId)
    → generateInitialCitizens() (if none exist)
    → switchRole(playerId, firstCitizenId, ...)
```

### 2. UIFlowManager (UI Integration Point)

**Location:** `src/ui/UIFlowManager.ts`

**Key Changes:**
- `startRenderLoop()` - Now updates CharacterDashboard and TimeControlsPanel every frame
- `createGameScreen()` - Instantiates CharacterDashboard, TimeControlsPanel, and RoleSwitchingPanel
- `showRoleSwitchingPanel()` - Opens panel and shows recommended characters
- `initializeFirstCharacter()` - Simplified to avoid duplicate initialization

**Update Loop:**
```typescript
app.ticker.add(() => {
  if (currentScreen === 'game') {
    characterDashboard?.update();
    timeControlsPanel?.updateDisplay();
  }
});
```

### 3. Life Simulation UI Components

#### CharacterDashboard
**Location:** `src/ui/CharacterDashboard.ts`

- Displays current character's stats, needs, and info
- Updates automatically via `update()` method
- Positioned top-left on game screen

#### TimeControlsPanel
**Location:** `src/ui/TimeControlsPanel.ts`

- Controls game time: pause/resume, mode selection, speed control
- Displays current date and time info
- Updates automatically via `updateDisplay()` method
- Positioned top-right on game screen

#### RoleSwitchingPanel
**Location:** `src/ui/RoleSwitchingPanel.ts`

- Shows list of available/recommended characters
- Handles character switching
- Positioned center as modal overlay (initially hidden)

**Fixed Issues:**
- Now uses `getCurrentMonth()` instead of hardcoded month value

### 4. Core Systems

All located in `src/core/`:

- **RoleSwitchingSystem** - Manages player sessions and character switching
- **AIController** - Manages AI for non-player characters (4 AI types)
- **TimeSystem** - Manages game time with 3 modes (Detail, Balanced, Strategic)
- **DynamicGameView** - Provides role-dependent visualization
- **CitizenSystem** - Manages all citizens and their lifecycle

## 🎯 Player Session Flow

```
Game Start
  ↓
Create Player (via UIFlowManager.startGame())
  ↓
GameEngine.startGame()
  ↓
GameEngine.initializeLifeSimulation()
  ↓
RoleSwitchingSystem.createSession(playerId)
  ↓
CitizenSystem generates 50-100 citizens
  ↓
RoleSwitchingSystem.switchRole(playerId, firstCitizenId)
  ↓
Citizen marked as isPlayerCharacter = true
  ↓
UIFlowManager.showGameScreen()
  ↓
CharacterDashboard displays current character
  ↓
Game Loop: Dashboard updates every frame
```

## 📊 Initial Population

**Generated on first game start:**
- **Count:** 50-100 random citizens
- **Regions:** preussen, bayern, sachsen, hanse, schwaben
- **Professions:** farmer, artisan, merchant, soldier, scholar, clergy, noble
- **Social Classes:** peasant (60%), middle (35%), noble (5%)
- **Age Range:** 18-68 years old
- **Names:** Authentic German medieval names

**Sample Citizen:**
```typescript
{
  firstName: 'Heinrich',
  lastName: 'von Berg',
  gender: 'male',
  age: 35,
  profession: 'noble',
  socialClass: 'noble',
  regionId: 'preussen',
  wealth: 150,
  reputation: 65,
  // ... many more fields
}
```

## 🔄 Character Switching

**User Action:**
1. Click "👤 Charakter wechseln" button
2. RoleSwitchingPanel opens
3. User clicks on a character

**System Response:**
```typescript
1. Old character: isPlayerCharacter = false
2. Old character: AI controller assigned
3. New character: isPlayerCharacter = true
4. New character: controlledByPlayerId = playerId
5. DynamicGameView.updateView(newCharacter)
6. CharacterDashboard.update()
```

## ⏰ Time System Integration

**Time Modes:**
- **DETAIL:** 1 second real-time = 1 day game-time
- **BALANCED:** 1 second = 1 month (default)
- **STRATEGIC:** 1 second = 1 year

**Speed Multipliers:**
- 0.5x (slower), 1.0x (normal), 2.0x, 4.0x, 8.0x (faster)

**Monthly Tick Integration:**
```typescript
GameEngine.monthlyTick() {
  // ... existing systems
  
  // Life simulation updates (v2.6.0)
  aiControllerManager.updateAll(...);
  timeSystem.update(16); // ~60 FPS
  
  // ... continue
}
```

## 🤖 AI Controller System

**AI Types:**
- **Reactive:** Responds to immediate needs (survival-focused)
- **Proactive:** Plans ahead, pursues goals
- **Historical:** Follows historical patterns for their role
- **Dynamic:** Adapts to circumstances, learns

**AI Layers:**
1. Basic Needs (food, shelter, safety)
2. Role Goals (profession-specific objectives)
3. Social Relationships (family, friends, rivals)
4. Ambitions (wealth, status, knowledge, power)

## 🛠️ Adding New Features

### To add a new character attribute:
1. Update `Citizen` interface in `CitizenSystem.ts`
2. Update `CharacterDashboard.ts` to display it
3. Update AI controllers to consider it in decisions

### To add a new time-based event:
1. Add to `GameEngine.monthlyTick()` or `processPlayerMonth()`
2. Ensure it respects `TimeSystem.getPaused()`

### To add a new UI panel:
1. Create in `src/ui/`
2. Instantiate in `UIFlowManager.createGameScreen()`
3. Add to update loop in `startRenderLoop()`

## 🧪 Testing Hooks

**Console Commands (for debugging):**
```javascript
// Access game engine
const engine = window.KaiserII.GameEngine;

// Get role switching system
const roleSystem = engine.getRoleSwitchingSystem();

// Get all citizens
const citizens = engine.getCitizenSystem().getAllCitizens();

// Get player session
const session = roleSystem.getSession('player1');

// Current character
const currentChar = roleSystem.getCurrentCharacter('player1', (id) => 
  engine.getCitizenSystem().getCitizen(id)
);
```

## 📈 Performance Considerations

**Current Scale:**
- 50-100 citizens: ✅ Excellent performance
- 1,000 citizens: ✅ Good performance
- 10,000 citizens: ⚠️ Use aggregation
- 100,000+ citizens: ⚠️ Requires cohort system (already implemented)

**Optimizations in Place:**
- Map-based lookups (O(1) citizen access)
- Regional indexing for spatial queries
- Lazy evaluation in AI controllers
- Framerate-based updates (not every citizen every frame)

## 🐛 Common Pitfalls

1. **Don't call `createSession()` multiple times** - Check if session exists first
2. **Don't generate citizens before game starts** - Wait for `startGame()`
3. **Always check `isAlive` before character operations**
4. **Use `getCurrentMonth()` not hardcoded values** - Month changes during gameplay
5. **Update UI panels in render loop** - Don't rely on manual updates

## 🔮 Future Enhancements

**Roadmap Items:**
- [ ] Save/load life simulation state
- [ ] Multiplayer role switching (different players control different characters)
- [ ] Character creation wizard (player creates custom citizen)
- [ ] Family tree visualization
- [ ] Social network graph visualization
- [ ] Historical event triggers based on character actions
- [ ] Achievements/milestones system

## 📚 Related Documentation

- `docs/LIFE_SIMULATION.md` - Comprehensive life simulation system documentation
- `GAMEPLAY_TESTING_GUIDE.md` - Testing checklist for QA
- `README.md` - General project documentation
- `FEATURE_SUMMARY.md` - All implemented features

## 🤝 Contributing

When adding life simulation features:
1. Follow existing patterns in `GameEngine` and `UIFlowManager`
2. Ensure TypeScript strict mode compliance
3. Add console logs for debugging (use `console.log` for info, `console.error` for errors)
4. Update this document with your changes
5. Test with various population sizes
