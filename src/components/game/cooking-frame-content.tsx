/**
 * Cooking Frame Content Component
 *
 * @remarks
 * Displays the cooking method visuals (campfire, pot, or oven) centered in the cooking frame.
 * Handles dynamic sizing based on viewport and ingredient count for sauce visualization.
 */

'use client';

import React from 'react';
import type { CookingMethod } from './cooking-station-panel';

export interface CookingFrameContentProps {
    /**
     * Currently active cooking method
     */
    activeMethod: CookingMethod;

    /**
     * Callback to calculate sauce ellipse dimensions
     */
    calculateSauceEllipse: () => { width: number; height: number; opacity: number };
}

/**
 * Renders cooking method visuals with responsive sizing
 */
export function CookingFrameContent({
    activeMethod,
    calculateSauceEllipse,
}: CookingFrameContentProps) {
    return (
        <div className="absolute inset-0 flex items-center justify-center">
            {activeMethod === 'CAMPFIRE' && (
                <div className="relative flex flex-col items-center justify-center">
                    <img
                        src="/asset/images/ui/skew.png"
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
                        src="/asset/images/ui/camp_fire.png"
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
                        src="/asset/images/ui/iron_pot.png"
                        alt="Pot Base"
                        className="absolute object-contain drop-shadow-lg"
                        style={{
                            width: '100%',
                            height: '100%',
                        }}
                    />

                    {/* Sauce layer - elliptical, dynamically sized */}
                    {(() => {
                        const sauce = calculateSauceEllipse();
                        return (
                            <div
                                className="absolute transition-all duration-300"
                                style={{
                                    width: `${sauce.width}px`,
                                    height: `${sauce.height}px`,
                                    borderRadius: '50%',
                                    background:
                                        'radial-gradient(ellipse 50% 40% at center 35%, #e8c78e 0%, #d4a574 50%, #8b6f47 100%)',
                                    opacity: sauce.opacity,
                                    zIndex: 1,
                                    filter: 'blur(1px)',
                                    bottom: '15px',
                                }}
                            />
                        );
                    })()}

                    {/* Pot front layer - on top of sauce */}
                    <img
                        src="/asset/images/ui/iron_pot_front.png"
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
                    src="/asset/images/ui/oven.png"
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
