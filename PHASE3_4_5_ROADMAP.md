# 🗺️ DREAMLAND ENGINE - PHASES 3, 4, 5 ROADMAP
## December 14, 2025 | Status: Ready for Phase 3 Execution

---

## 📊 EXECUTIVE SUMMARY

| Metric | Value | Status |
|--------|-------|--------|
| **Completed Phases** | 0, 1, 2 | ✅ 100% |
| **Current Architecture** | core/domain, core/data, core/rules (partial), core/usecases | ✅ Ready |
| **TypeScript Errors** | 0 | ✅ Pass |
| **Test Status** | 304/305 passing (1 skipped) | ✅ Pass |
| **Time to Complete (3-5)** | ~5-7 days | 🔄 Estimate |
| **Files Affected** | ~80 files | 📝 Track |
| **Riskiness** | HIGH (core logic refactor) | ⚠️ Monitor |

---

## 🔍 PHASE READINESS ASSESSMENT

### ✅ PHASE 0: Documentation (LOCKED)
- [x] `docs/ARCHITECTURE_CLEAN_SLATE.md` - NEW SSOT (locked 7 decisions)
- [x] `docs/MIGRATION_PHASES.md` - Detailed execution guide
- [x] `docs/PATTERNS.md` - Updated with Glass Box TSDoc standard
- [x] `docs/CODING_STANDARDS.md` - Aligned with new structure
- [x] Copilot instructions updated with AUTONOMOUS RUN-TO-COMPLETION directive

**Status**: ✅ **COMPLETE** | No new work needed

---

### ✅ PHASE 1: Foundation (core/domain)
- [x] `src/core/domain/entity.ts` - Base Entity (id, position, lifecycle)
- [x] `src/core/domain/creature.ts` - Polymorphic Creature (discriminated union)
- [x] `src/core/domain/item.ts` - Item schema with effects
- [x] `src/core/domain/gamestate.ts` - Complete save structure
- [x] `src/core/domain/index.ts` - Barrel exports
- [x] Type inference from Zod (no duplicate TypeScript definitions)
- [x] 100% TSDoc coverage on all exports

**Status**: ✅ **COMPLETE** | No new work needed

---

### ✅ PHASE 2: Data Migration (lib/game/data → core/data)

#### PHASE 2A: Items ✅
- [x] `src/core/data/items/` - 7 files migrated
  - equipment.ts, food.ts, tools.ts, materials.ts, magic.ts, support.ts, data.ts
  - modded/nature_plus.ts
- [x] All imports updated (`@/lib/game/items` → `@/core/data/items`)
- [x] Consolidated `items/index.ts` with `allItems` export

**Status**: ✅ **COMPLETE** | 40+ items defined

#### PHASE 2B: Creatures ✅
- [x] `src/core/data/creatures/` - 4 files + merged modded
  - animals.ts (fauna)
  - plants.ts (merged modded_plants)
  - minerals.ts
  - wildlife.ts
- [x] Deleted old `modded_plants.ts` file
- [x] Updated `creatures/index.ts`

**Status**: ✅ **COMPLETE** | Fauna/flora/mineral/monster data consolidated

#### PHASE 2C: Recipes ✅
- [x] `src/core/data/recipes/nature_plus.ts` - 417 lines modded recipes
- [x] Ready for future consolidation

**Status**: ✅ **COMPLETE** | Recipe data migrated

#### PHASE 2D: Narrative Data ✅
- [x] Moved templates from `lib/definitions/narrative/` → `src/core/data/narrative/`
- [x] Copied lexicons (en.ts, vi.ts) to `src/core/data/narrative/lexicon/`
- [x] Template schemas in place

**Status**: ✅ **COMPLETE** | 15+ narrative files moved

---

### 🔴 PHASE 3: Rules Extraction & Usecase Refactoring (IN PROGRESS - PARTIAL)

#### Already Completed ✅
- [x] `src/core/rules/combat.ts` - 11 pure functions (combat rules)
  - calculateBaseDamage, isCritical, getCriticalMultiplier, etc.
  - 100% TSDoc with Glass Box @remarks
  - All functions tested and passing
- [x] `src/core/rules/nature.ts` - 12 pure functions (nature/farming rules)
  - calculateMoistureSuitability, calculateGrowthProbability, etc.
  - 100% TSDoc with Glass Box @remarks
  - All functions tested and passing

**Status**: ✅ **PARTIAL COMPLETE** | 23/50+ rule functions done

#### Remaining Work 🔴

##### 3A: Extract Remaining Rules (~30 functions)
Priority order:

**HIGH PRIORITY** (Required for core gameplay):
1. **src/core/rules/crafting.ts** (NEW)
   - Recipe validation
   - Item combination logic
   - Ingredient checking
   - Craft time calculations
   - **Functions needed**: ~5-8
   - **Source**: Extract from `src/core/usecases/crafting-usecase.ts`
   - **Estimated lines**: 150-200

2. **src/core/rules/weather.ts** (NEW)
   - Weather simulation
   - Temperature/humidity calculations
   - Weather state transitions
   - **Functions needed**: ~6-8
   - **Source**: Extract from `src/core/usecases/weather-usecase.ts` + `src/core/engines/`
   - **Estimated lines**: 180-250

3. **src/core/rules/narrative/** (NEW FOLDER)
   - `selector.ts` - Template selection by mood/context
   - `conditions.ts` - Condition evaluation logic
   - **Functions needed**: ~6-8
   - **Source**: Extract from `src/lib/narrative/`
   - **Estimated lines**: 200-300

**MEDIUM PRIORITY** (Ecosystem support):
4. **src/core/rules/rng.ts** (NEW)
   - Seeded RNG
   - Probability functions
   - Distributions
   - **Functions needed**: ~3-5
   - **Estimated lines**: 100-150

5. **src/core/rules/loot.ts** (NEW)
   - Loot table selection
   - Quantity calculations
   - Rarity distribution
   - **Functions needed**: ~4-6
   - **Source**: Extract from `src/core/usecases/combat-usecase.ts` (lines 300+)
   - **Estimated lines**: 150-200

**Verification**:
- [ ] All rule functions pass `npm run test`
- [ ] 100% TSDoc coverage with Glass Box @remarks
- [ ] No imports from hooks, usecases, or React
- [ ] Pure functions only (deterministic, no side effects)

##### 3B: Refactor Existing Usecases (~12 files)
Transform from mutation-based to pure + side effects model:

**Files to refactor** (in priority order):
```
src/core/usecases/
  ├─ combat-usecase.ts        ← NOW calls rules/combat.ts (23 functions)
  ├─ farming-usecase.ts       ← NOW calls rules/nature.ts (12 functions)
  ├─ crafting-usecase.ts      ← NOW calls rules/crafting.ts
  ├─ weather-usecase.ts       ← NOW calls rules/weather.ts
  ├─ experience-usecase.ts    ← Extract EXP logic to rules/
  ├─ reward-generator.ts      ← Needs refactor (loot system)
  ├─ exploration-usecase.ts   ← Refactor (discovery logic)
  ├─ world-usecase.ts         ← Refactor (world mutations)
  ├─ skill-usecase.ts         ← Refactor (skill system)
  ├─ plant-growth.usecase.ts  ← NOW calls rules/nature.ts
  ├─ movement-narrative.ts    ← Keep or merge?
  └─ terrain-weather-discovery.usecase.ts ← Refactor
```

**Pattern Transformation** (for each usecase):

OLD:
```typescript
export function performAction(state: GameState, action: Action): GameState {
  // MUTATION (❌ bad)
  state.player.hp -= damage;
  state.enemies = newEnemyList;
  
  // Side effects mixed in (❌ bad)
  audioManager.play('hit.mp3');
  
  return state;
}
```

NEW:
```typescript
import { calculateDamage } from '@/core/rules/combat/damage';
import type { GameEffect } from '@/core/domain';

export function performAction(
  state: GameState,
  action: Action
): [GameState, GameEffect[]] {
  // Use pure rule function
  const damage = calculateDamage(
    action.attacker.attack,
    action.defender.defense,
    action.isCrit
  );
  
  // Immutable new state
  const newState: GameState = {
    ...state,
    player: {
      ...state.player,
      hp: Math.max(0, state.player.hp - damage)
    }
  };
  
  // Return side effects
  const effects: GameEffect[] = [
    { type: 'PLAY_SOUND', sfx: 'hit.mp3' },
    { type: 'SAVE_GAME', data: newState },
    { type: 'EMIT_EVENT', event: 'combat_damage', damage }
  ];
  
  return [newState, effects];
}
```

**Verification** (per usecase):
- [ ] Calls pure rule functions (no direct mutations)
- [ ] Returns `[newState, effects[]]` tuple
- [ ] All effects are tagged unions (plain JSON)
- [ ] No React imports
- [ ] 100% TSDoc coverage
- [ ] Tests updated to verify effect return format

**High-risk usecases** (require careful refactoring):
- `combat-usecase.ts` - Already exists with rules integration (VERIFY)
- `world-usecase.ts` - Complex state mutations (SPLIT into smaller usecases?)
- `crafting-usecase.ts` - Multi-step validation (extract sub-rules)

---

### 🔴 PHASE 4: Hook Refactoring (DEPENDS ON PHASE 3)

**Goal**: Update React hooks to call refactored usecases + execute side effects

**Key Files to Update**:
```
src/hooks/
  ├─ use-game-state.ts          ← Call usecases, execute effects
  ├─ use-game-engine.ts         ← Orchestrate game loop
  ├─ use-action-handlers.ts     ← Call usecases (attack, defend, craft, etc)
  ├─ use-game-effects.ts        ← EXECUTE side effects (audio, particles, etc)
  ├─ usePlayerStats.ts          ← May need refactor
  ├─ use-creature-engine.ts     ← May need refactor
  └─ game-lifecycle/            ← May need refactor
```

**Transformation Pattern**:

OLD Hook (mutation-based):
```typescript
export function useGameState() {
  const [state, setState] = useState(initialState);
  
  const handleAttack = useCallback((targetId: string) => {
    const newState = performAttack(state, targetId);  // Returns mutated state
    setState(newState);
    
    // Side effects manually called
    audioManager.play('hit.mp3');
  }, [state]);
  
  return { state, handleAttack };
}
```

NEW Hook (pure + effects):
```typescript
export function useGameState() {
  const [state, setState] = useState(initialState);
  
  const handleAttack = useCallback((targetId: string) => {
    // Call usecase (returns [newState, effects])
    const [newState, effects] = performAttack(state, targetId);
    
    // Apply state
    setState(newState);
    
    // Execute effects (hook's responsibility)
    effects.forEach(effect => executeSideEffect(effect));
  }, [state]);
  
  return { state, handleAttack };
}
```

**New Utility: Side Effect Executor**:
```typescript
// src/lib/utils/effect-executor.ts (NEW)
import type { GameEffect } from '@/core/domain';

export function executeSideEffect(effect: GameEffect) {
  switch (effect.type) {
    case 'PLAY_SOUND':
      audioManager.play(effect.sfx);
      break;
    case 'SAVE_GAME':
      persistence.saveGame(effect.data);
      break;
    case 'EMIT_EVENT':
      eventBus.emit(effect.event, effect.payload);
      break;
    case 'SHOW_NOTIFICATION':
      toast.show(effect.message);
      break;
    // ... etc
  }
}
```

**Verification**:
- [ ] All hooks call usecases (not direct logic)
- [ ] Side effects executed via executor utility
- [ ] React state updates correctly
- [ ] Animations/audio work as expected
- [ ] `npm run test` passes (hook integration tests)
- [ ] No broken imports

**Files to Create/Modify**:
- [x] `src/core/domain/` (already defines GameEffect type)
- [ ] `src/lib/utils/effect-executor.ts` (NEW)
- [ ] Update 15+ hook files

---

### 🔴 PHASE 5: Legacy Cleanup (DEPENDS ON PHASE 4)

**Goal**: Delete deprecated code (old types, engines, data folders)

**Files/Folders to DELETE** (after verifying no imports):

High Confidence (minimal cross-refs):
- ❌ `src/core/types/` - MOVED to `src/core/domain/`
  - Check: `grep -r "core/types" --include="*.ts" src/`
  - ~50 files may import from here
  
- ❌ `src/lib/definitions/` - MOVED to `src/core/domain/`
  - Check: `grep -r "lib/definitions" --include="*.ts" src/`
  - ~30 files may import from here

- ❌ `src/lib/game/` - MOVED to `src/core/data/`
  - Check: `grep -r "lib/game" --include="*.ts" src/`
  - Already mostly migrated, but verify

- ❌ `src/core/engines/` - LOGIC moved to `src/core/rules/`
  - Check: `grep -r "core/engines" --include="*.ts" src/`
  - ~20 files may use this

Files to KEEP (intentionally):
- ✅ `src/lib/narrative/` - Text generation engine (NOT templates)
- ✅ `src/lib/config/` - Configuration (no changes needed)
- ✅ `src/lib/locales/` - Translations (no changes needed)
- ✅ `src/lib/utils/` - Generic helpers (keep or refactor minimally)

**Cleanup Strategy** (STRANGLER FIG):
1. Phase 3: Create `src/core/rules/` files (NEW)
2. Phase 4: Update imports to use `core/` instead of `lib/`
3. Phase 5: Delete old files ONLY after verifying zero imports

**Verification**:
```bash
# MUST return no results before deleting
grep -r "src/core/types" --include="*.ts" src/
grep -r "lib/definitions" --include="*.ts" src/
grep -r "lib/game" --include="*.ts" src/
grep -r "core/engines" --include="*.ts" src/

# Then run full suite
npm run typecheck  # ZERO errors
npm run test       # ALL tests pass
```

**Estimated deletions**:
- ~100+ lines from docs (mark @deprecated, remove references)
- ~50+ old files across 4 folders

---

## 📅 DETAILED TIMELINE & DEPENDENCIES

### Dependency Graph
```
PHASE 3.A (Rules) 
  ├─ Block: Core gameplay rules
  ├─ Duration: 2-3 days
  └─ Status: 🔴 NOT STARTED
      
PHASE 3.B (Usecases) ← DEPENDS ON 3.A
  ├─ Block: Orchestration refactor
  ├─ Duration: 2-3 days
  └─ Status: 🔴 NOT STARTED

PHASE 4 (Hooks) ← DEPENDS ON 3.B
  ├─ Block: UI layer integration
  ├─ Duration: 1-2 days
  └─ Status: 🔴 BLOCKED

PHASE 5 (Cleanup) ← DEPENDS ON 4
  ├─ Block: Legacy code removal
  ├─ Duration: 1 day
  └─ Status: 🔴 BLOCKED
```

### Week-by-Week Estimate

**WEEK 1** (Starting Dec 14):
- Mon 15: Phase 3.A rules extraction (crafting, weather, narrative)
- Tue 16: Phase 3.A continued + verification
- Wed 17: Phase 3.B usecase refactoring (start combat-usecase review)
- Thu 18: Phase 3.B continued (farming, crafting, weather usecases)
- Fri 19: Phase 3.B completion + test fixes

**WEEK 2** (Dec 22):
- Mon 22: Phase 4 hook refactoring (use-game-state, use-action-handlers)
- Tue 23: Phase 4 continued + integration testing
- Wed 24: Phase 4 completion + smoke tests
- Thu 25: Phase 5 legacy cleanup + final verification
- Fri 26: Buffer + polish

**Total**: 10 business days | ~75-80 hours estimated work

---

## 📊 METRICS & SUCCESS CRITERIA

### PHASE 3 Success Criteria

#### 3A Rules Extraction
- [ ] 30+ pure functions created in `src/core/rules/`
- [ ] 100% TSDoc coverage (Glass Box @remarks with formulas)
- [ ] All functions pure (no mutations, no side effects)
- [ ] All functions testable and tested (100% coverage)
- [ ] `npm run typecheck` → ZERO errors
- [ ] No imports from: hooks, components, React, API services

#### 3B Usecase Refactoring
- [ ] 12 usecases refactored to `[state, effects]` pattern
- [ ] All usecases call pure rules (not direct math)
- [ ] All effects returned as tagged unions (plain JSON)
- [ ] 100% TSDoc coverage
- [ ] Tests updated (verify effect format)
- [ ] `npm run test` → 304+ passing (0 failures)

**EXIT GATE**: 
```
✅ npm run typecheck → ZERO errors
✅ npm run test → ALL passing
✅ No direct mutations in usecases (reviewed via grep)
✅ All rules are pure (reviewed via grep)
```

### PHASE 4 Success Criteria

- [ ] 15+ hooks refactored to call usecases
- [ ] Side effect executor created (`src/lib/utils/effect-executor.ts`)
- [ ] All effects executed correctly (audio, save, events)
- [ ] UI renders correctly with new hook pattern
- [ ] No broken imports
- [ ] `npm run typecheck` → ZERO errors
- [ ] `npm run test` → ALL passing

**EXIT GATE**:
```
✅ Game playable end-to-end
✅ Combat: attack → sound plays + damage dealt
✅ Farming: plant grows → harvest yields items
✅ Crafting: recipe valid → item created + inventory updated
```

### PHASE 5 Success Criteria

- [ ] Zero imports of deprecated paths
  - `src/core/types/`
  - `src/lib/definitions/`
  - `src/lib/game/`
  - `src/core/engines/`
- [ ] 100+ old files deleted
- [ ] Docs updated (@deprecated markers removed)
- [ ] `npm run typecheck` → ZERO errors
- [ ] `npm run test` → ALL passing
- [ ] No console warnings about missing imports

**EXIT GATE**:
```
✅ All deprecated code deleted
✅ Zero broken imports
✅ Full test suite green
✅ TypeScript compilation clean
```

---

## ⚠️ RISK ASSESSMENT & MITIGATIONS

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **Usecase refactoring breaks UI** | HIGH | Phase 3.B → Phase 4 tight integration; daily smoke tests |
| **Tests become flaky** | MEDIUM | Update all mocks to expect `[state, effects]` format early |
| **Import chaos during migration** | MEDIUM | Run `grep` verification before Phase 5; automated import update script |
| **Side effect executor incomplete** | MEDIUM | Define all effect types in Phase 3 (before Phase 4) |
| **Accidental mutations in rules** | HIGH | Code review focus: no `state.x = y`, no `array.push()` |
| **Performance regression** | LOW | Profile Phase 4 end-to-end; expect no change (immutability ~same speed) |
| **Save game incompatibility** | LOW | Architecture decision: hard reset (α state, no migration needed) |

### Mitigation Strategy
- **Daily Verification**: `npm run typecheck && npm run test` after each major task
- **Git Rollback Plan**: If 3 verification attempts fail on one task, revert + re-plan
- **Code Review**: Architecture Guardian (enforce Glass Box TSDoc + no mutations)
- **Parallel Testing**: Keep old code in place during Phase 3-4, delete only in Phase 5

---

## 📝 TASK BREAKDOWN (Atomic TODOs)

### PHASE 3.A: Rule Extraction (23 → 50+ functions)

#### Task 3.A.1: Crafting Rules
```
FILE: src/core/rules/crafting.ts (NEW)
FUNCTIONS NEEDED: 5-8
- validateRecipe(recipe, inventory) → boolean
- checkIngredients(recipe, inventory) → MissingItem[]
- calculateCraftTime(recipe, crafter) → number
- calculateSuccessChance(recipe, crafter) → number
- applyRecipeToCrafter(crafter, recipe) → Crafter

SOURCE: Extract from src/core/usecases/crafting-usecase.ts
TESTS: Create src/core/rules/__tests__/crafting.test.ts (100% coverage)
TSDOC: Glass Box @remarks (formula, edge cases, examples)
DEPENDENCIES: None (pure function only)
```

#### Task 3.A.2: Weather Rules
```
FILE: src/core/rules/weather.ts (NEW)
FUNCTIONS NEEDED: 6-8
- calculateWeatherTransition(current, biome, seed) → WeatherState
- applyWeatherEffects(state, weather) → StateDeltas
- getWeatherModifier(weather, action) → number
- simulateClimate(time, biome) → ClimateData

SOURCE: Extract from src/core/engines/weather-engine.ts + src/core/usecases/weather-usecase.ts
TESTS: src/core/rules/__tests__/weather.test.ts
TSDOC: Glass Box @remarks
DEPENDENCIES: None
```

#### Task 3.A.3: Narrative Rules
```
FOLDER: src/core/rules/narrative/ (NEW)
  FILE A: selector.ts
    - selectTemplate(mood, context, state) → Template
    - evaluateCondition(condition, state) → boolean
  FILE B: conditions.ts
    - conditionEvaluator (pure logic)

FUNCTIONS NEEDED: 6-8 total
SOURCE: Extract from src/lib/narrative/
TESTS: src/core/rules/__tests__/narrative.test.ts
TSDOC: Glass Box @remarks
DEPENDENCIES: core/domain, core/data/narrative
```

#### Task 3.A.4: RNG Rules
```
FILE: src/core/rules/rng.ts (NEW)
FUNCTIONS NEEDED: 3-5
- seededRandom(seed) → number
- weightedChoice(items, weights, rng) → item
- gaussianRandom(mean, stdDev, rng) → number

TESTS: src/core/rules/__tests__/rng.test.ts
TSDOC: Glass Box @remarks (formulas)
DEPENDENCIES: None
```

#### Task 3.A.5: Loot Rules
```
FILE: src/core/rules/loot.ts (NEW)
FUNCTIONS NEEDED: 4-6
- selectLootTable(creature, difficulty) → LootTable
- rollLoot(table, rng) → Item[]
- calculateRarity(baseRarity, modifiers) → Rarity

SOURCE: Extract from src/core/usecases/combat-usecase.ts (lines 300+)
TESTS: src/core/rules/__tests__/loot.test.ts
TSDOC: Glass Box @remarks
DEPENDENCIES: core/domain, core/data/items
```

---

### PHASE 3.B: Usecase Refactoring (12 files)

#### Task 3.B.1: Combat Usecase (PRIORITY)
```
FILE: src/core/usecases/combat-usecase.ts
ACTION: Refactor to use [state, effects] pattern

CURRENT EXPORTS: performAttack, endCombat, etc.
CHANGES:
  - performAttack(state, action) → [newState, effects]
  - Add effects: PLAY_SOUND, EMIT_EVENT, SAVE_GAME
  - Call: calculateDamage from @/core/rules/combat

TESTS: Update tests to verify effect format
VERIFICATION: `npm run test -- combat-usecase`
```

#### Task 3.B.2: Farming Usecase
```
FILE: src/core/usecases/farming-usecase.ts
ACTION: Refactor to use [state, effects] pattern

USES RULES:
  - calculateGrowthProbability from @/core/rules/nature
  - calculateDropProbability from @/core/rules/nature
  
TESTS: Update to new format
```

#### Task 3.B.3-8: Other Usecases
```
crafting-usecase.ts
weather-usecase.ts
experience-usecase.ts
reward-generator.ts
world-usecase.ts
skill-usecase.ts

(Similar pattern: refactor to [state, effects], call rules)
```

---

### PHASE 4: Hook Refactoring

#### Task 4.1: Effect Executor
```
FILE: src/lib/utils/effect-executor.ts (NEW)

export function executeSideEffect(effect: GameEffect) {
  switch(effect.type) {
    case 'PLAY_SOUND': ...
    case 'SAVE_GAME': ...
    case 'EMIT_EVENT': ...
    // Define ALL 8+ effect types upfront (Phase 3)
  }
}

TESTS: Full coverage of all effect types
```

#### Task 4.2: use-game-state Hook
```
FILE: src/hooks/use-game-state.ts
ACTION: Update to use effect executor

OLD:
  const handleAttack = () => { 
    const newState = performAttack(state); 
    setState(newState); 
  }

NEW:
  const handleAttack = () => {
    const [newState, effects] = performAttack(state, action);
    setState(newState);
    effects.forEach(e => executeSideEffect(e));
  }

TESTS: Verify effect execution
```

#### Task 4.3-8: Other Hooks
```
use-action-handlers.ts
use-game-engine.ts
usePlayerStats.ts
use-creature-engine.ts
(Similar refactoring pattern)
```

---

### PHASE 5: Legacy Cleanup

#### Task 5.1: Verify Imports
```bash
# Create cleanup script: scripts/check-deprecated-imports.sh
grep -r "src/core/types" --include="*.ts" src/ > deprecated-refs.txt
grep -r "lib/definitions" --include="*.ts" src/ >> deprecated-refs.txt
grep -r "lib/game/" --include="*.ts" src/ >> deprecated-refs.txt
grep -r "core/engines" --include="*.ts" src/ >> deprecated-refs.txt

# If file not empty → more work needed in Phase 4
# If empty → safe to delete
```

#### Task 5.2: Delete Old Folders
```bash
rm -rf src/core/types/
rm -rf src/lib/definitions/
rm -rf src/lib/game/
rm -rf src/core/engines/
```

#### Task 5.3: Update Docs
```
- Mark ARCHITECTURE.md as fully @deprecated (references ARCHITECTURE_CLEAN_SLATE.md)
- Remove dead links in docs/
- Update README.md with new folder structure
```

#### Task 5.4: Final Verification
```bash
npm run typecheck    # ZERO errors (must)
npm run test         # ALL passing (must)
grep -r "TODO" src/ # Document any remaining tech debt
```

---

## 🧪 TEST STRATEGY

### Current State
- ✅ 304/305 tests passing
- ✅ 1 test skipped (acceptable)
- ✅ 0 failures
- ✅ Coverage: ~80% (estimate)

### Phase 3.A: Add Rule Tests
**Target**: 100% coverage on all 30+ new rules

```bash
src/core/rules/__tests__/
  ├─ crafting.test.ts (100+ lines)
  ├─ weather.test.ts (100+ lines)
  ├─ narrative.test.ts (80+ lines)
  ├─ rng.test.ts (60+ lines)
  └─ loot.test.ts (80+ lines)

EXPECTED RESULT: 304 → 360+ passing tests
```

### Phase 3.B: Update Usecase Tests
**Target**: Verify `[state, effects]` return format

OLD:
```typescript
it('performAttack returns new state', () => {
  const result = performAttack(state, action);
  expect(result.hp).toBe(expectedHp);
});
```

NEW:
```typescript
it('performAttack returns [state, effects]', () => {
  const [newState, effects] = performAttack(state, action);
  expect(newState.player.hp).toBe(expectedHp);
  expect(effects).toContainEqual({type: 'PLAY_SOUND', sfx: 'hit.mp3'});
});
```

**Duration**: 1-2 hours per usecase file

### Phase 4: Hook Integration Tests
**Target**: Verify hooks call usecases + execute effects

```typescript
it('handleAttack calls performAttack and executes effects', () => {
  const mockExecute = jest.fn();
  const { result } = renderHook(() => useGameState());
  
  act(() => {
    result.current.handleAttack(targetId);
  });
  
  expect(mockExecute).toHaveBeenCalledWith(
    expect.objectContaining({type: 'PLAY_SOUND'})
  );
});
```

### Phase 5: Regression Testing
**Target**: Full end-to-end smoke tests (no new tests)

```bash
# Smoke test scenarios
- Combat: attack enemy, damage dealt, sound plays
- Farming: plant grows, harvest collected
- Crafting: recipe valid, item created
- Trading: NPC interaction, items exchanged
- Exploration: discover location, get reward

EXPECTED: ALL scenarios work (no visual/audio glitches)
```

---

## 🛠️ TOOLS & COMMANDS

### Daily Verification (Run After Each Task)
```bash
npm run typecheck                     # Must: ZERO errors
npm run test -- --testPathPattern=   # Must: NO failures
npm run lint                          # Should: Clean code
npm run build                         # Should: No warnings
```

### Code Search & Verification
```bash
# Find all imports from deprecated paths
grep -r "from '@/core/types'" --include="*.ts" src/
grep -r "from '@/lib/definitions'" --include="*.ts" src/
grep -r "from '@/lib/game'" --include="*.ts" src/
grep -r "from '@/core/engines'" --include="*.ts" src/

# Find all mutations (detect pattern violations)
grep -r "state\\..*=" --include="*.ts" src/core/rules/   # Should be ZERO
grep -r "\\.push(" --include="*.ts" src/core/rules/      # Should be ZERO
grep -r "\\.pop(" --include="*.ts" src/core/rules/       # Should be ZERO

# Find missing TSDoc
grep -r "^export function" --include="*.ts" src/core/rules/ \
  | grep -v -B1 "/**"                  # Should be ZERO

# Find side effects in rules (forbidden)
grep -r "audioManager\|persistence\|eventBus" --include="*.ts" src/core/rules/  # Should be ZERO
```

### Git Workflow
```bash
# Phase 3.A
git checkout -b phase-3a-rules-extraction
# ... work ...
git commit -m "refactor(core): extract crafting rules"
git commit -m "refactor(core): extract weather rules"
# ... etc ...
git push

# Phase 3.B
git checkout -b phase-3b-usecase-refactoring
# ... work ...
git commit -m "refactor(usecases): combat to [state, effects] pattern"
# ... etc ...

# Phase 4
git checkout -b phase-4-hooks-refactoring
# ... work ...

# Phase 5
git checkout -b phase-5-legacy-cleanup
# ... work ...

# Final integration
git checkout main
git merge phase-3a-rules-extraction
git merge phase-3b-usecase-refactoring
git merge phase-4-hooks-refactoring
git merge phase-5-legacy-cleanup
```

### Rollback Strategy (If needed)
```bash
# If ANY verification fails 3x, revert
git revert HEAD --no-edit
# Identify root cause
# Fix issue
# Re-attempt task
```

---

## 📚 DOCUMENTATION TRAIL

### Files Modified During Phases 3-5

**PHASE 3.A**:
- [ ] `docs/PATTERNS.md` - Add Rule Function Pattern example
- [ ] `docs/ARCHITECTURE_CLEAN_SLATE.md` - Verify against new rules (no changes expected)
- [ ] Create `src/core/rules/__tests__/README.md` (test coverage guide)

**PHASE 3.B**:
- [ ] `docs/PATTERNS.md` - Update Usecase Pattern (verify [state, effects] format)
- [ ] Create guide: "Migrating Usecases to Pure Functions"

**PHASE 4**:
- [ ] `docs/PATTERNS.md` - Update Hook Pattern (effect executor)
- [ ] Create guide: "Executing Side Effects from Hooks"

**PHASE 5**:
- [ ] `docs/ARCHITECTURE.md` - Add @deprecated header, link to ARCHITECTURE_CLEAN_SLATE.md
- [ ] Update `docs/MIGRATION_PHASES.md` - Mark phases complete with dates
- [ ] Update `README.md` - New folder structure diagram
- [ ] Create `PHASE3_4_5_COMPLETION_REPORT.md` (this file, but with results)

---

## 🎯 QUICK REFERENCE

### Critical Non-Negotiables (From copilot-instructions.md)
1. **Docs = Law**: Never code against docs. Update docs first if conflict.
2. **Conservation Law**: Never create new file if existing can be extended.
3. **Janitor Rule**: Delete old code after moving logic.
4. **Tool Constraint**: Use `replace_in_file` for files >500 lines.
5. **3-Strike Rule**: If verification fails 3x, PAUSE and re-plan.

### Architecture Locks (From ARCHITECTURE_CLEAN_SLATE.md)
1. Discriminated unions at Zod level (runtime + type safety)
2. Side effects as tagged unions (serializable, testable)
3. Zod-first schemas (schema → type inference)
4. Domain-based rules organization
5. Narrative split: rules + data
6. Strangler fig migration (gradual)
7. Hard reset save compatibility

### Code Patterns (From PATTERNS.md)
- **Rules**: `(inputs) => output` (pure math, no mutations)
- **Usecases**: `(state, action) => [newState, effects[]]` (immutable)
- **Hooks**: `useState` → `useCallback` → call usecases → execute effects

---

## 📞 DECISION LOG (For Reference)

All decisions locked Dec 14, 2025. Disputes resolved as:
1. Check `docs/ARCHITECTURE_CLEAN_SLATE.md` (SSOT)
2. If still unclear, consult `docs/PATTERNS.md`
3. If conflict with docs, UPDATE DOCS FIRST (don't code around them)

**Example Conflict Resolution**:
```
PROBLEM: "Should usecase return effects as array or object?"
RESOLUTION: ARCHITECTURE_CLEAN_SLATE.md Decision #2 → Array (tagged unions)
ACTION: Code to match decision, never the reverse
```

---

## 🚀 NEXT IMMEDIATE ACTIONS

1. **Read This Roadmap** - Full understanding required
2. **Review ARCHITECTURE_CLEAN_SLATE.md** - Refresh locked decisions
3. **Review PATTERNS.md** - Understand code patterns
4. **Create Task Branches** - `phase-3a-rules`, `phase-3b-usecases`, etc.
5. **Start Phase 3.A** - Begin rules extraction:
   - Task 3.A.1: crafting.ts (5-8 functions)
   - Task 3.A.2: weather.ts (6-8 functions)
   - Task 3.A.3: narrative/ folder (6-8 functions)
6. **Daily Verification**: `npm run typecheck && npm run test`

---

**ROADMAP CREATED**: December 14, 2025  
**STATUS**: Ready for Phase 3 Execution  
**ESTIMATED COMPLETION**: December 23-24, 2025 (10 business days)  
**CONFIDENCE**: HIGH (architecture locked, previous phases verified)

**Questions?** Refer to `docs/ARCHITECTURE_CLEAN_SLATE.md` or `docs/PATTERNS.md`.
