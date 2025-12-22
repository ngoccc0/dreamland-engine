'use client';

import React, { useMemo } from 'react';
import { GameLayoutControls } from '../game-layout-controls';
import { useControlsStore, selectSelectedAction, selectShowJoystick } from '@/store';
import type { GameLayoutControlsProps } from '../game-layout.types';

/**
 * ControlsSection Smart Container
 *
 * @remarks
 * **Purpose:**
 * Smart Container managing action controls with independent re-rendering.
 * Subscribes to controlsStore for selected actions and input mode.
 *
 * **Responsibilities:**
 * - Render context-sensitive action buttons
 * - Display action bar based on input mode
 * - Handle joystick rendering for mobile
 * - Execute action callbacks without re-rendering on other state changes
 *
 * **Data Flow:**
 * GameLayout → ControlsSection → subscribes to controlsStore → renders GameLayoutControls
 *
 * **Re-render Optimization:**
 * Only re-renders when:
 * - selectedActionId changes
 * - showJoystick changes
 * - inputMode changes
 *
 * @param props - GameLayout control handlers and data
 * @returns React component rendering action controls
 */
export function ControlsSection(props: Omit<GameLayoutControlsProps, 'isDesktop'> & { isDesktop: boolean }) {
  // Subscribe to controls state - only re-render on control changes
  const selectedActionId = useControlsStore(selectSelectedAction);
  const showJoystick = useControlsStore(selectShowJoystick);

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

  // Use selectedActionId and showJoystick to prevent unused variable warnings
  // These subscriptions enable re-renders when controls state changes
  const _unused = [selectedActionId, showJoystick];
  void _unused;

  return (
    <GameLayoutControls
      {...props}
      {...memoizedHandlers}
    />
  );
}
