'use client';

import React, { useMemo } from 'react';
import { useHudData } from '@/hooks/use-hud-data';
import { useHudDisplay } from '@/hooks/use-hud-display';

/**
 * HudSection - Smart Container (Memoized)
 *
 * @remarks
 * **Responsibility:**
 * - Subscribe to HUD-specific store data (player stats, time, weather)
 * - Display player stats (health, hunger, energy)
 * - Show game time and weather
 * - Render location information
 *
 * **Why Smart Container:**
 * - Only re-renders when HUD data changes (atomic selectors via useHudData)
 * - Independent from GameLayout and other sections
 * - No prop drilling - all data from store
 * - Memoized to prevent re-renders from parent
 * - Testable independently
 *
 * **Data Flow:**
 * GameLayout → (via useGameEngine update) → HudStore → HudSection (useHudData)
 * GameLayout never passes props to HudSection
 *
 * @returns Rendered HUD with stats, time, weather, location
 */
export const HudSection = React.memo(function HudSection() {
    // Aggregate all HUD data in single hook subscription
    const hudData = useHudData();

    // Format display values
    const {
        healthStatus,
        hungerStatus,
        energyStatus,
        timeDisplay,
        weatherDisplay,
    } = useHudDisplay(
        hudData.playerHp,
        hudData.playerMaxHp,
        hudData.playerHunger,
        hudData.playerMaxHunger,
        hudData.playerEnergy,
        hudData.playerMaxEnergy,
        {
            currentHour: hudData.gameHour,
            currentDay: hudData.gameDay,
            season: hudData.season
        },
        {
            condition: hudData.weatherCondition,
            temperature: hudData.temperature,
            biome: hudData.locationName
        }
    );

    // Build UI sections
    const healthPercentageStyle = useMemo(() => ({
        width: `${healthStatus.percentage}%`,
        backgroundColor: healthStatus.isCritical ? '#ff4444' : healthStatus.isLow ? '#ffaa44' : '#44ff44',
    }), [healthStatus]);

    const hungerPercentageStyle = useMemo(() => ({
        width: `${hungerStatus.percentage}%`,
        backgroundColor: hungerStatus.isStarving ? '#ff4444' : hungerStatus.isHungry ? '#ffaa44' : '#44ff44',
    }), [hungerStatus]);

    const energyPercentageStyle = useMemo(() => ({
        width: `${energyStatus.percentage}%`,
        backgroundColor: energyStatus.isExhausted ? '#ff4444' : energyStatus.isTired ? '#ffaa44' : '#4444ff',
    }), [energyStatus]);

    return (
        <div className="hud-section flex flex-col gap-4 p-4">
            {/* Player Stats Row */}
            <div className="stats-container grid grid-cols-3 gap-4">
                {/* Health */}
                <div className="stat-block">
                    <div className="stat-label text-sm font-semibold">Health</div>
                    <div className="stat-bar bg-gray-200 h-4 rounded overflow-hidden">
                        <div className="stat-fill h-full transition-all" style={healthPercentageStyle} />
                    </div>
                    <div className="stat-value text-xs text-gray-600">
                        {hudData.playerHp}/{hudData.playerMaxHp} ({healthStatus.label})
                    </div>
                </div>

                {/* Hunger */}
                <div className="stat-block">
                    <div className="stat-label text-sm font-semibold">Hunger</div>
                    <div className="stat-bar bg-gray-200 h-4 rounded overflow-hidden">
                        <div className="stat-fill h-full transition-all" style={hungerPercentageStyle} />
                    </div>
                    <div className="stat-value text-xs text-gray-600">
                        {hungerStatus.percentage}% ({hungerStatus.label})
                    </div>
                </div>

                {/* Energy */}
                <div className="stat-block">
                    <div className="stat-label text-sm font-semibold">Energy</div>
                    <div className="stat-bar bg-gray-200 h-4 rounded overflow-hidden">
                        <div className="stat-fill h-full transition-all" style={energyPercentageStyle} />
                    </div>
                    <div className="stat-value text-xs text-gray-600">
                        {energyStatus.percentage}% ({energyStatus.label})
                    </div>
                </div>
            </div>

            {/* Location & Level */}
            <div className="location-level-row flex justify-between items-center text-sm">
                <div className="location">
                    <span className="font-semibold">Location:</span> {hudData.locationName}
                </div>
                <div className="level">
                    <span className="font-semibold">Level:</span> {hudData.playerLevel}
                </div>
            </div>

            {/* Time & Weather */}
            <div className="time-weather-row flex justify-between items-center text-sm">
                <div className="time">
                    <span className="font-semibold">Time:</span> {timeDisplay.hour}:00 {timeDisplay.period}, {timeDisplay.season}
                </div>
                <div className="weather">
                    <span className="font-semibold">Weather:</span> {weatherDisplay.icon} {weatherDisplay.condition}, {weatherDisplay.temperature}°C
                </div>
            </div>
        </div>
    );
});