
import { ActionHandlerDeps } from '@/hooks/actions/types';
import { getTranslatedText } from '@/lib/utils';
import { AudioActionType } from '@/core/data/audio-events';
import { PlayerItem, TranslationKey } from '@/core/types/game';

type InteractionHandlerDeps = ActionHandlerDeps & {
    t: (key: string | TranslationKey, params?: any) => string;
    toast: (props: any) => void;
    audio: any;
};

export const createHandleInteractionActions = (deps: InteractionHandlerDeps) => {
    const {
        isLoading, isGameOver, playerStats, setPlayerStats, buildableStructures,
        world, playerPosition, setWorld, addNarrativeEntry, advanceGameTime, t, toast, audio
    } = deps;

    const handleBuild = (structureName: string) => {
        if (isLoading || isGameOver) return;

        const currentChunk = world[`${playerPosition.x},${playerPosition.y}`];
        if (currentChunk?.structures.length > 0) {
            toast({ title: t('structureLimitTitle'), description: t('structureLimitDesc'), variant: "destructive" });
            return;
        }

        const structureToBuild = buildableStructures[structureName];
        if (!structureToBuild?.buildable) return;

        const buildStaminaCost = 15;
        if ((playerStats.stamina ?? 0) < buildStaminaCost) { toast({ title: t('notEnoughStamina'), description: t('notEnoughStaminaDesc', { cost: buildStaminaCost, current: (playerStats.stamina ?? 0).toFixed(0) }), variant: "destructive" }); return; }

        const inventoryMap = new Map((playerStats.items || []).map((item: any) => [getTranslatedText(item.name, 'en'), item.quantity]));
        if (!structureToBuild.buildCost?.every((cost: any) => (inventoryMap.get(cost.name) || 0) >= cost.quantity)) { toast({ title: t('notEnoughIngredients'), variant: "destructive" }); return; }

        const actionText = t('buildConfirm', { structureName: t(structureName as TranslationKey) });
        addNarrativeEntry(actionText, 'action');
        let updatedItems = (playerStats.items || []).map((i: any) => ({ ...i }));
        structureToBuild.buildCost?.forEach((cost: any) => { updatedItems.find((i: PlayerItem) => getTranslatedText(i.name, 'en') === cost.name)!.quantity -= cost.quantity; });

        const nextPlayerStats = { ...playerStats, items: updatedItems.filter((item: any) => item.quantity > 0), stamina: playerStats.stamina - buildStaminaCost, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText] };

        const key = `${playerPosition.x},${playerPosition.y}`;
        setWorld((prev: any) => {
            const newWorld = { ...prev };
            const chunkToUpdate = { ...newWorld[key]! };
            const newStructure = { name: structureToBuild.name, description: t(structureToBuild.description as TranslationKey), emoji: structureToBuild.emoji, providesShelter: structureToBuild.providesShelter, restEffect: structureToBuild.restEffect, heatValue: structureToBuild.heatValue };
            chunkToUpdate.structures = [...(chunkToUpdate.structures || []), newStructure];
            newWorld[key] = chunkToUpdate;
            return newWorld;
        });

        addNarrativeEntry(t('builtStructure', { structureName: t(structureName as TranslationKey) }), 'system');
        setPlayerStats(() => nextPlayerStats);
        advanceGameTime(nextPlayerStats);
    };

    const handleRest = () => {
        if (isLoading || isGameOver) return;
        const shelter = world[`${playerPosition.x},${playerPosition.y}`]?.structures.find((s: any) => s.restEffect);
        if (!shelter?.restEffect) { toast({ title: t('cantRestTitle'), description: t('cantRestDesc') }); return; }

        audio.playSfxForAction(AudioActionType.REST_ENTER, {});

        const actionText = t('restInShelter', { shelterName: t(shelter.name as TranslationKey) });
        addNarrativeEntry(actionText, 'action');

        const oldStats = { ...playerStats };
        const newHp = Math.min(100, oldStats.hp + shelter.restEffect.hp);
        const newStamina = Math.min(100, oldStats.stamina + shelter.restEffect.stamina);
        const newTemp = 37;

        let restoredParts: string[] = [];
        if (newHp > oldStats.hp) {
            restoredParts.push(t('restHP', { amount: newHp - oldStats.hp }));
        }
        if (newStamina > oldStats.stamina) {
            restoredParts.push(t('restStamina', { amount: (newStamina - oldStats.stamina).toFixed(0) }));
        }

        if (restoredParts.length > 0) {
            addNarrativeEntry(t('restSuccess', { restoration: restoredParts.join(t('andConnector')) }), 'system');
        } else {
            addNarrativeEntry(t('restNoEffect'), 'system');
        }

        if (oldStats.bodyTemperature !== newTemp) {
            addNarrativeEntry(t('restSuccessTemp'), 'system');
        }

        const nextPlayerStats = { ...playerStats, hp: newHp, stamina: newStamina, bodyTemperature: newTemp, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText] };
        setPlayerStats(() => nextPlayerStats);
        advanceGameTime(nextPlayerStats);
    };

    return { handleBuild, handleRest };
};
