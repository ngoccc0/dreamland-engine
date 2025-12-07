// Lightweight factory to extract the online narrative handler out of the large
// `use-action-handlers.ts` hook. The context parameter is `any` to keep the
// refactor low-risk; we can tighten types later.
import type { GenerateNarrativeInput } from '@/ai/flows/generate-narrative-flow';
import type { ActionHandlerDeps } from '@/hooks/use-action-handlers';

export function createHandleOnlineNarrative(context: Partial<ActionHandlerDeps> & Record<string, any>) {
  return async (action: string, worldCtx: any, playerPosCtx: { x: number, y: number }, playerStatsCtx: any) => {
    const {
      setIsLoading, logger, finalWorldSetup, settings, addNarrativeEntry, t,
      narrativeLogRef, weatherZones, gameTime, sStart, sDayDuration,
      customItemDefinitions, setCustomItemCatalog, setCustomItemDefinitions,
      getDb, setDoc, doc, resolveItemId, resolveItemDef, setPlayerStats, setWorld, advanceGameTime,
      toast, language
    } = context as any;

    setIsLoading(true);
    const entryId = `${Date.now()}-ai-response`;
    logger.info(`[AI] Starting narrative generation for action: "${action}"`, { entryId });

    const baseChunk = worldCtx[`${playerPosCtx.x},${playerPosCtx.y}`];
    if (!baseChunk || !finalWorldSetup) { setIsLoading(false); return; }

    try {
      const { roll, range } = (context.rollDice ? context.rollDice(settings.diceType) : { roll: 0, range: [0, 0] });
      const successLevel = (context.getSuccessLevel ? context.getSuccessLevel(roll, settings.diceType) : 'Failure');
      addNarrativeEntry(t('diceRollMessage', { diceType: settings.diceType, roll, level: t((context.successLevelToTranslationKey || {})[successLevel]) }), 'system', `${Date.now()}-dice`);

      const currentChunk = (context.getEffectiveChunk ? context.getEffectiveChunk(baseChunk, weatherZones, gameTime, sStart, sDayDuration) : baseChunk);

      const surroundingChunks: any[] = [];
      if (settings.narrativeLength === 'long') {
        for (let dy = 1; dy >= -1; dy--) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const key = `${playerPosCtx.x + dx},${playerPosCtx.y + dy}`;
            const adjacentChunk = worldCtx[key];
            if (adjacentChunk && adjacentChunk.explored) {
              surroundingChunks.push(context.getEffectiveChunk ? context.getEffectiveChunk(adjacentChunk, weatherZones, gameTime, sStart, sDayDuration) : adjacentChunk);
            }
          }
        }
      }

      const recentNarrative = narrativeLogRef.current?.slice(-5).map((e: any) => e.text) || [];

      const normalizeChunkForAI = (c: any) => {
        const enemy = c.enemy ? ({ ...c.enemy, type: (context.getTranslatedText ? context.getTranslatedText(c.enemy.type ?? { en: '' }, language) : '') }) : null;
        return { ...c, enemy };
      };

      const normalizedCurrentChunk = normalizeChunkForAI(currentChunk);
      const normalizedSurrounding = surroundingChunks.length > 0 ? surroundingChunks.map(normalizeChunkForAI) : undefined;

      const input: GenerateNarrativeInput = {
        worldName: t(finalWorldSetup.worldName),
        playerAction: action,
        playerStatus: playerStatsCtx,
        currentChunk: normalizedCurrentChunk as any,
        surroundingChunks: normalizedSurrounding as any,
        recentNarrative,
        language,
        customItemDefinitions,
        diceRoll: roll,
        diceType: settings.diceType,
        diceRange: range,
        successLevel,
        aiModel: settings.aiModel,
        narrativeLength: settings.narrativeLength,
      };

      // Call the server API which runs Genkit server-side.
      const resp = await fetch('/api/narrative', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      const result = await resp.json();
      logger.info('[AI] Narrative generated successfully', { entryId, result });
      // API request completed

      // Phase 3: Pass animationMetadata from Genkit flow to narrative entries
      addNarrativeEntry(result.narrative, 'narrative', entryId, result.animationMetadata);
      if (result.systemMessage) addNarrativeEntry(result.systemMessage, 'system', `${Date.now()}-system`, result.animationMetadata);

      let finalPlayerStats: any = { ...playerStatsCtx, ...(result.updatedPlayerStatus || {}) };
      finalPlayerStats.unlockProgress = {
        kills: finalPlayerStats.unlockProgress?.kills ?? 0,
        damageSpells: finalPlayerStats.unlockProgress?.damageSpells ?? 0,
        moves: finalPlayerStats.unlockProgress?.moves ?? 0,
      };

      if (worldCtx[`${playerPosCtx.x},${playerPosCtx.y}`]?.enemy && result.updatedChunk?.enemy === null) {
        finalPlayerStats.unlockProgress = { ...finalPlayerStats.unlockProgress, kills: (finalPlayerStats.unlockProgress?.kills ?? 0) + 1 };
      }

      if (result.updatedChunk) {
        setPlayerStats(() => finalPlayerStats);
        setWorld((prev: any) => {
          const newWorld = { ...prev };
          const key = `${currentChunk.x},${currentChunk.y}`;
          const chunkToUpdate = newWorld[key];
          const updatedEnemy: any = result.updatedChunk?.enemy !== undefined ? result.updatedChunk.enemy : chunkToUpdate.enemy;
          const partial: Partial<any> | undefined = result.updatedChunk as Partial<any> | undefined;
          newWorld[key] = { ...chunkToUpdate, ...(partial || {}), enemy: updatedEnemy } as any;
          return newWorld;
        });
      }

      if (result.newlyGeneratedItem) {
        const newItem = result.newlyGeneratedItem;
        const newItemId = (resolveItemId ? resolveItemId(newItem.name, customItemDefinitions, t, language) : undefined) ?? (context.getTranslatedText ? context.getTranslatedText(newItem.name, 'en') : undefined);
        if (newItemId && !resolveItemDef(newItemId)) {
          setCustomItemCatalog((prev: any[]) => [...prev, newItem]);
          setCustomItemDefinitions((prev: any) => ({ ...prev, [newItemId]: { ...newItem } }));
          try {
            const _db = await (getDb ? getDb() : null);
            if (_db && setDoc && doc) await setDoc(doc(_db, "world-catalog", "items", "generated", newItemId), newItem);
          } catch (e) {
            // non-fatal
          }
        }
      }

      setPlayerStats(() => finalPlayerStats);
      advanceGameTime(finalPlayerStats);
    } catch (error: any) {
      logger.error("[AI] Narrative generation failed", error);
      toast({ title: t('offlineModeActive'), description: t('offlineToastDesc'), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
}
