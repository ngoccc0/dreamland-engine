/**
 * @file src/store/useGameLayoutSelectors.ts
 * @description Granular Zustand selectors for GameLayout sections
 *
 * @remarks
 * Prevents prop drilling by allowing each GameLayout section (HudSection,
 * MiniMapSection, DialogSection, ControlsSection) to subscribe only to
 * the data it needs.
 *
 * **Key Principle:** When HUD data changes, only HudSection re-renders.
 * When dialog opens, only DialogSection re-renders. No cascade re-renders.
 *
 * **Pattern:**
 * ```typescript
 * // OLD (Bad - causes cascade re-renders)
 * export function GameLayout(props) {
 *   return (
 *     <HudSection playerStats={props.playerStats} gameTime={props.gameTime} />
 *     <MiniMapSection gridData={props.gridData} />
 *   )
 * }
 *
 * // NEW (Good - granular subscriptions)
 * export function HudSection() {
 *   const playerStats = useHudDataSelector('playerStats')
 *   const gameTime = useHudDataSelector('gameTime')
 *   return <DisplayStats stats={playerStats} time={gameTime} />
 * }
 * ```
 *
 * **TypeScript:**
 * Each selector uses Zustand's "selector pattern" to return only needed fields.
 * Combined selectors use useShallow for shallow equality checks.
 */

import { useShallow } from 'zustand/react/shallow';
import { useHudStore, type PlayerStats, type GameTimeState, type WeatherState, type LocationState } from './hud.store';
import { useUIStore, type DialogState, type EphemeralUIState } from './ui.store';
import { useMinimapStore, type MinimapGridData, type MinimapAnimationState } from './minimap.store';
import { useControlsStore, type InputMode } from './controls.store';

/**
 * Select player statistics only.
 * Used by: StatusDisplay, HealthBar, ExperienceBar
 */
export const usePlayerStatsSelector = () =>
  useHudStore(
    useShallow((state) => state.playerStats),
  );

/**
 * Select game time state only.
 * Used by: TimeDisplay, DayPhaseIndicator
 */
export const useGameTimeSelector = () =>
  useHudStore(
    useShallow((state) => state.gameTime),
  );

/**
 * Select weather state only.
 * Used by: WeatherDisplay, TemperatureIndicator
 */
export const useWeatherSelector = () =>
  useHudStore(
    useShallow((state) => state.weather),
  );

/**
 * Select location state only.
 * Used by: LocationDisplay, BiomeIndicator
 */
export const useLocationSelector = () =>
  useHudStore(
    useShallow((state) => state.location),
  );

/**
 * Combined HUD data selector.
 * Used by: HudSection (when it needs all HUD data at once)
 *
 * @remarks
 * Returns all HUD data. Equivalent to:
 * { playerStats, gameTime, weather, location }
 */
export const useHudDataSelector = () =>
  useHudStore(
    useShallow((state) => ({
      playerStats: state.playerStats,
      gameTime: state.gameTime,
      weather: state.weather,
      location: state.location,
    })),
  );

/**
 * Select dialog visibility states only.
 * Used by: DialogSection, to render which dialogs are open
 */
export const useDialogStateSelector = () =>
  useUIStore(
    useShallow((state) => state.dialogs),
  );

/**
 * Select ephemeral UI state only.
 * Used by: InstallPopup, ActionMenu, PickupDialog
 */
export const useEphemeralUISelector = () =>
  useUIStore(
    useShallow((state) => state.ephemeral),
  );

/**
 * Select single dialog open state.
 * Used by: Individual dialog components that only care about their visibility
 *
 * @param dialogName - Name of dialog to check
 * @returns Boolean indicating if dialog is open
 */
export const useDialogOpenSelector = (dialogName: keyof DialogState) =>
  useUIStore((state) => state.dialogs[dialogName]);

/**
 * Combined UI state selector.
 * Used by: DialogSection (when it needs all dialog states at once)
 *
 * @remarks
 * Returns all UI state. Equivalent to:
 * { dialogs, selectedItemId, showNarrativePanel, ...ephemeral }
 */
export const useUIStateSelector = () =>
  useUIStore(
    useShallow((state) => ({
      dialogs: state.dialogs,
      selectedItemId: state.selectedItemId,
      showNarrativePanel: state.showNarrativePanel,
      ephemeral: state.ephemeral,
    })),
  );

/**
 * Select minimap grid data only.
 * Used by: MinimapGrid, to render grid tiles
 */
export const useMinimapGridSelector = () =>
  useMinimapStore(
    useShallow((state) => state.gridData),
  );

/**
 * Select minimap animation state only.
 * Used by: MinimapAnimation, for smooth transitions during move
 */
export const useMinimapAnimationSelector = () =>
  useMinimapStore(
    useShallow((state) => state.animationState),
  );

/**
 * Select minimap viewport size only.
 * Used by: MinimapSettings, to adjust grid size
 */
export const useMinimapViewportSelector = () =>
  useMinimapStore((state) => state.viewportSize);

/**
 * Combined minimap selector.
 * Used by: MiniMapSection (when it needs all minimap data at once)
 *
 * @remarks
 * Returns minimap state. Equivalent to:
 * { gridData, animationState, viewportSize }
 */
export const useMinimapDataSelector = () =>
  useMinimapStore(
    useShallow((state) => ({
      gridData: state.gridData,
      animationState: state.animationState,
      viewportSize: state.viewportSize,
    })),
  );

/**
 * Select control state only.
 * Used by: ControlSection, ControlHints
 */
export const useControlStateSelector = () =>
  useControlsStore(
    useShallow((state) => ({
      selectedActionId: state.selectedActionId,
      showJoystick: state.showJoystick,
      inputMode: state.inputMode,
    })),
  );

/**
 * Composite selector: Is game currently animating?
 * Used by: Input handlers, to prevent input during animation
 *
 * @remarks
 * Combines isMoving from minimap animation + combat animation state.
 * Used to disable input handling during active animations.
 */
export const useIsGameAnimatingSelector = () =>
  useMinimapStore(
    useShallow((state) => ({
      isMoving: state.animationState.isAnimatingMove,
    })),
  );

/**
 * Master selector: All GameLayout data.
 * Used by: Full GameLayout component (if needed for top-level coordination)
 *
 * @remarks
 * This is a "wide" selector combining HUD, UI, minimap, and controls.
 * Usually NOT needed. Prefer granular selectors at section level.
 * If GameLayout uses this, every section will re-render when ANY data changes.
 *
 * **Only use if:**
 * - GameLayout needs to coordinate state across sections
 * - Performance profiling shows re-renders are not the bottleneck
 *
 * **Prefer instead:**
 * - useHudDataSelector() in HudSection
 * - useUIStateSelector() in DialogSection
 * - useMinimapDataSelector() in MiniMapSection
 * - useControlStateSelector() in ControlsSection
 */
export const useGameLayoutGlobalSelector = () => {
  const hudData = useHudDataSelector();
  const uiState = useUIStateSelector();
  const minimapData = useMinimapDataSelector();
  const controlState = useControlStateSelector();

  return {
    hudData,
    uiState,
    minimapData,
    controlState,
  };
};

/**
 * Re-export store actions for convenience.
 * Used by: Components that need to dispatch state changes.
 *
 * @remarks
 * While selectors are read-only, components still need to dispatch actions.
 * Use these to update state from components:
 *
 * ```typescript
 * import { openDialog } from '@store/useGameLayoutSelectors'
 *
 * function InventoryButton() {
 *   return <button onClick={() => openDialog('inventoryOpen')}>...</button>
 * }
 * ```
 */
export const openDialog = (dialogName: keyof DialogState) => {
  useUIStore.getState().openDialog(dialogName);
};

export const closeDialog = (dialogName: keyof DialogState) => {
  useUIStore.getState().closeDialog(dialogName);
};

export const toggleDialog = (dialogName: keyof DialogState) => {
  useUIStore.getState().toggleDialog(dialogName);
};

export const setPlayerStats = (stats: Partial<PlayerStats>) => {
  useHudStore.getState().setPlayerStats(stats);
};

export const setGameTime = (time: Partial<GameTimeState>) => {
  useHudStore.getState().setGameTime(time);
};

export const setWeather = (weather: Partial<WeatherState>) => {
  useHudStore.getState().setWeather(weather);
};

export const setLocation = (location: Partial<LocationState>) => {
  useHudStore.getState().setLocation(location);
};

export const setMinimapGridData = (gridData: MinimapGridData) => {
  useMinimapStore.getState().setGridData(gridData);
};

export const setMinimapAnimationState = (state: Partial<MinimapAnimationState>) => {
  useMinimapStore.getState().setAnimationState(state);
};
