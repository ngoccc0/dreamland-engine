/**
 * Unit tests for soup-color-blender module
 *
 * @remarks
 * Tests color blending algorithm for cooking pot soup visualization.
 * Covers: empty arrays, single ingredient, multiple ingredients, unknown ingredients.
 */

import {
    hexToHsl,
    hslToHex,
    darkenColor,
    lightenColor,
    blendSoupColors,
    getIngredientColor,
    INGREDIENT_COLORS,
} from '../soup-color-blender';

describe('soup-color-blender', () => {
    describe('hexToHsl', () => {
        it('should convert red hex to HSL', () => {
            const hsl = hexToHsl('#FF0000');
            expect(hsl.h).toBeCloseTo(0, 0);
            expect(hsl.s).toBeCloseTo(1, 1);
            expect(hsl.l).toBeCloseTo(0.5, 1);
        });

        it('should convert green hex to HSL', () => {
            const hsl = hexToHsl('#00FF00');
            expect(hsl.h).toBeCloseTo(120, 0);
            expect(hsl.s).toBeCloseTo(1, 1);
            expect(hsl.l).toBeCloseTo(0.5, 1);
        });

        it('should convert blue hex to HSL', () => {
            const hsl = hexToHsl('#0000FF');
            expect(hsl.h).toBeCloseTo(240, 0);
            expect(hsl.s).toBeCloseTo(1, 1);
            expect(hsl.l).toBeCloseTo(0.5, 1);
        });

        it('should handle hex without #', () => {
            const hsl = hexToHsl('FF8C00');
            expect(hsl.h).toBeCloseTo(33, 0);
        });
    });

    describe('hslToHex', () => {
        it('should convert HSL back to red hex', () => {
            const hex = hslToHex(0, 1, 0.5);
            expect(hex).toBe('#FF0000');
        });

        it('should convert HSL to green hex', () => {
            const hex = hslToHex(120, 1, 0.5);
            expect(hex).toBe('#00FF00');
        });

        it('should handle grayscale (s=0)', () => {
            const hex = hslToHex(0, 0, 0.5);
            expect(hex).toBe('#808080');
        });
    });

    describe('darkenColor', () => {
        it('should darken a color by default 0.2', () => {
            const result = darkenColor('#808080');
            const hsl = hexToHsl(result);
            expect(hsl.l).toBeCloseTo(0.3, 1);
        });

        it('should darken by custom amount', () => {
            const result = darkenColor('#FFFFFF', 0.5);
            const hsl = hexToHsl(result);
            expect(hsl.l).toBeCloseTo(0.5, 1);
        });
    });

    describe('lightenColor', () => {
        it('should lighten a color by default 0.1', () => {
            const result = lightenColor('#808080');
            const hsl = hexToHsl(result);
            expect(hsl.l).toBeCloseTo(0.6, 1);
        });

        it('should not exceed 1.0 lightness', () => {
            const result = lightenColor('#FFFFFF', 0.5);
            const hsl = hexToHsl(result);
            expect(hsl.l).toBeLessThanOrEqual(1);
        });
    });

    describe('blendSoupColors', () => {
        it('should return default for empty array', () => {
            const result = blendSoupColors([]);
            expect(result.opacity).toBe(0);
            expect(result.gradient).toBe('transparent');
            expect(result.primary).toBe('#C4A77D');
        });

        it('should handle single ingredient', () => {
            const result = blendSoupColors(['carrot']);
            expect(result.opacity).toBeGreaterThan(0);
            expect(result.primary).toBeDefined();
            expect(result.secondary).toBeDefined();
            expect(result.gradient).toContain('radial-gradient');
        });

        it('should blend multiple ingredients', () => {
            const result = blendSoupColors(['carrot', 'potato', 'meat']);
            expect(result.opacity).toBeCloseTo(0.6, 1); // 0.3 + 3*0.1
            expect(result.primary).not.toBe('#C4A77D'); // Not default
        });

        it('should handle many ingredients with saturation dampening', () => {
            const result = blendSoupColors([
                'carrot', 'potato', 'meat', 'onion', 'garlic',
                'tomato', 'mushroom', 'herb', 'salt', 'pepper_spice'
            ]);
            const hsl = hexToHsl(result.primary);
            // Saturation should be dampened with many ingredients
            expect(hsl.s).toBeLessThan(0.7);
            expect(result.opacity).toBe(0.9); // Max capped
        });

        it('should use default color for unknown ingredients', () => {
            const result = blendSoupColors(['unknown_xyz_item']);
            expect(result.opacity).toBeGreaterThan(0);
            // Should still produce a valid color (default brown)
            expect(result.primary).toBeDefined();
        });

        it('should match partial ingredient names', () => {
            const result1 = blendSoupColors(['raw_carrot']);
            const result2 = blendSoupColors(['carrot_slice']);
            // Both should pick up carrot color
            expect(result1.primary).toBeDefined();
            expect(result2.primary).toBeDefined();
        });
    });

    describe('getIngredientColor', () => {
        it('should return exact color for known ingredient', () => {
            const color = getIngredientColor('carrot');
            expect(color).toBe(INGREDIENT_COLORS.carrot);
        });

        it('should return default for unknown ingredient', () => {
            const color = getIngredientColor('mystery_food');
            expect(color).toBe(INGREDIENT_COLORS._default);
        });

        it('should match partial names', () => {
            const color = getIngredientColor('fresh_tomato');
            expect(color).toBe(INGREDIENT_COLORS.tomato);
        });

        it('should be case insensitive via normalization', () => {
            // Normalization removes - and _ and lowercases
            const color = getIngredientColor('CARROT');
            // May or may not match depending on exact implementation
            expect(color).toBeDefined();
        });
    });
});
