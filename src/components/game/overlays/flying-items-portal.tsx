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
                {flyingItems.map((item) => {
                    // Calculate arc height based on distance
                    const dx = item.endX - item.startX;
                    const dy = item.endY - item.startY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const arcHeight = Math.min(100, distance * 0.3);
                    const midY = Math.min(item.startY, item.endY) - arcHeight;

                    return (
                        <motion.div
                            key={item.id}
                            initial={{
                                x: item.startX,
                                y: item.startY,
                                opacity: 1,
                                scale: 1,
                                rotate: 0,
                            }}
                            animate={{
                                x: [item.startX, (item.startX + item.endX) / 2, item.endX],
                                y: [item.startY, midY, item.endY],
                                opacity: [1, 1, 0.6],
                                scale: [1, 1.3, 0.6],
                                rotate: [0, 180, 360],
                            }}
                            transition={{
                                duration: item.isMobile ? 0.5 : 0.7,
                                ease: [0.25, 0.1, 0.25, 1], // Smooth arc curve
                                times: [0, 0.5, 1], // Keyframe timing
                            }}
                            onAnimationComplete={() => onItemComplete(item.id)}
                            className="absolute w-12 h-12 flex items-center justify-center"
                            style={{
                                willChange: 'transform, opacity',
                                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                            }}
                        >
                            {/* Render item icon/emoji with glow effect */}
                            <div className="text-3xl drop-shadow-lg">
                                {item.icon ? renderItemEmoji(item.icon) : '📦'}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );

    // Render in portal at document root
    return ReactDOM.createPortal(portalContent, document.body);
}
