# Animation Debugging - Deep Dive Findings

## Critical Issues Found

### 1. Main Thread Blocking (238ms)
**Log evidence:**
```
[Violation] 'click' handler took 238ms
```

**Root causes in move-orchestrator.ts:**
- Lines 60-84: Sound effect selection (3x setTimeout for SFX playback)
- Lines 85-120: moveStart event dispatch with Promise.resolve() microtask
- Lines 78-118: Multiple state setters (setVisualPlayerPosition, setVisualMoveFrom, setVisualMoveTo, setIsAnimatingMove)
- Lines 130-145: Event listener attachment + multiple try-catch blocks

**Impact:**
- JavaScript main thread blocked for 238ms
- Browser can't render during handler
- Both PlayerOverlay rAF and Minimap rAF are queued but delayed
- Animation start time delayed vs. moveStart event time

### 2. Animation Duration Too Short (420ms)
**Log evidence:**
```
visualTotalMs: 420
[move-orchestrator] dispatching moveStart {id: '...', visualTotalMs: 420}
```

**Calculation (move-orchestrator.ts:115):**
```typescript
const visualTotalMs = 350 + 50 + 20;  // 350=landing, 50=bounce, 20=extra
```

**Problems:**
- 420ms is very short for smooth animation perception
- Avatar lift (150ms) + fly (300ms) + land (150ms) = 600ms total flight
- visualTotalMs doesn't match actual animation duration
- **Animation appears rushed/jittery**

### 3. Minimap Pan Start Delayed by 20ms
**Code (minimap.tsx:296):**
```typescript
setTimeout(() => {
    pan.startTime = Date.now();
    pan.active = true;
    pan.rafId = requestAnimationFrame(() => { });
}, 20);  // ← 20ms delay
```

**Problem:**
- Minimap pan starts 20ms after moveStart event
- PlayerOverlay might start immediately
- **Desynchronization by 20ms** causes visual stutter if both aren't perfectly synced

### 4. Pan Distance Might Be Wrong
**Code (minimap.tsx:283-286):**
```typescript
const panX = dx * cellSizePx;  // dx in tiles, cellSizePx in pixels
const panY = -dy * cellSizePx;
// cellSizePx = 320 / viewportSize (depends on viewport mode!)
```

**Problem:**
- cellSizePx varies by viewport size (5/7/9)
- Pan animation uses current viewport's cellSizePx
- But grid pre-load is 7×7 always
- **For 5×5 mode:** cellSizePx = 64px, but grid cells are smaller visually (tiles are hidden)
- **Pan might be overshooting or undershooting**

Example:
```
5×5 mode: cellSizePx = 320/5 = 64px
7×7 mode: cellSizePx = 320/7 = 45.7px

Move (1,0) in 7×7 grid:
- Actual grid cell = 45.7px
- But we pan 1 * 64px = 64px (if viewport is set to 5×5)
- Grid visually moves wrong!
```

## Event Flow Timeline

```
t=0ms:      User clicks move (east)
t=0-238ms:  move-orchestrator handler blocking main thread
  - Set visual states
  - Play SFX
  - Add narrative
  - dispatch moveStart
  
t=238ms:    Handler finishes, moveStart queued as microtask
t=238+:     Browser starts rendering frame
t=239ms:    moveStart microtask executes
            - window.dispatchEvent('moveStart')
            
t=240ms:    Listeners receive moveStart
  - PlayerOverlay: starts rAF loop
  - Minimap: setTimeout(..., 20)
  
t=260ms:    Minimap: pan.startTime = Date.now()
            pan.active = true
            Minimap rAF starts
            
t=260-680ms: Both animations run in parallel
  - PlayerOverlay: 420ms flight (but labeled as 420ms, wrong!)
  - Minimap: 420ms pan with 20ms delay
  
t=680ms:    Both should complete
t=1400+ms:  Safety timeout applies authoritative position
```

## Why Animation Looks Jittery

**Hypothesis:**
1. **Handler blocks 238ms** → Animation start jitters by ~238ms
2. **Main thread congestion** → rAF frames drop during handler
3. **Wrong visualTotalMs** → Animation duration mismatch (420 vs actual)
4. **Wrong cellSizePx** → Pan distance calculation error
5. **20ms Minimap delay** → Desync between overlays

**Visible effects:**
- Avatar flight starts stiff/slow at beginning
- Then catches up fast (non-linear feel)
- Minimap pan doesn't match avatar movement
- Overall feels "glitchy" vs smooth

## Testing Plan

### 1. Measure Main Thread Blocking
```javascript
// Add to move-orchestrator.ts before handler code
const t0 = performance.now();
// ... handler code ...
const duration = performance.now() - t0;
console.log('[move-orchestrator] Total handler time:', duration);
```

Expected: < 50ms for smooth 60fps (16.6ms per frame)

### 2. Verify Pan Distance Calculation
```javascript
// Add to minimap.tsx
console.log('[minimap] Pan calculation:', {
  viewportSize,
  cellSizePx,
  gridDisplayRadius: gridSize,  // Should be 7
  dx, dy,
  panX, panY,
  expectedPixels: `${dx} tiles × ${45.7}px/tile`
});
```

Expected: panX/panY should match actual visual grid cell size, not viewport-dependent cellSizePx

### 3. Check visualTotalMs Accuracy
```javascript
// In move-orchestrator.ts
console.log('[move-orchestrator] Actual flight breakdown:', {
  landingDelay: 350,
  bounceDuration: 50,
  extra: 20,
  total: 420,
  actualPlayerOverlayTotal: '150+300+150=600?'
});
```

Expected: visualTotalMs should match actual animation duration

### 4. Remove 20ms Minimap Delay
```typescript
// Change this:
setTimeout(() => { ... }, 20);

// To this:
// Immediately start pan, or defer to next microtask
Promise.resolve().then(() => { ... });
```

### 5. Profile with DevTools
- Record Performance timeline during move
- Check for long tasks (> 50ms)
- Look for frame drops during animation
- Verify CSS variables are updating

## Recommendations

1. **Reduce handler blocking:**
   - Move SFX playback to `requestIdleCallback` (already done, but verify)
   - Defer narrative entry updates to next microtask
   - Batch state updates

2. **Fix visualTotalMs:**
   - Verify actual PlayerOverlay duration (check component)
   - Align visualTotalMs with reality (600ms, not 420ms)
   - Use consistent duration across all animations

3. **Fix pan distance:**
   - Use **grid cell size** (320/7) for pan, not viewport cell size (320/viewportSize)
   - Pan should move grid, not viewport

4. **Remove Minimap delay:**
   - Start pan immediately on moveStart
   - Or use same delay as PlayerOverlay

5. **Reduce overall blocking:**
   - Profile and optimize handler
   - Target < 50ms total blocking time
