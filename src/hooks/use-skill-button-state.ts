/**
 * Hook for computing skill button UI states based on cooldown and mana.
 *
 * @remarks
 * Evaluates a skill's readiness by checking three conditions in order:
 * 1. Cooldown (if cooldown > 0, button shows timer and is disabled)
 * 2. Mana (if mana insufficient, button shows error and is disabled)
 * 3. Ready (otherwise button is enabled and clickable)
 *
 * This hook returns UI state information that determines button styling,
 * tooltip text, and overlay displays. Shake effect is triggered separately.
 *
 * @example
 * ```tsx
 * const { state, disabled, label, tooltip } = useSkillState(skill, playerMana);
 * <Button disabled={disabled} className={state === 'ON_COOLDOWN' ? 'animate-pulse' : ''}>
 *   {label}
 * </Button>
 * ```
 */

/**
 * Possible skill button states
 */
export type SkillButtonState = 'READY' | 'INSUFFICIENT_MANA' | 'ON_COOLDOWN';

/**
 * Interface for skill UI state returned by hook
 */
export interface SkillUIState {
    /** Current state of the skill button */
    state: SkillButtonState;
    /** Whether button should be disabled */
    disabled: boolean;
    /** Text to display on button or overlay */
    label: string;
    /** Tooltip text for hovering */
    tooltip: string;
}

/**
 * Minimal skill interface for the hook
 */
export interface SkillForUIState {
    name?: string | any;
    description?: string | any;
    manaCost?: number;
    cooldownRemaining?: number;
    cooldown?: number;
}

/**
 * Helper to convert translatable object or string to plain string
 */
function toString(value: string | any | undefined): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value.en) return value.en;
    return String(value);
}

/**
 * Skill state hook - determines if skill can be cast and displays status.
 *
 * @remarks
 * Evaluates skill readiness based on:
 * - **Cooldown**: Remaining cooldown time (seconds)
 * - **Mana**: Required mana vs available mana pool
 * - **State**: READY, INSUFFICIENT_MANA, ON_COOLDOWN
 *
 * **Display Info:**
 * Returns human-readable status text:
 * - "Ready" if skill can be cast immediately
 * - "X.Xs cooldown" if on cooldown
 * - "Need Y mana" if insufficient mana
 *
 * **Disabled Logic:**
 * Skill is disabled if on cooldown OR insufficient mana.
 * UI should visually indicate disabled state and show status text.
 *
 * @param skill - Skill object with manaCost, cooldownRemaining properties
 * @param currentMana - Player's current mana pool
 * @returns Object containing state, disabled flag, and display text
 */
export function useSkillState(
    skill: SkillForUIState,
    currentMana: number
): SkillUIState {
    const manaCost = skill.manaCost ?? 0;
    const cooldownRemaining = skill.cooldownRemaining ?? 0;
    const skillName = toString(skill.name) || 'Skill';
    const description = toString(skill.description) || 'Click to cast';

    // Priority 1: Check cooldown first
    if (cooldownRemaining > 0) {
        const displayTime = cooldownRemaining.toFixed(1);
        return {
            state: 'ON_COOLDOWN',
            disabled: true,
            label: `${displayTime}s`,
            tooltip: `⏳ Cooldown (${displayTime}s)`
        };
    }

    // Priority 2: Check mana
    if (currentMana < manaCost) {
        const manaNeeded = manaCost - currentMana;
        return {
            state: 'INSUFFICIENT_MANA',
            disabled: true,
            label: skillName,
            tooltip: `❌ Cần +${manaNeeded} Mana`
        };
    }

    // Priority 3: Ready to use
    return {
        state: 'READY',
        disabled: false,
        label: skillName,
        tooltip: description
    };
}
