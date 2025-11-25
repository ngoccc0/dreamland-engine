# Dreamland Engine - Comprehensive AI Copilot Instructions & Analysis

## Executive Summary

Dreamland Engine is an AI-driven narrative text adventure game built on **Next.js 14** with **Genkit AI** integration, **Dexie/IndexedDB** persistence, and **clean architecture** principles. It supports bilingual content (English/Vietnamese), modding via JSON/TypeScript bundles, and cross-platform deployment (web + Android via Capacitor).

---

## 1. Existing Conventions Found

**Location:** `.github/copilot-instructions.md` ✅

The existing file contains:
- Vietnamese + concise English versions (hợp nhất)
- Clean Architecture layers (Domain, Application/Usecases, Engines, Infrastructure)
- Mandatory practices: pre-code analysis, 3-part plan submission, logic deep dives for logic changes
- Key patterns: translations via `getTranslatedText()`, persistence via adapters, data-driven moddability
- Critical npm scripts (dev, test, typecheck, validate:narrative, precompute:copy, genkit:dev)
- Narrative validation workflow for CI

**Status:** This analysis **expands and validates** the existing file with discovered patterns and implementation examples.

---

## 2. Architecture Overview

### 2.1 Layer Structure (Clean Architecture)

```
┌─────────────────────────────────────────────────────┐
│  UI Layer (React Components)                        │
│  src/app/, src/components/                          │
│  - Calls hooks/usecases only                        │
│  - NO direct state mutations or IndexedDB access    │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  Application Layer (Usecases & Hooks)               │
│  src/core/usecases/, src/hooks/                     │
│  - Orchestrates domain & infrastructure             │
│  - Business process logic (farming, combat, etc.)   │
│  - State lifting & validation                       │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  Domain Layer (Types, Entities, Engines)            │
│  src/core/types/, src/core/entities/, engines/      │
│  - Pure business rules (no side effects)            │
│  - Effect system, creature logic, weather, combat   │
│  - Chunk/world generation, natural spawn rules      │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  Infrastructure & Integration Layer                 │
│  src/infrastructure/persistence/, src/ai/, src/lib/ │
│  - Dexie/IndexedDB adapter (save/load)              │
│  - Genkit AI flows (narrative, quests, items)       │
│  - Firebase (optional online mode)                  │
│  - Utilities: translations, item resolution, etc.   │
└─────────────────────────────────────────────────────┘
```

### 2.2 Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/core/types/` | Domain types (GameState, Chunk, Enemy, ItemDefinition, etc.) |
| `src/core/entities/` | Entity classes (Character, Skill, Experience, etc.) |
| `src/core/engines/` | Business rule engines (EffectEngine, CreatureEngine, PlantEngine, WeatherEngine, game-specific offline rules) |
| `src/core/usecases/` | Application layer orchestrators (farming, combat, exploration, skill, experience, weather, movement, world) |
| `src/core/values/` | Value objects (immutable, e.g., GridPosition) |
| `src/hooks/` | React hooks that wire UI ↔ usecases (use-action-handlers, use-game-engine, use-game-state, etc.) |
| `src/infrastructure/persistence/` | Repository adapters (IndexedDbGameStateRepository, FirebaseRepository, LocalStorageRepository) |
| `src/ai/flows/` | Genkit flows for LLM integration (generate-narrative-flow, generate-new-quest, fuse-items, etc.) |
| `src/ai/tools/` | Genkit tools (game-actions, world-generation, etc.) |
| `src/lib/game/` | Game-specific utilities and data (items, recipes, biomes, crafting, templates, event handlers) |
| `src/lib/locales/` | Bilingual translation strings (common.ts, items.ts, gameplay.ts, etc. for en/vi) |
| `src/lib/narrative/` | Narrative assembly & continuation logic (assembler.ts, state-manager, condition, selector) |
| `scripts/` | Build/validation scripts (precompute-narrative, validate-narrative-placeholders, copy-precomputed-to-public) |

---

## 3. Critical npm Scripts & Purposes

```powershell
# Core Development Commands
npm run dev                  # Start Next.js dev server on port 9003
npm run genkit:dev          # Start Genkit AI dev server (narrative flows)
npm run genkit:watch        # Watch & restart Genkit on file changes

# Type Safety & Validation
npm run typecheck           # TypeScript type checking (no emit)
npm run typecheck:file      # Type check single file

# Testing
npm run test                # Run Jest unit tests (jsdom environment)

# Build & Deployment
npm run build               # Build production Next.js bundle
npm start                   # Start production server

# Narrative & Content
npm run validate:narrative  # Validate narrative placeholder syntax
npm run precompute:copy     # Copy precomputed narrative assets to public/

# Documentation & Linting
npm run docs                # Generate TypeDoc API documentation
npm run docs:api:debug      # Generate with debug info
npm run lint                # Run ESLint

# Misc
npm run prepare             # Husky git hooks setup
```

### CI/CD Workflow (`.github/workflows/ci.yml`)
- Runs on PR to main/develop
- Steps: checkout → node:20 → npm ci → validate:narrative → lint → typecheck → test
- **Key**: Narrative validation runs early (CI gate)

---

## 4. Project-Specific Conventions & Discoverable Patterns

### Pattern 1: Translation with `getTranslatedText()`

**Files:** `src/lib/utils.ts` (main), applied in hooks/components

**Pattern:**
```typescript
import { getTranslatedText } from '@/lib/utils';
import type { TranslatableString, Language } from '@/core/types/i18n';

// Type: Can be string key, { key: string, params?: {} }, or { en: string, vi?: string }
const itemName = getTranslatedText(item.name, language, t);
const description = getTranslatedText({ en: 'Hello', vi: 'Xin chào' }, 'vi');
```

**Key Rules:**
- NEVER access `.en` or `.vi` directly on objects
- Use `getTranslatedText()` for all user-visible strings
- Supports inline translations, translation keys, and parameterized keys
- Falls back to English if Vietnamese unavailable
- `Language` type is `'en' | 'vi'`

**Examples in codebase:**
- `src/hooks/use-action-handlers.ts` — uses `getTranslatedText` throughout for narrative
- `src/lib/game/engine/offline.ts` — generates mood-based narrative with translations

**Application:** Whenever adding new UI text or item/NPC descriptions, use inline `{ en: '...', vi: '...' }` or add to `src/lib/locales/*.ts`.

---

### Pattern 2: Persistence via Repository Adapter

**Files:** `src/infrastructure/persistence/` (IndexedDbGameStateRepository, FirebaseRepository)

**Interface:** `IGameStateRepository`
```typescript
export interface IGameStateRepository {
  load(slotId: string): Promise<GameState | null>;
  save(slotId: string, state: GameState): Promise<void>;
  delete(slotId: string): Promise<void>;
  listSaveSummaries(): Promise<Array<SaveSummary | null>>;
}
```

**Pattern:**
- UI calls **usecases/hooks**, not repositories directly
- Hooks call appropriate repository (detected at runtime or injected)
- JSON serialization check (`JSON.stringify/parse`) to ensure no non-serializable values (functions, circular refs)
- Dexie returns `undefined` for missing records → converted to `null` by adapter

**Key Files:**
- `src/infrastructure/persistence/indexed-db.config.ts` — Dexie schema definition
- `src/infrastructure/persistence/indexed-db.repository.ts` — Implementation (load, save, delete, listSaveSummaries)
- `src/infrastructure/persistence/firebase.repository.ts` — Alternative for online mode

**When to modify:** Add new storage layers here; UI must never call Dexie directly.

---

### Pattern 3: Usecase Layer Orchestration

**Files:** `src/core/usecases/` (farming-usecase.ts, combat-usecase.ts, exploration-usecase.ts, etc.)

**Example: farming-usecase.ts**
```typescript
/**
 * Lightweight farming helpers. Pure functions that operate on a chunk.
 * They intentionally don't reach into repositories or engines — 
 * the caller (usecases / action handlers) should perform state wiring.
 */
export function tillSoil(chunk: Chunk): Chunk { /* ... */ }
export function waterTile(chunk: Chunk, durationTicks = 6): Chunk { /* ... */ }
export function fertilizeTile(chunk: Chunk, nutritionBoost = 20): Chunk { /* ... */ }
export function plantSeed(chunk: Chunk, seedId: string): { chunk: Chunk; planted: boolean } { /* ... */ }
```

**Pattern:**
- Pure functions, no side effects (no setState, no repository calls)
- Accept domain entities, return updated entities
- Caller (hook/action handler) wires state updates
- Test-friendly: no mocking needed for pure functions

**Key Usecases:**
- `combat-usecase.ts` — turn-based combat, loot drops
- `experience-usecase.ts` — XP/level calculations
- `exploration-usecase.ts` — chunk discovery, chunk generation
- `farming-usecase.ts` — tilling, watering, planting, fertilizing
- `skill-usecase.ts` — skill learning, leveling
- `weather-usecase.ts` — weather state transitions
- `world-usecase.ts` — world initialization, region management
- `movement-narrative.ts` — movement text generation

**When to add:** New game mechanic? Create a usecase file here.

---

### Pattern 4: Bilingual Item/NPC/Creature Definitions

**Files:** `src/lib/locales/` (items.ts, creatures.ts, etc.), `src/lib/game/data/` (creatures/, items/, recipes/), `src/lib/game/items.ts` (master item definitions)

**Example Structure:**
```typescript
// From src/lib/locales/items.ts
export const itemTranslations = {
  en: {
    items: {
      sword_name: 'Iron Sword',
      sword_desc: 'A sturdy blade forged in flame.',
      healing_potion_name: 'Healing Potion',
      // ...
    }
  },
  vi: {
    items: {
      sword_name: 'Kiếm Sắt',
      sword_desc: 'Một lưỡi kiếm chắc chắn được锻 trong lửa.',
      // ...
    }
  }
};

// From src/lib/game/items.ts
export const itemDefinitions: Record<string, ItemDefinition> = {
  iron_sword: {
    name: { en: 'Iron Sword', vi: 'Kiếm Sắt' },
    description: { en: 'A sturdy blade...', vi: 'Một lưỡi kiếm...' },
    tier: 2,
    category: 'Weapon',
    emoji: '⚔️',
    baseQuantity: { min: 1, max: 1 },
    effects: [],
    equipmentSlot: 'weapon',
    // ...
  }
};
```

**Key Rules:**
- Use **inline translations** `{ en: '...', vi: '...' }` for item/creature names and descriptions
- Content data (not game mechanics) goes in `src/lib/game/data/`
- Definitions should be **moddable** — use data-driven JSON bundles
- No hardcoded strings in code; all user text must be translatable

**Data-Driven Content:**
- Items: `src/lib/game/items.ts` (master catalog)
- Creatures/Enemies: `src/lib/game/data/creatures/*.ts`
- Recipes: `src/lib/game/recipes.ts`
- Structures/Buildings: `src/lib/game/structures.ts`

---

### Pattern 5: Domain Types with TSDoc

**Files:** `src/core/types/game.ts`, `src/core/types/effects.ts`, `src/core/types/weather.ts`, etc.

**Pattern:**
```typescript
/**
 * Represents an enemy entity in the game world.
 * This interface is designed for extensibility and modding.
 * 
 * @property type - The enemy's type/name (translatable)
 * @property hp - Hit points (reaches 0 = defeated)
 * @property damage - Base damage in combat
 * @property behavior - AI pattern ('aggressive', 'passive', 'defensive', etc.)
 * @property size - Size category ('small', 'medium', 'large')
 * @property diet - Array of item IDs this creature eats
 * @example
 * ```typescript
 * const goblin: Enemy = {
 *   type: { en: "Goblin", vi: "Yêu tinh" },
 *   hp: 30,
 *   damage: 5,
 *   behavior: "aggressive",
 *   size: "small",
 *   emoji: "👹"
 * };
 * ```
 */
export interface Enemy {
  type?: string | TranslatableString;
  hp: number;
  damage: number;
  behavior: 'aggressive' | 'passive' | 'defensive' | 'territorial';
  size: 'small' | 'medium' | 'large';
  diet: string[];
  satiation: number;
  maxSatiation: number;
  emoji: Icon;
  // ... more properties
}
```

**Key Rules:**
- All public types MUST have JSDoc with `@property`, `@example`, if complex
- Types should be **extensible** for modding (avoid sealed classes)
- Use `TranslatableString` for user-visible text in types
- Document constraints (value ranges, required fields)

---

### Pattern 6: Engine Business Logic

**Files:** `src/core/engines/effect-engine.ts`, `src/core/engines/creature-engine.ts`, `src/core/engines/plant-engine.ts`, `src/core/engines/weather-engine.ts`, `src/core/engines/game/offline.ts`, `src/core/engines/game/generation.ts`

**Example: analyze_chunk_mood() in offline.ts**
```typescript
/**
 * Analyzes chunk attributes to determine dominant mood tags.
 * Reads numeric values and assigns moods based on thresholds (0-100 range).
 * @param chunk Current chunk data
 * @returns Array of MoodTag describing chunk atmosphere
 */
export const analyze_chunk_mood = (chunk: Chunk): MoodTag[] => {
  const moods: MoodTag[] = [];
  
  if (chunk.dangerLevel >= 70) moods.push("Danger", "Foreboding");
  if (chunk.lightLevel <= 10) moods.push("Dark", "Gloomy", "Mysterious");
  // ... more rules
  
  return moods;
};
```

**Engines in Codebase:**
- **EffectEngine** (`effect-engine.ts`) — Manages buffs/debuffs, stacking, conditions
- **CreatureEngine** (`creature-engine.ts`) — Creature behavior simulation
- **PlantEngine** (`plant-engine.ts`) — Plant growth, maturity mechanics
- **WeatherEngine** (`weather-engine.ts`) — Dynamic weather generation & effects
- **Game Engines** (`game/offline.ts`, `game/generation.ts`, `game/crafting.ts`) — Offline narratives, chunk generation, crafting outcomes

**When to add:** New game mechanic requiring stateful rules? Create an engine class.

---

### Pattern 7: AI Flow Integration (Genkit)

**Files:** `src/ai/flows/generate-narrative-flow.ts`, `src/ai/flows/generate-new-quest.ts`, `src/ai/flows/fuse-items-flow.ts`, etc.

**Structure:**
```typescript
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define input/output schemas with Zod
export const GenerateNarrativeInputSchema = z.object({
  worldName: z.string(),
  playerAction: z.string(),
  playerStatus: PlayerStatusSchema,
  currentChunk: ChunkSchema,
  language: z.nativeEnum(Language),
  // ...
});

export type GenerateNarrativeInput = z.infer<typeof GenerateNarrativeInputSchema>;
export type GenerateNarrativeOutput = z.infer<typeof GenerateNarrativeOutputSchema>;

/**
 * Main narrative generation flow.
 * Called from UI hooks to generate dynamic narrative based on game state & player action.
 */
export async function generateNarrative(
  input: GenerateNarrativeInput
): Promise<GenerateNarrativeOutput> {
  const response = await ai.generate({
    model: 'googleai/gemini-2.0-flash',
    prompt: buildPrompt(input),
    output: { schema: GenerateNarrativeOutputSchema },
  });
  return response.output;
}
```

**Key Files:**
- `src/ai/genkit.ts` — Genkit initialization with Gemini plugin
- `src/ai/flows/generate-narrative-flow.ts` — Main narrative generation
- `src/ai/flows/generate-new-quest.ts` — Quest generation
- `src/ai/flows/generate-new-item.ts` — Item generation
- `src/ai/flows/fuse-items-flow.ts` — Item fusion mechanics
- `src/ai/tools/game-actions.ts` — Tools for game state queries

**Key Rules:**
- Use Zod for schema validation
- Mark files with `'use server'` (server-only functions)
- Return structured output (not free text)
- Call from hooks only (never directly from UI)
- Flows should be deterministic given input (for testing)

---

### Pattern 8: Hook-Based State Orchestration

**Files:** `src/hooks/use-game-engine.ts`, `src/hooks/use-action-handlers.ts`, `src/hooks/use-game-state.ts`

**Example: useActionHandlers (simplified)**
```typescript
/**
 * Central action dispatcher. Orchestrates all game actions:
 * - Player movement, combat, harvesting
 * - Item interactions, skill usage, crafting
 * - AI narrative generation, quest handling
 */
export function useActionHandlers(deps: ActionHandlerDeps) {
  const { playerStats, setPlayerStats, world, setWorld, ... } = deps;
  const { t, language } = useLanguage();
  
  // Helper to resolve item definition
  const resolveItemDef = (name: string) => resolveItemDefHelper(name, customItemDefinitions);
  
  // Main action dispatcher
  const handlePlayerAction = useCallback(async (action: Action) => {
    switch (action.type) {
      case 'move':
        // Create handle movement function & update state
        break;
      case 'attack':
        // Create handle attack function & update state
        break;
      // ... more actions
    }
  }, [playerStats, world, ...]);
  
  return {
    handlePlayerAction,
    handleMove,
    handleAttack,
    // ... other handlers
  };
}
```

**Key Hooks:**
- **useGameEngine** — Main orchestrator, assembles all specialized hooks
- **useGameState** — Raw game state management (world, player, chunks)
- **useActionHandlers** — Action dispatcher (what to do when player acts)
- **useGameEffects** — Side effect handlers (save on state change, game over check, audio)
- **useMoveOrchestrator** — Complex movement logic
- **useActionHelpers** — Helper utilities for actions

**Pattern:**
- One hook per major concern (SoC)
- UI calls only the highest-level hook (useGameEngine)
- Hooks wire usecases → state setters
- Use useCallback to avoid unnecessary re-renders

---

## 5. Cross-Component Integration Patterns

### Story Flow (How Actions Become Narrative)

```
┌─────────────────────────────────────────────────────────┐
│ 1. User Input (UI component)                            │
│    e.g., "Attack wolf"                                  │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. useActionHandlers dispatches action                  │
│    e.g., handleAttack(wolf, playerStats)                │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Combat Usecase/Engine calculates outcome            │
│    e.g., rollDice(), determine damage, loot             │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. State is updated (setPlayerStats, setWorld)         │
│    e.g., player.hp -= damage, world.enemies.remove()   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 5. AI Narrative Flow is called                         │
│    e.g., generateNarrative({                            │
│          playerAction: "attack wolf",                   │
│          successLevel: "CriticalSuccess",               │
│          currentChunk, playerStatus, ...                │
│        })                                                │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Narrative is added to log                           │
│    e.g., addNarrativeEntry("You strike...", "action")  │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 7. Save to persistence                                  │
│    e.g., repo.save(slotId, currentGameState)            │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 8. UI re-renders with new narrative                    │
│    (React state update triggers component re-render)    │
└─────────────────────────────────────────────────────────┘
```

### Data Flow: Modding (Custom Items)

```
User paste JSON mod bundle
        ↓
ValidationSchema check (Zod)
        ↓
setCustomItemDefinitions(record)
        ↓
Hooks read from customItemDefinitions
        ↓
resolveItemDef() finds custom item first, then master catalog
        ↓
UI displays custom item with its emoji, effects, stats
        ↓
Game logic (crafting, combat) uses custom definition
        ↓
Save to IndexedDB with full custom catalog
```

---

## 6. Testing & Validation Workflows

### Unit Test Pattern

**Location:** `src/core/usecases/__tests__/`, `src/lib/game/__tests__/`, etc.

**Example: farming-usecase.test.ts**
```typescript
import { tillSoil, waterTile, plantSeed } from '@/core/usecases/farming-usecase';

describe('farming-usecase', () => {
  test('plantSeed requires tilled soil', () => {
    const baseChunk: any = { soilType: 'untouched', plants: [] };
    const { planted } = plantSeed(baseChunk, 'wildflower_seeds');
    expect(planted).toBe(false);

    const tilled: any = { soilType: 'tilled', plants: [] };
    const { planted: planted2 } = plantSeed(tilled, 'wildflower_seeds');
    expect(planted2).toBe(true);
  });
});
```

**Key Rules:**
- Test pure usecases directly (no mocking needed)
- Use jsdom test environment (supports React components)
- Test inputs → outputs, not implementation details
- Mock external services (Genkit, Firebase) as needed

**Run:** `npm run test` (Jest)

### Narrative Validation Workflow

**Script:** `scripts/validate-narrative-placeholders.js`

**Purpose:** Ensures narrative templates have valid placeholder syntax

**When to run:** After editing `src/lib/narrative/` or narrative templates
```powershell
npm run validate:narrative
```

**CI Gate:** Runs in `.github/workflows/ci.yml` before tests

### Type Checking

**No-emit check (doesn't generate .js files):**
```powershell
npm run typecheck
```

**Runs in CI:** Required for all PRs to main/develop

---

## 7. Development Environment Setup

### Prerequisites
- Node.js 20+
- npm or yarn
- Environment variables (`.env.local`):
  ```
  GEMINI_API_KEY_PRIMARY=your_key_here
  # Optional: GEMINI_API_KEY_SECONDARY, FIREBASE_* for online mode
  ```

### Quick Start
```powershell
# Clone & install
git clone https://github.com/ngoccc0/dreamland-engine.git
cd dreamland-engine
npm install

# Terminal 1: Start dev server
npm run dev                 # http://localhost:9003

# Terminal 2: Start Genkit AI flows
npm run genkit:watch       # Auto-reload on changes

# In VS Code: Run tests in watch mode (optional)
npm test -- --watch
```

### Build & Deploy
```powershell
npm run build              # Next.js production bundle
npm start                  # Serve production build
npm run typecheck          # Validate before commit
npm run validate:narrative # Validate content
```

---

## 8. Key Code Examples by Task

### Adding a New Item Type
1. Create item definition in `src/lib/game/items.ts`:
   ```typescript
   export const itemDefinitions: Record<string, ItemDefinition> = {
     // ... existing items
     moonstone: {
       name: { en: 'Moonstone', vi: 'Đá Mặt Trăng' },
       description: { en: 'Glows in darkness', vi: 'Phát sáng trong tối tăm' },
       tier: 3,
       category: 'Magic',
       emoji: '🌙',
       baseQuantity: { min: 1, max: 3 },
       effects: [{ type: 'light', value: 50, duration: 600 }],
     }
   };
   ```
2. Update translations in `src/lib/locales/items.ts` if needed
3. Test: `npm run test`

### Adding a New Combat Action
1. Create handler in `src/hooks/use-action-handlers.*.ts`:
   ```typescript
   const handlePowerAttack = useCallback(async (target: Enemy) => {
     const dmg = (playerStats.str * 1.5 + rollDice('d6')) | 0;
     setPlayerStats(prev => ({
       ...prev,
       stamina: prev.stamina - 30
     }));
     setWorld(prev => updateEnemyHp(prev, target.id, -dmg));
     addNarrativeEntry(`You unleash a power attack!`, 'action');
     advanceGameTime();
   }, [playerStats, ...]);
   ```
2. Wire into `useActionHandlers` dispatcher
3. Test with Jest

### Adding Narrative for a New Biome
1. Add template to `src/lib/game/data/narrative-templates.ts`:
   ```typescript
   const biomeNarrativeTemplates = {
     // ... existing biomes
     void_biome: {
       enter: ['You step into the void...', 'Darkness surrounds you...'],
       // ... more templates
     }
   };
   ```
2. Add mood tags for void chunks (in `analyze_chunk_mood` engine)
3. Update translations for any UI text

---

## 9. Common Pitfalls & Solutions

| Pitfall | Solution |
|---------|----------|
| Accessing `.en`/`.vi` directly on translation objects | Use `getTranslatedText()` from `src/lib/utils.ts` |
| UI calling IndexedDB/repository directly | Wire through hooks/usecases only |
| Hardcoding item/enemy definitions | Use data-driven JSON in `src/lib/game/` + modding support |
| Not handling async narrative generation | Mark flow with `'use server'`; await in hook |
| Forgetting to handle both online/offline modes | Check `isOnline` setting; fallback to offline logic |
| Not testing pure usecases | Jest tests in `__tests__/` folder; pure functions don't need mocking |
| Mutation of state directly | Always use setters (React hooks) or return new objects (usecases) |
| Missing translations in both EN/VI | Use `{ en: '...', vi: '...' }` inline; test both languages |

---

## 10. Architecture Decision Records (ADRs)

### ADR-1: Clean Architecture with Separation of Concerns
**Decision:** Enforce distinct layers (UI → Usecases → Domain/Engines → Infra)  
**Rationale:** Easier testing, modularity for mods, UI decoupling from persistence  
**Impact:** All new features must respect layer boundaries; code review enforces this

### ADR-2: Bilingual-First Content
**Decision:** All user-visible text is `{ en: string, vi?: string }`  
**Rationale:** Community-driven localization, mod compatibility  
**Impact:** No English-only content; test both languages

### ADR-3: Data-Driven Modding via JSON/TypeScript
**Decision:** Items, enemies, recipes are JSON schemas; mods import as bundles  
**Rationale:** Non-programmers can mod; versioning via schema validation  
**Impact:** Content never hardcoded; modular definitions in `src/lib/game/`

### ADR-4: Genkit for Narrative Generation
**Decision:** Use Genkit flows with structured output (Zod schemas)  
**Rationale:** Flexible, multi-model support, type-safe prompts  
**Impact:** All AI calls via flows; output always validated; easy to swap models

---

## 11. Recommended AI Agent Workflow

### Before Writing Code
1. **Read & Understand**
   - Identify files mentioned in task (usecase, entity, hook, engine)
   - Trace data flow from UI → persistence
   - List files you've read in your plan

2. **Write a Short Plan (3 parts, <5 min)**
   - **Goal & Deliverable:** What will change? (1-2 sentences)
   - **Scope & Locations:** Which files/paths? (list paths)
   - **Architecture Options:** 2 options max, pros/cons, recommendation (1 sentence each)

3. **Implement**
   - Follow existing patterns exactly (copy-paste from examples if unsure)
   - Use usecase layer for business logic
   - Wire hooks for state updates
   - Add JSDoc for public functions

4. **Validate**
   - `npm run typecheck` — no type errors
   - `npm run test` — all tests pass (add tests if logic changed)
   - `npm run validate:narrative` — if narrative changed

### For Logic Changes (Business Rules)
Include:
- **Logic Deep Dive** (2-6 sentences): How does the change work?
- **Data Trace** (sample input → steps → output): 
  - Input example
  - 3-6 steps with variable values
  - Output & impact (1-2 sentences)

Example:
```
Logic Deep Dive:
The new fatigue system decreases max stamina by 10% per missing sleep cycle.
When player goes 3+ cycles without sleep, the malus accumulates. 
Resting fully (8 hrs in-game) resets the counter.

Data Trace:
Input: Player hasn't slept for 5 cycles; current maxStamina = 100
1. count_missed_sleep_cycles() → 5
2. fatigue_multiplier = 1 - (min(5, 4) * 0.1) = 0.6  [capped at 4]
3. new_maxStamina = 100 * 0.6 = 60
4. UI shows stamina bar at 60% capacity
5. Player rests → count_missed_sleep_cycles resets → multiplier = 1.0
Output: Maxstamina restored to 100. Effect: Penalty discourages sleeping skipping.
```

---

## 12. Glossary & Key Terms

| Term | Definition |
|------|-----------|
| **Chunk** | A single tile in the world grid; contains terrain, items, enemies, environmental attrs |
| **World** | Collection of 15×15 chunks around player; procedurally generated |
| **Biome** | Terrain type (forest, desert, mountain, etc.) with associated rules & mood tags |
| **Engine** | Pure business logic class (EffectEngine, WeatherEngine, etc.) |
| **Usecase** | Application layer function orchestrating domain + infra |
| **Hook** | React custom hook wiring usecases ↔ UI state |
| **Mood** | Descriptive tag for narrative (e.g., "Dark", "Peaceful", "Danger") |
| **TranslatableString** | `string \| { key: string; params? } \| { en: string; vi?: string }` |
| **Mod Bundle** | JSON/TS package with custom items, enemies, recipes, etc. |
| **Flow** | Genkit AI function with structured input/output (Zod schema) |
| **Repository** | Adapter abstracting persistence (IndexedDB, Firebase, LocalStorage) |

---

## 13. Further Reading

- `.github/copilot-instructions.md` — Existing conventions (Vietnamese + English)
- `README.md` — Project overview, gameplay, modding intro
- `docs/core_mechanics_report.md` — Detailed game systems (if exists)
- `docs/dreamland_engine_report.md` — Architecture deep dive (if exists)
- TypeDoc API docs: `npm run docs` → `docs/api/index.html`

---

## Summary: Rules for AI Agents

✅ **DO:**
- Read context before coding; write a 3-part plan
- Use `getTranslatedText()` for all user-visible text
- Implement logic in usecases (pure functions), not UI
- Wire state through hooks; never call repos/Dexie from UI
- Add JSDoc to public functions/types
- Test pure usecases; mock external services
- Follow existing patterns exactly (copy-paste when unsure)
- Run `npm run typecheck` + `npm run test` before submitting

❌ **DON'T:**
- Access `.en`/`.vi` directly; use `getTranslatedText()`
- Hardcode content (items, enemies, recipes); use data-driven JSON
- Call Firebase/IndexedDB from UI; use repository adapter
- Mutate state directly; use setters or return new objects
- Skip translations; always support en + vi
- Add logic to components; move to usecases/hooks
- Forget to include data traces for logic changes

**Last updated:** 2025-11-23  
**Branch:** chore/terrain-finalize  
**Genkit Model:** googleai/gemini-2.0-flash
