/**
 * Game Layout Sections - Architectural Organization
 *
 * @remarks
 * This folder documents logical sections of GameLayout.
 *
 * Each file (HudSection, ControlsSection, DialogSection, MiniMapSection)
 * represents a self-contained subsystem that can be extracted into
 * a Smart Container in future refactoring passes.
 *
 * **Current State:** Documentation-only (Props still passed through GameLayout)
 * **Future State:** Each becomes a Smart Container subscribed to Zustand/Context
 *
 * **Benefits of separation:**
 * - Minimap grid calculations isolated (only re-render on position change)
 * - Dialog state independent (opening inventory doesn't re-render HUD)
 * - Controls isolated (action updates don't re-render dialogs)
 * - Each section can be optimized/tested separately
 *
 * **Hook Available:**
 * `useMinimapGridData` - Generates minimap grid with animation smoothing
 * Can be used now to extract minimap logic from GameLayout
 */

export { useMinimapGridData } from './MiniMapSection';
