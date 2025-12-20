/**
 * Flying Items Portal Component
 *
 * @remarks
 * Renders flying items in a React Portal at document root, ensuring they
 * always appear above all other UI elements (z-index: 9999). Uses single
 * container for all items to optimize rendering performance.
 *
 * **Portal Structure:**
 * ```
 * document.body
 * └── <div id="flying-items-portal">
 *     └── <div className="flying-items-container" z-[9999]>
 *         ├── <motion.div> Item 1 (animating)
 *         ├── <motion.div> Item 2 (animating)
 *         └── ...
 * ```
 *
 * **Performance:**
 * - Single portal prevents multiple reflow cycles
 * - Framer Motion batch-optimizes animations when items grouped in container
 * - pointer-events-none prevents interference with game UI
 */

'use client';

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import type { FlyingItemEvent } from '@/hooks/use-flying-items';
import { renderItemEmoji } from '../panels/icons';

export interface FlyingItemsPortalProps {
    /**
     * Array of currently flying items
     */
    flyingItems: FlyingItemEvent[];

    /**
     * Callback when individual item animation completes
     */
    onItemComplete: (itemId: string) => void;
}

/**
 * Portal rendering all flying items with parabolic animations
 *
 * @param props - Component props
 * @returns Portal rendered at document.body root
 */
export function FlyingItemsPortal({
    flyingItems,
    onItemComplete,
}: FlyingItemsPortalProps) {
    const [isMounted, setIsMounted] = useState(false);

    // Ensure we only render on client to prevent hydration mismatch
    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    // Calculate bezier control point for parabolic arc
    const calculateBezierPath = (startX: number, startY: number, endX: number, endY: number) => {
        const midX = (startX + endX) / 2;
        const midY = Math.min(startY, endY) - Math.abs(endX - startX) * 0.3; // Arc height based on distance

        return {
            x1: startX,
            y1: startY,
            x2: midX,
            y2: midY,
            x3: endX,
            y3: endY,
        };
    };

    const portalContent = (
        <div
            className="fixed inset-0 z-[9999] pointer-events-none"
            style={{
                // Prevent this layer from interfering with interactive elements
                pointerEvents: 'none',
            }}
        >
            {/* Container for all flying items */}
            <div className="relative w-full h-full">
                {flyingItems.map((item) => (
                    <motion.div
                        key={item.id}
                        initial={{
                            x: item.startX,
                            y: item.startY,
                            opacity: 1,
                            scale: 1,
                        }}
                        animate={{
                            x: item.endX,
                            y: item.endY,
                            opacity: 0.7,
                            scale: 0.8,
                        }}
                        transition={{
                            duration: item.isMobile ? 0.4 : 0.6,
                            ease: [0.25, 0.46, 0.45, 0.94], // Custom bezier for "easeInOut" feel
                            type: 'tween',
                        }}
                        onAnimationComplete={() => onItemComplete(item.id)}
                        className="absolute w-10 h-10 flex items-center justify-center"
                        style={{
                            willChange: 'transform, opacity',
                        }}
                    >
                        {/* Render item icon/emoji */}
                        <div className="text-2xl drop-shadow-lg">
                            {item.icon ? renderItemEmoji(item.icon) : '📦'}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );

    // Render in portal at document root
    return ReactDOM.createPortal(portalContent, document.body);
}
