'use client';

import React, { useMemo } from 'react';
import { GameLayoutControls } from '../game-layout-controls';
import { useControlsData } from '@/hooks/use-controls-data';
import type { GameLayoutControlsProps } from '../game-layout.types';

/**
 * ControlsSection Smart Container (Memoized)
 *
 * @remarks
 * **Purpose:**
 * Smart Container managing action controls with independent re-rendering.
 * Subscribes to useControlsData hook for controls state.
 *
 * **Responsibilities:**
 * - Render context-sensitive action buttons
 * - Display action bar based on input mode
 * - Handle joystick rendering for mobile
 * - Execute action callbacks without re-rendering on other state changes
 *
 * **Data Flow:**
 * GameLayout → ControlsSection → useControlsData → renders GameLayoutControls
 *
 * **Re-render Optimization:**
 * Only re-renders when:
 * - selectedActionId changes
 * - showJoystick changes
 * - Memoized to prevent parent prop changes triggering re-render
 *
 * @param props - GameLayout control handlers and data
 * @returns React component rendering action controls
 */
export const ControlsSection = React.memo(function ControlsSection(
    props: Omit<GameLayoutControlsProps, 'isDesktop'> & { isDesktop: boolean }
) {
    // Subscribe to controls state via useControlsData hook
    // Single subscription with useShallow instead of 2 individual calls
    const { selectedActionId, showJoystick } = useControlsData();

    // Memoize handler callbacks to maintain stability
    const memoizedHandlers = useMemo(
        () => ({
            onMove: props.onMove,
            onInteract: props.onInteract,
            onUseSkill: props.onUseSkill,
            onActionClick: props.onActionClick,
            onOpenPickup: props.onOpenPickup,
            onOpenAvailableActions: props.onOpenAvailableActions,
            onOpenCustomDialog: props.onOpenCustomDialog,
            onOpenStatus: props.onOpenStatus,
            onOpenInventory: props.onOpenInventory,
            onOpenCrafting: props.onOpenCrafting,
            onOpenBuilding: props.onOpenBuilding,
            onOpenFusion: props.onOpenFusion,
            onOpenCooking: props.onOpenCooking,
        }),
        [
            props.onMove,
            props.onInteract,
            props.onUseSkill,
            props.onActionClick,
            props.onOpenPickup,
            props.onOpenAvailableActions,
            props.onOpenCustomDialog,
            props.onOpenStatus,
            props.onOpenInventory,
            props.onOpenCrafting,
            props.onOpenBuilding,
            props.onOpenFusion,
            props.onOpenCooking,
        ]
    );

    return (
        <GameLayoutControls
            {...props}
            {...memoizedHandlers}
        />
    );
});
