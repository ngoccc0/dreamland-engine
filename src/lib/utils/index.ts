/**
 * Utility Functions Library
 *
 * @remarks
 * Central export point for all utility functions used throughout the game.
 * Organized by concern: styling, math, translation, items, narrative, and performance.
 *
 * This module replaces the monolithic src/lib/utils.ts and provides better
 * code organization and tree-shaking opportunities.
 */

// Styling utilities
export { cn } from './styling';

// Math utilities
export { clamp } from './math';

// Translation & localization
export { getTranslatedText } from './translation';

// Item management
export { resolveItemId, getEmojiForItem, ensurePlayerItemId, convertItemArrayToRecord } from './item-utils';

// Narrative & text processing
export { SmartJoinSentences } from './narrative';

// Performance utilities
export { createFrameLimiter } from './frame-limiter';

// Dice rolling
export * from './dice';

// Normalization utilities
export * from './normalize';

// Time utilities
export * from './time';
