/**
 * @overview
 * Body temperature color indicator component.
 * Displays a lucide PersonStanding icon that changes color based on body temperature.
 * White (10-15°C), Blue (cold), Yellow (neutral), Orange (warm), Red (hot).
 */

import React, { useEffect, useRef, useState } from 'react';
import { PersonStanding } from 'lucide-react';

interface BodyTempColorIconProps {
    /** Current body temperature in Celsius */
    temp: number;
    /** Icon size in pixels */
    size?: number;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Get body temperature color ramp.
 * 10-15°C: White
 * Below 10°C: Blue (deeper blue as it gets colder)
 * 15-25°C: Yellow/Green (neutral/cool)
 * 25-35°C: Yellow/Orange (warm)
 * 35-40°C: Orange/Red (hot)
 * Above 40°C: Deep Red (very hot)
 */
export function getBodyTempColor(temp: number): string {
    // White zone: 10-15°C
    if (temp >= 10 && temp <= 15) {
        const t = (temp - 10) / 5; // 0 to 1 within white zone
        // Transition from white to light yellow
        const r = Math.round(255);
        const g = Math.round(255);
        const b = Math.round(200 + (55 - 200) * t); // 200 to 55
        return `rgb(${r}, ${g}, ${b})`;
    }

    // Cold (below 10°C): progressively darker blue
    if (temp < 10) {
        const coldIntensity = Math.min(1, (10 - temp) / 20); // 0 to 1 as it gets colder
        const r = Math.round(0 + (100 - 0) * (1 - coldIntensity));
        const g = Math.round(150 + (100 - 150) * (1 - coldIntensity));
        const b = Math.round(255); // Full blue
        return `rgb(${r}, ${g}, ${b})`;
    }

    // Warm range: 15-40°C
    if (temp > 15 && temp <= 40) {
        // 15-25: Yellow/Green (neutral)
        if (temp <= 25) {
            const t = (temp - 15) / 10;
            const r = Math.round(255);
            const g = Math.round(255 - (255 - 200) * t); // 255 to 200
            const b = Math.round(55 - (55 - 0) * t); // 55 to 0 (no blue)
            return `rgb(${r}, ${g}, ${b})`;
        }
        // 25-32: Yellow to Orange
        else if (temp <= 32) {
            const t = (temp - 25) / 7;
            const r = Math.round(255);
            const g = Math.round(200 - (200 - 150) * t); // 200 to 150
            const b = Math.round(0);
            return `rgb(${r}, ${g}, ${b})`;
        }
        // 32-40: Orange to Red
        else {
            const t = (temp - 32) / 8;
            const r = Math.round(255);
            const g = Math.round(150 - (150 - 50) * t); // 150 to 50
            const b = Math.round(0);
            return `rgb(${r}, ${g}, ${b})`;
        }
    }

    // Very hot (above 40°C): deep red
    if (temp > 40) {
        const overTemp = Math.min(1, (temp - 40) / 10);
        const r = Math.round(255);
        const g = Math.round(50 - (50 - 0) * overTemp); // 50 to 0
        const b = Math.round(0);
        return `rgb(${r}, ${g}, ${b})`;
    }

    return 'rgb(255, 255, 200)'; // Default white-ish
}

export function BodyTempColorIcon({ temp, size = 40, className }: BodyTempColorIconProps) {
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

    const bodyTempColor = getBodyTempColor(displayTemp);

    return (
        <div
            className={className}
            style={{ display: 'inline-flex', alignItems: 'center' }}
            title={`Body Temperature: ${displayTemp}°C`}
        >
            {/* PersonStanding icon with temperature-based color */}
            <PersonStanding
                size={size}
                color={bodyTempColor}
                strokeWidth={2}
                style={{
                    transition: 'color 0.3s ease-out',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                }}
            />
        </div>
    );
}

export default BodyTempColorIcon;
