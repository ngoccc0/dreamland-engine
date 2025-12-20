/**
 * OVERVIEW: MinimapCell is a memoized component for rendering individual minimap tiles.
 * Handles all tile states: unexplored, fog-of-war, normal with structures/enemies/items.
 * Uses shallow prop comparison to skip re-renders when cell data hasn't changed.
 * TSDOC: Accepts tile data and visibility flags, returns a Popover-wrapped cell div.
 */

"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import type { Chunk, BiomeDefinition } from "@/lib/game/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getTranslatedText } from "@/lib/utils";
import { IconRenderer } from "@/components/ui/icon-renderer";
import ProgressBar from "@/components/ui/ProgressBar";
import { MapCellDetails } from "./minimap-details";
import { NpcIcon, PlayerIcon } from "../panels/icons";
import { biomeColors } from "./minimap-types";

interface MinimapCellProps {
    cell: Chunk | null;
    rowIndex: number;
    colIndex: number;
    cellSizePx: number;
    isVisible: boolean;
    isPlayerHere: boolean;
    isInVisibleRange: boolean;
    isFoggy: boolean;
    turn: number;
    biomeDefinitions: Record<string, BiomeDefinition>;
    fadingExplored: Record<string, boolean>;
    hpBarVisible: Record<string, boolean>;
    hpBaseMap: React.MutableRefObject<Record<string, number>>;
    language: string;
    t: (key: string | any, ...args: any[]) => string;
    customItemDefinitions?: Record<string, any>;
    isAnimatingMove?: boolean;
}

export const MinimapCell = React.memo<MinimapCellProps>(({
    cell,
    rowIndex,
    colIndex,
    cellSizePx,
    isVisible,
    isPlayerHere,
    isInVisibleRange,
    isFoggy,
    turn,
    biomeDefinitions,
    fadingExplored,
    hpBarVisible,
    hpBaseMap,
    language,
    t,
    customItemDefinitions,
    isAnimatingMove,
}) => {
    const key = `${rowIndex}-${colIndex}`;
    const hiddenClasses = !isVisible ? "opacity-0 pointer-events-none" : "";
    const hideTimers = useRef<Record<string, ReturnType<typeof setTimeout> | undefined>>({});

    if (!cell) {
        return <div key={key} className={cn("bg-map-empty border-r border-b border-dashed border-border/50", hiddenClasses)} style={{ width: cellSizePx, height: cellSizePx }} />;
    }

    // Unexplored tiles
    if (!cell.explored) {
        return (
            <Popover key={key}>
                <PopoverTrigger asChild>
                    <div className={cn(
                        "bg-map-empty/50 border-r border-b border-dashed border-border/50 flex items-center justify-center",
                        hiddenClasses
                    )} style={{ width: cellSizePx, height: cellSizePx }}>
                        <span className="text-2xl opacity-20" title={t('unexploredArea') as string}>🌫️</span>
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                    <div className="p-2 text-sm text-muted-foreground">
                        {t('unexploredAreaDesc')}
                    </div>
                </PopoverContent>
            </Popover>
        );
    }

    // Fog of war
    if (isFoggy && !isInVisibleRange) {
        const tooltipMessages = [
            { vi: "Đã lâu bạn không đến đây, mọi thứ dường như đã thay đổi...", en: "It's been a while since you've been here, things might have changed..." },
            { vi: "Thời gian trôi qua khiến ký ức về nơi này trở nên mờ nhạt.", en: "Time has made your memories of this place fade." },
            { vi: "Sương mù dày đặc khiến bạn không thể nhớ rõ nơi này có gì.", en: "The thick fog makes it hard to remember what's here." }
        ];
        const randomMessage = tooltipMessages[Math.floor(Math.random() * tooltipMessages.length)];

        return (
            <Popover key={key}>
                <PopoverTrigger asChild>
                    <div className={cn(
                        "bg-map-empty border-r border-b border-dashed border-border/50 flex items-center justify-center",
                        hiddenClasses
                    )} style={{ width: cellSizePx, height: cellSizePx }}>
                        <span className="text-2xl opacity-30" title={t('fogOfWarDesc') as string}>🌫️</span>
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                    <div className="p-2 space-y-2">
                        <p className="text-sm text-muted-foreground">{language === 'vi' ? randomMessage.vi : randomMessage.en}</p>
                        {cell.terrain && (
                            <p className="text-xs text-muted-foreground/70">
                                {t('lastKnownTerrain')}: {t(cell.terrain as any)}
                            </p>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        );
    }

    // Normal explored cell
    const firstStructure = cell.structures && cell.structures.length > 0 ? (cell.structures[0] as any) : null;
    const structData = firstStructure?.data || firstStructure;

    const lookupBiomeDef = (terrain: string | undefined) => {
        if (!terrain) return undefined;
        if (!biomeDefinitions) return undefined;
        if (biomeDefinitions[terrain]) return biomeDefinitions[terrain];
        const keyLower = String(terrain).toLowerCase();
        if (biomeDefinitions[keyLower]) return biomeDefinitions[keyLower];
        const underscored = keyLower.replace(/\s+/g, '_');
        if (biomeDefinitions[underscored]) return biomeDefinitions[underscored];
        return undefined;
    };

    const biomeDef = lookupBiomeDef(cell.terrain as string);
    const mainIcon = structData
        ? <IconRenderer icon={structData.emoji} size={28} className="text-3xl opacity-90 drop-shadow-lg" alt={getTranslatedText(structData.name, language as any, t)} />
        : (biomeDef?.emoji ? <IconRenderer icon={biomeDef.emoji} size={28} className="text-3xl opacity-90 drop-shadow-lg" alt={getTranslatedText(cell.terrain as any, language as any, t)} /> : null);

    return (
        <Popover key={key}>
            <PopoverTrigger asChild>
                <div
                    className={cn(
                        "relative transition-all duration-300 flex items-center justify-center p-1 cursor-pointer hover:ring-2 hover:ring-white border-r border-b border-dashed border-border/50",
                        biomeColors[cell.terrain],
                        isPlayerHere && "ring-2 ring-white shadow-lg z-10",
                        hiddenClasses
                    )}
                    style={{ width: cellSizePx, height: cellSizePx }}
                    aria-label={`Map cell at ${cell.x}, ${cell.y}. Biome: ${cell.terrain}`}
                >
                    {mainIcon}

                    {isPlayerHere && !isAnimatingMove && (
                        <div className={cn(
                            "absolute inset-0 flex items-center justify-center fade-explored",
                            fadingExplored[`${cell.x},${cell.y}`] && 'show'
                        )}>
                            <PlayerIcon />
                        </div>
                    )}

                    {cell.NPCs.length > 0 && (
                        <div className="absolute top-px right-px">
                            <NpcIcon />
                        </div>
                    )}

                    {cell.enemy && (() => {
                        const keyCoord = `${cell.x},${cell.y}`;
                        const showHp = Boolean(hpBarVisible[`${cell.x},${cell.y}`]);
                        const maxHp = hpBaseMap.current[`${cell.x},${cell.y}`] ?? (Number(cell.enemy.hp) > 0 ? Number(cell.enemy.hp) : 100);
                        return (
                            <div className="absolute bottom-px left-px flex items-end" style={{ gap: 6 }}>
                                <div style={{ transform: 'translateY(-22px)' }}>
                                    {showHp ? <ProgressBar value={Number(cell.enemy.hp ?? 0)} max={maxHp} width={140} height={18} ariaLabel="Enemy health" /> : null}
                                </div>
                                <div>
                                    <IconRenderer icon={cell.enemy.emoji} size={20} />
                                </div>
                            </div>
                        );
                    })()}

                    {cell.items.length > 0 && (
                        <div className="absolute bottom-px right-px">
                            <IconRenderer icon={cell.items[0].emoji} size={20} />
                        </div>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <MapCellDetails chunk={cell} itemDefinitions={customItemDefinitions} />
            </PopoverContent>
        </Popover>
    );
}, (prev, next) => {
    // Custom shallow equality: re-render only when relevant props change
    return (
        prev.cell === next.cell &&
        prev.isPlayerHere === next.isPlayerHere &&
        prev.isVisible === next.isVisible &&
        prev.isFoggy === next.isFoggy &&
        prev.turn === next.turn &&
        prev.cellSizePx === next.cellSizePx &&
        prev.isInVisibleRange === next.isInVisibleRange &&
        prev.language === next.language &&
        prev.isAnimatingMove === next.isAnimatingMove
    );
});

MinimapCell.displayName = 'MinimapCell';
