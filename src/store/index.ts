/**
 * @file src/store/index.ts
 * @description Barrel export for all Zustand stores
 * 
 * @remarks
 * Centralized import point: import all stores and selectors from @/store
 */

export {
  usePlayerStore,
  usePlayerHp,
  usePlayerSatiety,
  usePlayerStamina,
  usePlayerInventory,
  usePlayerAttributes,
} from './player.store';

export {
  useEffectStore,
  useActiveEffects,
  useActiveEffectCount,
} from './effect.store';

export {
  useTimeStore,
  useGameTimeDisplay,
  useGameDay,
  useGameSeason,
  useAccumulatedMs,
  type Season,
} from './time.store';

export {
  useWorldStore,
  useCreatures,
  useCreatureById,
  useWeather,
  useCurrentBiome,
} from './world.store';

export {
  useNarrativeStore,
  useNarrativeText,
  useNarrativeHistory,
  useNarrativeMood,
} from './narrative.store';

export {
  useActionStore,
} from './action.store';

export {
  useUIStore,
  type DialogState,
} from './ui.store';
export {
  useHudStore,
  selectPlayerHp,
  selectPlayerMaxHp,
  selectPlayerHunger,
  selectPlayerEnergy,
  selectPlayerLevel,
  selectGameHour,
  selectGameDay,
  selectSeason,
  selectWeatherCondition,
  selectTemperature,
  selectLocationName,
  type PlayerStats,
  type GameTimeState,
  type WeatherState,
  type LocationState,
} from './hud.store';

export {
  useMinimapStore,
  selectGridData,
  selectGridCenter,
  selectAnimating,
  selectViewportSize,
  type MinimapGridData,
  type MinimapAnimationState,
} from './minimap.store';

export {
  useControlsStore,
  selectSelectedAction,
  selectShowJoystick,
  selectInputMode,
  type InputMode,
} from './controls.store';