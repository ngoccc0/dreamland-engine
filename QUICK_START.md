# ⚡ QUICK START - PHASES 3-5 OVERVIEW

## 📍 WHERE WE ARE (Dec 14, 2025)

✅ **Completed**:
- Documentation (docs/, copilot-instructions.md, PATTERNS.md, CODING_STANDARDS.md updated)
- Core architecture locked (core/domain, core/data, core/rules, core/usecases)
- 23/50 rule functions done (combat + nature rules with Glass Box TSDoc)
- 304/305 tests passing (99.67%)
- TypeScript: 0 errors

🔴 **Remaining**:
- 27 more rule functions (crafting, weather, narrative, rng, loot)
- 12 usecases refactored to `{ newState, effects[] }` pattern
- 15+ hooks updated to execute effects
- Legacy cleanup (delete deprecated folders)

---

## 🎯 WHAT'S NEXT (3 Phases, 10 Days)

### Phase 3: Rules & Usecases (Dec 15-19)
**PHASE 3.A**: Extract 27 remaining rules (Dec 15-16)
```
- Crafting rules (3 functions)
- Weather rules (4 functions)
- Narrative selection (3 functions)
- RNG rules (2 functions)
- Loot rules (3 functions)

Result: 50/50 rule functions, 360+ tests
```

**PHASE 3.B**: Refactor 12 usecases (Dec 17-19)
```
Change from: performAttack(attacker, defender) → [new, new]
To:          performAttack(state, action) → { newState, effects }

Result: 360+ tests, all green
```

### Phase 4: Hooks & Effects (Dec 20-21)
**PHASE 4**: Integrate hooks with effect execution
```
1. Create effect executor utility
2. Update 15+ hooks to execute effects
3. Verify game playable end-to-end

Result: 380+ tests, game fully playable
```

### Phase 5: Production Ready (Dec 22)
**PHASE 5**: Legacy cleanup
```
1. Delete deprecated folders (core/types, lib/game, etc.)
2. Update all imports
3. Final verification

Result: 390+ tests, 0 errors, production-ready
```

---

## 📋 DAILY CHECKLIST

### ✅ Before Starting Each Day
```bash
# 1. Pull latest changes
git status

# 2. Run tests (should be all green)
npm test

# 3. Check TypeScript (should be 0 errors)
npm run typecheck

# 4. Check lint (should be 0 errors)
npm run lint

# 5. Update EXECUTION_CHECKLIST.md with yesterday's progress
```

### ✅ During Development
- For each new file/function:
  ```bash
  npm run typecheck  # Must be 0 errors
  npm test           # Must be all passing
  npm run lint       # Must be 0 errors
  ```

- After each completed task:
  ```bash
  git add .
  git commit -m "feat(phase-X.Y): description

  WHAT: What code was added/changed
  WHY: Why this change was needed
  TESTS: How many tests, all passing?
  REFS: Task number, docs references"
  ```

### ✅ At End of Day
- Update EXECUTION_CHECKLIST.md
- Verify all tests passing
- Commit any pending changes
- Document blockers/issues

---

## 🚨 CRITICAL RULES

1. **NO MUTATIONS** ❌
   ```typescript
   // WRONG:
   state.hp -= damage;  // mutation
   
   // CORRECT:
   const newState = { ...state, hp: state.hp - damage };
   ```

2. **TESTS ALWAYS GREEN** 🟢
   ```bash
   npm test  # Must show: Tests: XXX passed, 0 failed
   ```

3. **ZERO TYPESCRIPT ERRORS** 0️⃣
   ```bash
   npm run typecheck  # Must be silent (no output = no errors)
   ```

4. **@remarks WITH FORMULA** 📝
   ```typescript
   /**
    * Calculates damage.
    * @remarks
    * **Formula:** `damage = max(1, attack - defense)`
    */
   ```

5. **PURE RULES (core/rules/)** 🧪
   - No mutations
   - No side effects
   - No React/hooks
   - Pure math only

6. **USECASES RETURN EFFECTS** 🎭
   ```typescript
   // Must return effects, not execute them
   return { newState, effects: [{ type: 'PLAY_SOUND', ... }] }
   ```

---

## 📚 DOCUMENTATION

Read these in order:
1. **ROADMAP_NEXT_STEPS.md** ← Current file, full plan
2. **EXECUTION_CHECKLIST.md** ← Daily tracking
3. **docs/PATTERNS.md** ← Code patterns reference
4. **docs/ARCHITECTURE_CLEAN_SLATE.md** ← Architecture reference
5. **docs/CODING_STANDARDS.md** ← Coding rules

---

## 🛠️ KEY COMMANDS

```bash
# Run tests
npm test

# Run specific test file
npm test -- src/__tests__/combat.smoke.test.ts

# Check TypeScript
npm run typecheck

# Check linting
npm run lint

# Build
npm run build

# Check types and lint together
npm run typecheck && npm run lint

# See git status
git status

# See recent commits
git log --oneline -10
```

---

## 🎯 SUCCESS METRICS

By Dec 22, 2025:
- ✅ 50+ rule functions (50/50)
- ✅ 390+ tests (all passing)
- ✅ 0 TypeScript errors
- ✅ 0 lint errors
- ✅ 0 deprecated imports
- ✅ 12 usecases refactored
- ✅ 15+ hooks updated
- ✅ Production-ready codebase

---

## 🚀 START HERE

**Tomorrow (Dec 15)**:
1. Open EXECUTION_CHECKLIST.md
2. Start Phase 3.A, Task 3.A.1: Extract Crafting Rules
3. Follow the checklist
4. Run tests after each step
5. Commit when task complete

**Each day**:
- Check EXECUTION_CHECKLIST.md
- Complete assigned tasks
- Keep tests green
- Update progress
- Commit at end of day

---

## ❓ GOT STUCK?

1. Check docs/PATTERNS.md for examples
2. Review existing code (combat.ts, nature.ts)
3. Run `npm test -- --verbose` for details
4. Check git history: `git log --oneline -20`
5. Reference ARCHITECTURE_CLEAN_SLATE.md

---

## 📅 TIMELINE AT A GLANCE

```
Dec 15-16: Phase 3.A (Extract 27 rules)      360+ tests ✅
Dec 17-19: Phase 3.B (Refactor 12 usecases)  360+ tests ✅
Dec 20-21: Phase 4 (Update 15+ hooks)        380+ tests ✅
Dec 22:    Phase 5 (Legacy cleanup)          390+ tests ✅

RESULT: Production-ready codebase 🎉
```

---

**Ready to build? Let's go!** 🚀
