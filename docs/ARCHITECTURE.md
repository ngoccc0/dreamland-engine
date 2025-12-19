# 🎯 DREAMLAND ENGINE - ARCHITECTURE

**Current State**: Event-Driven Statistics + Quest System (Phase 2.0)  
**Last Updated**: December 19, 2025  
**Status**: ✅ ACTIVE & FUNCTIONAL

---

## 📂 FOLDER STRUCTURE

```
src/
├── app/                          ← Next.js Framework
│   ├── layout.tsx
│   ├── page.tsx
│   ├── api/
│   ├── dev/
│   └── *.css
│
├── components/                   ← React UI
│   ├── game/                      → Game UI components
│   ├── ui/                        → Reusable UI primitives
│   └── client/
│
├── context/                      ← Context Providers
│   ├── auth-context.tsx
│   ├── language-context.tsx
│   ├── settings-context.tsx
│   └── pwa-install-context.tsx
│
├── core/                         ← Business Logic
│   ├── domain/                   → Zod schemas + inferred types
│   │   ├── entity.ts
│   │   ├── creature.ts
│   │   ├── item.ts
│   │   ├── gamestate.ts
│   │   └── index.ts
│   │
│   ├── data/                     → Static game data
│   │   ├── creatures/
│   │   │   ├── fauna.ts
│   │   │   ├── flora.ts
│   │   │   ├── minerals.ts
│   │   │   └── monsters.ts
│   │   │
│   │   ├── items/
│   │   │   ├── weapons.ts
│   │   │   ├── armor.ts
│   │   │   ├── consumables.ts
│   │   │   ├── materials.ts
│   │   │   └── tools.ts
│   │   │
│   │   ├── recipes/
│   │   │   └── index.ts
│   │   │
│   │   └── narrative/
│   │       ├── templates.ts
│   │       ├── lexicons.ts
│   │       └── schemas.ts
│   │
│   ├── rules/                    → Pure game logic (zero side effects)
│   │   ├── combat/
│   │   ├── farming/
│   │   ├── narrative/
│   │   ├── crafting.ts
│   │   ├── weather.ts
│   │   ├── rng.ts
│   │   └── index.ts
│   │
│   ├── usecases/                 → State orchestration + effects
│   │   ├── combat-usecase.ts
│   │   ├── farming-usecase.ts
│   │   ├── crafting-usecase.ts
│   │   ├── harvest-usecase.ts
│   │   ├── weather-usecase.ts
│   │   ├── quest-usecase.ts       ← Quest lifecycle (NEW)
│   │   ├── achievement-usecase.ts ← Achievement auto-evaluation (NEW)
│   │   └── index.ts
│   │
│   ├── entities/                 → Domain models
│   ├── repositories/             → Abstract persistence
│   ├── factories/                → Object creation
│   ├── generators/               → Procedural generation
│   ├── values/                   → Value objects
│   │
│   ├── types/                    → Type definitions
│   │   └── events.ts             ← Game events (NEW)
│   │
│   ├── engines/                  → Game mechanics
│   │   └── statistics/           ← Player behavior tracking (NEW)
│   │       ├── schemas.ts        → Context-aware metrics schema
│   │       ├── engine.ts         → Event processor
│   │       ├── query.ts          → Safe stat accessors
│   │       └── cleaner.ts        → Sparse data optimizer
│   │
│   └── data/                     → Static game data (EXPANDED)
│       ├── creatures/, items/, recipes/, narrative/ (existing)
│       └── quests/               ← Quest templates (NEW)
│           ├── quest-templates.ts
│           └── achievement-templates.ts
│
├── hooks/                        ← React hooks (state wiring)
│   ├── use-game-state.ts
│   ├── use-game-engine.ts
│   ├── use-effect-executor.ts    → Effect execution hub
│   ├── use-action-handlers.ts    → Action handlers
│   └── game-lifecycle/
│
├── infrastructure/               ← External services
│   ├── persistence/              → Database layer
│   └── audio/                    → Audio system
│
├── lib/                          ← Utilities
│   ├── audio/
│   ├── config/
│   ├── locales/
│   ├── utils/
│   ├── pathfinding/
│   └── narrative/
│
├── ai/                           ← AI/Genkit integration
└── __tests__/                    ← Tests
```

---

## 🏗️ CORE ARCHITECTURE

### Event-Driven Pattern

Every action follows this flow:

```
Action → Handler → Usecase (pure) → Outcome Data → 
generateEffects() → executeEffects()
```

**Components**:
- **Handler**: Captures outcome data before state mutation
- **Usecase**: Pure function returning [newState, sideEffects[]]
- **Effect Bridge**: Converts outcome → effect array
- **Effect Executor**: Hook executing effects atomically

### Side Effects (Tagged Unions)

```typescript
type SideEffect =
  | { type: 'PLAY_SOUND'; sfx: string }
  | { type: 'SHOW_NOTIFICATION'; message: string }
  | { type: 'SPAWN_PARTICLE'; x: number; y: number }
  | { type: 'TRIGGER_ANIMATION'; name: string }
  | { type: 'LOG_EVENT'; event: string; payload?: any };
```

**Benefits**: Serializable, type-safe, testable, network-safe

### Pure Rules (core/rules/)

Zero side effects, pure math:

```typescript
export function calculateDamage(atk: number, def: number): number {
  return Math.max(1, atk - def);
}
```

### Zod Schemas (core/domain/)

Runtime validation with inferred types:

```typescript
export const CreatureSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('fauna'),
    behavior: z.enum(['aggressive', 'passive', 'defensive']),
  }),
  z.object({
    type: z.literal('flora'),
    behavior: z.literal('immobile'),
  }),
]);

export type Creature = z.infer<typeof CreatureSchema>;
```

---

## 📋 RULES

### Import Rules

✅ **ALLOWED**:
- components/ → hooks/
- hooks/ → core/usecases/, infrastructure/
- core/usecases/ → core/rules/, core/domain/, core/data/
- core/rules/ → core/domain/ (types only)

❌ **FORBIDDEN**:
- components/ → core/ (bypass hooks)
- core/rules/ → core/data/, React, infrastructure/
- core/ → React (unless hooks/)

### File Size Limits

| Folder | Max Lines |
|--------|-----------|
| `core/domain/` | 200 |
| `core/data/creatures/` | 800 |
| `core/data/items/` | 500 |
| `core/rules/` | 500 |
| `core/usecases/` | 400 |
| `hooks/` | 250 |

### Naming

- **Files**: kebab-case (`use-game-state.ts`)
- **Types**: PascalCase (`GameState`, `Creature`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_DAMAGE`)

### No Duplicates

**Rule**: One file = one concept

❌ **FORBIDDEN**: `animals.ts` + `animals-v2.ts` + `animals-wild.ts`  
✅ **REQUIRED**: Consolidate into single `animals.ts`

---

## 📊 CURRENT IMPLEMENTATION

✅ **Effect Bridges** (4/4 complete):
- `combat-effects-bridge.ts` (183 lines)
- `skill-effects-bridge.ts` (228 lines)
- `item-effects-bridge.ts` (187 lines)
- `harvest-effects-bridge.ts` (133 lines)

✅ **Core Layers**:
- `core/domain/` - Zod schemas
- `core/data/` - Static data
- `core/rules/` - Pure logic
- `core/usecases/` - Orchestration
- `use-effect-executor.ts` - Effect execution

✅ **Test Coverage**: 559/574 passing (98%), 0 errors

---

## 🎯 ARCHITECTURAL DECISIONS

| # | Decision | Implementation |
|-|-|-|
| 1 | Type Safety | Zod discriminated unions |
| 2 | Side Effects | Tagged union objects (serializable) |
| 3 | Immutability | Spread operator for mutations |
| 4 | Rule Location | Domain-based folders |
| 5 | Data Separation | Code in rules, templates in data |
| 6 | Pure Functions | core/rules have zero side effects |
| 7 | Effect Execution | Centralized via useEffectExecutor |

---

## 📝 CODE STANDARDS

**TSDoc**: 100% on exports, logic in @remarks section  
**Comments**: Function purpose only, no phase/timeline references  
**Type Safety**: 0 TypeScript errors maintained  
**Tests**: 98%+ passing, 0 regressions

---

## 🆕 WHERE TO ADD NEW CODE

### Adding a New Game Rule

**Location**: `core/rules/[category]/`

Example: Combat rule for critical hits
```typescript
// src/core/rules/combat/critical.ts
export function calculateCriticalChance(luck: number): number { }
```

### Adding a New Usecase

**Location**: `core/usecases/[action]-usecase.ts`

Example: New skill system
```typescript
// src/core/usecases/skill-usecase.ts
export function performSkill(state: GameState, action: SkillAction) { }
```

### Adding a New Handler

**Location**: `hooks/use-action-handlers.[action].ts`

Example: New item type handler
```typescript
// hooks/use-action-handlers.itemEffect.ts
export function createHandleItemEffect() { }
```

---

## 📊 STATISTICS ENGINE (NEW - Phase 2.0)

### Concept: Single Source of Truth for Player Behavior

Instead of scattered counters (quest kills, crafting counts), all player actions feed into a centralized **PlayerStatistics** object.

### Architecture

```
Action (Combat, Gathering, Crafting)
    ↓
Side Effect (ApplyDamage, ItemGain, CraftSuccess)
    ↓
GameEvent (CREATURE_KILLED, ITEM_GATHERED, ITEM_CRAFTED)
    ↓
StatisticsEngine.processEvent() → Updates PlayerStatistics
    ↓
Uses StatsQuery to evaluate quests/achievements
    ↓
Quests & Achievements auto-complete when criteria satisfied
```

### Context-Aware Metrics (Sparse Data)

```typescript
// Only non-zero values stored
{
  combat: {
    kills: {
      total: 42,
      byCreatureType: { slime: 15, goblin: 27 },
      byLocation: { forest: 20, mountain: 22 },
      byWeapon: { sword_iron: 30 }
    }
  },
  gathering: {
    itemsCollected: {
      wood: { total: 150, byBiome: { forest: 150 } },
      iron_ore: { total: 45, byBiome: { mountain: 45 } }
    }
  }
}
```

### Query Layer (Safe Accessors)

```typescript
// All return number; undefined → 0
StatsQuery.getKillCount(stats, { creatureType: 'slime' }) // → 15
StatsQuery.hasGatheredItem(stats, 'wood', 10, { biome: 'forest' }) // → true
```

### Benefits

1. **Reusability**: Single evaluator for quests + achievements
2. **Performance**: O(1) object lookups, <0.5ms per event
3. **Extensibility**: New achievements need only new template, no code changes
4. **Save Optimization**: Sparse data keeps files <10KB

---

## 🎮 QUEST SYSTEM (NEW - Phase 2.0)

### Lifecycle

```
1. Player accepts quest
   ├─ Creates QuestRuntimeState (questId, status, startedAt)
   └─ Fetches template from QUEST_TEMPLATES
   
2. Actions update player stats
   ├─ StatisticsEngine processes events
   └─ UpdatePlayerStatistics in GameState
   
3. Quest evaluation (after each stat update)
   ├─ evaluateQuestProgress() checks criteria
   └─ If satisfied: completeQuest() → grant rewards
   
4. Rewards delivered
   ├─ addExperience effect
   ├─ grantLoot effect
   ├─ completeAchievement effects (cascading)
   └─ UI notifications + sounds
```

### Static vs Runtime Split

**Static (Never Saved)**:
```typescript
// src/core/data/quests/quest-templates.ts
{
  id: 'slay-five-slimes',
  title: 'Slay the Slime Horde',        // Text
  description: '...',                   // Text
  criteria: { type: 'KILL_CREATURE', params: { creatureType: 'slime', count: 5 } },
  rewards: { xp: 50, items: ['gold_25'] }
}
```

**Runtime (Saved in GameState)**:
```typescript
{
  questId: 'slay-five-slimes',          // Reference only
  status: 'active',                     // State
  startedAt: Date,                      // Metadata
  progress: { kills: 3 }                // Tracking
}
```

### Criteria Types

1. **KILL_CREATURE**: Kill N creatures (with optional filters: type, biome, weapon)
2. **GATHER_ITEM**: Gather N items (with optional filters: biome, tool)
3. **CRAFT_ITEM**: Craft N items (with optional filter: recipe)
4. **TRAVEL_DISTANCE**: Travel N units (with optional filter: biome)
5. **CUSTOM**: Custom logic (e.g., "reach ancient ruins")

### Achievement System (Identical Pattern)

Achievements use the same criteria schema as quests, but:
- Auto-evaluated when stats change (no player accept action)
- Unlock titles/badges instead of items
- Can cascade (quest completion → achievement unlocks)

### Adding New Quest

```typescript
// 1. Add to QUEST_TEMPLATES
'new-quest-id': {
  id: 'new-quest-id',
  title: 'Quest Title',
  description: 'Quest Description',
  criteria: { type: 'KILL_CREATURE', params: { creatureType: 'ogre', count: 10 } },
  rewards: { xp: 200, items: ['gold_100'] },
  repeatable: false,
}

// 2. That's it! Quest system auto-handles:
// - Starter UI integration
// - Progress tracking
// - Completion detection
// - Reward granting
```

---

### Adding New Type/Domain Model

**Location**: `core/domain/[model].ts`

Example: New combat system type
```typescript
// src/core/domain/combat.ts
export const CombatSchema = z.object({ });
export type Combat = z.infer<typeof CombatSchema>;
```

### Adding New Hook

**Location**: `hooks/use-[name].ts`

Example: Custom animation hook
```typescript
// hooks/use-animation.ts
export function useAnimation() { }
```

### Adding New Component

**Location**: `components/[category]/[component].tsx`

- Game UI: `components/game/[name].tsx`
- Reusable UI: `components/ui/[name].tsx`

### Adding Effect Type

**Location**: `hooks/use-effect-executor.ts` (SideEffect type)

```typescript
type SideEffect =
  | existing types...
  | { type: 'NEW_EFFECT_NAME'; /* payload */ }
```

### Adding Effect Bridge

**Location**: `core/engines/[action]-effects-bridge.ts`

Example: Harvest effects
```typescript
// src/core/engines/harvest-effects-bridge.ts
export interface HarvestOutcome { }
export function generateHarvestEffects(outcome: HarvestOutcome) { }
```

### File Size Exceeded?

1. Check max line count in ARCHITECTURE.md (File Organization section)
2. If file > limit:
   - Extract related functions to new file
   - Create subfolder if needed
   - Update imports
   - Keep index.ts for barrel export

