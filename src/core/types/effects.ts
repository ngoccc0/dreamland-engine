import { TranslatableString } from '../types/i18n';

export enum EffectType {
    // Core Effects
    DAMAGE = 'damage',
    HEAL = 'heal',
    BUFF = 'buff',
    DEBUFF = 'debuff',
    
    // Environment Effects
    ENVIRONMENT = 'environment',
    TEMPERATURE = 'temperature',
    MOISTURE = 'moisture',
    WIND = 'wind',
    
    // Other Effects
    STATUS = 'status',
    
    // Combat Effects
    DAMAGE_OVER_TIME = 'damage_over_time',
    HEALING_OVER_TIME = 'healing_over_time',
    
    // Movement Effects
    MODIFY_MOVEMENT = 'modify_movement',
    
    // Resource Effects
    MODIFY_RESOURCE = 'modify_resource',
    RESOURCE_REGEN = 'resource_regen',
    
    // Environmental Effects
    MODIFY_VISION = 'modify_vision',
    MODIFY_TERRAIN = 'modify_terrain',
    
    // Special Effects
    TRIGGER_ABILITY = 'trigger_ability',
    CONDITIONAL = 'conditional'
}

export enum EffectTarget {
    SELF = 'self',
    TARGET = 'target',
    AREA = 'area',
    GLOBAL = 'global'
}

export interface EffectCondition {
    type: 'stat' | 'skill' | 'status' | 'time' | 'location' | 'weather';
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    value: number | string;
    target?: string; // Specific stat/skill/status to check
}

export interface EffectModifier {
    type: 'flat' | 'percentage' | 'multiply' | 'set';
    value: number;
}

export interface Effect {
    id: string;
    name: TranslatableString;
    description: TranslatableString;
    type: EffectType;
    target: EffectTarget;
    
    // Core effect properties
    value: number;
    modifier: EffectModifier;
    duration?: number; // In game ticks, undefined = permanent
    tickRate?: number; // How often the effect updates
    stackable?: boolean;
    maxStacks?: number;
    
    // Conditions for the effect to be active/applied
    conditions?: EffectCondition[];
    
    // For conditional effects
    triggerConditions?: EffectCondition[];
    triggeredEffects?: Effect[];
    
    // Visual feedback
    visualEffect?: string;
    soundEffect?: string;
    
    // Metadata for modding
    source?: string; // ID of item/weather/skill that created this
    tags?: string[]; // For mod compatibility and effect interaction
}

// Custom effect definitions can be loaded from mods
export interface CustomEffectDefinition extends Omit<Effect, 'id'> {
    modId: string; // Identifier for the mod
    customProperties?: Record<string, any>; // Additional mod-specific properties
}
