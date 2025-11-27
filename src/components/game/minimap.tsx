/**
 * OVERVIEW: Minimap component renders a grid-based map visualization with pan animations.
 * Handles movement visualization, overlay flight animations, and interactive tile popovers.
 * Uses rAF for smooth GPU-accelerated pan animations synchronized with player movement.
 * TSDOC: Receives grid data, player position, biome definitions; emits moveStart/landing events.
 */

"use client";

import { cn } from "@/lib/utils";
import { PlayerIcon, NpcIcon, Home, MapPin } from "./icons";
import { useLanguage } from "@/context/language-context";
import { useSettings } from "@/context/settings-context";
import React, { useEffect, useCallback, memo } from "react";
import PlayerOverlay from './player-overlay';
import type { Chunk, Terrain, BiomeDefinition } from "@/lib/game/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { logger } from "@/lib/logger";
import { useState, useRef } from 'react';
import { MinimapCell } from "./minimap-cell";
import { MapCellDetails } from "./minimap-details";
import { biomeColors, type MinimapProps } from "./minimap-types";
import { cn as classNameUtils } from "@/lib/utils";

interface GameLayoutMinimapProps extends MinimapProps {
    // Extends MinimapProps with additional props if needed
}

export function Minimap({ grid, playerPosition, visualPlayerPosition, isAnimatingMove, visualMoveFrom, visualMoveTo, visualJustLanded, turn, biomeDefinitions }: GameLayoutMinimapProps) {
    const { t, language } = useLanguage();
    const { settings } = useSettings();

    // Track transient visibility of enemy HP bars keyed by chunk coordinate
    const [hpBarVisible, setHpBarVisible] = useState<Record<string, boolean>>({});
    const hpBaseMap = useRef<Record<string, number>>({}); // stores observed max HP for percent calculations
    const prevHpMap = useRef<Record<string, number>>({}); // stores last seen hp to detect changes

    // Get viewport size early so cell sizing can depend on it
    const viewportSize = (settings?.minimapViewportSize as 5 | 7 | 9) || 5;

    // Fixed container size (w-80 h-80 = 320px × 320px)
    // Cell size = containerSize / viewportSize (visible cells fill container)
    const cellSizePx = 320 / viewportSize;

    useEffect(() => {
        if (grid?.length > 0) {
            // Grid loaded
        }
    }, [grid, playerPosition, turn]);

    // Track the most recent moveStart detail so overlay callbacks can dispatch
    const lastOverlayDetailRef = useRef<any>(null);

    // rAF pan animation state (NOT React state to avoid re-render)
    const panAnimRef = useRef<{
        active: boolean;
        startTime: number | null;
        duration: number;
        fromX: number;
        fromY: number;
        toX: number;
        toY: number;
        rafId: number | null;
    }>({
        active: false,
        startTime: null,
        duration: 600,
        fromX: 0,
        fromY: 0,
        toX: 0,
        toY: 0,
        rafId: null,
    });

    const prevAnimatingRef = useRef<boolean>(Boolean(isAnimatingMove));
    const prevCenterRef = useRef<{ x: number; y: number } | null>(playerPosition);
    // Prevent double-triggering pan when we initiate it at animation start
    const panInProgressRef = useRef<boolean>(false);

    // Track keys of tiles that are currently fading in from unexplored -> explored
    const [fadingExplored, setFadingExplored] = useState<Record<string, boolean>>({});
    const prevExploredRef = useRef<Record<string, boolean>>({});
    const [externalFlyDuration, setExternalFlyDuration] = useState<number | null>(null);

    // Main rAF effect: cleanup any pending RAF/timeouts
    useEffect(() => {
        // Pan animation disabled - grid is frozen during moves, no pan needed
        return () => {
            // Cleanup: cancel any pending rAF or timeout
            if (panAnimRef.current.rafId) {
                cancelAnimationFrame(panAnimRef.current.rafId as any);
                panAnimRef.current.rafId = null;
            }
        };
    }, []);

    // Listen for moveStart events so we can begin panning immediately
    useEffect(() => {
        const onMoveStart = (ev: Event) => {
            try {
                const detail = (ev as CustomEvent).detail as any;
                try { console.debug('[minimap] moveStart received', detail); } catch { }
                if (!detail) return;
                const target = detail.to as { x: number; y: number } | undefined;
                if (!target) return;

                // adopt external fly duration for overlay + pan
                if (typeof detail.visualTotalMs === 'number') setExternalFlyDuration(detail.visualTotalMs);
                // remember detail for overlay callbacks
                lastOverlayDetailRef.current = detail;

                // NO PAN ANIMATION NEEDED: Grid is already frozen to visualMoveTo in game-layout.tsx
                // so the viewport doesn't need to move. Just dispatch completion event when overlay finishes.
                // This prevents viewport jumping.

                // Instead of pan animation, just wait for the animation duration and dispatch completion
                const animDuration = typeof detail.visualTotalMs === 'number' ? Number(detail.visualTotalMs) : 600;
                
                // Cancel previous timeout if any
                const pan = panAnimRef.current;
                if (pan.rafId) {
                    cancelAnimationFrame(pan.rafId);
                    pan.rafId = null;
                }

                // Schedule completion after animation duration
                const timeoutId = setTimeout(() => {
                    panInProgressRef.current = false;
                    try {
                        const detail = lastOverlayDetailRef.current;
                        if (detail?.to) {
                            prevCenterRef.current = { x: detail.to.x, y: detail.to.y };
                            const ev = new CustomEvent('minimapPanComplete', { detail: { center: detail.to, id: detail.id } });
                            try { console.info('[minimap] dispatch minimapPanComplete (after animation)', { center: detail.to, id: detail.id }); } catch { }
                            window.dispatchEvent(ev as any);
                        }
                    } catch { }
                }, animDuration);

                // Store timeout ID for cleanup
                pan.rafId = timeoutId as any;
                panInProgressRef.current = true;
            } catch { }
        };
        window.addEventListener('moveStart', onMoveStart as EventListener);
        return () => window.removeEventListener('moveStart', onMoveStart as EventListener);
    }, []);

    // Watch for newly explored tiles and trigger a fade-in
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
                        newFlags[key] = true;
                    }
                    prevExploredRef.current[key] = !!cell.explored;
                }
            }
            if (Object.keys(newFlags).length > 0) {
                setFadingExplored(prev => ({ ...prev, ...newFlags }));
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
                <div className="grid border-l border-t border-dashed border-border/50 bg-black/20 rounded-md shadow-inner overflow-visible" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                    {Array.from({ length: 49 }).map((_, i) => (
                        <div key={i} className={cn("bg-map-empty border-r border-b border-dashed border-border/50")} style={{ width: cellSizePx, height: cellSizePx }} />
                    ))}
                </div>
            </div>
        )
    }

    // Calculate viewport clipping
    const viewportRadius = Math.floor(viewportSize / 2);
    const gridSize = grid.length;
    const gridCenter = Math.floor(gridSize / 2);

    // Function to check if tile is visible in viewport
    const isViewportVisible = (rowIdx: number, colIdx: number): boolean => {
        const distFromCenter = Math.max(
            Math.abs(rowIdx - gridCenter),
            Math.abs(colIdx - gridCenter)
        );
        return distFromCenter <= viewportRadius;
    };

    // compute overlay flight geometry
    const overlayData = (() => {
        if (!visualMoveFrom || !visualMoveTo || !isAnimatingMove) return null;
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
            <div className="relative w-80 h-80">
                {/* Grid container (relative to contain overlay) */}
                <div
                    data-minimap-container
                    className={cn(
                        "absolute inset-0 grid border-l border-t border-dashed border-border/50 bg-black/20 rounded-md shadow-inner overflow-hidden",
                        "map-pan-anim"
                    )}
                    style={{
                        gridTemplateColumns: `repeat(${grid?.length || 7}, 1fr)`,
                        gridTemplateRows: `repeat(${grid?.length || 7}, 1fr)`,
                        gap: '0px',
                        ['--pan-x' as any]: '0px',
                        ['--pan-y' as any]: '0px',
                    }}
                >
                    {grid.map((row, rowIndex) =>
                        row.map((cell, colIndex) => {
                            const key = `${rowIndex}-${colIndex}`;
                            const isVisible = isViewportVisible(rowIndex, colIndex);
                            const refPos = (() => {
                                if (isAnimatingMove) {
                                    if (visualMoveTo) return visualMoveTo;
                                    if (visualPlayerPosition) return visualPlayerPosition;
                                }
                                return playerPosition;
                            })();
                            const playerToShow = refPos;
                            const isPlayerHere = playerToShow.x === cell?.x && playerToShow.y === cell?.y;
                            const turnDifference = cell ? turn - cell.lastVisited : 0;
                            const distanceFromPlayer = cell ? Math.max(
                                Math.abs(cell.x - refPos.x),
                                Math.abs(cell.y - refPos.y)
                            ) : 999;
                            const isInVisibleRange = distanceFromPlayer <= 1;
                            const isFoggy = turnDifference > 25 && cell && cell.lastVisited !== 0;

                            return (
                                <MinimapCell
                                    key={key}
                                    cell={cell}
                                    rowIndex={rowIndex}
                                    colIndex={colIndex}
                                    cellSizePx={cellSizePx}
                                    isVisible={isVisible}
                                    isPlayerHere={isPlayerHere}
                                    isInVisibleRange={isInVisibleRange}
                                    isFoggy={isFoggy}
                                    turn={turn}
                                    biomeDefinitions={biomeDefinitions}
                                    fadingExplored={fadingExplored}
                                    hpBarVisible={hpBarVisible}
                                    hpBaseMap={hpBaseMap}
                                    language={language}
                                    t={t}
                                    customItemDefinitions={undefined}
                                    isAnimatingMove={isAnimatingMove}
                                />
                            );
                        })
                    )}
                </div>
                {/* PlayerOverlay positioned absolutely above grid with high z-index */}
                {overlayData ? (
                    <PlayerOverlay
                        overlayData={overlayData}
                        autoPlay={true}
                        usePortal={false}
                        onLanding={() => {
                            try {
                                const d = lastOverlayDetailRef.current;
                                if (!d) return;
                                const ev = new CustomEvent('playerOverlayLanding', { detail: { center: d.to, id: d.id } });
                                window.dispatchEvent(ev as any);
                            } catch { }
                        }}
                        onFinished={() => {
                            try {
                                const d = lastOverlayDetailRef.current;
                                const ev = new CustomEvent('moveAnimationsFinished', { detail: { center: d?.to, id: d?.id } });
                                window.dispatchEvent(ev as any);
                            } catch { }
                        }}
                    />
                ) : null}
            </div>
        </div>
    );
}

// Memoize with custom comparison: only rerender if grid, player position, or animation state changes
// Ignore biomeDefinitions object changes since it's stable
export const MinimapMemoized = memo(Minimap, (prevProps, nextProps) => {
    // Return true if props are equal (don't rerender), false if different (rerender)
    return (
        prevProps.grid === nextProps.grid &&
        prevProps.playerPosition === nextProps.playerPosition &&
        prevProps.visualPlayerPosition === nextProps.visualPlayerPosition &&
        prevProps.isAnimatingMove === nextProps.isAnimatingMove &&
        prevProps.visualMoveFrom === nextProps.visualMoveFrom &&
        prevProps.visualMoveTo === nextProps.visualMoveTo &&
        prevProps.visualJustLanded === nextProps.visualJustLanded &&
        prevProps.turn === nextProps.turn
    );
});
