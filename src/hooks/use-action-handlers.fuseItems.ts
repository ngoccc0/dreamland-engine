// Extracted fuse items handler.
import type { ActionHandlerDeps } from '@/hooks/use-action-handlers';

export function createHandleFuseItems(context: Partial<ActionHandlerDeps> & Record<string, any>) {
  return async (itemsToFuse: any[]) => {
    const {
      isLoading, isGameOver, setIsLoading, world, playerPosition, playerStats,
      weatherZones, language, customItemDefinitions, customItemCatalog,
      addNarrativeEntry, advanceGameTime, t, toast, setPlayerStats,
      setCustomItemCatalog, setCustomItemDefinitions, getEffectiveChunk,
      generateOfflineNarrative, fuseItems, getTranslatedText, resolveItemId,
      ensurePlayerItemId, resolveItemDef, getDb, doc, setDoc, logger
    } = context as any;

    if (isLoading || isGameOver) return;
    setIsLoading && setIsLoading(true);

    const baseChunk = world[`${playerPosition.x},${playerPosition.y}`];
    if (!baseChunk) { setIsLoading && setIsLoading(false); return; }

    const effectiveChunk = getEffectiveChunk ? getEffectiveChunk(baseChunk, weatherZones, context.gameTime, context.sStart, context.sDayDuration) : baseChunk;
    const weather = weatherZones?.[effectiveChunk.regionId]?.currentWeather;
    let successChanceBonus = playerStats.persona === 'artisan' ? 10 : 0;
    let elementalAffinity: any = 'none';
    let chaosFactor = effectiveChunk.magicAffinity;

    if (weather?.exclusive_tags?.includes('storm')) { successChanceBonus += 5; elementalAffinity = 'electric'; }
    if (weather?.exclusive_tags?.includes('heat')) elementalAffinity = 'fire';
    if (effectiveChunk.dangerLevel > 80) { successChanceBonus -= 5; chaosFactor += 20; }

    const actionText = t('fuseAction', { items: itemsToFuse.map((i: any) => t(i.name as any)).join(', ') });
    addNarrativeEntry(actionText, 'action');
    let newItems = (playerStats.items || []).map((i: any) => ({ ...i }));
    itemsToFuse.forEach((item: any) => { newItems.find((i: any) => getTranslatedText(i.name, 'en') === getTranslatedText(item.name, 'en'))!.quantity -= 1; });
    let nextPlayerStats = { ...playerStats, items: newItems.filter((i: any) => i.quantity > 0), dailyActionLog: [...(playerStats.dailyActionLog || []), actionText] };
    setPlayerStats && setPlayerStats(() => nextPlayerStats);

    try {
      const normalizeChunkForAI = (c?: any) => {
        if (!c) return null;
        const enemy = c.enemy ? { ...c.enemy, type: getTranslatedText(c.enemy.type ?? { en: '' }, language) } : null;
        return { ...c, enemy };
      };

      const normalizedEffectiveChunk = normalizeChunkForAI(effectiveChunk);

      const result = await fuseItems({
        itemsToFuse, playerPersona: playerStats.persona, currentChunk: normalizedEffectiveChunk,
        environmentalContext: { biome: effectiveChunk.terrain, weather: t(weather?.name as any) || 'clear' },
        environmentalModifiers: { successChanceBonus, elementalAffinity, chaosFactor: Math.max(0, Math.min(100, chaosFactor)) },
        language, customItemDefinitions, fullItemCatalog: customItemCatalog,
      });

      addNarrativeEntry(result.narrative, 'narrative');

      if (result.resultItem) {
        nextPlayerStats = { ...nextPlayerStats, items: [...nextPlayerStats.items] };
        const resultItemId = resolveItemId ? resolveItemId(result.resultItem.name, customItemDefinitions, t, language) ?? getTranslatedText(result.resultItem.name, 'en') : getTranslatedText(result.resultItem.name, 'en');
        const existingItem = nextPlayerStats.items.find((i: any) => i.id === resultItemId || getTranslatedText(i.name, 'en') === resultItemId);
        if (existingItem) {
          existingItem.quantity += result.resultItem!.baseQuantity.min;
        } else {
          const itemToAdd: any = {
            name: result.resultItem.name,
            quantity: result.resultItem.baseQuantity.min,
            tier: result.resultItem.tier,
            emoji: result.resultItem.emoji,
            id: resultItemId
          };
          nextPlayerStats.items.push(ensurePlayerItemId ? ensurePlayerItemId(itemToAdd, customItemDefinitions, t, language) : itemToAdd);
        }

        if (!(resolveItemDef && resolveItemDef(resultItemId))) {
          const newItem = result.resultItem;
          setCustomItemCatalog && setCustomItemCatalog((prev: any) => [...(prev || []), newItem]);
          setCustomItemDefinitions && setCustomItemDefinitions((prev: any) => ({ ...(prev || {}), [resultItemId]: { ...newItem } }));
          try {
            const _db = await (getDb ? getDb() : null);
            if (_db && doc && setDoc) {
              await setDoc(doc(_db, "world-catalog", "items", "generated", resultItemId), newItem);
            }
          } catch {
            // non-fatal
          }
        }
      }

      setPlayerStats && setPlayerStats(() => nextPlayerStats);
      advanceGameTime && advanceGameTime(nextPlayerStats);
    } catch (error: any) {
      logger && logger.error("AI Fusion failed:", error);
      toast && toast({ title: t('error'), description: t('fusionError'), variant: "destructive" });
      setPlayerStats && setPlayerStats(() => nextPlayerStats);
      advanceGameTime && advanceGameTime(nextPlayerStats);
    } finally {
      setIsLoading && setIsLoading(false);
    }
  };
}
