/**
 * Temperature Slider Component (Vertical)
 *
 * @remarks
 * Displays a vertical temperature slider for oven cooking method.
 * Shows gradient from cool (blue) to hot (red).
 */

'use client';

import React from 'react';

export interface CookingTemperatureSliderProps {
    /**
     * Current temperature value (50-300)
     */
    temperature: number;

    /**
     * Callback when temperature changes
     */
    onTemperatureChange: (temp: number) => void;

    /**
     * Is system animating?
     */
    isAnimating?: boolean;
}

/**
 * Renders vertical temperature slider with gradient
 */
export function CookingTemperatureSlider({
    temperature,
    onTemperatureChange,
    isAnimating = false,
}: CookingTemperatureSliderProps) {
    return (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col items-center gap-2 z-20">
            <div className="text-xs font-bold text-white">300°C</div>
            <div
                className="w-8 rounded-full shadow-lg relative flex items-center justify-center"
                style={{
                    height: '200px',
                    background: 'linear-gradient(to top, rgb(59, 130, 246), rgb(234, 179, 8), rgb(220, 38, 38))',
                }}
            >
                <input
                    type="range"
                    min="50"
                    max="300"
                    step="10"
                    value={temperature}
                    onChange={(e) => onTemperatureChange(Number(e.target.value))}
                    disabled={isAnimating}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{
                        WebkitAppearance: 'slider-vertical',
                    } as React.CSSProperties}
                />
            </div>
            <div className="text-xs font-bold text-white">50°C</div>
        </div>
    );
}
