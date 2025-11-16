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

    // Auto-play sequence: lift -> fly -> landing -> bounce -> finished
    useEffect(() => {
        if (!autoPlay || !overlayData) return;
        let mounted = true;
        const total = Math.max(overlayData.flyDurationMs || 500, 0);
        const lift = Math.max(liftDuration || 150, 0);
        const bounce = Math.max(bounceDuration || 50, 0);
        const fly = Math.max(total - lift - bounce, 0);

        setInternalFlying(false);
        setInternalJustLanded(false);

        const t1 = setTimeout(() => {
            if (!mounted || !mountedRef.current) return;
            setInternalFlying(true);
        }, lift);

        const t2 = setTimeout(() => {
            if (!mounted || !mountedRef.current) return;
            // landing moment
            try { onLanding && onLanding(); } catch {}
            setInternalJustLanded(true);
        }, lift + fly);

        const t3 = setTimeout(() => {
            if (!mounted || !mountedRef.current) return;
            setInternalJustLanded(false);
            setInternalFlying(false);
            try { onFinished && onFinished(); } catch {}
        }, lift + fly + bounce + 10);

        return () => { mounted = false; clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [autoPlay, overlayData?.flyDurationMs, liftDuration, bounceDuration, onLanding, onFinished]);

    if (!overlayData) return null;

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
                    ['--fly-duration' as any]: `${overlayData.flyDurationMs}ms`,
                    transform: flyFlag ? `translate(${overlayData.dx}%, ${overlayData.dy}%)` : `translate(0, -18px)`,
                    transitionDuration: `${overlayData.flyDurationMs}ms`
                }}
            >
                <div className="player-arc">
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
