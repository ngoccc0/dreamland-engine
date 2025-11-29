// Extracted harvest handler.
import type { ActionHandlerDeps } from '@/hooks/use-action-handlers';
import type { CreatureDefinition } from '@/core/types/creature'; // Import CreatureDefinition
import type { PlantPartDefinition } from '@/core/types/definitions/plant-properties'; // Import PlantPartDefinition

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
    const partName = action.params?.partName as string | undefined; // New: partName for modular harvesting
    let enemy: CreatureDefinition | null = chunk.enemy;

    if (!enemy || getTranslatedText(enemy.name, 'en') !== targetName) { // Use enemy.name for consistency
      toast({ title: t('actionNotAvailableTitle'), description: t('cantHarvest'), variant: 'destructive' });
      return;
    }

    let nextPlayerStats: any = { ...playerStats };
    nextPlayerStats.items = nextPlayerStats.items || [];
    let worldWasModified = false;
    const newWorld = { ...world };
    let lootItems: any[] = [];
    let harvestSuccessNarrativeKey = 'harvestSuccess';

    // --- Handle new modular plant parts harvesting ---
    if (enemy.plantProperties && enemy.plantProperties.parts && partName) {
      const partIndex = enemy.plantProperties.parts.findIndex(p => p.name === partName);
      if (partIndex === -1) {
        toast({ title: t('actionNotAvailableTitle'), description: t('cantHarvest_partNotFound'), variant: 'destructive' });
        return;
      }

      let currentPart = { ...enemy.plantProperties.parts[partIndex] };
      if ((currentPart.currentQty || 0) <= 0) {
        toast({ title: t('cantHarvest'), description: t('cantHarvest_noMoreParts'), variant: 'destructive' });
        return;
      }

      // Check stamina cost (default 5 stamina per part harvest)
      const staminaCost = currentPart.staminaCost ?? 5;
      if ((playerStats.stamina || 0) < staminaCost) {
        toast({ title: t('cantHarvest'), description: t('cantHarvest_noStamina', { stamina: staminaCost }), variant: 'destructive' });
        return;
      }

      // Deduct stamina
      nextPlayerStats.stamina = (playerStats.stamina || 0) - staminaCost;

      // Tool check (basic for MVP, can be extended per-part)
      // For now, if enemy.harvestable defines a tool, use it for any part harvest on that enemy.
      const requiredTool = enemy.harvestable?.requiredTool; // Optional chaining for existing harvestable
      if (requiredTool) {
        const playerHasTool = (playerStats.items || []).some((item: any) => getTranslatedText(item.name, 'en') === requiredTool);
        if (!playerHasTool) {
          toast({ title: t('harvestFail_noTool'), description: t('harvestFail_noTool_desc', { tool: t(requiredTool as any), target: t(targetName as any) }), variant: 'destructive' });
          return;
        }
      }

      // Decrement part quantity
      currentPart.currentQty = (currentPart.currentQty || 0) - 1;
      const updatedParts = [...enemy.plantProperties.parts];
      updatedParts[partIndex] = currentPart;

      // Generate loot for this specific part
      (currentPart.loot || []).forEach((loot: any) => {
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

      // Update the enemy's parts
      enemy = {
        ...enemy,
        plantProperties: {
          ...enemy.plantProperties,
          parts: updatedParts,
        },
      };

      // Check if all parts are depleted, then remove the plant
      const allPartsDepleted = updatedParts.every(p => (p.currentQty || 0) <= 0);
      if (allPartsDepleted) {
        // This plant will be removed by the adaptivePlantTick usecase when all parts are depleted
        // For now, we'll just update its parts and let the tick handle removal.
        // The old harvestable.loot code used to set enemy = null immediately.
        // Here, we maintain the enemy creature to allow tick to handle its "death"
      }

      harvestSuccessNarrativeKey = 'harvestPartSuccess'; // Use a new narrative key for part harvesting

    } else if (enemy.harvestable) {
      // --- Existing full plant harvesting logic (for old harvestable types) ---
      const requiredTool = enemy.harvestable.requiredTool;
      const playerHasTool = (playerStats.items || []).some((item: any) => getTranslatedText(item.name, 'en') === requiredTool);

      if (!playerHasTool) {
        toast({ title: t('harvestFail_noTool'), description: t('harvestFail_noTool_desc', { tool: t(requiredTool as any), target: t(targetName as any) }), variant: 'destructive' });
        return;
      }

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

      // Old logic: remove enemy completely
      enemy = null;
      newWorld[`${playerPosition.x},${playerPosition.y}`]!.actions = newWorld[`${playerPosition.x},${playerPosition.y}`]!.actions.filter((a: any) => a.id !== actionId);
    } else {
      toast({ title: t('actionNotAvailableTitle'), description: t('cantHarvest'), variant: 'destructive' });
      return;
    }

    const actionText = t('harvestAction', { target: t(targetName as any), part: partName ? t(partName as any) : undefined });
    addNarrativeEntry(actionText, 'action');

    if (lootItems.length > 0) {
      const lootText = lootItems.map((l: any) => `${l.quantity} ${t(l.name as any)}`).join(', ');
      addNarrativeEntry(t(harvestSuccessNarrativeKey, { loot: lootText, target: t(targetName as any), part: partName ? t(partName as any) : undefined }), 'system');

      lootItems.forEach((lootItem: any) => {
        const existingItem = nextPlayerStats.items.find((i: any) => getTranslatedText(i.name, 'en') === getTranslatedText(lootItem.name, 'en') || i.name === lootItem.name); // Check both key and value
        if (existingItem) {
          existingItem.quantity += lootItem.quantity;
        } else {
          nextPlayerStats.items.push(ensurePlayerItemId ? ensurePlayerItemId(lootItem, customItemDefinitions, t, (context.language || 'en')) : lootItem);
        }
      });
    } else {
      addNarrativeEntry(t('harvestFail_noLoot', { target: t(targetName as any), part: partName ? t(partName as any) : undefined }), 'system');
    }

    newWorld[`${playerPosition.x},${playerPosition.y}`]!.enemy = enemy; // Update the enemy (could be null for old harvestables)
    worldWasModified = true;

    if (worldWasModified) {
      setWorld(() => newWorld);
    }

    setPlayerStats && setPlayerStats(() => nextPlayerStats);
    advanceGameTime && advanceGameTime(nextPlayerStats);
  };
}
