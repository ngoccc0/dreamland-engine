'use client';

import React, { useMemo } from 'react';

/**
 * Weather particle type: RAIN, STORM, SNOW, or no particles for other conditions
 */
type WeatherType = 'RAIN' | 'STORM' | 'SNOW' | 'CLEAR' | 'CLOUDY' | 'DROUGHT' | 'HEATWAVE';

interface WeatherParticlesProps {
    /**
     * The current weather condition
     */
    weather: WeatherType;
}

/**
 * Generates random particles for visual weather effects (rain, snow).
 *
 * @remarks
 * This component renders CSS-animated particles (rain drops or snowflakes) that fall from top to bottom.
 * Uses `useMemo` to ensure particles are stable across re-renders—only recalculated when `weather` changes.
 * Particle count and animation parameters vary by weather type to create visual distinction:
 * - STORM: 60 particles (heavy, fast-falling rain)
 * - SNOW: 20 particles (sparse, slow-floating)
 * - RAIN: 30 particles (moderate)
 *
 * GPU-accelerated via CSS transforms; negligible performance impact.
 *
 * @param {WeatherType} weather - Current weather condition
 *
 * @example
 * <WeatherParticles weather="RAIN" />
 */
export const WeatherParticles = ({ weather }: WeatherParticlesProps) => {
    // Only render particles for rain/snow conditions
    if (!['RAIN', 'STORM', 'SNOW'].includes(weather)) return null;

    const isSnow = weather === 'SNOW';
    const isStorm = weather === 'STORM';

    // Particle count: Storm (60) > Rain (30) > Snow (20)
    const particleCount = isStorm ? 60 : isSnow ? 20 : 30;

    /**
     * Generate static particle data on first render or when weather changes.
     * Each particle gets random horizontal position, animation delay, duration, opacity, and size
     * to create visual depth and prevent synchronized falling.
     */
    const particles = useMemo(() => {
        const random = (min: number, max: number) => Math.random() * (max - min) + min;

        return Array.from({ length: particleCount }).map((_, i) => ({
            id: i,
            left: `${random(0, 100)}%`, // Random horizontal start position
            delay: `${random(0, 5)}s`, // Staggered appearance
            duration: isSnow ? `${random(5, 10)}s` : `${random(0.5, 1.2)}s`, // Snow slower, rain faster
            opacity: random(0.3, 0.8), // Variable transparency for depth
            size: isSnow ? random(8, 15) : random(20, 40), // Snowflakes smaller than rain drops
        }));
    }, [weather, particleCount, isSnow]);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute top-0"
                    style={{
                        left: p.left,
                        animation: isSnow
                            ? `snow-float ${p.duration} linear infinite`
                            : `rain-drop ${p.duration} linear infinite`,
                        animationDelay: p.delay,
                        opacity: p.opacity,
                    }}
                >
                    {/* Snowflake or rain drop element */}
                    {isSnow ? (
                        <div
                            style={{ fontSize: p.size }}
                            className="text-white drop-shadow-md select-none"
                        >
                            ❄
                        </div>
                    ) : (
                        // Rain drop: thin blue line
                        <div
                            className="w-[1px] bg-blue-200/60 shadow-[0_0_2px_#fff]"
                            style={{ height: p.size }}
                        />
                    )}
                </div>
            ))}
        </div>
    );
};
