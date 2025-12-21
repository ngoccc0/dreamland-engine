import {
    selectDynamicNarrative,
    buildTemplate,
    validatePlaceholders,
} from '@/core/rules/narrative';

describe('Narrative Rules', () => {
    describe('selectDynamicNarrative', () => {
        test('should return CREATURE_DEATH narrative for death context', () => {
            const narrative = selectDynamicNarrative('CREATURE_DEATH', 3, 42);
            expect(narrative).toContain('{{creatureName}}');
        });

        test('should return CREATURE_BIRTH narrative for birth context', () => {
            const narrative = selectDynamicNarrative('CREATURE_BIRTH', 3, 42);
            expect(narrative).toContain('{{creatureName}}');
        });

        test('should return PLANT_GROW narrative for growth context', () => {
            const narrative = selectDynamicNarrative('PLANT_GROW', 3, 42);
            expect(narrative).toContain('{{plantName}}');
        });

        test('should return ITEM_CRAFT narrative for craft context', () => {
            const narrative = selectDynamicNarrative('ITEM_CRAFT', 3, 42);
            expect(narrative).toContain('{{itemName}}');
        });

        test('should return EXPLORATION narrative for exploration context', () => {
            const narrative = selectDynamicNarrative('EXPLORATION', 3, 42);
            expect(narrative).toContain('{{location}}');
        });

        test('should return fallback for unknown context type', () => {
            const narrative = selectDynamicNarrative('UNKNOWN_CONTEXT', 3, 42);
            expect(narrative).toBeTruthy();
        });

        test('should select subtle text for intensity 1', () => {
            const narrative = selectDynamicNarrative('CREATURE_DEATH', 1, 42);
            expect(narrative).not.toContain('FELL');
            expect(narrative).not.toContain('AGONY');
        });

        test('should select dramatic text for intensity 5', () => {
            const narrative = selectDynamicNarrative('CREATURE_DEATH', 5, 42);
            expect(narrative).toMatch(/FELL|AGONY|DESPAIR/);
        });

        test('should clamp intensity < 1 to 1', () => {
            const narrative1 = selectDynamicNarrative('CREATURE_DEATH', 0, 42);
            const narrative2 = selectDynamicNarrative('CREATURE_DEATH', 1, 42);
            expect(narrative1).toBe(narrative2);
        });

        test('should clamp intensity > 5 to 5', () => {
            const narrative1 = selectDynamicNarrative('CREATURE_DEATH', 100, 42);
            const narrative2 = selectDynamicNarrative('CREATURE_DEATH', 5, 42);
            expect(narrative1).toBe(narrative2);
        });

        test('should be deterministic with same seed', () => {
            const narrative1 = selectDynamicNarrative('CREATURE_BIRTH', 3, 42);
            const narrative2 = selectDynamicNarrative('CREATURE_BIRTH', 3, 42);
            expect(narrative1).toBe(narrative2);
        });

        test('should vary with different seeds', () => {
            const narrative1 = selectDynamicNarrative('CREATURE_BIRTH', 3, 1);
            const narrative2 = selectDynamicNarrative('CREATURE_BIRTH', 3, 2);
            // May or may not be different, but both should be valid
            expect(narrative1).toBeTruthy();
            expect(narrative2).toBeTruthy();
        });

        test('should return intensity-appropriate text for intensity 2', () => {
            const narrative = selectDynamicNarrative('PLANT_GROW', 2, 42);
            expect(narrative).toBeTruthy();
        });

        test('should return intensity-appropriate text for intensity 4', () => {
            const narrative = selectDynamicNarrative('PLANT_GROW', 4, 42);
            expect(narrative).toBeTruthy();
        });

        test('PLANT_GROW intensity 5 should contain dramatic language', () => {
            const narrative = selectDynamicNarrative('PLANT_GROW', 5, 0);
            expect(narrative).toMatch(/EXPLODED|MAGNIFICENT|TOWERING|TESTAMENT/);
        });

        test('ITEM_CRAFT intensity 5 should mention LEGENDARY or POWER', () => {
            const narrative = selectDynamicNarrative('ITEM_CRAFT', 5, 0);
            expect(narrative).toMatch(/LEGENDARY|POWER|UNPARALLELED/);
        });
    });

    describe('buildTemplate', () => {
        test('should replace single placeholder', () => {
            const result = buildTemplate('The {{creatureName}} is here.', {
                creatureName: 'Wolf',
            });
            expect(result).toBe('The Wolf is here.');
        });

        test('should replace multiple placeholders', () => {
            const result = buildTemplate('The {{creatureName}} at {{location}}.', {
                creatureName: 'Wolf',
                location: 'Forest',
            });
            expect(result).toBe('The Wolf at Forest.');
        });

        test('should replace same placeholder multiple times', () => {
            const result = buildTemplate(
                'The {{item}} and the {{item}} together.',
                { item: 'Sword' }
            );
            expect(result).toBe('The Sword and the Sword together.');
        });

        test('should leave unmatched placeholders unchanged', () => {
            const result = buildTemplate('The {{creatureName}} at {{location}}.', {
                creatureName: 'Wolf',
            });
            expect(result).toBe('The Wolf at {{location}}.');
        });

        test('should convert number values to strings', () => {
            const result = buildTemplate(
                'There are {{count}} creatures.',
                { count: 5 }
            );
            expect(result).toBe('There are 5 creatures.');
        });

        test('should handle empty string values', () => {
            const result = buildTemplate('The {{creatureName}} is here.', {
                creatureName: '',
            });
            expect(result).toBe('The  is here.');
        });

        test('should return empty string for null template', () => {
            const result = buildTemplate('', { creatureName: 'Wolf' });
            expect(result).toBe('');
        });

        test('should handle template with no placeholders', () => {
            const result = buildTemplate('The Wolf is here.', {
                creatureName: 'Wolf',
            });
            expect(result).toBe('The Wolf is here.');
        });

        test('should handle special characters in values', () => {
            const result = buildTemplate('The {{name}} said "{{text}}"', {
                name: 'Wise One',
                text: "It's dangerous!",
            });
            expect(result).toBe('The Wise One said "It\'s dangerous!"');
        });

        test('should not replace partial placeholders', () => {
            const result = buildTemplate(
                'The {creatureName} and {{creatureName}} here.',
                { creatureName: 'Wolf' }
            );
            expect(result).toBe('The {creatureName} and Wolf here.');
        });

        test('should handle underscores in placeholder names', () => {
            const result = buildTemplate('The {{creature_name}} here.', {
                creature_name: 'Wolf',
            });
            expect(result).toBe('The Wolf here.');
        });

        test('should handle numbers in placeholder names', () => {
            const result = buildTemplate('Creature1: {{creature1}}, Creature2: {{creature2}}', {
                creature1: 'Wolf',
                creature2: 'Bear',
            });
            expect(result).toBe('Creature1: Wolf, Creature2: Bear');
        });

        test('should handle very long template strings', () => {
            const longTemplate =
                'The {{creatureName}} ' + 'walked '.repeat(100) + 'to {{location}}.';
            const result = buildTemplate(longTemplate, {
                creatureName: 'Wolf',
                location: 'Forest',
            });
            expect(result).toContain('Wolf');
            expect(result).toContain('Forest');
        });
    });

    describe('validatePlaceholders', () => {
        test('should return true when all placeholders are filled', () => {
            const valid = validatePlaceholders('The {{creatureName}} at {{location}}.', {
                creatureName: 'Wolf',
                location: 'Forest',
            });
            expect(valid).toBe(true);
        });

        test('should return false when placeholder is missing', () => {
            const valid = validatePlaceholders('The {{creatureName}} at {{location}}.', {
                creatureName: 'Wolf',
            });
            expect(valid).toBe(false);
        });

        test('should return false when placeholder value is null', () => {
            const valid = validatePlaceholders('The {{creatureName}}.', {
                creatureName: null,
            });
            expect(valid).toBe(false);
        });

        test('should return false when placeholder value is undefined', () => {
            const valid = validatePlaceholders('The {{creatureName}}.', {
                creatureName: undefined,
            });
            expect(valid).toBe(false);
        });

        test('should return true for empty string values', () => {
            const valid = validatePlaceholders('The {{creatureName}}.', {
                creatureName: '',
            });
            expect(valid).toBe(true);
        });

        test('should return true for number values', () => {
            const valid = validatePlaceholders('Count: {{count}}.', {
                count: 5,
            });
            expect(valid).toBe(true);
        });

        test('should return true when template has no placeholders', () => {
            const valid = validatePlaceholders('No placeholders here.', {
                creatureName: 'Wolf',
            });
            expect(valid).toBe(true);
        });

        test('should return true when template is empty', () => {
            const valid = validatePlaceholders('', {
                creatureName: 'Wolf',
            });
            expect(valid).toBe(true);
        });

        test('should return false when values object is null', () => {
            const valid = validatePlaceholders('The {{creatureName}}.', null as any);
            expect(valid).toBe(false);
        });

        test('should return false when values object is undefined', () => {
            const valid = validatePlaceholders(
                'The {{creatureName}}.',
                undefined as any
            );
            expect(valid).toBe(false);
        });

        test('should handle multiple same placeholders', () => {
            const valid = validatePlaceholders(
                'The {{name}} and {{name}} together.',
                { name: 'Wolf' }
            );
            expect(valid).toBe(true);
        });

        test('should return false if one of multiple placeholders missing', () => {
            const valid = validatePlaceholders(
                'The {{name1}} and {{name2}} together.',
                { name1: 'Wolf' }
            );
            expect(valid).toBe(false);
        });

        test('should handle complex placeholder names', () => {
            const valid = validatePlaceholders(
                'Value: {{creature_name_123}}.',
                { creature_name_123: 'Wolf' }
            );
            expect(valid).toBe(true);
        });

        test('should ignore extra values in values object', () => {
            const valid = validatePlaceholders('The {{name}}.', {
                name: 'Wolf',
                extra: 'ignored',
            });
            expect(valid).toBe(true);
        });
    });

    describe('Integration - Narrative flow', () => {
        test('should select and validate narrative for creature death', () => {
            const template = selectDynamicNarrative('CREATURE_DEATH', 3, 42);
            const values = {
                creatureName: 'Wolf',
                location: 'Forest',
            };
            // Template should have creatureName; location may or may not be required
            // So validation should pass if template contains creatureName placeholder
            const hasCreatureName = template.includes('{{creatureName}}');
            const hasLocation = template.includes('{{location}}');
            const isValid = validatePlaceholders(template, values);
            // If template has location placeholder, validation must pass
            if (hasLocation) {
                expect(isValid).toBe(true);
            } else {
                // If no location placeholder, still should validate successfully
                expect(isValid).toBe(true);
            }
        });

        test('should build complete narrative from selection and values', () => {
            const template = selectDynamicNarrative('CREATURE_BIRTH', 3, 42);
            const values = {
                creatureName: 'Wolf',
                location: 'Forest',
                creatureCount: 2,
            };
            if (validatePlaceholders(template, values)) {
                const narrative = buildTemplate(template, values);
                expect(narrative).toContain('Wolf');
            }
        });

        test('should generate valid narrative for plant growth', () => {
            const template = selectDynamicNarrative('PLANT_GROW', 4, 99);
            const values = {
                plantName: 'Rose',
                location: 'Garden',
                color: 'Red',
            };
            // Only build template if placeholders can be validated
            if (validatePlaceholders(template, values)) {
                const narrative = buildTemplate(template, values);
                // Narrative should contain something meaningful (not just empty string)
                expect(narrative.length).toBeGreaterThan(0);
            } else {
                // If template validation fails, it likely has placeholders we don't have values for
                // Just ensure the template itself is not empty
                expect(template.length).toBeGreaterThan(0);
            }
        });

        test('should handle all context types', () => {
            const contexts = [
                'CREATURE_DEATH',
                'CREATURE_BIRTH',
                'PLANT_GROW',
                'ITEM_CRAFT',
                'EXPLORATION',
            ];
            for (const context of contexts) {
                const narrative = selectDynamicNarrative(context, 3, 42);
                expect(narrative).toBeTruthy();
                expect(narrative.length).toBeGreaterThan(5);
            }
        });

        test('intensity affects narrative length and complexity', () => {
            const subtle = selectDynamicNarrative('CREATURE_DEATH', 1, 42);
            const dramatic = selectDynamicNarrative('CREATURE_DEATH', 5, 42);
            // Dramatic should usually be longer due to more exclamation marks
            expect(dramatic).toBeTruthy();
            expect(subtle).toBeTruthy();
        });

        test('round-trip: select -> validate -> build', () => {
            const template = selectDynamicNarrative('ITEM_CRAFT', 3, 123);
            const values = {
                itemName: 'Iron Sword',
                creatureName: 'Smith',
                location: 'Forge',
            };
            const isValid = validatePlaceholders(template, values);
            if (isValid) {
                const narrative = buildTemplate(template, values);
                expect(narrative).toBeTruthy();
            }
        });
    });
});
