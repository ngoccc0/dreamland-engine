/**
 * @overview
 * Environment temperature color indicator component.
 * Displays thermometer icon that changes:
 * - Below 5°C: ThermometerSnowflake (blue)
 * - 5-40°C: Thermometer with yellow to orange gradient
 * - Above 40°C: ThermometerSun (orange/red)
 */

import React, { useEffect, useRef, useState } from 'react';
import { Thermometer, ThermometerSun, ThermometerSnowflake } from 'lucide-react';

interface EnvTempColorIconProps {
    /** Current environment temperature in Celsius */
    temp: number;
    /** Maximum temperature for scale (default: 50°C) */
    maxTemp?: number;
    /** Icon size in pixels */
    size?: number;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Get environment temperature color ramp.
 * Below 5°C: Blue (cold)
 * 5-15°C: Cyan to Yellow (cool to neutral)
 * 15-40°C: Yellow to Orange to Red (warm to hot)
 * Above 40°C: Deep Red (very hot)
 */
export function getEnvTempColor(temp: number): string {
    // Very cold (below 5°C): deep blue
    if (temp < 5) {
        const coldIntensity = Math.min(1, (5 - temp) / 20); // 0 to 1 as it gets colder
        const r = Math.round(0 + (50 - 0) * (1 - coldIntensity));
        const g = Math.round(100 + (50 - 100) * (1 - coldIntensity));
        const b = Math.round(255); // Full blue
        return `rgb(${r}, ${g}, ${b})`;
    }

    // Cold to cool (5-15°C): cyan to yellow
    if (temp >= 5 && temp <= 15) {
        const t = (temp - 5) / 10; // 0 to 1
        const r = Math.round(50 + (255 - 50) * t);
        const g = Math.round(150 + (255 - 150) * t);
        const b = Math.round(200 + (0 - 200) * t);
        return `rgb(${r}, ${g}, ${b})`;
    }

    // Cool to warm (15-25°C): yellow to orange-yellow
    if (temp > 15 && temp <= 25) {
        const t = (temp - 15) / 10; // 0 to 1
        const r = Math.round(255);
        const g = Math.round(255 - (255 - 180) * t); // 255 to 180
        const b = Math.round(0);
        return `rgb(${r}, ${g}, ${b})`;
    }

    // Warm (25-32°C): orange
    if (temp > 25 && temp <= 32) {
        const t = (temp - 25) / 7; // 0 to 1
        const r = Math.round(255);
        const g = Math.round(180 - (180 - 120) * t); // 180 to 120
        const b = Math.round(0);
        return `rgb(${r}, ${g}, ${b})`;
    }

    // Hot (32-40°C): orange to red
    if (temp > 32 && temp <= 40) {
        const t = (temp - 32) / 8; // 0 to 1
        const r = Math.round(255);
        const g = Math.round(120 - (120 - 50) * t); // 120 to 50
        const b = Math.round(0);
        return `rgb(${r}, ${g}, ${b})`;
    }

    // Very hot (above 40°C): deep red
    if (temp > 40) {
        const overTemp = Math.min(1, (temp - 40) / 20);
        const r = Math.round(255);
        const g = Math.round(50 - (50 - 0) * overTemp); // 50 to 0
        const b = Math.round(0);
        return `rgb(${r}, ${g}, ${b})`;
    }

    return 'rgb(255, 255, 0)'; // Default yellow
}

export function EnvTempColorIcon({ temp, maxTemp = 50, size = 40, className }: EnvTempColorIconProps) {
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

    const envTempColor = getEnvTempColor(displayTemp);

    // Select icon based on temperature range
    let Icon: any;
    if (displayTemp < 5) {
        Icon = ThermometerSnowflake; // Snow icon for very cold
    } else if (displayTemp > 40) {
        Icon = ThermometerSun; // Sun icon for very hot
    } else {
        Icon = Thermometer; // Regular thermometer for normal range
    }

    return (
        <div
            className={className}
            style={{ display: 'inline-flex', alignItems: 'center' }}
            title={`Environment Temperature: ${displayTemp}°C`}
        >
            {/* Dynamic icon with temperature-based color */}
            <Icon
                size={size}
                color={envTempColor}
                strokeWidth={2}
                style={{
                    transition: 'color 0.3s ease-out',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                }}
            />
        </div>
    );
}

export default EnvTempColorIcon;
