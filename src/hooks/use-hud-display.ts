/**
 * @file src/hooks/use-hud-display.ts
 * @description Hook for formatting HUD display data
 *
 * @remarks
 * Provides calculated display values for HUD components:
 * - Health status (is low, is critical, percentage)
 * - Hunger level (is hungry, is starving)
 * - Energy level (is tired, is exhausted)
 * - Time formatting (hour AM/PM, day number, season name)
 * - Weather display (condition text, temperature unit)
 *
 * Pure calculation functions - no side effects, no React hooks.
 */

import { useMemo } from 'react';
import type { GameTimeState, WeatherState } from '@/store/hud.store';

export interface HealthStatus {
  percentage: number;
  isLow: boolean;
  isCritical: boolean;
  label: 'Healthy' | 'Hurt' | 'Critical';
}

export interface HungerStatus {
  percentage: number;
  isHungry: boolean;
  isStarving: boolean;
  label: 'Satisfied' | 'Hungry' | 'Starving';
}

export interface EnergyStatus {
  percentage: number;
  isTired: boolean;
  isExhausted: boolean;
  label: 'Energized' | 'Tired' | 'Exhausted';
}

export interface TimeDisplay {
  hour: number;
  period: 'AM' | 'PM';
  day: number;
  season: string;
  dayName: string; // "Day 1", "Day 2", etc.
}

export interface WeatherDisplay {
  condition: string;
  temperature: number;
  temperatureUnit: string;
  icon: string;
}

/**
 * Hook for formatting HUD display data
 *
 * @remarks
 * Memoizes calculations to prevent unnecessary re-computations.
 * All calculations are pure functions of input values.
 *
 * @returns Object with formatted display values
 *
 * @example
 * ```tsx
 * const { healthStatus, hungerStatus, timeDisplay } = useHudDisplay(hp, maxHp, hunger, maxHunger, gameTime);
 * return (
 *   <>
 *     <HealthBar health={healthStatus} />
 *     <TimeWidget time={timeDisplay} />
 *   </>
 * );
 * ```
 */
export function useHudDisplay(
  hp: number,
  maxHp: number,
  hunger: number,
  maxHunger: number,
  energy: number,
  maxEnergy: number,
  gameTime: GameTimeState,
  weather: WeatherState
) {
  const healthStatus = useMemo((): HealthStatus => {
    const percentage = Math.round((hp / maxHp) * 100);
    const isLow = percentage <= 30;
    const isCritical = percentage <= 10;

    return {
      percentage,
      isLow,
      isCritical,
      label: isCritical ? 'Critical' : isLow ? 'Hurt' : 'Healthy',
    };
  }, [hp, maxHp]);

  const hungerStatus = useMemo((): HungerStatus => {
    const percentage = Math.round((hunger / maxHunger) * 100);
    const isHungry = percentage <= 30;
    const isStarving = percentage <= 10;

    return {
      percentage,
      isHungry,
      isStarving,
      label: isStarving ? 'Starving' : isHungry ? 'Hungry' : 'Satisfied',
    };
  }, [hunger, maxHunger]);

  const energyStatus = useMemo((): EnergyStatus => {
    const percentage = Math.round((energy / maxEnergy) * 100);
    const isTired = percentage <= 30;
    const isExhausted = percentage <= 10;

    return {
      percentage,
      isTired,
      isExhausted,
      label: isExhausted ? 'Exhausted' : isTired ? 'Tired' : 'Energized',
    };
  }, [energy, maxEnergy]);

  const timeDisplay = useMemo((): TimeDisplay => {
    const hour = gameTime.currentHour;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

    const seasonNames = {
      spring: 'Spring',
      summer: 'Summer',
      autumn: 'Autumn',
      winter: 'Winter',
    };

    return {
      hour: displayHour,
      period,
      day: gameTime.currentDay,
      season: seasonNames[gameTime.season],
      dayName: `Day ${gameTime.currentDay}`,
    };
  }, [gameTime]);

  const weatherDisplay = useMemo((): WeatherDisplay => {
    const conditionNames: Record<string, string> = {
      clear: 'Clear',
      cloudy: 'Cloudy',
      rainy: 'Rainy',
      snowy: 'Snowy',
    };

    const conditionIcons: Record<string, string> = {
      clear: '☀️',
      cloudy: '☁️',
      rainy: '🌧️',
      snowy: '❄️',
    };

    return {
      condition: conditionNames[weather.condition] || weather.condition,
      temperature: Math.round(weather.temperature),
      temperatureUnit: '°C',
      icon: conditionIcons[weather.condition] || '?',
    };
  }, [weather]);

  return {
    healthStatus,
    hungerStatus,
    energyStatus,
    timeDisplay,
    weatherDisplay,
  };
}
