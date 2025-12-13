"use client";

import React, { useRef, useCallback, useState } from "react";
import { MinimapMemoized as Minimap } from "@/components/game/minimap";
import { VisualEffectsLayer } from "@/components/game/visual-effects-layer";
import HudIconHealth from "@/components/game/hud-icon-health";
import HudIconStamina from "@/components/game/hud-icon-stamina";
import HudIconMana from "@/components/game/hud-icon-mana";
import HudIconHunger from "@/components/game/hud-icon-hunger";
import HudIconTemperature, { getWeatherEmoji } from "@/components/game/hud-icon-temperature";
import { GameClockWidget } from "@/components/game/game-clock-widget";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import type { GameLayoutHudProps } from "./game-layout.types";

/**
 * HUD and minimap panel (right on desktop, top on mobile).
 *
 * @remarks
 * Renders the minimap, stats grid (HP, Mana, Stamina, Hunger), weather info, and game clock.
 * On mobile, this panel is fixed at top with limited height to preserve narrative space.
 * The minimap uses flex-shrink-0 to prevent squishing when virtual keyboard appears.
 *
 * **Mobile:** Top panel (order-1), height-constrained, flex-shrink-0 on minimap
 * **Desktop:** Right panel (order-2), scrollable, full height
 *
 * @param props - Configuration with player stats, minimap grid, and settings
 * @returns React component rendering HUD and minimap
 */
export function GameLayoutHud({
    playerStats,
    currentChunk,
    gameTime,
    isDesktop,
    weatherZones,
    grid,
    playerPosition,
    visualPlayerPosition,
    isAnimatingMove,
    visualMoveFrom,
    visualMoveTo,
    visualJustLanded,
    turn,
    biomeDefinitions,
    settings,
    language: langProp,
    t: tProp,
    onMapSizeChange,
}: GameLayoutHudProps) {
    // Use hook for language/t if not provided in props
    const { language: contextLanguage, t: contextT } = useLanguage();
    const language = langProp || contextLanguage;
    const t = tProp || contextT;

    const minimapSizeNotificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [minimapSizeNotification, setMinimapSizeNotification] = useState<string>("");

    // Stat value calculations
    const hpVal = Number(playerStats.hp ?? 0);
    const hpMax = Number(playerStats.maxHp ?? 100);
    const hpPct = hpMax > 0 ? hpVal / hpMax : 0;

    const manaVal = Number(playerStats.mana ?? 0);
    const manaMax = Number(playerStats.maxMana ?? 50);
    const manaPct = manaMax > 0 ? manaVal / manaMax : 0;

    const stamVal = Number(playerStats.stamina ?? 0);
    const stamMax = Number(playerStats.maxStamina ?? 100);
    const stamPct = stamMax > 0 ? stamVal / stamMax : 0;

    const hungerMax = Number(playerStats.maxHunger ?? 100);
    let hungerVal = 0;
    const rawHunger = typeof playerStats.hunger === "number" ? playerStats.hunger : undefined;
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

    const statColorClass = (pct: number) =>
        pct <= 0.3 ? "text-destructive" : pct <= 0.6 ? "text-amber-500" : "text-foreground";

    const handleMapSizeChange = useCallback(() => {
        const currentSize = (settings?.minimapViewportSize as 5 | 7 | 9) || 5;
        const sizes: (5 | 7 | 9)[] = [5, 7, 9];
        const currentIndex = sizes.indexOf(currentSize);
        const nextIndex = (currentIndex + 1) % sizes.length;
        const newSize = sizes[nextIndex];
        onMapSizeChange(newSize);

        // Show notification
        if (minimapSizeNotificationTimeoutRef.current) {
            clearTimeout(minimapSizeNotificationTimeoutRef.current);
        }
        setMinimapSizeNotification(`${newSize}×${newSize}`);
        minimapSizeNotificationTimeoutRef.current = setTimeout(() => {
            setMinimapSizeNotification("");
        }, 1000);
    }, [settings?.minimapViewportSize, onMapSizeChange]);

    return (
        <aside
            className={cn(
                "bg-card/90 backdrop-blur-md border-border transition-all duration-300 z-10",
                // Desktop: Right column, scrollable, with borders
                isDesktop
                    ? "order-2 w-[min(462px,38vw)] h-full border-l overflow-y-auto pt-4 px-4 pb-4"
                    : // Mobile: Top row, height-constrained, flex-none to prevent shrinking
                    "order-1 w-full flex-none border-b shadow-sm max-h-[45vh] overflow-y-auto p-2"
            )}
        >
            <div className={cn("flex flex-col gap-3", !isDesktop && "p-2")}>
                {/* Mobile Header: World Name + Weather + Clock */}
                {!isDesktop && (
                    <div className="flex items-center justify-between w-full px-2">
                        <span className="font-bold text-sm truncate max-w-[150px]">
                            {currentChunk?.region?.name || "Unknown"}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{getWeatherEmoji(weatherZones?.[currentChunk?.regionId]?.currentWeather?.id)}</span>
                            <GameClockWidget gameTime={gameTime || 0} size={20} />
                        </div>
                    </div>
                )}

                {/* Minimap Container */}
                <div className="flex flex-col items-center gap-1 w-full mx-auto relative shrink-0">
                    {/* Minimap Title + Controls */}
                    <div className="w-full flex items-center justify-center mb-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-headline font-semibold text-foreground/80">
                                {t("minimap")}
                            </h3>
                        </div>
                    </div>

                    {/* Weather and Controls Row */}
                    <div className="flex flex-row items-center justify-center gap-1 w-full px-2">
                        {/* Weather Emoji */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="text-xl cursor-default">
                                    {getWeatherEmoji(weatherZones?.[currentChunk?.regionId]?.currentWeather?.id) ||
                                        "☀️"}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{weatherZones?.[currentChunk?.regionId]?.currentWeather?.id || "No weather"}</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* Environment Temperature */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center cursor-default">
                                    <HudIconTemperature
                                        temp={currentChunk?.temperature || 20}
                                        maxTemp={50}
                                        hideWeatherEmoji={true}
                                        size={32}
                                        showNumberBeside={true}
                                        isEnvTempColorIcon={true}
                                    />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t("environmentTempTooltip")}</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* Body Temperature */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center cursor-default">
                                    <HudIconTemperature
                                        temp={playerStats.bodyTemperature || 37}
                                        maxTemp={40}
                                        hideWeatherEmoji={true}
                                        size={32}
                                        isBodyTempColorIcon={true}
                                        showNumberBeside={true}
                                    />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t("bodyTempDesc")}</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* Game Clock */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex flex-col items-center cursor-default">
                                    <GameClockWidget gameTime={gameTime || 0} size={48} />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    Game Time: {String(Math.floor((gameTime || 0) / 60)).padStart(2, "0")}:
                                    {String((gameTime || 0) % 60).padStart(2, "0")}
                                </p>
                            </TooltipContent>
                        </Tooltip>

                        {/* Minimap Size Control */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    className="text-xl hover:opacity-80 transition-opacity cursor-pointer relative"
                                    onClick={handleMapSizeChange}
                                    title="Adjust minimap size"
                                >
                                    🔍
                                    {minimapSizeNotification && (
                                        <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-foreground text-background text-xs rounded px-2 py-1 whitespace-nowrap font-bold">
                                            {minimapSizeNotification}
                                        </span>
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Cycle minimap size</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {/* Minimap Render */}
                    <div className="w-full max-w-full md:max-w-xs relative z-[20] flex-shrink-0">
                        <VisualEffectsLayer
                            currentHp={Number(playerStats.hp ?? 0)}
                            maxHp={Number(playerStats.maxHp ?? 100)}
                            weather={weatherZones?.[currentChunk?.regionId]?.currentWeather?.id || "CLEAR"}
                            gameTime={gameTime}
                            activeEffects={playerStats?.activeEffects || []}
                        />
                        <Minimap
                            grid={grid}
                            playerPosition={playerPosition}
                            visualPlayerPosition={visualPlayerPosition}
                            isAnimatingMove={isAnimatingMove}
                            visualMoveFrom={visualMoveFrom}
                            visualMoveTo={visualMoveTo}
                            visualJustLanded={visualJustLanded}
                            turn={turn}
                            biomeDefinitions={biomeDefinitions}
                        />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-x-4 gap-y-2 text-sm justify-items-center">
                    {/* Health */}
                    <div className="flex flex-col items-center p-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <HudIconHealth
                                        percent={Math.max(0, Math.min(1, hpPct))}
                                        size={isDesktop ? 40 : 48}
                                    />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    {t("hudHealth") ?? "Health"}: {Math.round(playerStats.hp ?? 0)}/
                                    {playerStats.maxHp ?? 100}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                        <span className={`text-xs mt-1 ${statColorClass(hpPct)}`}>
                            {Math.round(hpVal)}/{hpMax}
                        </span>
                    </div>

                    {/* Mana */}
                    <div className="flex flex-col items-center p-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <HudIconMana
                                        percent={Math.max(0, Math.min(1, manaPct))}
                                        size={isDesktop ? 40 : 48}
                                    />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    {t("hudMana") ?? "Mana"}: {Math.round(playerStats.mana ?? 0)}/
                                    {playerStats.maxMana ?? 50}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                        <span className={`text-xs mt-1 ${statColorClass(manaPct)}`}>
                            {Math.round(manaVal)}/{manaMax}
                        </span>
                    </div>

                    {/* Stamina */}
                    <div className="flex flex-col items-center p-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <HudIconStamina
                                        percent={Math.max(0, Math.min(1, stamPct))}
                                        size={isDesktop ? 40 : 48}
                                    />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    {t("hudStamina") ?? "Stamina"}: {Math.round(playerStats.stamina ?? 0)}/
                                    {playerStats.maxStamina ?? 100}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                        <span className={`text-xs mt-1 ${statColorClass(stamPct)}`}>
                            {Math.round(stamVal)}/{stamMax}
                        </span>
                    </div>

                    {/* Hunger */}
                    <div className="flex flex-col items-center p-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={t("hudHunger") ?? "Hunger"}
                                    className="p-0"
                                >
                                    <HudIconHunger
                                        percent={Math.max(0, Math.min(1, hungerPct))}
                                        size={isDesktop ? 40 : 48}
                                    />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    {t("hudHunger") ?? "Hunger"}: {Math.round(playerStats.hunger ?? 0)}/
                                    {playerStats.maxHunger ?? 100}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                        <span className={`text-xs mt-1 ${statColorClass(hungerPct)}`}>
                            {Math.round(hungerVal)}/{hungerMax}
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
