"use client";

import React, { useEffect, useState } from 'react';
import { PlayerIcon } from './icons';
import { logger } from '@/lib/logger';
import type { Chunk, BiomeDefinition } from '@/lib/game/types';

const DEFAULT_LIFT_DURATION = 150;
const DEFAULT_BOUNCE_DURATION = 50;

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

    useEffect(() => {
        try { console.info('[player-flight-overlay] mounted'); } catch {}
        return () => { try { console.info('[player-flight-overlay] unmounted'); } catch {} };
    }, []);

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

        // Start lift -> fly -> landed sequence with robust cleanup
        const liftDuration = DEFAULT_LIFT_DURATION; // ms
        const bounceDuration = DEFAULT_BOUNCE_DURATION; // ms (align with PlayerOverlay defaults)

        logger.debug('[player-flight-overlay] starting flight sequence', {
            dx: overlayData.dx,
            dy: overlayData.dy,
            flyDuration: overlayData.flyDurationMs,
            liftDuration,
            bounceDuration,
        });

        setOverlayState('lift');

        // Keep timer IDs and a flag in refs to avoid double-calls across re-renders
        const liftTimer = setTimeout(() => {
            logger.debug('[player-flight-overlay] lift finished, starting fly');
            setOverlayState('fly');
        }, liftDuration);

        const landTimerRef = { id: null as null | ReturnType<typeof setTimeout> };
        const bounceTimerRef = { id: null as null | ReturnType<typeof setTimeout> };
        const calledRef = { called: false } as { called: boolean };

        // schedule land after lift + fly duration
        const total = overlayData.flyDurationMs ?? 500;
        const flyMs = Math.max(total - liftDuration - bounceDuration, 80);
        landTimerRef.id = setTimeout(() => {
            logger.debug('[player-flight-overlay] fly finished, landed');
            setOverlayState('landed');

            // dispatch a landing event so orchestrator can update visual state
            try {
                const ev = new CustomEvent('playerOverlayLanding', { detail: { center: visualMoveTo ? { x: visualMoveTo.x, y: visualMoveTo.y } : undefined } });
                try { console.info('[player-flight-overlay] dispatch playerOverlayLanding', { center: visualMoveTo ? { x: visualMoveTo.x, y: visualMoveTo.y } : undefined }); } catch {}
                window.dispatchEvent(ev as any);
            } catch (e) { logger.debug('[player-flight-overlay] dispatch landing failed', e); }

            // schedule bounce
            bounceTimerRef.id = setTimeout(() => {
                logger.debug('[player-flight-overlay] bounce finished, completing flight');
                setOverlayState('idle');
                // dispatch moveAnimationsFinished so orchestrator can finalize the move
                try {
                    const ev = new CustomEvent('moveAnimationsFinished', { detail: { center: visualMoveTo ? { x: visualMoveTo.x, y: visualMoveTo.y } : undefined } });
                    try { console.info('[player-flight-overlay] dispatch moveAnimationsFinished', { center: visualMoveTo ? { x: visualMoveTo.x, y: visualMoveTo.y } : undefined }); } catch {}
                    window.dispatchEvent(ev as any);
                } catch (e) { logger.debug('[player-flight-overlay] dispatch finished failed', e); }

                if (!calledRef.called) {
                    calledRef.called = true;
                    try { onFlightComplete && onFlightComplete({ x: visualMoveTo!.x, y: visualMoveTo!.y }); } catch (e) { logger.debug('[player-flight-overlay] onFlightComplete threw', e); }
                }
            }, bounceDuration) as any;
        }, liftDuration + flyMs) as any;

        // Cleanup: ensure all timers cleared and onFlightComplete called at most once
        return () => {
            try { clearTimeout(liftTimer); } catch {}
            try { if (landTimerRef.id) clearTimeout(landTimerRef.id); } catch {}
            try { if (bounceTimerRef.id) clearTimeout(bounceTimerRef.id); } catch {}
            // Do not call onFlightComplete from cleanup automatically; animation must finish to trigger it.
        };
        // We intentionally list only the inputs that should restart the sequence.
    }, [overlayData, visualMoveTo, onFlightComplete]);

    if (!overlayData) return null;

    const isFlying = overlayState === 'fly';
    const isLift = overlayState === 'lift';
    const total = overlayData.flyDurationMs ?? 500;
    const lift = DEFAULT_LIFT_DURATION;
    const bounce = DEFAULT_BOUNCE_DURATION;
    const flyMs = Math.max(total - lift - bounce, 80);

    return (
        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, pointerEvents: 'none' }} aria-hidden>
            <div
                className={['player-overlay', isFlying ? 'player-flying' : '', visualJustLanded ? 'bounce' : '', isLift ? 'player-lift' : ''].join(' ')}
                style={{
                    left: overlayData.left,
                    top: overlayData.top,
                    width: overlayData.width,
                    height: overlayData.height,
                    ['--fly-duration' as any]: `${flyMs}ms`,
                    // GPU-accelerated transform and browser hint for smoother animation
                    willChange: 'transform, left, top',
                    transform: isFlying ? `translate3d(${overlayData.dx}%, ${overlayData.dy}%, 0)` : `translate3d(0, -18px, 0)`,
                    transitionDuration: `${flyMs}ms`,
                    transitionTimingFunction: 'cubic-bezier(.22,.9,.33,1)'
                }}
            >
                <div className="player-arc">
                    <PlayerIcon />
                </div>
            </div>
        </div>
    );
}
