# CODE PATTERNS - Templates & Examples

See **CODING_STANDARDS.md** for documentation rules and file organization.

---

## Usecase Pattern (Pure Functions)

**Purpose**: Transform game state immutably, return [NewState, Effects[]]

### Template
```typescript
/**
 * [Description of what this action does]
 *
 * @remarks
 * This usecase:
 *   - [What it changes in state]
 *   - [How it calculates results]
 *   - [Any edge cases it handles]
 *
 * @param state - Current game state
 * @param input - Action parameters
 * @returns [newState, effects] - Immutable new state and side effects
 */
export function performAction(
  state: GameState,
  input: ActionInput
): [GameState, GameEffect[]] {
  // Pure function: no mutations, no side effects
  const newState = { ...state, /* changes */ };
  const effects: GameEffect[] = [/* side effects to apply */];
  
  return [newState, effects];
}
```

### Real Example
```typescript
/**
 * Attacks a target creature and returns updated states.
 *
 * @remarks
 * Calculates damage using the combat engine, applies to target.
 * Returns both attacker and defender with updated stats.
 * Handles zero-division edge case where defender hp is 0.
 *
 * @param attacker - The creature performing the attack
 * @param defender - The target creature
 * @returns [newAttacker, newDefender] - Updated creatures
 */
export function performAttack(
  attacker: Creature,
  defender: Creature
): [Creature, Creature] {
  const damage = calculateDamage(attacker, defender);
  
  return [
    { ...attacker, stamina: Math.max(0, attacker.stamina - 5) },
    { ...defender, hp: Math.max(0, defender.hp - damage) }
  ];
}
```

### Key Rules
- ✅ Input parameters are NEVER mutated
- ✅ Returns tuple: `[NewState, Effects[]]`
- ✅ NO React, NO side effects (DB, API, console.log)
- ✅ Pure math/logic only
- ✅ Must have @remarks explaining WHY

---

## Hook Pattern (React State Wiring)

**Purpose**: Bridge between React components and core game logic

### Template
```typescript
/**
 * [What this hook manages]
 *
 * @remarks
 * This hook:
 *   - Manages [what state it stores]
 *   - Calls usecases to [what it does]
 *   - Returns [what it returns]
 *
 * @returns Object with state and handlers
 */
export function useMyHook() {
  const [state, setState] = useState(initialState);
  
  const handleAction = useCallback((input: Input) => {
    const [newState, effects] = performAction(state, input);
    
    // Apply state update
    setState(newState);
    
    // Process effects (audio, particles, etc)
    effects.forEach(effect => applyEffect(effect));
  }, [state]);
  
  return { state, handleAction };
}
```

### Real Example
```typescript
/**
 * Manages all combat state and actions.
 *
 * @remarks
 * This hook:
 *   - Stores current combat state (player, enemies, turn)
 *   - Orchestrates combat usecases (attack, defend, skill)
 *   - Processes effects (damage numbers, animations, audio)
 *
 * @returns Object with { state, handleAttack, handleDefend, handleSkill }
 */
export function useCombat() {
  const [state, setState] = useState<CombatState>(initialCombatState);
  
  const handleAttack = useCallback((targetId: string) => {
    const [newState, effects] = performAttack(state.player, state.enemies[targetId]);
    
    setState(prev => ({
      ...prev,
      player: newState[0],
      enemies: { ...prev.enemies, [targetId]: newState[1] }
    }));
    
    // Process effects
    effects.forEach(effect => emitAudioEvent(effect));
  }, [state]);
  
  return { state, handleAttack };
}
```

### Key Rules
- ✅ Uses `useState` for React state
- ✅ Uses `useCallback` to memoize handlers
- ✅ Calls usecases, not directly mutating state
- ✅ Processes effects (audio, animations)
- ✅ Returns state and handlers

---

## Rules Pattern (core/rules/ - Pure Game Logic)

**Purpose**: Pure mathematical functions for game mechanics (no state mutations, no side effects)

### Template
```typescript
/**
 * [Calculation description]
 *
 * @remarks
 * **Formula:** [Mathematical expression]
 *
 * **Logic:**
 * 1. [Step 1]
 * 2. [Step 2]
 * 3. [Step 3]
 *
 * **Edge Cases:**
 * - [Boundary condition 1]
 * - [Boundary condition 2]
 *
 * @param input - Input parameters with type and range
 * @returns Output range and meaning
 *
 * @example
 * functionName(input) → output (description)
 */
export function calculateValue(input: number): number {
  // Pure calculation, no side effects, no mutations
  const result = input * 2;
  return Math.max(0, Math.min(100, result));  // Clamp to range
}
```

### Real Example (Combat Rule)
```typescript
/**
 * Calculates base damage before critical hit calculation.
 *
 * @remarks
 * **Formula:** `baseDamage = max(1, attack - defense)`
 *
 * **Logic:**
 * 1. Subtract defense from attack value
 * 2. Enforce minimum of 1 (no zero/negative damage)
 * 3. No multipliers applied (crit handled separately)
 *
 * **Edge Cases:**
 * - If defense >= attack: returns 1 (minimum guaranteed)
 * - Negative defense values: treated as 0 (no negative defense)
 *
 * @param attack - Attacker's attack stat (0+)
 * @param defense - Defender's defense stat (0+)
 * @returns Base damage (minimum 1)
 *
 * @example
 * calculateBaseDamage(20, 5) → 15
 * calculateBaseDamage(10, 10) → 1 (clamped to minimum)
 * calculateBaseDamage(10, 20) → 1 (defense wins)
 */
export function calculateBaseDamage(attack: number, defense: number): number {
  return Math.max(1, attack - defense);
}
```

### Key Rules
- ✅ Pure math, NO state mutations
- ✅ NO React, NO side effects (no console.log in production)
- ✅ Handles edge cases (min/max values, boundaries)
- ✅ Formula DOCUMENTED in @remarks (NOT in inline comments)
- ✅ Injectable dependencies (RNG passed as parameter for testing)
- ✅ File location: `src/core/rules/[category]/`

---

## Component Pattern (React UI)

**Purpose**: Display state, handle user input via hooks

### Template
```typescript
interface Props {
  // Props for component
}

/**
 * [Component description]
 *
 * @remarks
 * This component:
 *   - Displays [what]
 *   - Handles [what interactions]
 *   - Uses [which hooks]
 */
export function MyComponent({ prop1, prop2 }: Props) {
  const { state, handleAction } = useMyHook();
  
  return (
    <div>
      {/* Display state */}
      <div>{state.value}</div>
      
      {/* Handle user input */}
      <button onClick={() => handleAction()}>Action</button>
    </div>
  );
}
```

### Real Example
```typescript
interface InventoryPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Displays the player's inventory as a modal popup.
 *
 * @remarks
 * This component:
 *   - Gets inventory state from useGameState hook
 *   - Displays items organized by category
 *   - Handles item use/drop via handleUseItem from hook
 *   - Shows item details on hover
 */
export function InventoryPopup({ isOpen, onClose }: InventoryPopupProps) {
  const { state, handleUseItem } = useGameState();
  
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <div className="inventory-grid">
          {state.inventory.map(item => (
            <button
              key={item.id}
              onClick={() => handleUseItem(item.id)}
              title={item.description}
            >
              {item.emoji} {item.name}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Key Rules
- ✅ Display-only or calls hooks for actions
- ✅ NO direct core/usecases calls
- ✅ NO business logic
- ✅ Props well-typed
- ✅ Focused responsibility (one component = one UI element)

---

## Repository Pattern (Abstract Data Access)

**Purpose**: Define contracts for data access, hide implementation

### Template
```typescript
/**
 * Abstract interface for [data type] persistence.
 *
 * @remarks
 * Implementation classes:
 *   - IndexedDBCreatureRepository
 *   - FirebaseCreatureRepository
 *   - LocalStorageCreatureRepository (testing)
 */
export interface ICreatureRepository {
  /**
   * Retrieve creature by id
   */
  getById(id: string): Promise<Creature | null>;
  
  /**
   * Save creature
   */
  save(creature: Creature): Promise<void>;
  
  /**
   * List all creatures
   */
  listAll(): Promise<Creature[]>;
}
```

### Real Example
```typescript
/**
 * Abstract interface for weather persistence.
 *
 * @remarks
 * Weather state is persisted separately from game state.
 * Implementations handle storage across database backends.
 */
export interface IWeatherRepository {
  /**
   * Get current world weather
   */
  getWeather(worldId: string): Promise<Weather>;
  
  /**
   * Update weather state
   */
  updateWeather(worldId: string, weather: Weather): Promise<void>;
  
  /**
   * Get weather history (for statistics)
   */
  getWeatherHistory(worldId: string, days: number): Promise<Weather[]>;
}

// Concrete implementation
export class IndexedDBWeatherRepository implements IWeatherRepository {
  async getWeather(worldId: string): Promise<Weather> {
    const db = await getIndexedDB();
    return db.weather.get(worldId);
  }
  
  async updateWeather(worldId: string, weather: Weather): Promise<void> {
    const db = await getIndexedDB();
    await db.weather.put({ ...weather, worldId });
  }
}
```

### Key Rules
- ✅ Abstract interface defined in src/core/repositories/
- ✅ Concrete implementation in src/infrastructure/persistence/
- ✅ Methods return Promises (async data access)
- ✅ Used in hooks via dependency injection
- ✅ Makes swapping database backends easy

---

## Effect/Side-Effect Pattern

**Purpose**: Track side effects separately from state

### Template
```typescript
/**
 * Represents a side effect to be applied after state change.
 *
 * @remarks
 * Side effects are processed after state is updated.
 * This allows asynchronous operations (audio, animations, etc).
 */
interface GameEffect {
  type: string;  // 'audio', 'particle', 'animation', etc
  data: unknown;  // Payload for the effect
}

/**
 * Usecase that returns both state and effects.
 *
 * @remarks
 * The caller processes effects AFTER updating state.
 * This separates concerns: state logic vs effect logic.
 *
 * @returns [newState, effects] - State and side effects
 */
export function performAction(
  state: GameState,
  input: Input
): [GameState, GameEffect[]] {
  const newState = { ...state };
  const effects: GameEffect[] = [];
  
  // Side effects are listed, not executed
  effects.push({
    type: 'audio',
    data: { sound: 'sword_slash.mp3' }
  });
  
  effects.push({
    type: 'particle',
    data: { position: { x: 10, y: 20 }, effect: 'blood_splatter' }
  });
  
  return [newState, effects];
}
```

### Real Example
```typescript
export function performAttack(
  attacker: Creature,
  defender: Creature
): [Creature, Creature, GameEffect[]] {
  const damage = calculateDamage(attacker, defender);
  
  const effects: GameEffect[] = [
    {
      type: 'audio',
      data: { sound: 'attack.mp3', volume: 0.8 }
    },
    {
      type: 'particle',
      data: { 
        position: defender.position,
        effect: 'damage_number',
        text: damage.toString()
      }
    },
    {
      type: 'shake',
      data: { intensity: damage / 10 }
    }
  ];
  
  return [
    { ...attacker, stamina: attacker.stamina - 5 },
    { ...defender, hp: Math.max(0, defender.hp - damage) },
    effects
  ];
}

// Hook processes effects
const [newAttacker, newDefender, effects] = performAttack(attacker, defender);
effects.forEach(effect => {
  if (effect.type === 'audio') {
    audioManager.play(effect.data.sound);
  } else if (effect.type === 'particle') {
    particleEmitter.emit(effect.data);
  }
  // ... etc
});
```

### Key Rules
- ✅ Usecases return effects list, don't execute them
- ✅ Hooks process effects after state update
- ✅ Decouples state logic from side effects
- ✅ Makes testing easier (mock effects, not execute)

---

## Immutability Pattern

**Purpose**: Ensure state changes are observable and reversible

### Template
```typescript
// ✅ CORRECT - Using spread operator
function updatePlayerStats(player: Player, newHp: number): Player {
  return {
    ...player,
    hp: newHp,
    lastUpdated: Date.now()
  };
}

// ✅ CORRECT - Nested object update
function addItemToInventory(inventory: Inventory, item: Item): Inventory {
  return {
    ...inventory,
    items: [...inventory.items, item],
    count: inventory.count + 1
  };
}

// ✅ CORRECT - Array update
function removeCreatureFromParty(party: Creature[], id: string): Creature[] {
  return party.filter(c => c.id !== id);
}
```

### Anti-Pattern (❌ DO NOT DO THIS)
```typescript
// ❌ WRONG - Direct mutation
function updatePlayerStats(player: Player, newHp: number): Player {
  player.hp = newHp;  // MUTATION
  player.lastUpdated = Date.now();
  return player;
}

// ❌ WRONG - Array mutation
function removeCreatureFromParty(party: Creature[], id: string): Creature[] {
  party.splice(party.findIndex(c => c.id === id), 1);  // MUTATION
  return party;
}
```

### Key Rules
- ✅ Use spread operator: `{ ...object, field: newValue }`
- ✅ Use array methods: `.filter()`, `.map()`, `.concat()`
- ✅ Never use: `.push()`, `.splice()`, direct assignment
- ✅ Enables undo/redo, state snapshots, time-travel debugging

---

## Bilingual Text Pattern

**Purpose**: Support multiple languages (EN/VI)

### Template
```typescript
// ✅ CORRECT
const message = {
  en: 'Hello',
  vi: 'Xin chào'
};

const text = getTranslatedText(message, language);

// ✅ CORRECT - In data definitions
export const creatures = {
  wolf: {
    name: { en: 'Wolf', vi: 'Sói' },
    description: { en: 'A pack hunter', vi: 'Kẻ săn mồi theo bầy' }
  }
};

// ❌ WRONG - Direct access
const text = message.en;  // Doesn't respect language setting

// ❌ WRONG - Missing translation
const message = {
  en: 'Hello'
  // Missing vi
};
```

### Real Example
```typescript
export function useLanguage() {
  const [language, setLanguage] = useState<'en' | 'vi'>('en');
  
  const translate = useCallback((text: TranslatableText) => {
    return getTranslatedText(text, language);
  }, [language]);
  
  return { language, translate };
}

// In component
const { translate } = useLanguage();
const creatureName = translate(creature.name);  // Gets 'Wolf' or 'Sói'
```

### Key Rules
- ✅ Always define both EN and VI
- ✅ Use `getTranslatedText()` for lookup
- ✅ Never access `.en` or `.vi` directly
- ✅ Type: `{ en: string, vi: string }`

