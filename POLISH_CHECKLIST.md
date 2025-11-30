# 🎯 Polish Implementation Checklist (Quick Reference)

**Objective:** Polish Dreamland Engine from 75/100 → 95/100 before prototype launch.  
**Estimated Time:** 6–8 hours  
**Status:** Ready to execute

---

## **PHASE 1: CRITICAL BLOCKER (30–45 min)**

- [ ] **1.1 Resolve TypeScript Imports**
  - [ ] `Remove-Item -Path ".next" -Recurse -Force`
  - [ ] `npm run dev` (restart dev server)
  - [ ] `npm run typecheck` (verify 0 errors)
  - [ ] Expected: All imports resolve, no module errors

---

## **PHASE 2: ANIMATION & UX POLISH (2–3 hours)**

### **2.1: Fix Animation Timing (visualTotalMs)**
- [ ] Find `avatar-move-animation.tsx` or equivalent
- [ ] Locate `visualTotalMs = 420` assignment
- [ ] Update to `visualTotalMs = 600`
- [ ] Test: `npm run dev`, move player, watch animation (should feel smooth, not rushed)
- [ ] Expected: 600ms total animation time, professional feel

### **2.2: Fix Main-Thread Blocking (238ms → <50ms)**
- [ ] Find sound effect calls in avatar animation
- [ ] Wrap in `requestIdleCallback()` to defer execution
- [ ] Batch multiple `setState` into single call
- [ ] Test with DevTools Performance: move player, check Long Task duration
- [ ] Expected: <50ms blocking instead of 238ms

### **2.3: Fix Minimap Viewport CSS (Dynamic Classes)**
- [ ] Find `minimap.tsx` container with Tailwind dynamic class
- [ ] Replace `w-[calc(20rem/${viewportSize})]` with inline style
- [ ] Use: `style={{ width: '320px', height: '320px' }}`
- [ ] Test: Toggle minimap viewport size in settings (5×5 ↔ 7×7 ↔ 9×9)
- [ ] Expected: Smooth resize, no jumping or distortion

### **2.4: Fix Minimap Pan Offset Desync (20ms → 0ms)**
- [ ] Find pan animation start logic in `minimap.tsx`
- [ ] Ensure pan calculation happens in same effect as `isAnimatingMove` flag
- [ ] Use `requestAnimationFrame()` to sync with avatar animation start
- [ ] Test: Move player, watch minimap pan start exactly when avatar moves
- [ ] Expected: 0ms offset, perfectly synchronized with avatar flight

---

## **PHASE 3: CODE QUALITY & TYPE SAFETY (1.5–2 hours)**

### **3.1: Resolve TODO - World Type**
- [ ] Open `src/core/types/game.ts` (line ~106)
- [ ] Replace `any` in World interface with strict fields:
  - [ ] `chunks: Record<string, Chunk>`
  - [ ] `creatures: Record<string, CreatureInstance>`
  - [ ] `structures: Record<string, StructureInstance>`
  - [ ] `weather: WeatherState`
  - [ ] `vegetation: VegetationMap`
  - [ ] `gameTime: number`
  - [ ] `seed: number`
  - [ ] `version: 1`
- [ ] Update `world-usecase.ts` to use strict types
- [ ] Test: `npm run typecheck` (0 errors)
- [ ] Expected: Type-safe World, all properties required

### **3.2: Resolve TODO - Weather Transitions**
- [ ] Open `src/core/entities/weather.ts` (line ~156)
- [ ] Implement `calculateWeatherTransition()` function:
  - [ ] Calculate biome-specific transition probabilities
  - [ ] Select next weather condition based on current state
  - [ ] Apply seasonal modifiers
- [ ] Replace TODO with actual transition logic
- [ ] Test: `npm run test` (weather tests pass)
- [ ] Expected: Weather changes every ~20 ticks probabilistically

### **3.3: Resolve TODO - Combat Loot Typing**
- [ ] Open `src/core/entities/combat.ts` (line ~248)
- [ ] Change loot return type from `any[]` to `Item[]`
- [ ] Add type guards at usage points
- [ ] Test: `npm run typecheck && npm run test`
- [ ] Expected: Loot properly typed, no runtime errors

---

## **PHASE 4: TEST SUITE EXPANSION (2–3 hours)**

### **4.1: Create Game Loop Smoke Test**
- [ ] Create file: `src/__tests__/game-loop.smoke.test.ts`
- [ ] Test cases:
  - [ ] `full game cycle: spawn → move → turn → save → reload`
  - [ ] `multiple moves accumulate correctly`
  - [ ] `world chunk generation on move`
- [ ] Run: `npm run test` (all pass)

### **4.2: Create Combat Smoke Test**
- [ ] Create file: `src/__tests__/combat.smoke.test.ts`
- [ ] Test cases:
  - [ ] `combat sequence: initiate → hit → damage → loot`
  - [ ] `miss probability works`
- [ ] Run: `npm run test` (all pass)

### **4.3: Create Crafting Smoke Test**
- [ ] Create file: `src/__tests__/crafting.smoke.test.ts`
- [ ] Test cases:
  - [ ] `successful craft: ingredients → craft → output`
  - [ ] `craft failure (insufficient ingredients)`
- [ ] Run: `npm run test` (all pass)

### **4.4: Create Inventory Smoke Test**
- [ ] Create file: `src/__tests__/inventory.smoke.test.ts`
- [ ] Test cases:
  - [ ] `pickup → use → drop cycle`
  - [ ] `stat bonus applied on equip`
- [ ] Run: `npm run test` (all pass)

---

## **PHASE 5: DOCUMENTATION & VALIDATION (1 hour)**

### **5.1: Generate TypeDoc API Documentation**
- [ ] Run: `npm run docs:api`
- [ ] Verify: `docs/api/` folder created
- [ ] Verify: All public functions have tSDoc OVERVIEW headers
- [ ] Verify: Complex types have JSDoc examples
- [ ] Expected: HTML docs generated, no missing documentation warnings

### **5.2: Validate Narrative Bundles**
- [ ] Run: `npm run validate:narrative`
- [ ] Fix any errors (missing translation keys, placeholders)
- [ ] Verify: All user-visible text has EN/VI translations
- [ ] Expected: 0 errors, 500+ keys validated

---

## **PHASE 6: FINAL VALIDATION & COMMIT (30 min)**

### **6.1: Run Complete CI Gate**
- [ ] `npm run typecheck`
  - [ ] Expected: `Found 0 errors in Xms`
- [ ] `npm run test`
  - [ ] Expected: All tests pass (14+ total)
- [ ] `npm run dev`
  - [ ] Expected: Server starts on http://localhost:9003
  - [ ] Test in browser:
    - [ ] Create new game
    - [ ] Move player (animation smooth, 600ms, no jitter)
    - [ ] Toggle minimap viewport (resize smooth, no jumping)
    - [ ] Combat works (no errors)
    - [ ] Crafting works (no errors)
    - [ ] Inventory works (no errors)
    - [ ] Save/reload works (refresh page, data persists)
- [ ] `npm run validate:narrative`
  - [ ] Expected: 0 errors

### **6.2: Git Commit & Push**
- [ ] Review changes: `git diff HEAD~1 --stat`
- [ ] Stage all: `git add -A`
- [ ] Commit: `git commit -m "polish: comprehensive engine finalization..."`
  - [ ] Include: Summary, key fixes, performance metrics, CI gates
- [ ] Push: `git push origin chore/terrain-finalize`
- [ ] Verify: Branch pushed to origin

---

## **SUCCESS CRITERIA (All Must Be True)**

- [ ] ✅ `npm run typecheck` → 0 errors
- [ ] ✅ `npm run test` → All tests pass (14+ tests)
- [ ] ✅ `npm run dev` → Starts clean, no console errors
- [ ] ✅ `npm run validate:narrative` → 0 errors
- [ ] ✅ `npm run docs:api` → docs/ generated
- [ ] ✅ Game loop works: spawn → move → turn → save → reload
- [ ] ✅ Animation smooth (600ms, no rushing, no jitter)
- [ ] ✅ Minimap panning synchronized (0ms offset)
- [ ] ✅ Minimap viewport switching works (5×5 ↔ 7×7 ↔ 9×9)
- [ ] ✅ No main-thread blocking (<50ms)
- [ ] ✅ Combat/crafting/inventory all work
- [ ] ✅ All public functions documented (tSDoc OVERVIEW)
- [ ] ✅ All TODO comments removed
- [ ] ✅ All `any` types resolved to strict types
- [ ] ✅ Git commit created & pushed

---

## **QUALITY METRICS: Before → After**

| Metric | Before | After | Status |
|--------|--------|-------|--------|
| Type Errors | 8 | 0 | ✅ |
| Main Thread Blocking | 238ms | <50ms | ✅ |
| Animation Duration | 420ms (rushed) | 600ms (smooth) | ✅ |
| Pan Offset | 20ms (lag) | 0ms (sync) | ✅ |
| Test Count | 1 | 5+ | ✅ |
| TODO Comments | 4 | 0 | ✅ |
| Type Safety | 60% | 95% | ✅ |
| Production Score | 75/100 | 95/100 | ✅ |

---

## **TROUBLESHOOTING**

| Issue | Solution |
|-------|----------|
| Import errors persist | `Remove-Item .next -Recurse -Force; npm run dev` |
| Animation still rushed | Search for hardcoded `420`, update to `600` |
| Minimap not resizing | Verify inline styles, remove Tailwind classes |
| Tests fail | Check mock imports, ensure files exist |
| typecheck fails | `npm install` to refresh node_modules |
| Dev server won't start | Kill process on port 9003, restart |

---

## **TIMING BREAKDOWN**

- Phase 1 (Blocker): 30–45 min
- Phase 2 (Animation/UX): 2–3 hours
- Phase 3 (Type Safety): 1.5–2 hours
- Phase 4 (Tests): 2–3 hours
- Phase 5 (Docs): 1 hour
- Phase 6 (Validation): 30 min

**Total: 6–8 hours for full polish**

---

**Status: Ready to Execute**

Once you're ready to start, begin with **Phase 1** and work through each phase methodically.  
Test and commit after each phase (not just at the end) to catch issues early.

See `POLISH_IMPLEMENTATION.md` for detailed steps, logic deep dives, and data traces.
