// Extracted offline action handler. Uses a context object to avoid closing over hook state.
import type { ActionHandlerDeps } from '@/hooks/use-action-handlers';

export function createHandleOfflineAction(context: Partial<ActionHandlerDeps> & Record<string, any>) {
  return (action: any) => {
    const {
      playerStats, addNarrativeEntry, t, getTranslatedText, world, playerPosition,
      handleSearchAction, language, customItemDefinitions, clamp, toast, resolveItemDef,
      ensurePlayerItemId, setWorld, setPlayerStats, advanceGameTime, turn, weatherZones,
      gameTime, getTemplates, pickupBufferRef
    } = context as any;

    let newPlayerStats: any = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), t(action.textKey as any, action.params)] };
    newPlayerStats.items = newPlayerStats.items || [];
    newPlayerStats.quests = newPlayerStats.quests || [];
    const currentChunk = world[`${playerPosition.x},${playerPosition.y}`];
    let analysis: string | undefined = undefined;
    if (!currentChunk) return;

    const { textKey } = action;

    if (textKey === 'observeAction_enemy') {
      const enemy = currentChunk.enemy;
      if (enemy) {
        const enemyName = t(enemy.type as any);
        newPlayerStats.trackedEnemy = {
          chunkKey: `${currentChunk.x},${currentChunk.y}`,
          type: getTranslatedText(enemy.type, 'en'),
          lastSeen: turn,
        };
        addNarrativeEntry(t('observeSuccess', { enemyName }), 'system');
      }
    } else if (textKey === 'inspectPlantAction') {
      // Set flag for UI to open plant inspection modal
      const enemy = currentChunk.enemy;
      if (enemy && enemy.plantProperties?.parts) {
        newPlayerStats.inspectPlantTarget = {
          chunkKey: `${currentChunk.x},${currentChunk.y}`
        };
        addNarrativeEntry(t('inspectingPlant', { plantName: getTranslatedText(enemy.name, 'en') }), 'system');
      }
    } else if (textKey === 'talkToAction_npc') {
      const npcName = t(action.params!.npcName as any);
      const npc = currentChunk.NPCs.find((n: any) => t(n.name as any) === npcName);
      if (npc) {
        const templates = getTemplates(language);
        let npcDef: any;
        for (const terrain of Object.keys(templates)) {
          const templateNpc = templates[terrain as 'forest']?.NPCs.find((n: any) => t(n.data.name as any) === npcName);
          if (templateNpc) { npcDef = templateNpc.data; break; }
        }
        if (npcDef?.quest && npcDef.questItem) {
          const questText = t(npcDef.quest as any);
          if (newPlayerStats.quests.includes(questText)) {
            const itemInInventory = newPlayerStats.items.find((i: any) => getTranslatedText(i.name, 'en') === npcDef.questItem!.name);
            if (itemInInventory && itemInInventory.quantity >= npcDef.questItem!.quantity) {
              addNarrativeEntry(t('gaveItemToNpc', { quantity: npcDef.questItem.quantity, itemName: t(npcDef.questItem.name as any), npcName: npcName }), 'system');
              itemInInventory.quantity -= npcDef.questItem!.quantity;
              if (itemInInventory.quantity <= 0) newPlayerStats.items = newPlayerStats.items.filter((i: any) => getTranslatedText(i.name, 'en') !== npcDef!.questItem!.name);
              (npcDef.rewardItems || []).forEach((reward: any) => {
                const existingItem = newPlayerStats.items.find((i: any) => getTranslatedText(i.name, 'en') === getTranslatedText(reward.name, 'en'));
                if (existingItem) existingItem.quantity += reward.quantity;
                else newPlayerStats.items.push(ensurePlayerItemId({ ...reward }, customItemDefinitions, t, language));
              });
              newPlayerStats.quests = newPlayerStats.quests.filter((q: any) => q !== questText);
              addNarrativeEntry(t('npcQuestCompleted', { npcName: npcName }), 'narrative');
              toast({ title: t('questCompletedTitle'), description: questText });
            } else addNarrativeEntry(t('npcQuestNotEnoughItems', { npcName: npcName, needed: npcDef.questItem.quantity - (itemInInventory?.quantity || 0), itemName: t(npcDef.questItem.name as any) }), 'narrative');
          } else { newPlayerStats.quests.push(questText); addNarrativeEntry(t('npcQuestGive', { npcName: npcName, questText: questText }), 'narrative'); }
        } else addNarrativeEntry(t('npcNoQuest', { npcName: npcName }), 'narrative');
      }
    } else if (textKey === 'useItemOnNpcAction') {
      const npcName = t(action.params!.npcName as any);
      const itemName = action.params!.itemName as string;
      const npc = currentChunk.NPCs.find((n: any) => t(n.name as any) === npcName);
      if (npc && itemName === 'cvnt_essence') {
        const questText = t('floptropica_quest2');
        if (newPlayerStats.quests.includes(questText)) {
          const itemInInventory = newPlayerStats.items.find((i: any) => getTranslatedText(i.name, 'en') === 'cvnt_essence');
          if (itemInInventory && itemInInventory.quantity >= 1) {
            itemInInventory.quantity -= 1;
            if (itemInInventory.quantity <= 0) newPlayerStats.items = newPlayerStats.items.filter((i: any) => getTranslatedText(i.name, 'en') !== 'cvnt_essence');
            newPlayerStats.quests = newPlayerStats.quests.filter((q: any) => q !== questText);
            const rewardItemName = 'meme_template';
            const existingRewardItem = newPlayerStats.items.find((i: any) => getTranslatedText(i.name, 'en') === rewardItemName);
            if (existingRewardItem) existingRewardItem.quantity += 1; else {
              const rewardItemDef = resolveItemDef(rewardItemName);
              if (rewardItemDef) newPlayerStats.items.push(ensurePlayerItemId({ name: { en: rewardItemName, vi: t(rewardItemName as any) }, quantity: 1, tier: rewardItemDef.tier, emoji: rewardItemDef.emoji }, customItemDefinitions, t, language));
            }
            addNarrativeEntry(t('floptropicaQuest2Completed', { npcName: npcName }), 'narrative');
            toast({ title: t('questCompletedTitle'), description: questText });
          } else addNarrativeEntry(t('itemNotFound'), 'system');
        } else addNarrativeEntry(t('npcNoQuest', { npcName: npcName }), 'narrative');
      } else addNarrativeEntry(t('invalidAction'), 'system');
    } else if (textKey === 'exploreAction') {
      const result = handleSearchAction(currentChunk, action.id, language, t, customItemDefinitions, (range: any) => clamp(Math.floor(Math.random() * (range.max - range.min + 1)) + range.min, 1, Infinity), (context.worldProfile && context.worldProfile.spawnMultiplier) || 1);
      if (result.toastInfo) toast({ title: t(result.toastInfo.title), description: t(result.toastInfo.description, result.toastInfo.params) });
      addNarrativeEntry(result.narrative, 'narrative');
      setWorld((prev: any) => ({ ...prev, [`${playerPosition.x},${playerPosition.y}`]: result.newChunk }));
    } else if (textKey === 'pickUpAction_item') {
      const chunkKey = `${playerPosition.x},${playerPosition.y}`;
      const itemInChunk = currentChunk.items.find((i: any) => getTranslatedText(i.name, 'en') === action.params!.itemName);
      if (!itemInChunk) {
        toast({ title: t('actionNotAvailableTitle'), description: t('itemNotFoundNarrative', { itemName: t(action.params!.itemName as any) }), variant: 'destructive' });
        setWorld((prev: any) => {
          const newWorld = { ...prev };
          const chunkToUpdate = { ...newWorld[chunkKey]! };
          chunkToUpdate.actions = chunkToUpdate.actions.filter((a: any) => a.id !== action.id);
          newWorld[chunkKey] = chunkToUpdate;
          return newWorld;
        });
        return;
      }
      toast({ title: t('itemPickedUpTitle'), description: t('pickedUpItemToast', { quantity: itemInChunk.quantity, itemName: t(itemInChunk.name as any) }) });
      const itemInInventory = newPlayerStats.items.find((i: any) => getTranslatedText(i.name, 'en') === getTranslatedText(itemInChunk.name, 'en'));
      if (itemInInventory) itemInInventory.quantity += itemInChunk.quantity; else newPlayerStats.items.push(ensurePlayerItemId({ ...itemInChunk }, customItemDefinitions, t, language));
      try {
        const resolvedDef = resolveItemDef(getTranslatedText(itemInChunk.name, 'en'));
        const senseKey = resolvedDef?.senseEffect?.keywords?.[0] || undefined;
        pickupBufferRef.current.items.push({ name: itemInChunk.name, quantity: itemInChunk.quantity || 1, senseKey, emoji: itemInChunk.emoji });
        if (!pickupBufferRef.current.timer) pickupBufferRef.current.timer = setTimeout(() => {
          // flush handled by main hook's flushPickupBuffer
        }, 250) as any;
      } catch { addNarrativeEntry(t('pickedUpItemNarrative', { quantity: itemInChunk.quantity, itemName: t(itemInChunk.name as any) }), 'narrative'); }
      setWorld((prev: any) => {
        const newWorld = { ...prev };
        const chunkToUpdate = { ...newWorld[chunkKey]! };
        chunkToUpdate.items = chunkToUpdate.items.filter((i: any) => getTranslatedText(i.name, 'en') !== getTranslatedText(itemInChunk.name, 'en'));
        chunkToUpdate.actions = chunkToUpdate.actions.filter((a: any) => a.id !== action.id);
        newWorld[chunkKey] = chunkToUpdate;
        return newWorld;
      });
    } else if (textKey === 'listenToSurroundingsAction') {
      const directions = [{ dx: 0, dy: 1, dir: 'North' }, { dx: 0, dy: -1, dir: 'South' }, { dx: 1, dy: 0, dir: 'East' }, { dx: -1, dy: 0, dir: 'West' }];
      let heardSomething = false;
      for (const dir of directions) {
        const checkPos = { x: playerPosition.x + dir.dx, y: playerPosition.y + dir.dy };
        const chunkKey = `${checkPos.x},${checkPos.y}`;
        if (world[chunkKey] && world[chunkKey].enemy) { addNarrativeEntry(t('listenHearSomething', { direction: t(`direction${dir.dir}` as any), sound: t('enemySoundGeneric') }), 'narrative'); heardSomething = true; break; }
      }
      if (!heardSomething) {
        let hintGiven = false;
        for (const dir of directions) {
          const biomeCheckPos = { x: playerPosition.x + dir.dx * 3, y: playerPosition.y + dir.dy * 3 };
          const biomeKey = `${biomeCheckPos.x},${biomeCheckPos.y}`;
          const adjacentChunk = world[biomeKey];
          if (adjacentChunk && adjacentChunk.terrain !== currentChunk.terrain) {
            const biomeSoundKey = `biomeSound_${adjacentChunk.terrain}` as any;
            const sound = t(biomeSoundKey);
            if (sound !== biomeSoundKey) { addNarrativeEntry(t('listenHearBiome', { direction: t(`direction${dir.dir}` as any), sound }), 'narrative'); hintGiven = true; break; }
          }
        }
        if (!hintGiven) addNarrativeEntry(t('listenHearNothing'), 'narrative');
      }
    } else if (textKey === 'analyzeAction') {
      const chunk = context.getEffectiveChunk(currentChunk, weatherZones, gameTime, context.sStart, context.sDayDuration);
      analysis = `[Analysis Report]\nCoordinates: (${chunk.x}, ${chunk.y})\nRegion ID: ${chunk.regionId}\nTerrain: ${t(chunk.terrain as any)}\nTravel Cost: ${chunk.travelCost}\n\nEnvironmental Factors:\n- Temperature: ${chunk.temperature?.toFixed(1)}°C\n- Moisture: ${chunk.moisture}/100\n- Light Level: ${chunk.lightLevel}/100\n- Danger Level: ${chunk.dangerLevel}/100\n- Explorability: ${chunk.explorability.toFixed(1)}/100\n- Magic Affinity: ${chunk.magicAffinity}/100\n- Human Presence: ${chunk.humanPresence}/100\n- Predator Presence: ${chunk.predatorPresence}/100\n- Vegetation Density: ${chunk.vegetationDensity}/100\n- Soil Type: ${t(chunk.soilType as any)}\n- Wind Level: ${chunk.windLevel?.toFixed(1) ?? 'N/A'}/100\n\nEntities:\n- Items: ${chunk.items.map((i: any) => t(i.name) + ` (x${i.quantity})`).join(', ') || 'None'}\n- NPCs: ${chunk.NPCs.map((n: any) => t(n.name)).join(', ') || 'None'}\n- Structures: ${chunk.structures.map((s: any) => t(s.name)).join(', ') || 'None'}`;
    }

    addNarrativeEntry(analysis || '', 'system');
    setPlayerStats(() => newPlayerStats);
    advanceGameTime(newPlayerStats);
  };
}
