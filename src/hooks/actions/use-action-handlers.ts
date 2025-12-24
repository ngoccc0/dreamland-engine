'use client';

import { useCallback } from 'react';
import { ActionHandlerDeps } from '@/hooks/actions/types';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/ui';
import { logger } from '@/lib/core/logger';

// Import domain-specific hooks
import { useMovementHandlers } from './use-movement-handlers';
import { useCombatHandlers } from './use-combat-handlers';
import { useCraftingHandlers } from './use-crafting-handlers';
import { useInventoryHandlers } from './use-inventory-handlers';
import { useWorldInteractionHandlers } from './use-world-interaction-handlers';

// Legacy Helper for one specific case (Quest Hints) - kept minimal
// This could be moved to a useQuestHandlers hook if we want to be purist
async function callApi(path: string, payload: any) {
    const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Server error');
    return data;
}

const provideQuestHint = async (payload: any) => callApi('/api/provide-quest-hint', payload);

/**
 * Player action handlers - Aggregator Hook (Facade)
 * 
 * @remarks
 * This hook has been refactored (Dec 2025) to act as a composition layer.
 * All actual logic is delegated to domain-specific hooks in `src/hooks/actions/*.ts`.
 * 
 * @param {ActionHandlerDeps} deps - Game state
 * @returns {Object} Map of all handler functions
 */
export function useActionHandlers(deps: ActionHandlerDeps) {
    const { playerStats, setPlayerStats } = deps as any;
    const { t, language } = useLanguage();
    const { toast } = useToast();
    const isOnline = (deps as any).settings?.gameMode === 'ai';

    // 1. Movement Domain
    const { handleMove } = useMovementHandlers(deps);

    // 2. Combat Domain
    const { handleAttack, handleUseSkill } = useCombatHandlers(deps);

    // 3. Crafting Domain
    const { handleCraft, handleFuseItems } = useCraftingHandlers(deps);

    // 4. Inventory Domain
    const {
        handleItemUsed,
        handleEquipItem,
        handleUnequipItem,
        handleDropItem
    } = useInventoryHandlers(deps);

    // 5. World Interaction Domain
    const {
        handleAction,           // Generic context menu actions
        handleCustomAction,     // Text input actions
        handleBuild,
        handleRest,
        handleHarvest
    } = useWorldInteractionHandlers(deps);

    // 6. Miscellaneous / Legacy (Quest Hints)
    const handleRequestQuestHint = useCallback(async (questText: string) => {
        if (playerStats.questHints?.[questText] || !isOnline) return;

        try {
            const result = await provideQuestHint({ questText, language });
            setPlayerStats((prev: any) => ({ ...prev, questHints: { ...prev.questHints, [questText]: result.hint } }));
        } catch (error: any) {
            logger.error("Failed to get quest hint:", error);
            toast({ title: t('error'), description: t('suggestionError'), variant: "destructive" });
        }
    }, [playerStats.questHints, isOnline, language, setPlayerStats, toast, t]);

    const handleReturnToMenu = () => {
        window.location.href = '/';
    };

    const handleWaitTick = useCallback(() => {
        try {
            // Minimal wait: advance game time without changing player stats
            (deps as any).advanceGameTime(playerStats);
        } catch {
            // non-fatal
        }
    }, [deps, playerStats]);

    // Aggregate and return
    return {
        handleMove,
        handleAttack,
        handleAction,
        handleCustomAction,
        handleCraft,
        handleBuild,
        handleItemUsed,
        handleUseSkill,
        handleRest,
        handleFuseItems,
        handleRequestQuestHint,
        handleEquipItem,
        handleUnequipItem,
        handleReturnToMenu,
        handleWaitTick,
        handleDropItem,
        handleHarvest,
    };
}
