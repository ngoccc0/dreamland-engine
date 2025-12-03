// Extracted item use handler (offline). Uses a context object for dependencies.
import type { ActionHandlerDeps } from '@/hooks/use-action-handlers';

export function createHandleOfflineItemUse(context: Partial<ActionHandlerDeps> & Record<string, any>) {
  return (itemName: string, target: string) => {
    const { resolveItemDef, addNarrativeEntry, t, getTranslatedText, playerStats, setPlayerStats, playerPosition, world, setWorld, advanceGameTime, toast, audio } = context as any;
    if (!itemName) return;
    const itemDef = resolveItemDef ? resolveItemDef(itemName) : undefined;
    if (!itemDef) return;

    let newPlayerStats: any = JSON.parse(JSON.stringify(playerStats || {}));
    newPlayerStats.items = newPlayerStats.items || [];
    newPlayerStats.pets = newPlayerStats.pets || [];
    newPlayerStats.skills = newPlayerStats.skills || [];
    const itemIndex = newPlayerStats.items.findIndex((i: any) => getTranslatedText ? getTranslatedText(i.name, 'en') === itemName : false);

    if (itemIndex === -1) {
      addNarrativeEntry(t('itemNotFound'), 'system');
      return;
    }

    const key = `${playerPosition.x},${playerPosition.y}`;
    const currentChunk = world[key];
    if (!currentChunk) return;

    let narrativeResult: any = { itemName, target };
    let itemWasConsumed = false;
    let finalWorldUpdate: any = null;

    if (target === 'player') {
      if (!itemDef.effects.length) {
        addNarrativeEntry(t('itemNoEffect', { item: t(itemName) }), 'system');
        return;
      }
      itemWasConsumed = true;
      try { audio?.playSfx('Spell_00'); } catch { }
      let effectDescriptions: string[] = [];
      itemDef.effects.forEach((effect: any) => {
        const amt = effect.amount ?? 0;
        if (effect.type === 'HEAL') {
          const old = newPlayerStats.hp || 0;
          newPlayerStats.hp = Math.min(100, (newPlayerStats.hp || 0) + amt);
          if (newPlayerStats.hp > old) effectDescriptions.push(t('itemHealEffect', { amount: newPlayerStats.hp - old }));
        }
        if (effect.type === 'RESTORE_STAMINA') {
          const old = newPlayerStats.stamina || 0;
          newPlayerStats.stamina = Math.min(100, (newPlayerStats.stamina || 0) + amt);
          if (newPlayerStats.stamina > old) effectDescriptions.push(t('itemRestoreStaminaEffect', { amount: newPlayerStats.stamina - old }));
        }
        if (effect.type === 'RESTORE_MANA') {
          const old = newPlayerStats.mana || 0;
          newPlayerStats.mana = Math.min(100, (newPlayerStats.mana || 0) + amt);
          if (newPlayerStats.mana > old) effectDescriptions.push(t('itemRestoreManaEffect', { amount: newPlayerStats.mana - old }));
        }
        if (effect.type === 'RESTORE_HUNGER') {
          const old = newPlayerStats.hunger || 0;
          newPlayerStats.hunger = Math.max(0, (newPlayerStats.hunger || 0) - amt);
          if (newPlayerStats.hunger < old) effectDescriptions.push(t('itemRestoreHungerEffect', { amount: old - newPlayerStats.hunger }));
        }
      });
      narrativeResult.wasUsed = effectDescriptions.length > 0;
      narrativeResult.effectDescription = effectDescriptions.join(', ');

      // Add narrative entry with effect feedback
      if (narrativeResult.wasUsed && narrativeResult.effectDescription) {
        addNarrativeEntry(`${t(itemName)}: ${narrativeResult.effectDescription}`, 'system');
      }
    }

    // Apply farming/tool/seed logic simplified here; original file contains full behavior.
    if (finalWorldUpdate) setWorld((prev: any) => ({ ...prev, ...finalWorldUpdate }));

    if (itemWasConsumed) {
      newPlayerStats.items[itemIndex].quantity -= 1;
    }

    newPlayerStats.items = newPlayerStats.items.filter((i: any) => i.quantity > 0);
    setPlayerStats(() => newPlayerStats);
    advanceGameTime(newPlayerStats);
  };
}
