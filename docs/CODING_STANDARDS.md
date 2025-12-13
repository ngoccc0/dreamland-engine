# CODING STANDARDS - CODE ORGANIZATION, STYLE & DOCUMENTATION

## TSDoc STANDARD (MANDATORY FOR ALL EXPORTS)

Every exported symbol must follow this template:

### Function/Method
```typescript
/**
 * [Short description of what this function does]
 *
 * @remarks
 * [Why does this logic exist? What problem does it solve?]
 * [Any edge cases or limitations?]
 * [Performance considerations?]
 *
 * @param {Type} paramName - [Description with units/format]
 * @param {Type} anotherParam - [Description]
 * @returns {Type} [Description of what is returned and when]
 *
 * @example
 * const result = functionName(arg1, arg2);
 * console.log(result);
 *
 * @throws {Error} If condition X, throws Error with message Y
 */
export function functionName(param1: Type, param2: Type): ReturnType {
  // implementation
}
```

### Type/Interface
```typescript
/**
 * Represents a creature with all game properties.
 *
 * @remarks
 * This is the core data structure for creatures in the game.
 * All creature entities (NPCs, bosses, wild animals) conform to this interface.
 * Used throughout combat, AI, and spawn systems.
 *
 * @example
 * const wolf: Creature = {
 *   id: 'wolf',
 *   name: { en: 'Wolf', vi: 'Sói' },
 *   hp: 50,
 *   damage: 8
 * };
 */
export interface Creature {
  id: string;
  name: TranslatableText;
  hp: number;
  damage: number;
  // ... more properties
}
```

### Class
```typescript
/**
 * Manages all game state transitions and effects.
 *
 * @remarks
 * This is the main orchestrator for the game engine. It handles:
 *   - State immutability (returns new state, never mutates)
 *   - Effect processing (side effects from actions)
 *   - Game loop synchronization
 *
 * Follows the Usecase pattern: Input → Process → Output([NewState, Effects])
 */
export class GameEngine {
  constructor() {
    // ...
  }
  
  /**
   * Processes a player action and returns new game state.
   *
   * @param state - Current game state
   * @param action - Action to perform
   * @returns [newState, effects] - New immutable state and side effects list
   */
  processAction(state: GameState, action: GameAction): [GameState, GameEffect[]] {
    // ...
  }
}
```

### Constant
```typescript
/**
 * Base damage for a wolf creature.
 * Used in combat calculations when a wolf attacks.
 * 
 * @remarks
 * This value is multiplied by creature level and player defense modifiers.
 * Can be tuned for game balance without code changes.
 */
export const WOLF_BASE_DAMAGE = 8;
```

### ANTI-PATTERNS (❌ DO NOT DO THIS)
```typescript
// ❌ NO: Vague comments
// calculates damage
function calculateDamage(attacker: Character, defender: Character): number {

// ❌ NO: No documentation at all
export function performAttack(attacker, defender) {

// ❌ NO: Incomplete JSDoc
/**
 * Does something
 */
export function doThing() {

// ❌ NO: Wrong format
// This function returns damage
// Used in combat
// Parameters: attacker, defender
// Returns: number
export function calculateDamage(...) {
```

---

## IMPORT ORGANIZATION

### Rule: Always use `@/*` alias paths (NEVER relative)

```typescript
// ✅ CORRECT - Use alias paths
import { performAttack } from '@/core/usecases/combat-usecase';
import type { Creature } from '@/core/types/creature';
import { useGameState } from '@/hooks/use-game-state';
import { animals } from '@/lib/game/data/creatures/animals';

// ❌ WRONG - No relative imports
import { performAttack } from '../../../core/usecases/combat-usecase';
import { animals } from '../../lib/game/data/creatures/animals';
```

### Import Order (within each file)
```typescript
// 1. External libraries (React, npm packages)
import React, { useState, useCallback } from 'react';
import type { FC } from 'react';

// 2. Internal types (only type imports)
import type { GameState } from '@/core/types/game';
import type { Creature } from '@/core/types/creature';

// 3. Internal code (usecases, engines, utils)
import { performAttack } from '@/core/usecases/combat-usecase';
import { GameEngine } from '@/core/engines/game-engine';
import { useGameState } from '@/hooks/use-game-state';

// 4. Data imports (static definitions)
import { animals } from '@/lib/game/data/creatures/animals';
import { getTranslatedText } from '@/lib/utils/translation';

// 5. Styles (CSS, SCSS)
import styles from './component.module.css';
```

### Type-Only Imports (Important for Performance)
```typescript
// ✅ CORRECT - Type-only imports
import type { Creature } from '@/core/types/creature';
import type { GameState } from '@/core/types/game';

export function performAttack(creature: Creature, state: GameState) {
  // ...
}

// ❌ WRONG - Importing type at runtime
import { Creature } from '@/core/types/creature';  // This should be type import
```

---

## NAMING CONVENTIONS

### Functions
- camelCase: `performAttack`, `calculateDamage`, `useGameState`
- Prefix with verb: `get`, `set`, `perform`, `calculate`, `process`, `handle`
- Hooks: Start with `use`: `useGameState`, `useActionHandler`, `useAnimation`
- Event handlers: Start with `handle`: `handleAttack`, `handleMove`

```typescript
// ✅ CORRECT
function calculateDamage(attacker: Creature): number { }
function performAttack(state: GameState, attacker: Creature): [GameState, Effect[]] { }
function useGameState() { }
function handleMove(direction: Direction) { }

// ❌ WRONG
function damage(attacker: Creature): number { }  // Not clear this calculates
function attack() { }  // Not clear it's async/returns state
function game() { }  // Not clear it's a hook
function move(direction: Direction) { }  // Not clear it's a handler
```

### Classes/Types/Interfaces
- PascalCase: `GameEngine`, `Creature`, `GameState`
- Interfaces: Often start with `I` for clarity: `IRepository`, `IGameEngine`
- Enums: PascalCase: `GameState`, `CreatureBehavior`

```typescript
// ✅ CORRECT
class GameEngine { }
interface IRepository { }
type GameState = { }
enum CreatureBehavior { AGGRESSIVE, PASSIVE, NEUTRAL }

// ❌ WRONG
class gameEngine { }
interface Repository { }  // Unclear if it's a type
type gameState { }
enum creature_behavior { }
```

### Variables/Constants
- Variables: camelCase: `playerPosition`, `currentState`
- Constants: UPPER_SNAKE_CASE: `DEFAULT_DAMAGE`, `MAX_HP`, `WORLD_WIDTH`
- Booleans: Prefix with `is`, `has`, `should`: `isAlive`, `hasWeapon`, `shouldRender`

```typescript
// ✅ CORRECT
const playerPosition = { x: 10, y: 20 };
const currentState = { ... };
const DEFAULT_DAMAGE = 10;
const MAX_HP = 100;
const isAlive = player.hp > 0;
const hasWeapon = player.inventory.length > 0;
const shouldRender = !isLoading && isVisible;

// ❌ WRONG
const player_position = { };  // Use camelCase
const CURRENT_STATE = { };    // Not a constant
const defaultDamage = 10;     // Should be UPPER_SNAKE_CASE for constants
```

### Files
- kebab-case: `game-engine.ts`, `use-game-state.ts`, `combat-usecase.ts`
- Exceptions: `index.ts`, `package.json`, `.env`

```typescript
// ✅ CORRECT
src/core/engines/game-engine.ts
src/hooks/use-game-state.ts
src/lib/utils/item-utils.ts

// ❌ WRONG
src/core/engines/GameEngine.ts
src/hooks/UseGameState.ts
src/lib/utils/ItemUtils.ts
```

---

## IMMUTABILITY & STATE MANAGEMENT

### Rule: ALWAYS return new state, NEVER mutate input

```typescript
// ✅ CORRECT - Immutable
function performAttack(attacker: Creature, defender: Creature): [Creature, Creature] {
  const damage = calculateDamage(attacker, defender);
  
  return [
    { ...attacker, stamina: attacker.stamina - 5 },
    { ...defender, hp: Math.max(0, defender.hp - damage) }
  ];
}

// ❌ WRONG - Mutation
function performAttack(attacker: Creature, defender: Creature): [Creature, Creature] {
  attacker.stamina -= 5;  // ❌ MUTATES input
  defender.hp -= calculateDamage(attacker, defender);  // ❌ MUTATES input
  return [attacker, defender];
}
```

### Nested Object Updates
```typescript
// ✅ CORRECT - Spread operator for nested updates
function updatePlayerInventory(player: Player, itemId: string): Player {
  return {
    ...player,
    inventory: {
      ...player.inventory,
      [itemId]: (player.inventory[itemId] ?? 0) + 1
    }
  };
}

// ❌ WRONG - Direct mutation
function updatePlayerInventory(player: Player, itemId: string): Player {
  player.inventory[itemId] = (player.inventory[itemId] ?? 0) + 1;  // ❌
  return player;
}
```

### Array Updates
```typescript
// ✅ CORRECT - Create new arrays
function addCreatureToParty(party: Creature[], creature: Creature): Creature[] {
  return [...party, creature];  // New array
}

function removeCreatureFromParty(party: Creature[], creatureId: string): Creature[] {
  return party.filter(c => c.id !== creatureId);  // New array
}

// ❌ WRONG - Mutating arrays
function addCreatureToParty(party: Creature[], creature: Creature): Creature[] {
  party.push(creature);  // ❌ MUTATES input
  return party;
}
```

---

## FUNCTION PATTERNS

### Usecase Pattern (Pure Functions)
All usecases MUST follow this pattern:

```typescript
/**
 * Performs an attack action, updating both attacker and defender.
 *
 * @remarks
 * Returns a tuple [newAttacker, newDefender] to maintain immutability.
 * Both creatures are returned with updated stats (stamina, hp, etc).
 * Side effects (sounds, animations) are NOT included here.
 *
 * @param attacker - The creature performing the attack
 * @param defender - The target creature
 * @returns [newAttacker, newDefender] - New immutable creatures
 */
export function performAttack(
  attacker: Creature,
  defender: Creature
): [Creature, Creature] {
  const damage = calculateDamage(attacker, defender);
  
  return [
    { ...attacker, stamina: attacker.stamina - 5 },
    { ...defender, hp: Math.max(0, defender.hp - damage) }
  ];
}
```

Pattern: `(input: Type): [NewType, SideEffect[]] => { ... }`

### Hook Pattern (React State Management)
All custom hooks follow this pattern:

```typescript
/**
 * Manages game state and action dispatch.
 *
 * @remarks
 * This hook:
 *   - Maintains game state in React state
 *   - Dispatches actions through usecases
 *   - Handles side effects (audio, particles, etc)
 *
 * @returns Object with state and action handlers
 */
export function useGameState() {
  const [state, setState] = useState<GameState>(initialState);
  
  const handleAttack = useCallback((creatureId: string) => {
    const creature = state.creatures[creatureId];
    const [newAttacker, newDefender] = performAttack(creature, state.player);
    
    setState(prev => ({
      ...prev,
      player: newDefender,
      creatures: { ...prev.creatures, [creatureId]: newAttacker }
    }));
  }, [state]);
  
  return { state, handleAttack };
}
```

Pattern: `useState(initial) → useCallback(handlers) → return { state, handlers }`

### Engine Pattern (Game Rules)
Engines contain pure math/logic:

```typescript
/**
 * Calculates damage based on attacker stats and defender defense.
 *
 * @remarks
 * Formula: (attacker.damage * (1 + level/10)) - (defender.defense * 0.5)
 * Damage is never negative, minimum 1.
 *
 * @param attacker - Source of damage
 * @param defender - Target of damage
 * @returns Calculated damage amount (minimum 1)
 */
export function calculateDamage(attacker: Creature, defender: Creature): number {
  const baseDamage = attacker.damage * (1 + attacker.level / 10);
  const defense = defender.defense * 0.5;
  return Math.max(1, baseDamage - defense);
}
```

Pattern: `(inputs: Types): OutputType => { ... }` (pure math)

---

## CODE ORGANIZATION WITHIN FILES

### Structure (Order matters)
```typescript
// 1. File header comment (if file >300 lines)
/**
 * @file combat-usecase.ts
 * @description Contains all combat-related usecase functions
 * 
 * RELATED FILES:
 *   - src/core/engines/combat-engine.ts (math)
 *   - src/hooks/use-combat.ts (orchestration)
 *   - src/lib/game/data/creatures/ (creature data)
 */

// 2. Imports (organized as per IMPORT ORGANIZATION section)
import type { Creature, GameState } from '@/core/types';
import { calculateDamage } from '@/core/engines/combat-engine';

// 3. Type definitions (only if specific to this file)
interface CombatResult {
  attacker: Creature;
  defender: Creature;
  damage: number;
}

// 4. Constants
const STAMINA_COST = 5;
const MIN_DAMAGE = 1;

// 5. Main exports (most important first)
export function performAttack(...) { }
export function performDefend(...) { }
export function calculateCritical(...) { }

// 6. Helper functions (if many, extract to separate file)
function applyStatusEffect(...) { }
function rollCritical(...) { }
```

### Comments vs TSDoc
- **TSDoc** (`/** */`): For exports, explains WHY and HOW to use
- **Line comments** (`//`): For complex logic inside functions, explains WHAT/WHY

```typescript
// ✅ CORRECT
/**
 * Calculates damage with critical hit chance.
 * @remarks Used in all attack actions
 */
export function calculateDamage(attacker: Creature): number {
  // Critical hits have 15% base chance, affected by luck stat
  const criticalChance = 0.15 + (attacker.luck * 0.01);
  
  if (Math.random() < criticalChance) {
    return baseAttack * 2;  // Double damage on critical
  }
  
  return baseAttack;
}

// ❌ WRONG
// calculates damage
function calculateDamage(attacker: Creature): number {
  const criticalChance = 0.15 + (attacker.luck * 0.01);
  if (Math.random() < criticalChance) {
    return baseAttack * 2;
  }
  return baseAttack;
}
```

---

## FILE SIZE LIMITS

**See ARCHITECTURE.md for detailed file size rules.**

### Quick Reference
| Category | Max Size |
|----------|----------|
| App/Page | 200 lines |
| Component | 200-300 lines |
| Hook | 250 lines |
| Usecase | 400 lines |
| Engine | 500 lines |
| Repository | 150 lines |
| Utility | 250 lines |

### If file exceeds limit:
1. Add comment header explaining the file's purpose and relationships
2. Break into smaller files or extract helpers
3. Use folder organization (e.g., `usecases/combat/` instead of single file)

```typescript
/**
 * @file combat-engine.ts
 * @description Creature behavior, damage calculation, and combat mechanics
 * 
 * RELATED FILES:
 *   - src/core/usecases/combat-usecase.ts (uses this engine)
 *   - src/hooks/use-combat.ts (orchestrates)
 *   - src/core/engines/effect-engine.ts (status effects)
 * 
 * REFACTORING NOTE: If this file grows beyond 500 lines, split into:
 *   - creature-behavior.ts (AI and behavior state machine)
 *   - combat-calculations.ts (damage, accuracy, critical)
 *   - creature-stats.ts (stat calculations)
 */
```

---

## TYPESCRIPT TYPES

### Always annotate parameters and returns
```typescript
// ✅ CORRECT
export function processCreature(creature: Creature, level: number): Creature {
  return { ...creature, level };
}

// ❌ WRONG - Missing types
export function processCreature(creature, level) {
  return { ...creature, level };
}

// ❌ WRONG - Implicit any
export function processCreature(creature: any, level: any): any {
  return { ...creature, level };
}
```

### Use strict typing in collections
```typescript
// ✅ CORRECT
const creatures: Creature[] = [];
const creatureMap: Record<string, Creature> = {};
const optionalCreature: Creature | null = null;

// ❌ WRONG
const creatures = [];  // any[]
const creatureMap = {};  // any
const optionalCreature;  // any
```

### Generics for reusable functions
```typescript
// ✅ CORRECT - Generic function
export function findById<T extends { id: string }>(
  items: T[],
  id: string
): T | undefined {
  return items.find(item => item.id === id);
}

// Usage:
const creature = findById<Creature>(creatures, 'wolf-1');
const item = findById<Item>(items, 'sword-1');

// ❌ WRONG - Duplicate function
function findCreatureById(creatures: Creature[], id: string): Creature | undefined { }
function findItemById(items: Item[], id: string): Item | undefined { }
```

---

## ERROR HANDLING

### Explicit error types
```typescript
// ✅ CORRECT
export function validateCreature(creature: Creature): void {
  if (!creature.id) {
    throw new Error(`Creature must have an id`);
  }
  if (creature.hp <= 0) {
    throw new Error(`Creature hp must be > 0, got ${creature.hp}`);
  }
}

// ❌ WRONG - Silent failures
export function validateCreature(creature: Creature): void {
  if (!creature.id) return;  // Silent failure, hard to debug
  if (creature.hp <= 0) return;
}
```

### Document error conditions in TSDoc
```typescript
/**
 * Processes a creature action.
 *
 * @throws {Error} If creature.id is not found in the game state
 * @throws {Error} If creature.stamina < action.cost
 */
export function processAction(state: GameState, creatureId: string): [GameState, Effect[]] {
  const creature = state.creatures[creatureId];
  if (!creature) {
    throw new Error(`Creature with id ${creatureId} not found`);
  }
  // ...
}
```

---
