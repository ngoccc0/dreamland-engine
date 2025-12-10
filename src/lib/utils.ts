

/**
 * Backward Compatibility Export (DEPRECATED)
 *
 * @deprecated This file is maintained for backward compatibility only.
 * Please import utilities from '@/lib/utils/' directly:
 *
 * ```typescript
 * // OLD (still works but not recommended):
 * import { clamp, cn, getTranslatedText } from '@/lib/utils';
 *
 * // NEW (preferred):
 * import { clamp, cn, getTranslatedText } from '@/lib/utils/';
 * ```
 *
 * @remarks
 * All utilities have been reorganized into focused modules for better
 * code organization, tree-shaking, and maintainability.
 * See src/lib/utils/ for the new modular structure.
 */

// Re-export everything from the new modular structure
export * from './utils/';