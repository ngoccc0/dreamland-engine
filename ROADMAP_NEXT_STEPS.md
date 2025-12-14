# 🗺️ DREAMLAND ENGINE - NEXT STEPS ROADMAP
## December 14, 2025 - Phase 3, 4, 5 Execution Plan

---

## 📊 CURRENT PROJECT STATUS

### Completed ✅
- **PHASE 0**: Documentation (Docs = Law established)
- **PHASE 1**: Core Domain (Zod schemas created)
- **PHASE 2**: Data Migration (core/data structure in place)
- **PHASE 3.A (PARTIAL)**: Combat Rules (11 functions) ✅
- **PHASE 3.A (PARTIAL)**: Nature Rules (12 functions) ✅
- **TSDoc Standardization**: All 23 rule functions updated
- **Documentation Update**: All guides reflect current architecture

### Metrics ✅
| Metric | Value | Status |
|--------|-------|--------|
| TypeScript Errors | 0 | ✅ Green |
| Tests Passing | 304/305 | ✅ 99.67% |
| Rule Functions Done | 23/50 | 🟡 46% |
| Documentation Complete | 4/4 | ✅ 100% |

---

## 🎯 PHASES 3-5: DETAILED BREAKDOWN

### PHASE 3: Rules Extraction & Usecase Refactoring (Dec 15-19)
**Duration**: 5 days | **Expected Tests**: 360+ | **Errors**: 0

#### PHASE 3.A: Extract Remaining 27 Rule Functions

**Status**: In Progress  
**Rules Completed**: 23/50 (Combat + Nature)  
**Rules Remaining**: 27

##### Task 3.A.1: Crafting Rules (2-3 functions)
```
Files to create/update:
  - src/core/rules/crafting.ts (NEW)
    • validateRecipe(recipeId, inventory) → boolean
    • calculateCraftTime(recipeDifficulty) → number
    • getRecipeCost(recipeId) → ItemStack[]
```
- **Dependencies**: core/data/recipes/index.ts (already exists)
- **Tests**: 20+ test cases
- **Estimate**: 2-3 hours
- **Success Criteria**:
  - ✅ 3 functions exported with complete @remarks
  - ✅ Formula/Logic in @remarks (Glass Box standard)
  - ✅ All tests passing
  - ✅ Zero TypeScript errors

##### Task 3.A.2: Weather Rules (3-4 functions)
```
Files to create/update:
  - src/core/rules/weather.ts (NEW)
    • calculateWeatherTick(currentWeather, season) → Weather
    • getWeatherEffect(weather) → WeatherEffect
    • shouldWeatherChange(weather, probability) → boolean
    • applyWeatherDamage(state, weather) → number
```
- **Dependencies**: core/domain/gamestate.ts
- **Tests**: 25+ test cases
- **Estimate**: 3-4 hours
- **Success Criteria**:
  - ✅ 4 functions with complete TSDoc
  - ✅ Weather mechanics documented in @remarks
  - ✅ Tests passing
  - ✅ No errors

##### Task 3.A.3: Narrative Selection Rules (2-3 functions)
```
Files to create/update:
  - src/core/rules/narrative/selector.ts (NEW)
    • selectTemplate(mood, context, templates[]) → Template
    • evaluateCondition(condition, state) → boolean
    • rankTemplateByContext(templates[], context) → ranked[]
```
- **Dependencies**: core/data/narrative/templates.ts, schemas.ts
- **Tests**: 30+ test cases
- **Estimate**: 3-4 hours
- **Success Criteria**:
  - ✅ 3 functions pure (no side effects)
  - ✅ Selection logic documented in @remarks
  - ✅ All narrative tests passing
  - ✅ Zero errors

##### Task 3.A.4: RNG (Random Number Generation) Rules (1-2 functions)
```
Files to create/update:
  - src/core/rules/rng.ts (NEW)
    • seedRandom(seed) → RNG
    • nextRandom(rng) → number (0-1)
    • nextInt(rng, min, max) → integer
```
- **Dependencies**: None
- **Tests**: 15+ deterministic tests
- **Estimate**: 1-2 hours
- **Success Criteria**:
  - ✅ RNG seeded for testing
  - ✅ Deterministic results
  - ✅ Documented in @remarks
  - ✅ All tests passing

##### Task 3.A.5: Loot & Drop Rules (3-4 functions)
```
Files to create/update:
  - src/core/rules/loot.ts (NEW)
    • calculateLootTable(creature, difficulty) → Loot[]
    • shouldDropItem(baseChance, bonusChance) → boolean
    • distributeExperience(totalXp, partySize) → number[]
```
- **Dependencies**: core/data/items/
- **Tests**: 25+ test cases
- **Estimate**: 2-3 hours
- **Success Criteria**:
  - ✅ 3 functions pure
  - ✅ Loot formulas documented
  - ✅ Tests passing
  - ✅ No errors

**PHASE 3.A Summary**:
- 📁 Files created: 5 new (crafting.ts, weather.ts, narrative/selector.ts, rng.ts, loot.ts)
- 📝 Functions: 27 total
- 🧪 Tests: 115+ new test cases
- ✅ Success: All 50 rule functions complete, 360+ total tests

---

#### PHASE 3.B: Refactor 12 Usecases to New Pattern

**Status**: Not Started  
**Current Pattern**: Various (needs documentation)  
**Target Pattern**: `(state, action) → { newState, effects[] }`

**Usecases to Refactor** (Expected 12):
```
src/core/usecases/
  ├── combat-usecase.ts
  ├── farming-usecase.ts
  ├── crafting-usecase.ts
  ├── harvest-usecase.ts
  ├── weather-usecase.ts
  └── ... (6 more)
```

**For Each Usecase**:
1. ✅ Identify all internal mutations
2. ✅ Replace with immutable state creation
3. ✅ Extract side effects into GameEffect[] array
4. ✅ Update signature: `(state, action) → { newState, effects[] }`
5. ✅ Add @remarks documenting orchestration steps
6. ✅ Update all callers (hooks)
7. ✅ Run tests (expect 100% pass)

**Example Refactoring**:
```typescript
// BEFORE
export function performAttack(attacker: Creature, defender: Creature) {
  const damage = calculateDamage(attacker, defender);
  defender.hp -= damage;  // MUTATION (bad)
  return { newAttacker: attacker, newDefender: defender };
}

// AFTER
export function performAttack(
  state: GameState,
  action: AttackAction
): { newState: GameState; effects: GameEffect[] } {
  // Step 1: Call pure rule
  const damage = calculateDamage(action.atk, action.def);
  
  // Step 2: Create immutable new state
  const newDefender = {
    ...state.defender,
    hp: Math.max(0, state.defender.hp - damage)
  };
  const newState = { ...state, defender: newDefender };
  
  // Step 3: Generate side effects
  const effects: GameEffect[] = [
    { type: 'PLAY_SOUND', sfx: 'hit.mp3' },
    { type: 'SAVE_GAME', data: newState }
  ];
  
  return { newState, effects };
}
```

**Estimate**: 2-3 hours per usecase × 12 = 24-36 hours (spread over 2 days)

**Success Criteria**:
- ✅ All 12 usecases follow new pattern
- ✅ All call pure rules from core/rules/
- ✅ All return { newState, effects[] }
- ✅ No mutations in usecase code
- ✅ All tests passing (360+ total)
- ✅ Zero TypeScript errors

---

### PHASE 4: Hook Integration & Effect Execution (Dec 20-21)
**Duration**: 2 days | **Hooks to Update**: 15+ | **Errors**: 0

#### Task 4.1: Create Effect Executor Utility
```typescript
// src/hooks/effect-executor.ts (NEW)
export function executeGameEffect(
  effect: GameEffect,
  {
    playSound,
    saveGame,
    emitEvent,
    showNotification,
    ...otherExecutors
  }
): Promise<void>
```

**Responsibilities**:
- Execute PLAY_SOUND effects
- Execute SAVE_GAME effects
- Emit events for UI updates
- Show notifications/toast messages
- Handle errors gracefully

**Tests**: 20+ test cases

**Estimate**: 2-3 hours

#### Task 4.2: Update 15+ Hooks
```
src/hooks/
  ├── use-game-state.ts ← Update to call usecases
  ├── use-combat.ts ← Update to execute effects
  ├── use-farming.ts ← Update
  ├── use-crafting.ts ← Update
  ├── use-inventory.ts ← Update
  ├── use-world.ts ← Update
  └── ... (9 more hooks)
```

**For Each Hook**:
1. Identify usecase calls
2. Update to capture effects
3. Call executeGameEffect for each effect
4. Add error handling
5. Update tests

**Example Hook Update**:
```typescript
// BEFORE
const handleAttack = useCallback((targetId) => {
  const { attacker, defender } = state;
  const [newAttacker, newDefender] = performAttack(attacker, defender);
  setState(prev => ({ ...prev, attacker: newAttacker, defender: newDefender }));
}, [state]);

// AFTER
const handleAttack = useCallback((targetId) => {
  const { newState, effects } = performAttack(state, { targetId });
  setState(newState);
  effects.forEach(effect => executeGameEffect(effect, { playSound, saveGame, emitEvent }));
}, [state]);
```

**Estimate**: 1 hour per hook × 15 = 15 hours (split over 1-2 days)

**Success Criteria**:
- ✅ All hooks call usecases
- ✅ All effects executed
- ✅ Game playable end-to-end
- ✅ Audio, saving, events working
- ✅ All tests passing (380+ total)
- ✅ Zero TypeScript errors

---

### PHASE 5: Legacy Cleanup & Production Ready (Dec 22)
**Duration**: 1 day | **Files to Delete**: 100+ | **Errors**: 0

#### Task 5.1: Delete Deprecated Folders
```
DELETE:
  ❌ src/core/types/ (→ moved to src/core/domain/)
  ❌ src/core/engines/ (→ logic moved to src/core/rules/)
  ❌ src/lib/game/ (→ moved to src/core/data/)
  ❌ src/lib/definitions/ (→ use src/core/domain/)
  ❌ src/lib/behaviors/ (→ deprecated)
  ❌ src/lib/creature-behaviors/ (→ deprecated)

KEEP:
  ✅ src/core/domain/
  ✅ src/core/data/
  ✅ src/core/rules/
  ✅ src/core/usecases/
  ✅ src/lib/narrative/ (text generation engine)
  ✅ src/lib/config/
  ✅ src/lib/locales/
  ✅ src/lib/utils/
  ✅ src/hooks/
  ✅ src/components/
```

**Estimate**: 2-3 hours

#### Task 5.2: Update All Imports
- Find & replace old import paths
- Verify zero "not found" errors
- Update tests to use new paths

**Estimate**: 2-3 hours

#### Task 5.3: Final Verification
```bash
✅ npm run typecheck      # Zero errors
✅ npm test               # All tests passing
✅ npm run lint           # Zero lint errors
✅ git status             # Clean working tree
✅ File audit             # No orphaned files
```

**Estimate**: 1 hour

**Success Criteria**:
- ✅ Zero TypeScript errors
- ✅ All tests passing (390+ total)
- ✅ Zero lint errors
- ✅ Zero deprecated imports
- ✅ All files organized per ARCHITECTURE.md
- ✅ Production-ready codebase

---

## 📅 TIMELINE & MILESTONES

| Date | Phase | Tasks | Status |
|------|-------|-------|--------|
| **Dec 14** | Documentation | Update docs ✅ | ✅ DONE |
| **Dec 15-16** | 3.A | Extract 27 rules | 🔴 TODO |
| **Dec 17-18** | 3.B | Refactor 12 usecases | 🔴 TODO |
| **Dec 19** | 3.B | Complete remaining usecases | 🔴 TODO |
| **Dec 20-21** | 4 | Hook integration | 🔴 TODO |
| **Dec 22** | 5 | Legacy cleanup | 🔴 TODO |
| **Dec 23** | Verification | Final validation | 🔴 TODO |

**Total Duration**: 10 days (Dec 15-23, 2025)

---

## 🚨 RISKS & MITIGATIONS

### Risk 1: Usecase Refactoring Breaking Existing Tests
**Severity**: 🔴 HIGH | **Probability**: 🟡 MEDIUM

**Mitigation**:
- Branch: Create feature branch before refactoring
- Tests: Run after each usecase refactored
- Rollback: `git reset --hard` if needed
- Status: Track test count per refactoring

### Risk 2: Missed Usecase Dependencies
**Severity**: 🟡 MEDIUM | **Probability**: 🟡 MEDIUM

**Mitigation**:
- Audit: List all usecases before refactoring
- Grep: Search for imports to find callers
- Test: Ensure all callers updated
- Status: 100% import audit before Phase 5

### Risk 3: Side Effect Ordering Issues
**Severity**: 🟡 MEDIUM | **Probability**: 🟢 LOW

**Mitigation**:
- Design: Document effect execution order
- Test: Test effect combinations
- Status: Verify with integration tests

### Risk 4: Import Path Refactoring Errors
**Severity**: 🟡 MEDIUM | **Probability**: 🟡 MEDIUM

**Mitigation**:
- Script: Use find-and-replace carefully
- Test: `npm run typecheck` catches imports
- Status: Zero import errors before Phase 5

### Risk 5: Performance Degradation
**Severity**: 🟢 LOW | **Probability**: 🟢 LOW

**Mitigation**:
- Monitor: Check bundle size
- Profile: Run performance tests
- Status: Baseline before/after

### Risk 6: Documentation Drift
**Severity**: 🟢 LOW | **Probability**: 🟢 LOW

**Mitigation**:
- Update: Update docs as code changes
- Verify: Docs = Law rule enforced
- Status: Zero doc violations

### Risk 7: Git History Pollution
**Severity**: 🟢 LOW | **Probability**: 🟢 LOW

**Mitigation**:
- Commit: Clear, atomic commits per task
- Message: Include phase/task in message
- Review: Clean history before merge
- Status: Linear git history maintained

---

## ✅ SUCCESS CRITERIA - DECLARATION OF COMPLETION

### Phase 3.A: Rules Complete
- [ ] 50/50 rule functions exist
- [ ] All have complete @remarks (Formula/Logic/EdgeCases)
- [ ] 360+ test cases passing
- [ ] Zero TypeScript errors
- [ ] Zero lint errors

### Phase 3.B: Usecases Refactored
- [ ] All 12 usecases use `{ newState, effects[] }` pattern
- [ ] No mutations in usecase code
- [ ] All call pure rules
- [ ] 360+ tests passing
- [ ] Zero errors

### Phase 4: Hooks Integrated
- [ ] 15+ hooks updated
- [ ] All effects executed
- [ ] Game playable end-to-end
- [ ] Audio, saving, events working
- [ ] 380+ tests passing
- [ ] Zero errors

### Phase 5: Production Ready
- [ ] All deprecated folders deleted
- [ ] All imports updated
- [ ] 390+ tests passing
- [ ] Zero TypeScript errors
- [ ] Zero lint errors
- [ ] ARCHITECTURE.md compliance: 100%
- [ ] Codebase production-ready ✅

---

## 💡 EXECUTION STRATEGY

### Daily Standup
**Each morning**: Review yesterday's progress, plan today's tasks
```
Questions:
- [ ] What was completed yesterday?
- [ ] What's planned for today?
- [ ] Any blockers?
- [ ] Test status? (✅ all green?)
```

### Commit Strategy
**After each task completion**:
```bash
git add .
git commit -m "feat(phase-3.A): extract crafting rules

WHAT: Created src/core/rules/crafting.ts with 3 pure functions
WHY: Consolidate crafting logic for orchestration by usecases
TESTS: 20+ new test cases, all passing (360+ total)
REFS: Task 3.A.1, ARCHITECTURE_CLEAN_SLATE.md"
```

### Test Discipline
**After each file/function**:
```bash
npm run typecheck   # Must be zero errors
npm test            # Must be 100% passing
npm run lint        # Must be zero lint errors
```

### Documentation Updates
**When architecture changes**:
- Update corresponding `docs/*.md`
- Mark changes with date: `[Updated: Dec 15, 2025]`
- Include rationale in commit message

---

## 🎯 CRITICAL SUCCESS FACTORS

1. **No Mutations** ❌→ ✅ All state changes must be immutable
2. **Tests Always Green** 🟢 Run after every change
3. **Docs = Law** 📝 Code follows documentation
4. **Atomic Commits** 💾 One feature per commit
5. **Zero Errors** 0️⃣ TypeScript, lint, test errors = STOP
6. **Effect Pattern** 🎭 All side effects via GameEffect[] return value
7. **Pure Rules** 🧪 core/rules/ = no mutations, no side effects

---

## 📞 HELP & REFERENCE

**Need help?**
1. Check [docs/PATTERNS.md](docs/PATTERNS.md) for code patterns
2. Reference [docs/ARCHITECTURE_CLEAN_SLATE.md](docs/ARCHITECTURE_CLEAN_SLATE.md) for structure
3. Review [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md) for TSDoc
4. Check [.github/copilot-instructions.md](.github/copilot-instructions.md) for rules

**Verification commands**:
```bash
# Check compilation
npm run typecheck

# Run all tests
npm test

# Run specific test file
npm test -- src/__tests__/combat.smoke.test.ts

# Lint check
npm run lint

# Type-check errors
npm run typecheck 2>&1 | grep -E "error|Error"
```

---

## 🚀 READY TO START!

**Next Step**: Tomorrow (Dec 15), begin **Phase 3.A, Task 3.A.1: Extract Crafting Rules**

Everything is planned. All documentation is updated. Architecture is locked.

**LET'S BUILD!** 🎮✨
