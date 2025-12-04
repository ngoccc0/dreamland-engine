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

            {/* Pointer - fixed at top (12 o'clock), extending above border, using inverted pointer image */}
            <img
                src="/asset/images/clock_pointer.png"
                alt="Clock pointer"
                className="absolute z-20 pointer-events-none"
                style={{
                    width: `${size * 0.15}px`,
                    height: `${size * 0.5}px`,
                    top: `${size * -0.15}px`,
                    left: "50%",
                    transform: "translateX(-50%) scaleY(-1)", // Invert triangle (point up)
                    objectFit: "contain",
                }}
                aria-hidden="true"
            />
        </div>
    );
}

export default GameClockWidget;
