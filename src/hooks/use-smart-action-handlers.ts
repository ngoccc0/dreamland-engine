/**
 * @file src/hooks/use-smart-action-handlers.ts
 * @description Simplified action handlers for Smart Containers (Phase 2)
 *
 * @remarks
 * Extracts action handler pattern for ControlsSection Smart Container.
 * This is a bridge between the full useActionHandlers complexity and Smart Container needs.
 *
 * Unlike the full useActionHandlers (903 lines), this focuses on delegation:
 * - Receives a callback interface
 * - Returns memoized handler wrappers
 * - No business logic, pure delegation
 */

import { useCallback } from 'react';

/**
 * Callback interface for action execution
 * Implemented by useGameEngine or SmartContainer integrator
 */
export interface ActionExecutor {
    onMove?: (direction: 'north' | 'south' | 'west' | 'east') => void;
    onAttack?: () => void;
    onAction?: (actionId: number) => void;
    onWait?: () => void;
    onRest?: () => void;
    onUseSkill?: (skillId: string) => void;
}

export interface SmartActionHandlers {
    handleMove: (direction: 'north' | 'south' | 'west' | 'east') => void;
    handleAttack: () => void;
    handleAction: (actionId: number) => void;
    handleWaitTick: () => void;
    handleRest: () => void;
    handleUseSkill: (skillId: string) => void;
}

/**
 * Hook for Smart Container action handlers
 *
 * @remarks
 * Delegates to callbacks without any business logic.
 * Used by ControlsSection to wrap game engine interactions.
 *
 * @param executor - Object with action callback functions
 * @returns Object with memoized handler callbacks
 */
export function useSmartActionHandlers(executor: ActionExecutor): SmartActionHandlers {
    const handleMove = useCallback(
        (direction: 'north' | 'south' | 'west' | 'east') => {
            executor.onMove?.(direction);
        },
        [executor]
    );

    const handleAttack = useCallback(() => {
        executor.onAttack?.();
    }, [executor]);

    const handleAction = useCallback(
        (actionId: number) => {
            executor.onAction?.(actionId);
        },
        [executor]
    );

    const handleWaitTick = useCallback(() => {
        executor.onWait?.();
    }, [executor]);

    const handleRest = useCallback(() => {
        executor.onRest?.();
    }, [executor]);

    const handleUseSkill = useCallback(
        (skillId: string) => {
            executor.onUseSkill?.(skillId);
        },
        [executor]
    );

    return {
        handleMove,
        handleAttack,
        handleAction,
        handleWaitTick,
        handleRest,
        handleUseSkill,
    };
}
