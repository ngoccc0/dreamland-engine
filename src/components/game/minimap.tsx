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
import { biomeColors, type MinimapProps, VisibilityLevel } from "./minimap-types";
import { cn as classNameUtils } from "@/lib/utils";

interface GameLayoutMinimapProps extends MinimapProps {
    // Extends MinimapProps with additional props if needed
}

export function Minimap({ grid, playerPosition, visualPlayerPosition, isAnimatingMove, visualMoveFrom, visualMoveTo, visualJustLanded, turn, biomeDefinitions, playerStats, currentChunk }: GameLayoutMinimapProps) {
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
                // panAnimRef.current.rafId can store either rAF ID or setTimeout ID.
                // Depending on context, it was used to store setTimeout ID for pan completion.
                // We should attempt to clear both types of timers.
                // For a setTimeout ID, clearTimeout is needed.
                clearTimeout(panAnimRef.current.rafId as any);
                cancelAnimationFrame(panAnimRef.current.rafId as any); // Also clear if it was an rAF
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

                // Cancel previous timeout/animation if any
                const pan = panAnimRef.current;
                if (pan.rafId) {
                    clearTimeout(pan.rafId as any); // Clear timeout
                    cancelAnimationFrame(pan.rafId as any); // Clear animation frame
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

    // Get player's exploration ability and elevation for adaptive vision
    const playerExplorationAbility = playerStats.attributes?.exploration ?? 50; // Default to 50 if not set
    const playerElevation = currentChunk?.elevation ?? 0; // Default to 0 if not set

    const getCellVisibilityLevel = useCallback((
        cell: Chunk | null,
        playerX: number,
        playerY: number,
        currentPlayersElevation: number,
        currentPlayersExplorationAbility: number,
        baseViewportRadius: number,
        currentTurn: number
    ): VisibilityLevel => {
        if (!cell) {
            return VisibilityLevel.Obscured;
        }

        const distanceFromPlayer = Math.max(
            Math.abs(cell.x - playerX),
            Math.abs(cell.y - playerY)
        );

        // Constants for balancing vision (can be tuned)
        const EXPLORATION_FACTOR = 0.05; // Each point of exploration adds this much to radius
        const LIGHT_FACTOR = 0.01;     // Each point of light adds this much to radius
        const EXPLORABILITY_FACTOR = 0.01; // Each point of explorability adds this much to radius
        const ELEVATION_BONUS_FACTOR = 0.05; // Player higher: bonus per elevation difference
        const ELEVATION_PENALTY_FACTOR = 0.08; // Player lower: penalty per elevation difference
        const FOG_TURNS_THRESHOLD = 75; // How many turns before a visited cell becomes foggy (increased as per user feedback)

        // Calculate dynamic radius based on player attributes and cell properties
        let dynamicRadius = baseViewportRadius;

        // Apply adaptive bonuses/penalties to dynamicRadius.
        // These adaptive factors primarily influence the *initial discovery* and *full visibility range*
        // for UNEXPLORED cells, and also contribute to the overall "awareness" for explored cells.
        dynamicRadius += currentPlayersExplorationAbility * EXPLORATION_FACTOR;
        dynamicRadius += (cell.lightLevel || 0) * LIGHT_FACTOR;
        dynamicRadius += (cell.explorability || 0) * EXPLORABILITY_FACTOR;

        const elevationDifference = currentPlayersElevation - (cell.elevation || 0);
        if (elevationDifference > 0) { // Player is higher, looking downhill: bonus
            dynamicRadius += elevationDifference * ELEVATION_BONUS_FACTOR;
        } else if (elevationDifference < 0) { // Player is lower, looking uphill: penalty
            dynamicRadius += elevationDifference * ELEVATION_PENALTY_FACTOR;
        }

        // Determine current fog state based on last visited time, with increased threshold
        const isFoggyDueToTime = (currentTurn - cell.lastVisited) > FOG_TURNS_THRESHOLD && cell.lastVisited !== 0;

        // --- Visibility Logic ---

        // Prioritize ALREADY EXPLORED cells
        if (cell.explored) {
            if (!isFoggyDueToTime) {
                // Explored and not yet foggy: always fully visible (or at least partially based on proximity)
                // Even if far, explored cells should maintain some level of clarity.
                // If within a generous extended range, keep it fully visible.
                const exploredRetentionRadius = dynamicRadius * 2.5; // Explored cells retain clarity longer
                if (distanceFromPlayer <= exploredRetentionRadius) {
                    return VisibilityLevel.FullyVisible; // Explored cells are fully visible unless very foggy and very far
                }
                // If it's explored, but beyond the retention radius, and not yet foggy, it can be partially visible
                return VisibilityLevel.PartiallyVisible;
            } else {
                // If explored but now truly foggy (past FOG_TURNS_THRESHOLD)
                // it means we've forgotten details over time.
                return VisibilityLevel.PartiallyVisible; // Explored cells always retain at least partial visibility
            }
        }

        // For UNEXPLORED cells: apply adaptive discovery logic
        // This section only runs if cell.explored is FALSE.
        if (distanceFromPlayer <= dynamicRadius) {
            // Unexplored, but within dynamic adaptive range for FULL discovery.
            // Elevation also plays a key role here.
            if (Math.abs(elevationDifference) <= Math.max(1, dynamicRadius / 3) || (elevationDifference > 0 && distanceFromPlayer <= dynamicRadius + elevationDifference * 0.5)) {
                return VisibilityLevel.FullyVisible;
            }
        }

        const extendedDynamicRadius = dynamicRadius * 2.0; // Extended range for partial reveal of unexplored cells
        if (distanceFromPlayer <= extendedDynamicRadius) {
            // Unexplored, but within extended range for PARTIAL discovery.
            // Light, explorability, or favorable elevation helps in partial reveal.
            if ((cell.lightLevel || 0) > 40 || (cell.explorability || 0) > 30 || elevationDifference > 0) {
                return VisibilityLevel.PartiallyVisible;
            }
        }

        // Default to Obscured if not explored and not within any adaptive discovery range.
        return VisibilityLevel.Obscured;

    }, [playerExplorationAbility, playerElevation, viewportRadius, turn]); // dependencies for useCallback

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
                {/* Grid container - use CSS Grid for stable centering, not transform */}
                {/* CRITICAL: This prevents visual jump when viewport size (5x5 -> 7x7 -> 9x9) changes */}
                {/* Transform is reserved only for pan animations (GPU-accelerated, smooth) */}
                <div
                    data-minimap-container
                    className={cn(
                        "absolute inset-0 grid border-l border-t border-dashed border-border/50 bg-black/20 rounded-md shadow-inner overflow-hidden",
                        "map-pan-anim"
                    )}
                    style={{
                        display: 'grid',
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
                            // Calculate visibility level using the new adaptive function
                            const visibilityLevel = getCellVisibilityLevel(
                                cell,
                                playerPosition.x,
                                playerPosition.y,
                                playerElevation,
                                playerExplorationAbility,
                                viewportRadius,
                                turn
                            );

                            const refPos = (() => {
                                if (isAnimatingMove) {
                                    if (visualMoveTo) return visualMoveTo;
                                    if (visualPlayerPosition) return visualPlayerPosition;
                                }
                                return playerPosition;
                            })();
                            const playerToShow = refPos;
                            const isPlayerHere = playerToShow.x === cell?.x && playerToShow.y === cell?.y;

                            return (
                                <MinimapCell
                                    key={key}
                                    cell={cell}
                                    rowIndex={rowIndex}
                                    colIndex={colIndex}
                                    cellSizePx={cellSizePx}
                                    visibilityLevel={visibilityLevel} // Pass new visibilityLevel
                                    isPlayerHere={isPlayerHere}
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
// During animation, ignore turn changes - keep frozen grid
export const MinimapMemoized = memo(Minimap, (prevProps, nextProps) => {
    // Return true if props are equal (don't rerender), false if different (rerender)
    const gridSame = prevProps.grid === nextProps.grid;
    const playerPosSame = prevProps.playerPosition === nextProps.playerPosition;
    const visualPlayerPosSame = prevProps.visualPlayerPosition === nextProps.visualPlayerPosition;
    const animatingSame = prevProps.isAnimatingMove === nextProps.isAnimatingMove;
    const visualMoveFromSame = prevProps.visualMoveFrom === nextProps.visualMoveFrom;
    const visualMoveToSame = prevProps.visualMoveTo === nextProps.visualMoveTo;
    const visualJustLandedSame = prevProps.visualJustLanded === nextProps.visualJustLanded;
    // CRITICAL: During animation, IGNORE turn changes to prevent rerender
    // Grid is frozen to visualMoveTo, so turn doesn't matter until animation completes
    const turnSame = nextProps.isAnimatingMove ? true : (prevProps.turn === nextProps.turn);

    const allSame = gridSame && playerPosSame && visualPlayerPosSame && animatingSame &&
        visualMoveFromSame && visualMoveToSame && visualJustLandedSame && turnSame;

    return allSame;
});
