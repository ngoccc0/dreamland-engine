// Extracted harvest handler.
import type { ActionHandlerDeps } from '@/hooks/use-action-handlers';

export function createHandleHarvest(context: Partial<ActionHandlerDeps> & Record<string, any>) {
  return (actionId: number) => {
    const {
      isLoading, isGameOver, isLoaded, world, playerPosition, toast, t,
      addNarrativeEntry, playerStats, customItemDefinitions, advanceGameTime,
      setWorld, setPlayerStats, resolveItemDef, clamp, ensurePlayerItemId, getTranslatedText
    } = context as any;

    if (isLoading || isGameOver || !isLoaded) return;
    const chunk = world[`${playerPosition.x},${playerPosition.y}`];
    if (!chunk) return;

    const action = chunk.actions.find((a: any) => a.id === actionId);
    if (!action) {
      toast({ title: t('actionNotAvailableTitle'), description: t('actionNotAvailableDesc'), variant: 'destructive' });
      return;
    }

    const targetName = action.params?.targetName as string;
    const enemy = chunk.enemy;
    if (!enemy || getTranslatedText(enemy.type, 'en') !== targetName || !enemy.harvestable) {
      toast({ title: t('actionNotAvailableTitle'), description: t('cantHarvest'), variant: 'destructive' });
      return;
    }

    const requiredTool = enemy.harvestable.requiredTool;
    const playerHasTool = (playerStats.items || []).some((item: any) => getTranslatedText(item.name, 'en') === requiredTool);

    if (!playerHasTool) {
      toast({ title: t('harvestFail_noTool'), description: t('harvestFail_noTool_desc', { tool: t(requiredTool as any), target: t(targetName as any) }), variant: 'destructive' });
      return;
    }

    const actionText = t('harvestAction', { target: t(targetName as any) });
    addNarrativeEntry(actionText, 'action');

    let nextPlayerStats: any = { ...playerStats };
    nextPlayerStats.items = nextPlayerStats.items || [];
    let worldWasModified = false;
    const newWorld = { ...world };

    const lootItems: any[] = [];
    (enemy.harvestable.loot || []).forEach((loot: any) => {
      if (Math.random() < loot.chance) {
        const itemDef = resolveItemDef ? resolveItemDef(loot.name) : undefined;
        if (itemDef) {
          lootItems.push({
            name: itemDef.name,
            description: t(itemDef.description as any),
            tier: itemDef.tier,
            emoji: itemDef.emoji,
            quantity: clamp(Math.floor(Math.random() * (loot.quantity.max - loot.quantity.min + 1)) + loot.quantity.min, 1, Infinity)
          });
        }
      }
    });

    if (lootItems.length > 0) {
      const lootText = lootItems.map((l: any) => `${l.quantity} ${t(l.name as any)}`).join(', ');
      addNarrativeEntry(t('harvestSuccess', { loot: lootText, target: t(targetName as any) }), 'system');

      lootItems.forEach((lootItem: any) => {
        const existingItem = nextPlayerStats.items.find((i: any) => getTranslatedText(i.name, 'en') === getTranslatedText(lootItem.name, 'en'));
        if (existingItem) {
          existingItem.quantity += lootItem.quantity;
        } else {
          nextPlayerStats.items.push(ensurePlayerItemId ? ensurePlayerItemId(lootItem, customItemDefinitions, t, (context.language || 'en')) : lootItem);
        }
      });
    } else {
      addNarrativeEntry(t('harvestFail_noLoot', { target: t(targetName as any) }), 'system');
    }

    newWorld[`${playerPosition.x},${playerPosition.y}`]!.enemy = null;
    newWorld[`${playerPosition.x},${playerPosition.y}`]!.actions = newWorld[`${playerPosition.x},${playerPosition.y}`]!.actions.filter((a: any) => a.id !== actionId);
    worldWasModified = true;

    if (worldWasModified) {
      setWorld(() => newWorld);
    }

    setPlayerStats && setPlayerStats(() => nextPlayerStats);
    advanceGameTime && advanceGameTime(nextPlayerStats);
  };
}
