---
title: TEST MIGRATION ROADMAP - Phase 3.0 Refactor
created: 2025-12-23
status: FOUNDATION PHASE
---

# Test Migration Strategy for useGameEngine Decomposition

## Overview

During Phase 3.0 refactoring, `useGameEngine` (554 lines) will be split into 5 focused hooks:
- `useMoveOrchestrator` (input handling)
- `useEffectProcessor` (effect application)
- `useCreatureSimulation` (creature AI)
- `useWeatherSimulation` (weather advancement)
- `useGameEngine` (thin orchestrator)

This document tracks which tests will be impacted and provides migration strategy for each.

---

## DEPENDENCY ANALYSIS

### Files Importing `useGameEngine`

1. **src/hooks/use-exploration.ts** (Line 38)
   - Imports: `useGameEngine` from context
   - Usage: Calls `useGameEngine().explorationUsecase`
   - Impact: ⚠️ MEDIUM - Uses extracted business logic
   - Status: No test file found (component only)

2. **src/hooks/use-world-management.ts** (Line 4)
   - Imports: `useGameEngine` from context
   - Usage: Calls `useGameEngine().worldUsecase`
   - Impact: ⚠️ MEDIUM - Uses extracted business logic
   - Status: No test file found (component only)

3. **src/components/game/panels/game-layout.tsx** (Line 8)
   - Imports: `useGameEngine`
   - Usage: `const { gameState, actionHandlers } = useGameEngine(props)`
   - Impact: 🟢 LOW - Returns same interface shape
   - Status: Integration component (no unit test expected)

### Direct Test Files (Need Audit)

**None found** that explicitly import `useGameEngine` directly in test files.

### Indirect Dependencies

The following test files test usecases or logic that will be called differently:

1. `src/core/usecases/__tests__/combat-usecase.test.ts`
   - Tests: Combat rule execution
   - Current: Direct function test (rules are pure)
   - After refactor: No change (rules stay same)
   - Status: ✅ NO MIGRATION NEEDED

2. `src/core/usecases/__tests__/farming-usecase.test.ts`
   - Tests: Farming/harvesting logic
   - Current: Direct function test
   - After refactor: No change
   - Status: ✅ NO MIGRATION NEEDED

3. `src/core/usecases/__tests__/item-use-usecase.test.ts`
   - Tests: Item consumption logic
   - Current: Direct function test
   - After refactor: No change
   - Status: ✅ NO MIGRATION NEEDED

4. `src/hooks/__tests__/hook-effect-integration.test.ts`
   - Tests: Integration of game effects
   - Current: Tests state management
   - After refactor: May need update if mocks `useGameEngine`
   - Status: ⚠️ AUDIT REQUIRED

5. `src/lib/game/__tests__/effect-engine.test.ts`
   - Tests: EffectEngine pure functions
   - Current: Direct function test
   - After refactor: No change (engine stays same)
   - Status: ✅ NO MIGRATION NEEDED

---

## TEST MIGRATION MATRIX

### Phase 1: Foundation (Week 1, Days 1-5)
- ✅ Event Bus tests: 10 tests PASSING
- ✅ Selector tests: To be written when selectors used in components
- ⚠️ Audit existing tests for useGameEngine mocks

**Action Items:**
1. Run: `npm test -- --listTests | grep -E "(game-engine|action-handler)"`
2. Document which tests mock useGameEngine
3. Identify test fixtures that assume 554-line hook shape

### Phase 2: Surgery Phase 1 (Week 2, Days 6-7)
**useMoveOrchestrator + Integration Tests**

New Tests to Create:
- `src/hooks/__tests__/use-move-orchestrator.test.ts` (8 tests)
  - Test move queuing, debouncing, collision detection
  - Test input lock during 300ms animation
  - Test promise resolution timing

**Existing Tests Impact:**
- None (new hook, no existing tests to migrate)

### Phase 2: Surgery Phase 2 (Week 2, Days 7-8)
**useEffectProcessor + Integration Tests**

New Tests to Create:
- `src/hooks/__tests__/use-effect-processor.test.ts` (7 tests)
  - Test effect application
  - Test narrative generation
  - Test multiple effects in queue

**Existing Tests Impact:**
- `src/lib/game/__tests__/effect-engine.test.ts` (no change; tests EffectEngine directly)

### Phase 2: Surgery Phase 3 (Week 2–3, Days 9-10)
**useCreatureSimulation + Creature AI Tests**

New Tests to Create:
- `src/hooks/__tests__/use-creature-simulation.test.ts` (8 tests)
  - Test creature AI per turn
  - **CRITICAL:** Test SYNC-BACK protocol (creatures not mutated, updates returned)
  - **CRITICAL:** Test save game backward compatibility

**Existing Tests Impact:**
- `src/core/engines/__tests__/*.test.ts` (no change; creature engine tested directly)

### Phase 2: Surgery Phase 4 (Week 3, Days 10-11)
**useWeatherSimulation + Weather Tests**

New Tests to Create:
- `src/hooks/__tests__/use-weather-simulation.test.ts` (6 tests)
  - Test weather progression
  - Test temperature effects
  - Test player status application

**Existing Tests Impact:**
- None (new hook, weather engine tested separately)

### Phase 3: Surgery Phase 5 (Week 3, Days 11-12)
**useGameEngine Simplification**

**Refactor Existing Tests:**
- `src/hooks/__tests__/use-game-engine.test.ts` (if exists, update shape)
- Update integration tests that call useGameEngine

**New Integration Tests:**
- `src/hooks/__tests__/use-game-engine.integration.test.ts`
  - Full game tick (move → effects → creatures → weather)
  - Verify orchestration chain works
  - Verify events emitted correctly

### Phase 4: Integration (Week 4, Days 13-16)
**Events + UI Feedback Tests**

New Tests to Create:
- `src/hooks/__tests__/use-global-events.test.ts` (6 tests)
  - Test React Strict Mode safety
  - Test cleanup functions
  - Test multiple subscribers

- `src/lib/narrative/__tests__/filters.test.ts` (4 tests)
  - Test narrative categorization
  - Test icon mapping

- `src/components/ui/__tests__/LevelUpOverlay.test.tsx` (3 tests)
  - Test event triggering
  - Test auto-dismiss
  - Test SFX playback

---

## CRITICAL TEST CASES (ZERO REGRESSIONS)

### Save Game Backward Compatibility (MANDATORY)

**Test File:** `src/hooks/__tests__/use-creature-simulation.test.ts`

```typescript
describe('Backward Compatibility - Save Game Migration', () => {
  it('should load pre-refactor save game without creature desync', () => {
    // 1. Load old save with creatures at position (10, 20)
    const oldSave = loadPreRefactorSave()
    const gameState = restoreGameState(oldSave)
    
    // 2. Run 1 turn of simulation
    const { pendingCreatureUpdates } = useCreatureSimulation(gameState, gameState.turn)
    
    // 3. Apply updates immutably
    const newState = applyCreatureUpdates(gameState, pendingCreatureUpdates)
    
    // 4. Verify creatures in world.chunks match pendingUpdates
    expect(newState.world.chunks[chunkKey].enemies).toEqual(expectedCreatures)
    
    // 5. Save again - structure must be compatible
    const newSave = serializeGameState(newState)
    expect(newSave.world.chunks).toBeDefined() // Old schema preserved
  })
})
```

### Input Lock During Animation (MANDATORY)

**Test File:** `src/hooks/__tests__/use-move-orchestrator.test.ts`

```typescript
describe('300ms Animation Lock', () => {
  it('should prevent input overlap during move animation', async () => {
    const orchestrator = useMoveOrchestrator()
    
    // First move
    const promise1 = orchestrator.handleMove('NORTH')
    
    // Try to move again immediately (within 300ms)
    const promise2 = orchestrator.handleMove('EAST')
    
    // First move should execute
    await promise1
    
    // Second move should be debounced out
    // (or queued but not execute until first completes)
    expect(queuedMoves).toBeLessThanOrEqual(1)
  })
})
```

### Event Bus Memory Leak (MANDATORY)

**Test File:** `src/hooks/__tests__/use-global-events.test.ts`

```typescript
describe('React Strict Mode - No Memory Leaks', () => {
  it('should not create duplicate listeners in Strict Mode', () => {
    const callback = jest.fn()
    
    // Strict Mode mount cycle: mount → unmount → mount
    const { unmount, rerender } = renderHook(() => 
      useGlobalEvents('LEVEL_UP', callback)
    )
    
    unmount()
    
    // Re-render (simulating Strict Mode remount)
    const { result } = renderHook(() =>
      useGlobalEvents('LEVEL_UP', callback)
    )
    
    // Emit one event
    GameEvents.emit('LEVEL_UP', levelUpPayload)
    
    // Should only fire once, not twice
    expect(callback).toHaveBeenCalledTimes(1)
  })
})
```

### Effect Application Atomicity (MANDATORY)

**Test File:** `src/hooks/__tests__/use-effect-processor.test.ts`

```typescript
describe('Atomic Effect Application', () => {
  it('should apply multiple effects atomically without race conditions', () => {
    const effects = [
      { type: 'DAMAGE', target: 'player', amount: 10 },
      { type: 'HEAL', target: 'player', amount: 5 },
      { type: 'STATUS', type: 'POISON', target: 'player' }
    ]
    
    const { appliedEffects, narratives } = useEffectProcessor(gameState, effects)
    
    // All effects applied in order
    expect(appliedEffects).toHaveLength(3)
    
    // State consistent (no partial updates visible)
    expect(gameState.playerStats.hp).toBe(95) // 100 - 10 + 5
    expect(gameState.playerStats.statuses).toContain('POISON')
    
    // Narratives generated for all effects
    expect(narratives).toHaveLength(3)
  })
})
```

---

## TEST FAILURE RESPONSE PROTOCOL

If test fails during refactoring:

1. **Identify Phase:** Which week/day failed?
2. **Root Cause:** Is it the hook change or test setup issue?
3. **Action:**
   - If hook logic: Fix hook implementation, re-run test
   - If test setup: Update test mock/fixture, re-run
   - If schema: Update both hook AND test to match new interface
4. **Revert if >3 attempts:** If test fails 3 times, revert last commit and reassess architecture

---

## COMMIT CHECKPOINTS

Each commit must pass:

```bash
npm test -- --bail  # Stop at first failure
npm run typecheck   # 0 TypeScript errors
npm run build       # Builds without warnings
```

If any fails:
- Do NOT proceed to next phase
- Debug and fix in current commit
- Do NOT move to next task until current task fully passes

---

## TEST COVERAGE TARGETS

| Hook | Minimum Coverage | Target Coverage |
|------|------------------|-----------------|
| GameEvents | 90% | 100% |
| useMoveOrchestrator | 80% | 95% |
| useEffectProcessor | 85% | 95% |
| useCreatureSimulation | 80% | 90% (includes save game test) |
| useWeatherSimulation | 80% | 90% |
| useGameEngine (refactored) | 70% | 85% (integration test focus) |
| useGlobalEvents | 85% | 95% (Strict Mode critical) |
| NarrativeFilters | 90% | 100% (pure functions) |

---

## AUDIT CHECKLIST (Week 1, Day 1)

Before starting refactoring, complete:

- [ ] List all test files that import `useGameEngine`
- [ ] Run test suite to establish baseline (currently 580 tests, 1 skipped)
- [ ] Document which tests mock game state
- [ ] Identify test fixtures that assume 554-line hook
- [ ] Review React Strict Mode test patterns in existing tests
- [ ] Plan save game migration strategy
- [ ] Create test spec templates for new hooks

**Completion Status:** ⏳ Pending manual audit execution

---

## Questions for Lead

1. Should new hook tests use Zustand's shallow equality helpers?
2. Are there integration tests for full game loop that we should update?
3. How is save game versioning handled (need forward/backward compatibility)?
4. Should we snapshot test the event payloads or just structure?
