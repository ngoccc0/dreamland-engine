'use client';

import React, { useMemo } from 'react';

/**
 * Status effect type for visual feedback
 */
type StatusEffectType = 'POISON' | 'FROZEN' | 'BURNING' | 'STUNNED';

interface StatusEffect {
    type: StatusEffectType;
    duration?: number; // remaining ticks, undefined = indefinite
}

interface StatusEffectOverlayProps {
    /**
     * Array of active status effects
     */
    activeEffects: StatusEffect[];
}

/**
 * Renders full-screen color overlay based on active status effects.
 *
 * @remarks
 * This component displays color tints to provide visual feedback for status conditions:
 * - Poison: Pulsing green overlay with semi-transparency
 * - Frozen: Pulsing blue overlay with frost-like effect
 * - Burning: Pulsing red-orange overlay
 * - Stunned: Pulsing yellow overlay
 *
 * Uses `useMemo` to compute active effect list only when input changes.
 * Only renders when at least one effect is active.
 *
 * @param {StatusEffect[]} activeEffects - Array of active status effects
 *
 * @example
 * <StatusEffectOverlay activeEffects={[{ type: 'POISON', duration: 10 }]} />
 */
export const StatusEffectOverlay = ({ activeEffects }: StatusEffectOverlayProps) => {
    // Determine which effect is currently active (prioritize by severity)
    const dominantEffect = useMemo(() => {
        if (activeEffects.length === 0) return null;
        // Priority: BURNING > FROZEN > POISON > STUNNED
        const priorities: Record<StatusEffectType, number> = {
            BURNING: 4,
            FROZEN: 3,
            POISON: 2,
            STUNNED: 1,
        };
        return activeEffects.reduce((prev, curr) =>
            priorities[curr.type] > priorities[prev.type] ? curr : prev
        );
    }, [activeEffects]);

    if (!dominantEffect) return null;

    const effectConfig: Record<
        StatusEffectType,
        { animation: string; bgGradient: string; label: string }
    > = {
        POISON: {
            animation: 'poison-tint 2s ease-in-out infinite',
            bgGradient: 'radial-gradient(circle, transparent 0%, rgba(34, 197, 94, 0.3) 100%)',
            label: 'poison',
        },
        FROZEN: {
            animation: 'frozen-tint 2.5s ease-in-out infinite',
            bgGradient: 'radial-gradient(circle, transparent 0%, rgba(59, 130, 246, 0.4) 100%)',
            label: 'frozen',
        },
        BURNING: {
            animation: 'poison-tint 1s ease-in-out infinite', // Reuse faster pulse
            bgGradient: 'radial-gradient(circle, transparent 0%, rgba(239, 68, 68, 0.35) 100%)',
            label: 'burning',
        },
        STUNNED: {
            animation: 'poison-tint 1.5s ease-in-out infinite',
            bgGradient: 'radial-gradient(circle, transparent 0%, rgba(234, 179, 8, 0.25) 100%)',
            label: 'stunned',
        },
    };

    const config = effectConfig[dominantEffect.type];

    return (
        <div
            className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-300"
            style={{
                animation: config.animation,
                background: config.bgGradient,
            }}
            data-effect={config.label}
        />
    );
};
