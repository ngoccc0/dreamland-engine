# Dynamic Audio Integration - Execution-Ready Plan

**Date:** November 30, 2025  
**Branch:** chore/terrain-finalize  
**Version:** 1.0 - Implementation Phase  

---

## 1. CANONICAL PROMPT & MODEL UNDERSTANDING

### Canonical Prompt
Wire game actions to specific sound effects dynamically. Create an event-driven audio system that triggers sound effects for player actions (movement, combat, crafting, farming, harvesting, building, item use, UI). Build centralized SFX-to-action mappings organized by biome and context. Integrate audio triggers into action handlers and core usecases without polluting business logic. Ensure audio settings persist in game saves.

### Model Understanding (Architecture Context)
- **Current State:** AudioProvider + useAudio hook exist; only 28 SFX registered; no SFX triggered for game events (move, attack, pickup, craft, build)
- **Assets Available:** 407 SFX files across 15 categories; 84 musical stings (10 instruments); biome-specific footsteps (grass/gravel/snow/wood)
- **Architecture:** 4-layer clean arch (UI → Hooks → Usecases → Engines → Infrastructure). Audio must be non-invasive side-effect via hooks.
- **Problem:** Game feels lifeless despite rich audio assets. No audio feedback for player actions beyond menu/ambience.
- **Solution Strategy:** (1) Centralized SFX registry mapping 40+ actions to audio files, (2) Event emitters in action handlers, (3) Audio dispatcher in hooks, (4) Biome-aware footstep selection

---

## 2. IMPLEMENTATION STEPS (Detailed, Sequential)

### Phase 1: Foundation (Audio Event System & Mappings)

#### Step 1.1: Create `src/lib/definitions/audio-events.ts`
**Purpose:** Centralized registry defining all game actions that emit audio, with SFX file mappings and context resolution.

**Deliverable:** TypeScript file with:
- Enum: `AudioActionType` (40+ action types)
- Type: `AudioEventContext` (biome, item rarity, tool type, success/fail)
- Function: `getAudioAssetForAction(actionType, context)` → SFX filename(s)
- Record: `AUDIO_EVENTS_REGISTRY` mapping action to SFX strategy

**Key Actions (Priority):**
```typescript
enum AudioActionType {
  // Movement
  PLAYER_MOVE = 'PLAYER_MOVE',
  
  // Combat
  PLAYER_ATTACK = 'PLAYER_ATTACK',
  ENEMY_HIT = 'ENEMY_HIT',
  ENEMY_DEFEATED = 'ENEMY_DEFEATED',
  
  // Items
  ITEM_PICKUP = 'ITEM_PICKUP',
  ITEM_EQUIP_WEAPON = 'ITEM_EQUIP_WEAPON',
  ITEM_EQUIP_ARMOR = 'ITEM_EQUIP_ARMOR',
  ITEM_UNEQUIP = 'ITEM_UNEQUIP',
  ITEM_USE = 'ITEM_USE',
  ITEM_DROP = 'ITEM_DROP',
  
  // Crafting
  CRAFT_START = 'CRAFT_START',
  CRAFT_SUCCESS = 'CRAFT_SUCCESS',
  CRAFT_FAIL = 'CRAFT_FAIL',
  
  // Farming
  FARM_TILL = 'FARM_TILL',
  FARM_WATER = 'FARM_WATER',
  FARM_FERTILIZE = 'FARM_FERTILIZE',
  FARM_PLANT = 'FARM_PLANT',
  
  // Harvesting
  HARVEST_START = 'HARVEST_START',
  HARVEST_ITEM = 'HARVEST_ITEM',
  HARVEST_COMPLETE = 'HARVEST_COMPLETE',
  
  // Building
  BUILD_CONSTRUCT = 'BUILD_CONSTRUCT',
  BUILD_SUCCESS = 'BUILD_SUCCESS',
  
  // Environment
  ENVIRONMENT_DOOR_OPEN = 'ENVIRONMENT_DOOR_OPEN',
  ENVIRONMENT_DOOR_CLOSE = 'ENVIRONMENT_DOOR_CLOSE',
  
  // UI
  UI_BUTTON_HOVER = 'UI_BUTTON_HOVER',
  UI_BUTTON_CLICK = 'UI_BUTTON_CLICK',
  UI_CONFIRM = 'UI_CONFIRM',
  UI_CANCEL = 'UI_CANCEL',
  
  // Skills
  SKILL_CAST = 'SKILL_CAST',
  SKILL_SUCCESS = 'SKILL_SUCCESS',
  SKILL_FAIL = 'SKILL_FAIL',
}
```

**Context Interface:**
```typescript
interface AudioEventContext {
  biome?: string; // for footstep selection
  itemRarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  itemType?: string;
  toolType?: string;
  success?: boolean;
  isHeavyAttack?: boolean;
  creatureType?: string;
}
```

**Registry Function Example:**
```typescript
const AUDIO_EVENTS_REGISTRY: Record<AudioActionType, (context: AudioEventContext) => string | string[]> = {
  [AudioActionType.PLAYER_MOVE]: (ctx) => getFootstepForBiome(ctx.biome),
  [AudioActionType.PLAYER_ATTACK]: () => ['punch.wav', 'punch_2.wav', 'kick.wav'],
  [AudioActionType.ITEM_PICKUP]: (ctx) => ctx.itemRarity === 'rare' ? 'gem_collect.wav' : 'coin_jingle_small.wav',
  [AudioActionType.CRAFT_SUCCESS]: () => ['brass_chime_positive.wav', '8_bit_chime_positive.wav'],
  [AudioActionType.CRAFT_FAIL]: () => 'synth_error.wav',
  // ... 40+ more mappings
};
```

**Location:** `src/lib/definitions/audio-events.ts`  
**Dependencies:** None (pure data definitions)  
**Tests:** None needed (static mappings)

---

#### Step 1.2: Create `src/lib/audio/biome-footsteps.ts`
**Purpose:** Map terrain types to biome-specific footstep SFX.

**Deliverable:** TypeScript utility with:
- Function: `getFootstepForBiome(biome?: string) → string`
- Terrain-to-footstep mapping (grass/gravel/snow/wood/generic)
- Fallback chain

**Implementation:**
```typescript
const BIOME_FOOTSTEP_MAP: Record<string, string[]> = {
  grass: ['digital_footstep_grass_1.wav', 'digital_footstep_grass_2.wav', 'digital_footstep_grass_3.wav', 'digital_footstep_grass_4.wav'],
  gravel: ['digital_footstep_gravel_1.wav', 'digital_footstep_gravel_2.wav', 'digital_footstep_gravel_3.wav', 'digital_footstep_gravel_4.wav'],
  snow: ['digital_footstep_snow_1.wav', 'digital_footstep_snow_2.wav', 'digital_footstep_snow_3.wav', 'digital_footstep_snow_4.wav'],
  wood: ['digital_footstep_wood_1.wav', 'digital_footstep_wood_2.wav', 'digital_footstep_wood_3.wav', 'digital_footstep_wood_4.wav'],
};

const BIOME_TERRAIN_CATEGORY: Record<string, keyof typeof BIOME_FOOTSTEP_MAP> = {
  forest: 'grass', grassland: 'grass', jungle: 'grass', mushroom_forest: 'grass',
  desert: 'gravel', mountain: 'gravel', cave: 'gravel', volcanic: 'gravel', mesa: 'gravel',
  tundra: 'snow',
  city: 'wood', space_station: 'wood', beach: 'wood',
  // fallback: generic rustles (no biome mapping)
};

export function getFootstepForBiome(biome?: string): string {
  if (!biome) return `rustle${Math.floor(Math.random() * 20) + 1}.flac`; // fallback generic
  const category = BIOME_TERRAIN_CATEGORY[biome.toLowerCase()];
  if (!category) return `rustle${Math.floor(Math.random() * 20) + 1}.flac`;
  const footsteps = BIOME_FOOTSTEP_MAP[category];
  return footsteps[Math.floor(Math.random() * footsteps.length)];
}
```

**Location:** `src/lib/audio/biome-footsteps.ts`  
**Dependencies:** None (pure logic)  
**Tests:** Unit test mapping coverage

---

#### Step 1.3: Create `src/core/usecases/emit-audio-event.ts`
**Purpose:** Pure usecase for audio event dispatch with playback mode filtering.

**Deliverable:** TypeScript function with:
- Function: `emitAudioEvent(actionType: AudioActionType, context: AudioEventContext, playbackMode: 'off' | 'occasional' | 'always') → AudioEventPayload | null`
- Filtering logic (playback mode, context validation)
- Returns normalized audio event or null if filtered

**Implementation:**
```typescript
export interface AudioEventPayload {
  actionType: AudioActionType;
  sfxFiles: string[];
  context: AudioEventContext;
  priority: 'low' | 'medium' | 'high';
}

export function emitAudioEvent(
  actionType: AudioActionType,
  context: AudioEventContext,
  playbackMode: 'off' | 'occasional' | 'always'
): AudioEventPayload | null {
  // Filter by playback mode
  if (playbackMode === 'off') return null;
  
  if (playbackMode === 'occasional') {
    // 50% chance for non-critical events
    if (Math.random() > 0.5 && !isCriticalAudioEvent(actionType)) {
      return null;
    }
  }
  
  // Resolve SFX files from registry
  const mapper = AUDIO_EVENTS_REGISTRY[actionType];
  if (!mapper) return null; // action not mapped
  
  const sfxResult = mapper(context);
  const sfxFiles = Array.isArray(sfxResult) ? sfxResult : [sfxResult];
  
  return {
    actionType,
    sfxFiles,
    context,
    priority: getPriorityForAction(actionType),
  };
}

function isCriticalAudioEvent(actionType: AudioActionType): boolean {
  const criticalActions = [
    AudioActionType.UI_CONFIRM,
    AudioActionType.UI_CANCEL,
    AudioActionType.CRAFT_SUCCESS,
    AudioActionType.CRAFT_FAIL,
    AudioActionType.BUILD_SUCCESS,
    AudioActionType.ENEMY_DEFEATED,
  ];
  return criticalActions.includes(actionType);
}

function getPriorityForAction(actionType: AudioActionType): 'low' | 'medium' | 'high' {
  if (isCriticalAudioEvent(actionType)) return 'high';
  if ([AudioActionType.PLAYER_ATTACK, AudioActionType.HARVEST_ITEM].includes(actionType)) return 'medium';
  return 'low';
}
```

**Location:** `src/core/usecases/emit-audio-event.ts`  
**Dependencies:** `audio-events.ts`  
**Tests:** Unit tests for filtering logic and SFX resolution

---

### Phase 2: Audio Provider Integration

#### Step 2.1: Expand `src/lib/audio/assets.ts`
**Purpose:** Map all 100+ SFX files organized by action category.

**Change Type:** Replace/Expand existing file  
**Additions:**
- Expand SFX array from 28 to 100+ entries
- Organize by category (movement, combat, items, crafting, farming, building, UI, environment)
- Preserve existing 28 mappings to avoid breakage

**New Sections:**
```typescript
// Footsteps (20 generic + 16 biome-specific)
export const FOOTSTEP_SFX = [
  'rustle01.flac', 'rustle02.flac', /* ... */ 'rustle20.flac',
  // Grass biome
  'digital_footstep_grass_1.wav', /* ... */
  // Gravel biome
  'digital_footstep_gravel_1.wav', /* ... */
  // Snow biome
  'digital_footstep_snow_1.wav', /* ... */
  // Wood biome
  'digital_footstep_wood_1.wav', /* ... */
];

// Combat & Gore (17 files)
export const COMBAT_SFX = [
  'punch.wav', 'punch_2.wav', 'kick.wav', 'sword_slice.wav', 'sword_light.wav',
  'swipe.wav', 'crunch.wav', 'crunch_splat.wav', 'splat_quick.wav',
  // ... all 17 combat files
];

// Items (24 files)
export const ITEM_SFX = [
  'coin_collect.wav', 'coin_jingle_small.wav', 'gem_collect.wav',
  'item_equip.wav', 'weapon_equip.wav', 'weapon_unequip.wav',
  // ... all 24 item files
];

// And similar for: CRAFTING_SFX, FARMING_SFX, BUILDING_SFX, UI_SFX, ENVIRONMENT_SFX, MUSIC_STINGS_SFX

// For backward compat, keep existing SFX array but update to use new categories
export const SFX = [
  ...DRAGON_GROWL_SFX,
  ...GOBLIN_SFX,
  ...EXISTING_MAPPINGS,
];
```

**Location:** `src/lib/audio/assets.ts` (modify existing)  
**Dependencies:** None  
**Tests:** No new tests needed (static data)

---

#### Step 2.2: Update `src/lib/audio/AudioProvider.tsx`
**Purpose:** Add `playSfxForAction()` method and integrate audio event dispatch.

**Changes:**
1. Add to `AudioContextType`:
```typescript
playSfxForAction: (actionType: AudioActionType, context?: AudioEventContext) => void;
emitAudioEvent: (actionType: AudioActionType, context?: AudioEventContext) => void;
```

2. Implement in provider:
```typescript
const playSfxForAction = useCallback((actionType: AudioActionType, context?: AudioEventContext) => {
  const event = emitAudioEvent(actionType, context, playbackMode);
  if (!event) return; // filtered by playback mode
  
  const sfxFile = event.sfxFiles[Math.floor(Math.random() * event.sfxFiles.length)];
  playSfx(sfxFile); // use existing playSfx method
}, [playbackMode, playSfx]);

const emitAudioEvent = useCallback((actionType: AudioActionType, context?: AudioEventContext) => {
  const event = emitAudioEvent(actionType, context || {}, playbackMode);
  if (!event) return;
  
  playSfxForAction(actionType, context);
}, [playSfxForAction, playbackMode]);
```

3. Export in context type

**Location:** `src/lib/audio/AudioProvider.tsx` (modify existing)  
**Dependencies:** `emit-audio-event.ts`, `audio-events.ts`  
**Tests:** Unit test audio dispatch with different playback modes

---

#### Step 2.3: Update `src/lib/audio/useAudio.ts`
**Purpose:** Expose new audio action methods to components/hooks.

**Changes:**
```typescript
export function useAudio() {
  const ctx = useAudioContext();
  return useMemo(() => ({
    // existing methods...
    playSfx: ctx.playSfx,
    
    // NEW: action-based audio methods
    playSfxForAction: ctx.playSfxForAction,
    emitAudioEvent: ctx.emitAudioEvent,
  }), [ctx]);
}
```

**Location:** `src/lib/audio/useAudio.ts` (modify existing)  
**Dependencies:** `AudioProvider.tsx`  
**Tests:** None (simple pass-through hook)

---

### Phase 3: Wire Audio into Game Actions

#### Step 3.1: Update `src/hooks/use-action-handlers.ts` - Add Audio Dispatch Calls
**Purpose:** Emit audio events for movement, combat, item pickup.

**Changes (3 locations):**

1. **In Movement Handler (use-action-handlers.move.ts, line ~42-50):**
   - After: `addNarrativeEntry(actionText, 'action')`
   - Add: `audio.playSfxForAction(AudioActionType.PLAYER_MOVE, { biome: nextChunk?.terrain })`

2. **In Combat/Attack Handler (use-action-handlers.ts, line ~377):**
   - After: Attack is initiated
   - Add: `audio.playSfxForAction(AudioActionType.PLAYER_ATTACK, { isHeavyAttack: isPoweredAttack })`
   - After: Enemy is hit
   - Add: `audio.playSfxForAction(AudioActionType.ENEMY_HIT)`
   - After: Enemy HP → 0
   - Add: `audio.playSfxForAction(AudioActionType.ENEMY_DEFEATED, { creatureType: enemy.type })`

3. **In Pickup Handler (use-action-handlers.ts, near item pickup logic):**
   - After: Item is picked up
   - Add: `audio.playSfxForAction(AudioActionType.ITEM_PICKUP, { itemRarity: item.rarity })`

4. **In Equipment Handler:**
   - After: Weapon equipped
   - Add: `audio.playSfxForAction(AudioActionType.ITEM_EQUIP_WEAPON)`
   - After: Armor equipped
   - Add: `audio.playSfxForAction(AudioActionType.ITEM_EQUIP_ARMOR)`

**Location:** `src/hooks/use-action-handlers.ts` & `src/hooks/use-action-handlers.move.ts` (modify existing)  
**Dependencies:** `useAudio` hook, `audio-events.ts`  
**Tests:** Integration tests with mock audio context

---

#### Step 3.2: Add Audio to Crafting Usecase
**Purpose:** Emit crafting success/fail sounds.

**Location:** Find and update crafting usecase file  
**Changes:**
- On craft success: `emitAudioEvent(AudioActionType.CRAFT_SUCCESS, { success: true })`
- On craft fail: `emitAudioEvent(AudioActionType.CRAFT_FAIL, { success: false })`

**Delivery:** Via usecase or action handler integration

---

#### Step 3.3: Add Audio to Farming Usecases
**Purpose:** Emit farming action sounds.

**Location:** `src/core/usecases/farming-usecase.ts` (modify existing)  
**Changes:**
- `tillSoil()`: Emit `FARM_TILL`
- `waterTile()`: Emit `FARM_WATER`
- `fertilizeTile()`: Emit `FARM_FERTILIZE`
- `plantSeed()`: Emit `FARM_PLANT`

---

#### Step 3.4: Add Audio to Building & Harvesting
**Purpose:** Emit construction and harvest sounds.

**Locations:** Building & harvesting usecase files  
**Changes:**
- Build start: `BUILD_CONSTRUCT`
- Build success: `BUILD_SUCCESS`
- Harvest start: `HARVEST_START`
- Harvest item collected: `HARVEST_ITEM`
- Harvest complete: `HARVEST_COMPLETE`

---

### Phase 4: UI Integration

#### Step 4.1: Wire Audio into UI Buttons
**Purpose:** Play click/hover sounds on button interactions.

**Location:** Any button component file or shared GameButton component  
**Changes:**
```tsx
<button
  onMouseEnter={() => audio.playSfxForAction(AudioActionType.UI_BUTTON_HOVER)}
  onClick={() => {
    audio.playSfxForAction(AudioActionType.UI_BUTTON_CLICK);
    handleClick();
  }}
>
  Label
</button>
```

---

#### Step 4.2: Update Audio Settings Panel
**Purpose:** Add SFX volume control and playback mode selector.

**Location:** `src/components/GameAudioSettingsPanel.tsx` (modify if exists, create if not)  
**Changes:**
- Add SFX volume slider (0-1)
- Preserve existing music volume slider
- Add playback mode selector (off/occasional/always)
- Display current SFX volume

**UI Structure:**
```
Music Volume: [====|===] 0.6
SFX Volume:   [========|] 0.9
Playback Mode: (o) Off  (•) Occasional  ( ) Always
```

---

### Phase 5: Persistence & Validation

#### Step 5.1: Add Audio Settings to GameState
**Purpose:** Persist audio preferences in game saves.

**Location:** `src/core/types/game.ts` (modify GameState type)  
**Changes:**
```typescript
interface GameState {
  // ... existing properties
  audioSettings: {
    musicVolume: number;
    sfxVolume: number;
    muted: boolean;
    playbackMode: 'off' | 'occasional' | 'always';
    playbackIntervalMinutes: number;
  };
}
```

---

#### Step 5.2: Update Game State Repository
**Purpose:** Save/load audio settings with game saves.

**Location:** `src/core/repositories/game-state-repository.ts` (modify if exists)  
**Changes:**
- On save: Include `audioSettings` from AudioProvider
- On load: Apply saved `audioSettings` to AudioProvider

---

### Phase 6: Testing & Validation

#### Step 6.1: Write Unit Tests
**Files to test:**
- `audio-events.ts`: Action-to-SFX mapping resolution
- `biome-footsteps.ts`: Terrain-to-footstep mapping
- `emit-audio-event.ts`: Event filtering by playback mode
- `AudioProvider.tsx`: `playSfxForAction()` dispatch
- Audio integration with action handlers (mocked)

**Test Locations:** `src/__tests__/audio/`

#### Step 6.2: Run Type Validation
```bash
npm run typecheck
```

#### Step 6.3: Run Unit Tests
```bash
npm run test
```

#### Step 6.4: Manual Testing in Dev Server
```bash
npm run dev
```

**Test Cases:**
- Move in different biomes → hear appropriate footsteps
- Attack creature → hear punch/kick SFX → hear impact on hit → hear death crunch on defeat
- Pickup items → hear jingles
- Craft item → hear success sting on success, fail sound on failure
- Till soil → hear shovel dig
- Water crops → hear water drop
- Plant seed → hear snap
- Build structure → hear construction sound → success sting
- Click UI button → hear click sound
- Verify playback mode filtering (occasional mode = ~50% SFX)
- Verify SFX volume affects playback

---

## 3. LOGIC DEEP DIVE

### Audio Event Flow (Complete Data Trace)

```
┌─────────────────────────────────────────────────────────────────────┐
│ USER ACTION TRIGGERED                                               │
│ (e.g., Player moves in forest biome)                               │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ ACTION HANDLER EMITS AUDIO EVENT                                    │
│ useActionHandlers.move.ts:                                          │
│   audio.playSfxForAction(                                           │
│     AudioActionType.PLAYER_MOVE,                                    │
│     { biome: 'forest' }                                             │
│   )                                                                 │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ AUDIO CONTEXT RECEIVES REQUEST                                      │
│ AudioProvider.playSfxForAction():                                   │
│   - Validates actionType exists                                     │
│   - Prepares context: { biome: 'forest' }                          │
│   - Calls emitAudioEvent()                                          │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ PURE USECASE: EMIT AUDIO EVENT                                      │
│ emit-audio-event.ts :: emitAudioEvent()                            │
│ Input: {                                                            │
│   actionType: 'PLAYER_MOVE',                                        │
│   context: { biome: 'forest' },                                     │
│   playbackMode: 'always'                                            │
│ }                                                                   │
│                                                                     │
│ Step 1: Playback Mode Filter                                       │
│   playbackMode === 'off' → RETURN NULL (SKIP)                      │
│   playbackMode === 'occasional' && !critical → RANDOM 50% (SKIP)   │
│   playbackMode === 'always' → CONTINUE                              │
│                                                                     │
│ Step 2: Resolve SFX Files from Registry                            │
│   mapper = AUDIO_EVENTS_REGISTRY['PLAYER_MOVE']                    │
│   mapper = (ctx) => getFootstepForBiome(ctx.biome)                │
│                                                                     │
│ Step 3: Execute Mapper with Context                                │
│   getFootstepForBiome('forest') → LOOKUP BIOME_TERRAIN_CATEGORY    │
│   'forest' → 'grass' (category)                                     │
│   BIOME_FOOTSTEP_MAP['grass'] = [                                   │
│     'digital_footstep_grass_1.wav',                                │
│     'digital_footstep_grass_2.wav',                                │
│     'digital_footstep_grass_3.wav',                                │
│     'digital_footstep_grass_4.wav'                                 │
│   ]                                                                 │
│   RANDOM SELECT → 'digital_footstep_grass_2.wav'                  │
│                                                                     │
│ Output: AudioEventPayload {                                         │
│   actionType: 'PLAYER_MOVE',                                        │
│   sfxFiles: ['digital_footstep_grass_2.wav'],                      │
│   context: { biome: 'forest' },                                     │
│   priority: 'low'                                                   │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ AUDIO PROVIDER PLAYS SOUND                                          │
│ AudioProvider.playSfx():                                            │
│   sfxFile = 'digital_footstep_grass_2.wav'                         │
│   fullPath = '/asset/sound/sfx/steping_sounds/...'                 │
│   audio = new Audio(fullPath)                                       │
│   audio.volume = sfxVolume * (muted ? 0 : 1)                       │
│   audio.play()                                                      │
│   (no loop, plays once and discards)                                │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ PLAYER HEARS AUDIO                                                  │
│ Browser's Web Audio API renders sound to speakers                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Filtering Logic (Playback Mode)

**OFF Mode:**
```
Event Requested → Check playbackMode === 'off' → DISCARD IMMEDIATELY → No audio
```

**OCCASIONAL Mode (50% chance):**
```
Event Requested → Check if critical action → YES → PLAY (always critical)
                → NO → Roll dice (Math.random() > 0.5) → 50% PLAY, 50% SKIP
Critical Actions: UI_CONFIRM, UI_CANCEL, CRAFT_SUCCESS, CRAFT_FAIL, BUILD_SUCCESS, ENEMY_DEFEATED
```

**ALWAYS Mode:**
```
Event Requested → PLAY all events
```

### Biome-to-Footstep Resolution Logic

```
Player Position: { x: 5, y: 10 }
↓
Fetch Current Chunk: world[`5,10`]
↓
Extract Terrain: chunk.terrain = 'forest'
↓
Call getFootstepForBiome('forest')
  ├─ Lookup: BIOME_TERRAIN_CATEGORY['forest'] → 'grass'
  ├─ Fetch array: BIOME_FOOTSTEP_MAP['grass'] = [
  │    'digital_footstep_grass_1.wav',
  │    'digital_footstep_grass_2.wav',
  │    'digital_footstep_grass_3.wav',
  │    'digital_footstep_grass_4.wav'
  │  ]
  └─ Random select: Math.floor(Math.random() * 4) = 2
                    → 'digital_footstep_grass_3.wav'
↓
Pass to playSfx()
↓
Player hears footstep sound consistent with forest terrain
```

### Context-Aware SFX Selection (Item Pickup Example)

```
Pickup Action Triggered: item = { type: 'gem', rarity: 'epic' }
↓
Action Handler calls:
  audio.playSfxForAction(
    AudioActionType.ITEM_PICKUP,
    { itemRarity: 'epic' }
  )
↓
Audio Provider emits event → emit-audio-event.ts
↓
Mapper Resolution:
  AUDIO_EVENTS_REGISTRY[ITEM_PICKUP] = (ctx) => {
    return ctx.itemRarity === 'rare' || ctx.itemRarity === 'epic'
      ? 'gem_collect.wav'      // ← Rare sparkly sound
      : 'coin_jingle_small.wav' // ← Common jingle
  }
↓
Context evaluation: itemRarity = 'epic' → TRUE
↓
SFX File Selected: 'gem_collect.wav'
↓
Audio plays: sparkly gem sound
```

---

## 4. DATA TRACE (Concrete Example: Full Combat Sequence)

### Scenario: Player Attacks Goblin in Forest

**Initial State:**
```typescript
// Player position
playerPosition: { x: 5, y: 10 }
// Current chunk
currentChunk: { 
  terrain: 'forest',
  creatures: [{ type: 'Goblin', hp: 30, damage: 5 }]
}
// Audio settings
playbackMode: 'always'
sfxVolume: 0.9
muted: false
```

**Step 1: Player Initiates Attack**
```typescript
// Handler: useActionHandlers.ts :: handleAttack()
audio.playSfxForAction(AudioActionType.PLAYER_ATTACK, {
  isHeavyAttack: false
});
```

**Step 2: Audio Event Dispatch**
```typescript
// AudioProvider.playSfxForAction()
const event = emitAudioEvent(
  'PLAYER_ATTACK',
  { isHeavyAttack: false },
  'always' // playbackMode
);
// Result:
event = {
  actionType: 'PLAYER_ATTACK',
  sfxFiles: ['punch.wav', 'punch_2.wav', 'kick.wav'],
  context: { isHeavyAttack: false },
  priority: 'high'
}

// Random selection from array:
const sfxFile = event.sfxFiles[Math.floor(Math.random() * 3)]; // → 'punch.wav'

// Play sound
audio.play('/asset/sound/sfx/Combat\ and\ Gore/punch.wav');
```

**Step 3: Sound Plays to Player**
- Browser renders: punch sound (100ms duration)
- Player hears: "thud" punch sound

**Step 4: Attack Calculation (Combat Engine)**
```typescript
const hitChance = 0.85;
const roll = Math.random();
if (roll < hitChance) {
  damage = calculateDamage(); // 12 damage
  enemy.hp -= damage; // 30 → 18
  
  // EMIT HIT AUDIO
  audio.playSfxForAction(AudioActionType.ENEMY_HIT, {});
}
```

**Step 5: Enemy Hit Audio Event**
```typescript
// AudioProvider.playSfxForAction()
const event = emitAudioEvent(
  'ENEMY_HIT',
  {},
  'always'
);
// Result:
event = {
  actionType: 'ENEMY_HIT',
  sfxFiles: ['slap.wav', 'swipe.wav', 'splat_quick.wav'],
  context: {},
  priority: 'medium'
}

const sfxFile = event.sfxFiles[Math.floor(Math.random() * 3)]; // → 'slap.wav'
audio.play('/asset/sound/sfx/Combat\ and\ Gore/slap.wav');
```

**Step 6: Sound Plays to Player**
- Browser renders: impact sound (80ms duration)
- Player hears: quick "slap" impact sound

**Step 7: Combat Continues... (Assume player attacks 2 more times)**
- Attack 2: punch.wav → hit → splat_quick.wav (18 → 6 HP)
- Attack 3: punch_2.wav → hit → crunch.wav (6 → -5 HP = dead)

**Step 8: Enemy Defeated**
```typescript
if (enemy.hp <= 0) {
  addNarrativeEntry(`Defeated Goblin!`, 'narrative');
  
  // EMIT DEFEAT AUDIO
  audio.playSfxForAction(AudioActionType.ENEMY_DEFEATED, {
    creatureType: 'Goblin'
  });
}
```

**Step 9: Enemy Defeated Audio Event**
```typescript
// AudioProvider.playSfxForAction()
const event = emitAudioEvent(
  'ENEMY_DEFEATED',
  { creatureType: 'Goblin' },
  'always'
);
// Result:
event = {
  actionType: 'ENEMY_DEFEATED',
  sfxFiles: ['crunch_splat.wav'],
  context: { creatureType: 'Goblin' },
  priority: 'high' // critical event
}

const sfxFile = 'crunch_splat.wav';
audio.play('/asset/sound/sfx/Combat\ and\ Gore/crunch_splat.wav');
```

**Step 10: Sound Plays to Player**
- Browser renders: heavy squelch/crunch sound (200ms)
- Player hears: satisfying "crunch" defeated sound

**Final Audio Sequence Heard by Player:**
```
[100ms] PUNCH - [80ms pause] - SLAP
[120ms] PUNCH - [80ms pause] - SPLAT
[120ms] PUNCH - [80ms pause] - CRUNCH (victory)
```

**Total time:** ~700ms of audio feedback over ~5-10 second combat sequence. Highly satisfying! ✅

---

## 5. TEST PLAN & COVERAGE

### Unit Tests

#### `audio-events.ts` Tests
```typescript
describe('audio-events.ts', () => {
  test('PLAYER_MOVE returns footstep for valid biome', () => {
    const mapper = AUDIO_EVENTS_REGISTRY[AudioActionType.PLAYER_MOVE];
    const result = mapper({ biome: 'forest' });
    expect(result).toContain('digital_footstep_grass');
  });
  
  test('ITEM_PICKUP returns gem_collect for rare items', () => {
    const mapper = AUDIO_EVENTS_REGISTRY[AudioActionType.ITEM_PICKUP];
    const result = mapper({ itemRarity: 'epic' });
    expect(result).toBe('gem_collect.wav');
  });
  
  test('All action types have mappings', () => {
    Object.values(AudioActionType).forEach(actionType => {
      expect(AUDIO_EVENTS_REGISTRY[actionType]).toBeDefined();
    });
  });
});
```

#### `biome-footsteps.ts` Tests
```typescript
describe('biome-footsteps.ts', () => {
  test('forest returns grass footstep', () => {
    const result = getFootstepForBiome('forest');
    expect(result).toMatch(/digital_footstep_grass/);
  });
  
  test('cave returns gravel footstep', () => {
    const result = getFootstepForBiome('cave');
    expect(result).toMatch(/digital_footstep_gravel/);
  });
  
  test('tundra returns snow footstep', () => {
    const result = getFootstepForBiome('tundra');
    expect(result).toMatch(/digital_footstep_snow/);
  });
  
  test('unknown biome returns generic rustle', () => {
    const result = getFootstepForBiome('unknown_biome');
    expect(result).toMatch(/rustle/);
  });
  
  test('undefined biome returns generic rustle', () => {
    const result = getFootstepForBiome(undefined);
    expect(result).toMatch(/rustle/);
  });
});
```

#### `emit-audio-event.ts` Tests
```typescript
describe('emit-audio-event.ts', () => {
  test('returns null when playbackMode is off', () => {
    const result = emitAudioEvent(
      AudioActionType.PLAYER_MOVE,
      {},
      'off'
    );
    expect(result).toBeNull();
  });
  
  test('occasionally filters non-critical events (50% chance)', () => {
    const results = [];
    for (let i = 0; i < 100; i++) {
      const result = emitAudioEvent(
        AudioActionType.PLAYER_MOVE,
        {},
        'occasional'
      );
      results.push(result !== null);
    }
    const playRate = results.filter(r => r).length / 100;
    // Should be roughly 50% ±20%
    expect(playRate).toBeGreaterThan(0.3);
    expect(playRate).toBeLessThan(0.7);
  });
  
  test('always plays critical events even in occasional mode', () => {
    const result = emitAudioEvent(
      AudioActionType.CRAFT_SUCCESS,
      {},
      'occasional'
    );
    expect(result).not.toBeNull();
  });
  
  test('returns AudioEventPayload with correct structure', () => {
    const result = emitAudioEvent(
      AudioActionType.PLAYER_ATTACK,
      {},
      'always'
    );
    expect(result).toHaveProperty('actionType');
    expect(result).toHaveProperty('sfxFiles');
    expect(result).toHaveProperty('priority');
    expect(Array.isArray(result.sfxFiles)).toBe(true);
  });
});
```

#### `AudioProvider.tsx` Integration Tests
```typescript
describe('AudioProvider.tsx', () => {
  test('playSfxForAction dispatches correct audio file', async () => {
    const mockAudio = jest.fn();
    global.Audio = jest.fn(() => ({
      play: mockAudio,
      volume: 1,
    }));
    
    const { result } = renderHook(() => useAudio(), {
      wrapper: AudioProvider
    });
    
    act(() => {
      result.current.playSfxForAction(AudioActionType.PLAYER_MOVE, { biome: 'forest' });
    });
    
    expect(mockAudio).toHaveBeenCalled();
  });
});
```

#### Integration Tests (Action Handlers)
```typescript
describe('useActionHandlers audio integration', () => {
  test('handleMove emits PLAYER_MOVE audio event', async () => {
    const mockAudio = jest.fn();
    const deps = createMockActionHandlerDeps();
    
    const { handleMove } = useActionHandlers({
      ...deps,
      audioContext: { playSfxForAction: mockAudio }
    });
    
    handleMove('north');
    
    expect(mockAudio).toHaveBeenCalledWith(
      AudioActionType.PLAYER_MOVE,
      expect.objectContaining({ biome: expect.any(String) })
    );
  });
});
```

### Manual Testing Checklist

- [ ] Start game, move in forest → hear footsteps (grass variant)
- [ ] Move to cave → hear different footsteps (gravel variant)
- [ ] Move to tundra → hear snow footsteps
- [ ] Attack creature → hear punch/kick sound
- [ ] Punch hits → hear impact sound
- [ ] Creature defeated → hear crunch/squelch
- [ ] Pickup common item → hear coin jingle
- [ ] Pickup rare item → hear gem sparkle
- [ ] Craft success → hear sting sound
- [ ] Craft fail → hear error buzz
- [ ] Till soil → hear shovel dig
- [ ] Water crops → hear water drop
- [ ] Build structure → hear construction, then success sting
- [ ] Harvest plant → hear collection sounds
- [ ] Click UI button → hear click
- [ ] Hover button → hear hover sound (optional)
- [ ] Set playback mode to "off" → no SFX
- [ ] Set playback mode to "occasional" → ~50% SFX
- [ ] Adjust SFX volume slider → volume changes
- [ ] No console errors during gameplay
- [ ] Audio settings persist after reload

---

## 6. CI VALIDATION CHECKLIST

### Type Safety
- [ ] `npm run typecheck` passes (zero TS errors)
- [ ] All new types exported correctly
- [ ] No `any` types in new code (except integration points)

### Tests
- [ ] `npm run test` passes (all tests pass)
- [ ] No test failures or warnings
- [ ] Coverage ≥80% for new modules

### Code Quality
- [ ] `npm run lint` passes (ESLint checks pass)
- [ ] No unused imports or variables
- [ ] No console.log() in production code
- [ ] Documentation headers (tSDoc) on all public functions

### Runtime
- [ ] Dev server starts: `npm run dev` → success
- [ ] No runtime errors in console
- [ ] Audio plays correctly in dev server
- [ ] All priority actions emit SFX (manual verification)

### Git
- [ ] No merge conflicts
- [ ] All files formatted (Prettier applied)
- [ ] Commit message follows conventional commits

---

## 7. RISK MITIGATION

### Risk: Audio File Path Errors
**Mitigation:** Graceful fallback if SFX file missing
```typescript
try {
  audio.play(fullPath);
} catch (err) {
  console.warn(`Audio file not found: ${fullPath}`, err);
  // Silently fail; game continues
}
```

### Risk: Audio Overlap / Spam
**Mitigation:** Playback mode filtering; debounce same event within 100ms
```typescript
const lastEventTime: Record<string, number> = {};

function shouldPlayAudio(actionType: AudioActionType): boolean {
  const now = Date.now();
  const lastTime = lastEventTime[actionType] || 0;
  if (now - lastTime < 100) return false; // debounce
  lastEventTime[actionType] = now;
  return true;
}
```

### Risk: Old Saves Don't Have Audio Settings
**Mitigation:** Provide defaults when loading
```typescript
const audioSettings = savedGame.audioSettings || {
  musicVolume: 0.6,
  sfxVolume: 0.9,
  muted: false,
  playbackMode: 'off',
  playbackIntervalMinutes: 3
};
```

### Risk: Audio API Not Supported
**Mitigation:** Feature detection
```typescript
if (typeof Audio === 'undefined') {
  console.warn('Web Audio API not supported; audio disabled');
  return () => {}; // no-op audio functions
}
```

---

## 8. SUCCESS CRITERIA

✅ **Execution Complete When:**

1. **Audio Triggers:**
   - Movement plays biome-specific footsteps
   - Combat plays punch/kick → impact → defeat SFX
   - Crafting plays success/fail stings
   - Farming plays tool sounds (shovel, water, etc.)
   - Building plays construction + success
   - Item pickup plays jingles
   - UI buttons play click sounds

2. **Filtering Works:**
   - Playback mode "off" → no SFX
   - Playback mode "occasional" → ~50% SFX
   - Playback mode "always" → all SFX
   - Critical events always play (override occasional)

3. **Biome Detection:**
   - Forest/grassland/jungle → grass footsteps
   - Desert/mountain/cave → gravel footsteps
   - Tundra → snow footsteps
   - City/space_station → wood footsteps
   - Unknown → generic rustles

4. **Persistence:**
   - Audio settings saved in game saves
   - Settings restored on game load
   - Volume levels persist

5. **Quality:**
   - `npm run typecheck` passes ✅
   - `npm run test` passes ✅
   - No console errors ✅
   - Manual testing verified ✅
   - No breaking changes to existing code ✅

---

## 9. TIMELINE ESTIMATE

| Phase | Task | Hours | Total |
|-------|------|-------|-------|
| 1 | Foundation (audio-events, biome-footsteps, emit-audio-event) | 3 | 3 |
| 2 | Audio Provider integration | 2 | 5 |
| 2 | Expand assets.ts | 1 | 6 |
| 3 | Wire action handlers (move, attack, pickup) | 3 | 9 |
| 3 | Wire farming/crafting/building/harvest | 2 | 11 |
| 4 | UI button audio | 1 | 12 |
| 4 | Settings panel updates | 1 | 13 |
| 5 | Persistence layer | 1 | 14 |
| 6 | Unit tests | 2 | 16 |
| 6 | Manual testing + fixes | 2 | 18 |
| **Total** | | | **~18 hours** |

---

## 10. NEXT STEP

✅ **Ready for execution.** Start with Phase 1, Step 1.1: Create `src/lib/definitions/audio-events.ts`.

Approval to proceed? Or adjust scope/requirements?

