/**
 * @overview
 * Animated temperature gauge component for HUD display.
 * Displays current temperature with color-coded visual feedback (blue=cold, red=hot).
 * Optionally shows weather emoji to indicate current weather conditions.
 */

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface HudIconTemperatureProps {
    /** Current temperature in Celsius */
    temp: number;
    /** Maximum temperature for gauge scale (default: 50°C) */
    maxTemp?: number;
    /** Weather ID to display emoji (e.g., "light_rain", "sunny", "blizzard") */
    weatherType?: string;
    /** Hide weather emoji display */
    hideWeatherEmoji?: boolean;
    /** Icon size in pixels */
    size?: number;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Map weather ID to display emoji.
 * Weather IDs come from WeatherDefinition.id (e.g., "light_rain", "sunny", "blizzard")
 * @param weatherId Weather ID string (e.g., "light_rain", "clear", "snow")
 * @returns Emoji string for the weather
 */
function getWeatherEmoji(weatherId?: string): string {
    if (!weatherId) return '';

    const idLower = String(weatherId).toLowerCase();

    // Map common weather IDs to emojis
    if (idLower.includes('rain') || idLower.includes('drizzle')) return '🌧️';
    if (idLower.includes('storm') || idLower.includes('thunder')) return '⛈️';
    if (idLower.includes('snow') || idLower.includes('blizzard')) return '❄️';
    if (idLower.includes('wind') || idLower.includes('gale')) return '🌬️';
    if (idLower.includes('fog') || idLower.includes('mist')) return '🌫️';
    if (idLower.includes('haze') || idLower.includes('smoke')) return '🌫️';
    if (idLower.includes('dust') || idLower.includes('sand')) return '🌪️';
    if (idLower.includes('hail')) return '🧊';
    if (idLower.includes('heat') || idLower.includes('heatwave')) return '🔥';
    if (idLower.includes('sun') || idLower.includes('clear') || idLower.includes('sunny')) return '☀️';
    if (idLower.includes('cloud') || idLower.includes('cloudy') || idLower.includes('overcast')) return '☁️';

    return '';
}

/**
 * Get temperature-based color ramp (cold=blue, neutral=yellow, hot=red).
 * @param temp Current temperature
 * @param maxTemp Maximum temperature on scale
 * @returns Color hex string
 */
function getTempColor(temp: number, maxTemp: number = 50): string {
    // Clamp to 0..maxTemp range
    const normalized = Math.max(0, Math.min(1, temp / maxTemp));

    if (normalized < 0.33) {
        // Cold (blue) 0-33%
        const t = normalized / 0.33;
        const r = Math.round(0 + (255 - 0) * t);
        const g = Math.round(100 + (150 - 100) * t);
        const b = Math.round(200 + (255 - 200) * t);
        return `rgb(${r}, ${g}, ${b})`;
    } else if (normalized < 0.66) {
        // Neutral (yellow) 33-66%
        const t = (normalized - 0.33) / 0.33;
        const r = Math.round(255 + (255 - 255) * t);
        const g = Math.round(150 + (200 - 150) * t);
        const b = Math.round(255 + (100 - 255) * t);
        return `rgb(${r}, ${g}, ${b})`;
    } else {
        // Hot (red) 66-100%
        const t = (normalized - 0.66) / 0.34;
        const r = Math.round(255 + (255 - 255) * t);
        const g = Math.round(200 + (50 - 200) * t);
        const b = Math.round(100 + (0 - 100) * t);
        return `rgb(${r}, ${g}, ${b})`;
    }
}

export function HudIconTemperature({
    temp,
    maxTemp = 50,
    weatherType,
    hideWeatherEmoji = false,
    size = 40,
    className,
}: HudIconTemperatureProps) {
    const id = useRef(`temp-${Math.random().toString(36).slice(2, 9)}`).current;
    const [displayTemp, setDisplayTemp] = useState(Math.round(temp * 10) / 10);
    const tempRef = useRef(temp);
    const animRef = useRef<number | null>(null);

    // Animate temperature number changes smoothly
    useEffect(() => {
        const targetTemp = temp;
        let currentTemp = tempRef.current;

        if (Math.abs(currentTemp - targetTemp) > 0.1) {
            const start = Date.now();
            const duration = 400; // ms

            const animate = () => {
                const elapsed = Date.now() - start;
                const progress = Math.min(elapsed / duration, 1);
                const newTemp = currentTemp + (targetTemp - currentTemp) * progress;
                setDisplayTemp(Math.round(newTemp * 10) / 10);

                if (progress < 1) {
                    animRef.current = requestAnimationFrame(animate);
                } else {
                    tempRef.current = targetTemp;
                }
            };

            animRef.current = requestAnimationFrame(animate);

            return () => {
                if (animRef.current) cancelAnimationFrame(animRef.current);
            };
        } else {
            setDisplayTemp(Math.round(targetTemp * 10) / 10);
            tempRef.current = targetTemp;
        }
    }, [temp]);

    const fillPercent = Math.max(0, Math.min(100, (displayTemp / maxTemp) * 100));
    const tempColor = getTempColor(displayTemp, maxTemp);
    const weatherEmoji = hideWeatherEmoji ? '' : getWeatherEmoji(weatherType);

    return (
        <div
            className={cn(
                'relative inline-flex items-center justify-center',
                className
            )}
            style={{ width: size, height: size }}
            title={`Temperature: ${displayTemp}°C`}
        >
            {/* Thermometer SVG */}
            <svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                className="drop-shadow-sm"
                style={{ position: 'relative', zIndex: 1 }}
            >
                {/* Background bulb and tube */}
                <defs>
                    <linearGradient id={`tempGrad-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#e0e7ff" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#c7d2fe" stopOpacity="0.5" />
                    </linearGradient>
                </defs>

                {/* Outer outline (thermometer shape) */}
                <circle cx="50" cy="80" r="12" fill="none" stroke="#1a1a2e" strokeWidth="1.5" />
                <rect
                    x="46"
                    y="15"
                    width="8"
                    height="65"
                    fill="none"
                    stroke="#1a1a2e"
                    strokeWidth="1.5"
                    rx="4"
                />

                {/* Filled liquid (animated) */}
                <circle
                    cx="50"
                    cy="80"
                    r="10"
                    fill={tempColor}
                    opacity="0.9"
                    style={{ transition: 'fill 0.3s ease-out' }}
                />
                <rect
                    x="47"
                    y={15 + (65 * (1 - fillPercent / 100))}
                    width="6"
                    height={65 * (fillPercent / 100)}
                    fill={tempColor}
                    opacity="0.85"
                    rx="3"
                    style={{ transition: 'all 0.3s ease-out' }}
                />

                {/* Glass highlight for 3D effect */}
                <ellipse cx="48" cy="18" rx="2.5" ry="3" fill="white" opacity="0.4" />
            </svg>

            {/* Temperature number overlay */}
            <div
                className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground pointer-events-none"
                style={{
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    fontSize: `${Math.max(8, size * 0.35)}px`,
                }}
            >
                {displayTemp.toFixed(1)}
            </div>

            {/* Weather emoji indicator */}
            {weatherEmoji && !hideWeatherEmoji && (
                <div
                    className="absolute top-0 right-0 text-lg leading-none pointer-events-none"
                    style={{ fontSize: `${size * 0.5}px` }}
                    title={`Weather: ${weatherType}`}
                >
                    {weatherEmoji}
                </div>
            )}
        </div>
    );
}

export default HudIconTemperature;
