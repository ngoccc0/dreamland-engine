/**
 * OVERVIEW: Analog game clock widget displaying in-game time with rotating clock face.
 * 
 * Features:
 * - Clock face rotates to show current time (0-1440 minutes = 0-360°)
 * - Sun indicator at 12 o'clock position (noon = 720 minutes)
 * - Moon indicator at 12 o'clock position (midnight = 0/1440 minutes)
 * - Pointer fixed at top; clock rotates beneath it
 * - Responsive sizing (60-80px diameter recommended)
 * - Uses existing assets: time_clock_ui.png (face), clock_pointer.png (pointer)
 * 
 * Time Mapping:
 * - 0 min = Midnight (0:00)
 * - 360 min = 6 AM
 * - 720 min = Noon (12:00, sun visible)
 * - 1080 min = 6 PM
 * - 1440 min = Midnight again (wraps to 0)
 * 
 * Rotation Calculation:
 * - rotationDegrees = (gameTime / 1440) * 360
 * - At 720 min (noon): rotation = 180°
 * - At 0 min (midnight): rotation = 0° (sun at bottom, moon at top)
 * - At 360 min (6 AM): rotation = 90°
 * - At 1080 min (6 PM): rotation = 270°
 */

"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

interface GameClockWidgetProps {
    /**
     * Current game time in minutes (0-1439 per day).
     * 0 = midnight, 360 = 6 AM, 720 = noon, 1080 = 6 PM, 1440 wraps to 0.
     */
    gameTime: number;

    /** Optional className for styling the container. */
    className?: string;

    /** Clock size in pixels (diameter). Recommended: 60-80px. Default: 76px */
    size?: number;
}

/**
 * GameClockWidget component renders an analog clock with sun/moon indicators.
 * 
 * The clock face rotates based on gameTime; the pointer remains fixed at the top.
 * Sun appears at 12 o'clock during noon (720 min); Moon appears at midnight (0 min).
 * 
 * @param gameTime - Current game time in minutes (0-1439)
 * @param className - Optional additional CSS classes
 * @param size - Clock diameter in pixels (default: 76px for w-20 h-20 in Tailwind)
 * @returns JSX element rendering the clock widget
 */
export function GameClockWidget({
    gameTime,
    className = "",
    size = 76,
}: GameClockWidgetProps) {
    // Calculate clock face rotation in degrees
    // At 720 min (noon): rotation = 180° (sun moves to top)
    // At 0 min (midnight): rotation = 0° (moon at top)
    // Clock rotates continuously to show time passing
    const rotationDegrees = useMemo(() => {
        const normalizedTime = gameTime % 1440; // Ensure 0-1439 range
        return (normalizedTime / 1440) * 360; // Convert to degrees
    }, [gameTime]);

    // Determine if it's daytime (6 AM to 6 PM = 360-1080 min)
    // Sun visible during day; Moon visible during night
    const isDaytime = useMemo(() => {
        const normalizedTime = gameTime % 1440;
        return normalizedTime >= 360 && normalizedTime < 1080;
    }, [gameTime]);

    // Sun/Moon indicator position: always appears at top (12 o'clock)
    // This is achieved by rotating the indicator to compensate for clock rotation
    // So when clock rotates, indicator stays at top
    const indicatorRotation = useMemo(() => {
        return -rotationDegrees; // Inverse rotation to keep indicator at top
    }, [rotationDegrees]);

    return (
        <div
            className="relative flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 rounded-full border-2 border-slate-400 shadow-lg"
            style={{
                width: `${size}px`,
                height: `${size}px`,
            }}
        >
            {/* Clock face - using SVG instead of image */}
            <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 w-full h-full"
                style={{
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                }}
            >
                {/* Clock numbers */}
                <text x="50" y="8" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#333">12</text>
                <text x="92" y="54" textAnchor="start" fontSize="8" fontWeight="bold" fill="#333">3</text>
                <text x="50" y="98" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#333">6</text>
                <text x="8" y="54" textAnchor="end" fontSize="8" fontWeight="bold" fill="#333">9</text>
                
                {/* Hour markers */}
                {[...Array(12)].map((_, i) => {
                    const angle = (i * 30) * Math.PI / 180;
                    const x1 = 50 + 45 * Math.cos(angle - Math.PI / 2);
                    const y1 = 50 + 45 * Math.sin(angle - Math.PI / 2);
                    const x2 = 50 + 40 * Math.cos(angle - Math.PI / 2);
                    const y2 = 50 + 40 * Math.sin(angle - Math.PI / 2);
                    return (
                        <line
                            key={`marker-${i}`}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#666"
                            strokeWidth="2"
                        />
                    );
                })}
            </svg>

            {/* Rotating clock hand - minute/hour combined */}
            <div
                className="absolute z-20 origin-center"
                style={{
                    width: "4px",
                    height: `${size * 0.35}px`,
                    backgroundColor: "#333",
                    top: "50%",
                    left: "50%",
                    marginLeft: "-2px",
                    marginTop: `-${size * 0.35 / 2}px`,
                    transform: `rotate(${rotationDegrees}deg)`,
                    transition: "transform 0.05s linear",
                    borderRadius: "2px",
                }}
            />

            {/* Center dot */}
            <div
                className="absolute z-30 bg-gray-800 rounded-full"
                style={{
                    width: "8px",
                    height: "8px",
                    top: "50%",
                    left: "50%",
                    marginLeft: "-4px",
                    marginTop: "-4px",
                }}
            />

            {/* Sun/Moon indicator */}
            <div
                className="absolute z-10 flex items-center justify-center font-bold text-lg"
                style={{
                    top: "8%",
                    left: "50%",
                    transform: "translateX(-50%)",
                }}
            >
                {isDaytime ? "☀️" : "🌙"}
            </div>
        </div>
    );
}

export default GameClockWidget;
