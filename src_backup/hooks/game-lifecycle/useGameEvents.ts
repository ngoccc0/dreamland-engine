
'use client';

import { useEffect, useCallback, useState } from 'react';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';
import { randomEvents } from '@/lib/game/events';
import { getTemplates } from '@/lib/game/templates';
import { clamp, getTranslatedText } from '@/lib/utils';
import { rollDice, getSuccessLevel, type SuccessLevel } from '@/lib/game/dice';
import type { GameState, PlayerStatus, Chunk, Season, WorldProfile, ItemDefinition, GeneratedItem, TranslatableString, Language } from "@/lib/game/types";
import type { TranslationKey } from "@/lib/i18n";
import { generateChunksInRadius } from '@/lib/game/engine/generation';
import { logger } from '@/lib/logger';

type GameEventsDeps = {
  isLoaded: boolean;
  isGameOver: boolean;
  setIsGameOver: (gameOver: boolean) => void;
  playerStats: PlayerStatus;
  setPlayerStats: (fn: (prev: PlayerStatus) => PlayerStatus) => void;
  world: GameState['world'];
  setWorld: (fn: (prev: GameState['world']) => GameState['world']) => void;
  regions: GameState['regions'];
  setRegions: (regions: GameState['regions']) => void;
  regionCounter: number;
  setRegionCounter: (counter: number) => void;
  playerPosition: GameState['playerPosition'];
  addNarrativeEntry: (text: string, type: 'narrative' | 'action' | 'system', entryId?: string) => void;
  currentSeason: Season;
  worldProfile: WorldProfile;
  customItemDefinitions: Record<string, ItemDefinition>;
  customItemCatalog: GeneratedItem[];
  customStructures: GameState['customStructures'];
  language: Language;
  turn: number;
};

const PROACTIVE_GEN_INTERVAL = 5; // Generate new chunks every 5 turns
const PROACTIVE_GEN_RADIUS = 7;   // Generate in a 15x15 radius

export function useGameEvents(deps: GameEventsDeps) {
  const {
    isLoaded, isGameOver, setIsGameOver, playerStats, setPlayerStats,
    world, setWorld, regions, setRegions, regionCounter, setRegionCounter, 
    playerPosition, addNarrativeEntry, currentSeason, worldProfile, 
    customItemDefinitions, customItemCatalog, customStructures, language, turn
  } = deps;

  const { t } = useLanguage();
  const { settings } = useSettings();
  const [turnsSinceLastProactiveGen, setTurnsSinceLastProactiveGen] = useState(0);

  const triggerRandomEvent = useCallback(() => {
    // 5% chance to trigger an event each turn after the first
    if (turn <= 1 || Math.random() > 0.05) {
      return;
    }

    const baseChunk = world[`${playerPosition.x},${playerPosition.y}`];
    if (!baseChunk) return;

    const possibleEvents = randomEvents.filter(event =>
        (event.theme === 'Normal' || event.theme === worldProfile.theme) &&
        event.canTrigger(baseChunk, playerStats, currentSeason)
    );

    if (possibleEvents.length === 0) return;

    const event = possibleEvents[Math.floor(Math.random() * possibleEvents.length)];

    const eventName = getTranslatedText(event.name, language, t);
    addNarrativeEntry(t('eventTriggered', { eventName }), 'system');

    const { roll } = rollDice('d20');
    const successLevel: SuccessLevel = getSuccessLevel(roll, 'd20');

    const outcome = event.outcomes[successLevel] || event.outcomes['Success'];
    if (!outcome) return;

    const outcomeDescription = getTranslatedText(outcome.description, language, t);
    addNarrativeEntry(outcomeDescription, 'narrative');

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
            const existingItem = newItems.find(i => getTranslatedText(i.name, language, t) === itemToAdd.name);
            if (existingItem) {
                existingItem.quantity += itemToAdd.quantity;
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

  }, [turn, world, playerPosition, worldProfile.theme, playerStats, currentSeason, addNarrativeEntry, t, customItemDefinitions, language, setPlayerStats, setWorld]);

  // EFFECT: Check for game over.
  useEffect(() => {
    if (playerStats.hp <= 0 && !isGameOver && isLoaded) {
      addNarrativeEntry(t('gameOverMessage'), 'system');
      setIsGameOver(true);
    }
  }, [playerStats.hp, isGameOver, isLoaded, addNarrativeEntry, t, setIsGameOver]);

  // EFFECT: Proactive chunk generation and random events trigger on each turn.
  useEffect(() => {
    if (!isLoaded || isGameOver || turn === 0) return;

    // Proactive Chunk Generation
    const nextProactiveTurnCount = turnsSinceLastProactiveGen + 1;
    if (nextProactiveTurnCount >= PROACTIVE_GEN_INTERVAL) {
      setTimeout(() => {
        const { world: newWorld, regions: newRegions, regionCounter: newRegionCounter } = generateChunksInRadius(
          world,
          regions,
          regionCounter,
          playerPosition.x,
          playerPosition.y,
          PROACTIVE_GEN_RADIUS,
          worldProfile,
          currentSeason,
          customItemDefinitions,
          customItemCatalog,
          customStructures,
          language
        );
        setWorld(newWorld);
        setRegions(newRegions);
        setRegionCounter(newRegionCounter);
        logger.info('Proactive chunk generation completed in background.');
      }, 300);
      setTurnsSinceLastProactiveGen(0); // Reset counter
    } else {
      setTurnsSinceLastProactiveGen(nextProactiveTurnCount);
    }
    
    // Random Event Trigger
    triggerRandomEvent();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, isLoaded, isGameOver]);
}
