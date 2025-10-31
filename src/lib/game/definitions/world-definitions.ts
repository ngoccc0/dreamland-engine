/**
 * Interface representing the serializable state of the game world for use in GameState and modding.
 * Should be implemented by GameWorld entity class.
 * @see GameWorld in src/core/entities/world.ts
 */
export interface WorldDefinition {
  regions: Array<any>; // TODO: Strongly type with RegionDefinition
  weatherSystem: any; // TODO: Strongly type with WeatherSystemDefinition
}

/**
 * Interface representing the serializable state of the player for use in GameState and modding.
 * Should be implemented by Character entity class.
 * @see Character in src/core/entities/character.ts
 */
export interface PlayerStatusDefinition {
  id: string;
  name: string;
  level: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  experience: number;
  position: { x: number; y: number };
  inventory: Array<any>; // TODO: Strongly type with ItemDefinition
  activeEffects: Array<any>; // TODO: Strongly type with EffectDefinition
  skills: string[];
  stats: any; // TODO: Strongly type with CharacterStatsDefinition
}
