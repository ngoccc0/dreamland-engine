import { GridPosition } from '../values/grid-position';

/**
 * OVERVIEW: Base entity system
 *
 * Defines core entity interface and container pattern for all game objects.
 * Every interactive object (player, creature, plant, item, structure) implements Entity.
 * Provides polymorphic type system allowing different entities to coexist in same collections.
 * Supports modding through flexible attributes Record<string, any>.
 *
 * ## Entity Interface (Entity)
 *
 * Common interface all game objects must implement:
 *
 * ```typescript
 * interface Entity {
 *   id: string,                    // Unique identifier
 *   type: string,                  // Category (player, creature, plant, item, structure)
 *   position: GridPosition,        // Location {x, y}
 *   attributes: Record<string, any>, // Flexible property store
 * }
 * ```
 *
 * ### Entity Types
 *
 * | Type | Examples | Health | Behavior | Notes |
 * |------|----------|--------|----------|-------|
 * | player | Character | Yes | Player-controlled | Always 1 per game |
 * | creature | Goblin, Wolf, Boss | Yes | AI-controlled | Combat capable |
 * | plant | Apple Tree, Grass, Flower | No | Grows over time | Environmental |
 * | item | Sword, Potion, Key | No | Static | Inventory-able |
 * | structure | House, Door, Gate | Maybe | Static | Environmental |
 * | npc | Merchant, Guard, Elder | Yes | Scripted AI | Quest givers |
 * | projectile | Arrow, Spell, Bomb | No | Physics-based | Temporary |
 * | effect | Fire, Poison, Buff | No | Invisible | Status effect |
 *
 * ### ID System
 *
 * Unique identifier format: `{type}_{instanceId}`
 *
 * Examples:
 * - `player_1` (always the player)
 * - `creature_goblin_42` (goblin #42)
 * - `plant_tree_oak_127` (oak tree #127)
 * - `item_sword_excalibur_1` (excalibur instance 1)
 * - `structure_house_village_3` (village house #3)
 *
 * ### Position (GridPosition)
 *
 * Location in world grid:
 *
 * ```typescript
 * position: {x: 15, y: -42}  // Coordinates in cells
 * ```
 *
 * Used for:
 * - Distance calculations (Chebyshev range)
 * - Visibility checks (line of sight)
 * - Collision detection
 * - Spatial indexing (chunk membership)
 *
 * ### Attributes (Flexible Storage)
 *
 * Dynamic property system allowing custom data per entity type:
 *
 * ```typescript
 * // Player
 * player.attributes = {
 *   health: 100,
 *   mana: 50,
 *   level: 5,
 *   inventory: [item1, item2],
 *   skills: [skill1, skill2],
 *   customField: true  // Modding-enabled
 * }
 *
 * // Creature
 * creature.attributes = {
 *   health: 30,
 *   aggression: 0.8,
 *   lootTable: {...},
 *   behavior: 'hunting'
 * }
 *
 * // Plant
 * plant.attributes = {
 *   growthStage: 2,        // 0-3
 *   harvestable: false,
 *   reproduction: 0.5,
 *   stress: 0.2
 * }
 * ```
 *
 * ### Type Checking
 *
 * Query entities by type:
 *
 * ```typescript
 * const creatures = entities.filter(e => e.type === 'creature')
 * const plants = entities.filter(e => e.type === 'plant')
 * const hasPlayer = entities.some(e => e.type === 'player')
 * ```
 *
 * ## IEntityContainer Interface
 *
 * Pattern for any collection holding entities:
 *
 * ```typescript
 * interface IEntityContainer {
 *   entities: Entity[],               // Current contents
 *   addEntity(entity): void           // Add entity
 *   removeEntity(entityId): void      // Remove by ID
 *   getEntities(): Entity[]           // Get all (copy)
 * }
 * ```
 *
 * ### Implementers
 *
 * - **Chunk**: Contains all entities in 16×16 area
 * - **Terrain**: Contains plants/creatures on terrain type
 * - **Inventory**: Contains items owned by character
 * - **Combat**: Contains combatants in battle
 * - **World**: Contains all loaded entities
 *
 * ### Usage Pattern
 *
 * ```typescript
 * const container: IEntityContainer = new Chunk(...)
 *
 * // Add
 * container.addEntity(creature)
 *
 * // Query
 * const all = container.getEntities()
 * const filtered = all.filter(e => e.type === 'creature')
 *
 * // Remove
 * container.removeEntity(creature.id)
 * ```
 *
 * ## Entity Lifecycle
 *
 * ### Creation
 * ```
 * new Entity({
 *   id: 'creature_goblin_1',
 *   type: 'creature',
 *   position: {x: 10, y: 20},
 *   attributes: {health: 30, ...}
 * })
 * ```
 *
 * ### Existence
 * ```
 * - Updates: attributes modified by engines (plant grows, creature moves)
 * - Queries: checked by usecases (combat engine checks if in range)
 * - Serialization: persisted to database
 * ```
 *
 * ### Destruction
 * ```
 * - Death: creature with health ≤ 0
 * - Harvest: plant picked
 * - Consumed: item used up
 * - Removal: container.removeEntity(id)
 * ```
 *
 * ## Entity Query Patterns
 *
 * ### Common Queries
 *
 * ```typescript
 * // Find all creatures in chunk
 * creatures = chunk.getEntities().filter(e => e.type === 'creature')
 *
 * // Find creatures near player (range 10 cells)
 * nearby = creatures.filter(c =>
 *   chebyshevDistance(c.position, player.position) <= 10
 * )
 *
 * // Find entity by ID
 * entity = chunk.getEntities().find(e => e.id === 'creature_42')
 *
 * // Get all hostile entities
 * hostile = chunk.getEntities().filter(e =>
 *   e.type === 'creature' && e.attributes.aggression > 0.5
 * )
 *
 * // Check if player overlaps with structure
 * collision = structure.position.x === player.position.x &&
 *             structure.position.y === player.position.y
 * ```
 *
 * ## Design Philosophy
 *
 * - **Polymorphic**: Single interface for all entity types
 * - **Flexible**: attributes allow custom properties without subclassing
 * - **Modding-Friendly**: Dynamic fields support third-party extensions
 * - **Efficient**: Type string for fast filtering
 * - **Spatial-Aware**: Position support for distance calculations
 * - **Composable**: Container pattern used throughout (DRY)
 *
 * ## Performance Considerations
 *
 * | Operation | Complexity | Optimization |
 * |-----------|-----------|----------|
 * | Create entity | O(1) | Reuse object pools in performance-critical code |
 * | Add to container | O(1) | Simple append to array |
 * | Find by ID | O(n) | Use Map<id, entity> for hot paths |
 * | Filter by type | O(n) | Cache results if used multiple times/frame |
 * | Distance query | O(n) | Use spatial partitioning (quad-tree) at scale |
 * | Remove from container | O(n) | Mark as "inactive" instead of array removal |
 *
 */
export interface Entity {
    /** Unique identifier for the entity. */
    id: string;
    /** The type of the entity (e.g., 'player', 'monster', 'item', 'structure'). */
    type: string;
    /** The grid position of the entity in the game world. */
    position: GridPosition;
    /** A flexible record of attributes associated with the entity. */
    attributes: Record<string, any>;
}

/**
 * Interface for containers that can hold multiple entities.
 * This allows for consistent management of entities within different game components (e.g., chunks, inventories).
 */
export interface IEntityContainer {
    /** An array of entities currently within this container. */
    entities: Entity[];
    /**
     * Adds an entity to the container.
     * @param entity - The {@link Entity} to add.
     */
    addEntity(entity: Entity): void;
    /**
     * Removes an entity from the container by its ID.
     * @param entityId - The unique ID of the entity to remove.
     */
    removeEntity(entityId: string): void;
    /**
     * Retrieves all entities currently in the container.
     * @returns An array of {@link Entity} objects.
     */
    getEntities(): Entity[];
}
