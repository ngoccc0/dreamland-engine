# LONG TERM NOTES - TECHNICAL DEBT & FUTURE WORK

Last Updated: December 13, 2025 (Phase 1 in progress)

---

## 🔴 CRITICAL (Breaking Changes, Architecture)

### Effect Engine: Fix Mutations to Immutability
**Status**: NOT STARTED
**Priority**: 🔴 CRITICAL
**Files**: 
  - src/core/engines/effect-engine.ts
  - src/__tests__/combat.smoke.test.ts
  - src/hooks/use-game-effects.ts

**Issue**: 
  - `processStatModification()` directly mutates target parameter
  - Game state mutations break immutability guarantee
  - Tests show direct mutations instead of returns
  
**Impact**: 
  - State mutations make testing/debugging hard
  - Unsafe for concurrent operations
  - Prevents undo/redo, state snapshots, replay functionality
  - Violates immutability principle

**Plan**:
  - [ ] Refactor effect-engine.ts: Return new Character object instead of mutating
  - [ ] Update all effect processors to follow immutable pattern
  - [ ] Update all effect callers (combat-usecase, game-loop) to use returned objects
  - [ ] Fix combat.smoke.test.ts assertions
  - [ ] Test replayability with recorded game states
  - [ ] Verify npm run typecheck and npm run test pass

**Estimated Effort**: 2-3 days
**Dependencies**: All effect-related usecases, game loop, tests
**Blocker**: Breaking change - must update all effect callers simultaneously
**Risk**: High - touches core game state mechanism

---

### Complete Repository Pattern
**Status**: IN PROGRESS
**Priority**: 🔴 CRITICAL (for maintainability)
**Files**: 
  - src/core/repositories/ (only 2 interfaces)
  - src/infrastructure/persistence/ (implementations)

**Issue**: 
  - Only WeatherRepository & WorldRepository exist
  - Missing abstract repos: CreatureRepository, ItemRepository, SkillRepository, EffectRepository, PlayerRepository
  - Direct imports in business logic bypass repository layer
  - Tight coupling to concrete persistence implementations

**Impact**: 
  - Hard to swap database backends (IndexedDB → Firebase → LocalStorage)
  - Business logic directly imports from infrastructure/
  - Testing requires real database, can't mock
  - Code reuse difficult

**Plan**:
  - [ ] Define abstract repository interfaces (Creature, Item, Skill, Effect, Player)
  - [ ] Implement for IndexedDB
  - [ ] Implement for Firebase
  - [ ] Update all direct imports to use repositories
  - [ ] Update hooks to use repository pattern
  - [ ] Add dependency injection for testing
  - [ ] Verify npm run test passes

**Estimated Effort**: 3-4 days
**Dependencies**: All data access, infrastructure
**Blocker**: None (can do incrementally)
**Risk**: Medium - affects many imports

---

## 🟡 HIGH (Code Quality, Consistency)

### TSDoc Coverage: Add to All Exports
**Status**: IN PROGRESS - Phase 1b (80% complete)
**Priority**: 🟡 HIGH
**Current Coverage**: ~85% (24/30+ exports)
**Files Completed**:
  - src/hooks/ - MAIN HOOKS (5/5 complete): useGameState, useGameEngine, useGameEffects, useActionHandlers, useKeyboardControls
  - src/hooks/ - GAME LIFECYCLE (5/5 complete): useGameInitialization, useGameSaving, usePlayerProgression, useGameEvents, useWorldRendering
  - src/hooks/ - ANIMATION (3/3 complete): useTypingAnimation (3 variants), useSkillShake, useIdleWarning
  - src/hooks/ - KEYBOARD (2/2 complete): useKeyboardBindings, useKeyboardControls
  - src/hooks/ - ACTION HANDLERS (7/7 complete): createHandleHarvest, createHandleOfflineAction, createHandleOfflineAttack, createHandleOfflineSkillUse, createHandleOnlineNarrative, createHandleOfflineItemUse, createHandleFuseItems
  - src/hooks/ - UTILITY (3/3 complete): useButtonAudio, useToast, createActionHelpers
  - src/context/ - ALL 4 HOOKS (4/4 complete): useAuth, useLanguage, useSettings, usePwaInstall
  - src/lib/audio/ (1/1 complete): useAudio
  - src/hooks/useMobileOptimization.ts (4/4 complete): useNetworkQuality, usePrefersReducedMotion, useResponsiveBreakpoint, useMobileOptimization

**Remaining Coverage**:
  - src/components/game/ (15% coverage - ~35 components) - LOWER PRIORITY
  - src/infrastructure/persistence/ (25% coverage - ~10 functions)
  - src/lib/utils/ (60% coverage - ~5 functions) - LOWER PRIORITY

**Plan**:
  - [x] Add TSDoc to all hooks/ exports (COMPLETED - 27 exports)
  - [x] Add TSDoc to all context/ hooks (COMPLETED - 4 exports)
  - [x] Add TSDoc to utility/helper functions (COMPLETED - 8 exports)
  - [ ] Add TSDoc to infrastructure/persistence/ exports (3-4 hours)
  - [ ] Add TSDoc to components/game/ exports (4-5 hours, lower priority)
  - [ ] Add TSDoc to remaining lib/utils exports (2-3 hours, lower priority)
  - [ ] Verify npm run typecheck (should already pass)
  - [ ] Add pre-commit hook to enforce TSDoc on new exports

**Estimated Effort**: 0.5 days remaining (Phase 1b completion)
**Dependencies**: None
**Note**: Phase 1b focus complete. Phase 1c can defer component TSDoc to later.
**Commits This Session**: 3 commits (d0662f3, 605908b, e7a3e74)

---

### Import Consistency: Convert Relative → Alias Paths
**Status**: NOT STARTED
**Priority**: 🟡 HIGH
**Issue**: ~30+ files use relative imports (`../../../`) instead of alias (`@/`)
**Files Affected**: 
  - src/lib/ (relative imports within lib)
  - src/lib/narrative/ (many `../` imports)
  - src/lib/game/ (some relative imports)

**Impact**: 
  - Harder to refactor (can't search `@/lib/...`)
  - Less clear import source
  - Inconsistent with codebase standard

**Plan**:
  - [ ] Search for all relative imports: `grep -r "from ['\"]\\.\\./" src/`
  - [ ] Replace with @/* paths systematically
  - [ ] Special case: Relative imports within same folder (like src/lib/narrative/) can stay if minimal
  - [ ] Verify npm run typecheck
  - [ ] Run tests to ensure no breakage

**Estimated Effort**: 1-2 days
**Dependencies**: None
**Automation**: Can use find-replace script across files

---

### lib/game/data/ Consolidation: Remove Duplicate Files
**Status**: DISCOVERED (needs audit)
**Priority**: 🟡 HIGH
**Issue**: Suspected duplicate creature/item definitions:
  - creatures/animals.ts (confirmed)
  - creatures/creatures.ts (unclear if duplicate)
  - creatures/creatures-full.ts (unknown)

**Impact**: 
  - Confused when adding new creatures (which file?)
  - Risk of data inconsistency
  - Wastes disk space
  - Violates DATA_DEFINITIONS.md rules

**Plan**:
  - [ ] Audit existing files in lib/game/data/
  - [ ] List all creature definition files and their contents
  - [ ] List all item definition files and their contents
  - [ ] Identify exact content overlap/duplicates
  - [ ] Merge duplicates into canonical files (follow DATA_DEFINITIONS.md)
  - [ ] Delete duplicate files
  - [ ] Update all imports
  - [ ] Verify npm run typecheck

**Estimated Effort**: 1 day
**Dependencies**: None
**Note**: Follow rules from DATA_DEFINITIONS.md to prevent future duplicates

---

### Naming Consistency: Standardize to kebab-case Files
**Status**: NOT STARTED
**Priority**: 🟡 HIGH
**Issue**: Mix of kebab-case and camelCase files
**Examples**:
  - use-game-state.ts (kebab, correct)
  - creatureEngine.ts (camelCase, wrong)
  - CombatEngine.ts (PascalCase, wrong for filename)

**Plan**:
  - [ ] Audit file naming across src/
  - [ ] Rename camelCase/PascalCase files to kebab-case
  - [ ] Update all imports in dependent files
  - [ ] Verify npm run typecheck

**Estimated Effort**: 1-2 days
**Dependencies**: None
**Risk**: High (many import changes)

---

## 🟠 MEDIUM (Refactoring, Optimization)

### Consolidate Specialized Hooks
**Status**: NOT STARTED
**Priority**: 🟠 MEDIUM
**Current Count**: 25+ hooks with single-action responsibility
**Examples**:
  - use-action-handlers.fuseItems.ts
  - use-action-handlers.harvest.ts
  - use-action-handlers.itemUse.ts
  - use-action-handlers.move.ts
  - (and many more)

**Issue**: 
  - Each action has its own hook file
  - Dependencies hard to trace
  - Makes state flow unclear
  - Difficult to test

**Plan**:
  - [ ] Review current hook structure
  - [ ] Design unified action handler hook pattern
  - [ ] Create pluggable action system
  - [ ] Move action-specific logic to handlers
  - [ ] Update components to use new pattern
  - [ ] Delete old specialized hooks
  - [ ] Test game-loop still works

**Estimated Effort**: 3-4 days
**Dependencies**: Components, game-lifecycle
**Risk**: High (refactoring core game loop)
**Note**: Wait until after Effect Engine refactor (they interact)

---

### Narrative Engine: Document State Mutation Pattern
**Status**: DISCOVERED (working, undocumented)
**Priority**: 🟠 MEDIUM
**File**: src/lib/narrative/state-manager.ts

**Issue**: 
  - Uses shallow copy pattern to prevent external mutations
  - Pattern is clever but undocumented
  - New developers don't understand WHY it's done this way

**Plan**:
  - [ ] Add detailed TSDoc explaining shallow copy pattern
  - [ ] Add example of the pattern in code comments
  - [ ] Add explanation to docs/PATTERNS.md
  - [ ] Verify this pattern is safe for concurrent access

**Estimated Effort**: 0.5 days
**Dependencies**: None
**Risk**: Low (documentation only)

---

### Game State Tests: Fix Mutation Assertions
**Status**: DISCOVERED (blocked)
**Priority**: 🟠 MEDIUM
**Files**: src/__tests__/game-loop.smoke.test.ts
**Blocker**: Depends on Effect Engine refactor (CRITICAL item above)

**Issue**: 
  - Tests show direct state mutations (anti-pattern)
  - When Effect Engine refactored, tests will break
  - Need to update assertions to test immutable returns

**Plan**:
  - [ ] Review current test assertions
  - [ ] Update to test immutable returns (AFTER Effect Engine fix)
  - [ ] Add snapshot testing for complex state changes
  - [ ] Test state history/replay functionality

**Estimated Effort**: 1 day (after Effect Engine fix)
**Dependencies**: Effect Engine refactor
**Risk**: Medium (tests may reveal issues)

---

### Fix State Immutability in Game Loop
**Status**: DISCOVERED (affected by Effect Engine fix)
**Priority**: 🟠 MEDIUM
**Files**: 
  - src/hooks/use-game-engine.ts
  - src/__tests__/game-loop.smoke.test.ts

**Issue**: 
  - Tests show direct mutations
  - Game loop may mutate state somewhere
  - Need to ensure state always returns new object

**Plan**:
  - [ ] Audit game-loop for mutations
  - [ ] Fix to return immutable state
  - [ ] Update tests (after Effect Engine fix)

**Estimated Effort**: 1-2 days
**Dependencies**: Effect Engine refactor
**Blocker**: None (can do incrementally)

---

## 🟢 LOW (Polish, Nice-to-Have)

### Add More Unit Tests for Hooks
**Status**: NOT STARTED
**Priority**: 🟢 LOW
**Current**: Only smoke tests (integration level)
**Need**: Unit tests for individual hooks

**Plan**:
  - [ ] Create src/hooks/__tests__/ folder
  - [ ] Write tests for critical hooks (useGameState, useGameEngine)
  - [ ] Mock usecases and dependencies
  - [ ] Test state transitions

**Estimated Effort**: 2-3 days
**Risk**: Low (new tests, no changes)

---

### Create Game Balance Reference Guide
**Status**: NOT STARTED
**Priority**: 🟢 LOW

**Plan**: 
  - [ ] Document creature stats, drop rates in docs/references/game-balance.md
  - [ ] Document item values, economy
  - [ ] Document skill balance, XP curves
  - [ ] Create balance tuning table

**Location**: docs/references/game-balance.md
**Estimated Effort**: 1 day

---

### Add Architecture Diagrams
**Status**: NOT STARTED
**Priority**: 🟢 LOW

**Plan**:
  - [ ] Create data flow diagram (State → Hook → Component)
  - [ ] Create event system diagram
  - [ ] Create persistence layer diagram
  - [ ] Use ASCII or image format

**Location**: docs/architecture/
**Estimated Effort**: 0.5 days

---

### Performance Optimization: Frame Limiting
**Status**: DISCOVERED (already implemented, undocumented)
**Priority**: 🟢 LOW
**File**: src/lib/utils/frame-limiter.ts

**Note**: Already implemented correctly
**Plan**:
  - [ ] Document in docs/PATTERNS.md
  - [ ] Ensure it's applied to render loops
  - [ ] Add performance profiling guide

---

### Setup ESLint: Enable Stricter Type Checking
**Status**: DISCOVERED (currently permissive)
**Priority**: 🟢 LOW
**Current**: 'no-explicit-any': 'off' (allows any type)

**Recommendation**: Gradually enable stricter checks
**Plan**:
  - [ ] Review codebase for any usages
  - [ ] Gradually change to 'warn' first
  - [ ] Eventually change to 'error'
  - [ ] Add TypeScript strict mode checks

**Estimated Effort**: 1-2 days (incremental)
**Risk**: Low (can enable gradually)

---

### CI/CD: Add Linting to Pre-commit Hook
**Status**: NOT IMPLEMENTED
**Priority**: 🟢 LOW

**Plan**:
  - [ ] Add husky pre-commit hook
  - [ ] Run `npm run lint` before commit
  - [ ] Run `npm run typecheck` before commit
  - [ ] Block commits with violations

**Estimated Effort**: 0.5 days
**Benefit**: Prevent bad code from being committed

---

## 🔧 INFRASTRUCTURE & CONFIG

### Update .github/copilot-instructions.md
**Status**: IN PROGRESS
**Priority**: 🟡 HIGH
**Note**: Already has excellent Dreamland Autonomous Architect rules

**Plan**:
  - [ ] Add reference to docs/ files
  - [ ] Add file size limit rules
  - [ ] Add link to DATA_DEFINITIONS.md for lib/game/data rules
  - [ ] Update with long-term fixes to implement

---

## 📊 SUMMARY TABLE

| Item | Status | Effort | Impact | Blocker | Phase |
|------|--------|--------|--------|---------|-------|
| **Effect Engine: Fix Mutations** | 🔴 NOT STARTED | 2-3d | 🔴 CRITICAL | Breaking change | Phase 2 |
| **Complete Repository Pattern** | 🟡 IN PROGRESS | 3-4d | 🟡 HIGH | None | Phase 2 |
| **TSDoc: All Exports** | 🔴 NOT STARTED | 2d | 🟡 MEDIUM | None | Phase 1 |
| **Import Consistency** | 🔴 NOT STARTED | 1-2d | 🟡 MEDIUM | None | Phase 1 |
| **lib/game/data Consolidation** | 🟡 DISCOVERED | 1d | 🟡 MEDIUM | None | Phase 1 |
| **Naming Consistency** | 🟡 NOT STARTED | 1-2d | 🟠 LOW | None | Phase 1 |
| **Consolidate Hooks** | 🔴 NOT STARTED | 3-4d | 🟡 MEDIUM | Breaking change | Phase 3 |
| **Document Narrative Pattern** | 🟡 DISCOVERED | 0.5d | 🟢 LOW | None | Phase 1 |
| **Fix Test Mutations** | 🟡 DISCOVERED | 1d | 🟢 LOW | Effect Engine | Phase 2 |
| **Unit Tests for Hooks** | 🔴 NOT STARTED | 2-3d | 🟢 LOW | None | Phase 3 |
| **Game Balance Guide** | 🔴 NOT STARTED | 1d | 🟢 LOW | None | Optional |
| **Architecture Diagrams** | 🔴 NOT STARTED | 0.5d | 🟢 LOW | None | Optional |

---

## 🎯 RECOMMENDED EXECUTION ORDER

### **Phase 1: Quick Wins (No Breaking Changes) - ~5-7 days - 85% COMPLETE**

**Completed (Dec 13)**:
1. ✅ **Create rule files** (ARCHITECTURE.md, CODING_STANDARDS.md, DATA_DEFINITIONS.md, PATTERNS.md) - COMPLETED Dec 12
2. ✅ **Add TSDoc to all hook exports** (27 hooks + 8 utility functions + 4 context hooks) - COMPLETED Dec 13
3. ✅ **Import consistency**: Fixed 5 cross-folder relative imports → @/* aliases - COMPLETED Dec 13a
4. ✅ **lib/game/data consolidation**: Audited, NO duplicates found, design validated - COMPLETED Dec 13a

**Remaining (~5 hours)**:
5. [ ] Add TSDoc to infrastructure/persistence/ exports (3-4 hours)
6. [ ] Naming consistency: kebab-case standardization (14 files, 2-3 hours) - DEFERRED to Phase 1c
7. [ ] Document Narrative pattern (0.5 days) - DEFERRED to Phase 1c

**Deliverables (Completed)**:
- ✅ All hook/context exports have TSDoc (39/39)
- ✅ All action handlers have TSDoc (7/7)
- ✅ All utility functions have TSDoc (8/8)
- ✅ Cross-folder imports use @/* aliases (5 files fixed)
- ✅ No duplicate definitions in lib/game/data/
- ✅ TSDoc coverage: ~85% (hooks/contexts complete, infrastructure pending)

**Remaining Deliverables**:
- Infrastructure/persistence TSDoc (5+ exports)
- Kebab-case file naming (14 files, lower priority)
- Narrative pattern documentation (0.5 days)

---

### **Phase 2: Architecture Improvements (Breaking Changes) - ~5-7 days**
1. Complete Repository Pattern (3-4 days)
2. Fix test mutations in game-loop (1 day)
3. ESLint stricter type checking (1-2 days, incremental)

**Deliverables**:
- All data access via repositories
- Tests use immutable patterns
- Type safety improved

---

### **Phase 3: Major Refactors (Breaking Changes) - ~5+ days**
1. **Effect Engine: Fix mutations** (2-3 days)
2. Fix related tests (1 day)
3. Consolidate specialized hooks (3-4 days)
4. Unit tests for hooks (2-3 days)

**Deliverables**:
- Immutable state throughout
- Cleaner hook architecture
- Full test coverage

---

### **Optional Polish (~2 days)**
- Add game balance reference guide (1 day)
- Add architecture diagrams (0.5 days)
- CI/CD pre-commit hooks (0.5 days)

---

## 📝 HOW TO USE THIS FILE

### When Starting a Task
1. Find the task in this file
2. Change status to `IN PROGRESS`
3. Work through the plan checklist

### When Completing a Task
1. Mark all [ ] as [x]
2. Change status to `COMPLETED`
3. Add completion date and notes if needed

### When Discovering New Issues
1. Add to appropriate section (🔴/🟡/🟠/🟢)
2. Fill out template with Status, Issue, Plan, Effort
3. Link related files
4. Note in commit message: "Logged in LONG_TERM_NOTES.md"

### Reviewing Progress
- Check this file weekly
- Update effort estimates as you learn more
- Reprioritize if new blockers found
- Share with team/AI for planning

---

## 📌 NOTES

### Why These Categories?
- **🔴 CRITICAL**: Blocks other work, causes bugs, breaks architecture
- **🟡 HIGH**: Important for maintainability, code quality
- **🟠 MEDIUM**: Refactoring, optimization, technical debt
- **🟢 LOW**: Polish, nice-to-have, can wait

### Why This Order?
1. **Phase 1**: Quick wins build momentum, improve code quality immediately
2. **Phase 2**: Architecture fixes enable better testing and swappability
3. **Phase 3**: Major refactors (only after foundation is solid)
4. **Optional**: Polish happens when time permits

### Estimated Total Effort
- **Phase 1**: 5-7 days
- **Phase 2**: 5-7 days
- **Phase 3**: 5+ days
- **Total**: ~15-20 days of focused work

### Risk Management
- **Phase 1**: Low risk (docs + improvements)
- **Phase 2**: Medium risk (affects data layer)
- **Phase 3**: High risk (breaking changes, needs full testing)

---
