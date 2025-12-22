'use client';

/**
 * DialogSection Documentation
 *
 * @remarks
 * **Purpose:**
 * Logical grouping of dialog-related props from GameLayout.
 * In future refactors, this could become a Smart Container
 * that subscribes to useUIStore directly.
 *
 * **Dialog Types Managed:**
 * - Status (character info)
 * - Inventory (items & equipment)
 * - Crafting (recipes)
 * - Building (structures)
 * - Fusion (item combining)
 * - Map (full world map)
 * - Tutorial (skills & help)
 * - Settings (user preferences)
 * - Custom (dynamic dialogs)
 * - Pickup (item collection)
 * - Cooking (food preparation)
 * - Install (PWA prompt)
 * - Available Actions (context menu)
 *
 * **Current Flow:**
 * GameLayout.tsx -> GameLayoutContent -> GameLayoutDialogs
 *
 * **Future Optimization:**
 * Smart DialogSection subscribed to useUIStore + useGameEngine
 * would eliminate need to pass ~13 dialog state props through intermediate components.
 */


