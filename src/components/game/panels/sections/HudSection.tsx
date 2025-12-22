'use client';

/**
 * HudSection Documentation
 *
 * @remarks
 * **Purpose:**
 * Logical grouping of HUD-related props from GameLayout.
 * In future refactors, this could become a Smart Container.
 *
 * **Responsibilities:**
 * - Display player stats (health, hunger, energy)
 * - Show game time and weather
 * - Render minimap with grid generation
 * - Provide UI for map viewport size adjustment
 *
 * **Current Flow:**
 * GameLayout.tsx -> GameLayoutContent -> GameLayoutHud
 *
 * **Future Optimization:**
 * HudSection Smart Container could isolate minimap grid calculations
 * so HUD only re-renders when its specific data changes (not on every game state update).
 */


