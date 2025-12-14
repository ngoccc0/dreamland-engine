# 📋 EXECUTION CHECKLIST - PHASE 3-5 DAILY TRACKER

Use this file to track daily progress. Update as you complete each task.

---

## 🎯 PHASE 3.A: EXTRACT REMAINING 27 RULES
**Target**: Dec 15-16, 2025 | **Expected**: 360+ tests | **Status**: 🔴 NOT STARTED

### Task 3.A.1: Crafting Rules (Dec 15)
- [ ] Create `src/core/rules/crafting.ts`
- [ ] Implement `validateRecipe(recipeId, inventory) → boolean`
  - [ ] Check recipe exists in core/data/recipes
  - [ ] Check inventory has required materials
  - [ ] Write @remarks with Formula/Logic sections
  - [ ] Add 1-2 concrete examples
- [ ] Implement `calculateCraftTime(recipeDifficulty) → number`
  - [ ] Formula: time = baseTime × (1 + difficultyMultiplier)
  - [ ] Document in @remarks
- [ ] Implement `getRecipeCost(recipeId) → ItemStack[]`
  - [ ] Return required items
  - [ ] Document in @remarks
- [ ] Create test file: `src/__tests__/crafting-rules.test.ts`
  - [ ] 20+ test cases
  - [ ] Edge cases (missing recipe, empty inventory, etc.)
- [ ] Verify:
  - [ ] `npm run typecheck` → 0 errors
  - [ ] `npm test -- src/__tests__/crafting-rules.test.ts` → ✅ all pass
  - [ ] All functions have @remarks with Formula/Logic

**Estimate**: 2-3 hours | **Status**: 🔴 TODO

### Task 3.A.2: Weather Rules (Dec 15-16)
- [ ] Create `src/core/rules/weather.ts`
- [ ] Implement `calculateWeatherTick(currentWeather, season) → Weather`
  - [ ] Document weather transition logic
  - [ ] Add @remarks with Formula/Logic
- [ ] Implement `getWeatherEffect(weather) → WeatherEffect`
  - [ ] Map weather → damage/healing/buff
  - [ ] Document in @remarks
- [ ] Implement `shouldWeatherChange(weather, probability) → boolean`
  - [ ] RNG-based check
  - [ ] Document in @remarks
- [ ] Implement `applyWeatherDamage(state, weather) → number`
  - [ ] Calculate damage based on weather
  - [ ] Return damage amount
- [ ] Create tests: `src/__tests__/weather-rules.test.ts`
  - [ ] 25+ test cases
  - [ ] Test all weather types
- [ ] Verify:
  - [ ] `npm run typecheck` → 0 errors
  - [ ] `npm test -- src/__tests__/weather-rules.test.ts` → ✅ all pass
  - [ ] Total tests: 360+ passing

**Estimate**: 3-4 hours | **Status**: 🔴 TODO

### Task 3.A.3: Narrative Selection Rules (Dec 16)
- [ ] Create `src/core/rules/narrative/selector.ts`
- [ ] Implement `selectTemplate(mood, context, templates[]) → Template`
  - [ ] Select best template based on mood/context
  - [ ] Document selection algorithm in @remarks
- [ ] Implement `evaluateCondition(condition, state) → boolean`
  - [ ] Evaluate conditional logic
  - [ ] Support multiple condition types
- [ ] Implement `rankTemplateByContext(templates[], context) → ranked[]`
  - [ ] Rank templates by relevance
  - [ ] Document ranking formula
- [ ] Create tests: `src/__tests__/narrative-selector.test.ts`
  - [ ] 30+ test cases
  - [ ] Test different moods/contexts
- [ ] Verify:
  - [ ] `npm run typecheck` → 0 errors
  - [ ] `npm test -- src/__tests__/narrative-selector.test.ts` → ✅ all pass

**Estimate**: 3-4 hours | **Status**: 🔴 TODO

### Task 3.A.4: RNG Rules (Dec 16)
- [ ] Create `src/core/rules/rng.ts`
- [ ] Implement seeded RNG for deterministic testing
- [ ] Implement `nextRandom(rng) → number (0-1)`
  - [ ] Pure function
  - [ ] Deterministic output
- [ ] Implement `nextInt(rng, min, max) → integer`
  - [ ] Use nextRandom internally
  - [ ] Document formula in @remarks
- [ ] Create tests: `src/__tests__/rng-rules.test.ts`
  - [ ] 15+ deterministic tests
  - [ ] Verify reproducibility with seeds
- [ ] Verify:
  - [ ] `npm run typecheck` → 0 errors
  - [ ] `npm test -- src/__tests__/rng-rules.test.ts` → ✅ all pass

**Estimate**: 1-2 hours | **Status**: 🔴 TODO

### Task 3.A.5: Loot & Drop Rules (Dec 16)
- [ ] Create `src/core/rules/loot.ts`
- [ ] Implement `calculateLootTable(creature, difficulty) → Loot[]`
  - [ ] Determine what items drop
  - [ ] Document in @remarks
- [ ] Implement `shouldDropItem(baseChance, bonusChance) → boolean`
  - [ ] RNG-based item drop
  - [ ] Pure function
- [ ] Implement `distributeExperience(totalXp, partySize) → number[]`
  - [ ] Divide XP among party members
  - [ ] Document formula
- [ ] Create tests: `src/__tests__/loot-rules.test.ts`
  - [ ] 25+ test cases
  - [ ] Test distribution fairness
- [ ] Verify:
  - [ ] `npm run typecheck` → 0 errors
  - [ ] `npm test -- src/__tests__/loot-rules.test.ts` → ✅ all pass
  - [ ] Total tests: 360+ passing

**Estimate**: 2-3 hours | **Status**: 🔴 TODO

### Phase 3.A Summary Checklist
- [ ] All 5 files created
- [ ] All 27 functions implemented
- [ ] All 115+ test cases written
- [ ] All @remarks with Formula/Logic/EdgeCases
- [ ] `npm run typecheck` → 0 errors
- [ ] `npm test` → 360+ tests passing
- [ ] No lint errors
- [ ] Commit: "feat(phase-3.A): extract 27 remaining rule functions"

**Completion**: 🔴 NOT STARTED | **Target**: Dec 16 EOD

---

## 🔄 PHASE 3.B: REFACTOR USECASES
**Target**: Dec 17-19, 2025 | **Expected**: 360+ tests | **Status**: 🔴 NOT STARTED

### Identify All Usecases (Dec 17 Morning)
- [ ] List all usecases in `src/core/usecases/`
- [ ] Count total functions
- [ ] Document current signature for each
- [ ] Create refactoring checklist (one per usecase)

**Expected usecases**: 12

### Usecase Refactoring Template
For each usecase, complete:

#### Usecase: [name]
- [ ] Document current implementation
- [ ] Identify all mutations
- [ ] Identify all side effects
- [ ] Map side effects → GameEffect type
- [ ] Update signature to: `(state, action) → { newState, effects }`
- [ ] Implement immutable state creation
- [ ] Implement effects array generation
- [ ] Update all callers (hooks)
- [ ] Write/update tests
- [ ] Verify:
  - [ ] No mutations in usecase code
  - [ ] All tests passing
  - [ ] `npm run typecheck` → 0 errors

**Example Refactoring Checklist**:
```
### Usecase: performAttack
- [ ] Current signature: (attacker, defender) → [Creature, Creature]
- [ ] Mutations identified: defender.hp -= damage
- [ ] Side effects: PLAY_SOUND, EMIT_EVENT, SAVE_GAME
- [ ] New signature: (state, action) → { newState, effects }
- [ ] Immutable state creation: ✓
- [ ] Effects array: ✓
- [ ] Callers updated: useCombat hook ✓
- [ ] Tests: 30+ all passing ✓
- [ ] Verify: typecheck ✓, tests ✓, lint ✓
```

### Refactoring Sequence (Dec 17-19)
1. **Dec 17 AM**: Identify all usecases, create refactoring plan
2. **Dec 17 PM**: Refactor usecases 1-3
3. **Dec 18 AM**: Refactor usecases 4-6
4. **Dec 18 PM**: Refactor usecases 7-9
5. **Dec 19 AM**: Refactor usecases 10-12
6. **Dec 19 PM**: Final verification, all usecases complete

### Phase 3.B Summary Checklist
- [ ] All 12 usecases refactored
- [ ] All follow `(state, action) → { newState, effects }` pattern
- [ ] Zero mutations in usecase code
- [ ] All call pure rules from core/rules/
- [ ] All tests passing (360+)
- [ ] `npm run typecheck` → 0 errors
- [ ] `npm run lint` → 0 errors
- [ ] Commit: "refactor(phase-3.B): update usecases to immutable pattern"

**Completion**: 🔴 NOT STARTED | **Target**: Dec 19 EOD

---

## 🪝 PHASE 4: HOOK INTEGRATION
**Target**: Dec 20-21, 2025 | **Expected**: 380+ tests | **Status**: 🔴 NOT STARTED

### Task 4.1: Create Effect Executor (Dec 20 AM)
- [ ] Create `src/hooks/effect-executor.ts`
- [ ] Implement `executeGameEffect(effect, executors) → Promise<void>`
- [ ] Handle effect types:
  - [ ] PLAY_SOUND
  - [ ] SAVE_GAME
  - [ ] EMIT_EVENT
  - [ ] SHOW_NOTIFICATION
  - [ ] [others as needed]
- [ ] Create tests: `src/__tests__/effect-executor.test.ts`
  - [ ] 20+ test cases
  - [ ] Test error handling
- [ ] Verify:
  - [ ] `npm run typecheck` → 0 errors
  - [ ] Tests passing

**Estimate**: 2-3 hours | **Status**: 🔴 TODO

### Task 4.2: Update Hooks (Dec 20-21)
Identify and update all hooks that call usecases:

- [ ] `src/hooks/use-game-state.ts`
  - [ ] Call usecases
  - [ ] Execute effects
  - [ ] Update tests
- [ ] `src/hooks/use-combat.ts` (or equivalent)
  - [ ] Update to new pattern
  - [ ] Test: 20+ cases
- [ ] `src/hooks/use-farming.ts` (or equivalent)
  - [ ] Update to new pattern
  - [ ] Test: 15+ cases
- [ ] `src/hooks/use-crafting.ts` (or equivalent)
  - [ ] Update to new pattern
  - [ ] Test: 15+ cases
- [ ] `src/hooks/use-inventory.ts` (or equivalent)
  - [ ] Update to new pattern
  - [ ] Test: 10+ cases
- [ ] [Continue for 10+ more hooks]

For each hook:
- [ ] Update to call usecase
- [ ] Capture effects
- [ ] Execute effects via `executeGameEffect`
- [ ] Add error handling
- [ ] Update tests
- [ ] Verify: tests pass, no errors

### Phase 4 Summary Checklist
- [ ] Effect executor created
- [ ] 15+ hooks updated
- [ ] All effects executing properly
- [ ] Game playable end-to-end
- [ ] Audio, saving, events working
- [ ] 380+ tests passing
- [ ] `npm run typecheck` → 0 errors
- [ ] Commit: "feat(phase-4): integrate hooks with effect execution"

**Completion**: 🔴 NOT STARTED | **Target**: Dec 21 EOD

---

## 🧹 PHASE 5: LEGACY CLEANUP
**Target**: Dec 22, 2025 | **Expected**: 390+ tests | **Status**: 🔴 NOT STARTED

### Task 5.1: Delete Deprecated (Dec 22 AM)
- [ ] Delete `src/core/types/`
- [ ] Delete `src/core/engines/`
- [ ] Delete `src/lib/game/`
- [ ] Delete `src/lib/definitions/`
- [ ] Delete `src/lib/behaviors/`
- [ ] Delete `src/lib/creature-behaviors/`

**Backup first!**:
```bash
git branch backup-before-cleanup
```

### Task 5.2: Update Imports (Dec 22 AM-PM)
- [ ] Find all old imports (using grep)
- [ ] Replace with new paths
- [ ] Search for `from '@/core/types'` → update to `@/core/domain`
- [ ] Search for `from '@/lib/game'` → update to `@/core/data`
- [ ] Search for `from '@/lib/definitions'` → update to `@/core/domain`
- [ ] Verify: `npm run typecheck` catches all import errors

### Task 5.3: Final Verification (Dec 22 PM)
- [ ] `npm run typecheck` → **0 errors** ✅
- [ ] `npm test` → **All passing** ✅
- [ ] `npm run lint` → **0 errors** ✅
- [ ] Total tests: **390+** ✅
- [ ] Git status: `clean` ✅
- [ ] File audit: No orphaned files ✅

### Phase 5 Summary Checklist
- [ ] All deprecated folders deleted
- [ ] All imports updated
- [ ] 390+ tests passing
- [ ] 0 TypeScript errors
- [ ] 0 lint errors
- [ ] 0 orphaned files
- [ ] ARCHITECTURE.md compliance: 100%
- [ ] Commit: "chore(phase-5): delete deprecated code and update imports"
- [ ] Production-ready: ✅

**Completion**: 🔴 NOT STARTED | **Target**: Dec 22 EOD

---

## 📊 DAILY PROGRESS TRACKER

### Dec 15 (Monday)
- [ ] Task 3.A.1 (Crafting Rules) - Expected: 3 hours
- [ ] Task 3.A.2 (Weather Rules) - Expected: 2 hours
- [ ] `npm test` → ✅ passing
- **Notes**: _______________________________________________

### Dec 16 (Tuesday)
- [ ] Task 3.A.2 (Weather Rules) - Completed
- [ ] Task 3.A.3 (Narrative Rules) - Expected: 3 hours
- [ ] Task 3.A.4 (RNG Rules) - Expected: 1 hour
- [ ] Task 3.A.5 (Loot Rules) - Expected: 1 hour
- [ ] Phase 3.A Complete: ✅ 360+ tests passing
- **Notes**: _______________________________________________

### Dec 17-19 (Wed-Fri)
- [ ] Phase 3.B: Refactor 12 usecases
- [ ] Daily: `npm test` → all pass
- [ ] Daily: `npm run typecheck` → 0 errors
- **Notes**: _______________________________________________

### Dec 20-21 (Sat-Sun or Mon-Tue)
- [ ] Phase 4.1: Create effect executor
- [ ] Phase 4.2: Update 15+ hooks
- [ ] Daily: Full test suite passing
- **Notes**: _______________________________________________

### Dec 22 (Final Day)
- [ ] Phase 5.1: Delete deprecated
- [ ] Phase 5.2: Update imports
- [ ] Phase 5.3: Final verification
- [ ] `npm run typecheck` → **0 errors** ✅
- [ ] `npm test` → **390+ passing** ✅
- **Notes**: _______________________________________________

---

## ✅ COMPLETION SIGN-OFF

When all phases complete, update:

```
✅ All Phases Complete: [DATE]
✅ Total Functions Created: 50+
✅ Total Tests: 390+
✅ TypeScript Errors: 0
✅ Lint Errors: 0
✅ Production Ready: YES ✅
```

---

## 🆘 TROUBLESHOOTING

### If Tests Fail
1. Run `npm test -- --verbose` to see details
2. Check recent commits for breaking changes
3. Roll back: `git revert HEAD`
4. Ask for help

### If TypeScript Fails
1. Run `npm run typecheck` to see all errors
2. Check import paths are correct
3. Verify files exist at new locations
4. Update imports systematically

### If Performance Issues
1. Check bundle size: `npm run build`
2. Profile with DevTools
3. Identify bottleneck
4. Optimize or refactor

---

**Last Updated**: Dec 14, 2025  
**Next Review**: Dec 15, 2025 (Daily updates)
