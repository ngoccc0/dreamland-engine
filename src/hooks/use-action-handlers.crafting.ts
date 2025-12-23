
import { ActionHandlerDeps } from '@/hooks/actions/types';
import { resolveItemDef as resolveItemDefHelper } from '@/lib/utils/item-utils';
import { getTranslatedText } from '@/lib/utils';
import { validateRecipe } from '@/core/rules/crafting';
import { AudioActionType } from '@/core/data/audio-events';
import { CraftingOutcome, PlayerItem, TranslationKey, Recipe } from '@/core/types/game';

type CraftingHandlerDeps = ActionHandlerDeps & {
    t: (key: string | TranslationKey, params?: any) => string;
    toast: (props: any) => void;
    audio: any; // Using any for audio context to avoid circular dep on useAudio return type
};

export const createHandleCraftingActions = (deps: CraftingHandlerDeps) => {
    const {
        isLoading, isGameOver, playerStats, setPlayerStats, customItemDefinitions,
        t, toast, addNarrativeEntry, advanceGameTime, setPlayerBehaviorProfile, audio
    } = deps;

    const resolveItemDef = (name: string) => {
        return resolveItemDefHelper(name, customItemDefinitions);
    };

    const handleCraft = (recipe: Recipe, outcome: CraftingOutcome) => {
        if (isLoading || isGameOver) return;
        setPlayerBehaviorProfile((p: any) => ({ ...p, crafts: p.crafts + 1 }));

        if (!outcome.canCraft) { toast({ title: t('error'), description: t('notEnoughIngredients'), variant: "destructive" }); return; }

        // Validate using pure rule (double-check using recipe result name as key)
        const validationInventory = (playerStats.items || []).map((i: any) => ({
            id: i.id || getTranslatedText(i.name, 'en'),
            quantity: i.quantity
        }));
        const canCraft = validateRecipe(recipe.result.name as string, validationInventory);
        if (!canCraft) {
            toast({ title: t('error'), description: t('notEnoughIngredients'), variant: "destructive" });
            return;
        }

        const actionText = t('craftAction', { itemName: t(recipe.result.name as TranslationKey) });
        addNarrativeEntry(actionText, 'action');
        let updatedItems = (playerStats.items || []).map((i: any) => ({ ...i }));
        outcome.ingredientsToConsume.forEach((itemToConsume: any) => {
            const itemIndex = updatedItems.findIndex((i: PlayerItem) => getTranslatedText(i.name, 'en') === itemToConsume.name);
            if (itemIndex > -1) updatedItems[itemIndex].quantity -= itemToConsume.quantity;
        });

        let nextPlayerStats = { ...playerStats, items: updatedItems.filter((i: any) => i.quantity > 0), dailyActionLog: [...(playerStats.dailyActionLog || []), actionText] };

        if (Math.random() * 100 < outcome.chance) {
            const newInventory = [...nextPlayerStats.items];
            const resultItemIndex = newInventory.findIndex(i => getTranslatedText(i.name, 'en') === recipe.result.name);
            if (resultItemIndex > -1) newInventory[resultItemIndex].quantity += recipe.result.quantity;
            else newInventory.push({ ...(recipe.result as PlayerItem), tier: resolveItemDef(recipe.result.name)?.tier || 1, emoji: recipe.result.emoji || resolveItemDef(recipe.result.name)?.emoji || '📦' });
            nextPlayerStats.items = newInventory;

            const successKeys: TranslationKey[] = ['craftSuccess1', 'craftSuccess2', 'craftSuccess3'];
            const randomKey = successKeys[Math.floor(Math.random() * successKeys.length)];
            addNarrativeEntry(t(randomKey, { itemName: t(recipe.result.name as TranslationKey) }), 'system');

            // Emit audio for craft success (play twice in succession with 100ms delay)
            audio.playSfxForAction(AudioActionType.CRAFT_SUCCESS, {});
            setTimeout(() => {
                audio.playSfxForAction(AudioActionType.CRAFT_SUCCESS, {});
            }, 100);

            toast({ title: t('craftSuccessTitle'), description: t('craftSuccess', { itemName: t(recipe.result.name as TranslationKey) }) });
        } else {
            const failKeys: TranslationKey[] = ['craftFail1', 'craftFail2', 'craftFail3'];
            const randomKey = failKeys[Math.floor(Math.random() * failKeys.length)];
            addNarrativeEntry(t(randomKey, { itemName: t(recipe.result.name as TranslationKey) }), 'system');

            // Emit audio for craft fail (play twice in succession with 100ms delay)
            audio.playSfxForAction(AudioActionType.CRAFT_FAIL, {});
            setTimeout(() => {
                audio.playSfxForAction(AudioActionType.CRAFT_FAIL, {});
            }, 100);

            toast({ title: t('craftFailTitle'), description: t('craftFail', { itemName: t(recipe.result.name as TranslationKey) }), variant: 'destructive' });
        }
        setPlayerStats(() => nextPlayerStats);
        advanceGameTime(nextPlayerStats);
    };

    return { handleCraft };
};
