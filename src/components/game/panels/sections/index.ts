/**
 * Game Layout Sections - Architectural Organization & Hook Exports
 *
 * @remarks
 * This folder documents logical sections of GameLayout and exports hooks they use.
 *
 * Each file (HudSection, ControlsSection, DialogSection, MiniMapSection)
 * represents a self-contained subsystem that could be extracted into
 * a Smart Container in future refactoring passes.
 *
 * **Current State:** Documentation + hooks reexported for convenience
 * **Future State:** Each could become a Smart Container subscribed to Zustand/Context
 *
 * **Benefits of separation:**
 * - Minimap grid calculations isolated (only re-render on position/animation change)
 * - Dialog state independent (opening inventory doesn't re-render HUD)
 * - Controls isolated (action updates don't re-render dialogs)
 * - Each section can be optimized/tested separately
 *
 * **Hooks Available:**
 * - `useMinimapGridData` - Generates minimap grid with animation smoothing
 *   Located in src/hooks/use-minimap-grid-data.ts (proper .ts file for hooks)
 *   Re-exported here for convenience during GameLayout integration
 */

export { useMinimapGridData } from '@/hooks/use-minimap-grid-data';

