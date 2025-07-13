
'use client';

import { useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';
import { randomEvents } from '@/lib/game/events';
import { getTemplates } from '@/lib/game/templates';
import { clamp } from '@/lib/utils';
import { rollDice, getSuccessLevel, type SuccessLevel } from '@/lib/game/dice';
import type { GameState, PlayerStatus, Chunk, Season, WorldProfile, ItemDefinition, GeneratedItem } from "@/lib/game/types";
import type { TranslationKey } from "@/lib/i18n";

type GameEventsDeps = {
  isLoaded: boolean;
  isGameOver: boolean;
  setIsGameOver: (gameOver: boolean) => void;
  playerStats: PlayerStatus;
  setPlayerStats: (fn: (prev: PlayerStatus) => PlayerStatus) => void;
  world: GameState['world'];
  setWorld: (fn: (prev: GameState['world']) => GameState['world']) => void;
  playerPosition: GameState['playerPosition'];
  addNarrativeEntry: (text: string, type: 'narrative' | 'action' | 'system', entryId?: string) => void;
  currentSeason: Season;
  worldProfile: WorldProfile;
  customItemDefinitions: Record<string, ItemDefinition>;
  language: 'en' | 'vi';
  turn: number;
};

export function useGameEvents(deps: GameEventsDeps) {
  const {
    isLoaded, isGameOver, setIsGameOver, playerStats, setPlayerStats,
    world, setWorld, playerPosition, addNarrativeEntry, currentSeason,
    worldProfile, customItemDefinitions, language, turn
  } = deps;

  const { t } = useLanguage();
  const { settings } = useSettings();

  const triggerRandomEvent = useCallback(() => {
    if (!isLoaded || isGameOver || turn <= 1) return;
    
    // 5% chance to trigger an event each turn
    if (Math.random() > 0.05) {
      return;
    }

    const baseChunk = world[`${playerPosition.x},${playerPosition.y}`];
    if (!baseChunk) return;

    const possibleEvents = randomEvents.filter(event =>
        (event.theme === 'Normal' || event.theme === worldProfile.theme) &&
        event.canTrigger(baseChunk, playerStats, currentSeason)
    );

    if (possibleEvents.length === 0) return;

    const triggeredEvents = possibleEvents.filter(event => Math.random() < (event.chance ?? 1.0));

    if (triggeredEvents.length === 0) return;

    const event = triggeredEvents[Math.floor(Math.random() * triggeredEvents.length)];

    const eventName = t(event.nameKey);
    addNarrativeEntry(t('eventTriggered', { eventName }), 'system');

    const { roll } = rollDice('d20');
    const successLevel: SuccessLevel = getSuccessLevel(roll, 'd20');

    const outcome = event.outcomes[successLevel] || event.outcomes['Success'];
    if (!outcome) return;

    addNarrativeEntry(t(outcome.descriptionKey), 'narrative');

    const effects = outcome.effects;

    setPlayerStats(prevStats => {
      let newPlayerStats = { ...prevStats };
      const hasShelter = world[`${playerPosition.x},${playerPosition.y}`]?.structures.some(s => s.providesShelter);

      if (effects.hpChange) {
        let applyChange = true;
        if (event.id === 'magicRain' || event.id === 'blizzard') {
            if (hasShelter) applyChange = false;
        }
        if (applyChange) newPlayerStats.hp = clamp(newPlayerStats.hp + effects.hpChange, 0, 100);
      }
      if (effects.staminaChange) {
        let applyChange = true;
        if (event.id === 'blizzard') {
            if (hasShelter) applyChange = false;
        }
        if (applyChange) newPlayerStats.stamina = clamp(newPlayerStats.stamina + effects.staminaChange, 0, 100);
      }
      if (effects.manaChange) {
        newPlayerStats.mana = clamp(newPlayerStats.mana + effects.manaChange, 0, 50);
      }

      if (effects.items) {
        const newItems = [...newPlayerStats.items];
        effects.items.forEach(itemToAdd => {
            const existing = newItems.find(i => i.name === itemToAdd.name);
            if (existing) {
                existing.quantity += itemToAdd.quantity;
            } else {
                const def = customItemDefinitions[itemToAdd.name];
                if (def) {
                    newItems.push({ ...itemToAdd, tier: def.tier, emoji: def.emoji });
                }
            }
        });
        newPlayerStats.items = newItems;
      }
      return newPlayerStats;
    });

    if (effects.spawnEnemy) {
        setWorld(prevWorld => {
            const newWorld = { ...prevWorld };
            const key = `${playerPosition.x},${playerPosition.y}`;
            const chunkToUpdate = newWorld[key];
            if (chunkToUpdate && !chunkToUpdate.enemy) {
                const templates = getTemplates(language);
                const enemyTemplate = templates[baseChunk.terrain]?.enemies.find((e: any) => e.data.type === effects.spawnEnemy!.type)?.data;
                if (enemyTemplate) {
                    chunkToUpdate.enemy = {
                        ...enemyTemplate,
                        hp: effects.spawnEnemy!.hp,
                        damage: effects.spawnEnemy!.damage,
                        satiation: 0,
                    };
                }
            }
            return newWorld;
        });
    }

  }, [isLoaded, isGameOver, turn, world, playerPosition, worldProfile.theme, playerStats, currentSeason, addNarrativeEntry, t, customItemDefinitions, language, setPlayerStats, setWorld]);

  // EFFECT: Check for game over.
  useEffect(() => {
    if (playerStats.hp <= 0 && !isGameOver && isLoaded) {
      addNarrativeEntry(t('gameOverMessage'), 'system');
      setIsGameOver(true);
    }
  }, [playerStats.hp, isGameOver, isLoaded, addNarrativeEntry, t, setIsGameOver]);

  // EFFECT: Trigger random events periodically.
  useEffect(() => {
    triggerRandomEvent();
  }, [turn, triggerRandomEvent]);
}
