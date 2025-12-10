'use client';

import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';

interface DamagePopupEntry {
    id: string;
    value: number;
    type: 'damage' | 'heal' | 'critical';
    timestamp: number;
}

interface DamagePopupProps {
    /**
     * Maximum number of damage popups to display simultaneously
     */
    maxPopups?: number;
}

export type DamagePopupHandle = {
    add: (value: number, type: 'damage' | 'heal' | 'critical') => void;
};

/**
 * Displays floating damage/heal numbers that pop up and fade away.
 *
 * @remarks
 * This component renders damage and healing numbers in the HUD layer, not in world space.
 * Numbers float upward and fade out over 1.5 seconds. Popups are queued internally.
 *
 * Color coding:
 * - Damage: White (#FFFFFF)
 * - Heal: Green (#22C55E)
 * - Critical: Yellow/Gold (#FCD34D)
 *
 * Use via ref: damagePopupRef.current?.add(50, 'damage')
 * This component tracks and auto-removes popups after animation completes.
 *
 * @param {number} [maxPopups=5] - Maximum simultaneous popups before oldest is removed
 *
 * @example
 * const damagePopupRef = useRef<DamagePopupHandle>(null);
 * <DamagePopup ref={damagePopupRef} maxPopups={5} />
 * // Parent calls: damagePopupRef.current?.add(50, 'damage')
 */
export const DamagePopup = forwardRef<DamagePopupHandle, DamagePopupProps>(
    ({ maxPopups = 5 }, ref) => {
        const [popups, setPopups] = useState<DamagePopupEntry[]>([]);

        /**
         * Add a new damage/heal popup to the queue
         */
        const addPopup = (value: number, type: 'damage' | 'heal' | 'critical' = 'damage') => {
            const newPopup: DamagePopupEntry = {
                id: `${Date.now()}-${Math.random()}`,
                value,
                type,
                timestamp: Date.now(),
            };

            setPopups((prev) => {
                const updated = [...prev, newPopup];
                // Keep only the most recent maxPopups
                return updated.slice(-maxPopups);
            });
        };

        /**
         * Expose addPopup via imperative handle
         */
        useImperativeHandle(ref, () => ({
            add: addPopup,
        }), []);

        /**
         * Expose addPopup via window for global access (simple imperative pattern)
         * Parent components should use ref for better patterns
         */
        React.useEffect(() => {
            (window as any).__damagePopupAdd = addPopup;
        }, []);

        /**
         * Remove popups after animation completes (1.5 seconds)
         */
        useEffect(() => {
            const interval = setInterval(() => {
                setPopups((prev) => {
                    const now = Date.now();
                    return prev.filter((p) => now - p.timestamp < 1500);
                });
            }, 100);

            return () => clearInterval(interval);
        }, []);

        // Color mapping by type
        const colorMap: Record<string, string> = {
            damage: '#FFFFFF', // White
            heal: '#22C55E', // Green
            critical: '#FCD34D', // Gold/Yellow
        };

        return (
            <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
                {popups.map((popup) => {
                    const elapsedMs = Date.now() - popup.timestamp;
                    const progress = Math.min(elapsedMs / 1500, 1); // 0 to 1 over 1.5 seconds

                    return (
                        <div
                            key={popup.id}
                            className="absolute text-center font-bold text-lg drop-shadow-lg"
                            style={{
                                // Center horizontally, position near top-center
                                left: '50%',
                                top: '50%',
                                transform: `translate(-50%, -50%) translateY(${-progress * 60}px)`,
                                opacity: 1 - progress, // Fade out
                                color: colorMap[popup.type],
                                pointerEvents: 'none',
                            }}
                        >
                            {popup.type === 'critical' ? '⭐' : ''}
                            {popup.value > 0 && popup.type === 'damage' ? '-' : '+'}
                            {Math.abs(popup.value)}
                        </div>
                    );
                })}
            </div>
        );
    }
);
