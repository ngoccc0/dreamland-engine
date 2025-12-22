'use client';

import React, { useMemo } from 'react';
import { useHudStore, selectPlayerHp, selectPlayerMaxHp, selectPlayerHunger, selectPlayerEnergy, selectPlayerLevel, selectGameHour, selectGameDay, selectSeason, selectWeatherCondition, selectTemperature, selectLocationName } from '@/store';
import { useHudDisplay } from '@/hooks/use-hud-display';

/**
 * HudSection - Smart Container
 *
 * @remarks
 * **Responsibility:**
 * - Subscribe to HUD-specific store data (player stats, time, weather)
 * - Display player stats (health, hunger, energy)
 * - Show game time and weather
 * - Render location information
 *
 * **Why Smart Container:**
 * - Only re-renders when HUD data changes (atomic selectors)
 * - Independent from GameLayout and other sections
 * - No prop drilling - all data from store
 * - Testable independently
 *
 * **Data Flow:**
 * GameLayout → (via useGameEngine update) → HudStore → HudSection (atomic selectors)
 * GameLayout never passes props to HudSection
 *
 * @returns Rendered HUD with stats, time, weather, location
 */
export function HudSection() {
  // Atomic selectors - only re-render on these specific values changing
  const playerHp = useHudStore(selectPlayerHp);
  const playerMaxHp = useHudStore(selectPlayerMaxHp);
  const playerHunger = useHudStore(selectPlayerHunger);
  const playerEnergy = useHudStore(selectPlayerEnergy);
  const playerLevel = useHudStore(selectPlayerLevel);
  
  const gameHour = useHudStore(selectGameHour);
  const gameDay = useHudStore(selectGameDay);
  const season = useHudStore(selectSeason);
  
  const weatherCondition = useHudStore(selectWeatherCondition);
  const temperature = useHudStore(selectTemperature);
  
  const locationName = useHudStore(selectLocationName);

  // Format display values
  const {
    healthStatus,
    hungerStatus,
    energyStatus,
    timeDisplay,
    weatherDisplay,
  } = useHudDisplay(
    playerHp,
    playerMaxHp,
    playerHunger,
    100, // maxHunger - could be from store
    playerEnergy,
    100, // maxEnergy - could be from store
    { currentHour: gameHour, currentDay: gameDay, season },
    { condition: weatherCondition, temperature, biome: locationName }
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
            {playerHp}/{playerMaxHp} ({healthStatus.label})
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
          <span className="font-semibold">Location:</span> {locationName}
        </div>
        <div className="level">
          <span className="font-semibold">Level:</span> {playerLevel}
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
}