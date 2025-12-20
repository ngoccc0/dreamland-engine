# POST-IMPLEMENTATION AUDIT - Phase 2.1
**Date:** December 20, 2025  
**Status:** ⚠️ CRITICAL ISSUES FOUND - Incomplete Wiring

---

## 🚨 CRITICAL ISSUES

### Issue #1: Statistics Factory NOT WIRED (Severity: HIGH)
**Problem:**  
- ✅ Created `core/factories/statistics-factory.ts` (289 lines, 6 functions)
- ❌ **NOT IMPORTED** anywhere in actual codebase
- ❌ **NOT CALLED** in hooks or usecases
- ✅ Only appears in documentation (EDGE_CASES.md)

**Impact:**  
- Null-safety improvements completely disabled
- Code still uses scattered null checks instead of factories
- Factory module is "dead code" taking up space

**Where it should be used (NOT IMPLEMENTED):**
```
use-game-state.ts         → ensurePlayerStats()  [NOT DONE]
use-action-handlers.ts    → ensureCombatStats()  [NOT DONE]
experience-usecase.ts     → createDefaultPlayerStats() [NOT DONE]
combat-usecase.ts         → ensureCombatStats()  [NOT DONE]
any usecase reading state → ensurePlayerStats()  [NOT DONE]
```

**Fix Priority:** 🔴 CRITICAL - Delete or wire immediately

---

### Issue #2: Event Deduplication Guard NOT WIRED (Severity: HIGH)
**Problem:**  
- ✅ Created `core/engines/event-deduplication/guard.ts` (260 lines, 5 methods)
- ❌ **NOT IMPORTED** anywhere in actual codebase
- ❌ **NOT CALLED** in any event processing code
- ✅ Only appears in documentation (EDGE_CASES.md)

**Impact:**  
- Race condition prevention completely disabled
- Multiple simultaneous events can still double-count stats
- Guard module is "dead code" taking up space

**Where it should be used (NOT IMPLEMENTED):**
```
usecase: combat-usecase.ts         → Check for CREATURE_KILLED duplicates [NOT DONE]
usecase: harvesting-usecase.ts     → Check for ITEM_GATHERED duplicates [NOT DONE]
usecase: crafting-usecase.ts       → Check for CRAFTING_COMPLETE duplicates [NOT DONE]
engine: statistics-engine.ts       → Integrate dedup checks [NOT DONE]
Hook: effect executor             → Dedup before processing [NOT DONE]
```

**Fix Priority:** 🔴 CRITICAL - Delete or wire immediately

---

### Issue #3: ActionArchivalEngine DUPLICATES Existing Code (Severity: MEDIUM)
**Problem:**  
- ✅ Created `core/engines/action-tracker/archival.ts` (267 lines)
- ⚠️ **DUPLICATE** - ActionTrackerEngine.archiveOldActions() already exists
- ⚠️ Architectural confusion: Two competing modules for same purpose

**Current Situation:**
```
ActionTrackerEngine.archiveOldActions()      [EXISTING - line 282 in engine.ts]
├─ Signature: (history, keepLastN) → ActionHistory
├─ Location: core/engines/action-tracker/engine.ts
└─ Purpose: Trim actions to last N

ActionArchivalEngine.archiveOldActions()     [NEW - duplicate]
├─ Signature: (history, gameTime, config) → ActionHistory  
├─ Location: core/engines/action-tracker/archival.ts
└─ Purpose: Time-based archival (7d hot, 30d cold)
```

**Problem:** Two different implementations, developers don't know which to use.

**Fix Priority:** 🟠 MEDIUM - Either delete new module OR refactor engine.ts to use it

---

### Issue #4: Missing Hook Integration for Factories (Severity: HIGH)
**Problem:**  
- ❌ No hook calls to `ensurePlayerStats()` before reading gameState
- ❌ Old pattern still used: `playerStats?.level ?? 1`
- ❌ Factories created but code doesn't use them

**Example - SHOULD USE FACTORY:**
```typescript
// ❌ OLD PATTERN (in use-action-handlers.ts):
const level = playerStats?.level ?? 1;  // Scattered null check

// ✅ SHOULD BE:
import { ensurePlayerStats } from '@/core/factories/statistics-factory';
const safeStats = ensurePlayerStats(playerStats);
const level = safeStats.level;  // Always safe
```

**Fix Priority:** 🔴 CRITICAL - Must refactor hooks

---

### Issue #5: Missing Dedup Integration in Usecases (Severity: MEDIUM)
**Problem:**  
- ❌ No dedup checks before processing CREATURE_KILLED events
- ❌ No dedup checks before updating statistics
- ❌ Simultaneous events can still cause double-counting

**Example - SHOULD USE DEDUP:**
```typescript
// ❌ OLD PATTERN (in combat-usecase.ts):
export function handleCreatureDefeated(state, creature) {
  // No dedup - if event fires twice, creature counted twice
  statistics.creaturesDefeated++;
  return { newState, effects };
}

// ✅ SHOULD BE:
let deduplicator = EventDeduplicationGuard.createDeduplicationBuffer();

export function handleCreatureDefeated(state, creature, deduplicator) {
  const event = { type: 'CREATURE_KILLED', creatureId: creature.id };
  
  if (!EventDeduplicationGuard.isDuplicate(event, deduplicator)) {
    statistics.creaturesDefeated++;
  }
  
  deduplicator = EventDeduplicationGuard.recordEvent(event, deduplicator);
  return { newState, effects, deduplicator };
}
```

**Fix Priority:** 🔴 CRITICAL - Must wire into event flow

---

## 📊 WIRING STATUS TABLE

| Module | Created | Documented | Imported | Called | Status |
|--------|---------|-----------|----------|--------|--------|
| XP Rules (experience.ts) | ✅ | ✅ | ✅ | ✅ | 🟢 COMPLETE |
| XP Factory (createLevelUpEvent) | ✅ | ✅ | ✅ | ✅ | 🟢 COMPLETE |
| Statistics Factory | ✅ | ✅ | ❌ | ❌ | 🔴 UNWIRED |
| Archival Engine | ✅ | ✅ | ❌ | ❌ | 🔴 UNWIRED + DUPLICATE |
| Dedup Guard | ✅ | ✅ | ❌ | ❌ | 🔴 UNWIRED |

---

## 🔍 DETAILED INVENTORY

### ✅ WORKING MODULES (Properly Wired)

**1. Experience Rules (`core/rules/experience.ts` - 254 lines)**
```
Exports: 5 functions
  - calculateExperienceGain()     [CALLED in combat-usecase.ts:471]
  - calculateXpForLevel()          [CALLED in combat-usecase.ts:470]
  - calculateCumulativeXp()        [Available]
  - calculateLevelFromXp()         [Available]
  - calculateLevelUpBonus()        [Available]
  
Status: ✅ INTEGRATED - Called from combat-usecase, working correctly
```

**2. XP Event Factory (`experience-usecase.ts` - Added 67 lines)**
```
Function: createLevelUpEvent(newLevel, totalExperience, xpGained)
Usage: Called from experience-usecase.ts
Status: ✅ INTEGRATED - Centralized LEVEL_UP event creation
```

---

### ❌ UNWIRED MODULES (Created but Not Used)

**3. Statistics Factory (`core/factories/statistics-factory.ts` - 289 lines)**
```
Exports: 6 functions
  - ensurePlayerStats()           [NOT CALLED ANYWHERE]
  - ensureCombatStats()           [NOT CALLED ANYWHERE]
  - createDefaultPlayerStats()    [NOT CALLED ANYWHERE]
  - createDefaultCombatStats()    [NOT CALLED ANYWHERE]
  - createEmptyStatistics()       [NOT CALLED ANYWHERE]
  - Others...

Problem: 
  - Defined but not imported
  - Not called in hooks
  - Not called in usecases
  - Code still uses: playerStats?.level ?? 1

Action Required: WIRE INTO HOOKS or DELETE
```

**4. Archival Engine (`core/engines/action-tracker/archival.ts` - 267 lines)**
```
Exports: 1 class (ActionArchivalEngine) + 3 methods
  - archiveOldActions()           [CONFLICT with existing engine.ts]
  - cleanupIfNeeded()             [NOT CALLED ANYWHERE]
  - getOldestActionTime()         [NOT CALLED ANYWHERE]
  - getHistoryStats()             [NOT CALLED ANYWHERE]

Problem:
  - DUPLICATE: ActionTrackerEngine.archiveOldActions() exists (line 282)
  - Two competing implementations
  - Confusion about which to use
  - New version NOT integrated anywhere

Action Required: 
  Option A: DELETE new module, use existing ActionTrackerEngine
  Option B: REPLACE existing engine.ts logic with new module
  Option C: MERGE - Keep time-based approach, deprecate keepLastN approach
```

**5. Dedup Guard (`core/engines/event-deduplication/guard.ts` - 260 lines)**
```
Exports: 1 class (EventDeduplicationGuard) + 5 methods
  - createDeduplicationBuffer()   [NOT CALLED ANYWHERE]
  - generateEventKey()            [NOT CALLED ANYWHERE]
  - isDuplicate()                 [NOT CALLED ANYWHERE]
  - recordEvent()                 [NOT CALLED ANYWHERE]
  - clearBuffer()                 [NOT CALLED ANYWHERE]

Problem:
  - Defined but not imported
  - Not called in event processing
  - No integration in usecases
  - Race conditions can still occur

Action Required: WIRE INTO EVENT PROCESSING or DELETE
```

---

## 🗑️ CANDIDATES FOR DELETION

If features are truly unnecessary, mark for deletion:

1. **Statistics Factory** (if factories pattern not being adopted)
   - Delete: `src/core/factories/statistics-factory.ts`
   - Remove from: EDGE_CASES.md

2. **ActionArchivalEngine** (if keeping simple keepLastN approach)
   - Delete: `src/core/engines/action-tracker/archival.ts`
   - Remove from: EDGE_CASES.md

3. **EventDeduplicationGuard** (if not implementing dedup)
   - Delete: `src/core/engines/event-deduplication/guard.ts`
   - Remove from: EDGE_CASES.md

---

## ⚙️ REMAINING OLD CODE THAT NEEDS UPDATING

### 1. Scattered Null Checks (Should Use Factories)
**Files:** use-action-handlers.ts, use-game-state.ts, use-movement.ts  
**Pattern to replace:**
```typescript
// ❌ OLD:
const level = playerStats?.level ?? 1;
const attack = combatStats?.attack ?? 10;
const equipment = playerStats?.equipment ?? { weapon: null };

// ✅ NEW:
const safeStats = ensurePlayerStats(playerStats);
const attack = ensureCombatStats(combatStats).attack;
```

### 2. Event Processing Without Dedup (Should Use Guard)
**Files:** combat-usecase.ts, harvesting-usecase.ts, crafting-usecase.ts  
**Pattern to add:**
```typescript
// Before processing events, check dedup buffer
if (EventDeduplicationGuard.isDuplicate(event, buffer)) return;
```

### 3. Hardcoded Archival Logic (Should Use Engine)
**Files:** use-action-tracker.ts, action-tracker engine  
**Pattern to consolidate:**
- Remove manual `keepLastN` logic
- Use `ActionArchivalEngine.cleanupIfNeeded()` instead

---

## 🎯 PRIORITY RESOLUTION PATH

### Priority 1: DECISION - What to Keep?
**Need User Input:** Which patterns to adopt?
```
Option A: Keep factories + dedup → WIRE ALL MODULES
Option B: Keep minimal → DELETE unwired modules
Option C: Keep factories only → WIRE factories + DELETE dedup guard
```

### Priority 2: WIRE (If Adopting Features)
If keeping modules:
1. Import statistics factory in hooks
2. Import dedup guard in usecases
3. Call functions on state reads/events
4. Test integration

### Priority 3: DELETE (If Not Adopting)
If not using:
1. Delete unused modules
2. Update EDGE_CASES.md
3. Verify no imports broken
4. Clean up git history (optional)

### Priority 4: CONSOLIDATE (Archival)
Decide on archival strategy:
1. Keep existing ActionTrackerEngine.archiveOldActions()
2. Delete new ActionArchivalEngine OR
3. Refactor to merge both approaches

---

## 📋 HEALTH CHECK SUMMARY

| Aspect | Status | Details |
|--------|--------|---------|
| **Type Safety** | ⚠️ PARTIAL | XP rules work, factories not used |
| **Code Reuse** | ⚠️ PARTIAL | Factories created but not DRY'd into code |
| **Memory Leaks** | ⚠️ POTENTIAL | Unbounded action history not fixed |
| **Race Conditions** | ⚠️ POTENTIAL | No dedup protection in place |
| **Dead Code** | 🔴 YES | 260 + 289 + 267 = 816 lines unused |
| **Documentation** | ✅ EXCELLENT | EDGE_CASES.md thoroughly documented |

---

## 🧹 ADDITIONAL CODE QUALITY ISSUES

### Deprecated Files (Should be Cleaned Up)

**1. `src/lib/debug.ts` (DEPRECATED)**
```typescript
// DEPRECATED: This module has been moved to @/lib/core/debug
export * from './core/debug';
```
- **Status:** ❌ Kept for backward compatibility but code still uses old import
- **Action:** Remove when all imports switched to `/lib/core/debug`
- **Impact:** Creates confusion, clutters filesystem

### Legacy TODO Comments

**File:** `src/ai/flows/generate-narrative-flow.ts`  
**Issues:** 8 TODO comments indicating incomplete implementation
```typescript
// TODO: Remove when implementing narrative generation logic     [Line 20]
// TODO: Remove when implementing success level logic            [Line 33]
// TODO: Import ItemDefinitionSchema when implementing...        [Line 66]
// TODO: Implement when adding output logic                      [Line 79]
// TODO: Implement generateNarrative function...                 [Line 97]
// TODO: Implement lazy initialization pattern...                [Line 105]
// TODO: Implement Genkit flow with Handlebars...                [Line 113]
// TODO: Implement narrative generation logic                    [Line 146]
```
- **Status:** ⚠️ Placeholder code, not production ready
- **Action:** Either complete implementation or delete module
- **Impact:** Dead weight in codebase

### File Size Violations (Per ARCHITECTURE.md)

**Already documented in ARCHITECTURE.md but not resolved:**
- `use-game-state.ts`: 281 lines (limit: 250) ✅ *Actually OK*
- `use-action-handlers.online.ts`: 900 lines (limit: 250) ⚠️ VIOLATES
- `use-movement.ts`: 582 lines (limit: 250) ⚠️ VIOLATES

**Status:** Documented but no refactoring started yet

---

## 🔧 NEXT STEPS

### IMMEDIATE (HIGH PRIORITY)

**Decision Tree:**
```
Do you want to use Factories Pattern?
├─ YES → Wire factories into hooks + integrate null-safety
│        (replace all: stats?.level ?? 1 with ensurePlayerStats())
│
└─ NO  → Delete unused modules (816 lines):
         - core/factories/statistics-factory.ts (289 lines)
         - core/engines/action-tracker/archival.ts (267 lines)
         - core/engines/event-deduplication/guard.ts (260 lines)
         + Update EDGE_CASES.md to remove examples

Do you want Deduplication Protection?
├─ YES → Wire EventDeduplicationGuard into combat event processing
│        (check isDuplicate before updating statistics)
│
└─ NO  → Delete guard.ts (260 lines)

Which Archival Strategy?
├─ KEEP SIMPLE → Delete ActionArchivalEngine, use existing engine.ts
│
├─ TIME-BASED  → Replace engine.ts with ActionArchivalEngine
│                (7d hot, 30d cold model)
│
└─ HYBRID      → Merge both (keep both keepLastN + time-based)
```

### SECONDARY (MEDIUM PRIORITY)

1. **Clean up deprecated code:**
   - [ ] Update all imports from `/lib/debug` to `/lib/core/debug`
   - [ ] Delete deprecated `/lib/debug.ts`

2. **Complete or delete AI flows:**
   - [ ] Decide: Complete `generate-narrative-flow.ts` or delete
   - [ ] Remove 8 TODO comments

3. **Resolve hook size violations:**
   - [ ] Plan refactoring for 900-line use-action-handlers.online.ts
   - [ ] Plan refactoring for 582-line use-movement.ts

### TERTIARY (LOW PRIORITY)

1. Review for other dead code patterns
2. Standardize null-checking approach
3. Create integration tests for new modules (if keeping)

**Status:** ⏸️ BLOCKED - Awaiting user direction on above decisions

