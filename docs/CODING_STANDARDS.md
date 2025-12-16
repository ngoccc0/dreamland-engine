# Coding Standards

## TSDoc Documentation (Mandatory for All Exports)

### Glass Box Standard: Logic in @remarks

For functions with complex logic or math:
- Move ALL formula explanations to `@remarks`
- Use markdown: bold, lists, code blocks
- Never hide logic in inline `//` comments

```typescript
/**
 * Calculates damage with defense mitigation.
 * 
 * @remarks
 * **Formula:** `max(1, attack - defense)`
 * 
 * **Logic:**
 * - Subtract defense from attack
 * - Clamp minimum to 1 (always deals some damage)
 * 
 * @param attack - Attacker's attack stat
 * @param defense - Defender's defense stat
 * @returns Damage dealt (minimum 1)
 */
export function calculateDamage(attack: number, defense: number): number {
  return Math.max(1, attack - defense);
}
```

### Required Documentation Elements

**Functions:**
```typescript
/**
 * [One sentence: what it does]
 * 
 * @remarks
 * [Why it exists, formula if applicable, edge cases]
 * 
 * @param name - [Type, range, typical value]
 * @returns [Type, meaning, when null]
 */
export function name(param: Type): ReturnType { }
```

**Interfaces/Types:**
```typescript
/**
 * [One sentence description]
 * 
 * @remarks
 * [What system uses this? Why is it structured this way?]
 */
export interface Name {
  field: Type;  // Purpose of this field
}
```

---

## File Naming

- **Files**: kebab-case (`use-game-state.ts`)
- **Types/Interfaces**: PascalCase (`GameState`, `Creature`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_DAMAGE`)
- **No version suffixes**: `creature-v2.ts` forbidden (consolidate instead)
- **Hooks**: `use-[name].ts` for React hooks

---

## TypeScript Best Practices

### Strict Types
```typescript
// ✅ GOOD
export function findById<T extends { id: string }>(
  items: T[],
  id: string
): T | undefined {
  return items.find(item => item.id === id);
}

// ❌ BAD - Implicit any
export function findById(items, id) { }
```

### Error Handling
```typescript
// ✅ GOOD - Explicit error messages
export function validate(creature: Creature): void {
  if (!creature.id) throw new Error(`Missing creature.id`);
  if (creature.hp <= 0) throw new Error(`HP must be > 0, got ${creature.hp}`);
}

// ❌ BAD - Silent failures
export function validate(creature: Creature): void {
  if (!creature.id) return;
  if (creature.hp <= 0) return;
}
```

### Discriminated Unions for Type Safety
```typescript
// ✅ GOOD - Type-safe effect handling
type SideEffect = 
  | { type: 'playAudio'; sound: string; volume: number }
  | { type: 'showNotification'; message: string; duration: number }
  | { type: 'logDebug'; message: string };

// Exhaustive match ensures all types handled
function executeEffect(effect: SideEffect): void {
  switch (effect.type) {
    case 'playAudio': audio.playSfx(effect.sound); break;
    case 'showNotification': toast.show(effect.message); break;
    case 'logDebug': console.debug(effect.message); break;
  }
}
```

---

## Comments

- Document **Why**, not **What** (code shows what)
- Remove commented-out code immediately
- No phase/task references (only code-focused comments)
- Use `// TODO:` for actual planned work

```typescript
// ✅ GOOD
export function isHealthy(hp: number, maxHp: number): boolean {
  // Creatures below 30% health are considered injured
  return hp > maxHp * 0.3;
}

// ❌ BAD
export function isHealthy(hp: number, maxHp: number): boolean {
  // Check if hp > 30% of maxHp (Phase 3B, Issue #42, TODO: refactor)
  return hp > maxHp * 0.3;
}
```

---

## Imports

- Use absolute paths: `@/core/domain` not `../../core/domain`
- Type imports: `import type { X } from` (zero runtime cost)
- No circular dependencies (use index.ts barrels to break cycles)

```typescript
import type { Creature } from '@/core/domain';
import { calculateDamage } from '@/core/rules/combat';
```

---

## State Immutability

Always use immutable updates:

```typescript
// ✅ CORRECT - Spread operator
function updatePlayer(player: Player, newHp: number): Player {
  return { ...player, hp: newHp };
}

// ✅ CORRECT - Array methods
function removeCreature(party: Creature[], id: string): Creature[] {
  return party.filter(c => c.id !== id);
}

// ❌ WRONG - Mutation
function updatePlayer(player: Player, newHp: number): Player {
  player.hp = newHp;  // MUTATION
  return player;
}
```

---

## File Organization

See **ARCHITECTURE.md** for:
- Folder structure
- Max file sizes
- Import rules
- Where to add new code

See **PATTERNS.md** for:
- Code templates (Usecase, Hook, Rule, Component)
- Real examples of each pattern
- Best practices for each pattern type
