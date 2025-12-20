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
 * Particle count and animation parameters vary by weather type to create very light, subtle visual effects:
 * - STORM: 28 particles (light-moderate, fast-falling rain with random drift)
 * - RAIN: 22 particles (light, subtle with random horizontal drifts)
 * - CLOUDY: 12 particles (very light drizzle for atmospheric effect)
 * - SNOW: 18 particles (sparse, slow-floating with organic swaying)
 * 
 * Opacity range (0.12-0.25) keeps particles extremely subtle and atmospheric.
 * Random path variation (-20 to +20px) adds organic movement to prevent mechanical appearance.
 * Pointer events disabled to allow full interaction pass-through during weather.
 *
 * GPU-accelerated via CSS transforms; negligible performance impact.
 *
 * @param {WeatherType} weather - Current weather condition
 *
 * @example
 * <WeatherParticles weather="RAIN" />
 */
export const WeatherParticles = ({ weather }: WeatherParticlesProps) => {
    // Only render particles for rain/snow/cloudy conditions
    if (!['RAIN', 'STORM', 'SNOW', 'CLOUDY'].includes(weather)) return null;

    const isSnow = weather === 'SNOW';
    const isStorm = weather === 'STORM';
    const isCloudy = weather === 'CLOUDY';

    // Particle count: adjust counts so light rain/cloudy are visible but still sparse
    const particleCount = isStorm ? 30 : weather === 'CLOUDY' ? 20 : isSnow ? 20 : 24;

    /**
     * Generate static particle data on first render or when weather changes.
     * Each particle gets random horizontal position, animation delay, duration, opacity, and size
     * to create visual depth and prevent synchronized falling.
     * Random path variation adds organic movement (curves, drifts).
     */
    const particles = useMemo(() => {
        const random = (min: number, max: number) => Math.random() * (max - min) + min;

        return Array.from({ length: particleCount }).map((_, i) => ({
            id: i,
            left: `${random(0, 100)}%`, // Random horizontal start position
            delay: `${random(0, 5)}s`, // Staggered appearance
            duration: isSnow ? `${random(5, 10)}s` : `${random(0.6, 1.4)}s`, // Snow slower, rain slightly varied
            opacity: isStorm ? random(0.30, 0.55) : isCloudy ? random(0.22, 0.42) : isSnow ? random(0.22, 0.40) : random(0.22, 0.40),
            size: isSnow ? random(10, 22) : random(18, 42), // size tuned for image sprites
            randomPath: random(-20, 20), // Random drift amount in pixels for organic motion
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
                            ? `snow-float-random ${p.duration} linear infinite`
                            : `rain-drop-random ${p.duration} linear infinite`,
                        animationDelay: p.delay,
                        opacity: p.opacity,
                        '--random-drift': `${p.randomPath}px`,
                    } as React.CSSProperties & { '--random-drift': string }}
                >
                    {/* Snowflake or rain drop element */}
                    {isSnow ? (
                        <img
                            src="/asset/images/ui/snow_flake.png"
                            alt="snow"
                            style={{ width: p.size, height: p.size, opacity: p.opacity, display: 'block' }}
                        />
                    ) : (
                        // Rain drop: use sprite image and apply opacity
                        <img
                            src="/asset/images/ui/rain_drop.png"
                            alt="raindrop"
                            style={{ width: Math.max(6, p.size / 2), height: p.size, opacity: p.opacity, display: 'block' }}
                        />
                    )}
                </div>
            ))}
        </div>
    );
};
