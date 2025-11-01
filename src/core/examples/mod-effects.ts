import type { Effect } from '../types/effects';
import { EffectType, EffectTarget, CustomEffectDefinition } from '../types/effects';

// Example weather effect from a mod
export const RainstormEffect: CustomEffectDefinition = {
    modId: 'weather_expansion',
    name: { key: 'effects.rainstorm.name' },
    description: { key: 'effects.rainstorm.description' },
    type: EffectType.MODIFY_TERRAIN,
    target: EffectTarget.AREA,
    value: 1,
    modifier: {
        type: 'percentage',
        value: 0.5
    },
    duration: 600, // 10 minutes in game time
    tickRate: 10,
    conditions: [
        {
            type: 'location',
            operator: '!=',
            value: 'indoor'
        }
    ],
    visualEffect: 'rain_particles',
    soundEffect: 'rain_ambient',
    tags: ['weather', 'water', 'natural'],
    
    // Custom properties for the weather mod
    customProperties: {
        puddleFormation: true,
        lightningChance: 0.1,
        windSpeed: 20
    }
};

// Example item effect from a mod
export const FrostbiteWeaponEffect: CustomEffectDefinition = {
    modId: 'ice_weapons',
    name: { key: 'effects.frostbite_weapon.name' },
    description: { key: 'effects.frostbite_weapon.description' },
    type: EffectType.CONDITIONAL,
    target: EffectTarget.TARGET,
    value: 10, // Base effect value
    modifier: {
        type: 'flat',
        value: 1
    },
    triggerConditions: [
        {
            type: 'stat',
            operator: '>',
            value: 0,
            target: 'hit_landed'
        }
    ],
    triggeredEffects: [
        {
            id: 'frost_damage',
            name: { key: 'effects.frost_damage.name' },
            description: { key: 'effects.frost_damage.description' },
            type: EffectType.DAMAGE_OVER_TIME,
            target: EffectTarget.TARGET,
            value: 5,
            modifier: { type: 'flat', value: 1 },
            duration: 30,
            tickRate: 5,
            stackable: true,
            maxStacks: 3,
            visualEffect: 'frost_particles',
            tags: ['cold', 'damage', 'magical']
        },
        {
            id: 'slow',
            name: { key: 'effects.slow.name' },
            description: { key: 'effects.slow.description' },
            type: EffectType.MODIFY_MOVEMENT,
            target: EffectTarget.TARGET,
            value: 30,
            modifier: { type: 'percentage', value: -0.3 },
            duration: 15,
            visualEffect: 'frost_feet',
            tags: ['slow', 'movement', 'magical']
        }
    ],
    tags: ['weapon', 'ice', 'magical']
};

// Example status effect from a mod
export const BerserkerEffect: CustomEffectDefinition = {
    modId: 'warrior_classes',
    name: { key: 'effects.berserker.name' },
    description: { key: 'effects.berserker.description' },
    type: EffectType.STATUS,
    target: EffectTarget.SELF,
    conditions: [
        {
            type: 'stat',
            operator: '<',
            value: 50,
            target: 'health_percentage'
        }
    ],
    value: 1,
    modifier: {
        type: 'percentage',
        value: 0.5
    },
    triggeredEffects: [
        {
            id: 'increased_damage',
            name: { key: 'effects.increased_damage.name' },
            description: { key: 'effects.increased_damage.description' },
            type: EffectType.BUFF,
            target: EffectTarget.SELF,
            value: 50,
            modifier: { type: 'percentage', value: 0.5 },
            duration: -1, // Permanent while berserker is active
            tags: ['damage', 'combat']
        },
        {
            id: 'reduced_defense',
            name: { key: 'effects.reduced_defense.name' },
            description: { key: 'effects.reduced_defense.description' },
            type: EffectType.DEBUFF,
            target: EffectTarget.SELF,
            value: -25,
            modifier: { type: 'percentage', value: -0.25 },
            duration: -1,
            tags: ['defense', 'combat']
        }
    ],
    visualEffect: 'berserker_aura',
    tags: ['status', 'combat', 'class_specific']
};
