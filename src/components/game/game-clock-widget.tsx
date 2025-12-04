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
            className={cn(
                "relative flex items-center justify-center",
                "bg-opacity-0",
                className
            )}
            style={{
                width: `${size}px`,
                height: `${size}px`,
            }}
        >
            {/* Clock face image - rotates with game time */}
            <img
                src="/asset/images/time_clock_ui.png"
                alt="Clock face"
                className="absolute inset-0 w-full h-full"
                style={{
                    transform: `rotate(${rotationDegrees}deg)`,
                    transition: "transform 0.05s linear", // Smooth rotation
                }}
                aria-hidden="true"
            />

            {/* Pointer - fixed at top (12 o'clock) */}
            <div
                className="absolute z-20 pointer-events-none"
                style={{
                    width: "3px",
                    height: `${size * 0.5}px`, // Pointer half the clock size
                    backgroundColor: "rgba(0, 0, 0, 0.7)", // Dark pointer
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    borderRadius: "2px",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                }}
            />

            {/* Sun/Moon indicator - always at top (12 o'clock) */}
            <div
                className="absolute z-10 pointer-events-none"
                style={{
                    width: `${size * 0.25}px`,
                    height: `${size * 0.25}px`,
                    top: `${size * 0.05}px`,
                    left: "50%",
                    transform: `translateX(-50%) translateY(0)`,
                }}
            >
                <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full"
                    aria-hidden="true"
                >
                    {isDaytime ? (
                        /* Sun: yellow circle with rays */
                        <>
                            <circle cx="50" cy="50" r="40" fill="#FFD700" />
                            {/* Sun rays */}
                            <line
                                x1="50"
                                y1="5"
                                x2="50"
                                y2="15"
                                stroke="#FFD700"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                            <line
                                x1="50"
                                y1="85"
                                x2="50"
                                y2="95"
                                stroke="#FFD700"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                            <line
                                x1="5"
                                y1="50"
                                x2="15"
                                y2="50"
                                stroke="#FFD700"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                            <line
                                x1="85"
                                y1="50"
                                x2="95"
                                y2="50"
                                stroke="#FFD700"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                        </>
                    ) : (
                        /* Moon: crescent shape (white) */
                        <>
                            <path
                                d="M 70 50 A 40 40 0 1 1 40 30 A 35 35 0 0 0 70 50"
                                fill="#E8E8E8"
                                stroke="#C0C0C0"
                                strokeWidth="2"
                            />
                            {/* Moon craters for detail */}
                            <circle cx="50" cy="40" r="3" fill="#C0C0C0" opacity="0.6" />
                            <circle cx="60" cy="55" r="2" fill="#C0C0C0" opacity="0.6" />
                        </>
                    )}
                </svg>
            </div>

            {/* Optional: Time display below clock (for debugging/reference) */}
            <div
                className="absolute text-xs font-mono text-gray-600 text-center whitespace-nowrap pointer-events-none"
                style={{
                    bottom: `${-size * 0.4}px`,
                    width: "100%",
                }}
                aria-hidden="true"
            >
                {/* Format time as HH:MM */}
                {String(Math.floor((gameTime % 1440) / 60)).padStart(2, "0")}:
                {String((gameTime % 1440) % 60).padStart(2, "0")}
            </div>
        </div>
    );
}

export default GameClockWidget;
