'use client';

import { useCallback, useRef } from 'react';
import { ActionHandlerDeps } from '@/hooks/actions/types';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';
import { useToast } from '@/hooks/ui';
import { useAudio } from '@/lib/audio/useAudio';
import { createHandleCraftingActions, createHandleFuseItems } from '@/hooks/actions';
import { getDb } from '@/lib/core/firebase-config';
import { doc, setDoc } from 'firebase/firestore';
import { logger } from '@/lib/core/logger';
import { generateOfflineNarrative } from '@/core/engines/game/offline';
import { getEffectiveChunk } from '@/core/engines/game/weather-generation';
import { getTranslatedText, resolveItemId, ensurePlayerItemId } from '@/lib/utils';
import { resolveItemDef as resolveItemDefHelper } from '@/lib/utils/item-utils';
import { PlayerItem } from '@/core/types/game';

// NOTE: Genkit flows need to be called via API
async function callApi(path: string, payload: any) {
    const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Server error');
    return data;
}

const fuseItems = async (payload: any) => callApi('/api/fuse-items', payload);

export function useCraftingHandlers(deps: ActionHandlerDeps) {
    const {
        isLoading, isGameOver, setIsLoading, world, playerPosition, playerStats,
        weatherZones, customItemDefinitions, customItemCatalog, addNarrativeEntry,
        advanceGameTime, setPlayerStats, setCustomItemCatalog, setCustomItemDefinitions,
        gameTime
    } = deps as any;

    const { t, language } = useLanguage();
    const { settings } = useSettings();
    const { toast } = useToast();
    const audio = useAudio();

    const sStart = (settings as any).startTime ?? 0;
    const sDayDuration = (settings as any).dayDuration ?? 24000;

    const fuseRef = useRef<any>(null);

    const resolveItemDef = (name: string) => {
        return resolveItemDefHelper(name, customItemDefinitions);
    };

    const { handleCraft } = createHandleCraftingActions({
        ...deps,
        t,
        toast,
        audio
    });

    const handleFuseItems = useCallback(async (itemsToFuse: PlayerItem[]) => {
        if (!fuseRef.current) {
            fuseRef.current = createHandleFuseItems({
                isLoading, isGameOver, setIsLoading, world, playerPosition, playerStats,
                weatherZones, language, customItemDefinitions, customItemCatalog,
                addNarrativeEntry, advanceGameTime, t, toast, setPlayerStats,
                setCustomItemCatalog, setCustomItemDefinitions, getEffectiveChunk,
                generateOfflineNarrative, fuseItems, getTranslatedText, resolveItemId,
                ensurePlayerItemId, resolveItemDef, getDb, doc, setDoc, logger, gameTime, sStart, sDayDuration
            });
        }
        return fuseRef.current(itemsToFuse);
    }, [
        isLoading, isGameOver, setIsLoading, world, playerPosition, playerStats,
        weatherZones, language, customItemDefinitions, customItemCatalog,
        addNarrativeEntry, advanceGameTime, t, toast, setPlayerStats,
        setCustomItemCatalog, setCustomItemDefinitions, gameTime, sStart, sDayDuration
    ]);

    return {
        handleCraft,
        handleFuseItems
    };
}
