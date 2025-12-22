'use client';

import React from 'react';
import { useSettings } from '@/context/settings-context';
import { useMinimapGrid } from '@/hooks/use-minimap-grid';

/**
 * MiniMapSection - Grid generation for minimap
 *
 * @remarks
 * **Responsibility:**
 * - Manage minimap grid generation with animation smoothing
 * - Encapsulate animation refs for smooth camera movement
 * - Expose grid data to parent component
 *
 * **Why separate:**
 * - Grid calculations are complex and animation-dependent
 * - Can be optimized/tested independently from layout
 * - Centralizes all minimap-specific logic
 *
 * @param props - World, player position, animation state
 * @returns Computed minimap grid for parent to render
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
    playerPosition: { x: number; y: number };
    visualPlayerPosition: { x: number; y: number };
    isAnimatingMove: boolean;
    visualMoveTo: { x: number; y: number } | null;
    turn: number;
    finalWorldSetup: any;
    isLoaded: boolean;
}): any[] {
    const { settings } = useSettings();

    // Animation tracking refs (internal state for smooth animation)
    const prevAnimatingRefForLayout = React.useRef<boolean>(Boolean(isAnimatingMove));
    const holdCenterUntilRef = React.useRef<number>(0);
    const animationStartTimeRef = React.useRef<number>(0);
    const isAnimatingMoveRef = React.useRef(isAnimatingMove);
    const visualMoveToRef = React.useRef<{ x: number; y: number } | null>(visualMoveTo);
    const visualPlayerPositionRef = React.useRef(visualPlayerPosition);
    const turnRef = React.useRef(turn);

    // Sync refs with props
    React.useEffect(() => {
        isAnimatingMoveRef.current = isAnimatingMove;
        visualMoveToRef.current = visualMoveTo;
        visualPlayerPositionRef.current = visualPlayerPosition;
        turnRef.current = turn;
    }, [isAnimatingMove, visualMoveTo, visualPlayerPosition, turn]);

    // Manage animation timing
    React.useEffect(() => {
        try {
            if (!prevAnimatingRefForLayout.current && isAnimatingMove) {
                animationStartTimeRef.current = Date.now() + 50;
            }
            if (prevAnimatingRefForLayout.current && !isAnimatingMove) {
                holdCenterUntilRef.current = Date.now() + 350;
            }
            prevAnimatingRefForLayout.current = Boolean(isAnimatingMove);
        } catch { }
    }, [isAnimatingMove]);

    // Generate minimap grid (integrates grid.ts math via useMinimapGrid)
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

