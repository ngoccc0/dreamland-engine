'use client';

import { useCallback, useRef } from 'react';
import { ActionHandlerDeps } from '@/hooks/actions/types';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/ui';
import { useAudio } from '@/lib/audio/useAudio';
import { createHandleInventoryActions, createHandleOfflineItemUse } from '@/hooks/actions';
import { getTranslatedText } from '@/lib/utils';
import { resolveItemDef as resolveItemDefHelper } from '@/lib/utils/item-utils';
import { generateItemEffects } from '@/core/engines/item-effects-bridge';
import { TranslatableString } from '@/core/types/game';
import { useEffectExecutor } from '@/hooks/engine';
import { useQuestActions } from '@/hooks/features/quest';

export function useInventoryHandlers(deps: ActionHandlerDeps) {
    const {
        isLoading, isGameOver, isLoaded, world, playerPosition, playerStats,
        setPlayerStats, advanceGameTime, addNarrativeEntry, customItemDefinitions,
        setWorld
    } = deps as any;

    const { t, language } = useLanguage();
    const { toast } = useToast();
    const audio = useAudio();
    const { executeEffects } = useEffectExecutor();
    const { evaluateQuestsAndAchievements } = useQuestActions();

    // Helper reuse mostly from main hook, duplicated context unfortunately unless we prop drill
    // But for now redundant creation is better than tight coupling
    const executeEffectsWithQuests = useCallback((effects: any[]) => {
        executeEffects(effects);
        try {
            // Simple quest check trigger - full implementation is in the main hook or Quest Context
            // Here we just trigger effects. Quest updates usually strictly follow state changes
            // which happen inside the handlers or via effects.
        } catch (err) { }
    }, [executeEffects]);

    const resolveItemDef = (name: string) => {
        return resolveItemDefHelper(name, customItemDefinitions);
    };

    const offlineItemUseRef = useRef<any>(null);

    const handleOfflineItemUse = useCallback((itemName: string, target: string) => {
        if (!offlineItemUseRef.current) {
            offlineItemUseRef.current = createHandleOfflineItemUse({
                resolveItemDef,
                addNarrativeEntry,
                t,
                getTranslatedText,
                playerStats,
                setPlayerStats,
                playerPosition,
                world,
                setWorld,
                advanceGameTime,
                toast,
                audio,
            });
        }
        return offlineItemUseRef.current(itemName, target);
    }, [resolveItemDef, addNarrativeEntry, t, playerStats, setPlayerStats, playerPosition, world, setWorld, advanceGameTime, toast, audio]);

    const handleItemUsed = useCallback((itemName: TranslatableString, target: 'player' | TranslatableString) => {
        if (isLoading || isGameOver || !isLoaded) return;
        const actionText = target === 'player' ? `${t('useAction')} ${t(itemName as any)}` : `${t('useOnAction', { item: t(itemName as any), target: t(target as any) })}`;
        addNarrativeEntry(actionText, 'action');

        const outcome = handleOfflineItemUse(getTranslatedText(itemName, 'en'), getTranslatedText(target, 'en'));
        if (outcome) {
            const effects = generateItemEffects(outcome);
            executeEffectsWithQuests(effects);
        }

    }, [isLoading, isGameOver, isLoaded, t, handleOfflineItemUse, addNarrativeEntry, executeEffectsWithQuests]);

    const { handleEquipItem, handleUnequipItem, handleDropItem } = createHandleInventoryActions({
        ...deps,
        t,
        toast,
        language
    });

    return {
        handleItemUsed,
        handleEquipItem,
        handleUnequipItem,
        handleDropItem
    };
}
