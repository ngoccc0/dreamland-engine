/**
 * @file src/hooks/use-minimap-grid-data.ts
 * @description Hook for minimap grid generation with animation smoothing
 * 
 * @remarks
 * Encapsulates minimap grid generation logic including:
 * - Animation ref management for smooth camera follow
 * - Grid generation via useMinimapGrid hook
 * - Animation state transitions (start/end of move animation)
 * 
 * This hook maintains internal refs that synchronize with parent props,
 * enabling smooth interpolation of the minimap grid during player movement animation.
 * 
 * **Why separate:**
 * - Grid calculations are animation-dependent
 * - Can be optimized/tested independently
 * - Centralizes all minimap-specific logic
 * - Proper file naming: hooks are .ts files, not .tsx
 * 
 * **Usage:**
 * Called from GameLayout to generate minimap grid data with animation smoothing.
 */

import React from 'react';
import { useSettings } from '@/context/settings-context';
import { useMinimapGrid } from '@/hooks/use-minimap-grid';

type Position = { x: number; y: number };

/**
 * Hook for minimap grid generation with animation smoothing
 * 
 * @remarks
 * Generates the visible portion of the world for minimap rendering.
 * Manages animation refs internally to smooth camera movement during player movement.
 * 
 * **Animation Lifecycle:**
 * 1. When move animation starts: Record start time, hold animation center
 * 2. During animation: Display smoothed grid between old and new center
 * 3. After animation: Return to actual player position (with 350ms hold)
 * 
 * @param params.world - Game world object (chunks keyed by "x,y")
 * @param params.playerPosition - Player's current grid position
 * @param params.visualPlayerPosition - Animated player position during movement
 * @param params.isAnimatingMove - Whether a move animation is in progress
 * @param params.visualMoveTo - Target position for move animation
 * @param params.turn - Current game turn (used for exploration tracking)
 * @param params.finalWorldSetup - World configuration (null if not loaded)
 * @param params.isLoaded - Whether world is fully loaded
 * 
 * @returns Computed minimap grid array for rendering (grid[y][x] = chunk or null)
 * 
 * @example
 * ```tsx
 * const gridToPass = useMinimapGridData({
 *   world,
 *   playerPosition,
 *   visualPlayerPosition,
 *   isAnimatingMove,
 *   visualMoveTo,
 *   turn,
 *   finalWorldSetup,
 *   isLoaded,
 * });
 * return <Minimap grid={gridToPass} />;
 * ```
 */
export function useMinimapGridData({
    world,
    playerPosition,
    visualPlayerPosition,
    isAnimatingMove,
    visualMoveTo,
    turn,
    finalWorldSetup,
    isLoaded,
}: {
    world: any;
    playerPosition: Position;
    visualPlayerPosition: Position;
    isAnimatingMove: boolean;
    visualMoveTo: Position | null;
    turn: number;
    finalWorldSetup: any;
    isLoaded: boolean;
}): any[] {
    const { settings } = useSettings();

    // Animation tracking refs (internal state for smooth animation)
    // These refs track whether we're currently animating and timing information
    const prevAnimatingRefForLayout = React.useRef<boolean>(Boolean(isAnimatingMove));
    const holdCenterUntilRef = React.useRef<number>(0);
    const animationStartTimeRef = React.useRef<number>(0);
    
    // Animation state refs - synced with props each render
    const isAnimatingMoveRef = React.useRef(isAnimatingMove);
    const visualMoveToRef = React.useRef<Position | null>(visualMoveTo);
    const visualPlayerPositionRef = React.useRef(visualPlayerPosition);
    const turnRef = React.useRef(turn);

    // Sync animation state refs with latest props
    React.useEffect(() => {
        isAnimatingMoveRef.current = isAnimatingMove;
        visualMoveToRef.current = visualMoveTo;
        visualPlayerPositionRef.current = visualPlayerPosition;
        turnRef.current = turn;
    }, [isAnimatingMove, visualMoveTo, visualPlayerPosition, turn]);

    // Manage animation timing state transitions
    React.useEffect(() => {
        try {
            // When animation starts: record the start time
            if (!prevAnimatingRefForLayout.current && isAnimatingMove) {
                animationStartTimeRef.current = Date.now() + 50;
            }
            // When animation ends: hold the visual center for 350ms to smooth snap-back
            if (prevAnimatingRefForLayout.current && !isAnimatingMove) {
                holdCenterUntilRef.current = Date.now() + 350;
            }
            prevAnimatingRefForLayout.current = Boolean(isAnimatingMove);
        } catch { }
    }, [isAnimatingMove]);

    // Generate minimap grid with animation-aware centering
    const { gridToPass } = useMinimapGrid({
        world,
        playerPosition,
        visualPlayerPosition,
        isAnimatingMove,
        visualMoveTo,
        turn,
        finalWorldSetup,
        isLoaded,
        minimapViewportSize: (settings?.minimapViewportSize as 5 | 7 | 9) || 5,
        animationRefs: {
            isAnimatingMoveRef,
            visualMoveToRef,
            visualPlayerPositionRef,
            turnRef,
            holdCenterUntilRef,
            animationStartTimeRef,
        },
    });

    return gridToPass;
}
