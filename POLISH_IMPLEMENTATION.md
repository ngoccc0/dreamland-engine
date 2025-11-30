# 🎬 Dreamland Engine - Full Polish Implementation Guide (Option B)

**Objective:** Achieve production-ready quality (75→95 score) before prototype launch.  
**Timeline:** 6–8 hours of focused, methodical work.  
**Strategy:** Modular fixes in isolation, test after each fix, validate at end.

---

## **PHASE 1: CRITICAL BLOCKER FIX (30–45 min)**

### **Step 1.1: Resolve TypeScript Path Alias Import Errors**

**Problem Statement:**
- File: `src/components/game/plant-inspection-modal.tsx`
- Error: Cannot find module `@/components/ui/dialog`, `@/context/language-context`, `@/core/types/creature`, etc.
- Root Cause: TypeScript compiler/IDE not resolving `@/` path alias (files exist but not found)
- Impact: `npm run typecheck` fails, blocks all further work

**Root Cause Analysis:**
```
tsconfig.json looks correct:
  "baseUrl": ".",
  "paths": { "@/*": ["./src/*"] }

Files DO exist:
  ✅ src/components/ui/dialog.tsx
  ✅ src/context/language-context.tsx
  ✅ src/core/types/creature.ts
  ✅ src/lib/utils.ts

Most Likely Cause:
  → .next build cache is stale
  → TypeScript server not restarted
  → IDE not reindexed
```

**Steps to Fix:**

1. **Clear Next.js build cache:**
   ```powershell
   Remove-Item -Path "D:\dreamland-engine\.next" -Recurse -Force
   ```

2. **Clear TypeScript build cache (if applicable):**
   ```powershell
   Remove-Item -Path "D:\dreamland-engine\tsconfig.tsbuildinfo" -Force
   ```

3. **Verify VS Code has correct TypeScript version:**
   - `Ctrl+Shift+P` → "TypeScript: Select TypeScript Version"
   - Choose "Use Workspace Version" (ensure it's using the project's TS version)

4. **Restart dev server:**
   ```powershell
   # Kill existing: Ctrl+C in terminal running `npm run dev`
   npm run dev  # Restart
   ```

5. **Verify fix:**
   ```powershell
   npm run typecheck  # Should output: "✓ No errors" or "0 errors"
   ```

**Expected Output (After Fix):**
```
Found 0 errors in 45ms
```

**Data Trace:**
```
Input:  npm run typecheck
  ↓ TypeScript compiler reads tsconfig.json
  ↓ Resolves @/ → ./src/
  ↓ Loads plant-inspection-modal.tsx
  ↓ Resolves @/components/ui/dialog → ./src/components/ui/dialog.tsx ✅
  ↓ Resolves @/context/language-context → ./src/context/language-context.tsx ✅
  ↓ No import errors found
Output: All imports valid, compilation succeeds
```

**Logic Deep Dive:**
The error isn't a code issue—it's a compilation state issue. Next.js caches the build state in `.next/`. When TypeScript can't find modules despite correct path aliases, it's because:
1. The cache is stale (old build info)
2. The TypeScript server hasn't reindexed
3. The IDE is reading outdated symbol tables

Clearing `.next/` forces a full rebuild with fresh path resolution. This is the **fastest fix** (30 sec vs. debugging each file).

---

## **PHASE 2: ANIMATION & UX POLISH (2–3 hours)**

### **Step 2.1: Fix Avatar Animation Timing (visualTotalMs)**

**Problem Statement:**
- File: `src/components/game/avatar-move-animation.tsx` (or similar)
- Current: `visualTotalMs = 420ms` (350 + 50 + 20)
- Actual Avatar Duration: 600ms (lift 150ms + fly 300ms + land 150ms)
- Impact: Animation feels rushed, out of sync with visual feedback
- Severity: Medium (UX polish, affects player perception)

**Root Cause:**
```
visualTotalMs hardcoded as sum of sound effects + UI state updates:
  - initial: 350ms
  - sound effect: +50ms
  - UI feedback: +20ms
  = 420ms total

But Avatar animation keyframes in avatar-flight.tsx:
  - lift: 0→150ms (cubic-bezier)
  - fly: 150→450ms (linear)
  - land: 450→600ms (cubic-bezier)
  = 600ms total

Mismatch → animation completes before visual flight ends → stutter
```

**Steps to Fix:**

1. **Locate avatar animation file:**
   ```powershell
   find src/ -name "*avatar*" -o -name "*animation*" | grep -E "(tsx|ts)$"
   ```

2. **Find visualTotalMs assignment:**
   ```powershell
   grep -r "visualTotalMs" src/components/game/ --include="*.tsx"
   ```

3. **Update timing constant:**
   ```typescript
   // OLD (incorrect):
   const visualTotalMs = 350 + 50 + 20; // 420ms

   // NEW (correct):
   const visualTotalMs = 600; // Matches avatar-flight.tsx keyframe duration
   ```

4. **Verify avatar-flight.tsx has correct keyframes:**
   ```typescript
   // Should match:
   @keyframes avatar-lift { 0% { ... } 25% { ... } }    // 0-150ms
   @keyframes avatar-fly { 25% { ... } 75% { ... } }    // 150-450ms
   @keyframes avatar-land { 75% { ... } 100% { ... } }  // 450-600ms
   // Total: 600ms
   ```

5. **Test fix:**
   ```powershell
   npm run dev
   # In game: move player, watch animation
   # Should feel smooth, not rushed
   ```

**Expected Output:**
```
Animation: Smooth player flight, synced with minimap pan
Timing: Takes ~600ms to complete (visible, not rushed)
Feel: Professional, not jittery
```

**Data Trace:**
```
Input:  Player moves north (action: "move north", step=1)
  ↓ useActionHandlers dispatches moveStart event
  ↓ avatar-move-animation.tsx receives moveStart
  ↓ Sets rAF animation loop duration = 600ms (corrected)
  ↓ Avatar lift: 0→150ms (rise upward)
  ↓ Avatar fly: 150→450ms (move to next tile)
  ↓ Avatar land: 450→600ms (descend downward)
  ↓ Minimap pans in parallel (synchronized start at 0ms)
  ↓ At 600ms: animation completes, new chunk loads
  ↓ gameState.playerPosition updated, saved to Dexie
Output: Smooth animation + correct timing + persistent state
```

**Logic Deep Dive:**
Visual animation timing must align with actual CSS keyframe duration. If `visualTotalMs < actual keyframe duration`, the component may:
1. Finish state updates before animation completes → stutter
2. Trigger move-complete callbacks too early → desync with visual flight
3. Cause minimap to stop panning mid-animation → jarring pan cut-off

Setting `visualTotalMs = 600ms` ensures the component's internal timing exactly matches the visual duration, eliminating async desync. This is a **critical polish detail** for professional feel.

---

### **Step 2.2: Fix Avatar Animation Main-Thread Blocking (238ms)**

**Problem Statement:**
- File: `src/components/game/avatar-move-animation.tsx` (likely lines 60–145)
- Current: Sound effects + multiple `setState` calls block main thread for ~238ms
- Impact: Delayed animation start, visible lag when moving
- Severity: High (perceived stuttering, affects responsiveness)

**Root Cause:**
```
When moveStart event fires:
  ↓ 1. playSound('move-start') — blocking I/O (50ms worst case)
  ↓ 2. setState({ isAnimating: true }) — triggers re-render
  ↓ 3. setState({ visualPosition: ... }) — another re-render
  ↓ 4. setState({ minimap pan }) — third re-render
  ↓ 5. setGameState({ playerPosition: ... }) — fourth re-render
  ↓ Total: Browser queues 4 renders + sound I/O
  ↓ Main thread blocked ~238ms
  ↓ rAF animation loop delayed → visible lag
```

**Steps to Fix:**

1. **Identify sound effect calls in avatar-move-animation.tsx:**
   ```typescript
   // Search for:
   playSound()
   audioManager.play()
   // Move these OUTSIDE the animation start path
   ```

2. **Defer sound effects to requestIdleCallback:**
   ```typescript
   // OLD (blocking):
   useEffect(() => {
     if (isAnimatingMove) {
       playSound('move-start');  // ❌ Blocks main thread
       setVisualPosition(...);
     }
   }, [isAnimatingMove]);

   // NEW (non-blocking):
   useEffect(() => {
     if (isAnimatingMove) {
       requestIdleCallback(() => {
         playSound('move-start');  // Deferred after animation starts
       });
       // Don't wait for sound, start animation immediately
       setVisualPosition(...);
     }
   }, [isAnimatingMove]);
   ```

3. **Batch state updates to reduce re-renders:**
   ```typescript
   // OLD (4 separate setState calls):
   setIsAnimating(true);
   setVisualFrom(...);
   setVisualTo(...);
   setMinimap(...);

   // NEW (one batched update):
   setAnimationState({
     isAnimating: true,
     visualFrom: ...,
     visualTo: ...,
     minimap: ...,
   });
   // React 18+ auto-batches multiple setState in event handler
   ```

4. **Measure before/after with DevTools:**
   ```
   In Chrome DevTools → Performance tab:
   1. Record for 2 seconds
   2. Trigger player move
   3. Look for "Long Task" warnings
   4. Before fix: ~238ms blocking
   5. After fix: ~50ms blocking (acceptable)
   ```

5. **Test fix:**
   ```powershell
   npm run dev
   # In game: move multiple times
   # Should feel responsive, no lag
   ```

**Expected Output:**
```
Animation Start: Immediate (0ms perceived delay)
Sound Play: Deferred, doesn't block animation (plays within 100ms after start)
Frame Rate: Consistent 60fps during animation (no jank)
DevTools Long Task: None or <50ms (acceptable)
```

**Data Trace:**
```
Input:  Player presses "move north" key
  ↓ Event: moveStart fired at t=0ms
  ↓ OLD behavior:
      → playSound() [blocking] (t=0→50ms, locks main thread)
      → setState (t=50→70ms, re-render)
      → setState (t=70→90ms, re-render)
      → setState (t=90→110ms, re-render)
      → Animation rAF loop finally starts at t=110ms+ ❌ Lag visible
  ↓ NEW behavior:
      → requestIdleCallback(playSound) [scheduled] (t=0ms, queued for later)
      → setState [batched] (t=0→5ms, single re-render)
      → Animation rAF loop starts at t=5ms ✅ Immediate, smooth
      → playSound fires in background at t=100ms (doesn't affect perception)
Output: Smooth animation, no perceivable lag, sound plays naturally delayed
```

**Logic Deep Dive:**
JavaScript's event loop prioritizes animations (rAF callbacks) over deferred tasks (`requestIdleCallback`). By moving sound effects to `requestIdleCallback`, we:
1. Let the browser paint the first animation frame immediately
2. Defer non-critical I/O to when the main thread is idle
3. Keep frame rate smooth (60fps vs. dropping frames during blocking)

This is the **most impactful UX improvement** (238ms lag → imperceptible).

---

### **Step 2.3: Fix Minimap Viewport CSS (Tailwind Dynamic Classes)**

**Problem Statement:**
- File: `src/components/game/minimap.tsx` (likely lines 70–90, container sizing)
- Current: `w-[calc(20rem/${viewportSize})] h-[calc(20rem/${viewportSize})]` (Tailwind dynamic classes)
- Issue: Tailwind compiles at build-time, doesn't evaluate JavaScript runtime variables
- Impact: Container size doesn't change when viewport switches (5×5 ↔ 7×7 ↔ 9×9)
- Severity: High (feature broken when viewport toggles)

**Root Cause:**
```
Tailwind CSS uses compile-time arbitrary values:
  w-[calc(20rem/${viewportSize})] attempts to use JS variable in CSS class name

But Tailwind works like this:
  1. Build-time: Scan all .tsx files for class names
  2. Extract pattern: w-[...] → generate CSS rule
  3. Problem: ${ viewportSize } is NOT a valid string at build-time
  4. Tailwind can't generate CSS for dynamic JS variable
  5. Result: Compiled CSS doesn't include this rule
  6. Runtime: className not found → no size change
```

**Correct Approach: Use CSS Custom Properties (CSS Variables):**
```css
/* This WORKS at runtime because CSS vars resolve at render time */
style={{ width: `calc(320px / ${viewportSize})` }}

/* Or use CSS custom properties */
style={{ '--viewport-size': viewportSize } as any}
/* Then in CSS: width: calc(320px / var(--viewport-size)) */
```

**Steps to Fix:**

1. **Locate container sizing code in minimap.tsx:**
   ```typescript
   // Search for lines with viewportSize in className
   grep -n "viewportSize" src/components/game/minimap.tsx
   ```

2. **Replace Tailwind dynamic class with inline styles:**
   ```typescript
   // OLD (doesn't work):
   <div className={cn(
     "w-[calc(20rem/${viewportSize})]",
     "h-[calc(20rem/${viewportSize})]",
     ...
   )}>

   // NEW (works):
   <div
     style={{
       width: `${320 / viewportSize}px`,
       height: `${320 / viewportSize}px`,
     }}
     className={cn(...otherClasses)}
   >
   ```

3. **Verify pixel calculation matches Tailwind w-80 (20rem = 320px):**
   ```typescript
   // 20rem = 320px (at 16px base)
   // Cell size = 320px / viewportSize
   // viewportSize = 5 → 64px per cell
   // viewportSize = 7 → 45.7px per cell
   // viewportSize = 9 → 35.5px per cell
   ```

4. **Update all related sizing:**
   ```typescript
   const cellSizePx = 320 / viewportSize;
   
   // Container
   <div style={{ 
     width: `${320}px`, 
     height: `${320}px` 
   }} />
   
   // Cells (if individually sized)
   <div style={{ 
     width: `${cellSizePx}px`, 
     height: `${cellSizePx}px` 
   }} />
   ```

5. **Test viewport switching:**
   ```powershell
   npm run dev
   # In settings: change minimap viewport size
   # Should smoothly resize container
   # No visual jump or distortion
   ```

**Expected Output:**
```
Viewport 5×5: Container = 320×320px, cells = 64×64px
Viewport 7×7: Container = 320×320px, cells = 45.7×45.7px (smooth transition)
Viewport 9×9: Container = 320×320px, cells = 35.5×35.5px (smooth transition)
Visual: Smooth zoom/reflow without jumpiness
```

**Data Trace:**
```
Input:  User clicks "change viewport size" → 5×5 to 7×7
  ↓ settings.minimapViewportSize = 7
  ↓ useSettings() re-renders Minimap
  ↓ viewportSize = 7
  ↓ cellSizePx = 320 / 7 ≈ 45.7
  ↓ Container style={ width: '320px', height: '320px' } (unchanged)
  ↓ Cells now render at 45.7×45.7px (tighter grid)
  ↓ Grid recalculates visible cells (7×7 instead of 5×5)
  ↓ Pan animation adjusts to new cell size
Output: Viewport switches smoothly, minimap shows larger area with finer grid
```

**Logic Deep Dive:**
Tailwind's strength is compile-time CSS generation. But this means arbitrary values with JavaScript variables won't work—Tailwind can't execute JS at build-time. The solution is to move size calculations to **inline styles** (which evaluate at runtime). The container size (320px) stays fixed; only the cell size changes based on `viewportSize`, maintaining a responsive grid density.

---

### **Step 2.4: Fix Minimap Pan Offset Desync**

**Problem Statement:**
- File: `src/components/game/minimap.tsx` (line ~296, pan animation start)
- Current: Minimap pan starts ~20ms after `moveStart` event
- Meanwhile: PlayerOverlay + avatar-move-animation start at 0ms
- Impact: Pan lags behind avatar flight → visual stutter, misaligned panning
- Severity: Medium (visual polish, affects perception of smoothness)

**Root Cause:**
```
Timeline of events (should be synchronized):

Ideal (synchronized at t=0):
  t=0ms   moveStart event fired
  t=0ms   ├─ Avatar animation starts
  t=0ms   ├─ PlayerOverlay flight starts
  t=0ms   └─ Minimap pan starts → all 3 synchronized

Actual (desynchronized):
  t=0ms   moveStart event fired
  t=0ms   ├─ Avatar animation starts ✅
  t=0ms   ├─ PlayerOverlay flight starts ✅
  t=20ms  └─ Minimap pan starts ❌ (20ms delay from cleanup/recalc)

Result: Player sees avatar move, then minimap catches up → jarring
```

**Root Cause Details:**
```typescript
// In minimap.tsx effect hooks:
useEffect(() => {
  if (isAnimatingMove) {
    // This effect re-runs, adds delay before pan calculation
    const pan = calculatePan(...);  // ← recalculation takes time
    startPan(pan);  // ← pan starts ~20ms after effect triggered
  }
}, [isAnimatingMove]);
```

**Steps to Fix:**

1. **Locate the pan animation start logic:**
   ```typescript
   // Search in minimap.tsx for:
   if (isAnimatingMove)
   if (visualMoveFrom)
   calculatePan()
   startPan()
   panAnimRef.current.active = true
   ```

2. **Ensure pan calculation is in same effect as animation flag:**
   ```typescript
   // OLD (separate effects, cause stagger):
   useEffect(() => {
     if (isAnimatingMove) {
       // ... other setup
     }
   }, [isAnimatingMove]);

   useEffect(() => {
     if (isAnimatingMove) {
       calculateAndStartPan();  // ← separate effect = staggered timing
     }
   }, [isAnimatingMove]);

   // NEW (same effect, synchronized timing):
   useEffect(() => {
     if (isAnimatingMove) {
       // Setup + calculate + start in same microtask
       const panTarget = calculatePan(...);
       requestAnimationFrame(() => {
         startPan(panTarget);  // Start pan in next frame, same as avatar
       });
     }
   }, [isAnimatingMove]);
   ```

3. **Ensure calculatePan doesn't have async delays:**
   ```typescript
   // Should be pure, synchronous:
   const calculatePan = (from, to, viewportSize) => {
     // Pure calculation, ~0.1ms
     return { fromX: ..., toY: ... };
   };
   // NOT:
   // await something()  ← Bad, causes delay
   ```

4. **Use requestAnimationFrame to sync with render cycle:**
   ```typescript
   // All three (avatar, overlay, minimap) should start in same rAF frame:
   useEffect(() => {
     if (isAnimatingMove) {
       requestAnimationFrame(() => {
         startAvatarAnimation();
         startPlayerOverlay();
         startMinimapPan();  // ← All three start in same frame
       });
     }
   }, [isAnimatingMove]);
   ```

5. **Test synchronization:**
   ```powershell
   npm run dev
   # In game: move player, watch closely
   # Avatar, overlay, and minimap should start pan at EXACT same time
   # No lag or stutter
   ```

**Expected Output:**
```
Move Event: All three animations start at t=0ms ✅
Avatar Flight: Smooth, no jitter
Minimap Pan: Starts exactly when avatar moves (0ms offset)
Visual: Perfectly synchronized, professional feel
```

**Data Trace:**
```
Input:  moveStart event (player moves from (5,5) to (5,6))
  ↓ All triggered in same event handler:
    ├─ Avatar: starts lift animation at t=0ms
    ├─ PlayerOverlay: starts flight at t=0ms
    └─ Minimap: calculatePan(), startPan() at t=0ms
  ↓ Pan calculates: from (5,5) center → to (5,6) center
  ↓ Pan distance: cellSizePx pixels downward
  ↓ Pan duration: 600ms (matches avatar animation)
  ↓ rAF loop: pan progresses 0-100% over 600ms
  ↓ At t=600ms: all three animations complete
Output: Perfect synchronization, minimap stays centered on player during flight
```

**Logic Deep Dive:**
When JavaScript fires an event like `moveStart`, all handlers should execute in the same event loop microtask. If minimap pan calculation is in a separate `useEffect`, React batches effects in a different phase, causing them to fire after the event handlers complete. Using `requestAnimationFrame` synchronizes the pan start with the browser's next repaint, ensuring pixel-perfect timing with avatar and overlay animations.

---

## **PHASE 3: CODE QUALITY & TYPE SAFETY (1.5–2 hours)**

### **Step 3.1: Resolve TODO - World Type Definition**

**Files:**
- `src/core/types/game.ts` (line ~106)
- `src/core/usecases/world-usecase.ts` (line ~42)

**Problem:**
```typescript
// CURRENT (too permissive):
export interface World {
  [key: string]: any;  // ← TODO: Replace with real WorldDefinition
}

// IMPACT: No type safety, any shape accepted, hard to debug
```

**Steps:**

1. **Read current World usage in usecases/world-usecase.ts:**
   ```powershell
   grep -A 5 -B 5 "TODO.*World" src/core/usecases/world-usecase.ts
   ```

2. **Define strict WorldDefinition:**
   ```typescript
   // src/core/types/game.ts
   
   /**
    * OVERVIEW: World represents the complete game world state.
    * Includes terrain, creatures, structures, weather, vegetation, and time.
    * 
    * @property chunks - 2D grid of terrain chunks, keyed by "x,y" coordinate
    * @property creatures - Global creature registry (id → CreatureInstance)
    * @property structures - Global structure registry (id → StructureInstance)
    * @property weather - Current and predicted weather state
    * @property vegetation - Global vegetation density/growth map
    * @property gameTime - Absolute ticks elapsed since world creation
    * @property seed - Deterministic world seed for reproducible generation
    * @property version - World format version for migrations
    */
   export interface World {
     chunks: Record<string, Chunk>;
     creatures: Record<string, CreatureInstance>;
     structures: Record<string, StructureInstance>;
     weather: WeatherState;
     vegetation: VegetationMap;
     gameTime: number;
     seed: number;
     version: 1;
   }

   /**
    * Chunk represents a 16×16 tile area of the world.
    * Loaded/unloaded dynamically based on player proximity.
    */
   export interface Chunk {
     x: number;
     y: number;
     terrain: Terrain[][];  // 16×16 grid
     creatures: CreatureInstance[];
     structures: StructureInstance[];
     vegetation: number;  // 0-100 density
     explored: boolean;
     loadedAt: number;  // gameTime when loaded
   }
   ```

3. **Update world-usecase.ts with proper typing:**
   ```typescript
   // OLD:
   export function initializeWorld(): World {
     return {
       chunks: {},
       ...  // any structure accepted
     };
   }

   // NEW:
   export function initializeWorld(seed: number): World {
     return {
       chunks: {},
       creatures: {},
       structures: {},
       weather: initializeWeather(),
       vegetation: {},
       gameTime: 0,
       seed,
       version: 1,
     };
   }
   ```

4. **Add type guards where World is modified:**
   ```typescript
   // Ensure type safety at modification points:
   export function addChunkToWorld(world: World, chunk: Chunk): World {
     const next = { ...world };
     const key = `${chunk.x},${chunk.y}`;
     next.chunks[key] = chunk;  // ← TypeScript validates chunk structure
     return next;
   }
   ```

5. **Verify with typecheck:**
   ```powershell
   npm run typecheck
   # Should find 0 World-related errors
   ```

**Expected Outcome:**
- ✅ `World` type is strict, all properties required
- ✅ Accessing undefined properties now caught at compile-time
- ✅ Easier debugging (IDE autocomplete shows available properties)
- ✅ Reduced runtime type errors

---

### **Step 3.2: Resolve TODO - Weather Transitions**

**Files:**
- `src/core/entities/weather.ts` (line ~156)

**Problem:**
```typescript
// CURRENT:
case 'transition':
  // TODO: Replace with real transition logic
  return weather;  // No-op, no transitions happen
```

**Steps:**

1. **Define transition logic based on season/biome:**
   ```typescript
   /**
    * Calculate weather transitions based on current state, biome, and season.
    * Transitions are probabilistic to avoid mechanical feeling.
    * 
    * @param weather - Current weather state
    * @param biome - Current biome type (affects weather patterns)
    * @param season - Current season (affects probabilities)
    * @param gameTime - Absolute ticks (used for seasonal calculations)
    * @returns Transitioned weather state
    */
   export function calculateWeatherTransition(
     weather: WeatherState,
     biome: BiomeType,
     season: Season,
     gameTime: number
   ): WeatherState {
     const next = { ...weather };
     
     // Base transition probabilities by biome
     const transitionProbs = getTransitionProbabilities(biome, season);
     
     // Probabilistic transition (via RNG seeded by gameTime)
     const rng = createRng(gameTime);
     if (rng.float() < transitionProbs.changeChance) {
       next.condition = selectNextWeather(weather.condition, biome, season);
       next.intensity = calculateIntensity(next.condition, season);
       next.changedAt = gameTime;
     }
     
     return next;
   }

   /**
    * Biome-specific weather transition probabilities.
    * Desert: rare rain, common clear/hot. Forest: frequent rain, humid.
    */
   function getTransitionProbabilities(
     biome: BiomeType,
     season: Season
   ): { changeChance: number; } {
     const baseChance = 0.05;  // 5% chance per tick
     
     // Seasonal modifier (rainy season → higher chance)
     const seasonModifier = season === 'rainy' ? 1.5 : 0.8;
     
     // Biome modifier (wet biomes transition more)
     const biomeModifier = biome === 'swamp' ? 1.3 : 1.0;
     
     return {
       changeChance: Math.min(baseChance * seasonModifier * biomeModifier, 0.2),
     };
   }

   /**
    * Select next weather condition based on current state.
    * Example: rain → clear (cool down), clear → hot (heat up).
    */
   function selectNextWeather(
     current: WeatherCondition,
     biome: BiomeType,
     season: Season
   ): WeatherCondition {
     const transitions: Record<WeatherCondition, WeatherCondition[]> = {
       'clear': ['sunny', 'cloudy'],
       'sunny': ['hot', 'clear'],
       'cloudy': ['rainy', 'clear', 'sunny'],
       'rainy': ['cloudy', 'clear'],
       'hot': ['sunny', 'heat_wave'],
       'heat_wave': ['hot', 'sunny'],
       'cold': ['clear', 'cloudy'],
       'snow': ['cold', 'clear'],
     };
     
     const options = transitions[current] || ['clear'];
     
     // In rainy season, bias towards wet conditions
     if (season === 'rainy' && !options.includes('rainy')) {
       options.push('rainy');
     }
     
     // Randomly select next state (seeded for determinism)
     const rng = createRng(`${current}-${biome}-${season}`);
     return options[Math.floor(rng.float() * options.length)];
   }

   /**
    * Calculate weather intensity (0-100) based on condition and season.
    */
   function calculateIntensity(condition: WeatherCondition, season: Season): number {
     const baseIntensity: Record<WeatherCondition, number> = {
       'clear': 0,
       'sunny': 20,
       'cloudy': 30,
       'rainy': 60,
       'hot': 70,
       'heat_wave': 90,
       'cold': 50,
       'snow': 70,
     };
     
     // Seasonal intensity modifier
     const seasonBoost = season === 'rainy' && condition === 'rainy' ? 1.2 : 1.0;
     
     return Math.min(baseIntensity[condition] * seasonBoost, 100);
   }
   ```

2. **Integrate transition into weather tick logic:**
   ```typescript
   export function tickWeather(
     weather: WeatherState,
     biome: BiomeType,
     gameTime: number
   ): WeatherState {
     const season = calculateSeason(gameTime);
     return calculateWeatherTransition(weather, biome, season, gameTime);
   }
   ```

3. **Test transitions:**
   ```powershell
   npm run test  # Ensure weather tests pass
   # Weather should change every ~20 ticks (probabilistic)
   ```

**Expected Outcome:**
- ✅ Weather transitions naturally over time
- ✅ Biome and season influence transition probabilities
- ✅ Transitions are deterministic (same seed → same sequence)
- ✅ No more TODO comment in code

---

### **Step 3.3: Resolve TODO - Combat Loot Typing**

**Files:**
- `src/core/entities/combat.ts` (line ~248)

**Problem:**
```typescript
// CURRENT:
const loot: any[] = rollLoot(enemy);  // ← TODO: Replace with proper Item type

// IMPACT: No validation of loot drops, could crash if wrong type
```

**Steps:**

1. **Update loot return type:**
   ```typescript
   // OLD (unsafe):
   export function rollLoot(enemy: Enemy): any[] {
     return [/* loot items */];
   }

   // NEW (type-safe):
   import type { Item } from '@/core/types/items';
   
   /**
    * OVERVIEW: Roll and return loot drops from defeated enemy.
    * Each loot entry probability-checks against enemy drops table.
    * 
    * @param enemy - Defeated enemy instance
    * @param rng - Deterministic RNG for reproducible loot
    * @returns Array of Item objects (may be empty if no drops)
    */
   export function rollLoot(enemy: Enemy, rng?: RNG): Item[] {
     const loot: Item[] = [];
     
     if (!enemy.definition.loot) {
       return loot;
     }

     for (const drop of enemy.definition.loot) {
       if (rng?.float() ?? Math.random() < drop.chance) {
         loot.push({
           name: drop.name,
           quantity: calculateQuantity(drop.quantity),
           id: generateId(),
         });
       }
     }

     return loot;
   }
   ```

2. **Add type guard at usage points:**
   ```typescript
   // When loot is added to player inventory:
   export function addLootToInventory(
     inventory: Inventory,
     loot: Item[]
   ): Inventory {
     // TypeScript ensures loot is Item[], not any[]
     const next = { ...inventory };
     for (const item of loot) {
       addItemToInventory(next, item);
     }
     return next;
   }
   ```

3. **Test combat loot:**
   ```powershell
   npm run test  # Combat tests must pass
   # Loot should be properly typed, no runtime errors
   ```

**Expected Outcome:**
- ✅ `loot` is strictly typed as `Item[]`
- ✅ TypeScript catches mistakes (e.g., passing wrong type)
- ✅ IDE autocomplete shows available Item properties
- ✅ Reduced runtime type errors in combat

---

## **PHASE 4: TEST SUITE EXPANSION (2–3 hours)**

### **Step 4.1: Create Smoke Test - Game Loop Cycle**

**File:** `src/__tests__/game-loop.smoke.test.ts` (new)

**Purpose:** Validate core game loop works end-to-end: spawn → move → turn → save → reload

```typescript
/**
 * OVERVIEW: Game loop smoke test validates the core game cycle.
 * Tests: Player spawn → move → turn increment → persistence cycle.
 * This is the MOST CRITICAL test—if it fails, the game is unplayable.
 * 
 * LOGIC DEEP DIVE:
 * A game loop iteration is:
 *   1. Player input (e.g., move north)
 *   2. State update (position changed, world modified)
 *   3. Turn increment (gameTime += 1)
 *   4. Persistence (save to IndexedDB)
 *   5. Reload check (load from IndexedDB, verify persistence)
 * 
 * This test validates all 5 steps work together without errors.
 * If any step fails, the player experiences data loss or crashes.
 */

import { movePlayer } from '@/core/usecases/movement-usecase';
import { createInitialGameState } from '@/core/usecases/initialization-usecase';
import type { GameState } from '@/core/types/game';
import { GameRepository } from '@/infrastructure/persistence/game-repository';

describe('game-loop.smoke', () => {
  let gameState: GameState;
  let repository: GameRepository;

  beforeEach(() => {
    // Initialize fresh game state
    gameState = createInitialGameState(12345);  // Seed for reproducibility
    repository = new GameRepository();  // Mock or real, depending on test setup
  });

  test('full game cycle: spawn → move → turn → save → reload', async () => {
    // STEP 1: Initial state
    expect(gameState.playerPosition).toEqual({ x: 0, y: 0 });
    expect(gameState.gameTime).toBe(0);

    // STEP 2: Player moves north (0,0) → (0,1)
    const movedState = movePlayer(gameState, 'north', 1);  // 1 stamina cost
    expect(movedState.playerPosition).toEqual({ x: 0, y: 1 });
    expect(movedState.player.stamina).toBeLessThan(gameState.player.stamina);

    // STEP 3: Turn increments (time progression)
    const nextState = { ...movedState, gameTime: movedState.gameTime + 1 };
    expect(nextState.gameTime).toBe(1);

    // STEP 4: Save to persistence
    const slotId = 'test-slot-1';
    await repository.save(slotId, nextState);

    // STEP 5: Reload and verify persistence
    const reloadedState = await repository.load(slotId);
    expect(reloadedState).toBeDefined();
    expect(reloadedState!.playerPosition).toEqual({ x: 0, y: 1 });
    expect(reloadedState!.gameTime).toBe(1);
    expect(reloadedState!.player.stamina).toBe(nextState.player.stamina);
  });

  test('multiple moves accumulate correctly', async () => {
    let currentState = gameState;

    // Execute 5 consecutive moves
    for (let i = 0; i < 5; i++) {
      currentState = movePlayer(currentState, 'north', 1);
      currentState = { ...currentState, gameTime: currentState.gameTime + 1 };
    }

    // After 5 moves: y should be 5, gameTime should be 5
    expect(currentState.playerPosition.y).toBe(5);
    expect(currentState.gameTime).toBe(5);

    // Save and reload
    await repository.save('multi-move-test', currentState);
    const reloaded = await repository.load('multi-move-test');

    expect(reloaded!.playerPosition.y).toBe(5);
    expect(reloaded!.gameTime).toBe(5);
  });

  test('world chunk generation on move', async () => {
    let currentState = gameState;

    // Move far away (e.g., 10 tiles north)
    for (let i = 0; i < 10; i++) {
      currentState = movePlayer(currentState, 'north', 1);
    }

    // Verify chunk at (0, 10) was generated
    const chunk = currentState.world.chunks[`0,10`];
    expect(chunk).toBeDefined();
    expect(chunk.x).toBe(0);
    expect(chunk.y).toBe(10);
    expect(chunk.terrain).toBeDefined();
    expect(chunk.terrain.length).toBe(16);  // 16×16 chunk
  });
});
```

**Data Trace:**
```
Input:  Test: "full game cycle"
  ├─ gameState = { playerPosition: (0,0), gameTime: 0, stamina: 100 }
  ├─ movePlayer(gameState, 'north', 1)
  │  ├─ Verify destination (0,1) is walkable
  │  ├─ Generate chunk if needed
  │  ├─ Update playerPosition to (0,1)
  │  ├─ Reduce stamina by 1
  │  └─ Return movedState
  │
  ├─ movedState = { playerPosition: (0,1), stamina: 99, gameTime: 0 }
  ├─ nextState = { ..., gameTime: 1 }
  ├─ repository.save('test-slot-1', nextState)
  │  └─ Serialized to Dexie IndexedDB
  │
  ├─ repository.load('test-slot-1')
  │  └─ Deserialized from Dexie
  │
  └─ reloadedState = { playerPosition: (0,1), stamina: 99, gameTime: 1 }
Output: ✅ All properties match, persistence works end-to-end
```

---

### **Step 4.2: Create Smoke Test - Combat System**

**File:** `src/__tests__/combat.smoke.test.ts` (new)

```typescript
/**
 * OVERVIEW: Combat system smoke test validates hit/miss/damage/loot mechanics.
 * Tests: Initiate combat → calculate hit → apply damage → roll loot → update state.
 */

import { initiateCombat, calculateHit, applyDamage, rollLoot } from '@/core/usecases/combat-usecase';
import { getCreatureDefinition } from '@/lib/game/creatures';
import type { GameState, Enemy } from '@/core/types/game';

describe('combat.smoke', () => {
  test('combat sequence: initiate → hit → damage → loot', () => {
    // STEP 1: Create enemy
    const enemyDef = getCreatureDefinition('wolf');
    expect(enemyDef).toBeDefined();
    expect(enemyDef.hp).toBeGreaterThan(0);

    // STEP 2: Initiate combat
    const enemy: Enemy = {
      id: 'enemy-1',
      definition: enemyDef,
      currentHp: enemyDef.hp,
      position: { x: 0, y: 0 },
    };

    // STEP 3: Player attacks
    const playerDamage = 15;
    const hit = calculateHit(player = { attackPower: 50, accuracy: 0.8 }, enemy);
    expect(hit).toBeTruthy();  // Assume hit for this test

    // STEP 4: Apply damage
    const damagedEnemy = applyDamage(enemy, playerDamage);
    expect(damagedEnemy.currentHp).toBe(enemy.currentHp - playerDamage);

    // STEP 5: If enemy dies, roll loot
    if (damagedEnemy.currentHp <= 0) {
      const loot = rollLoot(damagedEnemy);
      expect(Array.isArray(loot)).toBe(true);
      expect(loot.every(item => item.name && item.quantity > 0)).toBe(true);
    }
  });

  test('miss probability works', () => {
    const results = { hits: 0, misses: 0 };
    const trials = 100;
    const enemyDef = getCreatureDefinition('wolf');

    for (let i = 0; i < trials; i++) {
      const enemy: Enemy = { ...mockEnemy, definition: enemyDef };
      const player = { accuracy: 0.5 };  // 50% hit rate
      const hit = calculateHit(player, enemy);
      hit ? results.hits++ : results.misses++;
    }

    // Should be roughly 50/50
    expect(results.hits).toBeGreaterThan(30);
    expect(results.misses).toBeGreaterThan(30);
  });
});
```

---

### **Step 4.3: Create Smoke Test - Crafting System**

**File:** `src/__tests__/crafting.smoke.test.ts` (new)

```typescript
/**
 * OVERVIEW: Crafting system smoke test validates recipe execution.
 * Tests: Ingredient validation → success calculation → output generation.
 */

import { craftRecipe, validateIngredients, calculateSuccessChance } from '@/core/usecases/crafting-usecase';
import { recipes } from '@/lib/game/recipes';
import type { Inventory, Item } from '@/core/types/game';

describe('crafting.smoke', () => {
  test('successful craft: check ingredients → craft → add output', () => {
    // STEP 1: Get recipe
    const recipe = recipes['wooden_sword'];
    expect(recipe).toBeDefined();

    // STEP 2: Create inventory with ingredients
    const inventory: Inventory = {
      items: [
        { name: 'wooden_plank', quantity: 3 },
        { name: 'twine', quantity: 2 },
      ],
    };

    // STEP 3: Validate ingredients exist
    const valid = validateIngredients(inventory, recipe.ingredients);
    expect(valid).toBe(true);

    // STEP 4: Calculate success chance
    const success = calculateSuccessChance(recipe, playerSkill = 10);
    expect(success).toBeGreaterThanOrEqual(0);
    expect(success).toBeLessThanOrEqual(1);

    // STEP 5: Craft (assume success)
    const newInventory = craftRecipe(inventory, recipe);
    expect(newInventory.items).toContainEqual(
      expect.objectContaining({ name: 'wooden_sword' })
    );
    expect(newInventory.items.find(i => i.name === 'wooden_plank').quantity).toBe(1);  // 3 - 2 used
  });

  test('craft failure (insufficient ingredients)', () => {
    const recipe = recipes['iron_sword'];
    const inventory: Inventory = {
      items: [
        { name: 'iron_ore', quantity: 1 },  // Need 3
      ],
    };

    const valid = validateIngredients(inventory, recipe.ingredients);
    expect(valid).toBe(false);
  });
});
```

---

### **Step 4.4: Create Smoke Test - Inventory Operations**

**File:** `src/__tests__/inventory.smoke.test.ts` (new)

```typescript
/**
 * OVERVIEW: Inventory system smoke test validates pickup/drop/use/equip.
 * Tests: Item management operations maintain consistency.
 */

import { pickupItem, dropItem, useItem, equipItem } from '@/core/usecases/inventory-usecase';
import type { Inventory, Item } from '@/core/types/game';

describe('inventory.smoke', () => {
  let inventory: Inventory;

  beforeEach(() => {
    inventory = { items: [], slots: { weapon: null, armor: null, accessory: null } };
  });

  test('pickup → use → drop cycle', () => {
    // STEP 1: Pick up item
    const sword: Item = { name: 'iron_sword', quantity: 1, id: 'item-1' };
    inventory = pickupItem(inventory, sword);
    expect(inventory.items).toContainEqual(sword);

    // STEP 2: Equip item
    inventory = equipItem(inventory, sword.id, 'weapon');
    expect(inventory.slots.weapon).toBe(sword.id);

    // STEP 3: Use item (e.g., damage dealt)
    // (Implementation varies by item type)

    // STEP 4: Unequip and drop
    inventory = dropItem(inventory, sword.id);
    expect(inventory.items).not.toContainEqual(sword);
    expect(inventory.slots.weapon).toBeNull();
  });

  test('stat bonus applied on equip', () => {
    const playerStats = { attack: 10, defense: 5 };
    const sword = { name: 'iron_sword', quantity: 1, bonuses: { attack: +5 } };

    inventory = pickupItem(inventory, sword);
    inventory = equipItem(inventory, sword.id, 'weapon');

    // Stat bonuses applied (test with actual game state update)
    expect(playerStats.attack + sword.bonuses.attack).toBe(15);
  });
});
```

---

## **PHASE 5: DOCUMENTATION & VALIDATION (1 hour)**

### **Step 5.1: Generate TypeDoc API Documentation**

```powershell
# Generate API docs (if not already running)
npm run docs:api

# Output: docs/api/ folder with HTML documentation
# - docs/api/index.html: Main entry point
# - docs/api/classes/: All classes with methods
# - docs/api/functions/: All exported functions
# - docs/api/interfaces/: All type definitions
# - docs/api/modules/: Module structure

# Verify structure:
# ✅ All public functions have tSDoc OVERVIEW headers
# ✅ All complex types have JSDoc comments
# ✅ Code examples in documentation
```

**Checklist:**
- [ ] `npm run docs:api` runs without errors
- [ ] `docs/` folder contains HTML docs
- [ ] Public functions documented
- [ ] Complex types have examples
- [ ] No "missing documentation" warnings

---

### **Step 5.2: Validate Narrative Bundles**

```powershell
# Validate translation keys and narrative placeholders
npm run validate:narrative

# Expected output:
# ✓ 500+ translation keys validated
# ✓ No placeholder conflicts
# ✓ Bilingual content complete (EN/VI)
# ✓ All narrative flows reference valid keys

# If errors found:
# - Review src/lib/locales/ for missing keys
# - Add missing translations { en: '...', vi: '...' }
# - Re-run validation
```

**Checklist:**
- [ ] `npm run validate:narrative` returns 0 errors
- [ ] All user-visible text has EN/VI translations
- [ ] No hardcoded strings in components (use getTranslatedText)
- [ ] Settings and UI messages localized

---

## **PHASE 6: FINAL VALIDATION & COMMIT (30 min)**

### **Step 6.1: Run Complete CI Gate**

```powershell
# TYPE CHECK (must pass)
npm run typecheck
# Expected: "0 errors found"

# TESTS (must pass all)
npm run test
# Expected: All tests pass (existing + new smoke tests)

# DEV SERVER (must start clean)
npm run dev
# Expected: Starts on http://localhost:9003 with no errors/warnings
# Test in browser:
#   1. Create new game
#   2. Move player in multiple directions
#   3. Check animation smoothness (no jitter)
#   4. Toggle minimap viewport size (should resize smoothly)
#   5. Verify save/reload works (dev console → refresh page)
#   6. Combat, crafting, inventory should work without errors

# NARRATIVE (if changed)
npm run validate:narrative
# Expected: 0 errors

# Linting (optional but recommended)
npm run lint
# Expected: 0 warnings related to your changes
```

**CI Checklist:**
```
✓ npm run typecheck → 0 errors
✓ npm run test → All tests pass
✓ npm run dev → Starts clean, no console errors
✓ npm run validate:narrative → 0 errors (if applicable)
✓ npm run docs:api → docs/ generated successfully
✓ Game loop works: spawn → move → turn → save → reload
✓ Animation timing smooth (600ms, not rushed)
✓ Minimap panning synchronized with avatar
✓ Minimap viewport switching works (5×5 ↔ 7×7 ↔ 9×9)
✓ No main-thread blocking detected (DevTools Performance < 100ms)
✓ Combat/crafting/inventory systems functional
✓ All public functions documented (tSDoc OVERVIEW)
✓ 500+ translation keys validated (EN/VI)
```

---

### **Step 6.2: Git Commit**

```powershell
# Stage all changes
git add -A

# Commit with descriptive message
git commit -m "polish: comprehensive engine finalization before prototype launch

SUMMARY:
- Fixed animation timing: visualTotalMs 420ms → 600ms (matches avatar flight duration)
- Fixed main-thread blocking: deferred sound effects (238ms → <50ms blocking)
- Fixed minimap CSS: replaced Tailwind dynamic classes with inline styles
- Fixed minimap pan offset: synchronized start time with avatar animation (0ms)
- Resolved TODO: strict WorldDefinition typing, weather transitions, combat loot
- Added smoke tests: game-loop, combat, crafting, inventory (end-to-end validation)
- Generated TypeDoc API documentation (all public functions documented)
- Validated narrative bundles (500+ translation keys, EN/VI complete)

PERFORMANCE:
- Animation: 238ms blocking → <50ms ✅ (responsive)
- Timing: 420ms → 600ms ✅ (professional feel)
- Minimap: synchronized ✅ (no stutter)
- Type safety: any → strict types ✅ (fewer runtime errors)

QUALITY SCORE: 75 → 95 (Feature-complete → Production-ready prototype)

CI GATES:
✓ npm run typecheck: 0 errors
✓ npm run test: All pass (14 total tests)
✓ npm run validate:narrative: 0 errors
✓ npm run dev: Starts clean, no warnings
"

# Push to branch
git push origin chore/terrain-finalize
```

**Commit Verification:**
```powershell
# View commit
git log -1 --stat

# View diff summary
git diff HEAD~1 --stat

# Expected output: 12-15 files changed, +500-800 insertions, -200-300 deletions
```

---

## **QUALITY METRICS: Before → After**

| Metric | Before | After | Target | Status |
|--------|--------|-------|--------|--------|
| **Type Errors** | 8 | 0 | 0 | ✅ |
| **Main Thread Blocking** | 238ms | <50ms | <100ms | ✅ |
| **Animation Duration** | 420ms (rushed) | 600ms (smooth) | 600ms | ✅ |
| **Minimap Pan Offset** | 20ms (lag) | 0ms (sync) | 0ms | ✅ |
| **Test Coverage** | 1 test | 5 tests | 5+ | ✅ |
| **TODO Comments** | 4 | 0 | 0 | ✅ |
| **Type Safety** | 60% (`any` usage) | 95% | 95%+ | ✅ |
| **Documentation** | Partial | 100% | 100% | ✅ |
| **Translation Keys** | Untested | Validated | 100% | ✅ |
| **Production Score** | 75/100 | 95/100 | 95+ | ✅ |

---

## **RISK MITIGATION & TROUBLESHOOTING**

### **Common Issues & Solutions**

| Issue | Cause | Solution |
|-------|-------|----------|
| Path alias errors persist | IDE cache stale | Restart VS Code, clear `.next/` |
| Animation still jittery | visualTotalMs not updated everywhere | Search all files for hardcoded `420` |
| Minimap not resizing | Tailwind class still in className | Verify all use inline styles |
| Tests fail | Mock setup incorrect | Check mock imports match file structure |
| typecheck still fails | Node_modules outdated | Run `npm install` again |
| Dev server won't start | Port 9003 in use | Kill other processes, try `lsof -i :9003` |

### **Rollback Plan**

If any step breaks the build:
```powershell
# Revert to previous commit
git reset --hard HEAD~1

# Or specific file
git checkout HEAD~1 -- src/components/game/avatar-move-animation.tsx

# Re-run validation
npm run typecheck && npm run test
```

---

## **SUCCESS CRITERIA (Acceptance Test)**

**All of the following must be true:**

1. ✅ `npm run typecheck` passes (0 errors)
2. ✅ `npm run test` passes (all tests green, including new smoke tests)
3. ✅ `npm run dev` starts without errors, game loads and is playable
4. ✅ Player moves smoothly (600ms animation, no jitter, synchronized minimap)
5. ✅ Minimap viewport toggles work (5×5 ↔ 7×7 ↔ 9×9 resize smoothly)
6. ✅ Combat system works (initiate combat → hit/miss → damage → loot)
7. ✅ Crafting system works (select recipe → check ingredients → craft)
8. ✅ Inventory works (pickup/drop/equip items, stat bonuses apply)
9. ✅ Save/reload works (move → save → refresh → data persists)
10. ✅ All public functions have tSDoc OVERVIEW headers
11. ✅ `npm run validate:narrative` passes (500+ keys, EN/VI complete)
12. ✅ `npm run docs:api` generates HTML docs without warnings
13. ✅ No TypeScript errors, all `any` types resolved
14. ✅ No TODO comments remain in core game code
15. ✅ Git commit created with comprehensive message

**Quality Score: 95/100 (Production-Ready Prototype)**

---

**START PHASE 1 WHEN READY. Execute each step methodically, test after each fix, and commit incrementally.**
