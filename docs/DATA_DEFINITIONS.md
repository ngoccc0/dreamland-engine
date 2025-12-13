# DATA DEFINITIONS RULES - lib/game/data/ STRUCTURE & CONSOLIDATION

## FOLDER STRUCTURE & INTENT

```
lib/game/data/
├── creatures/
│   ├── animals.ts        → Wild animals (wolves, bears, spiders, etc.)
│   ├── bosses.ts         → Boss creatures (dragon, lich, etc.)
│   └── npcs.ts           → NPC creatures (merchants, quest givers)
├── items/
│   ├── weapons.ts        → All weapons (sword, bow, axe, spear, etc.)
│   ├── armor.ts          → All armor (helmet, chest, legs, boots, etc.)
│   ├── consumables.ts    → Potions, food, buffs, scrolls, etc.
│   ├── materials.ts      → Crafting materials (wood, ore, cloth, leather, etc.)
│   └── tools.ts          → Tools (pickaxe, axe, hoe, shovel, fishing rod, etc.)
├── structures/
│   ├── buildings.ts      → Player buildings (house, farm, workshop, etc.)
│   ├── decorations.ts    → Decorative structures (fences, signs, etc.)
│   └── resources.ts      → Resource nodes (trees, ore deposits, etc.)
└── skills/
    ├── combat-skills.ts  → Combat abilities (slash, fireball, etc.)
    ├── farming-skills.ts → Farming abilities (plant, harvest, etc.)
    └── magic-skills.ts   → Magic abilities (spells, buffs, etc.)
```

## ONE CONCEPT = ONE FILE (INTENTIONAL DESIGN)

### **IMPORTANT: This structure is INTENTIONAL**

Each file represents **one logical category of items/creatures**, not multiple categories in one file.

### Rationale for Multiple Item Files
- **weapons.ts** contains ALL weapons: swords, bows, axes, spears, etc.
  - Expected size: 200-500 lines (depends on weapon count)
  - One file per weapon type would cause file explosion (weapons/swords.ts, weapons/bows.ts, etc.)
  - Organized internally by tiers/categories in comments

- **armor.ts** contains ALL armor: helmets, chest plates, legs, boots, shields, etc.
  - Expected size: 200-500 lines
  - One file per armor type would be overkill

- **consumables.ts** contains ALL consumables: potions, food, scrolls, etc.
  - Expected size: 150-400 lines
  - One file per consumable type defeats the purpose

- **materials.ts** contains ALL crafting materials: wood, ore, cloth, leather, herbs, etc.
  - Expected size: 200-300 lines
  - One file per material type would be excessive

- **tools.ts** contains ALL tools: pickaxe, hoe, shovel, fishing rod, etc.
  - Expected size: 100-300 lines
  - All tools share similar structure, belong together

### Rationale for Creature Files
- **animals.ts** contains ALL wild creatures: wolves, bears, spiders, boars, goblins, etc.
  - Expected size: 300-800 lines
  - Organized by biome or behavior type in comments
  - One file because they share creature mechanics

- **bosses.ts** contains ALL boss-type creatures
  - Expected size: 300-600 lines
  - Separate file because bosses have special mechanics

- **npcs.ts** contains ALL NPC creatures: merchants, quest givers, guards, etc.
  - Expected size: 200-400 lines
  - Separate from wild animals because NPCs have different mechanics

---

## STRUCTURE & ORGANIZATION WITHIN FILES

### Item Definition Structure
```typescript
/**
 * All weapon definitions for the game.
 *
 * @remarks
 * Organized by tier:
 *   - TIER 1: Common weapons (iron sword, wooden bow, etc.)
 *   - TIER 2: Rare weapons (steel sword, elven bow, etc.)
 *   - TIER 3: Legendary weapons (excalibur, celestial bow, etc.)
 *
 * Each weapon extends ItemDefinition and adds combat-specific properties.
 */

import type { ItemDefinition } from '@/lib/definitions/item';

export const weapons: Record<string, ItemDefinition> = {
  // === TIER 1: COMMON WEAPONS ===
  
  wooden_sword: {
    id: 'wooden_sword',
    name: { en: 'Wooden Sword', vi: 'Kiếm gỗ' },
    description: { en: 'A basic wooden practice sword.', vi: 'Kiếm gỗ cơ bản để tập luyện.' },
    emoji: '🪵',
    damage: 3,
    weight: 2,
    rarity: 'common',
    price: 50
  },
  
  iron_sword: {
    id: 'iron_sword',
    name: { en: 'Iron Sword', vi: 'Kiếm sắt' },
    description: { en: 'A sturdy iron sword for combat.', vi: 'Kiếm sắt bền chắc cho chiến đấu.' },
    emoji: '⚔️',
    damage: 8,
    weight: 4,
    rarity: 'common',
    price: 150
  },

  // === TIER 2: RARE WEAPONS ===
  
  steel_sword: {
    id: 'steel_sword',
    name: { en: 'Steel Sword', vi: 'Kiếm thép' },
    description: { en: 'A well-crafted steel sword with superior balance.', vi: 'Kiếm thép được chế tác tốt với cân bằng tuyệt vời.' },
    emoji: '🗡️',
    damage: 15,
    weight: 5,
    rarity: 'rare',
    price: 500
  },

  // === TIER 3: LEGENDARY WEAPONS ===
  
  excalibur: {
    id: 'excalibur',
    name: { en: 'Excalibur', vi: 'Excalibur' },
    description: { en: 'A legendary sword of immense power.', vi: 'Một thanh kiếm huyền thoại vô cùng mạnh mẽ.' },
    emoji: '✨⚔️',
    damage: 50,
    weight: 6,
    rarity: 'legendary',
    price: 10000
  }
};

export default weapons;
```

### Creature Definition Structure
```typescript
/**
 * All wild creature definitions (animals, insects, etc.).
 *
 * @remarks
 * Organized by habitat/biome:
 *   - FOREST ANIMALS: Wolves, bears, spiders
 *   - SWAMP CREATURES: Crocodiles, slimes
 *   - MOUNTAIN CREATURES: Eagles, dire bears
 *
 * Each creature follows CreatureDefinition interface and includes:
 *   - id: Unique identifier
 *   - name: Bilingual name
 *   - hp/damage: Combat stats
 *   - behavior: AI behavior type
 *   - naturalSpawn: Spawn rules for world generation
 */

import type { CreatureDefinition } from '@/lib/definitions/creature';

export const animals: Record<string, CreatureDefinition> = {
  // === FOREST ANIMALS ===
  
  wolf: {
    id: 'wolf',
    name: { en: 'Wolf', vi: 'Sói' },
    description: { en: 'A cunning pack hunter.', vi: 'Một kẻ săn mồi tinh khôn theo bầy.' },
    emoji: '🐺',
    hp: 50,
    damage: 8,
    behavior: 'aggressive',
    size: 'medium',
    diet: ['meat'],
    satiation: 10,
    maxSatiation: 30,
    naturalSpawn: [
      {
        biome: 'forest',
        chance: 0.3,
        conditions: { predatorPresence: { min: 5 } }
      }
    ]
  },

  bear: {
    id: 'bear',
    name: { en: 'Bear', vi: 'Gấu' },
    description: { en: 'A large, powerful omnivore that defends its territory.', vi: 'Một động vật lớn, mạnh mẽ, canh giữ lãnh thổ.' },
    emoji: '🐻',
    hp: 150,
    damage: 18,
    behavior: 'territorial',
    size: 'large',
    diet: ['berries', 'meat', 'fish'],
    satiation: 30,
    maxSatiation: 80,
    naturalSpawn: [
      {
        biome: 'forest',
        chance: 0.08,
        conditions: { predatorPresence: { min: 8 }, dangerLevel: { min: 7 } }
      }
    ]
  },

  // === SWAMP CREATURES ===
  
  crocodile: {
    id: 'crocodile',
    name: { en: 'Crocodile', vi: 'Cá sấu' },
    description: { en: 'A fearsome water predator.', vi: 'Một loài cá sấu hung dữ trong nước.' },
    emoji: '🐊',
    hp: 120,
    damage: 14,
    behavior: 'aggressive',
    size: 'large',
    diet: ['meat', 'fish'],
    satiation: 20,
    maxSatiation: 60,
    naturalSpawn: [
      {
        biome: 'swamp',
        chance: 0.25,
        conditions: { humidity: { min: 8 } }
      }
    ]
  }
};

export default animals;
```

---

## ANTI-PATTERNS (❌ DO NOT DO THIS)

### ❌ Multiple files for one concept
```
lib/game/data/items/
  ├── weapons.ts          (swords: iron_sword, steel_sword)
  ├── weapons-magic.ts    (magic swords: fire_sword)  ← DUPLICATE!
  ├── weapons-legendary.ts (excalibur)                ← DUPLICATE!
```

This is WRONG. Put ALL weapons in `weapons.ts`, organize by tier/type in comments.

### ❌ Different names for same concept
```
lib/game/data/creatures/
  ├── animals.ts         (wolves, bears, spiders)
  ├── wild-creatures.ts  (same content, different file)  ← DUPLICATE!
  ├── beasts.ts          (yet another duplication)       ← DUPLICATE!
```

This is WRONG. Pick ONE file name and organize internally.

### ❌ Redundant sub-categorization
```
lib/game/data/items/weapons/
  ├── swords.ts
  ├── bows.ts
  ├── axes.ts
```

This is WRONG. Use `lib/game/data/items/weapons.ts` instead.

### ❌ Logic in data files
```typescript
// ❌ WRONG - Logic in data
export const weapons = {
  iron_sword: {
    id: 'iron_sword',
    getDamage: () => calculateWeaponDamage('iron', 'sword'),  // ← NO!
    process: (player) => { player.damage += 8; }              // ← NO!
  }
};
```

Data files contain ONLY data, no functions.

---

## BEFORE ADDING NEW FILE: CONSOLIDATION CHECKLIST

### Step 1: Does a file for this concept already exist?
```
NEW: "I want to add flame_sword item"

CHECKLIST:
  ? Does weapons.ts exist?
    ✅ YES → Add to weapons.ts
    
  ? Is it a sword?
    ✅ YES → Belongs in weapons.ts
    
  ? Are there already swords in weapons.ts?
    ✅ YES (iron_sword, steel_sword) → Add flame_sword to weapons.ts
    
RESULT: Add to weapons.ts, don't create new file
```

### Step 2: Content overlap check
```
NEW: "I want to add a Golem boss creature"

CHECKLIST:
  ? Does bosses.ts exist?
    ✅ YES → Add to bosses.ts
    
  ? Is Golem a boss-type creature?
    ✅ YES → Belongs in bosses.ts
    
  ? Does bosses.ts already have boss creatures?
    ✅ YES → Add Golem to bosses.ts
    
RESULT: Add to bosses.ts, don't create new file
```

### Step 3: When to create a NEW file
```
NEW: "I want to add a new category: accessories (rings, necklaces)"

CHECKLIST:
  ? Does a file for accessories exist?
    ❌ NO → Safe to create new file
    
  ? Is this a distinct category from other items?
    ✅ YES (different mechanics than weapons/armor)
    
  ? Will it have enough content to justify a file?
    ✅ YES (planned 10+ accessories)
    
ACTION:
  1. Create lib/game/data/items/accessories.ts
  2. Update ARCHITECTURE.md to document new file
  3. Update this file's checklist
  4. Add to DATA_DEFINITIONS.md's file mapping
```

---

## FILE MAPPING & CONTENT OWNERSHIP

| File | Category | Expected Size | Content |
|------|----------|---|---------|
| **creatures/animals.ts** | Wild creatures | 300-800 lines | Wolves, bears, spiders, boars, goblins, crocodiles, etc. |
| **creatures/bosses.ts** | Boss creatures | 300-600 lines | Dragons, liches, demons, etc. |
| **creatures/npcs.ts** | NPC creatures | 200-400 lines | Merchants, quest givers, guards, etc. |
| **items/weapons.ts** | Weapons | 200-500 lines | ALL swords, bows, axes, spears, etc. (organized by tier) |
| **items/armor.ts** | Armor | 200-500 lines | Helmets, chest plates, legs, boots, shields, etc. |
| **items/consumables.ts** | Consumables | 150-400 lines | Potions, food, scrolls, buffs, etc. |
| **items/materials.ts** | Materials | 200-300 lines | Wood, ore, cloth, leather, herbs, gems, etc. |
| **items/tools.ts** | Tools | 100-300 lines | Pickaxe, hoe, shovel, fishing rod, etc. |
| **structures/buildings.ts** | Buildings | 200-400 lines | Houses, farms, workshops, taverns, etc. |
| **structures/decorations.ts** | Decorations | 100-300 lines | Fences, signs, benches, fountains, etc. |
| **structures/resources.ts** | Resource nodes | 200-300 lines | Trees, ore deposits, flower beds, water sources, etc. |
| **skills/combat-skills.ts** | Combat abilities | 200-400 lines | Slash, parry, power attack, special moves, etc. |
| **skills/farming-skills.ts** | Farming abilities | 150-300 lines | Plant, harvest, cultivate, breed animals, etc. |
| **skills/magic-skills.ts** | Magic abilities | 200-400 lines | Fireball, heal, buff, debuff, etc. |

---

## RULE: SCHEMA VALIDATION

Every data file MUST have type safety:

```typescript
// ✅ CORRECT
import type { ItemDefinition } from '@/lib/definitions/item';

export const weapons: Record<string, ItemDefinition> = {
  iron_sword: {
    id: 'iron_sword',
    name: { en: 'Iron Sword', vi: 'Kiếm sắt' },
    // ... must match ItemDefinition shape
  }
};

// ❌ WRONG - No type definition
export const weapons = {
  iron_sword: {
    id: 'iron_sword',
    name: { en: 'Iron Sword', vi: 'Kiếm sắt' },
    unknownField: 'bad',  // ← TypeScript won't catch this
  }
};
```

---

## RULE: BILINGUAL TEXT (Mandatory)
All names and descriptions MUST be bilingual:

```typescript
// ✅ CORRECT
name: { en: 'Iron Sword', vi: 'Kiếm sắt' }
description: { en: 'A sturdy sword...', vi: 'Một thanh kiếm bền chắc...' }

// ❌ WRONG
name: 'Iron Sword'                  // Missing vi
description: 'A sturdy sword...'    // Missing vi
name: { english: 'Iron Sword' }     // Wrong key names
```

---

## RULE: NO DUPLICATES (ENFORCEMENT)

When you encounter potential duplicates:

```
FOUND: Two files with similar content
  - lib/game/data/items/weapons.ts (10 weapons)
  - lib/game/data/items/weapons-extended.ts (5 weapons)

ACTION:
  1. Check if there's actual difference or just copy-paste
  2. If similar: MERGE into one file (weapons.ts)
  3. Delete duplicate file
  4. Update imports
  5. Document reason in LONG_TERM_NOTES.md if needed
```

---

## SUMMARY: DESIGN INTENT

This structure is **intentional and optimized**:

- ✅ **One file per logical category** (weapons, armor, consumables, etc.)
- ✅ **Organized internally by tiers/biomes** (use comments, not multiple files)
- ✅ **Expected sizes 100-800 lines** depending on content volume
- ✅ **Type-safe with record definitions**
- ✅ **Bilingual (EN/VI) throughout**
- ✅ **Pure data, no logic**

**Do NOT split into more files unless the file reaches 800+ lines AND you can clearly separate concerns.**

