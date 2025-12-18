/**
 * Cooking with Inventory Manager
 *
 * @remarks
 * Wrapper component that delegates to CookingWorkspace.
 * This maintains backward compatibility while using the new unified workspace
 * approach (responsive, optimistic UI, soft-lock, etc).
 */

'use client';

import React from 'react';
import type { GameState } from '@/core/domain/gamestate';
import type { ItemDefinition } from '@/core/types/definitions/item';
import { CookingWorkspace } from './cooking-workspace';

export interface CookingWithInventoryManagerProps {
    isOpen: boolean;
    onClose: () => void;
    gameState: GameState;
    itemDefinitions: Record<string, ItemDefinition>;
    onCookSuccess?: (updatedGameState: GameState) => void;
    onUseItem?: (itemName: any, target: any) => void;
    onEquipItem?: (itemName: string) => void;
    onDropItem?: (itemName: string, quantity?: number) => void;
}

export function CookingWithInventoryManager({
    isOpen,
    onClose,
    gameState,
    itemDefinitions,
    onCookSuccess,
    onUseItem,
    onEquipItem,
    onDropItem,
}: CookingWithInventoryManagerProps) {
    // Delegate to CookingWorkspace (new unified responsive UI)
    return (
        <CookingWorkspace
            isOpen={isOpen}
            onClose={onClose}
            gameState={gameState}
            itemDefinitions={itemDefinitions}
            onCookSuccess={onCookSuccess}
            onUseItem={onUseItem}
            onEquipItem={onEquipItem}
            onDropItem={onDropItem}
        />
    );
}
