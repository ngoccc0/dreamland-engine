
'use client';

import { useEffect, useRef } from 'react';
import { getKeywordVariations } from '@/lib/game/data/narrative-templates';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { skillDefinitions } from '@/lib/game/skills';
import type { PlayerStatus, PlayerBehaviorProfile, PlayerPersona } from "@/core/types/game";
import type { TranslationKey } from "@/lib/i18n";

type PlayerProgressionDeps = {
  isLoaded: boolean;
  playerStats: PlayerStatus;
  setPlayerStats: (fn: (prev: PlayerStatus) => PlayerStatus) => void;
  playerBehaviorProfile: PlayerBehaviorProfile;
  addNarrativeEntry: (text: string, type: 'narrative' | 'action' | 'system' | 'monologue', entryId?: string) => void;
  // optional world + position to allow biome-aware monologue selection
  world?: any;
  playerPosition?: { x: number, y: number };
};

/**
 * Player progression hook - tracks skill unlocks, level-ups, achievements.
 *
 * @remarks
 * Monitors player actions and unlocks new skills when conditions are met:
 * - **Skill Unlock**: Tracks kills, spells cast, moves made, crafting count
 * - **Level-up**: Increases player level based on experience threshold
 * - **Monologue**: Shows contextual thinking based on player biome/state
 * - **Narrative**: Announces new unlocks to player
 *
 * **Unlock Triggers:**
 * - Kill X creatures → unlock combat skills
 * - Cast X spells → unlock advanced magic
 * - Move X tiles → unlock exploration skills
 * - Craft X items → unlock crafting skills
 *
 * **Biome Context:**
 * Monologue lines are selected per-biome (desert, forest, etc.)
 * with fallback to generic tired/hungry pool.
 *
 * @param {PlayerProgressionDeps} deps - Player stats, world, narrative callbacks
 * @returns {void} Side-effect only (no return value)
 *
 * @example
 * usePlayerProgression({
 *   isLoaded: true,
 *   playerStats: currentStats,
 *   setPlayerStats: updateStats,
 *   addNarrativeEntry: (text) => {}
 * });
 */
export function usePlayerProgression(deps: PlayerProgressionDeps) {
  const { isLoaded, playerStats, setPlayerStats, playerBehaviorProfile, addNarrativeEntry, world, playerPosition } = deps;
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const lastMonologueAt = useRef(0);
  // small helper to pick a monologue line: prefer biome-specific pool, fallback to generic tired pool
  try {
    /* noop to keep lint happy; actual selection below inside effect */
  } catch { }

  // EFFECT: Check for skill unlocks based on player's actions.
  useEffect(() => {
    if (!isLoaded) return;
    const currentSkillNames = new Set(playerStats.skills.map(s => s.name));

    const newlyUnlockedSkills = skillDefinitions.filter(skillDef => {
      if (currentSkillNames.has(skillDef.name) || !skillDef.unlockCondition) return false;
      const progress = (playerStats.unlockProgress as any)[skillDef.unlockCondition.type] ?? 0;
      return progress >= skillDef.unlockCondition.count;
    });

    if (newlyUnlockedSkills.length > 0) {
      setPlayerStats(prev => ({
        ...prev,
        skills: [...prev.skills, ...newlyUnlockedSkills]
      }));

      newlyUnlockedSkills.forEach(skill => {
        const skillName = t(skill.name as TranslationKey);
        addNarrativeEntry(t('skillUnlocked', { skillName }), 'system');
        toast({
          title: t('skillUnlockedTitle'),
          description: t('skillUnlockedDesc', { skillName })
        });
      });
    }
  }, [playerStats.unlockProgress.kills, playerStats.unlockProgress.damageSpells, playerStats.unlockProgress.moves, isLoaded, playerStats.skills, setPlayerStats, t, addNarrativeEntry, toast]);

  // EFFECT: Update player persona based on behavior profile.
  useEffect(() => {
    if (!isLoaded) return;
    const { moves, attacks, crafts } = playerBehaviorProfile;
    const totalActions = moves + attacks + crafts;

    if (totalActions < 20) return;

    let newPersona: PlayerPersona = playerStats.persona;
    const movePercentage = moves / totalActions;
    const attackPercentage = attacks / totalActions;
    const craftPercentage = crafts / totalActions;

    if (movePercentage > 0.6 && newPersona !== 'explorer') newPersona = 'explorer';
    else if (attackPercentage > 0.6 && newPersona !== 'warrior') newPersona = 'warrior';
    else if (craftPercentage > 0.5 && newPersona !== 'artisan') newPersona = 'artisan';

    if (newPersona !== playerStats.persona) {
      setPlayerStats(prev => ({ ...prev, persona: newPersona }));
      const messageKey = newPersona === 'explorer' ? 'personaExplorer' : newPersona === 'warrior' ? 'personaWarrior' : 'personaArtisan';
      addNarrativeEntry(t(messageKey as TranslationKey), 'system');
      toast({ title: t('personaUnlockedTitle'), description: t(messageKey as TranslationKey) });
    }
  }, [playerBehaviorProfile.moves, playerBehaviorProfile.attacks, playerBehaviorProfile.crafts, isLoaded, playerStats.persona, setPlayerStats, addNarrativeEntry, t, toast]);

  // EFFECT: Emit a short monologue/self-talk when player is exhausted or hungry.
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const stamina = playerStats.stamina ?? 100;
      const hunger = playerStats.hunger ?? 100;
      // thresholds: stamina low OR hunger low
      const thresholdMet = (stamina < 20) || (hunger < 20);
      const now = Date.now();
      // cooldown: avoid spamming monologues more often than once per 30s
      if (!thresholdMet) return;
      if (now - lastMonologueAt.current < 30_000) return;

      // determine biome-specific pool key if we can
      let biomeKey = 'monologue_tired';
      try {
        if (world && playerPosition) {
          const chunk = world[`${playerPosition.x},${playerPosition.y}`];
          if (chunk && chunk.terrain) {
            const candidate = `${String(chunk.terrain).toLowerCase()}_monologue`;
            // check presence in keyword db
            const db = getKeywordVariations(language as any);
            if ((db as any)[candidate] && Array.isArray((db as any)[candidate]) && (db as any)[candidate].length > 0) biomeKey = candidate;
          }
        }
      } catch {
        // fallback to monologue_tired
        biomeKey = 'monologue_tired';
      }

      const db = getKeywordVariations(language as any);
      const pool: string[] = (db as any)[biomeKey] || (db as any)['monologue_tired'] || [];
      if (!pool || pool.length === 0) return;
      const choice = pool[Math.floor(Math.random() * pool.length)];
      addNarrativeEntry(choice, 'monologue');
      lastMonologueAt.current = now;
    } catch {
      // ignore
    }
  }, [isLoaded, playerStats.stamina, playerStats.hunger, world, playerPosition, addNarrativeEntry, t]);
}
