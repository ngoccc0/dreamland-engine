/**
 * @overview
 * Animated temperature gauge component for HUD display.
 * Displays current temperature with color-coded visual feedback (blue=cold, red=hot).
 * Optionally shows weather emoji to indicate current weather conditions.
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/store';
import { useWorldStore } from '@/store';
import BodyTemperatureIcon from './body-temperature-icon';
import BodyTempColorIcon from './body-temp-color-icon';
import EnvTempColorIcon from './env-temp-color-icon';

interface HudIconTemperatureProps {
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
    /** Whether this is displaying body temperature (shows person icon) */
    isBodyTemp?: boolean;
    /** Display body temp as color-changing icon instead of thermometer */
    isBodyTempColorIcon?: boolean;
    /** Show temperature number beside icon instead of overlay */
    showNumberBeside?: boolean;
    /** Display environment temp as color-changing thermometer icon */
    isEnvTempColorIcon?: boolean;
}

/**
 * Map weather ID to display emoji.
 * Weather IDs come from WeatherDefinition.id (e.g., "light_rain", "sunny", "blizzard")
 * @param weatherId Weather ID string (e.g., "light_rain", "clear", "snow")
 * @returns Emoji string for the weather
 */
export function getWeatherEmoji(weatherId?: string): string {
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
 * Get temperature-based color ramp (cold=blue, neutral=green, hot=red).
 * Scale: -30°C (blue) → 0°C (cyan) → 20°C (green) → 40°C (orange) → 50°C (red)
 * @param temp Current temperature in Celsius
 * @param maxTemp Maximum temperature on scale (default: 50°C)
 * @param minTemp Minimum temperature on scale (default: -30°C)
 * @returns Color RGB string
 */
export function getTempColor(temp: number, maxTemp: number = 50, minTemp: number = -30): string {
    // Clamp to minTemp..maxTemp range
    const normalized = Math.max(0, Math.min(1, (temp - minTemp) / (maxTemp - minTemp)));

    if (normalized < 0.25) {
        // Very cold (blue) -30 to 0°C (0-25%)
        const t = normalized / 0.25;
        const r = Math.round(0 + (100 - 0) * t);
        const g = Math.round(100 + (150 - 100) * t);
        const b = Math.round(200 + (255 - 200) * t);
        return `rgb(${r}, ${g}, ${b})`;
    } else if (normalized < 0.5) {
        // Cold (cyan) 0 to 20°C (25-50%)
        const t = (normalized - 0.25) / 0.25;
        const r = Math.round(100 + (0 - 100) * t);
        const g = Math.round(150 + (200 - 150) * t);
        const b = Math.round(255 + (255 - 255) * t);
        return `rgb(${r}, ${g}, ${b})`;
    } else if (normalized < 0.75) {
        // Warm (yellow-orange) 20 to 40°C (50-75%)
        const t = (normalized - 0.5) / 0.25;
        const r = Math.round(255);
        const g = Math.round(200 + (120 - 200) * t);
        const b = Math.round(50 + (0 - 50) * t);
        return `rgb(${r}, ${g}, ${b})`;
    } else {
        // Hot (red) 40 to 50°C (75-100%)
        const t = (normalized - 0.75) / 0.25;
        const r = Math.round(255);
        const g = Math.round(120 + (50 - 120) * t);
        const b = Math.round(0);
        return `rgb(${r}, ${g}, ${b})`;
    }
} export function HudIconTemperature({
    maxTemp = 50,
    weatherType,
    hideWeatherEmoji = false,
    size = 40,
    className,
    isBodyTemp = false,
    isBodyTempColorIcon = false,
    showNumberBeside = false,
    isEnvTempColorIcon = false,
}: HudIconTemperatureProps) {
    const { player } = usePlayerStore();
    const { currentChunk } = useWorldStore();
    
    // Determine temperature source based on display mode
    const temp = useMemo(() => {
        if (isBodyTemp || isBodyTempColorIcon) {
            return player?.bodyTemperature ?? 37;
        } else if (isEnvTempColorIcon) {
            return currentChunk?.temperature ?? 20;
        }
        return 20; // Default
    }, [player?.bodyTemperature, currentChunk?.temperature, isBodyTemp, isBodyTempColorIcon, isEnvTempColorIcon]);
    
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

    // If environment temp color icon, use separate component
    if (isEnvTempColorIcon) {
        return (
            <div className={cn('flex items-center gap-1', className)}>
                <EnvTempColorIcon temp={displayTemp} maxTemp={maxTemp} size={size} />
                {showNumberBeside && (
                    <span className="text-xs font-bold" style={{ minWidth: '30px' }}>
                        {displayTemp.toFixed(1)}°
                    </span>
                )}
            </div>
        );
    }

    // If body temp color icon, use separate component
    if (isBodyTempColorIcon) {
        return (
            <div className={cn('flex items-center gap-1', className)}>
                <BodyTempColorIcon temp={displayTemp} size={size} />
                {showNumberBeside && (
                    <span className="text-xs font-bold" style={{ minWidth: '30px' }}>
                        {displayTemp.toFixed(1)}°
                    </span>
                )}
            </div>
        );
    }

    // Thermometer icon
    if (showNumberBeside) {
        return (
            <div className={cn('flex items-center gap-1', className)} title={`Temperature: ${displayTemp}°C`}>
                {/* Thermometer SVG */}
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 100 100"
                    className="drop-shadow-sm flex-shrink-0"
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
                    <circle cx="50" cy="80" r="12" fill="none" stroke={tempColor} strokeWidth="1.5" style={{ opacity: 0.7, transition: 'stroke 0.3s ease-out' }} />
                    <rect
                        x="46"
                        y="15"
                        width="8"
                        height="65"
                        fill="none"
                        stroke={tempColor}
                        strokeWidth="1.5"
                        rx="4"
                        style={{ opacity: 0.7, transition: 'stroke 0.3s ease-out' }}
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

                {/* Temperature number beside */}
                <span className="text-xs font-bold" style={{ minWidth: '30px' }}>
                    {displayTemp.toFixed(1)}°
                </span>

                {/* Weather emoji indicator */}
                {weatherEmoji && !hideWeatherEmoji && (
                    <div
                        className="text-lg leading-none pointer-events-none"
                        style={{ fontSize: `${size * 0.5}px` }}
                        title={`Weather: ${weatherType}`}
                    >
                        {weatherEmoji}
                    </div>
                )}
            </div>
        );
    }

    // Original overlay thermometer design
    return (
        <div
            className={cn(
                'relative inline-flex items-center justify-center gap-1',
                className
            )}
            style={{ width: isBodyTemp ? size + 16 : size, height: size }}
            title={`Temperature: ${displayTemp}°C`}
        >
            {/* Person icon for body temperature */}
            {isBodyTemp && (
                <BodyTemperatureIcon
                    temp={displayTemp}
                    maxTemp={maxTemp}
                    size={Math.round(size * 0.65)}
                />
            )}
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
                <circle cx="50" cy="80" r="12" fill="none" stroke={tempColor} strokeWidth="1.5" style={{ opacity: 0.7, transition: 'stroke 0.3s ease-out' }} />
                <rect
                    x="46"
                    y="15"
                    width="8"
                    height="65"
                    fill="none"
                    stroke={tempColor}
                    strokeWidth="1.5"
                    rx="4"
                    style={{ opacity: 0.7, transition: 'stroke 0.3s ease-out' }}
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
