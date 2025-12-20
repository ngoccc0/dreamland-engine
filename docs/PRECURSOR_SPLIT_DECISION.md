# Precursor: Use-Action-Handlers Split Strategy

**Status:** Phase - Strategic Decision  
**Date:** December 20, 2025

## Problem Statement

**File:** `src/hooks/use-action-handlers.ts` (900 lines)  
**Issue:** God Object - handles combat, crafting, harvest, movement, skills, interactions, quests  
**Risk:** Too large to safely wire dedup guard without high regression risk

---

## Strategic Options Considered

### Option A: Full Split (7 Files)
```
use-action-handlers/
├─ index.ts (aggregator)
├─ use-combat-actions.ts
├─ use-crafting-actions.ts  
├─ use-harvest-actions.ts
├─ use-movement-actions.ts
├─ use-skill-actions.ts
└─ use-interaction-actions.ts
```
**Pros:** Maximal separation of concerns  
**Cons:** Large refactoring (~4-6 hours), high regression risk for one Precursor task

### Option B: Pragmatic Split (Focused + Rest)
```
use-action-handlers.ts (remaining 700 lines)
├─ Keeps: crafting, harvest, movement, skill, interaction, etc
└─ Exports aggregator hook
  
use-combat-actions.ts (NEW - 200 lines)
├─ handleAttack()
└─ Combat-specific logic isolated
```
**Pros:** Surgical, low risk, combats are dedup's highest concern  
**Cons:** Partial solution, but still enables safe dedup wiring

### Option C: Defer Split, Proceed Carefully
```
Leave file as-is, wire dedup guard carefully
- Pro: No refactoring, move forward quickly
- Con: High regression risk, violates surgical principle
```

---

## Decision: Option B (Pragmatic Split)

**Rationale:**

1. **Risk Management:** Combat is the highest-risk domain for duplicates
   - Creature kills can fire twice
   - Equipment drops can duplicate
   - Dedup guard is most critical here

2. **Minimal Disruption:** Extract only combat (~200 lines)
   - Move handleAttack() to use-combat-actions.ts
   - Keep aggregator pattern: imports and calls it
   - No other handlers affected

3. **Surgical Philosophy:** "Fix the hot spot first"
   - User identified combat + crafting as high-risk
   - Combat extracted first (dedup most critical)
   - Crafting can be extracted in Phase 3.5 if needed

4. **Timeline:** Extract combat in 30 minutes
   - vs 4-6 hours for full split
   - Unblocks Phase 2 & 3 faster
   - Full split can happen in Phase 4.5

---

## Implementation Plan

### Step 1: Create `src/hooks/use-combat-actions.ts`
- Extract handleAttack() and its dependencies
- Export factory function createHandleCombatActions()
- Include all combat-specific imports

### Step 2: Update `src/hooks/use-action-handlers.ts`
- Remove handleAttack() body
- Import and call createHandleCombatActions()
- Reduce file from 900 → 750 lines
- All other handlers unchanged

### Step 3: Wire Dedup Guard (Phase 3)
- Inject into use-combat-actions.ts
- Guard creation in aggregator hook
- Pass to combat handler via context

### Step 4: Document in GUIDES
- Add note about split pattern
- Explain why combat was extracted first
- Plan for full split in future phase

---

## Risk Assessment

**Green:**  
✅ Combat changes isolated  
✅ No impact on other handlers  
✅ Easy to rollback if needed  
✅ Clear separation of concerns  

**Yellow:**  
⚠️ Aggregator still manages imports (cleanup opportunity later)  
⚠️ Partial solution (other handlers still large)  

**Red:**  
❌ None expected

---

## Next: Phase 2 - Archival Consolidation

After combat split, proceed with merging ActionArchivalEngine into ActionTrackerEngine (consolidation, non-blocking).

