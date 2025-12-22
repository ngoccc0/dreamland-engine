'use client';

/**
 * ControlsSection Documentation
 *
 * @remarks
 * **Purpose:**
 * Logical grouping of action controls-related props from GameLayout.
 * In future refactors, this could become a Smart Container.
 *
 * **Responsibilities:**
 * - Manage context-sensitive actions (attack, pickup, rest, interact)
 * - Display available actions based on current chunk
 * - Handle action bar UI with keyboard hotkey support
 * - Render pickup dialog for multi-select item pickup
 *
 * **Current Flow:**
 * GameLayout.tsx -> GameLayoutContent -> GameLayoutControls
 *
 * **Future Optimization:**
 * ControlsSection Smart Container subscribed to currentChunk + actions
 * would isolate action updates from other layout changes.
 */


