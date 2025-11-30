// Extracted move handler.
import type { ActionHandlerDeps } from '@/hooks/use-action-handlers';
import { AudioActionType } from '@/lib/definitions/audio-events';

export function createHandleMove(context: Partial<ActionHandlerDeps> & Record<string, any>) {
  return (direction: "north" | "south" | "east" | "west") => {
    const {
      isLoading, isGameOver, playerPosition, world, addNarrativeEntry, t,
      settings, setPlayerBehaviorProfile, setPlayerPosition, playerStats,
      advanceGameTime, lastMoveRef, pickupBufferRef, getKeywordVariations,
      getEffectiveChunk, generateOfflineNarrative, narrativeLogRef, getTranslatedText,
      getTemplates, language, audio
    } = context as any;

    if (isLoading || isGameOver) return;

    let { x, y } = playerPosition;
    if (direction === "north") y += 1;
    if (direction === "south") y -= 1;
    if (direction === "east") x += 1;
    if (direction === "west") x -= 1;

    const nextChunkKey = `${x},${y}`;
    let worldSnapshot = { ...world };
    const nextChunk = worldSnapshot[nextChunkKey];

    if (nextChunk?.terrain === 'wall') {
      addNarrativeEntry(t('wallBlock'), 'system');
      return;
    }
    if (nextChunk?.terrain === 'ocean' && !(playerStats.items || []).some((item: any) => getTranslatedText(item.name, 'en') === 'inflatable_raft')) {
      addNarrativeEntry(t('oceanTravelBlocked'), 'system');
      return;
    }

    setPlayerBehaviorProfile((prev: any) => ({ ...prev, moves: prev.moves + 1 }));

    const dirKey = `direction${direction.charAt(0).toUpperCase() + direction.slice(1)}` as any;
    const directionText = t(dirKey);
    const actionText = t('wentDirection', { direction: directionText });
    addNarrativeEntry(actionText, 'action');

    // Emit audio for movement
    if (audio?.playSfxForAction) {
      audio.playSfxForAction(AudioActionType.PLAYER_MOVE, { biome: nextChunk?.terrain });
    }

    // optimistic placeholder: add a low-detail movement narrative immediately
    const placeholderId = `${Date.now()}-move-${x}-${y}`;
    const movingKey = settings.narrativeLength === 'long' ? 'movingLong' : 'movingShort';
    const placeholderText = t(movingKey as any, { direction: directionText, brief_sensory: '' });
    addNarrativeEntry(placeholderText, 'narrative', placeholderId);

    setPlayerPosition({ x, y });
    try { console.info('[optimistic] setPlayerPosition', { x, y, now: Date.now() }); } catch { }

    const staminaCost = worldSnapshot[nextChunkKey]?.travelCost ?? 1;

    let newPlayerStats = { ...playerStats };
    if ((playerStats.stamina ?? 0) > staminaCost) {
      newPlayerStats.stamina = (newPlayerStats.stamina ?? 0) - staminaCost;
    } else {
      newPlayerStats.stamina = 0;
      newPlayerStats.hp = (newPlayerStats.hp ?? 0) - 5;
    }
    newPlayerStats.dailyActionLog = [...(playerStats.dailyActionLog || []), actionText];

    advanceGameTime(newPlayerStats, { x, y });

    const finalChunk = worldSnapshot[`${x},${y}`];
    if (finalChunk) {
      let briefSensory = '';
      try {
        const computeBriefSensory = (c: any) => {
          const scores: { key: string; score: number }[] = [];
          if (typeof c.temperature === 'number') {
            const temp = c.temperature;
            const score = Math.abs(temp - 50) + (temp >= 80 || temp <= 10 ? 20 : 0);
            scores.push({ key: 'temperature', score });
          }
          if (typeof c.moisture === 'number') {
            const m = c.moisture;
            const score = Math.abs(m - 50) + (m >= 80 || m <= 20 ? 15 : 0);
            scores.push({ key: 'moisture', score });
          }
          if (typeof c.lightLevel === 'number') {
            const l = c.lightLevel;
            const score = Math.abs((l <= 0 ? 0 - l : 100 - l)) + (l <= 10 ? 10 : 0);
            scores.push({ key: 'light', score });
          }
          if (scores.length === 0) return '';
          scores.sort((a, b) => b.score - a.score);
          const primary = scores[0].key;

          const patternsEn = [
            "it's {adj}.",
            "the air feels {adj}.",
            "a {adj} hush falls over the area.",
            "{adj} surrounds you.",
            "you notice it is {adj}."
          ];
          const patternsVi = [
            "{adj}.",
            "không khí có cảm giác {adj}.",
            "một bầu không khí {adj} bao trùm.",
            "bạn nhận thấy nơi này {adj}.",
            "cảm giác chiếc {adj} len lỏi."
          ];

          const pickAdj = () => {
            try {
              if (primary === 'temperature') {
                if (c.temperature >= 80) return t('temp_hot') || 'scorching';
                if (c.temperature <= 10) return t('temp_cold') || 'freezing';
                return t('temp_mild') || 'mild';
              }
              if (primary === 'moisture') {
                if (c.moisture >= 80) return t('moisture_humid') || 'humid';
                if (c.moisture <= 20) return t('moisture_dry') || 'dry';
                return t('moisture_normal') || 'fresh';
              }
              if (primary === 'light') {
                if (c.lightLevel <= 10) return t('light_level_dark') || 'dark';
                if (c.lightLevel <= 40) return t('light_level_dim') || 'dim';
                return t('light_level_normal') || 'bright';
              }
            } catch {
            }
            return '';
          };

          const adj = pickAdj();
          const patterns = language === 'vi' ? patternsVi : patternsEn;
          const chosenPattern = patterns[Math.floor(Math.random() * patterns.length)];
          return chosenPattern.replace('{adj}', adj).replace(/\s+/g, ' ').trim();
        };

        briefSensory = computeBriefSensory(finalChunk);
        if (briefSensory && briefSensory.length > 0) {
          const updatedPlaceholder = t(movingKey as any, { direction: directionText, brief_sensory: briefSensory });
          addNarrativeEntry(String(updatedPlaceholder).replace(/\{[^}]+\}/g, '').trim(), 'narrative', placeholderId);
        }
      } catch (e: any) {
        console.warn('[narrative] brief sensory computation failed', e);
      }

      try {
        const prevChunk = worldSnapshot[`${playerPosition.x},${playerPosition.y}`];
        if (prevChunk && prevChunk.terrain && finalChunk.terrain && String(prevChunk.terrain) === String(finalChunk.terrain)) {
          const db = getKeywordVariations(language as any);
          const pool = (db as any)[`${String(finalChunk.terrain).toLowerCase()}_continuation`] || (db as any)['continuation'];
          if (pool && Array.isArray(pool) && pool.length > 0) {
            const pick = pool[Math.floor(Math.random() * pool.length)];
            const text = String(pick).replace('{direction}', directionText).replace('{biome}', t(finalChunk.terrain as any));
            addNarrativeEntry(text, 'narrative', placeholderId);
            lastMoveRef.current = { biome: finalChunk.terrain, time: Date.now() };
            return;
          }
        }
      } catch {
      }

      (async () => {
        try {
          try {
            const mn = await import('@/lib/game/movement-narrative');
            const conditional = mn.selectMovementNarrative({ chunk: finalChunk, playerStats: newPlayerStats || playerStats, directionText, language, briefSensory });
            if (conditional) { addNarrativeEntry(String(conditional).replace(/\{[^}]+\}/g, '').trim(), 'narrative', placeholderId); return; }
          } catch { }
        } catch { }
        try {
          const loaderMod = await import('@/lib/narrative/loader');
          const orchestrator = await import('@/lib/narrative/runtime-orchestrator');
          const biomeKey = finalChunk.terrain || finalChunk.biome || 'default';
          const bundle = await loaderMod.loadPrecomputedBundle(biomeKey, language);
          if (bundle && bundle.templates && bundle.templates.length > 0) {
            try {
              const res = orchestrator.pickVariantFromBundleWithConditions
                ? orchestrator.pickVariantFromBundleWithConditions(bundle as any, { chunk: finalChunk, playerStats: newPlayerStats || playerStats, briefSensory }, { seed: `${x},${y}`, persona: undefined })
                : null;
              if (res && res.text) {
                let finalText = String(res.text);
                if (briefSensory && briefSensory.length > 0) finalText = finalText.replace(/\{\s*brief_sensory\s*\}/g, briefSensory).replace(/{{\s*brief_sensory\s*}}/g, briefSensory);
                finalText = finalText.replace(/\{[^}]+\}/g, '').trim();
                addNarrativeEntry(finalText, 'narrative', placeholderId);
                return;
              }
            } catch {
              const seed = `${x},${y}`;
              const idx = Math.abs(seed.split('').reduce((s, c) => s + c.charCodeAt(0), 0)) % bundle.templates.length;
              const tplId = bundle.templates[idx].id;
              const res = orchestrator.pickVariantFromBundle(bundle as any, tplId, { seed, persona: undefined });
              if (res && res.text) { const finalText = String(res.text).replace(/\{[^}]+\}/g, '').trim(); addNarrativeEntry(finalText, 'narrative', placeholderId); return; }
            }
          }
        } catch (e: any) {
          console.warn('[narrative] precomputed load failed, falling back', String(e));
        }

        const recent = narrativeLogRef.current?.slice(-6) || [];
        const repeatCount = recent.reduce((acc: number, e: any) => {
          const txt = (typeof e === 'string' ? e : (e.text || '')).toLowerCase();
          if (txt.includes(directionText.toLowerCase()) || txt.includes((finalChunk.terrain || '').toLowerCase())) return acc + 1;
          return acc;
        }, 0);
        const effectiveLength = (repeatCount >= 3) ? 'short' : settings.narrativeLength;
        let narrative = generateOfflineNarrative(finalChunk, effectiveLength as any, worldSnapshot, { x, y }, t, language);
        narrative = String(narrative).replace(/\{[^}]+\}/g, '').trim();
        addNarrativeEntry(narrative, 'narrative', placeholderId);
      })();
    }
  };
}
