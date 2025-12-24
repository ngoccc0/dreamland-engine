'use client';

import { useCallback, useRef } from 'react';
import { ActionHandlerDeps } from '@/hooks/actions/types';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';
import { useToast } from '@/hooks/ui';
import { useAudio } from '@/lib/audio/useAudio';
import { createActionHelpers, createHandleMove } from '@/hooks/actions';
import { getKeywordVariations } from '@/core/data/narrative/templates';
import { generateOfflineNarrative } from '@/core/engines/game/offline';
import { getEffectiveChunk } from '@/core/engines/game/weather-generation';
import { getTranslatedText, resolveItemId } from '@/lib/utils';
import { getTemplates } from '@/lib/game/templates';
import { resolveItemDef as resolveItemDefHelper } from '@/lib/utils/item-utils';

export function useMovementHandlers(deps: ActionHandlerDeps) {
    const {
        isLoading, isGameOver, playerPosition, world, addNarrativeEntry,
        setPlayerBehaviorProfile, setPlayerPosition, playerStats, advanceGameTime,
        narrativeLogRef, activeMoveOpsRef, customItemDefinitions
    } = deps as any;

    const { t, language } = useLanguage();
    const { settings } = useSettings();
    const { toast } = useToast();
    const audio = useAudio();

    // Refs specifically for movement
    const lastMoveRef = useRef<{ biome?: string; time?: number }>({});
    const lastMoveAtRef = useRef<number>(0);
    const pickupBufferRef = useRef<{ items: Array<any>; timer?: ReturnType<typeof setTimeout> }>({ items: [] });
    const lastPickupMonologueAt = useRef(0);

    const resolveItemDef = (name: string) => {
        return resolveItemDefHelper(name, customItemDefinitions);
    };

    const handleMove = useCallback((direction: "north" | "south" | "east" | "west") => {
        // Create a fresh handler per invocation so it captures the latest state
        const actionHelpers = createActionHelpers({
            pickupBufferRef,
            lastPickupMonologueAt,
            resolveItemDef,
            t,
            language,
            addNarrativeEntry,
            audio,
            toast,
            customItemDefinitions
        });

        const { tryAddItemToInventory, flushPickupBuffer } = actionHelpers;

        const handler = createHandleMove({
            ...(deps as any),
            settings,
            audio,
            toast,
            resolveItemDef,
            lastMoveAtRef,
            lastMoveRef,
            pickupBufferRef,
            tryAddItemToInventory,
            flushPickupBuffer,
            getKeywordVariations,
            getEffectiveChunk,
            generateOfflineNarrative,
            narrativeLogRef,
            activeMoveOpsRef,
            getTranslatedText,
            getTemplates,
            t,
            language,
        });

        // Legacy support for directly attached props (if any code relies on them)
        try { (handler as any).__language = language; (handler as any).__hasT = typeof t === 'function'; } catch { }

        return (handler as any)(direction);
    }, [
        isLoading, isGameOver, playerPosition, world, addNarrativeEntry, t, settings,
        setPlayerBehaviorProfile, setPlayerPosition, playerStats, advanceGameTime,
        lastMoveRef, pickupBufferRef, narrativeLogRef, getTemplates, language,
        audio, toast, customItemDefinitions, deps
    ]);

    return {
        handleMove
    };
}
