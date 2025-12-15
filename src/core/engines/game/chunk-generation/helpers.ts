/**
 * Chunk Generation Utility Functions
 *
 * @remarks
 * Pure utility functions used throughout the chunk generation pipeline.
 * These include numeric calculations, range clamping, and other helper
 * functions that are independent of game state.
 */

import type { TranslationKey } from "@/lib/core/i18n";
import { translations } from "@/lib/core/i18n";

/**
 * Creates a translation helper function for a specific language.
 *
 * @remarks
 * **Logic:**
 * 1. Look up translation in target language, fallback to English
 * 2. If array of options, pick one randomly
 * 3. Apply string replacements for placeholders like `{count}`
 * 4. Return translated or original key if no translation found
 *
 * @param language - Target language code (en, vi, etc.)
 * @returns Function that translates keys with optional replacements
 *
 * @example
 * ```typescript
 * const t = createTranslationHelper('vi');
 * const msg = t('itemPickedUp', { count: 5 });
 * ```
 */
export function createTranslationHelper(language: string) {
    return (key: TranslationKey, replacements?: { [key: string]: string | number }): string => {
        let textPool = (translations[language as 'en' | 'vi'] as any)[key] || (translations.en as any)[key] || key;
        let text = Array.isArray(textPool) ? textPool[Math.floor(Math.random() * textPool.length)] : textPool;
        if (replacements && typeof text === 'string') {
            for (const [replaceKey, value] of Object.entries(replacements)) {
                text = text.replace(`{${replaceKey}}`, String(value));
            }
        }
        return text;
    };
}

/**
 * Applies a softcap to a multiplier value.
 *
 * @remarks
 * **Purpose**: Prevents multipliers from scaling linearly indefinitely.
 * Introduces diminishing returns as multiplier increases, maintaining game balance.
 *
 * **Formula**: `m / (1 + (m - 1) * k)` for m > 1
 *
 * **Examples**:
 * - softcap(1.0) → 1.0 (no effect)
 * - softcap(2.0) → 1.43 (50% reduction)
 * - softcap(3.0) → 1.71 (43% reduction)
 * - softcap(4.0) → 1.92 (38% reduction)
 *
 * @param m - Raw multiplier value
 * @param k - Softcap curve constant (higher = stronger cap). Default: 0.4
 * @returns Softcapped multiplier value
 */
export function softcap(m: number, k = 0.4): number {
    if (m <= 1) return m;
    return m / (1 + (m - 1) * k);
}

/**
 * Clamps a value to 0-1 range, normalizing 0-100 input to 0-1.
 *
 * @remarks
 * **Purpose**: Convert percentage values (0-100) to normalized probabilities (0-1).
 *
 * **Logic**:
 * 1. Divide input by 100 to normalize
 * 2. Clamp result to [0, 1] range
 * 3. Returns safe probability value for chance calculations
 *
 * @param v - Value to clamp (0-100 scale)
 * @returns Clamped value (0-1 scale)
 *
 * @example
 * ```typescript
 * clamp01(50) → 0.5
 * clamp01(150) → 1.0 (clamped)
 * clamp01(-10) → 0 (clamped)
 * ```
 */
export function clamp01(v: number): number {
    return Math.max(0, Math.min(1, v / 100));
}

/**
 * Clamps a numeric value to a specified range.
 *
 * @remarks
 * Standard mathematical clamp operation: ensures value stays within [min, max].
 *
 * @param value - Value to clamp
 * @param min - Minimum bound (inclusive)
 * @param max - Maximum bound (inclusive)
 * @returns Clamped value
 *
 * @example
 * ```typescript
 * clamp(5, 0, 10) → 5
 * clamp(15, 0, 10) → 10
 * clamp(-5, 0, 10) → 0
 * ```
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Calculates a resource capacity score based on chunk environmental properties.
 *
 * @remarks
 * **Algorithm**:
 * 1. Normalize each property to 0-1 range (divide by 100)
 * 2. Invert danger and predator presence (lower is better)
 * 3. Average all factors to get 0-1 resource score
 * 4. Apply world multiplier to scale final score
 *
 * **Formula**:
 * ```
 * score = (veg/100 + moist/100 + (1-human/100) + (1-danger/100) + (1-pred/100)) / 5
 * adjusted = 0.5 + (score * 1.0 * resourceDensity)
 * ```
 *
 * @param vegetationDensity - Vegetation density (0-100)
 * @param moisture - Moisture level (0-100)
 * @param humanPresence - Human presence (0-100)
 * @param dangerLevel - Danger level (0-100)
 * @param predatorPresence - Predator presence (0-100)
 * @param resourceDensity - World resource multiplier (typically 0.5-1.5)
 * @returns Resource capacity multiplier (0.5-1.5 range)
 *
 * @example
 * ```typescript
 * const multiplier = calculateResourceCapacity(70, 60, 10, 30, 40, 1.0);
 * // High vegetation & moisture, low danger = high multiplier
 * ```
 */
export function calculateResourceCapacity(
    vegetationDensity: number,
    moisture: number,
    humanPresence: number,
    dangerLevel: number,
    predatorPresence: number,
    resourceDensity: number
): number {
    const chunkResourceScore = (
        (vegetationDensity / 100 +
            moisture / 100 +
            (1 - humanPresence / 100) +
            (1 - dangerLevel / 100) +
            (1 - predatorPresence / 100)) / 5
    );
    return 0.5 + (chunkResourceScore * 1.0 * resourceDensity);
}
