# 🛡️ ARCHITECTURE GUARDS

**Last Updated:** December 18, 2025  
**Status:** CRITICAL PATTERNS - ENFORCE STRICTLY

---

## 🎯 Overview

This document defines **non-negotiable architectural patterns** to prevent:
- State desynchronization (race conditions)
- Performance degradation (re-render storms)
- Tight coupling (hard-to-test code)
- Memory leaks (stale closures)

These are **NOT suggestions**—they are **guardrails** that all new hooks, components, and usecases must follow during Phases 1-3.

---

## ⚠️ PATTERN 1: GameStateContext as Single Source of Truth (SSOT)

### Problem

If multiple hooks each store their own copy of state (e.g., `useState(player.position)`), race conditions happen:

```
Thread A (Explorer Hook)                  Thread B (Movement Hook)
─────────────────────                    ──────────────────────
reads player.position (5, 5)              reads player.position (5, 5)
sets discoveries                          calls movePlayer()
writes state: position = (6, 5)           writes state: position (7, 5)
                                          ❌ RACE CONDITION: Lost one move!
```

### Solution: SSOT + Dispatch Pattern

**Rule:**
1. GameStateContext holds **the only copy** of playerPosition, inventory, etc.
2. All hooks **read** from context (via selectors)
3. All hooks **dispatch updates** to context (via setGameState)
4. No local `useState` copies of core game data

### Correct Pattern

```typescript
// ✅ CORRECT: Only selector + dispatch
export function useExploration() {
  const { gameState, setGameState } = useGameStateContext();
  
  const handleExplore = useCallback(async () => {
    // Read from SSOT
    const currentPosition = gameState.playerPosition;
    
    // Call usecase (pure function)
    const [newState, effects] = explorationUsecase.exploreLocation(gameState, currentPosition);
    
    // Write back to SSOT immediately
    setGameState(newState);
    
    // Execute effects
    executeEffects(effects);
  }, [gameState, setGameState]);
  
  return { handlers: { handleExplore } };
}
```

### Incorrect Patterns (FORBIDDEN)

```typescript
// ❌ WRONG: Local copy of state
export function useExploration() {
  const { gameState } = useGameStateContext();
  const [localDiscoveries, setLocalDiscoveries] = useState(gameState.discoveries); // ⚠️ STALE!
  // If gameState.discoveries changes, localDiscoveries won't update
  
  // ❌ WRONG: Direct mutation
  gameState.playerPosition.x = 10; // Mutating shared state!
  
  // ❌ WRONG: Keeping stale reference
  const position = gameState.playerPosition;
  setTimeout(() => usePosition(position), 1000); // position is stale!
}
```

### Validation Checklist

- [ ] Hook imports from GameStateContext
- [ ] All reads use `const { gameState } = useGameStateContext()`
- [ ] All writes use `setGameState(newState)`
- [ ] No local `useState` for core game data (playerPosition, inventory, discoveries)
- [ ] No mutations: `state.x = y` is forbidden
- [ ] Selectors created with `useMemo` for performance

---

## 🔄 PATTERN 2: Dependency Injection via GameEngineProvider

### Problem

If hooks hardcode `new ExplorationUseCase()`, they're tightly coupled:
- Can't mock for unit tests
- Creates new instance every render
- Hard to share instance across hooks

```typescript
// ❌ WRONG: Hardcoded instantiation
export function useExploration() {
  const usecase = new ExplorationUseCase(); // New instance every call!
  // ...
}
```

### Solution: Inject via Context

**Rule:**
1. All usecases instantiated in GameEngineProvider (single instance)
2. Hooks request usecases via `useGameEngine()` hook
3. No `new ClassName()` in hooks

### Correct Pattern

```typescript
// ✅ CORRECT: Request from DI container
export function useExploration() {
  const { explorationUsecase } = useGameEngine(); // Injected instance
  
  const handleExplore = useCallback(() => {
    const result = explorationUsecase.exploreLocation(position);
    // ...
  }, [explorationUsecase]); // Dependency tracked
  
  return { handlers: { handleExplore } };
}
```

### In Tests

```typescript
// ✅ TESTABLE: Mock the container
const mockUsecase = { exploreLocation: jest.fn() };
const mockContainer = { explorationUsecase: mockUsecase };

// Wrap component with mock provider
<GameEngineProvider value={mockContainer}>
  <ExplorationPanel />
</GameEngineProvider>
```

### Validation Checklist

- [ ] No `new ClassName()` in hooks
- [ ] All usecases obtained via `useGameEngine()`
- [ ] Container reference in dependency arrays
- [ ] Unit tests use mock containers
- [ ] GameEngineProvider wraps app root

---

## 🚀 PATTERN 3: Selective Subscription (No Re-render Storm)

### Problem

If component re-renders on every game tick, even when irrelevant state changes, FPS drops:

```typescript
// ❌ WRONG: Entire state triggers re-render
export function ExplorationPanel() {
  const { gameState } = useGameStateContext(); // Component re-renders every game tick!
  return <div>{gameState.discoveries.length}</div>;
}
```

**Result:** Even if discoveries don't change, component re-renders 60x/sec because playerPosition changed.

### Solution: Selector Hooks

**Rule:**
1. Create selector hooks that return only the slice needed
2. Use `useMemo` with minimal dependency array
3. Wrap sub-components with `React.memo`
4. Use `useCallback` for all handlers

### Correct Pattern

```typescript
// ✅ CORRECT: Selector returns only discoveries
export function useExplorationState() {
  const { gameState } = useGameStateContext();
  
  return useMemo(() => ({
    discoveries: gameState.discoveries,
    lastDiscoveryTime: gameState.lastDiscoveryTime,
  }), [gameState.discoveries, gameState.lastDiscoveryTime]);
  // NOTE: playerPosition, stamina removed from dependency!
}

// Component re-renders ONLY when discoveries change
const ExplorationPanelContent = React.memo(({ discoveries }: Props) => (
  <div>{discoveries.map(d => <DiscoveryCard key={d.id} {...d} />)}</div>
));

export function ExplorationPanel() {
  const { discoveries } = useExplorationState();
  return <ExplorationPanelContent discoveries={discoveries} />;
}
```

### Validation Checklist

- [ ] Selector hooks created for each feature (use-exploration-state.ts, use-world-state.ts)
- [ ] useMemo with minimal dependencies
- [ ] React.memo on subcomponents
- [ ] useCallback for all handlers
- [ ] No full `gameState` passed to components
- [ ] Profile with React DevTools: Max 1-2 re-renders per tick

---

## 🗺️ PATTERN 4: Viewport Culling (O(1) Rendering)

### Problem

Rendering 1000 chunks every frame via `.map()` is O(N):

```typescript
// ❌ WRONG: Renders all chunks every frame
{allChunks.map(chunk => <ChunkTile {...chunk} />)} // O(N)
```

### Solution: Spatial Filtering

**Rule:**
1. Store chunks in `Map<CoordinateKey, Chunk>` for O(1) lookup
2. Compute visible range in `useMemo`
3. Only render chunks within viewport
4. Use coordinate key to prevent duplicate renders

### Correct Pattern

```typescript
// ✅ CORRECT: Viewport culling
export function WorldMap() {
  const { gameState } = useGameStateContext();
  const VIEWPORT_RADIUS = 5; // Render 5x5 grid around player
  
  const visibleChunks = useMemo(() => {
    const chunks: Chunk[] = [];
    const { x, y } = gameState.playerPosition;
    
    for (let cx = x - VIEWPORT_RADIUS; cx <= x + VIEWPORT_RADIUS; cx++) {
      for (let cy = y - VIEWPORT_RADIUS; cy <= y + VIEWPORT_RADIUS; cy++) {
        const key = `${cx},${cy}`;
        const chunk = gameState.chunks.get(key); // O(1)
        if (chunk) chunks.push(chunk);
      }
    }
    return chunks;
  }, [gameState.chunks, gameState.playerPosition]);
  
  return (
    <div className="world-map">
      {visibleChunks.map(chunk => (
        <ChunkTile key={`${chunk.x},${chunk.y}`} chunk={chunk} />
      ))}
    </div>
  );
}
```

### Data Structure Requirements

**Store as Map, not Array:**

```typescript
// ✅ CORRECT: Map for O(1) lookup
gameState.chunks = new Map<string, Chunk>(); // "x,y" → Chunk
gameState.chunks.get(`${x},${y}`); // O(1)

// ❌ WRONG: Array requires O(N) find
gameState.chunks = []; // Chunk[]
gameState.chunks.find(c => c.x === x && c.y === y); // O(N)
```

### Validation Checklist

- [ ] Chunks stored in `Map<string, Chunk>`
- [ ] Visible range computed in `useMemo`
- [ ] Only render chunks within viewport
- [ ] Viewport radius configurable
- [ ] Profile shows O(visible area) not O(total chunks)

---

## 🎬 PATTERN 5: WeatherAdapter (Temporary Bridge)

### Problem

WeatherUseCase returns pure `[newState, effects]`, but game loop expects mutations.

### Solution: Adapter Pattern

**Rule:**
1. Call WeatherUseCase.update(gameState) → get [newWeatherState, effects]
2. Pass to `applyWeatherStateChanges()` adapter
3. Adapter selectively merges only weather fields
4. Return merged state to game loop

### Correct Pattern

```typescript
// ✅ CORRECT: Use adapter
import { applyWeatherStateChanges } from '@/core/adapters/weather-adapter';

export function useGameEngine() {
  const { weatherUsecase } = useGameEngine();
  
  const updateGame = useCallback((deltaTime: number) => {
    // Call usecase (pure)
    const weatherResult = weatherUsecase.update(gameState, deltaTime);
    
    // Apply via adapter (selective merge)
    const newState = applyWeatherStateChanges(gameState, weatherResult);
    
    // Atomic update
    setGameState(newState);
  }, [gameState, weatherUsecase]);
}
```

### Validation Checklist

- [ ] `applyWeatherStateChanges()` used in game loop
- [ ] Only weather fields updated
- [ ] Other state (player, inventory) unchanged
- [ ] No direct WeatherEngine mutation calls
- [ ] Validation done: `validateWeatherMerge(original, merged)`

---

## 🎨 PATTERN 6: Framer Motion for Game Feel (Hybrid Strategy)

### Problem

Tailwind transitions can't sequence animations or respond to state.

### Solution: Hybrid Approach

**Rule:**
1. **Framer Motion:** Complex, physics-based, state-dependent animations (game components)
2. **Tailwind:** Simple hover/focus transitions (UI primitives)
3. **Constraint:** Framer Motion only in `src/components/game/`, not `src/components/ui/`

### Correct Pattern

```typescript
// ✅ CORRECT: Framer Motion for game animations
import { motion } from 'framer-motion';

export function ExplorationResult() {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      Found Item!
    </motion.div>
  );
}

// ✅ CORRECT: Tailwind for simple transitions
export function Button({ isActive }: Props) {
  return (
    <button
      className={`transition-colors ${
        isActive ? 'bg-green-500' : 'bg-gray-500'
      }`}
    >
      Click Me
    </button>
  );
}
```

### Animation Constraints

- **Duration:** 300-800ms (keep snappy)
- **Easing:** Use `easeInOut` for natural feel
- **Stagger:** For lists, use `staggerChildren`
- **Avoid:** Keyframe animations with `@keyframes`; use Framer instead

### Validation Checklist

- [ ] Framer Motion only in `src/components/game/`
- [ ] Tailwind for `src/components/ui/`
- [ ] Animation duration 300-800ms
- [ ] No inline `@keyframes` definitions

---

## 💾 PATTERN 7: Save/Load Consistency

### Problem

If exploration discovery isn't saved to localStorage, F5 loses progress.

### Solution: Command Pattern for Consistency

**Rule:**
1. All state changes represented as **Commands** (serializable)
2. Commands logged to saveState
3. On reload, replay commands to restore state

### Correct Pattern

```typescript
// ✅ CORRECT: Dispatch command
dispatch({
  type: 'DISCOVER_LOCATION',
  payload: {
    location: 'Forest Glade',
    timestamp: Date.now(),
  },
});

// Command saved to localStorage automatically
// On reload, discovered locations restored from saved commands
```

### Validation Checklist

- [ ] All exploration discoveries saved to gameState
- [ ] gameState auto-saved (use existing auto-save hook)
- [ ] Test: Discover → reload → discovery persists
- [ ] No discoveries in local hook state

---

## 📊 Enforcement Checklist (Before Merging)

For **every new hook or component**, verify:

### Code Review Checklist

- [ ] **SSOT:** No local state copies of game data
- [ ] **DI:** Usecases obtained via `useGameEngine()`, no `new` calls
- [ ] **Selectors:** State slices extracted with `useMemo`
- [ ] **Memoization:** Components use `React.memo`, handlers use `useCallback`
- [ ] **Viewport:** Large lists use viewport culling or pagination
- [ ] **Animations:** Framer Motion in game components, Tailwind in UI
- [ ] **Save/Load:** All state changes persisted to gameState
- [ ] **Types:** No implicit any, full TypeScript coverage
- [ ] **TSDoc:** All exports documented with `@remarks`

### Performance Verification

```bash
# Profile re-renders
npm run dev  # Open React DevTools Profiler
# Check:
# - ExplorationPanel renders only when discoveries change
# - WorldMap renders visible chunks only (not all)
# - No re-renders on unrelated state changes

# Measure FPS
# Should maintain 60 FPS on typical mobile hardware
```

### Test Coverage

```bash
# Unit tests
npm run test -- --verbose

# Integration tests
npm run test -- integration

# Acceptance test (manual)
# 1. Click "Explore"
# 2. Discovery appears with animation
# 3. Reload page
# 4. Discovery still there
```

---

## 🚀 Evolution Plan

**Phase 1:** Enforce patterns in new hooks/components  
**Phase 2:** Refactor existing hooks to follow patterns  
**Phase 3:** Remove adapter pattern once game loop pure  

---

## 📞 Questions?

If unsure how to apply a pattern:
1. Check docs/CODING_PATTERNS.md for pattern template or docs/GUIDES_HOW_TO.md for practical example
2. Look at reference implementation (e.g., use-game-state.ts)
3. Ask before implementing
