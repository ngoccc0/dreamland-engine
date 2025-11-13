"use client";

import React, { useEffect, useState } from 'react';
import { PlayerIcon } from './icons';
import { logger } from '@/lib/logger';
import type { Chunk, BiomeDefinition } from '@/lib/game/types';

interface Props {
    grid: (Chunk | null)[][];
    visualMoveFrom?: { x: number; y: number } | null;
    visualMoveTo?: { x: number; y: number } | null;
    isAnimatingMove?: boolean;
    visualJustLanded?: boolean;
    // Callback invoked when the overlay flight (lift->fly->bounce) has fully completed.
    onFlightComplete?: (center: { x: number; y: number } | null) => void;
}

export default function PlayerFlightOverlay({ grid, visualMoveFrom, visualMoveTo, isAnimatingMove, visualJustLanded, onFlightComplete }: Props) {
    const [overlayState, setOverlayState] = useState<'idle'|'lift'|'fly'|'landed'>('idle');

    // compute overlay geometry like Minimap did: find source/target indices
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
        const flyDurationMs = 500;
        return { left, top, width, height, dx, dy, flyDurationMs };
    })();

    useEffect(() => {
        if (!overlayData) {
            setOverlayState('idle');
            return;
        }

        // Start lift -> fly -> landed sequence
        const liftDuration = 150; // ms
        const bounceDuration = 220; // ms

        logger.debug('[player-flight-overlay] starting flight sequence', {
            dx: overlayData.dx,
            dy: overlayData.dy,
            flyDuration: overlayData.flyDurationMs,
            liftDuration,
            bounceDuration,
        });

        setOverlayState('lift');

        const liftTimer = setTimeout(() => {
            logger.debug('[player-flight-overlay] lift finished, starting fly');
            setOverlayState('fly');

            const landTimer = setTimeout(() => {
                logger.debug('[player-flight-overlay] fly finished, landed');
                setOverlayState('landed');

                const bounceTimer = setTimeout(() => {
                    logger.debug('[player-flight-overlay] bounce finished, completing flight');
                    setOverlayState('idle');
                    try { onFlightComplete && onFlightComplete({ x: visualMoveTo!.x, y: visualMoveTo!.y }); } catch (e) { logger.debug('[player-flight-overlay] onFlightComplete threw', e); }
                }, bounceDuration);

                return () => clearTimeout(bounceTimer);
            }, overlayData.flyDurationMs);

            return () => clearTimeout(landTimer);
        }, liftDuration);

        return () => {
            clearTimeout(liftTimer);
        };
        // We intentionally list only the inputs that should restart the sequence.
    }, [overlayData, visualMoveTo, onFlightComplete]);

    if (!overlayData) return null;

    const isFlying = overlayState === 'fly';
    const isLift = overlayState === 'lift';

    return (
        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, pointerEvents: 'none' }} aria-hidden>
            <div
                className={['player-overlay', isFlying ? 'player-flying' : '', visualJustLanded ? 'bounce' : '', isLift ? 'player-lift' : ''].join(' ')}
                style={{
                    left: overlayData.left,
                    top: overlayData.top,
                    width: overlayData.width,
                    height: overlayData.height,
                    ['--fly-duration' as any]: `${overlayData.flyDurationMs}ms`,
                    transform: isFlying ? `translate(${overlayData.dx}%, ${overlayData.dy}%)` : `translate(0, -18px)`,
                    transitionDuration: `${overlayData.flyDurationMs}ms`
                }}
            >
                <div className="player-arc">
                    <PlayerIcon />
                </div>
            </div>
        </div>
    );
}
