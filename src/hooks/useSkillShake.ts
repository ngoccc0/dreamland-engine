/**
 * Hook for triggering shake animation feedback when skill button is clicked while disabled.
 *
 * @remarks
 * Provides visual feedback (shake effect) when player tries to use a skill that's not ready.
 * The animation plays for 400ms and resets automatically. Used in conjunction with toast
 * notifications to give tactile and visual response to invalid actions.
 *
 * @example
 * ```tsx
 * const { shake, triggerShake } = useSkillShake();
 * 
 * const handleSkillClick = () => {
 *   if (!isSkillReady) {
 *     triggerShake();
 *     return;
 *   }
 *   onUseSkill();
 * };
 * 
 * <Button className={shake ? 'animate-shake' : ''} onClick={handleSkillClick}>
 *   Use Skill
 * </Button>
 * ```
 */

import { useState, useCallback } from 'react';

/**
 * Manages shake animation state for skill button feedback
 */
export function useSkillShake() {
    const [shake, setShake] = useState(false);

    /**
     * Triggers the shake animation by setting state to true, then
     * automatically resets after 400ms (duration of animation)
     */
    const triggerShake = useCallback(() => {
        setShake(true);
        const timer = setTimeout(() => setShake(false), 400);
        return () => clearTimeout(timer);
    }, []);

    return { shake, triggerShake };
}
