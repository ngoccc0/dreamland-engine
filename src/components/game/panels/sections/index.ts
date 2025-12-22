/**
 * Game Layout Sections - Smart Containers & Hook Exports
 *
 * @remarks
 * This folder contains Smart Container components that subscribe to Zustand stores
 * for independent rendering, plus hook exports used by various sections.
 *
 * **Smart Containers (State-Subscribed Components):**
 * - `HudSection` - Subscribes to useHudStore, displays player stats/time/weather
 * - `MiniMapSection` - Subscribes to useMinimapStore, displays game grid
 * - `ControlsSection` - Subscribes to useControlsStore, displays action controls
 * - `DialogSection` - Subscribes to useUIStore, renders all dialogs/popups
 *
 * Each Smart Container:
 * - Subscribes to specific store fields via atomic selectors
 * - Re-renders ONLY when subscribed data changes
 * - Wraps actual component (HudSection → GameLayoutHud, etc.)
 * - Prevents prop drilling by reading from store directly
 *
 * **Benefits:**
 * - Minimap grid re-renders only on position/animation changes
 * - Dialogs open/close independently (no HUD re-render)
 * - Controls update only on action/input changes
 * - Performance improvement via granular subscriptions
 *
 * **Hooks Available:**
 * - `useMinimapGridData` - Generates minimap grid with animation smoothing
 *   Located in src/hooks/use-minimap-grid-data.ts
 *   Re-exported here for convenience during GameLayout integration
 */

export { HudSection } from './HudSection';
export { MiniMapSection } from './MiniMapSection';
export { ControlsSection } from './ControlsSection';
export { DialogSection } from './DialogSection';
export { useMinimapGridData } from '@/hooks/use-minimap-grid-data';
