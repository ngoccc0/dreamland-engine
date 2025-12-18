'use client';

import { useEffect, useCallback } from 'react';
import type { Action, World } from '@/core/types/game';

// Define the types for the handlers that will be passed to this hook
type MoveHandler = (direction: "north" | "south" | "east" | "west") => void;

interface KeyboardControlsProps {
  onToggleInventory: () => void;
  onMove: MoveHandler;
  onPickUpItem: (actionId: number) => void; // Assuming pick up item action has a specific ID
  currentChunk: any; // Assuming currentChunk is needed to find the pick up action
  playerPosition: { x: number, y: number }; // Assuming player position is needed
  world: World; // Assuming world state is needed to find the pick up action
  isInventoryOpen: boolean; // To prevent actions when inventory is open
}

/**
 * Keyboard input handler for player movement and actions.
 *
 * @remarks
 * Registers keyboard event listeners and delegates to action handlers
 * for movement (arrow keys), inventory toggle (E), item pickup, etc.
 *
 * Respects game state:
 * - Disables actions when inventory is open (except E and Escape to close)
 * - Checks current chunk for available actions
 * - Validates player position before executing handlers
 *
 * @param {KeyboardControlsProps} props - Handlers and game state
 * @returns {void} Registers side-effect only (keyboard listeners)
 *
 * @example
 * useKeyboardControls({
 *   onToggleInventory: () => setInventoryOpen(!open),
 *   onMove: (dir) => handleMove(dir),
 *   onPickUpItem: (id) => handlePickup(id),
 *   currentChunk,
 *   playerPosition,
 *   world,
 *   isInventoryOpen
 * });
 */
export function useKeyboardControls({
  onToggleInventory,
  onMove,
  onPickUpItem,
  currentChunk,
  playerPosition,
  world,
  isInventoryOpen,
}: KeyboardControlsProps) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Prevent actions if inventory is open, except for closing it
    if (isInventoryOpen && event.key !== 'e' && event.key !== 'Escape') {
      return;
    }

    switch (event.key) {
      case 'e':
      case 'Escape': // Allow Escape to close inventory if open
        onToggleInventory();
        break;
      case 'w':
      case 'ArrowUp':
        onMove('north');
        break;
      case 's':
      case 'ArrowDown':
        onMove('south');
        break;
      case 'a':
      case 'ArrowLeft':
        onMove('west');
        break;
      case 'd':
      case 'ArrowRight':
        onMove('east');
        break;
      case 'q':
        // Find the first 'pick up item' action in the current chunk
        if (currentChunk && currentChunk.actions) {
          const pickUpAction = currentChunk.actions.find((action: Action) => action.textKey === 'pickUpAction_item');
          if (pickUpAction) {
            onPickUpItem(pickUpAction.id);
          }
        }
        break;
      default:
        break;
    }
  }, [onToggleInventory, onMove, onPickUpItem, currentChunk, isInventoryOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
