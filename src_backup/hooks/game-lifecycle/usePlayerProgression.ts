
'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { skillDefinitions } from '@/lib/game/skills';
import type { PlayerStatus, PlayerBehaviorProfile, PlayerPersona } from "@/lib/game/types";
import type { TranslationKey } from "@/lib/i18n";

type PlayerProgressionDeps = {
  isLoaded: boolean;
  playerStats: PlayerStatus;
  setPlayerStats: (fn: (prev: PlayerStatus) => PlayerStatus) => void;
  playerBehaviorProfile: PlayerBehaviorProfile;
  addNarrativeEntry: (text: string, type: 'narrative' | 'action' | 'system', entryId?: string) => void;
};

export function usePlayerProgression(deps: PlayerProgressionDeps) {
  const { isLoaded, playerStats, setPlayerStats, playerBehaviorProfile, addNarrativeEntry } = deps;
  const { t } = useLanguage();
  const { toast } = useToast();

  // EFFECT: Check for skill unlocks based on player's actions.
  useEffect(() => {
    if (!isLoaded) return;

    const { kills, damageSpells, moves } = playerStats.unlockProgress;
    const currentSkillNames = new Set(playerStats.skills.map(s => s.name));

    const newlyUnlockedSkills = skillDefinitions.filter(skillDef => {
        if (currentSkillNames.has(skillDef.name) || !skillDef.unlockCondition) return false;
        const progress = playerStats.unlockProgress[skillDef.unlockCondition.type];
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
}
