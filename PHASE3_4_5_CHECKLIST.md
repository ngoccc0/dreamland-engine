# ✅ PHASE 3-5 EXECUTION CHECKLIST

**Generated**: December 14, 2025  
**Status**: Ready for Phase 3 Execution  
**Time to Completion**: 10 business days (5 + 2 + 1 days)

---

## 🟢 PRE-EXECUTION VERIFICATION

- [ ] Read `PHASE3_4_5_ROADMAP.md` (full context)
- [ ] Read `docs/ARCHITECTURE_CLEAN_SLATE.md` (locked decisions)
- [ ] Read `docs/PATTERNS.md` (code patterns)
- [ ] Read `.github/copilot-instructions.md` (directives)
- [ ] Verify test baseline: `npm run test` → 304 passing, 1 skipped, 0 failing
- [ ] Verify no errors: `npm run typecheck` → ZERO errors
- [ ] Git status clean: `git status` → working tree clean

**Checkpoint**: All checked? Ready to proceed → PHASE 3.A

---

## 🔴 PHASE 3.A: RULES EXTRACTION (Days 1-3)

### Priority HIGH
#### Task 3.A.1: Crafting Rules
- [ ] Create `src/core/rules/crafting.ts` (150-200 lines)
- [ ] Extract 5-8 functions:
  - [ ] validateRecipe()
  - [ ] checkIngredients()
  - [ ] calculateCraftTime()
  - [ ] calculateSuccessChance()
  - [ ] applyRecipeToCrafter()
- [ ] All functions pure (no mutations, no side effects)
- [ ] Create `src/core/rules/__tests__/crafting.test.ts` (100% coverage)
- [ ] Write TSDoc with Glass Box @remarks (formula, logic, edge cases)
- [ ] Verify: `npm run test -- crafting` → ALL PASSING
- [ ] Verify: `npm run typecheck` → ZERO errors
- [ ] Git commit: `refactor(core): extract crafting rules`

#### Task 3.A.2: Weather Rules
- [ ] Create `src/core/rules/weather.ts` (180-250 lines)
- [ ] Extract 6-8 functions:
  - [ ] calculateWeatherTransition()
  - [ ] applyWeatherEffects()
  - [ ] getWeatherModifier()
  - [ ] simulateClimate()
  - [ ] (others from weather-engine.ts)
- [ ] All functions pure
- [ ] Create `src/core/rules/__tests__/weather.test.ts` (100% coverage)
- [ ] Write TSDoc with Glass Box @remarks
- [ ] Verify: `npm run test -- weather` → ALL PASSING
- [ ] Verify: `npm run typecheck` → ZERO errors
- [ ] Git commit: `refactor(core): extract weather rules`

#### Task 3.A.3: Narrative Rules
- [ ] Create `src/core/rules/narrative/` folder
- [ ] Create `src/core/rules/narrative/selector.ts` (100-150 lines)
  - [ ] selectTemplate()
  - [ ] evaluateCondition()
  - [ ] (other narrative selection logic)
- [ ] Create `src/core/rules/narrative/conditions.ts` (50-100 lines)
  - [ ] Pure condition evaluation functions
- [ ] All functions pure
- [ ] Create `src/core/rules/__tests__/narrative.test.ts` (100% coverage)
- [ ] Write TSDoc with Glass Box @remarks
- [ ] Verify: `npm run test -- narrative` → ALL PASSING
- [ ] Verify: `npm run typecheck` → ZERO errors
- [ ] Git commit: `refactor(core): extract narrative rules`

#### Task 3.A.4: RNG Rules
- [ ] Create `src/core/rules/rng.ts` (100-150 lines)
- [ ] Extract 3-5 functions:
  - [ ] seededRandom()
  - [ ] weightedChoice()
  - [ ] gaussianRandom()
- [ ] All functions pure
- [ ] Create `src/core/rules/__tests__/rng.test.ts` (100% coverage)
- [ ] Write TSDoc with Glass Box @remarks (formulas)
- [ ] Verify: `npm run test -- rng` → ALL PASSING
- [ ] Git commit: `refactor(core): extract rng rules`

#### Task 3.A.5: Loot Rules
- [ ] Create `src/core/rules/loot.ts` (150-200 lines)
- [ ] Extract 4-6 functions:
  - [ ] selectLootTable()
  - [ ] rollLoot()
  - [ ] calculateRarity()
- [ ] All functions pure
- [ ] Create `src/core/rules/__tests__/loot.test.ts` (100% coverage)
- [ ] Write TSDoc with Glass Box @remarks
- [ ] Verify: `npm run test -- loot` → ALL PASSING
- [ ] Git commit: `refactor(core): extract loot rules`

### Phase 3.A Exit Gate ✅
- [ ] `npm run typecheck` → ZERO errors
- [ ] `npm run test` → 360+ tests passing (baseline 304 + 56 new rule tests)
- [ ] Grep check: `grep -r 'state\.' --include='*.ts' src/core/rules/` → ZERO results
- [ ] Grep check: `grep -r 'from.*hooks' --include='*.ts' src/core/rules/` → ZERO results
- [ ] Grep check: `grep -r 'audioManager\|persistence' --include='*.ts' src/core/rules/` → ZERO results
- [ ] Git status: `git log --oneline | head -5` → See 5 new commits
- [ ] **Decision**: Ready for Phase 3.B? YES / NO

**IF NO**: Fix issues, re-test, continue Phase 3.A

**IF YES**: Proceed to Phase 3.B ✅

---

## 🔴 PHASE 3.B: USECASE REFACTORING (Days 4-5)

### Pattern Reference (OLD → NEW)
```typescript
// OLD (❌ mutation-based)
export function performAction(state: GameState, action: Action): GameState {
  state.player.hp -= damage;  // MUTATION
  audioManager.play('hit.mp3');  // SIDE EFFECT
  return state;
}

// NEW (✅ pure + effects)
export function performAction(
  state: GameState,
  action: Action
): [GameState, GameEffect[]] {
  const damage = calculateDamage(...);  // Pure rule
  const newState: GameState = {
    ...state,
    player: { ...state.player, hp: Math.max(0, state.player.hp - damage) }
  };
  const effects: GameEffect[] = [
    { type: 'PLAY_SOUND', sfx: 'hit.mp3' },
    { type: 'SAVE_GAME', data: newState }
  ];
  return [newState, effects];
}
```

### HIGH PRIORITY Usecases

#### Task 3.B.1: combat-usecase.ts
- [ ] Open `src/core/usecases/combat-usecase.ts`
- [ ] Refactor `performAttack()` to return `[newState, effects]`
  - [ ] Call `calculateDamage()` from `@/core/rules/combat`
  - [ ] Build newState immutably (spread operators)
  - [ ] Add effects: `[{type: 'PLAY_SOUND', sfx: 'hit.mp3'}, ...]`
- [ ] Refactor `endCombat()` similarly
- [ ] Update all 5+ functions to new pattern
- [ ] Update tests to verify effects format
- [ ] Verify: `npm run test -- combat-usecase` → ALL PASSING
- [ ] Git commit: `refactor(usecases): combat to [state, effects] pattern`

#### Task 3.B.2: farming-usecase.ts
- [ ] Open `src/core/usecases/farming-usecase.ts`
- [ ] Refactor to use rules from `@/core/rules/nature`
- [ ] Refactor all functions to return `[state, effects]`
- [ ] Update tests
- [ ] Verify: `npm run test -- farming-usecase` → ALL PASSING
- [ ] Git commit: `refactor(usecases): farming to [state, effects] pattern`

#### Task 3.B.3: crafting-usecase.ts
- [ ] Refactor to use rules from `@/core/rules/crafting`
- [ ] Refactor to return `[state, effects]`
- [ ] Update tests
- [ ] Verify: `npm run test -- crafting-usecase` → ALL PASSING
- [ ] Git commit: `refactor(usecases): crafting to [state, effects] pattern`

#### Task 3.B.4: weather-usecase.ts
- [ ] Refactor to use rules from `@/core/rules/weather`
- [ ] Refactor to return `[state, effects]`
- [ ] Update tests
- [ ] Verify: `npm run test -- weather-usecase` → ALL PASSING
- [ ] Git commit: `refactor(usecases): weather to [state, effects] pattern`

### MEDIUM PRIORITY Usecases

#### Task 3.B.5-10: Other Usecases (experience, reward, exploration, world, skill, plant-growth)
- [ ] For each file:
  - [ ] Refactor to return `[state, effects]`
  - [ ] Remove mutations (use spread operators)
  - [ ] Add effects array
  - [ ] Update tests
  - [ ] Verify: `npm run test -- [name]-usecase` → ALL PASSING
  - [ ] Git commit: `refactor(usecases): [name] to [state, effects] pattern`

### Phase 3.B Exit Gate ✅
- [ ] `npm run typecheck` → ZERO errors
- [ ] `npm run test` → ALL PASSING (no regressions)
- [ ] Grep check: All usecases return effects
  - [ ] `grep -r 'return \[.*effects' src/core/usecases/ | wc -l` → 12+
- [ ] Code review: No mutations in usecases
  - [ ] `grep -r 'state\.' src/core/usecases/ | grep '='` → Only expected patterns
- [ ] **Decision**: Ready for Phase 4? YES / NO

**IF NO**: Fix issues, re-test, continue Phase 3.B

**IF YES**: Proceed to Phase 4 ✅

---

## 🟡 PHASE 4: HOOK REFACTORING (Days 6-7)

### Prerequisite: Define GameEffect Type
- [ ] Verify `src/core/domain/` exports `GameEffect` type with all variants:
  - [ ] PLAY_SOUND
  - [ ] SAVE_GAME
  - [ ] EMIT_EVENT
  - [ ] SHOW_NOTIFICATION
  - [ ] SHAKE_CAMERA
  - [ ] SPAWN_PARTICLE
  - [ ] (others as needed)

### Task 4.1: Create Effect Executor
- [ ] Create `src/lib/utils/effect-executor.ts`
- [ ] Function: `executeSideEffect(effect: GameEffect): void`
- [ ] Handle all 6+ effect types:
  - [ ] PLAY_SOUND → call audioManager.play()
  - [ ] SAVE_GAME → call persistence.saveGame()
  - [ ] EMIT_EVENT → call eventBus.emit()
  - [ ] SHOW_NOTIFICATION → call toast.show()
  - [ ] SHAKE_CAMERA → call camera.shake()
  - [ ] SPAWN_PARTICLE → call particle system
- [ ] Write TSDoc
- [ ] Create `src/lib/utils/__tests__/effect-executor.test.ts` (100% coverage)
- [ ] Verify: `npm run test -- effect-executor` → ALL PASSING
- [ ] Git commit: `feat(lib): create side effect executor`

### Task 4.2: use-game-state Hook
- [ ] Open `src/hooks/use-game-state.ts`
- [ ] Update handlers to call usecases + execute effects:
  ```typescript
  const handleAttack = useCallback((action) => {
    const [newState, effects] = performAttack(state, action);
    setState(newState);
    effects.forEach(e => executeSideEffect(e));
  }, [state]);
  ```
- [ ] Update all handlers (attack, defend, craft, harvest, etc.)
- [ ] Update tests to mock executeSideEffect
- [ ] Verify: `npm run test -- use-game-state` → ALL PASSING
- [ ] Git commit: `refactor(hooks): use-game-state to effect executor pattern`

### Task 4.3: use-action-handlers Hook
- [ ] Open `src/hooks/use-action-handlers.ts`
- [ ] Refactor all action handlers:
  - [ ] fuseItems
  - [ ] harvest
  - [ ] itemUse
  - [ ] move
  - [ ] offlineAction
  - [ ] offlineAttack
  - [ ] offlineSkillUse
  - [ ] online
- [ ] Each handler calls usecase + executes effects
- [ ] Update tests
- [ ] Verify: `npm run test -- use-action-handlers` → ALL PASSING
- [ ] Git commit: `refactor(hooks): use-action-handlers to effect executor pattern`

### Task 4.4-6: Other Hooks (use-game-engine, use-creature-engine, etc.)
- [ ] For each hook:
  - [ ] Update handlers to use effect executor
  - [ ] Update tests
  - [ ] Verify: `npm run test -- [hook-name]` → ALL PASSING
  - [ ] Git commit: `refactor(hooks): [hook-name] to effect executor pattern`

### Phase 4 End-to-End Smoke Tests
- [ ] **Combat Flow**:
  - [ ] Start fight with enemy
  - [ ] Click attack
  - [ ] ✅ Damage dealt
  - [ ] ✅ Sound plays (hit.mp3)
  - [ ] ✅ Enemy HP reduced
  - [ ] ✅ Game saved (verify localStorage)
- [ ] **Farming Flow**:
  - [ ] Plant seed
  - [ ] Wait for growth (or skip time)
  - [ ] ✅ Plant grows
  - [ ] Click harvest
  - [ ] ✅ Item added to inventory
  - [ ] ✅ Sound plays (harvest.mp3)
- [ ] **Crafting Flow**:
  - [ ] Open crafting menu
  - [ ] Select recipe
  - [ ] Click craft
  - [ ] ✅ Check ingredients
  - [ ] ✅ Item created
  - [ ] ✅ Inventory updated
  - [ ] ✅ Sound plays (craft.mp3)

### Phase 4 Exit Gate ✅
- [ ] `npm run typecheck` → ZERO errors
- [ ] `npm run test` → ALL PASSING (no regressions)
- [ ] Smoke tests: ALL SCENARIOS PASSED
- [ ] No console errors in dev tools
- [ ] No audio glitches
- [ ] **Decision**: Ready for Phase 5? YES / NO

**IF NO**: Debug and fix, re-test, continue Phase 4

**IF YES**: Proceed to Phase 5 ✅

---

## 🔴 PHASE 5: LEGACY CLEANUP (Day 8)

### Task 5.1: Verify Imports (Safety Check)
```bash
# Create a verification script
echo "Searching for deprecated imports..."
grep -r "from '@/core/types'" --include="*.ts" src/ > /tmp/deprecated-refs.txt
grep -r "from '@/lib/definitions'" --include="*.ts" src/ >> /tmp/deprecated-refs.txt
grep -r "from '@/lib/game" --include="*.ts" src/ >> /tmp/deprecated-refs.txt
grep -r "from '@/core/engines" --include="*.ts" src/ >> /tmp/deprecated-refs.txt

# Check if file is empty
if [ -s /tmp/deprecated-refs.txt ]; then
  echo "❌ BLOCKING: Deprecated imports still exist"
  cat /tmp/deprecated-refs.txt
  exit 1
else
  echo "✅ SAFE: No deprecated imports found"
fi
```

- [ ] Run verification script above
- [ ] If ZERO results: Continue to 5.2
- [ ] If ANY results: Go back to Phase 4 (update those imports first)

### Task 5.2: Delete Deprecated Folders

#### 5.2.1: Delete `src/core/types/`
- [ ] Verify: `grep -r "from '@/core/types" src/ --include='*.ts'` → ZERO results
- [ ] Delete: `rm -rf src/core/types/`
- [ ] Verify: `npm run typecheck` → ZERO errors
- [ ] Git commit: `chore(core): delete deprecated types folder (moved to core/domain)`

#### 5.2.2: Delete `src/lib/definitions/`
- [ ] Verify: `grep -r "from '@/lib/definitions" src/ --include='*.ts'` → ZERO results
- [ ] Delete: `rm -rf src/lib/definitions/`
- [ ] Verify: `npm run typecheck` → ZERO errors
- [ ] Git commit: `chore(lib): delete deprecated definitions folder (moved to core/domain)`

#### 5.2.3: Delete `src/lib/game/`
- [ ] Verify: `grep -r "from '@/lib/game" src/ --include='*.ts'` → ZERO results
- [ ] Delete: `rm -rf src/lib/game/`
- [ ] Verify: `npm run typecheck` → ZERO errors
- [ ] Git commit: `chore(lib): delete deprecated game folder (moved to core/data)`

#### 5.2.4: Delete `src/core/engines/`
- [ ] Verify: `grep -r "from '@/core/engines" src/ --include='*.ts'` → ZERO results
- [ ] Delete: `rm -rf src/core/engines/`
- [ ] Verify: `npm run typecheck` → ZERO errors
- [ ] Git commit: `chore(core): delete deprecated engines folder (logic moved to core/rules)`

### Task 5.3: Update Documentation
- [ ] Update `docs/ARCHITECTURE.md`:
  - [ ] Add @DEPRECATED header at top
  - [ ] Add link to `ARCHITECTURE_CLEAN_SLATE.md`
  - [ ] Remove references to old paths
- [ ] Update `docs/MIGRATION_PHASES.md`:
  - [ ] Mark all phases complete with dates
  - [ ] Add completion summary
- [ ] Update `README.md`:
  - [ ] Add new folder structure diagram
  - [ ] Reference ARCHITECTURE_CLEAN_SLATE.md
- [ ] Create final report: `PHASE3_4_5_COMPLETION_REPORT.md`
- [ ] Git commit: `docs: mark legacy architecture as deprecated`

### Task 5.4: Final Verification
- [ ] `npm run typecheck` → ZERO errors
- [ ] `npm run test` → ALL PASSING
- [ ] `npm run lint` → Clean code
- [ ] `npm run build` → No warnings
- [ ] Check for remaining TODOs: `grep -r 'TODO\|FIXME' src/ --include='*.ts' | wc -l`
  - [ ] Document any unresolved tech debt in TECH_DEBT.md
- [ ] Git log: Verify 20+ commits documenting the work
- [ ] Git status: `working tree clean`

### Phase 5 Exit Gate ✅
- [ ] ✅ Zero deprecated path imports
- [ ] ✅ 100+ old files deleted
- [ ] ✅ 4 deprecated folders removed
- [ ] ✅ npm run typecheck → ZERO errors
- [ ] ✅ npm run test → ALL PASSING (0 failures, 0 regressions)
- [ ] ✅ No console warnings about missing imports
- [ ] ✅ Documentation updated
- [ ] **Status**: PHASES 3-5 COMPLETE ✅

---

## 🏁 FINAL VERIFICATION (Completion Gate)

### Comprehensive Check
```bash
# Run all verification commands
npm run typecheck                        # Zero errors
npm run test                             # All passing
npm run lint                             # Clean code
npm run build                            # No warnings
grep -r "TODO\|FIXME" src/              # Track tech debt
git log --oneline | head -20             # Document commits
git status                               # Working tree clean
```

### Checklist
- [ ] TypeScript: ZERO errors
- [ ] Tests: ALL PASSING (300+ tests)
- [ ] Linting: Clean (no warnings)
- [ ] Build: Successful (no warnings)
- [ ] Tech Debt: Documented
- [ ] Git History: Clean and documented
- [ ] Deprecated Code: ALL DELETED
- [ ] Old Folders: FULLY REMOVED

### Celebration Milestone 🎉
When ALL checkboxes above are ✅:
```
✅ PHASES 0-5: COMPLETE
✅ CLEAN SLATE REFACTORING: DONE
✅ ARCHITECTURE MODERNIZED
✅ CODE QUALITY: HIGH
✅ READY FOR PRODUCTION FEATURES
```

---

## 📊 TRACKING SHEET

| Phase | Task Count | Completed | Status | Days | Exit Gate |
|-------|-----------|-----------|--------|------|-----------|
| 3.A | 5 | 0 | 🔴 | 3 | [ ] |
| 3.B | 10 | 0 | 🔴 | 2 | [ ] |
| 4 | 6 | 0 | 🟡 | 2 | [ ] |
| 5 | 4 | 0 | 🟡 | 1 | [ ] |
| **TOTAL** | **25** | **0** | 🔴 | **8** | [ ] |

---

## 🆘 BLOCKERS / ISSUES LOG

### Day 1-3 (Phase 3.A)
- [ ] Issue: [describe]
  - Status: [OPEN / RESOLVED]
  - Resolution: [how fixed]

### Day 4-5 (Phase 3.B)
- [ ] Issue: [describe]
  - Status: [OPEN / RESOLVED]
  - Resolution: [how fixed]

### Day 6-7 (Phase 4)
- [ ] Issue: [describe]
  - Status: [OPEN / RESOLVED]
  - Resolution: [how fixed]

### Day 8 (Phase 5)
- [ ] Issue: [describe]
  - Status: [OPEN / RESOLVED]
  - Resolution: [how fixed]

---

## 📝 NOTES FOR SELF

- Review copilot-instructions.md DAILY for rule compliance
- The 3-Strike Rule: If verification fails >3x on one task, PAUSE + re-plan
- Mutation check: Grep for `state\.` in rules/ (should be ZERO)
- Side effect check: Grep for `audioManager|persistence` in rules/ (should be ZERO)
- Always run `npm run test` after major changes
- Commit frequently (daily) with clear messages
- Update this checklist as you progress

---

**START DATE**: December 14, 2025  
**TARGET END DATE**: December 23, 2025  
**CHECKPOINT FREQUENCY**: Daily  
**BACKUP STRATEGY**: Git rollback if 3+ verification failures  

🚀 **Ready to execute!**
