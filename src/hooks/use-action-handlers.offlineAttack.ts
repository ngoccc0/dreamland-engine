/**
 * Offline attack handler factory - creates handler for turn-based combat.
 *
 * @remarks
 * Executes combat turn against enemy at current location using dice roll system.
 * Integrates Phase 3.A pure rules:
 * - calculateBaseDamage(attack) → normalized base damage
 * - applyMultiplier(baseDamage, mult) → final damage with modifiers
 *
 * **Combat Flow:**
 * 1. Roll dice (d20, d12, d8 based on settings)
 * 2. Compare roll to success thresholds
 * 3. Calculate player base damage using pure rule
 * 4. Apply environmental effects (darkness -20%, moisture -10%)
 * 5. Apply success multiplier (critical 2.0x, great 1.5x, normal 1.0x)
 * 6. Calculate final damage using applyMultiplier rule
 * 7. Reduce enemy HP
 * 8. If defeated: generate loot drops, award XP
 * 9. If enemy survives: enemy counterattacks
 *
 * **Pure Rule Integration:**
 * - calculateBaseDamage ensures consistent damage calculation
 * - applyMultiplier standardizes critical hit and effect scaling
 * - Same formulas used in combat-usecase and other systems
 *
 * **Phase 4B Integration:**
 * Returns combat outcome object that can be converted to side effects
 * via generateCombatEffects() function.
 *
 * @param context - Combat dependencies (dice, player stats, world, enemy AI)
 * @returns Handler function () => CombatOutcome | void
 */

// Extracted offline attack handler.
import type { ActionHandlerDeps } from '@/hooks/use-action-handlers';
import type { GameEvent } from '@/core/types/events';
import {
  calculateBaseDamage,
  applyMultiplier,
} from '@/core/rules/combat';
import { StatisticsEngine } from '@/core/engines/statistics/engine';
import { createEmptyStatistics } from '@/core/engines/statistics/schemas';
import type { CombatOutcome } from '@/core/engines/combat-effects-bridge';

export function createHandleOfflineAttack(context: Partial<ActionHandlerDeps> & Record<string, any>) {
  return (): CombatOutcome | void => {
    const { playerPosition, world, addNarrativeEntry, t, logger, getEffectiveChunk, weatherZones, gameTime, sStart, sDayDuration, rollDice, getSuccessLevel, setPlayerStats, advanceGameTime, setWorld, getTemplates, language, resolveItemDef } = context as any;
    const key = `${playerPosition.x},${playerPosition.y}`;
    const baseChunk = world[key];
    if (!baseChunk || !baseChunk.enemy) { addNarrativeEntry(t('noTarget'), 'system'); return; }

    const currentChunk = getEffectiveChunk(baseChunk, weatherZones, gameTime, sStart, sDayDuration);

    const { roll } = rollDice ? rollDice(context.settings?.diceType) : { roll: 0 };
    const successLevel = getSuccessLevel ? getSuccessLevel(roll, context.settings?.diceType) : 'Failure';
    addNarrativeEntry(t('diceRollMessage', { diceType: context.settings?.diceType, roll, level: t((context.successLevelToTranslationKey || {})[successLevel]) }), 'system');

    let playerDamage = 0;
    const damageMultiplier = successLevel === 'CriticalFailure' ? 0 : successLevel === 'Failure' ? 0 : successLevel === 'GreatSuccess' ? 1.5 : successLevel === 'CriticalSuccess' ? 2.0 : 1.0;
    if (damageMultiplier > 0) {
      // Use pure rule: calculateBaseDamage(attack) from core/rules/combat
      const attackPower = (context.playerStats?.attributes?.physicalAttack ?? 0) + (context.playerStats?.persona === 'warrior' ? 2 : 0);
      const baseDamage = calculateBaseDamage(attackPower);

      // Apply environmental modifiers
      let environmentModifier = 1.0;
      if ((currentChunk.lightLevel ?? 0) < -3) { environmentModifier *= 0.8; }
      if ((currentChunk.moisture ?? 0) > 8) { environmentModifier *= 0.9; }

      // Use pure rule: applyMultiplier(baseDmg, mult)
      const environmentalDamage = applyMultiplier(baseDamage, environmentModifier);
      playerDamage = Math.round(applyMultiplier(environmentalDamage, damageMultiplier));
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

    // Phase I-1: Emit GameEvent for statistics tracking
    if (enemyDefeated) {
      const damageEvent: GameEvent = {
        type: 'CREATURE_KILLED',
        payload: {
          creatureId: currentChunk.enemy!.id || 'unknown',
          creatureType: currentChunk.enemy!.type,
          location: {
            biome: currentChunk.terrain || 'unknown',
            x: playerPosition.x,
            y: playerPosition.y,
          },
          weapon: context.playerStats?.equippedWeapon?.name || null,
          timestamp: Date.now(),
        },
      };

      // Update statistics immutably
      const currentStats = context.statistics || createEmptyStatistics();
      const updatedStats = StatisticsEngine.processEvent(currentStats, damageEvent);

      // Store updated statistics
      context.setStatistics?.(updatedStats);
    } else if (playerDamage > 0) {
      // Even if enemy not defeated, record damage for partial progress
      const damageEvent: GameEvent = {
        type: 'DAMAGE',
        payload: {
          source: 'creature',
          damageAmount: playerDamage,
          timestamp: Date.now(),
        },
      };

      const currentStats = context.statistics || createEmptyStatistics();
      const updatedStats = StatisticsEngine.processEvent(currentStats, damageEvent);
      context.setStatistics?.(updatedStats);
    }

    // Phase 4B: Return combat outcome for effect generation
    return {
      playerDamage,
      enemyDamage,
      enemyDefeated,
      enemyFled: fled,
      successLevel,
      lootDrops: lootDrops.map(drop => ({
        name: context.getTranslatedText ? context.getTranslatedText(drop.name, 'en') : drop.name,
        quantity: drop.quantity,
        emoji: drop.emoji
      })),
      playerHpBefore: context.playerStats?.hp || 0,
      playerHpAfter: nextPlayerStats.hp || 0,
      enemyHpBefore: currentChunk.enemy?.hp || 0,
      enemyHpAfter: finalEnemyHp
    } as CombatOutcome;
  };
}
