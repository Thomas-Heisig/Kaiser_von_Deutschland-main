# Gameplay Testing Guide - Life Simulation v2.6.0

## 🎮 How to Test the Integrated Life Simulation System

This guide will help you verify that all the life simulation systems are working correctly.

## Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open browser to `http://localhost:4100`

## Testing Checklist

### ✅ 1. Game Startup and Character Assignment

**Steps:**
1. Click "Weiter →" on the start screen
2. Enter player name and kingdom name (e.g., "Heinrich", "Mittelreich")
3. Click "Spiel starten! 🎮"

**Expected Results:**
- ✅ Game starts without errors
- ✅ Console shows: "🎮 Initializing Life Simulation for player: [player_id]"
- ✅ Console shows: "✅ Player session created"
- ✅ Console shows: "✅ Initial citizens generated"
- ✅ Console shows: "✅ Erster Charakter zugewiesen: [Name] ([Profession])"
- ✅ Game screen appears with Character Dashboard visible

### ✅ 2. Character Dashboard Display

**Location:** Top-left corner of game screen

**Expected Display:**
- Character name (e.g., "Heinrich von Berg")
- Profession, age, and social class (e.g., "Adeliger, 35 Jahre, Adel")
- Stats with progress bars:
  - 💰 Vermögen (Wealth)
  - ⭐ Ruf (Reputation)
  - ❤️ Gesundheit (Health)
  - 😊 Glück (Happiness)
- Needs indicators:
  - 🍞 Nahrung (Food)
  - 🏠 Unterkunft (Shelter)
  - 🛡️ Sicherheit (Safety)

**Test:**
- Values should update in real-time as game progresses
- Progress bars should visually represent the values

### ✅ 3. Time Controls Panel

**Location:** Top-right corner of game screen

**Expected Display:**
- Current date (e.g., "Datum: Januar 1200")
- Time mode (e.g., "Modus: Ausgewogen (1s=1 Monat)")
- Speed multiplier (e.g., "Geschwindigkeit: 1.0x")
- Control buttons:
  - ⏸️/▶️ Pause/Resume button
  - 📅 Detail mode (1s=1 Day)
  - 📆 Balanced mode (1s=1 Month)
  - 🗓️ Strategic mode (1s=1 Year)
  - ◀ Slower speed
  - ▶ Normal speed
  - ▶▶ Faster speed

**Tests:**

1. **Pause/Resume:**
   - Click pause button
   - Date should stop advancing
   - Click resume button
   - Date should continue advancing

2. **Time Modes:**
   - Click "Detail" (📅) - Time should advance by days
   - Click "Balanced" (📆) - Time should advance by months
   - Click "Strategic" (🗓️) - Time should advance by years

3. **Speed Control:**
   - Click "◀" - Time should slow down (speed < 1.0x)
   - Click "▶" - Speed should return to 1.0x
   - Click "▶▶" - Time should speed up (speed > 1.0x)

### ✅ 4. Role Switching Between Characters

**Steps:**
1. Click the "👤 Charakter wechseln" button in the bottom action panel
2. Role Switching Panel should appear (centered overlay)

**Expected Panel Content:**
- Title: "Charakter wechseln"
- Current character info displayed
- List of recommended characters showing:
  - Name (e.g., "Friedrich Schmidt")
  - Profession, age, social class, region
  - Wealth indicator (💰)
  
**Test Character Switching:**
1. Click on a different character in the list
2. **Expected:**
   - Console shows: "Erfolgreich zu [Name] gewechselt"
   - Character Dashboard updates to show new character
   - Current character info in role switching panel updates
   - Dynamic game view updates (console shows view update)

3. Click "Schließen" to close the panel

**Verify AI Takeover:**
- When you switch away from a character, the previous character should be controlled by AI
- Check console for: "Charakter [Name] wird nun von KI gesteuert ([AI Type])"

### ✅ 5. Population Dynamics

**Check Console:**
- During monthly ticks, AI controllers should update citizens
- You should see AI decision-making logs for non-player characters

**Expected Behaviors:**
- Citizens age over time
- Some citizens may die (random events)
- Social relationships form and change
- Citizens may change professions (social mobility)
- Migration between regions may occur

### ✅ 6. Integration Verification

**Check Console Logs:**

During game startup, you should see:
```
✨ Kaiser II Game initialized successfully
🎮 Initializing Life Simulation for player: player1
✅ Player session created
✅ Initial citizens generated
Generated 75 initial citizens across 5 regions
✅ Erster Charakter zugewiesen: Heinrich von Berg (noble)
✨ Game started successfully with player: [Player object]
```

During gameplay:
```
⏳ Waiting for game to start - GameEngine will initialize life simulation
✅ Character dashboard updated
```

When switching characters:
```
Erfolgreich zu Friedrich Schmidt gewechselt
Charakter Heinrich von Berg wird nun von KI gesteuert (Proactive)
```

### ✅ 7. Dynamic Game View

**What to Verify:**
- When switching to different character types, the view context should change
- Console should show: `DynamicGameView updated for [role]`
- Different professions should have different view types:
  - **King/Noble** → Strategic overview
  - **Merchant** → Trade and market view
  - **Farmer** → Agricultural view
  - **Soldier** → Military tactical view
  - **Scholar** → Knowledge and research view

### ✅ 8. Common Issues and Troubleshooting

**Issue:** "Kein Charakter" shown in dashboard
- **Fix:** Make sure game has been started (not just game screen shown)
- Check console for session creation logs

**Issue:** Time not advancing
- **Fix:** Check if game is paused
- Resume with the play button

**Issue:** No characters shown in role switching panel
- **Fix:** Wait for game to start and citizens to be generated
- Check console for citizen generation logs

**Issue:** Character dashboard not updating
- **Fix:** Check browser console for errors
- Verify update loop is running (should update every frame)

## 🎯 Success Criteria

The life simulation integration is successful if:

- [x] Player session is created automatically on game start
- [x] 50-100 initial citizens are generated across 5 regions
- [x] First character is automatically assigned (preferring noble/merchant)
- [x] Character Dashboard displays and updates in real-time
- [x] Time Controls Panel displays and all buttons work
- [x] Role Switching Panel shows list of characters
- [x] Character switching works without errors
- [x] AI takes over previous character when switching
- [x] Dynamic game view updates on character switch
- [x] Time advances according to selected mode and speed
- [x] Console shows no critical errors

## 📊 Performance Expectations

With 50-100 citizens:
- ✅ Smooth 60 FPS gameplay
- ✅ UI updates without lag
- ✅ Character switching is instant
- ✅ Time system updates smoothly

## 🐛 Reporting Issues

If you find issues, please report:
1. What you were doing (steps to reproduce)
2. What you expected to happen
3. What actually happened
4. Console error messages (if any)
5. Browser and version

## 🎉 Next Steps After Testing

Once basic functionality is verified:
1. Test with larger populations (1000+ citizens)
2. Test long gameplay sessions (10+ years game time)
3. Test all character professions
4. Test social relationships and family systems
5. Test migration between regions
6. Test AI decision-making for different personality types
7. Verify memory usage stays reasonable over time
