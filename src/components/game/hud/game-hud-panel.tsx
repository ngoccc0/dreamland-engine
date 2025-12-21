/**
 * OVERVIEW: HUD panel displaying player stats icons and the game clock widget.
 * 
 * Extracted from GameLayout to improve readability and modularize HUD logic.
 * Displays: Health, Mana, Stamina, Hunger, Temperature stats + analog clock
 * Located: Right sidebar of game layout (vertical stat display + clock)
 * 
 * Clock widget shows:
 * - Rotating clock face (0-1440 min = 0-360°)
 * - Sun indicator at top during day (360-1080 min)
 * - Moon indicator at top during night
 * - Fixed pointer at 12 o'clock position
 */

"use client";

import React, { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import HudIconHealth from "./hud-icon-health";
import HudIconMana from "./hud-icon-mana";
import HudIconStamina from "./hud-icon-stamina";
import HudIconHunger from "./hud-icon-hunger";
import HudIconTemperature, { getWeatherEmoji } from "./hud-icon-temperature";
import GameClockWidget from "./game-clock-widget";
import { cn } from "@/lib/utils";
import { getTranslatedText } from "@/lib/utils";
import type { PlayerStatusDefinition } from "@/lib/game/types";
import type { TranslationKey } from "@/lib/i18n";

interface GameHudPanelProps {
    /** Player stats (HP, mana, stamina, hunger, temp, etc.) */
    playerStats: PlayerStatusDefinition;

    /** Current game time in minutes (0-1439) for clock rotation */
    gameTime: number;

    /** Current biome/weather for temperature display */
    weatherId?: string;

    /** Translated text function for UI labels */
    t: (key: TranslationKey, params?: any) => string;

    /** Language for text display ('en' or 'vi') */
    language: "en" | "vi";

    /** Callback to open/toggle status popup */
    onStatusToggle: () => void;

    /** Optional className for styling */
    className?: string;
}

/**
 * GameHudPanel renders player stats in a vertical layout with an analog clock.
 * 
 * Stats displayed:
 * - Health (HP) with color gradient
 * - Mana with wave effect
 * - Stamina with wave effect
 * - Hunger state
 * - Temperature (environment + body temp)
 * - Game clock with sun/moon indicators
 * 
 * @param playerStats - Player status object (HP, mana, stamina, hunger, etc.)
 * @param gameTime - Current game time in minutes (0-1439)
 * @param weatherId - Current weather/biome for temperature context
 * @param t - Translation function
 * @param language - Current language ('en' or 'vi')
 * @param onStatusToggle - Callback when status button clicked
 * @param className - Optional CSS classes
 * @returns JSX element rendering the HUD panel
 */
export function GameHudPanel({
    playerStats,
    gameTime,
    weatherId,
    t,
    language,
    onStatusToggle,
    className = "",
}: GameHudPanelProps) {
    // Stat value calculations with normalization
    const hpVal = Number(playerStats.hp ?? 0);
    const hpMax = Number(playerStats.maxHp ?? 100);
    const hpPct = hpMax > 0 ? hpVal / hpMax : 0;

    const manaVal = Number(playerStats.mana ?? 0);
    const manaMax = Number(playerStats.maxMana ?? 50);
    const manaPct = manaMax > 0 ? manaVal / manaMax : 0;

    const stamVal = Number(playerStats.stamina ?? 0);
    const stamMax = Number(playerStats.maxStamina ?? 100);
    const stamPct = stamMax > 0 ? stamVal / stamMax : 0;

    // Normalize hunger: can be fractional (0-1) or 0-100 scale
    const rawHunger = typeof playerStats.hunger === "number" ? playerStats.hunger : undefined;
    const hungerMax = Number(playerStats.maxHunger ?? 100);
    let hungerVal = 0;
    if (typeof rawHunger === "number") {
        if (rawHunger > 0 && rawHunger <= 1) {
            hungerVal = rawHunger * hungerMax;
        } else {
            hungerVal = rawHunger;
        }
    } else {
        hungerVal = hungerMax;
    }
    const hungerPct = hungerMax > 0 ? Math.max(0, Math.min(1, hungerVal / hungerMax)) : 0;

    // Color class based on percentage
    const statColorClass = (pct: number) =>
        pct <= 0.3 ? "text-destructive" : pct <= 0.6 ? "text-amber-500" : "text-foreground";

    // Weather emoji for context
    const weatherEmoji = getWeatherEmoji(weatherId);

    return (
        <div className={cn("flex flex-col gap-4 items-end", className)}>
            {/* Stats Grid - 5 rows for 5 stat types */}
            <div className="space-y-3">
                {/* Health (HP) */}
                <div className="flex flex-col items-end gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onStatusToggle}
                                className="text-xs text-foreground/70 hover:text-foreground"
                            >
                                {Math.round(hpVal)}/{hpMax}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>
                                {t("hudHealth") ?? "Health"}: {Math.round(hpVal)}/{hpMax}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                    <HudIconHealth size={48} />
                </div>

                {/* Mana */}
                <div className="flex flex-col items-end gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onStatusToggle}
                                className={`text-xs ${statColorClass(manaPct)}`}
                            >
                                {Math.round(manaVal)}/{manaMax}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>
                                {t("hudMana") ?? "Mana"}: {Math.round(manaVal)}/{manaMax}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                    <HudIconMana size={48} />
                </div>

                {/* Stamina */}
                <div className="flex flex-col items-end gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onStatusToggle}
                                className={`text-xs ${statColorClass(stamPct)}`}
                            >
                                {Math.round(stamVal)}/{stamMax}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>
                                {t("hudStamina") ?? "Stamina"}: {Math.round(stamVal)}/{stamMax}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                    <HudIconStamina size={48} />
                </div>

                {/* Hunger */}
                <div className="flex flex-col items-end gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onStatusToggle}
                                className={`text-xs mt-1 ${statColorClass(hungerPct)}`}
                            >
                                {Math.round(hungerVal)}/{hungerMax}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>
                                {t("hudHunger") ?? "Hunger"}: {Math.round(hungerVal)}/{hungerMax}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                    <HudIconHunger size={48} />
                </div>

                {/* Temperature (Environment + Body Temp) */}
                <div className="flex flex-col items-end gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onStatusToggle}
                                className="text-xs"
                            >
                                {weatherEmoji}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>
                                {t("hudTemperature") ?? "Temperature"}:{" "}
                                {Math.round(playerStats.bodyTemperature ?? 37)}°C
                            </p>
                        </TooltipContent>
                    </Tooltip>
                    <HudIconTemperature
                        temp={playerStats.bodyTemperature ?? 37}
                        maxTemp={50}
                        size={48}
                        weatherType={weatherId}
                        isBodyTemp={true}
                    />
                </div>
            </div>

            {/* Clock Widget - positioned below stats */}
            <div className="mt-6 pt-4 border-t">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="cursor-help">
                            <GameClockWidget size={76} />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t("gameTime") ?? "Game Time"}</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
}

export default GameHudPanel;
