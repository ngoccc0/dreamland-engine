/**
 * Cooking Frame Content Component
 *
 * @remarks
 * Displays the cooking method visuals (campfire, pot, or oven) centered in the cooking frame.
 * Handles dynamic sizing based on viewport and ingredient count for sauce visualization.
 *
 * **Sandwich Layer Structure (POT):**
 * 1. Pot base (iron_pot.png) - background
 * 2. Soup ellipse - dynamic color from ingredients
 * 3. Pot front (iron_pot_front.png) - foreground
 *
 * Soup color is calculated using HSL blending for harmonious appearance.
 */

'use client';

import React, { useMemo } from 'react';
import type { CookingMethod } from './cooking-station-panel';
import { blendSoupColors, darkenColor } from '@/lib/cooking/soup-color-blender';

export interface CookingFrameContentProps {
    /**
     * Currently active cooking method
     */
    activeMethod: CookingMethod;

    /**
     * Callback to calculate sauce ellipse dimensions
     */
    calculateSauceEllipse: () => { width: number; height: number; opacity: number };

    /**
     * Array of ingredient IDs currently in the pot (for color blending)
     */
    ingredientIds?: string[];
}

/**
 * Renders cooking method visuals with responsive sizing and dynamic soup colors
 */
export function CookingFrameContent({
    activeMethod,
    calculateSauceEllipse,
    ingredientIds = [],
}: CookingFrameContentProps) {
    // Calculate soup colors from ingredients
    const soupColors = useMemo(
        () => blendSoupColors(ingredientIds),
        [ingredientIds]
    );

    return (
        <div className="absolute inset-0 flex items-center justify-center">
            {activeMethod === 'CAMPFIRE' && (
                <div className="relative flex flex-col items-center justify-center">
                    <img
                        src="/asset/images/ui/cooking/skew.png"
                        alt="Wooden Skew"
                        className="absolute object-contain drop-shadow-lg"
                        style={{
                            width: 'clamp(200px, 60vw, 450px)',
                            height: 'auto',
                            aspectRatio: '8 / 1',
                            transform: 'translateY(-100px)',
                            zIndex: 1,
                        }}
                    />
                    <img
                        src="/asset/images/ui/cooking/camp_fire.png"
                        alt="Campfire"
                        className="relative object-contain drop-shadow-lg z-10"
                        style={{
                            width: 'clamp(120px, 30vw, 200px)',
                            height: 'auto',
                            aspectRatio: '1 / 1',
                        }}
                    />
                </div>
            )}

            {activeMethod === 'POT' && (
                <div
                    className="relative flex items-center justify-center"
                    style={{
                        width: 'clamp(120px, 30vw, 200px)',
                        height: 'clamp(120px, 30vw, 200px)',
                    }}
                >
                    {/* Pot base layer */}
                    <img
                        src="/asset/images/ui/cooking/iron_pot.png"
                        alt="Pot Base"
                        className="absolute object-contain drop-shadow-lg"
                        style={{
                            width: '100%',
                            height: '100%',
                        }}
                    />

                    {/* Soup layer - elliptical, dynamically colored based on ingredients */}
                    {(() => {
                        const sauce = calculateSauceEllipse();
                        const hasSoup = ingredientIds.length > 0 && sauce.opacity > 0;

                        return (
                            <div
                                className={`absolute transition-all duration-500 ease-out ${hasSoup ? 'soup-bubble-anim' : ''}`}
                                style={{
                                    width: `${sauce.width}px`,
                                    height: `${sauce.height}px`,
                                    borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                                    background: hasSoup
                                        ? `radial-gradient(ellipse 50% 40% at center 35%, ${soupColors.secondary} 0%, ${soupColors.primary} 50%, ${darkenColor(soupColors.primary, 0.2)} 100%)`
                                        : 'transparent',
                                    opacity: sauce.opacity,
                                    zIndex: 1,
                                    filter: hasSoup ? 'blur(0.5px)' : 'none',
                                    bottom: '15px',
                                    boxShadow: hasSoup
                                        ? `inset 0 -5px 15px ${darkenColor(soupColors.primary, 0.3)}, 0 2px 10px rgba(0,0,0,0.2)`
                                        : 'none',
                                }}
                            />
                        );
                    })()}

                    {/* Soup shine highlight (optional subtle effect) */}
                    {ingredientIds.length > 0 && (
                        <div
                            className="absolute rounded-full pointer-events-none"
                            style={{
                                width: '30%',
                                height: '15%',
                                background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.4) 0%, transparent 70%)',
                                top: '35%',
                                left: '25%',
                                zIndex: 1,
                                opacity: 0.6,
                            }}
                        />
                    )}

                    {/* Pot front layer - on top of soup */}
                    <img
                        src="/asset/images/ui/cooking/iron_pot_front.png"
                        alt="Pot Front"
                        className="absolute object-contain drop-shadow-lg"
                        style={{
                            width: '100%',
                            height: '100%',
                            zIndex: 2,
                        }}
                    />
                </div>
            )}

            {activeMethod === 'OVEN' && (
                <img
                    src="/asset/images/ui/cooking/oven.png"
                    alt="Oven"
                    className="object-contain drop-shadow-lg"
                    style={{
                        width: 'clamp(120px, 30vw, 200px)',
                        height: 'auto',
                        aspectRatio: '1 / 1',
                    }}
                />
            )}
        </div>
    );
}

