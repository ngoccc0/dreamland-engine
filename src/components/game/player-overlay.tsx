"use client";

import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { cn } from "@/lib/utils";
import { PlayerIcon } from "./icons";

export type OverlayData = {
    left: string;
    top: string;
    width: string;
    height: string;
    dx: number;
    dy: number;
    flyDurationMs: number;
} | null;

interface PlayerOverlayProps {
    overlayData: OverlayData;
    // If provided, PlayerOverlay will use these props directly (presentational mode)
    overlayFlying?: boolean;
    visualJustLanded?: boolean;
    className?: string;
    ariaHidden?: boolean;
    // autoPlay: when true the component manages lift->fly->land->bounce timing itself
    autoPlay?: boolean;
    // timing overrides (optional)
    liftDuration?: number;
    bounceDuration?: number;
    // callbacks when phases occur
    onLanding?: () => void;
    onFinished?: () => void;
    // If false, render inline instead of into a document.body portal
    usePortal?: boolean;
}

export default function PlayerOverlay({ overlayData, overlayFlying = false, visualJustLanded = false, className, ariaHidden, autoPlay = false, liftDuration = 150, bounceDuration = 50, onLanding, onFinished, usePortal = true }: PlayerOverlayProps) {
    const [internalFlying, setInternalFlying] = useState(false);
    const [internalJustLanded, setInternalJustLanded] = useState(false);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    // Auto-play sequence: unified flight animation with built-in lift
    // Uses single rAF-driven timer instead of multiple setTimeout to reduce main thread churn
    useEffect(() => {
        if (!autoPlay || !overlayData) return;
        let mounted = true;
        const total = Math.max(overlayData.flyDurationMs || 500, 0);
        const bounce = Math.max(bounceDuration || 50, 0);
        const fly = Math.max(total - bounce, 80);

        // Start flying IMMEDIATELY (don't delay)
        setInternalFlying(true);
        setInternalJustLanded(false);

        // Collect all timer IDs for cleanup
        const timerIds: (ReturnType<typeof setTimeout> | null)[] = [];

        const schedulePhaseTransition = (delayMs: number, callback: () => void) => {
            if (!mounted || !mountedRef.current) return;
            const timerId = setTimeout(() => {
                if (!mounted || !mountedRef.current) return;
                callback();
            }, delayMs);
            timerIds.push(timerId);
        };

        // Phase 1: Landing (fly completes, trigger landing callback)
        schedulePhaseTransition(fly, () => {
            try { onLanding && onLanding(); } catch { }
            setInternalJustLanded(true);
        });

        // Phase 2: Finished (bounce completes, reset states)
        schedulePhaseTransition(fly + bounce + 10, () => {
            setInternalJustLanded(false);
            setInternalFlying(false);
            try { onFinished && onFinished(); } catch { }
        });

        return () => {
            mounted = false;
            // Clear ALL timer IDs, not just the last one
            timerIds.forEach(id => {
                if (id !== null) clearTimeout(id);
            });
        };
    }, [autoPlay, overlayData?.flyDurationMs, liftDuration, bounceDuration, onLanding, onFinished]);

    if (!overlayData) return null;

    // Unified animation: no separate lift phase, just flight arc with built-in lift
    const total = Math.max(overlayData.flyDurationMs || 500, 0);
    const bounce = Math.max(bounceDuration || 50, 0);
    const flyMs = Math.max(total - bounce, 80);

    const flyFlag = autoPlay ? internalFlying : overlayFlying;
    const landedFlag = autoPlay ? internalJustLanded : visualJustLanded;

    const content = (
        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, pointerEvents: 'none' }} aria-hidden={ariaHidden ?? true}>
            <div
                className={cn('player-overlay', flyFlag ? 'player-flying' : '', landedFlag ? 'bounce' : '', className)}
                style={{
                    left: overlayData.left,
                    top: overlayData.top,
                    width: overlayData.width,
                    height: overlayData.height,
                    ['--fly-duration' as any]: `${flyMs}ms`,
                    ['--fly-dx' as any]: `${overlayData.dx}%`,
                    ['--fly-dy' as any]: `${overlayData.dy}%`,
                    // Hint browser for GPU acceleration and smoother animation
                    willChange: 'transform',
                    // Animation handles all transform (lift + arc + landing)
                    transform: 'none',
                    transitionDuration: '0ms',
                    transitionTimingFunction: 'cubic-bezier(.22,.9,.33,1)'
                }}
            >
                <div className="player-arc" style={{ willChange: 'transform' }}>
                    <PlayerIcon />
                </div>
            </div>
        </div>
    );

    // Render into a portal so the overlay is isolated from map transforms/layout
    if (!usePortal) return content;
    try {
        return ReactDOM.createPortal(content, document.body);
    } catch {
        // Server-side/rendering fallback
        return content;
    }
}
