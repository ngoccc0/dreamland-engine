
"use client";

import { cn } from "@/lib/utils";
import { PlayerIcon, NpcIcon, Home, MapPin } from "./icons";
import { useLanguage } from "@/context/language-context";
import React, { useEffect } from "react";
import PlayerOverlay from './player-overlay';
import type { Chunk, Terrain, BiomeDefinition } from "@/lib/game/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "../ui/separator";
import { SwordIcon } from "./icons";
import { Backpack } from "lucide-react";
import { getTranslatedText } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { resolveItemDef } from '@/lib/game/item-utils';
import { IconRenderer } from "@/components/ui/icon-renderer";
import ProgressBar from '@/components/ui/ProgressBar';
import { useState, useRef } from 'react';


export const MapCellDetails = ({ chunk, itemDefinitions }: { chunk: Chunk; itemDefinitions?: Record<string, any> }) => {
    const { t, language } = useLanguage();
    const pickIcon = (definition: any, item: any) => {
        // Prefer image objects when available
        if (definition?.emoji && typeof definition.emoji === 'object' && definition.emoji.type === 'image') return definition.emoji;
        if (definition && (definition as any).image) return (definition as any).image;
        if (item?.emoji && typeof item.emoji === 'object' && item.emoji.type === 'image') return item.emoji;
        return definition?.emoji ?? item?.emoji ?? '❓';
    };
    return (
        <div className="p-1 space-y-2">
            <div className="flex items-center gap-2">
                 <MapPin className="h-4 w-4 text-muted-foreground" />
                 <h4 className="font-bold capitalize">{chunk.terrain === 'wall' ? t('wall') : t(chunk.terrain as any)} ({chunk.x}, {chunk.y})</h4>
            </div>
            <p className="text-xs text-muted-foreground italic line-clamp-3">{chunk.description}</p>
            
            {(chunk.structures && chunk.structures.length > 0 || chunk.items.length > 0 || chunk.enemy || chunk.NPCs.length > 0) && <Separator />}

            <div className="space-y-2 mt-2">
                {chunk.structures && chunk.structures.length > 0 && (
                    <div>
                        <h5 className="font-semibold text-xs flex items-center gap-1.5 mb-1"><Home />{t('structures')}:</h5>
                        <ul className="space-y-1 text-xs pl-5">
                           {chunk.structures.map((s, idx) => {
                                const structData = (s as any).data || s;
                                // Use index as key here to avoid relying on language-specific strings for React keys
                                return <li key={idx} className="flex items-center gap-1"><IconRenderer icon={structData.emoji} size={16} /> {getTranslatedText(structData.name, language, t)}</li>
                            })}
                        </ul>
                    </div>
                )}
                {chunk.items.length > 0 && (
                    <div>
                        <h5 className="font-semibold text-xs flex items-center gap-1.5 mb-1"><Backpack />{t('inventory')}:</h5>
                        <ul className="space-y-1 text-xs pl-5">
                            {chunk.items.map((item, idx) => {
                                const definition = itemDefinitions ? resolveItemDef(getTranslatedText(item.name, 'en'), itemDefinitions) : null;
                                const emoji = pickIcon(definition, item);
                                return <li key={idx} className="flex items-center gap-1"><IconRenderer icon={emoji} size={16} /> {getTranslatedText(item.name, language, t)} (x{item.quantity})</li>;
                            })}
                        </ul>
                    </div>
                )}
                {chunk.enemy && (
                    <div>
                        <h5 className="font-semibold text-xs flex items-center gap-1.5 mb-1"><SwordIcon />{t('enemy')}:</h5>
                        <p className="text-xs pl-5 flex items-center gap-1"><IconRenderer icon={chunk.enemy.emoji} size={16} /> {chunk.enemy.type ? getTranslatedText(chunk.enemy.type, language, t) : t('no_enemy_found')} (HP: {chunk.enemy.hp})</p>
                    </div>
                )}
                {chunk.NPCs.length > 0 && (
                     <div>
                        <h5 className="font-semibold text-xs flex items-center gap-1.5 mb-1"><NpcIcon />{t('npcs')}:</h5>
                        <ul className="space-y-1 text-xs pl-5">
                            {chunk.NPCs.map((npc, idx) => <li key={idx}>{getTranslatedText(npc.name, language, t)}</li>)}
                        </ul>
                    </div>
                )}
            </div>
            
        </div>
    );
};


interface MinimapProps {
    grid: (Chunk | null)[][];
    // authoritative player position (game state)
    playerPosition: { x: number; y: number };
    // visual position used while animating move (optional)
    visualPlayerPosition?: { x: number; y: number } | null;
    // whether a visual move animation is active
    isAnimatingMove?: boolean;
    // visual flight endpoints for overlay animation
    visualMoveFrom?: { x: number; y: number } | null;
    visualMoveTo?: { x: number; y: number } | null;
    // toggles briefly after landing so UI can play a small bounce
    visualJustLanded?: boolean;
    turn: number;
    biomeDefinitions: Record<string, BiomeDefinition>;
}

const biomeColors: Record<Terrain | 'empty', string> = {
  forest: "bg-map-forest",
  grassland: "bg-map-grassland",
  desert: "bg-map-desert",
  swamp: "bg-map-swamp",
  mountain: "bg-map-mountain",
  cave: "bg-map-cave",
  jungle: "bg-map-jungle",
  volcanic: "bg-map-volcanic",
  floptropica: "bg-map-floptropica",
  wall: "bg-map-wall",
  tundra: "bg-map-tundra",
  beach: "bg-map-beach",
  mesa: "bg-map-mesa",
  mushroom_forest: "bg-map-mushroom_forest",
  ocean: "bg-map-ocean",
  city: "bg-map-city",
  space_station: "bg-map-space_station",
  underwater: "bg-map-underwater",
  empty: "bg-map-empty",
};




export function Minimap({ grid, playerPosition, visualPlayerPosition, isAnimatingMove, visualMoveFrom, visualMoveTo, visualJustLanded, turn, biomeDefinitions }: MinimapProps) {
    const { t, language } = useLanguage();
    // Track transient visibility of enemy HP bars keyed by chunk coordinate
    const [hpBarVisible, setHpBarVisible] = useState<Record<string, boolean>>({});
    const hpBaseMap = useRef<Record<string, number>>({}); // stores observed max HP for percent calculations
    const prevHpMap = useRef<Record<string, number>>({}); // stores last seen hp to detect changes
    const hideTimers = useRef<Record<string, ReturnType<typeof setTimeout> | undefined>>({});
    // Use clamp() so cell sizes scale up on mobile and scale down on smaller viewports and the full map can fit without panning
    const responsiveCellSize = "w-[clamp(48px,12vw,64px)] h-[clamp(48px,12vw,64px)]";

  useEffect(() => {
    if (grid?.length > 0) {
    }
  }, [grid, playerPosition, turn]);

    // Track the most recent moveStart detail so overlay callbacks can dispatch
    // landing/finished events that include the move id and target center.
    const lastOverlayDetailRef = useRef<any>(null);
    // Pan animation vars: triggered when recenter happens after landing to make
    // the map's repositioning visually perceptible.
    const [panVars, setPanVars] = useState<{ x: string; y: string; active: boolean; duration?: number }>({ x: '0px', y: '0px', active: false, duration: 520 });
    const prevAnimatingRef = useRef<boolean>(Boolean(isAnimatingMove));
    const prevCenterRef = useRef<{ x: number; y: number } | null>(null);
    const panTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Prevent double-triggering pan when we initiate it at animation start
    const panInProgressRef = useRef<boolean>(false);
    // Track keys of tiles that are currently fading in from unexplored -> explored
    const [fadingExplored, setFadingExplored] = useState<Record<string, boolean>>({});
    const prevExploredRef = useRef<Record<string, boolean>>({});
    const [externalFlyDuration, setExternalFlyDuration] = useState<number | null>(null);

    // PlayerOverlay now owns the lift->fly->land->bounce timing. Minimap only
    // computes geometry and supplies overlayData; PlayerOverlay will emit
    // landing/finished events that the orchestrator listens to.

    // Listen for moveStart events so we can begin panning immediately in sync
    // with the avatar animation. moveStart.detail should contain { id, from, to, visualTotalMs }.
    useEffect(() => {
        const onMoveStart = (ev: Event) => {
            try {
                const detail = (ev as CustomEvent).detail as any;
                if (!detail) return;
                const target = detail.to as { x: number; y: number } | undefined;
                if (!target) return;
                // adopt external fly duration for overlay + pan
                if (typeof detail.visualTotalMs === 'number') setExternalFlyDuration(detail.visualTotalMs);
                // remember detail for overlay callbacks (landing/finished)
                lastOverlayDetailRef.current = detail;
                // trigger pan immediately
                const currentCenter = (() => {
                    if (isAnimatingMove) {
                        if (visualMoveTo) return visualMoveTo;
                        if (visualPlayerPosition) return visualPlayerPosition;
                    }
                    return playerPosition;
                })();
                const prev = prevCenterRef.current || currentCenter;
                const dx = target.x - prev.x;
                const dy = target.y - prev.y;
                if (dx === 0 && dy === 0) return;
                const perTilePx = 6;
                const panX = `${dx * perTilePx}px`;
                const panY = `${-dy * perTilePx}px`;
                // start pan
                setPanVars(p => ({ ...p, active: false }));
                setTimeout(() => {
                    panInProgressRef.current = true;
                    // pan should be slightly slower than the visual flight for smoothness
                    // make pan slightly slower than the visual flight so camera finishes after avatar
                    const panDuration = typeof detail.visualTotalMs === 'number' ? Number(detail.visualTotalMs) + 120 : 600;
                    setPanVars({ x: panX, y: panY, active: true, duration: panDuration });
                    if (panTimer.current) clearTimeout(panTimer.current as any);
                    panTimer.current = setTimeout(() => {
                        setPanVars(p => ({ ...p, active: false }));
                        panInProgressRef.current = false;
                        try {
                            const ev2 = new CustomEvent('minimapPanComplete', { detail: { center: target, id: detail.id } });
                            window.dispatchEvent(ev2 as any);
                        } catch {
                            // ignore
                        }
                    }, panDuration);
                }, 20);
            } catch {}
        };
        window.addEventListener('moveStart', onMoveStart as EventListener);
        return () => window.removeEventListener('moveStart', onMoveStart as EventListener);
    }, [isAnimatingMove, visualMoveTo, visualPlayerPosition, playerPosition]);

    // Trigger a subtle pan animation when recentering occurs after the visual
    // animation finishes so the viewport movement is more noticeable.
    useEffect(() => {
        try {
            // Prefer the visual destination (`visualMoveTo`) when available during
            // an animation; fall back to `visualPlayerPosition` then authoritative.
            const currentCenter = (() => {
                if (isAnimatingMove) {
                    if (visualMoveTo) return visualMoveTo;
                    if (visualPlayerPosition) return visualPlayerPosition;
                }
                return playerPosition;
            })();
            if (!prevCenterRef.current) prevCenterRef.current = currentCenter;

            // No per-frame logging here; the move sequence emits a single
            // consolidated start/end record to avoid timing perturbations.

            // If we just transitioned from animating -> not animating, and the
            // visible center changed, trigger pan. Historically we waited until
            // the landing/bounce finished before panning; to make the UI feel
            // more immediate we also allow starting the pan when an animation
            // begins so minimap moves in parallel with the avatar. Use
            // panInProgressRef to avoid double-triggering.
            if ((prevAnimatingRef.current && !isAnimatingMove && !visualJustLanded) || (isAnimatingMove && visualMoveTo && !panInProgressRef.current)) {
                const prev = prevCenterRef.current || currentCenter;
                const targetCenter = isAnimatingMove && visualMoveTo ? visualMoveTo : currentCenter;
                const dx = targetCenter.x - prev.x;
                const dy = targetCenter.y - prev.y;
                if (dx !== 0 || dy !== 0) {
                    // Use a smaller per-tile offset to avoid over-sliding; reduces perceived "overscroll".
                    const perTilePx = 6; // reduced from 12 to 6
                    const panX = `${dx * perTilePx}px`;
                    const panY = `${-dy * perTilePx}px`;
                    // Force a restart of the animation by briefly toggling active=false
                    setPanVars(p => ({ ...p, active: false }));
                    // small timeout ensures DOM sees the class removal before re-adding
                    setTimeout(() => {
                        // pan should be slightly slower than flight for smoother camera
                        // make pan slightly slower than the visual flight so camera finishes after avatar
                        const panDuration = externalFlyDuration ? externalFlyDuration + 120 : 600;
                        setPanVars({ x: panX, y: panY, active: true, duration: panDuration });
                        if (panTimer.current) clearTimeout(panTimer.current as any);
                        // After the visual pan completes, dispatch a cross-window event
                        // so other systems (e.g., the move orchestrator) can apply
                        // the authoritative center in sync with the pan finishing.
                        panTimer.current = setTimeout(() => {
                            setPanVars(p => ({ ...p, active: false }));
                            panInProgressRef.current = false;
                            try {
                                const ev = new CustomEvent('minimapPanComplete', { detail: { center: targetCenter } });
                                window.dispatchEvent(ev as any);
                            } catch {
                                // ignore
                            }
                        }, panDuration) as any;
                    }, 20);
                }
            }

            prevAnimatingRef.current = Boolean(isAnimatingMove);
            prevCenterRef.current = currentCenter;
        } catch {
            // ignore
        }
    }, [isAnimatingMove, visualPlayerPosition, playerPosition]);

    // Watch for newly explored tiles and trigger a fade-in when they transition
    useEffect(() => {
        try {
            const newFlags: Record<string, boolean> = {};
            for (let r = 0; r < grid.length; r++) {
                for (let c = 0; c < grid[r].length; c++) {
                    const cell = grid[r][c];
                    if (!cell) continue;
                    const key = `${cell.x},${cell.y}`;
                    const prev = prevExploredRef.current[key] || false;
                    if (!prev && cell.explored) {
                        // newly explored — always fade in (not only during move animations)
                        newFlags[key] = true;
                    }
                    prevExploredRef.current[key] = !!cell.explored;
                }
            }
            if (Object.keys(newFlags).length > 0) {
                setFadingExplored(prev => ({ ...prev, ...newFlags }));
                // clear flags after 500ms
                const id = setTimeout(() => {
                    setFadingExplored(prev => {
                        const copy = { ...prev };
                        Object.keys(newFlags).forEach(k => delete copy[k]);
                        return copy;
                    });
                }, 500);
                return () => clearTimeout(id);
            }
        } catch {
            // ignore
        }
    }, [grid, isAnimatingMove]);


  if (!grid || grid.length === 0) {
    logger.warn("[MINIMAP] No map data provided.");
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="grid grid-cols-5 border-l border-t border-dashed border-border/50 bg-black/20 rounded-md shadow-inner overflow-visible">
          {Array.from({ length: 25 }).map((_, i) => (
             <div key={i} className={cn(responsiveCellSize, "bg-map-empty border-r border-b border-dashed border-border/50")} />
          ))}
        </div>
      </div>
    )
  }

    // compute overlay flight geometry (grid-relative percentages)
    const overlayData = (() => {
        if (!visualMoveFrom || !visualMoveTo || !isAnimatingMove) return null;
        // find source/target indices in the shown grid
        let fromRow = -1, fromCol = -1, toRow = -1, toCol = -1;
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[r].length; c++) {
                const cell = grid[r][c];
                if (!cell) continue;
                if (cell.x === visualMoveFrom.x && cell.y === visualMoveFrom.y) { fromRow = r; fromCol = c; }
                if (cell.x === visualMoveTo.x && cell.y === visualMoveTo.y) { toRow = r; toCol = c; }
            }
        }
        if (fromRow === -1 || fromCol === -1 || toRow === -1 || toCol === -1) return null;
        const size = grid.length || 5;
        const cellPct = 100 / size;
        const left = `${fromCol * cellPct}%`;
        const top = `${fromRow * cellPct}%`;
        const width = `${cellPct}%`;
        const height = `${cellPct}%`;
        const dx = (toCol - fromCol) * 100;
        const dy = (toRow - fromRow) * 100;
        const flyDurationMs = externalFlyDuration ?? 500;
        return { left, top, width, height, dx, dy, flyDurationMs };
    })();

    return (
        <div className="flex flex-col items-center gap-2">
        <div
            className={cn(
                "relative grid grid-cols-5 border-l border-t border-dashed border-border/50 bg-black/20 rounded-md shadow-inner overflow-visible",
                panVars.active ? 'map-pan-anim' : ''
            )}
            style={{ ['--pan-x' as any]: panVars.x, ['--pan-y' as any]: panVars.y, ['--map-pan-duration' as any]: `${panVars.duration ?? 520}ms` }}
        >
        {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const key = `${rowIndex}-${colIndex}`;
              
                            if (!cell) {
                                return <div key={key} className={cn(responsiveCellSize, "bg-map-empty border-r border-b border-dashed border-border/50")} />;
                            }
              
                            // When a move animation is active the UI should prefer the visual position
                            // so the player icon and cell highlight follow the animated avatar until landing.
                            // Use a single `refPos` so all visibility/distance calculations stay consistent
                            // with whatever center the UI is displaying (visual vs authoritative).
                            // Keep refPos consistent with the current center logic above.
                            const refPos = (() => {
                                if (isAnimatingMove) {
                                    if (visualMoveTo) return visualMoveTo;
                                    if (visualPlayerPosition) return visualPlayerPosition;
                                }
                                return playerPosition;
                            })();
                            const playerToShow = refPos;
                            const isPlayerHere = playerToShow.x === cell.x && playerToShow.y === cell.y;
                            const turnDifference = turn - cell.lastVisited;
                            // Calculate if the tile is within the 3x3 visibility radius using the same refPos
                            const distanceFromPlayer = Math.max(
                                Math.abs(cell.x - refPos.x),
                                Math.abs(cell.y - refPos.y)
                            );
                            const isInVisibleRange = distanceFromPlayer <= 1; // 1 tile radius for 3x3 area

              // Shorter fog of war timing (25 turns)
              const isFoggy = turnDifference > 25 && cell.lastVisited !== 0;

              // Unexplored tiles should still be rendered but with a fog effect
              if (!cell.explored) {
                return (
                    <Popover key={key}>
                        <PopoverTrigger asChild>
                            <div className={cn(
                                responsiveCellSize, 
                                "bg-map-empty/50 border-r border-b border-dashed border-border/50 flex items-center justify-center"
                            )}>
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
              
              // Tiles in fog of war show more detailed tooltips
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
                                responsiveCellSize, 
                                "bg-map-empty border-r border-b border-dashed border-border/50 flex items-center justify-center"
                            )}>
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
                                ? <IconRenderer icon={structData.emoji} size={28} className="text-3xl opacity-90 drop-shadow-lg" alt={getTranslatedText(structData.name, language, t)} />
                                : (biomeDef?.emoji ? <IconRenderer icon={biomeDef.emoji} size={28} className="text-3xl opacity-90 drop-shadow-lg" alt={getTranslatedText(cell.terrain as any, language, t)} /> : null);

                  return (
                 <Popover key={key}>
                    <PopoverTrigger asChild>
                        <div
                            className={cn(
                                    responsiveCellSize,
                                    "relative transition-all duration-300 flex items-center justify-center p-1 cursor-pointer hover:ring-2 hover:ring-white border-r border-b border-dashed border-border/50",
                                biomeColors[cell.terrain],
                                isPlayerHere && "ring-2 ring-white shadow-lg z-10"
                            )}
                            aria-label={`Map cell at ${cell.x}, ${cell.y}. Biome: ${cell.terrain}`}
                        >
                            {mainIcon}
                            
                                {isPlayerHere && (() => {
                                    // If the UI animation is running, hide the in-tile icon for
                                    // all phases except the landing/bounce phase where we want
                                    // to show the landed avatar at the destination tile only.
                                    // While any visual move is animating, do not render the
                                    // in-tile PlayerIcon at all (prevents duplicates at the
                                    // source or destination). The overlay owns the visual
                                    // during the entire sequence (lift -> flight -> land -> bounce).
                                    if (isAnimatingMove) return null;
                                    // Normal (not animating) render
                                    return (
                                        <div className={cn(
                                                "absolute inset-0 flex items-center justify-center fade-explored",
                                                fadingExplored[`${cell.x},${cell.y}`] && 'show'
                                            )}>
                                                <PlayerIcon />
                                            </div>
                                    );
                                })()}
                            
                            {cell.NPCs.length > 0 && (
                                <div className="absolute top-px right-px">
                                    <NpcIcon />
                                </div>
                            )}
                            
                            {cell.enemy && (() => {
                                const keyCoord = `${cell.x},${cell.y}`;
                                // initialize base/prev hp if missing
                                try {
                                    const curHp = Number(cell.enemy.hp ?? 0);
                                    if (prevHpMap.current[keyCoord] === undefined) {
                                        prevHpMap.current[keyCoord] = curHp;
                                        // set observed base (max) hp if not present
                                        if (!hpBaseMap.current[keyCoord]) hpBaseMap.current[keyCoord] = Math.max(1, curHp || 100);
                                    } else {
                                        // detect change
                                        const last = prevHpMap.current[keyCoord];
                                        if (last !== curHp) {
                                            // update previous
                                            prevHpMap.current[keyCoord] = curHp;
                                            // update observed base if hp increased above base
                                            if ((curHp || 0) > (hpBaseMap.current[keyCoord] || 0)) hpBaseMap.current[keyCoord] = curHp;
                                            // show HP bar for 2s
                                            setHpBarVisible(v => ({ ...v, [keyCoord]: true }));
                                            if (hideTimers.current[keyCoord]) clearTimeout(hideTimers.current[keyCoord] as any);
                                            hideTimers.current[keyCoord] = setTimeout(() => {
                                                setHpBarVisible(v => ({ ...v, [keyCoord]: false }));
                                                hideTimers.current[keyCoord] = undefined;
                                            }, 2000) as any;
                                        }
                                    }
                                } catch (e) {
                                    // ignore
                                }

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
                                    {/* Prefer item's emoji (which may be an image object) */}
                                    <IconRenderer icon={cell.items[0].emoji} size={20} />
                                </div>
                            )}
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <MapCellDetails chunk={cell} />
                    </PopoverContent>
                  </Popover>
              );
            })
        )}
        {/* Overlay: flying player (extracted to reusable component) */}
        {/* PlayerOverlay handles only rendering based on overlayData and props;
            Minimap still controls the overlay phases (lift/fly/bounce) and passes
            the current flags so the component remains reusable. */}
        {overlayData ? (
            <PlayerOverlay
                overlayData={overlayData}
                autoPlay={true}
                onLanding={() => {
                    try {
                        const d = lastOverlayDetailRef.current;
                        if (!d) return;
                        const ev = new CustomEvent('playerOverlayLanding', { detail: { center: d.to, id: d.id } });
                        window.dispatchEvent(ev as any);
                    } catch {}
                }}
                onFinished={() => {
                    try {
                        const d = lastOverlayDetailRef.current;
                        const ev = new CustomEvent('moveAnimationsFinished', { detail: { center: d?.to, id: d?.id } });
                        window.dispatchEvent(ev as any);
                    } catch {}
                }}
            />
        ) : null}
        </div>
    </div>
  );
}
