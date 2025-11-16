// Extracted offline attack handler.
import type { ActionHandlerDeps } from '@/hooks/use-action-handlers';

export function createHandleOfflineAttack(context: Partial<ActionHandlerDeps> & Record<string, any>) {
  return () => {
    const { playerPosition, world, addNarrativeEntry, t, logger, getEffectiveChunk, weatherZones, gameTime, sStart, sDayDuration, rollDice, getSuccessLevel, setPlayerStats, advanceGameTime, setWorld, getTemplates, language, resolveItemDef } = context as any;
    const key = `${playerPosition.x},${playerPosition.y}`;
    const baseChunk = world[key];
    if (!baseChunk || !baseChunk.enemy) { addNarrativeEntry(t('noTarget'), 'system'); return; }

    logger.debug('[Offline] Starting attack sequence', { playerPosition, enemy: baseChunk.enemy });
    const currentChunk = getEffectiveChunk(baseChunk, weatherZones, gameTime, sStart, sDayDuration);

    const { roll } = rollDice ? rollDice(context.settings?.diceType) : { roll: 0 };
    const successLevel = getSuccessLevel ? getSuccessLevel(roll, context.settings?.diceType) : 'Failure';
    addNarrativeEntry(t('diceRollMessage', { diceType: context.settings?.diceType, roll, level: t((context.successLevelToTranslationKey || {})[successLevel]) }), 'system');

    let playerDamage = 0;
    const damageMultiplier = successLevel === 'CriticalFailure' ? 0 : successLevel === 'Failure' ? 0 : successLevel === 'GreatSuccess' ? 1.5 : successLevel === 'CriticalSuccess' ? 2.0 : 1.0;
    if (damageMultiplier > 0) {
      let playerDamageModifier = 1.0;
      if ((currentChunk.lightLevel ?? 0) < -3) { playerDamageModifier *= 0.8; }
      if ((currentChunk.moisture ?? 0) > 8) { playerDamageModifier *= 0.9; }
      let playerBaseDamage = (context.playerStats?.attributes?.physicalAttack ?? 0) + (context.playerStats?.persona === 'warrior' ? 2 : 0);
      playerDamage = Math.round(playerBaseDamage * damageMultiplier * playerDamageModifier);
    }

    const finalEnemyHp = Math.max(0, currentChunk.enemy!.hp - playerDamage);
    const enemyDefeated = finalEnemyHp <= 0;
    let lootDrops: any[] = [];
    let enemyDamage = 0;
    let fled = false;

    if (enemyDefeated) {
      const templates = getTemplates ? getTemplates(language) : [];
      const enemyTemplate = templates[currentChunk.terrain]?.enemies.find((e: any) => (context.getTranslatedText ? context.getTranslatedText(e.data.type as any, 'en') : '') === (context.getTranslatedText ? context.getTranslatedText(currentChunk.enemy!.type as any, 'en') : ''));
      if (enemyTemplate?.data?.loot) {
        for (const lootItem of (enemyTemplate.data.loot as any[])) {
          if (Math.random() < lootItem.chance) {
            const definition = resolveItemDef ? resolveItemDef(lootItem.name) : undefined;
            if (definition) {
              lootDrops.push({ name: { en: lootItem.name, vi: t(lootItem.name as any) }, description: definition.description, tier: definition.tier, quantity: 1 + Math.floor(Math.random() * 3), emoji: definition.emoji });
            }
          }
        }
      }
    } else {
      fled = currentChunk.enemy!.behavior === 'passive' || (successLevel === 'CriticalSuccess' && currentChunk.enemy!.size === 'small');
      if (!fled) enemyDamage = Math.round(currentChunk.enemy!.damage);
    }

    let nextPlayerStats = { ...(context.playerStats || {}) };
    nextPlayerStats.hp = Number(nextPlayerStats.hp ?? 0);
    nextPlayerStats.stamina = Number(nextPlayerStats.stamina ?? 0);
    nextPlayerStats.unlockProgress = { ...(nextPlayerStats.unlockProgress || {}), kills: (nextPlayerStats.unlockProgress?.kills ?? 0), damageSpells: (nextPlayerStats.unlockProgress?.damageSpells ?? 0), moves: (nextPlayerStats.unlockProgress?.moves ?? 0) };
    nextPlayerStats.hp = Math.max(0, nextPlayerStats.hp - enemyDamage);
    if (enemyDefeated) nextPlayerStats.unlockProgress = { ...(nextPlayerStats.unlockProgress || {}), kills: (nextPlayerStats.unlockProgress?.kills ?? 0) + 1, damageSpells: (nextPlayerStats.unlockProgress?.damageSpells ?? 0) };

    const narrative = (context.generateOfflineActionNarrative ? context.generateOfflineActionNarrative('attack', { successLevel, playerDamage, enemyDamage, enemyDefeated, fled, enemyType: currentChunk.enemy!.type }, currentChunk, t, language) : '');
    addNarrativeEntry(narrative, 'narrative');

    if (enemyDefeated && lootDrops.length > 0) {
      addNarrativeEntry(t('enemyDropped', { items: lootDrops.map(i => `${i.quantity} ${context.getTranslatedText ? context.getTranslatedText(i.name, language) : i.name}`).join(', ') }), 'system');
    }

    context.setWorld && context.setWorld((prev: any) => {
      const newWorld = { ...prev };
      const chunkToUpdate = { ...newWorld[key]! };
      chunkToUpdate.enemy = (enemyDefeated || fled) ? null : { ...chunkToUpdate.enemy!, hp: finalEnemyHp };
      if (lootDrops.length > 0) {
        const newItemsMap = new Map<string, any>((chunkToUpdate.items || []).map((item: any) => [context.getTranslatedText ? context.getTranslatedText(item.name, 'en') : item.name, { ...item }]));
        lootDrops.forEach((droppedItem: any) => {
          const dropName = context.getTranslatedText ? context.getTranslatedText(droppedItem.name, 'en') : droppedItem.name;
          const existingItem = newItemsMap.get(dropName);
          if (existingItem) existingItem.quantity += droppedItem.quantity; else newItemsMap.set(dropName, droppedItem);
        });
        chunkToUpdate.items = Array.from(newItemsMap.values());
      }
      newWorld[key] = chunkToUpdate;
      return newWorld;
    });

    context.setPlayerStats && context.setPlayerStats(() => nextPlayerStats as any);
    context.advanceGameTime && context.advanceGameTime(nextPlayerStats as any);
  };
}
