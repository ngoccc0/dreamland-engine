/**
 * Interface representing the serializable state of the game world.
 * This definition is crucial for saving/loading game progress and for modding,
 * allowing external tools to understand and interact with the world's structure.
 * It should be implemented by the `GameWorld` entity class.
 * @see {@link GameWorld} in `src/core/entities/world.ts`
 */
export interface WorldDefinition {
  /**
   * An array of regions within the world.
   * @todo Strongly type with `RegionDefinition` once available.
   */
  regions: Array<any>; 
  /**
   * The current state of the world's weather system.
   * @todo Strongly type with `WeatherSystemDefinition` once available.
   */
  weatherSystem: any; 
}

/**
 * Interface representing the serializable state of the player character.
 * This definition is vital for saving/loading player progress and for modding,
 * enabling external tools to understand and modify player attributes and inventory.
 * It should be implemented by the `Character` entity class.
 * @see {@link Character} in `src/core/entities/character.ts`
 */
export interface PlayerStatusDefinition {
  /** Unique identifier for the player character. */
  id: string;
  /** The display name of the player character. */
  name: string;
  /** The current experience level of the player. */
  level: number;
  /** The current health points of the player. */
  health: number;
  /** The maximum health points the player can have. */
  maxHealth: number;
  /** The current mana points of the player. */
  mana: number;
  /** The maximum mana points the player can have. */
  maxMana: number;
  /** The current experience points accumulated by the player. */
  experience: number;
  /** The current position of the player in the world (x, y coordinates). */
  position: { x: number; y: number };
  /**
   * The player's inventory.
   * @todo Strongly type with `ItemDefinition` once available.
   */
  inventory: Array<any>; 
  /**
   * A list of active effects currently applied to the player.
   * @todo Strongly type with `EffectDefinition` once available.
   */
  activeEffects: Array<any>; 
  /** A list of skill IDs the player has acquired. */
  skills: string[];
  /**
   * The player's core statistics (e.g., strength, intelligence).
   * @todo Strongly type with `CharacterStatsDefinition` once available.
   */
  stats: any; 
}
