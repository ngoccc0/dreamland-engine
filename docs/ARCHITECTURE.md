# ARCHITECTURE RULES - FOLDER STRUCTURE

## ROOT LEVEL: src/

### ├── app/ (Next.js Framework Layer)
**WHAT**: Next.js app directory, pages, API routes, layout
**CONTAINS**:
  - ✅ layout.tsx (root layout)
  - ✅ page.tsx (root page)
  - ✅ api/ (API routes)
  - ✅ dev/ (development pages)
  - ✅ *.css (global styles, animations)

**RULE**: NO business logic here. This is framework code only.
**ANTI-PATTERN**: 
  - ❌ Directly importing from lib/game/data/creatures/animals.ts
  - ❌ Calling game engines directly
  - ✅ PATTERN: Import from hooks/ only

**FILE SIZE**: Max 200 lines per file (layout/page can be larger)

---

### ├── components/ (React UI Components Layer)
**WHAT**: React components for rendering
**STRUCTURE**:
  - ├── game/          → Game-specific UI components
  - ├── ui/            → Reusable UI primitives (shadcn)
  - └── client/        → Client initialization components

#### components/game/ RULE:
**WHAT**: Game UI that displays state
**EXAMPLES**:
  - ✅ game-layout.tsx (frame/container)
  - ✅ inventory-popup.tsx (display inventory)
  - ✅ minimap.tsx (display map)
  - ✅ bottom-action-bar.tsx (action buttons)

**RULE**: Components here are DISPLAY-ONLY. State management via hooks.
**ANTI-PATTERN**:
  - ❌ Direct imports from core/usecases (do via hooks/)
  - ❌ Calling core/engines directly
  - ❌ Storing game state in component state (use context/hook)

**FILE SIZE**: Max 300 lines per file (break into smaller components if larger)

#### components/ui/ RULE:
**WHAT**: Reusable primitives (from shadcn or custom)
**EXAMPLES**:
  - ✅ button.tsx (Button component)
  - ✅ dialog.tsx (Dialog modal)
  - ✅ select.tsx (Select dropdown)

**RULE**: Agnostic to game logic. Reusable across any app.
**ANTI-PATTERN**:
  - ❌ Game-specific logic (that's components/game/)

**FILE SIZE**: Max 200 lines per file

---

### ├── context/ (React Context Providers)
**WHAT**: Global state providers
**CONTAINS**:
  - ✅ auth-context.tsx
  - ✅ language-context.tsx
  - ✅ settings-context.tsx
  - ✅ pwa-install-context.tsx

**RULE**: Only for cross-cutting concerns (auth, language, settings).
**ANTI-PATTERN**:
  - ❌ Game state here (that's in core/usecases + hooks/)
  - ❌ More than 4-5 providers (too many)

**FILE SIZE**: Max 150 lines per file

---

### ├── core/ (Business Logic Layer - GAME DOMAIN)

#### core/types/ (Domain Type Definitions)
**WHAT**: TypeScript interfaces, types, enums
**RULE**: **DEFINITIONS ONLY. NO IMPLEMENTATIONS.**
**CONTAINS**:
  - ✅ attributes.ts → Type definitions
  - ✅ creature.ts → Creature type interfaces
  - ✅ effects.ts → Effect type definitions
  - ✅ game.ts → Game state type interfaces
  - ✅ items.ts → Item type interfaces
  - ✅ definitions/ → Type interfaces for static data

**ANTI-PATTERN**:
  - ❌ Function implementations here
  - ❌ Class implementations here
  - ❌ Static data (creatures, items)

**FILE SIZE**: Max 300 lines per file (split if larger)

#### core/usecases/ (Pure Application Logic)
**WHAT**: Pure functions that transform state
**RULE**: **IMMUTABLE. NO SIDE EFFECTS. ALWAYS RETURN NEW STATE.**
**EXAMPLES**:
  - ✅ combat-usecase.ts
    → performAttack(attacker, defender) → [newAttacker, newDefender, effects[]]
  - ✅ farming-usecase.ts
    → plantCrop(state) → [newState, effects[]]
  - ✅ weather-usecase.ts
    → updateWeather(state) → [newState, effects[]]

**RULE**: Every function returns [NewState, Effects[]]
  - Input: current game state
  - Output: new game state + side effects list

**ANTI-PATTERN**:
  - ❌ Mutations: state.hp = 10 (WRONG)
  - ✅ Immutable: { ...state, hp: 10 } (RIGHT)
  - ❌ Direct DB access
  - ❌ Console.log or side effects

**FILE SIZE**: Max 400 lines per file (split usecases if larger)

#### core/engines/ (Game Mechanics)
**WHAT**: Math, RNG, game rules
**EXAMPLES**:
  - ✅ creature-engine.ts → Creature AI, behavior
  - ✅ effect-engine.ts → Status effects processing
  - ✅ plant-calculations.ts → Pure plant math functions
  - ✅ weather-engine.ts → Weather simulation
  - ✅ terrain/ → Terrain generation

**RULE**: Pure functions for game rules, calculations
**ANTI-PATTERN**:
  - ❌ Side effects (DB, API calls)

**FILE SIZE**: Max 500 lines per file (split if larger)

#### core/entities/ (Domain Models - Rarely Used)
**WHAT**: Classes/objects representing domain concepts
**RULE**: Mostly not needed (types/ + values/ sufficient)

#### core/repositories/ (Abstract Persistence)
**WHAT**: **INTERFACES ONLY. NO IMPLEMENTATIONS.**
**EXAMPLES**:
  - ✅ weather-repository.ts → interface IWeatherRepository { ... }
  - ✅ world-repository.ts → interface IWorldRepository { ... }
  - ✅ creature-repository.ts → interface ICreatureRepository { ... } (TODO)
  - ✅ item-repository.ts → interface IItemRepository { ... } (TODO)

**RULE**: Define contracts for data access
**ANTI-PATTERN**:
  - ❌ Concrete implementations (that's infrastructure/)
  - ❌ Direct DB queries

**FILE SIZE**: Max 150 lines per file

#### core/factories/ (Creation Logic)
**WHAT**: Factory functions to create objects
**RULE**: Pure functions that return new objects

**FILE SIZE**: Max 300 lines per file

#### core/generators/ (Generation Logic)
**WHAT**: Random generation, procedural content
**RULE**: Pure functions using deterministic RNG

**FILE SIZE**: Max 400 lines per file

#### core/values/ (Value Objects)
**WHAT**: Immutable value types
**EXAMPLES**:
  - ✅ Position { x, y } as immutable
  - ✅ Coordinate as value object

**FILE SIZE**: Max 200 lines per file

---

### ├── hooks/ (React Custom Hooks - State Wiring)
**WHAT**: Orchestrate game state, call usecases, manage React state
**RULE**: **BRIDGE between React components and core logic**

#### Pattern:
```typescript
export function useGameState() {
  const [state, setState] = useState(initialState);
  
  const handleAction = useCallback((action) => {
    const [newState, effects] = performAction(state, action);
    setState(newState);  // Update React state
    return effects;
  }, [state]);
  
  return { state, handleAction };
}
```

**STRUCTURE**:
  - ├── use-game-state.ts → Game state manager
  - ├── use-game-engine.ts → Engine orchestrator
  - ├── use-game-effects.ts → Effect processing
  - ├── use-action-handlers.*.ts → Action handlers
  - ├── game-lifecycle/ → Game loop management
  - └── *.ts → Specific concerns (camera, animation, etc.)

**RULE**: One hook = one responsibility
**ANTI-PATTERN**:
  - ❌ 25 specialized hooks for each action (consolidate)
  - ❌ Direct core/usecases calls in components
  - ✅ Call usecases via hooks

**FILE SIZE**: Max 250 lines per file (break specialized hooks into shared patterns)

---

### ├── infrastructure/ (Concrete Adapters)
**WHAT**: Implementation of repositories, external services

#### infrastructure/persistence/ (Data Access Layer)
**CONTAINS**:
  - ✅ indexed-db.repository.ts → IndexedDB implementation
  - ✅ firebase.repository.ts → Firebase implementation
  - ✅ local-storage.repository.ts → LocalStorage implementation
  - ✅ auto-save.service.ts → Auto-save logic
  - ✅ creature-repository.ts → Creature data access

**RULE**: Concrete DB operations, API calls
**ANTI-PATTERN**:
  - ❌ Business logic here
  - ❌ Direct usage in core/ (use repositories pattern)

**FILE SIZE**: Max 400 lines per file (split adapters if larger)

---

### ├── lib/ (Utilities & Static Data - LARGE FOLDER)

#### lib/audio/
**WHAT**: Audio utilities
**CONTAINS**: Audio loading, event dispatching

**FILE SIZE**: Max 300 lines per file

#### lib/config/
**WHAT**: Configuration files
**EXAMPLES**:
  - ✅ game-config.ts → Game settings
  - ✅ world-config.ts → World settings

**RULE**: Configuration constants only, not logic
**FILE SIZE**: Max 200 lines per file

#### lib/data/ (Static, Immutable Game Data)
**WHAT**: Pre-defined creatures, items, structures, skills
**RULE**: **READ-ONLY data. NO mutations.**
**STRUCTURE**:
  - ├── creatures/
  │   ├── animals.ts → Wild animals
  │   ├── bosses.ts → Boss creatures
  │   └── npcs.ts → NPCs
  - ├── items/
  │   ├── weapons.ts
  │   ├── armor.ts
  │   ├── consumables.ts
  │   ├── materials.ts
  │   └── tools.ts
  - ├── structures/
  │   ├── buildings.ts
  │   ├── decorations.ts
  │   └── resources.ts
  - └── skills/
      ├── combat-skills.ts
      ├── farming-skills.ts
      └── magic-skills.ts

**RULE**: One file = one concept, organized by category
**FILE SIZE**: 
  - Items: Each file per category (weapons.ts, armor.ts, etc.) - expected 200-500 lines
  - Creatures: One file per creature type (animals.ts, bosses.ts) - expected 300-800 lines
  - Skills: One file per skill type - expected 200-400 lines

**ANTI-PATTERN**:
  - ❌ animals.ts + animals-v2.ts (DUPLICATE!)
  - ❌ creatures.ts + creatures-full.ts (DUPLICATE!)
  - ✅ One file per concept, organized by sections in comments if large

**Example - CORRECT**:
```typescript
// creatures/animals.ts
export const animals: Record<string, CreatureDefinition> = {
  // === FOREST ANIMALS ===
  wolf: { ... },
  bear: { ... },
  
  // === SWAMP ANIMALS ===
  crocodile: { ... }
};
```

#### lib/definitions/
**WHAT**: Type definitions for static data
**EXAMPLES**:
  - ✅ creature.d.ts → Creature shape definition
  - ✅ item.d.ts → Item shape definition

**RULE**: Interfaces for static data structure (matches lib/data/)

**FILE SIZE**: Max 200 lines per file

#### lib/game/
**WHAT**: Game-specific utilities and structures
**STRUCTURE**:
  - ├── data/ → Game-specific data files (mirrors lib/data/)
  - ├── definitions/ → Data type interfaces
  - ├── engines/ → Game mechanic utilities (mirrors core/engines/)
  - ├── templates/ → Biome templates, terrain templates
  - ├── schemas/ → Zod/validation schemas
  - └── *.ts → Game utilities (items.ts, skills.ts, recipes.ts)

**RULE**: Game logic utilities, NOT business logic
**ANTI-PATTERN**:
  - ❌ Business logic here (that's core/)

**FILE SIZE**: Max 400 lines per file

#### lib/narrative/
**WHAT**: Text generation, narrative system
**STRUCTURE**:
  - ├── assembler.ts
  - ├── cache.ts
  - ├── condition.ts
  - ├── lexicon.ts
  - ├── rng.ts
  - ├── schemas.ts
  - ├── selector.ts
  - └── state-manager.ts

**RULE**: Deterministic narrative generation

**FILE SIZE**: Max 400 lines per file

#### lib/utils/ (Utility Functions)
**WHAT**: Helper functions
**STRUCTURE**:
  - ├── math.ts → Math utilities
  - ├── translation.ts → i18n utilities
  - ├── styling.ts → CSS/styling helpers
  - ├── item-utils.ts → Item helpers
  - ├── narrative.ts → Narrative helpers
  - └── index.ts → Re-exports

**RULE**: Pure, stateless functions

**FILE SIZE**: Max 250 lines per file

#### lib/locales/
**WHAT**: Translation files (EN/VI)
**RULE**: Bilingual text only

#### lib/pathfinding/
**WHAT**: Pathfinding algorithms

**FILE SIZE**: Max 300 lines per file

#### lib/logger.ts
**WHAT**: Logging utility

---

### ├── ai/ (AI/Genkit Integration)
**WHAT**: AI model integration, generation flows
**CONTAINS**:
  - ✅ client.ts → AI client
  - ✅ genkit.ts → Genkit setup
  - ✅ schemas.ts → AI schemas
  - ✅ flows/ → Generation flows
  - ✅ tools/ → AI tools

**RULE**: Isolated from core game logic

**FILE SIZE**: Max 400 lines per file

---

### ├── __tests__/ (Test Files)
**WHAT**: Integration & smoke tests
**CONTAINS**:
  - ✅ combat.smoke.test.ts
  - ✅ farming.smoke.test.ts
  - ✅ game-loop.smoke.test.ts

**RULE**: Test critical user flows

---

## CROSS-FOLDER IMPORT RULES

### ✅ ALLOWED IMPORTS
```typescript
// From app/ (pages/layout)
import { useGameState } from '@/hooks/use-game-state';  // OK

// From components/
import { useGameState } from '@/hooks/use-game-state';  // OK
import { Button } from '@/components/ui/button';        // OK

// From hooks/
import { performAttack } from '@/core/usecases/combat-usecase';  // OK
import type { GameState } from '@/core/types/game';     // OK

// From core/usecases/
import type { Character } from '@/core/types/creature'; // OK
import { rollDamage } from '@/core/engines/combat';     // OK (cross-layer OK)

// From lib/
import { getCreatureDefinition } from '@/lib/game/definitions/creatures';  // OK
import { getTranslatedText } from '@/lib/utils';        // OK
```

### ❌ FORBIDDEN IMPORTS
```typescript
// From app/ (NO core/usecases directly)
import { performAttack } from '@/core/usecases/combat-usecase';  // ❌ BAD

// From components/ (NO core/ directly)
import { performAttack } from '@/core/usecases/combat-usecase';  // ❌ BAD

// From core/usecases/ (NO React, NO infrastructure/)
import { useState } from 'react';                       // ❌ BAD
import db from '@/infrastructure/persistence';         // ❌ BAD

// From lib/ (NO core/usecases that touch lib/game/data)
import { animals } from '@/lib/game/data/creatures/animals';  // OK
// But DON'T copy data into usecase, pass via parameters
```

---

## FILE SIZE RULES

### MAXIMUM FILE SIZES
| Folder | Max Lines | Notes |
|--------|-----------|-------|
| app/ | 200 | Pages/layout only |
| components/ui/ | 200 | UI primitives |
| components/game/ | 300 | Break into smaller components if larger |
| context/ | 150 | Keep context providers simple |
| core/types/ | 300 | Type definitions, can split into multiple files |
| core/usecases/ | 400 | One usecase = one file; split if larger |
| core/engines/ | 500 | Complex game rules; refactor if >500 |
| core/repositories/ | 150 | Interface definitions only |
| core/factories/ | 300 | Factory functions |
| core/generators/ | 400 | Generation logic |
| hooks/ | 250 | Break specialized hooks into shared patterns |
| infrastructure/persistence/ | 400 | Repository implementations |
| lib/config/ | 200 | Config constants |
| lib/data/creatures/ | 800 | One file per creature category (animals, bosses, npcs) |
| lib/data/items/ | 500 | One file per item category (weapons, armor, etc.) |
| lib/data/skills/ | 400 | One file per skill category |
| lib/game/ | 400 | Game utilities |
| lib/narrative/ | 400 | Narrative components |
| lib/utils/ | 250 | Utility functions |

### RULE: IF FILE EXCEEDS MAX SIZE
1. **Analyze the file**
   - Is it doing multiple things? Break it into separate files/modules
   - Is one concept too large? Extract into sub-folders

2. **Refactor strategy**
   ```typescript
   // If core/usecases/combat-usecase.ts exceeds 400 lines:
   // BEFORE (single 500-line file):
   // - performAttack()
   // - calculateDamage()
   // - applyStatusEffect()
   // - rollCriticalHit()
   
   // AFTER (split into 2-3 files):
   // - core/usecases/combat/attack.usecase.ts (200 lines)
   // - core/usecases/combat/damage.usecase.ts (150 lines)
   // - core/usecases/combat/effects.usecase.ts (100 lines)
   ```

3. **Add Comment Header**
   Add this to the top of the file for clarity:
   ```typescript
   /**
    * @file creature-engine.ts
    * @description Game mechanics for creature behavior, AI, and interactions
    * 
    * RELATED FILES:
    *   - src/core/usecases/combat-usecase.ts → Uses creature AI from this engine
    *   - src/lib/game/data/creatures/animals.ts → Creature definitions
    *   - src/hooks/use-game-engine.ts → Orchestrates this engine
    * 
    * RESPONSIBILITIES:
    *   - Creature AI logic (aggression, fleeing, etc.)
    *   - Creature stat calculations
    *   - Creature behavior state machine
    * 
    * DEPENDENCIES:
    *   - core/types/creature.ts (types only)
    *   - core/engines/effect-engine.ts (status effects)
    * 
    * NOTE: This file was kept at ~600 lines to keep creature AI logic
    * centralized. If it grows beyond 800 lines, split into:
    *   - creature-ai.ts
    *   - creature-stats.ts
    */
   ```

---

## FILE NAMING RULES

### Kebab-case for Files
```typescript
✅ use-game-state.ts
✅ creature-engine.ts
✅ combat-usecase.ts
❌ UseGameState.ts
❌ creatureEngine.ts
```

### PascalCase for Classes/Types
```typescript
✅ class GameEngine { }
✅ type GameState = { }
✅ interface IRepository { }
❌ class gameEngine { }
```

### CONSTANT_UPPER_SNAKE_CASE
```typescript
✅ const DEFAULT_DAMAGE = 10;
✅ const MAX_HP = 100;
❌ const defaultDamage = 10;
```

---

## EXPORT RULES

### ✅ USE NAMED EXPORTS
```typescript
export function performAttack(...) { }
export type GameState = { };
export const DEFAULT_DAMAGE = 10;
```

### ❌ AVOID DEFAULT EXPORTS
```typescript
export default performAttack;  // Don't mix with named
```

---

## CONSOLIDATION RULES: NO DUPLICATES

### PROBLEM: Duplicate Files
Currently may exist:
- animals.ts (creatures)
- creatures.ts (duplicated content?)
- creatures-full.ts (???)

### RULE: **Before creating NEW file, check if similar exists**

**CHECKLIST**:
1. File already exists?
   - ✅ YES → Add to existing file (merge)
   - ❌ NO → Create new file

2. Content overlaps 50%+ with existing file?
   - ✅ YES → MERGE, don't create new
   - ❌ NO → Safe to create new

3. File naming conflicts?
   - ✅ YES → Consolidate (one file per concept)
   - ❌ NO → OK

### EXAMPLE - WRONG:
```
lib/game/data/creatures/
  ├── animals.ts (10 creatures)
  ├── animals-forest.ts (5 creatures)  ← DUPLICATE!
  ├── animals-wild.ts (7 creatures)    ← DUPLICATE!
```

### EXAMPLE - CORRECT:
```
lib/game/data/creatures/
  ├── animals.ts (22 creatures total, organized by biome in comments)
```
