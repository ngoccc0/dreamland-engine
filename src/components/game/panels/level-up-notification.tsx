'use client';

import React, { useEffect, useState } from 'react';
import type { GameState } from '@/core/types/game';
import { useExperienceState } from '@/hooks/use-experience-state';

interface LevelUpNotificationProps {
    gameState: GameState;
    onDismiss?: () => void;
    autoHide?: boolean;
    autoDismissDelay?: number;
}

/**
 * Level Up Notification component - displays level up achievement with stat gains.
 *
 * @remarks
 * **Features:**
 * - Animated entrance (scale + fade in)
 * - Shows new level number prominently
 * - Lists stat increases: HP, Attack, Defense, Skill Points
 * - Shows required XP for next level with progress bar
 * - Auto-dismiss after 5 seconds (configurable)
 * - Manual dismiss button available
 * - Plays celebratory animation/sound
 *
 * **Layout:**
 * - Center modal overlay
 * - Large "LEVEL UP!" text with level number
 * - Stat gains table
 * - Progress to next level bar
 * - Dismiss button
 *
 * **Animation:**
 * - Scale from 80% to 100%
 * - Fade in over 300ms
 * - Auto fade out before dismiss
 *
 * **Props:**
 * - `gameState`: Full game state (selector extracts XP subset)
 * - `onDismiss`: Callback when notification closed
 * - `autoHide`: Auto-dismiss after delay (default true)
 * - `autoDismissDelay`: Milliseconds before auto-dismiss (default 5000)
 *
 * @example
 * // Appears when hasLeveledUp = true in gameState
 * <LevelUpNotification
 *   gameState={gameState}
 *   onDismiss={() => clearLevelUpNotification()}
 *   autoHide
 *   autoDismissDelay={5000}
 * />
 */
export function LevelUpNotification({
    gameState,
    onDismiss,
    autoHide = true,
    autoDismissDelay = 5000
}: LevelUpNotificationProps) {
    const experienceState = useExperienceState(gameState);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (!autoHide) return;

        const timer = setTimeout(() => {
            setIsVisible(false);
            onDismiss?.();
        }, autoDismissDelay);

        return () => clearTimeout(timer);
    }, [autoHide, autoDismissDelay, onDismiss]);

    if (!experienceState.hasLeveledUp || !isVisible) {
        return null;
    }

    const { currentLevel, statGains, xpProgress, xpRemaining } = experienceState;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 animate-fade-in">
            <div className="bg-gradient-to-b from-yellow-900 to-amber-900 border-4 border-yellow-400 rounded-xl p-8 shadow-2xl max-w-md w-11/12 animate-scale-in text-center">
                {/* Header */}
                <div className="mb-6">
                    <p className="text-yellow-200 text-lg font-bold tracking-widest">🎉 LEVEL UP! 🎉</p>
                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400 my-2">
                        {currentLevel}
                    </h1>
                </div>

                {/* Stat Gains */}
                <div className="bg-black/30 rounded-lg p-4 mb-6 border-2 border-yellow-600">
                    <h3 className="text-yellow-300 font-bold mb-3">Stat Gains:</h3>
                    <div className="space-y-2">
                        {statGains && (
                            <>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-300">❤️ Max HP:</span>
                                    <span className="text-green-400 font-bold">+{statGains.hp}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-300">⚔️ Attack:</span>
                                    <span className="text-orange-400 font-bold">+{statGains.attack}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-300">🛡️ Defense:</span>
                                    <span className="text-blue-400 font-bold">+{statGains.defense}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-300">⭐ Skill Points:</span>
                                    <span className="text-purple-400 font-bold">+{statGains.skillPoints}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* XP Progress */}
                <div className="mb-6">
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                        <span>Next Level XP:</span>
                        <span>
                            {Math.floor(experienceState.xpThisLevel)} / {Math.floor(experienceState.xpNeeded)}
                        </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3 border border-gray-600 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all duration-500"
                            style={{ width: `${xpProgress * 100}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{Math.ceil(xpRemaining)} XP to next level</p>
                </div>

                {/* Dismiss Button */}
                <button
                    onClick={() => {
                        setIsVisible(false);
                        onDismiss?.();
                    }}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-yellow-900 font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 text-lg"
                >
                    Continue
                </button>

                {/* Auto-dismiss hint */}
                {autoHide && (
                    <p className="text-xs text-gray-400 mt-3">Auto-dismissing in {Math.ceil(autoDismissDelay / 1000)}s...</p>
                )}
            </div>
        </div>
    );
}

/**
 * XP Progress Bar component - shows progress toward next level.
 *
 * @remarks
 * **Compact Display:**
 * - Shows XP progress bar
 * - Current XP / Next level XP
 * - Compact form for HUD/toolbar
 *
 * **Features:**
 * - Color gradient: Red (low progress) → Green (ready to level)
 * - Animated width changes
 * - Hover tooltip with XP remaining
 * - Level number badge
 *
 * @param gameState - Full game state
 * @returns Compact XP progress component
 */
export function XPProgressBar({ gameState }: { gameState: GameState }) {
    const experienceState = useExperienceState(gameState);
    const { currentLevel, xpProgress, xpRemaining } = experienceState;

    return (
        <div className="bg-slate-700 rounded-lg p-2 flex items-center gap-2">
            <div className="text-xs font-bold text-white bg-slate-800 rounded px-2 py-1">
                Lvl {currentLevel}
            </div>
            <div className="flex-1">
                <div
                    className="h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300 border border-gray-600"
                    style={{ width: `${xpProgress * 100}%`, maxWidth: '120px' }}
                />
            </div>
            <div
                className="text-xs text-gray-300 cursor-help"
                title={`${Math.ceil(xpRemaining)} XP to next level`}
            >
                {Math.ceil(xpRemaining)}
            </div>
        </div>
    );
}
