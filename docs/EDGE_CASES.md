# EDGE CASE HANDLING GUIDE

## Overview

Game data can be incomplete or corrupted (save file migrations, mod conflicts, network issues). Always assume optional fields might be undefined and handle gracefully.

## Key Principles

1. **Assume Worst Case**: Optional field = might be undefined
2. **Provide Defaults**: Factory functions initialize with sensible defaults
3. **Early Validation**: Check before using, not after crashing
4. **Log Warnings**: Record suspicious data for debugging
5. **Fail Gracefully**: Return safe values, don't throw

## Common Edge Cases

| Case | Without Guard | With Guard |
|------|---------------|----------|
| Null terrain | `Cannot read property 'biome'` (crash) | Returns 'unknown', logs warning |
| Undefined stats | `maxHealth ?? 100` repeated 20x (verbose) | Factory initializes once |
| Stale history | Memory bloats to 1GB (OOM crash) | Archival trims to recent 7 days |
| Race condition | Two CREATURE_KILLED events (double stats) | Dedup buffer detects, processes once |
| Missing XP | Code duplicates formula in 5 places (sync bugs) | Single `calculateXpForLevel()` function |

## Pattern: Defensive Factories

Use factories from `core/factories/` to safely initialize data:

```typescript
// ❌ WRONG - Repeated defensive checks scattered everywhere
const level = playerStats?.playerLevel?.level ?? 1;
const exp = playerStats?.playerLevel?.experience ?? 0;
const skills = playerStats?.skills ?? [];
const items = playerStats?.items ?? [];
// ... repeated 10+ times in different files

// ✅ CORRECT - Single factory call handles all cases
import { ensurePlayerStats } from '@/core/factories/statistics-factory';
const stats = ensurePlayerStats(playerStats);
const level = stats.playerLevel.level;  // Always defined
const exp = stats.playerLevel.experience; // Always defined
```

**Available Factories:**
- `ensurePlayerStats()` → Safe PlayerStatusDefinition
- `ensureCombatStats()` → Safe CombatStats
- `createDefaultPlayerStats()` → Fresh player with all fields
- `createDefaultCombatStats()` → Default combat baseline

## Pattern: Null-Safe Field Access

When factory not available, use this pattern:

```typescript
// ❌ WRONG - Crashes if terrain undefined
const biome = chunk.terrain.biome;

// ✅ CORRECT - Safe default fallback
const biome = chunk.terrain?.biome ?? 'unknown';

// ✅ ALSO CORRECT - Using existing factory
import { ensureTerrain } from '@/core/factories/terrain-factory';
const terrain = ensureTerrain(chunk.terrain);
const biome = terrain.biome;  // Always safe
```

## Pattern: History Archival

Prevent unbounded memory growth:

```typescript
// ❌ WRONG - Actions accumulate forever
let history = actionHistory;
history = ActionTrackerEngine.recordAction(history, action);
// After 1000 hours: 3.6M actions × 200 bytes = 720 MB

// ✅ CORRECT - Periodic cleanup
import { ActionArchivalEngine } from '@/core/engines/action-tracker/archival';
let history = actionHistory;
history = ActionTrackerEngine.recordAction(history, action);

// On save or periodic trigger:
if (gameState.turn % 1440 === 0) { // Every 24 hours
  history = ActionArchivalEngine.cleanupIfNeeded(
    history,
    gameState.gameTime
  );
}
```

**Configuration (in DEFAULT_ARCHIVAL_CONFIG):**
- Keep hot: 7 game days in memory (fast access for quests)
- Delete: After 30 game days
- Max size: 50 MB before forced cleanup

## Pattern: Event Deduplication

Prevent race conditions from duplicate events:

```typescript
// ❌ WRONG - Same event processed twice
if (creatureKilled) {
  const event: GameEvent = { type: 'CREATURE_KILLED', ... };
  statistics = StatisticsEngine.processEvent(statistics, event);
}
// If event fires twice in 100ms: creature count doubled

// ✅ CORRECT - Dedup guard blocks duplicates
import { EventDeduplicationGuard } from '@/core/engines/event-deduplication/guard';

let buffer = EventDeduplicationGuard.createDeduplicationBuffer();

if (creatureKilled) {
  const event: GameEvent = { type: 'CREATURE_KILLED', ... };
  
  // Only process if NOT duplicate
  if (!EventDeduplicationGuard.isDuplicate(event, buffer)) {
    statistics = StatisticsEngine.processEvent(statistics, event);
  }
  
  // Record for future dedup checks
  buffer = EventDeduplicationGuard.recordEvent(event, buffer);
}
```

**How it works:**
- Generates key from event type + target + time window
- Stores keys in rolling buffer (100 keys max)
- Detects if same key seen within 100ms window
- Auto-expires old keys (prevents unbounded growth)

## Pattern: Centralized Calculations

Prevent calculation duplication across code:

```typescript
// ❌ WRONG - Formula scattered in 5 places
if (xpGained > 0) {
  const newXp = playerXp + xpGained;
  const newLevel = Math.floor(newXp / 100) + 1;  // Copy 1
}

// Elsewhere...
const nextLevel = Math.floor(totalExp / 100) + 1;  // Copy 2 (out of sync!)

// ✅ CORRECT - Single source of truth
import { calculatePlayerLevel, calculateXpForLevel } from '@/core/rules/experience';
const newLevel = calculatePlayerLevel(playerXp + xpGained);
const xpNeeded = calculateXpForLevel(targetLevel);
```

**Benefits:**
- Single source of truth for formulas
- Easier to balance (change one function)
- Easier to test (test one pure function)
- No sync bugs from copy-paste

## Checklist: Edge Case Review

Before committing code:

- [ ] **Null checks**: All optional fields handled (use factories)
- [ ] **Bounded memory**: No unbounded data structures (implement archival)
- [ ] **Deduplication**: Race conditions prevented (use dedup guard)
- [ ] **No duplication**: Calculations centralized (use rules/)
- [ ] **Safe defaults**: Error cases return safe values (not thrown)
- [ ] **Documented**: Edge case handling in @remarks
- [ ] **Tested**: Edge case tests written (if critical path)

## Related Modules

- **Statistics Factory**: `src/core/factories/statistics-factory.ts`
- **Action Archival**: `src/core/engines/action-tracker/archival.ts`
- **Event Deduplication**: `src/core/engines/event-deduplication/guard.ts`
- **Experience Rules**: `src/core/rules/experience.ts`

## Examples by System

### Combat System
- **Null enemy stats** → Use `ensureCombatStats()`
- **Duplicate CREATURE_KILLED** → Use dedup guard
- **Missing XP formula** → Use `calculateExperienceGain()`

### Inventory System
- **Undefined equipment** → Use `ensurePlayerStats()` 
- **Missing item count** → Default to 0

### Quest System
- **Undefined criteria** → Check with safe defaults
- **Null action history** → Use archival to keep hot data

### Save/Load
- **Corrupted playerLevel** → Legacy format (number) → factory handles
- **Missing fields** → Factories fill in sensible defaults
