# 🗺️ VISUAL ROADMAP OVERVIEW
## Dreamland Engine - Phases 3, 4, 5 at a Glance

---

## 📊 PROJECT FLOW DIAGRAM

```
CURRENT STATE (Dec 14, 2025)
════════════════════════════════════════════════════════════════

PHASE 0 ✅         PHASE 1 ✅         PHASE 2 ✅
Documentation      Domain Foundation   Data Consolidation
COMPLETE          COMPLETE            COMPLETE
  │                   │                    │
  ├─ 7 decisions      ├─ 5 files          ├─ 50+ files
  │  locked          │  created          │  migrated
  ├─ SSOT docs       ├─ Zod schemas      ├─ core/data/
  ├─ Architecture    ├─ Type inference   ├─ items/
  └─ Patterns        └─ 100% TSDoc       ├─ creatures/
                                        ├─ recipes/
                                        └─ narrative/


NEXT PHASES (Dec 15-23, 2025)
════════════════════════════════════════════════════════════════

PHASE 3.A 🔴         PHASE 3.B 🔴        PHASE 4 🟡        PHASE 5 🟡
Rules Extraction     Usecase Refactoring Hook Refactoring  Legacy Cleanup
IN PROGRESS          BLOCKED             BLOCKED           BLOCKED

Days 1-3:            Days 4-5:            Days 6-7:         Day 8:

5 Tasks:            10 Tasks:            6 Tasks:          4 Tasks:

1. Crafting Rules   1. Refactor          1. Create         1. Verify
   (5-8 functions)     combat-usecase      effect-executor  2. Delete
                                                              folders
2. Weather Rules    2. Refactor          2. Update         3. Update
   (6-8 functions)     farming-usecase     use-game-state   docs
                                                           4. Final
3. Narrative Rules  3. Refactor          3. Update           verify
   (6-8 functions)     crafting-usecase    use-action-
                                          handlers
4. RNG Rules        4-10. Other          
   (3-5 functions)      usecases         4-6. Other hooks

5. Loot Rules       All return
   (4-6 functions)   [state, effects]


EXIT GATE ✓         EXIT GATE ✓         EXIT GATE ✓       EXIT GATE ✓
50 rules ✅         All refactored ✅   Game playable ✅  Zero imports ✅
360 tests ✅        304+ tests ✅       All tests ✅      100+ deleted ✅
Zero errors ✅      Zero errors ✅      Zero errors ✅    Zero errors ✅
```

---

## 📈 COMPLETION TIMELINE

```
WEEK 1 (Dec 15-19)
════════════════════════════════════════════════════════════════

MON    TUE    WED    THU    FRI
15     16     17     18     19
│      │      │      │      │
├─ 3A: ├─ 3A: ├─ 3B: ├─ 3B: └─ 3B:
│ Craft│ RNG  │ Start│ Continue COMPLETE
│ Weather Loot│ Combat Farming
│      │      │ Farming Other
│      │      │      │
└──────┴──────┴──────┴──────────┘
     PHASE 3.A         PHASE 3.B


WEEK 2 (Dec 22-26)
════════════════════════════════════════════════════════════════

MON    TUE    WED    THU    FRI
22     23     24     25     26
│      │      │      │      │
├─ 4:  ├─ 4:  ├─ 4:  ├─ 5:  └─ Final:
│Create Continue Smoke Test Delete Verify
│Execute Hooks  Scenarios Folders Docs
│        Tests          Update
│                       Final
└──────────┴──────┴──────┴──────────┘
  PHASE 4           PHASE 5
```

---

## 🎯 PHASE 3.A: RULES EXTRACTION DETAIL

```
Create src/core/rules/
├── ✅ combat.ts                    (ALREADY DONE: 11 functions)
│   ├─ calculateBaseDamage
│   ├─ isCritical
│   ├─ getCriticalMultiplier
│   ├─ applyMultiplier
│   ├─ calculateDamage
│   ├─ calculateExperience
│   ├─ shouldLootDrop
│   ├─ getEquipmentGrade
│   ├─ getLootQuantity
│   ├─ isDead
│   └─ applyDamage
│
├── ✅ nature.ts                    (ALREADY DONE: 12 functions)
│   ├─ calculateMoistureSuitability
│   ├─ calculateTemperatureSuitability
│   ├─ calculateLightSuitability
│   ├─ calculateEnvironmentalSuitability
│   ├─ calculateEnvironmentalStress
│   ├─ calculateGrowthProbability
│   ├─ calculateDropProbability
│   ├─ calculateHarvestYield
│   ├─ calculateVegetationDensity
│   ├─ shouldReproduce
│   ├─ shouldPartGrow
│   └─ shouldPartDrop
│
├── 🔴 crafting.ts                  (NEW: 5-8 functions)
│   ├─ validateRecipe
│   ├─ checkIngredients
│   ├─ calculateCraftTime
│   └─ (3-5 more)
│
├── 🔴 weather.ts                   (NEW: 6-8 functions)
│   ├─ calculateWeatherTransition
│   ├─ applyWeatherEffects
│   ├─ getWeatherModifier
│   └─ (3-5 more)
│
├── 🔴 narrative/                   (NEW FOLDER)
│   ├─ selector.ts (3-4 functions)
│   └─ conditions.ts (3-4 functions)
│
├── 🔴 rng.ts                       (NEW: 3-5 functions)
│   ├─ seededRandom
│   ├─ weightedChoice
│   └─ gaussianRandom
│
└── 🔴 loot.ts                      (NEW: 4-6 functions)
    ├─ selectLootTable
    ├─ rollLoot
    └─ calculateRarity

TOTAL: 50+ pure functions
```

---

## 🔄 PHASE 3.B: USECASE REFACTORING PATTERN

```
BEFORE (❌ OLD PATTERN)
═════════════════════════════════════════════════════════════════

export function performAttack(state: GameState, action: Action): GameState {
  // ❌ MUTATION
  state.player.hp -= calculateDamage(...);
  
  // ❌ SIDE EFFECT INSIDE
  audioManager.play('hit.mp3');
  persistence.save(state);
  
  return state;  // ❌ Modified original input
}

PROBLEMS:
  • Hard to test (side effects mixed in)
  • Hard to debug (mutations everywhere)
  • Hard to scale (logic tangled with effects)
  • Hard to replay (not serializable)


AFTER (✅ NEW PATTERN)
═════════════════════════════════════════════════════════════════

import { calculateDamage } from '@/core/rules/combat';

export function performAttack(
  state: GameState,
  action: Action
): [GameState, GameEffect[]] {
  // ✅ PURE RULE (from core/rules/)
  const damage = calculateDamage(
    action.attacker.attack,
    action.defender.defense,
    action.isCrit
  );
  
  // ✅ IMMUTABLE STATE UPDATE (spread operators)
  const newState: GameState = {
    ...state,
    defender: {
      ...state.defender,
      hp: Math.max(0, state.defender.hp - damage)
    }
  };
  
  // ✅ EFFECTS AS DATA (plain JSON)
  const effects: GameEffect[] = [
    { type: 'PLAY_SOUND', sfx: 'hit.mp3' },
    { type: 'SAVE_GAME', data: newState },
    { type: 'EMIT_EVENT', event: 'combat_damage', damage }
  ];
  
  return [newState, effects];
}

BENEFITS:
  • Easy to test (pure function, pure effects)
  • Easy to debug (clear data flow)
  • Easy to scale (logic separated from effects)
  • Easy to replay (effects are serializable JSON)


TASKS: Refactor 12 usecases to this pattern
  • combat-usecase.ts ✓
  • farming-usecase.ts
  • crafting-usecase.ts
  • weather-usecase.ts
  • experience-usecase.ts
  • reward-generator.ts
  • exploration-usecase.ts
  • world-usecase.ts
  • skill-usecase.ts
  • plant-growth.usecase.ts
  • movement-narrative.ts
  • terrain-weather-discovery.usecase.ts
```

---

## 🎣 PHASE 4: HOOK INTEGRATION

```
BEFORE (OLD)
═════════════════════════════════════════════════════════════════

export function useGameState() {
  const [state, setState] = useState(initialState);
  
  const handleAttack = useCallback((targetId) => {
    const newState = performAttack(state, targetId);  // ❌ Returns mutated state
    setState(newState);
    
    // ❌ Side effects called manually
    audioManager.play('hit.mp3');
  }, [state]);
  
  return { state, handleAttack };
}


AFTER (NEW)
═════════════════════════════════════════════════════════════════

import { performAttack } from '@/core/usecases/combat-usecase';
import { executeSideEffect } from '@/lib/utils/effect-executor';

export function useGameState() {
  const [state, setState] = useState(initialState);
  
  const handleAttack = useCallback((targetId) => {
    // ✅ Call usecase (returns [newState, effects])
    const [newState, effects] = performAttack(state, targetId);
    
    // ✅ Apply state
    setState(newState);
    
    // ✅ Execute effects (hook's responsibility)
    effects.forEach(effect => executeSideEffect(effect));
  }, [state]);
  
  return { state, handleAttack };
}


KEY ADDITIONS:
  • Create src/lib/utils/effect-executor.ts
    Handles: PLAY_SOUND, SAVE_GAME, EMIT_EVENT, etc.
  
  • Update 15+ hooks to use this pattern
    use-game-state.ts
    use-action-handlers.ts
    use-game-engine.ts
    usePlayerStats.ts
    use-creature-engine.ts
    (and 10 more)
  
  • Verify end-to-end:
    Combat flow: attack → sound ✓ damage ✓ save ✓
    Farm flow: grow → harvest ✓ items ✓ sound ✓
    Craft flow: recipe → craft ✓ inventory ✓
```

---

## 🗑️ PHASE 5: LEGACY DELETION

```
DELETE (These are deprecated)
═════════════════════════════════════════════════════════════════

src/core/types/              (move to core/domain)
  ├─ index.ts
  ├─ creature.ts             ← Use core/domain/creature instead
  ├─ item.ts                 ← Use core/domain/item instead
  ├─ gamestate.ts            ← Use core/domain/gamestate instead
  ├─ definitions/
  │  ├─ creature.ts
  │  ├─ item.ts
  │  └─ (20+ more files)
  └─ (50+ lines deleted)

src/lib/definitions/         (move to core/domain)
  ├─ narrative/              ← Use core/data/narrative instead
  ├─ item.ts                 ← Use core/domain/item instead
  ├─ creature.ts             ← Use core/domain/creature instead
  └─ (30+ files deleted)

src/lib/game/                (move to core/data)
  ├─ items/                  ← Use core/data/items instead
  ├─ creatures/              ← Use core/data/creatures instead
  ├─ data.ts                 ← Consolidated elsewhere
  └─ (25+ files deleted)

src/core/engines/            (move to core/rules)
  ├─ weather-engine.ts       ← Use core/rules/weather instead
  ├─ combat-engine.ts        ← Use core/rules/combat instead
  ├─ farming-engine.ts       ← Use core/rules/nature instead
  └─ (20+ files deleted)


SAFETY CHECKS BEFORE DELETION:
  ✓ grep "from '@/core/types'" src/ → ZERO results
  ✓ grep "from '@/lib/definitions'" src/ → ZERO results
  ✓ grep "from '@/lib/game'" src/ → ZERO results
  ✓ grep "from '@/core/engines'" src/ → ZERO results
  ✓ npm run typecheck → ZERO errors
  ✓ npm run test → ALL PASSING


TOTAL IMPACT:
  • 100+ files deleted
  • 10000+ lines removed
  • 4 top-level folders removed
  • Zero broken imports remaining
```

---

## 📊 TEST PROGRESSION

```
CURRENT (Dec 14)           AFTER PHASE 3 (Dec 19)     AFTER PHASE 5 (Dec 23)
════════════════════════   ════════════════════════   ════════════════════════

Tests:     304 passing     Tests:     360+ passing    Tests:     304+ passing
           1 skipped       (56+ new tests for rules)  (no regressions)
           0 failing                  0 failing
                                                      Errors:    0
Errors:    0               Errors:    0               Warnings:  0
Coverage:  ~80%            Coverage:  ~85%            Coverage:  ~85%

Run: npm run test           Run: npm run test          Run: npm run test
Duration: ~15-20s          Duration: ~20-25s          Duration: ~15-20s


PHASE 3 NEW TESTS:
  ├─ src/core/rules/__tests__/crafting.test.ts     (20+ tests)
  ├─ src/core/rules/__tests__/weather.test.ts      (20+ tests)
  ├─ src/core/rules/__tests__/narrative.test.ts    (15+ tests)
  ├─ src/core/rules/__tests__/rng.test.ts          (10+ tests)
  └─ src/core/rules/__tests__/loot.test.ts         (15+ tests)
     → 80+ new tests for 27 rule functions
```

---

## ✅ SUCCESS GATES AT A GLANCE

```
PHASE 3 EXIT GATE                PHASE 4 EXIT GATE
═════════════════════════════    ═════════════════════════════
☐ 50+ rules extracted           ☐ 15 hooks refactored
☐ 100% TSDoc coverage           ☐ Effect executor created
☐ 360+ tests passing            ☐ All effects execute
☐ Zero errors                   ☐ Game playable end-to-end
☐ No mutations (grep)           ☐ Combat scenario works ✓
☐ 12 usecases refactored        ☐ Farm scenario works ✓
☐ All return [state, effects]   ☐ Craft scenario works ✓
                                ☐ Zero errors
                                ☐ 304+ tests passing


PHASE 5 EXIT GATE
═════════════════════════════
☐ Zero deprecated imports
☐ 100+ files deleted
☐ 4 folders removed
☐ Zero errors
☐ 304+ tests passing
☐ Documentation updated
☐ Ready for next features
```

---

## 🚀 CRITICAL PATH

```
START HERE:
1. Read docs/ARCHITECTURE_CLEAN_SLATE.md (decisions locked)
2. Read docs/PATTERNS.md (code patterns)
3. Read PHASE3_4_5_ROADMAP.md (full strategy)
4. Keep PHASE3_4_5_CHECKLIST.md open (daily reference)

THEN EXECUTE:
PHASE 3.A        PHASE 3.B        PHASE 4         PHASE 5
(Dec 15-16)      (Dec 17-19)      (Dec 22-24)     (Dec 25-26)

Create rules  → Refactor usecases → Update hooks → Delete old code
                                                   ↓
                                          🎉 COMPLETE 🎉
                                      Ready for next features
```

---

## 📋 DOCUMENTS INVENTORY

```
Created Documents:
  ├─ PHASE3_4_5_ROADMAP.md              (500+ lines - full strategy)
  ├─ PHASE3_4_5_CHECKLIST.md            (200+ lines - daily tracking)
  ├─ PHASE3_4_5_ROADMAP.json            (1000+ lines - machine-readable)
  ├─ PROJECT_STATUS_REPORT.md           (300+ lines - executive summary)
  ├─ ROADMAP_DOCUMENT_INDEX.md          (100+ lines - navigation)
  └─ ROADMAP_EXECUTIVE_SUMMARY.md       (200+ lines - quick overview)

Reference Documents (Already Exist):
  ├─ docs/ARCHITECTURE_CLEAN_SLATE.md   (decisions locked)
  ├─ docs/PATTERNS.md                   (code patterns)
  ├─ docs/CODING_STANDARDS.md           (TSDoc standards)
  ├─ .github/copilot-instructions.md    (directives)
  └─ OPERATION_CLEAN_SLATE_PROGRESS.md  (Phase 0-2 log)

TOTAL: 11 documents, 3000+ lines of roadmap documentation
```

---

## 🎓 THE 8 CRITICAL RULES

```
1. DOCS = LAW             Never code against docs.
   If conflict → UPDATE DOCS FIRST

2. MUTATIONS = DEATH      No state.x = y in rules.
   ZERO exceptions. Grep before committing.

3. EFFECTS = PATTERN      All side effects as JSON tags.
   { type: '...', ... }

4. TESTS FIRST            Write test before code.
   100% coverage required.

5. TSDOC ALWAYS           Every export = Glass Box @remarks
   Formula/Logic/EdgeCases documented.

6. VERIFY DAILY           npm run typecheck && npm run test
   After EVERY task.

7. COMMIT OFTEN           Small commits, clear messages.
   Daily minimum.

8. 3-STRIKE RULE          Fails 3x? STOP + RE-PLAN.
   No stubborn pushing.
```

---

## 🏁 DESTINATION

```
Current:    Phases 0-2 ✅ COMPLETE
               ↓
               Modernized Architecture
               Solid Foundation
               All Tests Passing
               Zero Technical Debt (for this refactor)
               Ready for PHASE 3
               
Next:       Phases 3-5 🔴 IN PROGRESS
               ↓
               50+ Pure Rules
               12 Refactored Usecases
               15 Integrated Hooks
               100+ Legacy Files Deleted
               Zero Deprecated Imports
               
Goal:       🎉 PRODUCTION READY
               Ready for next features
               Clean, scalable codebase
               Pure architecture locked in
               Ready to build games!
```

---

**Start Date**: December 14, 2025  
**Timeline**: 10 business days  
**Destination**: December 23-24, 2025  
**Status**: READY 🚀

🎯 **Open `PHASE3_4_5_CHECKLIST.md` and start TASK 3.A.1 tomorrow!**
