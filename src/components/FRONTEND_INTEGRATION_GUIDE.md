/**
 * Frontend Integration Guide: NPC & Dungeon Monster Rendering
 *
 * This document explains how React components should read and render
 * NPCs and dungeon monsters from worldState.
 *
 * =============================================================================
 * PART 1: READING NPC DATA FROM WORLD STATE
 * =============================================================================
 *
 * **Data Structure** (from WorldDefinition):
 * ```typescript
 * worldState.unlockedNPCs?: UnlockedNPC[]
 * // Each NPC:
 * {
 *   npcId: string;              // Unique ID (e.g., "settlement-1_merchant")
 *   name?: TranslatableString;  // { en: "Smith", vi: "Thợ Fe" }
 *   role: 'merchant' | 'quest_giver' | 'trainer' | 'storyteller';
 *   settlementId?: string;      // Associated settlement ID
 *   position?: GridPosition;    // { x: 5, y: 7 }
 *   unlockedAt?: string;        // ISO timestamp
 * }
 * ```
 *
 * **Usage in React Components**:
 *
 * Example 1: Render NPCs in Settlement View
 * ```typescript
 * import { getTranslatedText } from "@/lib/utils";
 * import type { UnlockedNPC } from "@/core/types/game";
 *
 * const SettlementNPCs = ({ npcList }: { npcList: UnlockedNPC[] }) => {
 *   const language = useLanguage(); // Get current language from context
 *
 *   return (
 *     <div className="npc-list">
 *       {npcList.map((npc) => (
 *         <NpcCard
 *           key={npc.npcId}
 *           name={getTranslatedText(npc.name, language)}
 *           role={npc.role}
 *           onClick={() => openNpcDialog(npc.npcId)}
 *         />
 *       ))}
 *     </div>
 *   );
 * };
 * ```
 *
 * Example 2: Filter NPCs by Settlement
 * ```typescript
 * const settlementNPCs = worldState.unlockedNPCs?.filter(
 *   (npc) => npc.settlementId === settlementId
 * ) ?? [];
 * ```
 *
 * Example 3: Filter NPCs by Role
 * ```typescript
 * const merchants = worldState.unlockedNPCs?.filter(
 *   (npc) => npc.role === 'merchant'
 * ) ?? [];
 *
 * const questGivers = worldState.unlockedNPCs?.filter(
 *   (npc) => npc.role === 'quest_giver'
 * ) ?? [];
 * ```
 *
 * =============================================================================
 * PART 2: READING DUNGEON MONSTERS FROM WORLD STATE
 * =============================================================================
 *
 * **Data Structure** (from WorldDefinition):
 * ```typescript
 * worldState.dungeonMonsters?: Record<string, DungeonMonster[]>
 * // Keyed by dungeon ID: "dungeon-1" → [monster array]
 * // Each monster:
 * {
 *   id: string;           // Unique spawn ID (e.g., "goblin_0")
 *   creatureType: string; // Monster type (e.g., "goblin", "orc")
 *   level: number;        // Monster level (scaled to dungeon difficulty)
 *   health: number;       // Current HP
 *   loot?: any[];         // Loot table for drops
 *   position?: GridPosition;  // Optional position within dungeon
 * }
 * ```
 *
 * **Usage in React Components**:
 *
 * Example 1: Render Monsters in Dungeon Encounter
 * ```typescript
 * import type { DungeonMonster } from "@/core/types/game";
 *
 * const DungeonEncounter = ({ dungeonId }: { dungeonId: string }) => {
 *   const monsters = worldState.dungeonMonsters?.[dungeonId] ?? [];
 *
 *   return (
 *     <div className="encounter-area">
 *       {monsters.map((monster) => (
 *         <MonsterSprite
 *           key={monster.id}
 *           creature={monster.creatureType}
 *           level={monster.level}
 *           health={monster.health}
 *           position={monster.position}
 *           onClick={() => selectMonsterForCombat(monster.id)}
 *         />
 *       ))}
 *     </div>
 *   );
 * };
 * ```
 *
 * Example 2: Display Monster Stats in UI
 * ```typescript
 * const MonsterCard = ({ monster }: { monster: DungeonMonster }) => {
 *   // Get creature definition for appearance
 *   const creatureDefinition = creatureDefinitions[monster.creatureType];
 *
 *   return (
 *     <div className="monster-card">
 *       <img src={creatureDefinition.imageUrl} alt={monster.creatureType} />
 *       <h3>{creatureDefinition.name} (Lvl {monster.level})</h3>
 *       <div>HP: {monster.health} / {creatureDefinition.hp}</div>
 *       <div>Loot: {monster.loot?.length ?? 0} items</div>
 *     </div>
 *   );
 * };
 * ```
 *
 * Example 3: Get All Monsters in Dungeon
 * ```typescript
 * const getAllDungeonMonsters = (dungeonId: string): DungeonMonster[] => {
 *   return worldState.dungeonMonsters?.[dungeonId] ?? [];
 * };
 * ```
 *
 * Example 4: Count Living vs Defeated Monsters
 * ```typescript
 * const dungeon = worldState.dungeonMonsters?.[dungeonId] ?? [];
 * const aliveMonsters = dungeon.filter(m => m.health > 0);
 * const defeatedMonsters = dungeon.filter(m => m.health <= 0);
 * ```
 *
 * =============================================================================
 * PART 3: HANDLING NPC/MONSTER POSITIONS IN GRID
 * =============================================================================
 *
 * **Position Data**:
 * Both NPCs and monsters may have `position?: GridPosition`
 * ```typescript
 * interface GridPosition {
 *   x: number;  // Grid X coordinate
 *   y: number;  // Grid Y coordinate
 * }
 * ```
 *
 * **Rendering on Game World Grid**:
 * ```typescript
 * const WorldGrid = () => {
 *   const GRID_SIZE = 32; // pixels per grid cell
 *
 *   return (
 *     <div className="world-grid">
 *       {/* Render discovered settlements */}
 *       {worldState.discoveredSettlements?.map((settlement) => (
 *         <SettlementMarker
 *           key={settlement.id}
 *           x={settlement.position.x * GRID_SIZE}
 *           y={settlement.position.y * GRID_SIZE}
 *           name={getTranslatedText(settlement.name, language)}
 *         />
 *       ))}
 *
 *       {/* Render unlocked NPCs at their positions */}
 *       {worldState.unlockedNPCs
 *         ?.filter((npc) => npc.position) // Only if position is set
 *         .map((npc) => (
 *           <NpcSprite
 *             key={npc.npcId}
 *             x={(npc.position!.x) * GRID_SIZE}
 *             y={(npc.position!.y) * GRID_SIZE}
 *             name={getTranslatedText(npc.name, language)}
 *             role={npc.role}
 *           />
 *         ))}
 *     </div>
 *   );
 * };
 * ```
 *
 * =============================================================================
 * PART 4: STATE MANAGEMENT - KEEPING NPC/MONSTER DATA IN SYNC
 * =============================================================================
 *
 * **Using Redux/Zustand Store**:
 * ```typescript
 * // In your game state store:
 * interface GameState {
 *   worldState: WorldDefinition;
 *   updateWorldState: (updates: Partial<WorldDefinition>) => void;
 * }
 *
 * // In components:
 * const worldState = useGameStore((state) => state.worldState);
 * const npcs = worldState.unlockedNPCs ?? [];
 * ```
 *
 * **Real-time Updates**:
 * When the backend discovers new settlements/dungeons:
 * 1. Server triggers `handleSettlementDiscovery()` or `handleDungeonDiscovery()`
 * 2. worldState is updated with new NPCs/monsters
 * 3. Component re-renders automatically (via hook dependency)
 *
 * =============================================================================
 * PART 5: COMMON PATTERNS & BEST PRACTICES
 * =============================================================================
 *
 * **Pattern 1: Safe Null Checks**
 * ```typescript
 * // ✅ GOOD
 * const npcs = worldState.unlockedNPCs ?? [];
 * const monsters = worldState.dungeonMonsters?.[dungeonId] ?? [];
 *
 * // ❌ AVOID
 * const npcs = worldState.unlockedNPCs!; // Assumes always exists
 * ```
 *
 * **Pattern 2: Filter & Map in One Pass**
 * ```typescript
 * // ✅ GOOD
 * const merchantCards = worldState.unlockedNPCs
 *   ?.filter((npc) => npc.role === 'merchant')
 *   .map((npc) => <MerchantCard key={npc.npcId} npc={npc} />);
 * ```
 *
 * **Pattern 3: Memoize Filtered Lists**
 * ```typescript
 * const merchantList = useMemo(() => {
 *   return worldState.unlockedNPCs?.filter((npc) => npc.role === 'merchant') ?? [];
 * }, [worldState.unlockedNPCs]);
 * ```
 *
 * **Pattern 4: Create Selector Hook**
 * ```typescript
 * export function useNpcsByRole(role: string) {
 *   const worldState = useGameStore((state) => state.worldState);
 *   return useMemo(() => {
 *     return worldState.unlockedNPCs?.filter((npc) => npc.role === role) ?? [];
 *   }, [worldState.unlockedNPCs, role]);
 * }
 *
 * // Usage:
 * const merchants = useNpcsByRole('merchant');
 * ```
 *
 * =============================================================================
 * PART 6: TYPESCRIPT TYPE SAFETY
 * =============================================================================
 *
 * **Import Types from game.ts**:
 * ```typescript
 * import type {
 *   WorldDefinition,
 *   UnlockedNPC,
 *   DungeonMonster,
 *   DiscoveredSettlement,
 *   GridPosition
 * } from '@/core/types/game';
 * ```
 *
 * **Strongly Type Component Props**:
 * ```typescript
 * interface SettlementViewProps {
 *   settlement: DiscoveredSettlement;
 *   npcs: UnlockedNPC[];
 *   onNpcClick: (npc: UnlockedNPC) => void;
 * }
 *
 * const SettlementView = ({ settlement, npcs, onNpcClick }: SettlementViewProps) => {
 *   // TypeScript will validate property access
 * };
 * ```
 *
 * =============================================================================
 * PART 7: PERFORMANCE OPTIMIZATION
 * =============================================================================
 *
 * **Problem**: Re-rendering all NPCs when any NPC updates
 * **Solution 1**: Memoize individual NPC components
 * ```typescript
 * const NpcItem = React.memo(({ npc }: { npc: UnlockedNPC }) => (
 *   <div>{getTranslatedText(npc.name, language)}</div>
 * ));
 * ```
 *
 * **Solution 2**: Use virtualization for large lists
 * ```typescript
 * import { FixedSizeList } from 'react-window';
 *
 * const NpcList = ({ npcs }: { npcs: UnlockedNPC[] }) => (
 *   <FixedSizeList height={400} itemCount={npcs.length} itemSize={50}>
 *     {({ index, style }) => (
 *       <div style={style}>
 *         <NpcItem npc={npcs[index]} />
 *       </div>
 *     )}
 *   </FixedSizeList>
 * );
 * ```
 *
 * =============================================================================
 * REFERENCE: Data Flow Diagram
 * =============================================================================
 *
 * BACKEND:                          FRONTEND:
 * ─────────────────────────────────────────────────────
 * Discovery Found                   [React Hook]
 *   ↓                               ↓
 * handleSettlementDiscovery()      useGameStore
 *   ↓                               ↓
 * worldState.unlockedNPCs.push()   component.setState()
 *   ↓                               ↓
 * saveWorldState()                  Re-render
 *   ↓                               ↓\n * Sync to DB              Display NPCs in UI\n * ┌──────────────────────────────────────────────────────┐\n * │ NPCs are NOW visible in game world at their positions  │\n * └──────────────────────────────────────────────────────┘\n */\n\n// This file is for documentation only.\n// Import the types and use the patterns described above in your React components.\n