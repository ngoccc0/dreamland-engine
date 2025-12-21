/**
 * OVERVIEW: Analog game clock widget - MIGRATED to Zustand store
 *
 * Features:
 * - Clock face rotates to show current time (0-1440 minutes = 0-360°)
 * - Sun indicator at 12 o'clock position (noon = 720 minutes)
 * - Moon indicator at 12 o'clock position (midnight = 0/1440 minutes)
 * - Pointer fixed at top; clock rotates beneath it
 * - Responsive sizing (60-80px diameter recommended)
 *
 * Time Mapping:
 * - 0 min = Midnight (0:00)
 * - 360 min = 6 AM
 * - 720 min = Noon (12:00, sun visible)
 * - 1080 min = 6 PM
 * - 1440 min = Midnight again (wraps to 0)
 */

"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTimeStore } from "@/store";

interface GameClockWidgetProps {
    /** Optional className for styling the container. */
    className?: string;
    /** Clock size in pixels (diameter). Recommended: 60-80px. Default: 76px */
    size?: number;
}

/**
 * GameClockWidget component renders an analog clock with sun/moon indicators.
 *
 * MIGRATED to Zustand: Now subscribes to useTimeStore() for real-time updates.
 * No longer accepts gameTime prop - data flows directly from store.
 *
 * The clock face rotates based on game time; the pointer remains fixed at the top.
 * Sun appears at 12 o'clock during noon (720 min); Moon appears at midnight (0 min).
 *
 * @param className - Optional additional CSS classes
 * @param size - Clock diameter in pixels (default: 76px)
 * @returns JSX element rendering the clock widget
 */
export function GameClockWidget({
    className = "",
    size = 76,
}: GameClockWidgetProps) {
    // Subscribe to time store - only this component updates on time changes
    const { turnCount } = useTimeStore();

    // Calculate game time in minutes (1440 turns per day)
    const gameTime = useMemo(() => {
        return (turnCount || 0) % 1440;
    }, [turnCount]);

    // Calculate clock face rotation in degrees
    const rotationDegrees = useMemo(() => {
        const normalizedTime = gameTime % 1440;
        return -((normalizedTime / 1440) * 360) - 180;
    }, [gameTime]);

    // Determine if it's daytime (6 AM to 6 PM = 360-1080 min)
    const isDaytime = useMemo(() => {
        const normalizedTime = gameTime % 1440;
        return normalizedTime >= 360 && normalizedTime < 1080;
    }, [gameTime]);

    return (
        <div
            className={cn("relative flex items-center justify-center bg-opacity-0", className)}
            style={{
                width: `${size}px`,
                height: `${size}px`,
            }}
        >
            {/* Clock face image - rotates with game time */}
            <img
                src="/asset/images/ui/time_clock_ui.png"
                alt="Clock face"
                className="absolute inset-0 w-full h-full"
                style={{
                    transform: `rotate(${rotationDegrees}deg)`,
                    transition: "transform 0.15s linear",
                }}
                aria-hidden="true"
            />

            {/* Pointer - fixed at top (12 o'clock) */}
            <img
                src="/asset/images/ui/clock_pointer.png"
                alt="Clock pointer"
                className="absolute z-20 pointer-events-none"
                style={{
                    width: `${size * 0.25}px`,
                    height: `${size * 0.6}px`,
                    top: `-${size * 0.05}px`,
                    left: "50%",
                    transform: "translateX(-50%)",
                    objectFit: "contain",
                }}
                aria-hidden="true"
            />
        </div>
    );
}

export default GameClockWidget;
