// Extracted offline skill-use handler. Accepts a context object with needed deps.
export function createHandleOfflineSkillUse(context: any) {
  return (skillName: string) => {
    const { playerStats, addNarrativeEntry, t, rollDice, settings, getSuccessLevel, getTranslatedText, world, playerPosition, setWorld, setPlayerStats, advanceGameTime } = context;

    let newPlayerStats: any = JSON.parse(JSON.stringify(playerStats));
    newPlayerStats.skills = newPlayerStats.skills || [];
    newPlayerStats.items = newPlayerStats.items || [];
    const skillToUse = newPlayerStats.skills.find((s: any) => t(s.name as any) === skillName);

    if (!skillToUse) { addNarrativeEntry(t('skillNotFound', { skillName: t(skillName as any) }), 'system'); return; }
    if ((newPlayerStats.mana ?? 0) < skillToUse.manaCost) { addNarrativeEntry(t('notEnoughMana', { skillName: t(skillName as any) }), 'system'); return; }

    const { roll } = rollDice(settings.diceType);
    const successLevel = getSuccessLevel(roll, settings.diceType);
    addNarrativeEntry(t('diceRollMessage', { diceType: settings.diceType, roll, level: t((context.successLevelToTranslationKey || {})[successLevel]) }), 'system');
    newPlayerStats.mana = (newPlayerStats.mana ?? 0) - skillToUse.manaCost;

    const key = `${playerPosition.x},${playerPosition.y}`;
    const currentChunk = world[key]!;
    let newEnemy: any = currentChunk.enemy ? { ...currentChunk.enemy } : null;
    let narrativeResult: any = { skill: skillToUse, successLevel, enemy: newEnemy };

    if (successLevel === 'CriticalFailure') {
        const backfireDamage = Math.round(skillToUse.effect.amount * 0.5);
        newPlayerStats.hp = Math.max(0, newPlayerStats.hp - backfireDamage);
        narrativeResult.backfireDamage = backfireDamage;
    } else if (successLevel !== 'Failure') {
        const effectMultiplier = successLevel === 'GreatSuccess' ? 1.5 : successLevel === 'CriticalSuccess' ? 2.0 : 1.0;

        if (skillToUse.effect.type === 'HEAL') {
            const healAmount = Math.round(skillToUse.effect.amount * effectMultiplier);
            const oldHp = newPlayerStats.hp;
            newPlayerStats.hp = Math.min(100, newPlayerStats.hp + healAmount);
            narrativeResult.healedAmount = newPlayerStats.hp - oldHp;
        } else if (skillToUse.effect.type === 'DAMAGE' && newEnemy) {
            const baseDamage = skillToUse.effect.amount + Math.round((newPlayerStats.attributes?.magicalAttack ?? 0) * 0.5);
            const finalDamage = Math.round(baseDamage * effectMultiplier);

            newEnemy.hp = Math.max(0, newEnemy.hp - finalDamage);
            narrativeResult.finalDamage = finalDamage;

            if (skillToUse.effect.healRatio) {
                const healedAmount = Math.round(finalDamage * skillToUse.effect.healRatio);
                const oldHp = newPlayerStats.hp;
                newPlayerStats.hp = Math.min(100, newPlayerStats.hp + healedAmount);
                if (newPlayerStats.hp > oldHp) narrativeResult.siphonedAmount = newPlayerStats.hp - oldHp;
            }
            if (newEnemy.hp <= 0) {
                newEnemy = null;
                newPlayerStats.unlockProgress = { ...newPlayerStats.unlockProgress, kills: (newPlayerStats.unlockProgress?.kills ?? 0) + 1 };
            }
            newPlayerStats.unlockProgress = { ...newPlayerStats.unlockProgress, damageSpells: (newPlayerStats.unlockProgress?.damageSpells ?? 0) + 1 };
            narrativeResult.enemy = newEnemy;
        }
    }

    const narrative = (context.generateOfflineActionNarrative || ((() => '')))('useSkill', narrativeResult, currentChunk, t, context.language);
    addNarrativeEntry(narrative, 'narrative');

    if(newEnemy !== currentChunk.enemy) setWorld((prev: any) => ({...prev, [key]: {...prev[key]!, enemy: newEnemy}}));
    setPlayerStats(() => newPlayerStats);
    advanceGameTime(newPlayerStats);
  };
}
