# HOW-TO GUIDES - Practical Instructions

Step-by-step guides for common Dreamland Engine tasks. For architectural patterns, see **CODING_PATTERNS.md**.

---

## How to Add a New Quest

### Overview
Quests are defined once in a template (never changes), then tracked in GameState.activeQuests[] at runtime.
The system auto-evaluates progress and auto-completes when criteria are met.

### Step 1: Define Quest Template

Open `src/core/data/quests/quest-templates.ts`:

```typescript
export const QUEST_TEMPLATES = {
  // ... existing quests
  
  collect_moonflowers: {
    id: 'collect_moonflowers',
    name: { en: 'Gather Moonflowers', vi: 'Thu hoạch Hoa Trăng' },
    description: { 
      en: 'Collect 10 moonflowers from the enchanted forest',
      vi: 'Thu hoạch 10 hoa trăng từ rừng phù thủy'
    },
    reward: {
      xp: 500,
      items: [{ itemId: 'moonflower_bouquet', quantity: 1 }]
    },
    criteria: [
      {
        type: 'GATHER_ITEM' as const,
        itemId: 'moonflower',
        targetQuantity: 10,
        filters: {
          biome: 'forest'
        }
      }
    ]
  }
} as const;
```

### Step 2: That's It!

The quest system will:
1. ✅ Appear in the quest list when started
2. ✅ Auto-evaluate progress based on player actions
3. ✅ Auto-complete when 10 moonflowers gathered from forest
4. ✅ Award 500 XP + 1 moonflower_bouquet
5. ✅ Trigger any dependent achievements

No other code changes needed!

### Criteria Types Available

```typescript
// Kill creatures
{
  type: 'KILL_CREATURE',
  creatureType: 'goblin',
  targetQuantity: 5,
  filters?: {
    weapon?: 'sword',           // Only kills with sword
    biome?: 'mountain',         // Only in mountains
    level?: { min: 5, max: 10 } // Level range
  }
}

// Gather items
{
  type: 'GATHER_ITEM',
  itemId: 'wood',
  targetQuantity: 20,
  filters?: {
    biome?: 'forest',           // Only in forests
    tool?: 'axe'                // Only with axe
  }
}

// Craft items
{
  type: 'CRAFT_ITEM',
  itemId: 'iron_sword',
  targetQuantity: 3,
  filters?: {
    recipe?: 'blacksmith_craft' // Specific recipe
  }
}

// Travel distance
{
  type: 'TRAVEL_DISTANCE',
  targetQuantity: 1000,         // 1000 units
  filters?: {
    biome?: 'desert'            // Only in desert
  }
}

// Custom logic
{
  type: 'CUSTOM',
  customId: 'reach_ancient_ruins',
  evaluate: (history: ActionHistory) => {
    // Return 0.0 - 1.0 progress
  }
}
```

### Adding Multiple Criteria (All Must Pass)

```typescript
criteria: [
  {
    type: 'GATHER_ITEM',
    itemId: 'wood',
    targetQuantity: 10,
    filters: { biome: 'forest' }
  },
  {
    type: 'GATHER_ITEM',
    itemId: 'stone',
    targetQuantity: 5,
    filters: { biome: 'mountain' }
  }
]
// Completes when BOTH are done
```

### Testing Your Quest

1. Start the quest in game
2. Perform the required action (gather moonflower in forest)
3. Open console: should see `Quest 'collect_moonflowers' progress: 0.1` (for 1/10)
4. When complete: auto-notification + quest marked done

---

## How to Add an Achievement

### Overview
Achievements are like quests but auto-evaluated.
They unlock when criteria are met (no player "accept" action).

### Step 1: Define Achievement Template

Open `src/core/data/achievements/achievement-templates.ts`:

```typescript
export const ACHIEVEMENT_TEMPLATES = {
  // ... existing achievements
  
  lumberjack: {
    id: 'lumberjack',
    name: { en: 'Lumberjack', vi: 'Lâm Công' },
    description: { 
      en: 'Gather 100 wood from forests',
      vi: 'Thu hoạch 100 gỗ từ rừng'
    },
    rarity: 'uncommon' as const,
    badge: '🪵',
    criteria: [
      {
        type: 'GATHER_ITEM',
        itemId: 'wood',
        targetQuantity: 100,
        filters: { biome: 'forest' }
      }
    ]
  }
} as const;
```

### Step 2: That's It!

The achievement system will:
1. ✅ Monitor player actions automatically
2. ✅ Unlock when 100 wood gathered from forests
3. ✅ Show notification: "🪵 Lumberjack Unlocked!"
4. ✅ Add to player's unlocked achievements list

No other code changes needed!

### Rarity Levels (Visual)

```typescript
rarity: 'common'    // Gray badge
rarity: 'uncommon'  // Blue badge
rarity: 'rare'      // Purple badge
rarity: 'legendary' // Gold badge
```

### Cascading Achievements (Optional)

Achievement can trigger based on quest completion:

```typescript
criteria: [
  {
    type: 'QUEST_COMPLETED',
    questId: 'collect_moonflowers',
    targetQuantity: 1
  }
]
// Unlocks when quest 'collect_moonflowers' is done
```

---

## How to Extend Statistics

### Overview
Statistics track player actions in 4 categories: combat, gathering, crafting, exploration.
Add a new statistic by modifying the schema, then emit events.

### Step 1: Update Statistics Schema

Open `src/core/domain/statistics.ts`:

```typescript
export const StatisticsSchema = z.object({
  // ... existing categories
  
  combat: z.object({
    // ... existing combat stats
    spellsCast: z.object({        // NEW
      total: z.number().default(0),
      bySpellId: z.record(z.number()).optional(),
      byLocation: z.record(z.number()).optional()
    }).optional()
  }),
  
  // ... rest
});
```

### Step 2: Emit Event When Action Happens

In your action handler (e.g., `src/hooks/use-action-handlers.ts`):

```typescript
const handleCastSpell = useCallback((spellId: string) => {
  // ... cast spell logic
  
  // Emit event for statistics
  emitEvent({
    type: 'SPELL_CAST',
    spellId,
    location: playerPosition,
    timestamp: Date.now()
  } as GameEvent);
  
}, []);
```

### Step 3: Handle Event in Statistics Engine

Open `src/core/statistics/statistics-engine.ts`:

```typescript
export function processStatisticsEvent(
  stats: Statistics,
  event: GameEvent
): Statistics {
  switch (event.type) {
    // ... existing cases
    
    case 'SPELL_CAST': {
      const castEvent = event as SpellCastEvent;
      return {
        ...stats,
        combat: {
          ...stats.combat,
          spellsCast: {
            total: (stats.combat?.spellsCast?.total ?? 0) + 1,
            bySpellId: {
              ...stats.combat?.spellsCast?.bySpellId,
              [castEvent.spellId]: ((stats.combat?.spellsCast?.bySpellId?.[castEvent.spellId] ?? 0) + 1)
            }
          }
        }
      };
    }
    
    default:
      return stats;
  }
}
```

### Step 4: Query in Quests/Achievements

```typescript
export function evaluateSpellCastQuest(
  stats: Statistics,
  quest: QuestTemplate
): number {
  const totalSpells = stats.combat?.spellsCast?.total ?? 0;
  return Math.min(1.0, totalSpells / 10);  // Progress for 10 spells
}
```

---

## How to Add a New Event Type

### Step 1: Define Event Schema

Open `src/core/types/events.ts`:

```typescript
export const GameEventSchema: z.ZodType<GameEvent> = z.discriminatedUnion('type', [
  // ... existing events
  
  z.object({
    type: z.literal('SPELL_CAST'),
    spellId: z.string(),
    location: z.object({ biome: z.string(), x: z.number(), y: z.number() }),
    timestamp: z.number(),
    // Any other spell-specific data
  }),
  
  // ... rest
]);

export type SpellCastEvent = z.infer<typeof GameEventSchema> & { type: 'SPELL_CAST' };
```

### Step 2: Emit Events from Action Handlers

```typescript
const handleCastSpell = useCallback((spellId: string) => {
  // ... execute spell
  
  emitEvent({
    type: 'SPELL_CAST',
    spellId,
    location: { biome: currentBiome, x: playerX, y: playerY },
    timestamp: Date.now()
  });
  
}, []);
```

### Step 3: Handle in Statistics Engine

See "How to Extend Statistics" above.

### Step 4: Use in Quests/Achievements

Events are queryable via ActionHistory for quest criteria.

---

## How to Query Action History

### Overview
Action history stores all player actions (immutable log).
Query it for quests, achievements, statistics, etc.

### Simple Queries

```typescript
import { ActionTrackerEngine } from '@/core/action-tracker/action-tracker-engine';

// Count specific actions
const totalKills = ActionTrackerEngine.countByFilter(
  history,
  action => action.type === 'COMBAT' && action.targetCreatureType === 'goblin'
);

// Get recent actions
const last10Actions = ActionTrackerEngine.getRecentActions(history, 10);

// Filter by location
const forestActions = ActionTrackerEngine.getActionsByBiome(history, 'forest');

// Sum numeric property
const totalDamage = ActionTrackerEngine.sumByFilter(
  history,
  action => action.type === 'COMBAT',
  action => (action as CombatAction).damageDealt
);
```

### Complex Queries

```typescript
// Kill creatures of specific type in specific biome
const goblinKillsInMountain = ActionTrackerEngine.countByFilter(
  history,
  action =>
    action.type === 'COMBAT' &&
    action.targetCreatureType === 'goblin' &&
    action.location?.biome === 'mountain'
);

// Items gathered with specific tool
const woodWithAxe = ActionTrackerEngine.countByFilter(
  history,
  action =>
    action.type === 'GATHER' &&
    action.itemId === 'wood' &&
    action.tool === 'axe'
);

// Recent actions in time window
const lastHourActions = history.filter(
  action => Date.now() - action.timestamp < 3600000
);
```

---

## How to Add a New Component

### Step 1: Create Component File

Create `src/components/game/my-feature.tsx`:

```typescript
interface MyFeatureProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Displays my custom game feature.
 *
 * @remarks
 * This component:
 *   - Gets game state from useGameState hook
 *   - Displays feature UI
 *   - Handles user interactions via hook callbacks
 */
export function MyFeature({ isOpen, onClose }: MyFeatureProps) {
  const { state, handleAction } = useGameState();
  
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <h2>My Feature</h2>
        <div>Current state: {state.value}</div>
        <button onClick={() => handleAction()}>Perform Action</button>
      </DialogContent>
    </Dialog>
  );
}
```

### Step 2: Import and Use in Parent

```typescript
export function GameUI() {
  const [isMyFeatureOpen, setIsMyFeatureOpen] = useState(false);
  
  return (
    <>
      <MyFeature isOpen={isMyFeatureOpen} onClose={() => setIsMyFeatureOpen(false)} />
    </>
  );
}
```

### Key Rules
- ✅ Keep components focused (one feature = one component)
- ✅ Get state from hooks, don't create new useState
- ✅ Props should be simple (primitives + callbacks)
- ✅ No business logic (only display + handlers)

---

## How to Debug Events

### Step 1: Enable Event Logging

In `src/core/event-dispatcher.ts`:

```typescript
const DEBUG = true;  // Set to true

export function emitEvent(event: GameEvent) {
  if (DEBUG) {
    console.log('📢 Event:', event.type, event);
  }
  
  // ... rest of dispatch
}
```

### Step 2: Watch Console

When you perform an action, you'll see:
```
📢 Event: COMBAT { type: 'COMBAT', targetCreatureId: 'abc', damageDealt: 15, ... }
📢 Event: CREATURE_KILLED { type: 'CREATURE_KILLED', creatureId: 'abc', ... }
📢 Event: LEVEL_UP { type: 'LEVEL_UP', newLevel: 3, ... }
```

### Step 3: Check Action History

```typescript
// In browser console
localStorage.getItem('dreamland_actionHistory')
// Shows all recorded actions with timestamps
```

### Step 4: Check Statistics

```typescript
// In browser console
localStorage.getItem('dreamland_statistics')
// Shows all aggregated player statistics
```

---

## How to Add a New Location/Biome

### Step 1: Define Location in Data

Open `src/core/data/locations/locations.ts`:

```typescript
export const LOCATIONS = {
  // ... existing locations
  
  ancient_temple: {
    id: 'ancient_temple',
    name: { en: 'Ancient Temple', vi: 'Đền Cổ Xưa' },
    biome: 'mountain',
    description: { en: 'Ruins of an ancient civilization', vi: 'Tàn tích của một nền văn minh cổ đại' },
    creatures: ['guardian_statue', 'spectral_monk'],
    items: ['ancient_relic', 'gold_coin'],
    dangerLevel: 8
  }
} as const;
```

### Step 2: Add Creatures/Items

Make sure creatures and items referenced exist in:
- `src/core/data/creatures/`
- `src/core/data/items/`

### Step 3: Update Map

Open `src/core/data/map/world-map.ts`:

```typescript
export const WORLD_MAP = {
  // ... existing map
  mountain: {
    // ... existing locations in mountain biome
    'ancient_temple': { x: 100, y: 150 }
  }
};
```

### Step 4: That's It!

Players can now:
1. ✅ Travel to the location
2. ✅ Find creatures and items there
3. ✅ Statistics track location-specific actions
4. ✅ Quests can filter by biome

---

## Common Patterns

### Pattern: Conditional Rendering Based on State
```typescript
export function HealthBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const percentage = Math.max(0, (hp / maxHp) * 100);
  
  return (
    <div className="health-bar">
      <div 
        className={`fill ${hp > maxHp * 0.5 ? 'good' : 'low'}`}
        style={{ width: `${percentage}%` }}
      />
      <span>{hp}/{maxHp}</span>
    </div>
  );
}
```

### Pattern: Handling Multiple State Updates
```typescript
const handleComplexAction = useCallback((input: Input) => {
  const [newState, effects] = performComplexAction(state, input);
  
  setState(newState);
  
  // Process effects in order
  effects.forEach(effect => {
    if (effect.type === 'audio') {
      audioManager.play(effect.data);
    } else if (effect.type === 'particle') {
      particleEngine.emit(effect.data);
    }
  });
}, [state]);
```

### Pattern: Safe Property Access
```typescript
// ✅ SAFE - Handle undefined gracefully
const totalDamage = stats.combat?.damageDealt?.total ?? 0;

// ✅ SAFE - Filter before access
const goblinKills = stats.combat?.damageDealt?.byCreatureType?.goblin ?? 0;

// ❌ UNSAFE - Could crash if undefined
const totalDamage = stats.combat.damageDealt.total;
```

---

## Troubleshooting

### Quest Not Completing
- ✅ Check criteria in QUEST_TEMPLATES matches actual actions
- ✅ Verify filters (biome, weapon, etc) are correct
- ✅ Ensure actions are being emitted (check console)
- ✅ Check ActionHistory is being updated

### Achievement Not Unlocking
- ✅ Check criteria in ACHIEVEMENT_TEMPLATES
- ✅ Verify statistics are being updated (localStorage check)
- ✅ Ensure game state is saving achievements

### Events Not Firing
- ✅ Check event type matches GameEventSchema
- ✅ Verify emitEvent is called after action
- ✅ Enable DEBUG logging to see events in console
- ✅ Check for typos in event type (case-sensitive)

### Statistics Not Updating
- ✅ Check event is handled in StatisticsEngine.processEvent()
- ✅ Verify sparse data pattern: only non-zero values stored
- ✅ Check state is saved to localStorage
- ✅ Inspect localStorage to see current stats

---

## Related Documentation

- **CODING_PATTERNS.md** - Architectural patterns and standards
- **ARCHITECTURE.md** - System design and file organization
- **CODING_STANDARDS.md** - Code style and documentation rules
