'use client';

import { useCallback, useRef } from 'react';
import { ActionHandlerDeps } from '@/hooks/actions/types';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';
import { useToast } from '@/hooks/ui';
import { useAudio } from '@/lib/audio/useAudio';
import {
    createHandleCombatActions,
    createHandleOfflineAttack,
    createHandleOfflineSkillUse
} from '@/hooks/actions';
import { getTemplates } from '@/lib/game/templates';
import { resolveItemDef as resolveItemDefHelper } from '@/lib/utils/item-utils';
import { generateOfflineActionNarrative } from '@/core/engines/game/offline';
import { getEffectiveChunk } from '@/core/engines/game/weather-generation';
import { getTranslatedText } from '@/lib/utils';
import { rollDice, getSuccessLevel, successLevelToTranslationKey } from '@/lib/utils/dice';
import { generateSkillEffects } from '@/core/engines/skill-effects-bridge';
import { useEffectExecutor, useActionTracker } from '@/hooks/engine';
import { useQuestActions } from '@/hooks/features/quest';
import { EventDeduplicationGuard, type DeduplicationBuffer } from '@/core/engines/event-deduplication/guard';

export function useCombatHandlers(deps: ActionHandlerDeps) {
    const {
        isLoading, isGameOver, isLoaded, setPlayerBehaviorProfile, world, playerPosition,
        addNarrativeEntry, playerStats, setPlayerStats, weatherZones, gameTime,
        advanceGameTime, setWorld, customItemDefinitions,
        statistics, setStatistics, recordHarvestingAction, turn
    } = deps as any;

    const { t, language } = useLanguage();
    const { settings } = useSettings();
    const { toast } = useToast();
    const audio = useAudio();

    const { executeEffects } = useEffectExecutor();
    const { evaluateQuestsAndAchievements } = useQuestActions();

    // NOTE: This logic is duplicated in multiple sub-hooks. 
    // Ideally, `executeEffectsWithQuests` should be a standalone hook 
    // or passed down from a context to avoid this repetition.
    const executeEffectsWithQuests = useCallback((effects: any[]) => {
        executeEffects(effects);
        try {
            const questState = {
                playerId: 'player',
                timestamp: new Date(),
                turnCount: turn || 0,
                currentChunkX: playerPosition.x,
                currentChunkY: playerPosition.y,
                activeQuests: deps.activeQuests || [],
                unlockedAchievements: deps.unlockedAchievements || [],
            };

            // We perform a "dry run" or reactive update here if needed, 
            // but most quest logic is event-driven by pure state changes now.
            const { newState, effects: questEffects } = evaluateQuestsAndAchievements(questState);
            if (questEffects && questEffects.length > 0) {
                executeEffects(questEffects);
            }
        } catch (err) { }
    }, [executeEffects, evaluateQuestsAndAchievements, deps, turn, playerPosition]);

    const sStart = (settings as any).startTime ?? 0;
    const sDayDuration = (settings as any).dayDuration ?? 24000;

    const resolveItemDef = (name: string) => resolveItemDefHelper(name, customItemDefinitions);

    const offlineSkillRef = useRef<any>(null);
    const dedupBufferRef = useRef<DeduplicationBuffer>(EventDeduplicationGuard.createDeduplicationBuffer());

    const handleOfflineAttack = useCallback(() => {
        const handler = createHandleOfflineAttack({
            playerPosition,
            world,
            addNarrativeEntry,
            t,
            logger: console, // Fallback if logger not in deps, though it usually is
            getEffectiveChunk,
            weatherZones,
            gameTime,
            sStart,
            sDayDuration,
            rollDice,
            getSuccessLevel,
            settings,
            successLevelToTranslationKey,
            setPlayerStats,
            advanceGameTime,
            setWorld,
            getTemplates,
            language,
            resolveItemDef,
            playerStats,
            generateOfflineActionNarrative,
            getTranslatedText,
            statistics,
            setStatistics,
            recordHarvestingAction,
            turn,
        });
        return handler();
    }, [
        playerPosition, world, addNarrativeEntry, t, getEffectiveChunk, weatherZones, gameTime,
        sStart, sDayDuration, settings, setPlayerStats, advanceGameTime, setWorld,
        getTemplates, language, playerStats, statistics, setStatistics, recordHarvestingAction, turn
    ]);

    const { handleAttack } = createHandleCombatActions({
        ...(deps as any),
        isLoading,
        isGameOver,
        isLoaded,
        setPlayerBehaviorProfile,
        world,
        playerPosition,
        addNarrativeEntry,
        t,
        playerStats,
        handleOfflineAttack, // Pass the local handler
        setPlayerStats,
        audio,
        executeEffectsWithQuests,
        dedupBuffer: dedupBufferRef.current,
    });

    const handleOfflineSkillUse = useCallback((skillName: string) => {
        if (!offlineSkillRef.current) {
            offlineSkillRef.current = createHandleOfflineSkillUse({
                playerStats,
                addNarrativeEntry,
                t,
                rollDice,
                settings,
                getSuccessLevel,
                getTranslatedText,
                world,
                playerPosition,
                setWorld,
                setPlayerStats,
                advanceGameTime,
                generateOfflineActionNarrative,
                language,
                successLevelToTranslationKey,
            });
        }
        return offlineSkillRef.current(skillName);
    }, [playerStats, addNarrativeEntry, t, settings, world, playerPosition, setWorld, setPlayerStats, advanceGameTime, language]);

    const handleUseSkill = useCallback((skillName: string) => {
        if (isLoading || isGameOver || !isLoaded) return;
        const actionText = `${t('useSkillAction')} ${skillName}`;
        addNarrativeEntry(actionText, 'action');

        const outcome = handleOfflineSkillUse(skillName);
        if (outcome) {
            const effects = generateSkillEffects(outcome);
            executeEffectsWithQuests(effects);
        }
    }, [isLoading, isGameOver, isLoaded, t, handleOfflineSkillUse, addNarrativeEntry, executeEffectsWithQuests]);

    return {
        handleAttack,
        handleUseSkill,
        handleOfflineAttack // Exposed for completeness if needed by other components
    };
}
