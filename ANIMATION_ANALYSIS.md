# Animation Issues Analysis - Player Flight & Minimap Pan

## Reported Issues

1. **Player flight animation is jittery/stuttering**
   - Avatar movement not smooth
   - Loops/repeats erratically
   
2. **Minimap pan animation not visible**
   - Either no animation happening
   - Or animation too fast to perceive
   - Current: Re-renders instead of smooth pan
   - Expected: Smooth 60fps camera follow

## Architecture Overview

### Current Animation Flow

```
Player movement sequence:
1. User presses move direction
2. Game dispatches moveStart event with {from, to, visualTotalMs}
3. Avatar flight animation starts (PlayerOverlay component)
4. Minimap receives moveStart, triggers rAF pan animation
5. Both should sync and complete together
```

### Animation Components

1. **PlayerOverlay** (`src/components/game/player-overlay.tsx`)
   - Handles avatar lift → fly → land → bounce
   - Uses rAF loop for smooth 60fps animation
   - Emits `playerOverlayLanding`, `moveAnimationsFinished` events

2. **Minimap** (`src/components/game/minimap.tsx`)
   - Pan animation via `--pan-x`, `--pan-y` CSS variables
   - rAF loop updates variables per frame
   - Should sync with avatar flight duration (visualTotalMs)

3. **Orchestrator** (unclear - find in codebase)
   - Listens to animation events
   - Coordinates timing between components
   - Updates game state when animation completes

## Suspected Root Causes

### 1. Player Flight Jitter
**Potential causes:**
- rAF loop not properly synchronized (frame drops, inconsistent timing)
- Multiple animation cycles interfering (overlapping moveStart events)
- React re-renders interrupting rAF (state changes during animation)
- CSS transform not applied correctly (z-index, positioning conflicts)
- Easing function causing nonlinear motion jumps

**Investigation needed:**
- Check PlayerOverlay rAF implementation
- Look for state changes during animation
- Verify CSS transform/position are correct
- Check for competing animations (CSS keyframes vs rAF)
- Trace event flow (moveStart → multiple handlers?)

### 2. Minimap Pan Not Visible
**Potential causes:**
- Animation duration too short (visualTotalMs very small)
- Pan distance calculation wrong (dx/dy * cellSizePx not matching avatar distance)
- CSS variables not updating (rAF loop broken, not setting --pan-x/--pan-y)
- Transform not applied (missing `map-pan-anim` class, CSS var syntax error)
- Container z-index/overflow hiding animation
- Animation happening but grid tiles re-rendering over it (opacity-0 tiles flickering)

**Investigation needed:**
- Log visualTotalMs to check duration
- Log panX/panY to verify distance
- Check CSS variables are updating (browser DevTools)
- Verify transform: translate() applies correctly
- Check console for rAF loop errors
- Test with artificial delay (setTimeout to slow down)

## Data Trace for Animation Sequence

### Scenario: Player moves from (5,5) to (6,5)

```
1. User action → moveStart event dispatched
   {
     id: 'move_123',
     from: {x: 5, y: 5},
     to: {x: 6, y: 5},
     visualTotalMs: 600
   }

2. PlayerOverlay receives moveStart:
   - startTime = Date.now()
   - duration = 600ms
   - liftDuration = 150ms (up)
   - flyDuration = 300ms (arc)
   - landDuration = 150ms (down)
   - Total = 600ms ✓

3. Minimap receives moveStart:
   - dx = 6 - 5 = 1
   - dy = 5 - 5 = 0
   - cellSizePx = 320 / 7 ≈ 45.7px (if 7×7 mode)
   - panX = 1 * 45.7 = 45.7px
   - panY = 0px
   - panDuration = 600ms
   - startTime = Date.now() + 20ms (deferred)

4. rAF loops run in sync:
   Frame 0 (0ms):
     - PlayerOverlay: progress=0, phase=lift
     - Minimap: progress=0, transform: translate(0, 0)
   
   Frame 10 (16.6ms):
     - PlayerOverlay: progress=2.7%, phase=lift
     - Minimap: progress=2.7%, transform: translate(1.2px, 0)
   
   ...
   
   Frame 36 (600ms):
     - PlayerOverlay: progress=100%, phase=bounce
     - Minimap: progress=100%, transform: translate(45.7px, 0)
     - Both dispatch completion events

5. Orchestrator receives events:
   - playerOverlayLanding: updates player visual position
   - minimapPanComplete: confirms pan done
   - moveAnimationsFinished: updates game state
```

## Questions to Answer

1. **Is minimap pan animation using rAF or CSS keyframes?**
   - Current code uses rAF with `--pan-x/--pan-y` variables
   - CSS applies `transform: translate(var(--pan-x), var(--pan-y))`
   - Should be smooth, but needs verification

2. **Are there competing animations?**
   - Check `.map-pan-anim` CSS class in globals.css
   - Look for other CSS animations on same element
   - Verify no conflicting `will-change` declarations

3. **Is rAF loop actually running every frame?**
   - Add console logs to measure frame rate
   - Check for RAF skips (Date.now() jumps > 16ms)
   - Verify `requestAnimationFrame` is being called

4. **Why is player flight jittery?**
   - PlayerOverlay using rAF? Or CSS animation?
   - If CSS animation: is it conflicting with other animations?
   - If rAF: are there state updates during animation?

5. **Is event timing synchronized?**
   - moveStart has visualTotalMs
   - Both components should use same duration
   - minimap has 20ms defer → slight sync offset?

## Testing Strategy

1. **Add debug logging to both components:**
   - Log frame count, elapsed time, progress value
   - Log calculated positions (panX, panY, playerX, playerY)
   - Log easing function output

2. **Visual inspection with browser DevTools:**
   - Check CSS variables in real-time
   - Verify transform is applied
   - Look at paint events (should be 60fps, not on every frame)

3. **Slow-motion testing:**
   - Use developer tools to throttle CPU (4x slowdown)
   - Add artificial delays to stretch animation
   - Check if stutter is timing-related or structural

4. **Event flow verification:**
   - Check console for moveStart, playerOverlayLanding, minimapPanComplete events
   - Verify order and timing
   - Look for duplicate events (race conditions)

## Next Steps

1. **Identify root cause** of player jitter:
   - Is it PlayerOverlay or game state update timing?
   - Is it CSS animation competing with rAF?
   - Is it event loop congestion?

2. **Verify minimap animation works:**
   - Check browser DevTools for transform changes
   - Add console logging to rAF loop
   - Test with slow-motion to see if animation exists

3. **Sync both animations:**
   - Ensure same duration (visualTotalMs)
   - Remove 20ms defer if causing sync issues
   - Verify easing functions match

4. **Optimize for 60fps:**
   - Profile with DevTools performance tab
   - Check for long tasks during animation
   - Verify will-change, contain properties are set
