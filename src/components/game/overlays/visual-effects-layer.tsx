'use client';

import React, { useRef, useEffect } from 'react';
import { WeatherParticles } from '../world/weather-particles';
import { StatusEffectOverlay } from './status-effect-overlay';
import { DamagePopup, type DamagePopupHandle } from '../panels/damage-popup';

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
 * Positioned absolutely inside the minimap container only—weather effects appear
 * only over the minimap, not over the main game canvas or HUD elements.
 *
 * All overlays use z-index layering (parent positioned within minimap):
 * - z-10: Weather particles (rain/snow/cloudy drizzle)
 * - z-20: Status effect overlay (poison/frozen/burning/stunned)
 * - z-30: Low HP vignette (< 30% health heartbeat)
 * - z-40: Damage popups (floating numbers)
 * 
 * Parent container: absolute inset-0 z-[10] ensures effects stay within minimap bounds.
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

    // Time overlay color class and opacity (animate opacity for smooth fade)
    // Provide RGB base colors and slightly stronger opacity at edges for a subtle vignette
    const { baseRgb, overlayBlendClass, overlayInnerOpacity, overlayOuterOpacity } = (() => {
        switch (timeOfDay) {
            case 'morning':
                return { baseRgb: '255,179,71', overlayBlendClass: 'mix-blend-overlay', overlayInnerOpacity: 0.02, overlayOuterOpacity: 0.08 };
            case 'evening':
                return { baseRgb: '255,140,60', overlayBlendClass: 'mix-blend-overlay', overlayInnerOpacity: 0.035, overlayOuterOpacity: 0.12 };
            case 'night':
                return { baseRgb: '5,11,20', overlayBlendClass: 'mix-blend-multiply', overlayInnerOpacity: 0.08, overlayOuterOpacity: 0.32 };
            default:
                return { baseRgb: '', overlayBlendClass: '', overlayInnerOpacity: 0, overlayOuterOpacity: 0 };
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
        <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
            {/* Time-of-day color overlay with smooth fade in/out on change */}
            {baseRgb && (
                <div
                    aria-hidden
                    className={`absolute inset-0 w-full h-full ${overlayBlendClass}`}
                    style={{
                        background: `radial-gradient(circle at 45% 40%, rgba(${baseRgb}, ${overlayInnerOpacity}) 35%, rgba(${baseRgb}, ${overlayOuterOpacity}) 100%)`,
                        transition: 'background 900ms ease-in-out, opacity 900ms ease-in-out',
                    }}
                />
            )}

            {/* Weather particles (rain/snow) */}
            <WeatherParticles weather={weather as any} />

            {/* Status effect overlay (poison, frozen, etc.) */}
            <StatusEffectOverlay activeEffects={activeEffects} />

            {/* Damage popups */}
            <DamagePopup ref={damagePopupRef} maxPopups={5} />
        </div>
    );
};
