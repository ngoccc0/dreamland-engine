'use client';

import { useCallback, useRef } from 'react';
import { ActionHandlerDeps } from '@/hooks/actions/types';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';
import { useToast } from '@/hooks/ui';
import { useAudio } from '@/lib/audio/useAudio';
import {
    createHandleInteractionActions,
    createHandleOfflineAction,
    createHandleHarvest,
    createHandleOnlineNarrative
} from '@/hooks/actions';
import { getTemplates } from '@/lib/game/templates';
import { resolveItemDef as resolveItemDefHelper } from '@/lib/utils/item-utils';
import { handleSearchAction, analyze_chunk_mood } from '@/core/engines/game/offline';
import { getEffectiveChunk } from '@/core/engines/game/weather-generation';
import { getTranslatedText, clamp, resolveItemId, ensurePlayerItemId } from '@/lib/utils';
import { rollDice, getSuccessLevel, successLevelToTranslationKey } from '@/lib/utils/dice';
import { generateHarvestEffects } from '@/core/engines/harvest-effects-bridge';
import { useEffectExecutor } from '@/hooks/engine';
import { useQuestActions } from '@/hooks/features/quest';
import { logger } from '@/lib/core/logger';
import { getDb } from '@/lib/core/firebase-config';
import { doc, setDoc } from 'firebase/firestore';

export function useWorldInteractionHandlers(deps: ActionHandlerDeps) {
    const {
        isLoading, isGameOver, isLoaded, world, playerPosition, playerStats,
        setPlayerStats, advanceGameTime, addNarrativeEntry, customItemDefinitions,
        setWorld, weatherZones, gameTime, turn, finalWorldSetup, customItemCatalog,
        narrativeLogRef, setCustomItemCatalog, setCustomItemDefinitions
    } = deps as any;
    const { worldProfile } = deps;

    const { t, language } = useLanguage();
    const { settings } = useSettings();
    const { toast } = useToast();
    const audio = useAudio();

    const { executeEffects } = useEffectExecutor();
    const { evaluateQuestsAndAchievements } = useQuestActions();

    const executeEffectsWithQuests = useCallback((effects: any[]) => {
        executeEffects(effects);
        try {
            // Silent quest evaluation trigger
        } catch (err) { }
    }, [executeEffects]);

    const sStart = (settings as any).startTime ?? 0;
    const sDayDuration = (settings as any).dayDuration ?? 24000;
    const isOnline = settings.gameMode === 'ai';

    const resolveItemDef = (name: string) => resolveItemDefHelper(name, customItemDefinitions);

    const pickupBufferRef = useRef<{ items: Array<any>; timer?: ReturnType<typeof setTimeout> }>({ items: [] });
    const offlineActionRef = useRef<any>(null);
    const harvestRef = useRef<any>(null);

    // --- Handlers ---

    const handleOnlineNarrative = useCallback((action: string, worldCtx: any, playerPosCtx: { x: number, y: number }, playerStatsCtx: any) => {
        const handler = createHandleOnlineNarrative({
            setIsLoading: deps.setIsLoading,
            logger,
            finalWorldSetup,
            settings,
            addNarrativeEntry,
            t,
            narrativeLogRef,
            weatherZones,
            gameTime,
            sStart,
            sDayDuration,
            customItemDefinitions,
            setCustomItemCatalog,
            setCustomItemDefinitions,
            getDb,
            setWorld,
            setDoc,
            doc,
            resolveItemId,
            resolveItemDef,
            setPlayerStats,
            advanceGameTime,
            toast,
            language,
            rollDice,
            getSuccessLevel,
            successLevelToTranslationKey,
            getEffectiveChunk,
            getTranslatedText,
        });
        return handler(action, worldCtx, playerPosCtx, playerStatsCtx);
    }, [
        deps.setIsLoading, finalWorldSetup, settings, addNarrativeEntry, t, narrativeLogRef,
        weatherZones, gameTime, sStart, sDayDuration, customItemDefinitions, setCustomItemCatalog,
        setCustomItemDefinitions, setWorld, setPlayerStats, advanceGameTime, toast, language
    ]);

    const handleOfflineAction = useCallback((action: any) => {
        if (!offlineActionRef.current) {
            offlineActionRef.current = createHandleOfflineAction({
                playerStats,
                addNarrativeEntry,
                t,
                getTranslatedText,
                world,
                playerPosition,
                handleSearchAction,
                language,
                customItemDefinitions,
                clamp,
                toast,
                resolveItemDef,
                ensurePlayerItemId,
                setWorld,
                setPlayerStats,
                advanceGameTime,
                turn,
                weatherZones,
                gameTime,
                getTemplates,
                pickupBufferRef,
                getEffectiveChunk,
                sStart,
                sDayDuration,
                worldProfile,
            });
        }
        return offlineActionRef.current(action);
    }, [
        playerStats, addNarrativeEntry, t, world, playerPosition, language, customItemDefinitions,
        setWorld, setPlayerStats, advanceGameTime, turn, weatherZones, gameTime, worldProfile,
        sStart, sDayDuration
    ]);

    const handleAction = useCallback((actionId: number) => {
        if (isLoading || isGameOver || !isLoaded) return;
        const chunk = world[`${playerPosition.x},${playerPosition.y}`];
        if (!chunk) return;

        const action = chunk.actions.find((a: any) => a.id === actionId);
        if (!action) {
            toast({ title: t('actionNotAvailableTitle'), description: t('actionNotAvailableDesc'), variant: 'destructive' });
            return;
        }

        const actionText = t(action.textKey, action.params);
        addNarrativeEntry(actionText, 'action');
        if (isOnline && action.textKey === 'talkToAction_npc') {
            const newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText] };
            handleOnlineNarrative(actionText, world, playerPosition, newPlayerStats);
        } else {
            handleOfflineAction(action);
        }
    }, [isLoading, isGameOver, isLoaded, world, playerPosition, playerStats, isOnline, handleOnlineNarrative, handleOfflineAction, toast, t, addNarrativeEntry]);

    const handleCustomAction = useCallback((text: string) => {
        if (!text.trim() || isLoading || isGameOver || !isLoaded) return;
        deps.setPlayerBehaviorProfile((p: any) => ({ ...p, customActions: p.customActions + 1 }));

        if (text.trim().toLowerCase() === 'analyze') {
            handleOfflineAction({ id: -1, textKey: 'analyzeAction' });
            return;
        }

        const newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), text] };
        addNarrativeEntry(text, 'action');
        if (isOnline) {
            handleOnlineNarrative(text, world, playerPosition, newPlayerStats);
        }
        else {
            addNarrativeEntry(t('customActionFail'), 'narrative');
            setPlayerStats(() => newPlayerStats);
            advanceGameTime(newPlayerStats);
        }
    }, [isLoading, isGameOver, isLoaded, deps.setPlayerBehaviorProfile, playerStats, isOnline, handleOnlineNarrative, handleOfflineAction, world, playerPosition, addNarrativeEntry, t, advanceGameTime, setPlayerStats]);

    const { handleBuild, handleRest } = createHandleInteractionActions({
        ...deps,
        t,
        toast,
        audio
    });

    const handleHarvest = useCallback((actionId: number) => {
        if (!harvestRef.current) {
            harvestRef.current = createHandleHarvest({
                isLoading, isGameOver, isLoaded, world, playerPosition, toast, t,
                addNarrativeEntry, playerStats, customItemDefinitions, advanceGameTime,
                setWorld, setPlayerStats, resolveItemDef, clamp, ensurePlayerItemId, getTranslatedText
            });
        }
        const outcome = harvestRef.current(actionId);
        if (outcome) {
            const effects = generateHarvestEffects(outcome);
            executeEffectsWithQuests(effects);
        }
    }, [
        isLoading, isGameOver, isLoaded, world, playerPosition, toast, t, addNarrativeEntry,
        playerStats, customItemDefinitions, advanceGameTime, setWorld, setPlayerStats,
        executeEffectsWithQuests
    ]);

    return {
        handleAction,
        handleCustomAction,
        handleBuild,
        handleRest,
        handleHarvest
    };
}
