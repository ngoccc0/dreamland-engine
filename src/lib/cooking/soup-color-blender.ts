/**
 * Soup Color Blender Module
 *
 * @remarks
 * Provides color blending algorithms for cooking pot soup visualization.
 * Uses HSL color space for harmonious blending that produces natural-looking
 * soup colors even with many different ingredients.
 *
 * **Algorithm:**
 * 1. Map each ingredient to a base color (from INGREDIENT_COLORS)
 * 2. Convert to HSL for perceptually uniform blending
 * 3. Weighted average based on ingredient order (later = more influence)
 * 4. Apply saturation dampening to prevent oversaturated results
 * 5. Generate primary + secondary colors for gradient
 *
 * @example
 * ```typescript
 * const colors = blendSoupColors(['carrot', 'potato', 'meat']);
 * // Returns { primary: '#B87333', secondary: '#D4A574', opacity: 0.7 }
 * ```
 */

'use strict';

// ============================================================================
// INGREDIENT COLOR MAP
// ============================================================================

/**
 * Base colors for common cooking ingredients.
 * Colors chosen to produce appetizing soup when blended.
 *
 * @remarks
 * Colors are intentionally warm/earthy to ensure blends look like food.
 * Unknown ingredients default to neutral brown.
 */
export const INGREDIENT_COLORS: Record<string, string> = {
    // Vegetables
    carrot: '#FF8C00',       // Dark orange
    tomato: '#FF6347',       // Tomato red
    potato: '#F5DEB3',       // Wheat/cream
    onion: '#FAEBD7',        // Antique white
    garlic: '#FFFAF0',       // Floral white
    cabbage: '#90EE90',      // Light green
    mushroom: '#D2B48C',     // Tan
    pumpkin: '#FF7518',      // Pumpkin orange
    corn: '#FFD700',         // Gold
    pepper: '#FF4500',       // Red-orange
    eggplant: '#9932CC',     // Dark orchid
    spinach: '#228B22',      // Forest green
    celery: '#7CFC00',       // Lawn green
    bean: '#8B4513',         // Saddle brown
    pea: '#32CD32',          // Lime green

    // Proteins
    meat: '#8B4513',         // Saddle brown
    beef: '#800000',         // Maroon
    pork: '#FFB6C1',         // Light pink
    chicken: '#FFDAB9',      // Peach puff
    fish: '#87CEEB',         // Sky blue (light)
    shrimp: '#FFA07A',       // Light salmon
    egg: '#FFFACD',          // Lemon chiffon
    tofu: '#FFFAF0',         // Floral white

    // Herbs & Spices
    herb: '#228B22',         // Forest green
    basil: '#3CB371',        // Medium sea green
    parsley: '#2E8B57',      // Sea green
    thyme: '#6B8E23',        // Olive drab
    salt: '#FFFFFF',         // White (minimal effect)
    pepper_spice: '#2F4F4F', // Dark slate gray
    chili: '#DC143C',        // Crimson

    // Liquids & Others
    water: '#E0FFFF',        // Light cyan (very light)
    milk: '#FFFAFA',         // Snow
    cream: '#FFFDD0',        // Cream
    broth: '#DAA520',        // Goldenrod
    oil: '#FFD700',          // Gold
    wine: '#722F37',         // Wine red
    soy_sauce: '#3D2B1F',    // Dark brown

    // Grains
    rice: '#FFFAF0',         // Floral white
    noodle: '#F5DEB3',       // Wheat
    bread: '#DEB887',        // Burlywood

    // Default for unknown ingredients
    _default: '#C4A77D',     // Warm neutral brown
};

// ============================================================================
// COLOR UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert hex color to HSL components
 *
 * @param hex - Hex color string (e.g., '#FF8C00')
 * @returns HSL object with h (0-360), s (0-1), l (0-1)
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
    // Remove # if present
    const cleanHex = hex.replace('#', '');

    // Parse RGB components
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    let h = 0;
    let s = 0;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                h = ((b - r) / d + 2) / 6;
                break;
            case b:
                h = ((r - g) / d + 4) / 6;
                break;
        }
    }

    return { h: h * 360, s, l };
}

/**
 * Convert HSL components to hex color
 *
 * @param h - Hue (0-360)
 * @param s - Saturation (0-1)
 * @param l - Lightness (0-1)
 * @returns Hex color string
 */
export function hslToHex(h: number, s: number, l: number): string {
    const hNorm = h / 360;

    const hue2rgb = (p: number, q: number, t: number): number => {
        let tNorm = t;
        if (tNorm < 0) tNorm += 1;
        if (tNorm > 1) tNorm -= 1;
        if (tNorm < 1 / 6) return p + (q - p) * 6 * tNorm;
        if (tNorm < 1 / 2) return q;
        if (tNorm < 2 / 3) return p + (q - p) * (2 / 3 - tNorm) * 6;
        return p;
    };

    let r: number, g: number, b: number;

    if (s === 0) {
        r = g = b = l;
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, hNorm + 1 / 3);
        g = hue2rgb(p, q, hNorm);
        b = hue2rgb(p, q, hNorm - 1 / 3);
    }

    const toHex = (x: number): string => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Darken a hex color by a percentage
 *
 * @param hex - Hex color string
 * @param amount - Amount to darken (0-1, default 0.2)
 * @returns Darkened hex color
 */
export function darkenColor(hex: string, amount: number = 0.2): string {
    const hsl = hexToHsl(hex);
    const newL = Math.max(0, hsl.l - amount);
    return hslToHex(hsl.h, hsl.s, newL);
}

/**
 * Lighten a hex color by a percentage
 *
 * @param hex - Hex color string
 * @param amount - Amount to lighten (0-1, default 0.1)
 * @returns Lightened hex color
 */
export function lightenColor(hex: string, amount: number = 0.1): string {
    const hsl = hexToHsl(hex);
    const newL = Math.min(1, hsl.l + amount);
    return hslToHex(hsl.h, hsl.s, newL);
}

// ============================================================================
// SOUP COLOR BLENDING
// ============================================================================

/**
 * Result of soup color blending
 */
export interface SoupColorResult {
    /** Main soup color (for center of gradient) */
    primary: string;
    /** Highlight color (for edges of gradient) */
    secondary: string;
    /** Soup opacity based on ingredient count (0-1) */
    opacity: number;
    /** Suggested gradient CSS string */
    gradient: string;
}

/**
 * Blend ingredient colors into harmonious soup colors
 *
 * @remarks
 * Uses weighted HSL blending with saturation dampening to ensure
 * the resulting color looks like appetizing soup regardless of
 * how many or which ingredients are combined.
 *
 * **Weight Strategy:**
 * - Later ingredients have more influence (weighted average)
 * - This creates visual feedback as user adds ingredients
 *
 * **Saturation Dampening:**
 * - As more ingredients are added, saturation is reduced
 * - Prevents oversaturated neon colors
 * - Produces natural, cooked-food appearance
 *
 * @param ingredientIds - Array of ingredient item IDs
 * @returns SoupColorResult with primary, secondary, opacity, gradient
 */
export function blendSoupColors(ingredientIds: string[]): SoupColorResult {
    // Default for empty pot
    if (ingredientIds.length === 0) {
        return {
            primary: '#C4A77D',
            secondary: '#E8D5B5',
            opacity: 0,
            gradient: 'transparent',
        };
    }

    // Get colors for each ingredient
    const colors = ingredientIds.map((id) => {
        // Normalize ingredient ID (remove prefixes, lowercase)
        const normalizedId = id.toLowerCase().replace(/[-_]/g, '');

        // Try exact match first
        if (INGREDIENT_COLORS[id]) return INGREDIENT_COLORS[id];

        // Try partial match
        for (const key of Object.keys(INGREDIENT_COLORS)) {
            if (normalizedId.includes(key) || key.includes(normalizedId)) {
                return INGREDIENT_COLORS[key];
            }
        }

        // Default fallback
        return INGREDIENT_COLORS._default;
    });

    // Convert to HSL
    const hslColors = colors.map(hexToHsl);

    // Weighted average (later ingredients have more weight)
    let totalWeight = 0;
    let hSum = 0;
    let sSum = 0;
    let lSum = 0;

    hslColors.forEach((hsl, index) => {
        const weight = 1 + index * 0.3; // Increasing weight
        totalWeight += weight;

        // Handle hue wrapping (circular average)
        // Convert to x,y coordinates on unit circle for proper averaging
        const hRad = (hsl.h * Math.PI) / 180;
        hSum += Math.cos(hRad) * weight;
        const hSin = Math.sin(hRad) * weight;

        sSum += hsl.s * weight;
        lSum += hsl.l * weight;

        // Add sin component
        hSum += hSin * 0; // Placeholder for proper circular average
    });

    // Calculate circular average for hue
    let avgHue = 0;
    {
        let sinSum = 0;
        let cosSum = 0;
        hslColors.forEach((hsl, index) => {
            const weight = 1 + index * 0.3;
            const hRad = (hsl.h * Math.PI) / 180;
            sinSum += Math.sin(hRad) * weight;
            cosSum += Math.cos(hRad) * weight;
        });
        avgHue = (Math.atan2(sinSum, cosSum) * 180) / Math.PI;
        if (avgHue < 0) avgHue += 360;
    }

    let avgSat = sSum / totalWeight;
    let avgLit = lSum / totalWeight;

    // Saturation dampening (more ingredients = more muted)
    const satDampening = Math.max(0.3, 1 - ingredientIds.length * 0.08);
    avgSat = avgSat * satDampening;

    // Clamp values
    avgSat = Math.max(0.15, Math.min(0.7, avgSat));
    avgLit = Math.max(0.35, Math.min(0.65, avgLit));

    // Generate primary and secondary colors
    const primary = hslToHex(avgHue, avgSat, avgLit);
    const secondary = lightenColor(primary, 0.15);
    const dark = darkenColor(primary, 0.2);

    // Opacity based on ingredient count
    const opacity = Math.min(0.9, 0.3 + ingredientIds.length * 0.1);

    // Generate gradient CSS
    const gradient = `radial-gradient(ellipse 50% 40% at center 35%, ${secondary} 0%, ${primary} 50%, ${dark} 100%)`;

    return {
        primary,
        secondary,
        opacity,
        gradient,
    };
}

/**
 * Get color for a single ingredient (for display purposes)
 *
 * @param ingredientId - Ingredient item ID
 * @returns Hex color for the ingredient
 */
export function getIngredientColor(ingredientId: string): string {
    const normalizedId = ingredientId.toLowerCase().replace(/[-_]/g, '');

    if (INGREDIENT_COLORS[ingredientId]) {
        return INGREDIENT_COLORS[ingredientId];
    }

    for (const key of Object.keys(INGREDIENT_COLORS)) {
        if (normalizedId.includes(key) || key.includes(normalizedId)) {
            return INGREDIENT_COLORS[key];
        }
    }

    return INGREDIENT_COLORS._default;
}
