'use client';

import React, { useRef, useEffect } from 'react';
import { WeatherParticles } from './weather-particles';
import { StatusEffectOverlay } from './status-effect-overlay';
import { DamagePopup, type DamagePopupHandle } from './damage-popup';

interface StatusEffect {
    type: 'POISON' | 'FROZEN' | 'BURNING' | 'STUNNED';
    duration?: number;
}

interface VisualEffectsLayerProps {
    /**
     * Current player HP (0 or above)
     */
    currentHp?: number;

    /**
     * Maximum player HP
     */
    maxHp?: number;

    /**
     * Current weather type
     */
    weather?: string;

    /**
     * Current in-game time (0-1439 minutes per day)
     */
    gameTime?: number;

    /**
     * Array of active status effects on player
     */
    activeEffects?: StatusEffect[];
}

/**
 * Composes all visual effect layers: weather, status effects, low HP vignette, damage popups.
 *
 * @remarks
 * This component orchestrates visual feedback by combining:
 * 1. Weather particles (rain/snow) based on current weather
 * 2. Status effect overlays (poison, frozen, etc.)
 * 3. Low HP heartbeat vignette (< 30% health)
 * 4. Damage/heal popup display
 * 5. Time-of-day color tinting (day/night cycling)
 *
 * Props are passed from parent (game-layout.tsx) to control all visual effects.
 * This avoids hooking directly into game state, keeping the component flexible.
 *
 * All overlays use z-index layering:
 * - z-10: Weather particles
 * - z-20: Status effect overlay
 * - z-30: Low HP vignette
 * - z-40: Damage popups
 *
 * @param {VisualEffectsLayerProps} props - Configuration from parent component
 *
 * @example
 * <VisualEffectsLayer 
 *   currentHp={100} 
 *   maxHp={150} 
 *   weather="RAIN" 
 *   gameTime={720}
 *   activeEffects={[]}
 * />
 */
export const VisualEffectsLayer = ({
    currentHp = 100,
    maxHp = 100,
    weather = 'CLEAR',
    gameTime = 720,
    activeEffects = [],
}: VisualEffectsLayerProps) => {
    const damagePopupRef = useRef<DamagePopupHandle>(null);

    // Calculate if health is low (< 30%)
    const isLowHealth = (currentHp / maxHp) * 100 < 30;

    // Calculate time-of-day for color tinting
    const hour = Math.floor((gameTime % 1440) / 60);
    const timeOfDay = (() => {
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'day';
        if (hour >= 18 && hour < 21) return 'evening';
        return 'night';
    })();

    // Time overlay CSS classes
    const timeOverlayClass = (() => {
        switch (timeOfDay) {
            case 'morning':
                return 'bg-orange-100/10 mix-blend-overlay';
            case 'evening':
                return 'bg-orange-500/20 mix-blend-overlay';
            case 'night':
                return 'bg-[#050b14]/70 mix-blend-multiply';
            default:
                return '';
        }
    })();

    /**
     * Expose damage popup function globally for use in combat/damage event handlers
     */
    useEffect(() => {
        if (damagePopupRef.current) {
            (window as any).__showDamagePopup = (value: number, type?: 'damage' | 'heal' | 'critical') => {
                damagePopupRef.current?.add?.(value, type || 'damage');
            };
        }
    }, []);

    return (
        <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden transition-all duration-[2000ms]">
            {/* Time-of-day color overlay */}
            <div
                className={`absolute inset-0 w-full h-full transition-all duration-[2000ms] ${timeOverlayClass}`}
            />

            {/* Weather particles (rain/snow) */}
            <WeatherParticles weather={weather as any} />

            {/* Status effect overlay (poison, frozen, etc.) */}
            <StatusEffectOverlay activeEffects={activeEffects} />

            {/* Low HP heartbeat vignette */}
            {isLowHealth && (
                <div
                    className="absolute inset-0 pointer-events-none z-30"
                    style={{
                        animation: 'heartbeat-vignette 1.5s infinite',
                        background: 'radial-gradient(circle, transparent 60%, rgba(180, 0, 0, 0.4) 100%)',
                    }}
                />
            )}

            {/* Damage popups */}
            <DamagePopup ref={damagePopupRef} maxPopups={5} />
        </div>
    );
};
