/* Move orchestrator extracted from use-action-handlers to keep module smaller.
   The factory `createHandleMove` returns a function matching the original
   `handleMove(direction)` signature and expects a context object with the
   same names as the originals (e.g., isLoading, playerPosition, world, etc.).
*/
export function createHandleMove(ctx: any) {
  return (direction: "north" | "south" | "east" | "west") => {
    try {
      if (ctx.isLoading || ctx.isGameOver) return;

      if (ctx.isAnimatingMove) return;

      let { x, y } = ctx.playerPosition;
      const nowClick = Date.now();
      if (nowClick - (ctx.lastMoveAtRef.current || 0) < 120) return;
      ctx.lastMoveAtRef.current = nowClick;
      if (direction === "north") y += 1;
      if (direction === "south") y -= 1;
      if (direction === "east") x += 1;
      if (direction === "west") x -= 1;

      const nextChunkKey = `${x},${y}`;
      const nextChunk = ctx.world[nextChunkKey];
      const targetChunkSnapshot = nextChunk ? { ...nextChunk } : undefined;
      const prevChunkSnapshot = ctx.world[`${ctx.playerPosition.x},${ctx.playerPosition.y}`] ? { ...ctx.world[`${ctx.playerPosition.x},${ctx.playerPosition.y}`] } : undefined;

      if (nextChunk?.terrain === 'wall') {
        ctx.addNarrativeEntry(ctx.t('wallBlock'), 'system');
        return;
      }
      if (nextChunk?.terrain === 'ocean' && !(ctx.playerStats.items || []).some((item: any) => ctx.getTranslatedText(item.name, 'en') === 'inflatable_raft')) {
        ctx.addNarrativeEntry(ctx.t('oceanTravelBlocked'), 'system');
        return;
      }

      const runSoon = (fn: () => void) => {
        try {
          if (typeof (window as any).requestIdleCallback === 'function') {
            (window as any).requestIdleCallback(() => { try { fn(); } catch {} }, { timeout: 50 });
          } else {
            setTimeout(() => { try { fn(); } catch {} }, 0);
          }
        } catch {
          try { setTimeout(() => { try { fn(); } catch {} }, 0); } catch {}
        }
      };

      runSoon(() => ctx.setPlayerBehaviorProfile((prev: any) => ({ ...prev, moves: prev.moves + 1 })));

      const dirKey = `direction${direction.charAt(0).toUpperCase() + direction.slice(1)}` as any;
      const directionText = ctx.t(dirKey);
      const actionText = ctx.t('wentDirection', { direction: directionText });
      const placeholderId = `${Date.now()}-move-${x}-${y}`;
      const movingKey = ctx.settings.narrativeLength === 'long' ? 'movingLong' : 'movingShort';
      const placeholderText = ctx.t(movingKey as any, { direction: directionText, brief_sensory: '' });
      setTimeout(() => {
        try { ctx.addNarrativeEntry(actionText, 'action'); } catch {}
        try { ctx.addNarrativeEntry(placeholderText, 'narrative', placeholderId); } catch {}
      }, 0);

      let moveTrace: any = null;
      let landingListener: EventListener | null = null;
      try {
        if (ctx.setVisualPlayerPosition && ctx.setIsAnimatingMove) {
          const from = { x: ctx.playerPosition.x, y: ctx.playerPosition.y };
          const to = { x, y };
          const moveId = `${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
          moveTrace = { id: moveId, startAt: Date.now(), from, to, events: [] };
          try { ctx.logger.debug('[move] sequence start', { id: moveTrace.id, from, to, startAt: moveTrace.startAt }); } catch {}

          moveTrace.events.push({ name: 'visual_init', at: Date.now(), from, to });
          ctx.setVisualPlayerPosition(from);
          try { ctx.setVisualMoveFrom?.(from); } catch {}
          try { ctx.setVisualMoveTo?.(to); } catch {}
          moveTrace.events.push({ name: 'animating_start', at: Date.now(), to });
          ctx.setIsAnimatingMove(true);

          const steppingCandidates = [
            'steping_sounds/rustle01.flac','steping_sounds/rustle02.flac','steping_sounds/rustle03.flac',
            'steping_sounds/rustle04.flac','steping_sounds/rustle05.flac','steping_sounds/rustle06.flac',
            'steping_sounds/rustle07.flac','steping_sounds/rustle08.flac','steping_sounds/rustle09.flac',
            'steping_sounds/rustle10.flac','steping_sounds/rustle11.flac','steping_sounds/rustle12.flac',
            'steping_sounds/rustle13.flac','steping_sounds/rustle14.flac','steping_sounds/rustle15.flac',
            'steping_sounds/rustle16.flac','steping_sounds/rustle17.flac','steping_sounds/rustle18.flac',
            'steping_sounds/rustle19.flac','steping_sounds/rustle20.flac'
          ];
          const picks: string[] = [];
          while (picks.length < 3) {
            const candidate = steppingCandidates[Math.floor(Math.random() * steppingCandidates.length)];
            if (!picks.includes(candidate)) picks.push(candidate);
          }
          const stagger = 140;
          picks.forEach((sfx, i) => setTimeout(() => { try { ctx.audio.playSfx(sfx); } catch {} }, i * stagger));

          const landingDelay = 350;
          const bounceDuration = 50;

          try {
            const visualTotalMs = 350 + 50 + 20;
            const ev = new CustomEvent('moveStart', { detail: { id: moveId, from, to, visualTotalMs } });
            window.dispatchEvent(ev as any);
          } catch {}

          landingListener = (ev: Event) => {
            try {
              const detail = (ev as CustomEvent).detail as any;
              if (!detail) return;
              const id = detail.id as string | undefined;
              if (id !== moveTrace.id) return;
              const c = detail.center as { x: number; y: number } | undefined;
              try { moveTrace?.events.push({ name: 'visual_landing', at: Date.now(), to: c }); } catch {}
              try { ctx.setVisualPlayerPosition({ x, y }); } catch {}
              try { ctx.setVisualJustLanded?.(true); } catch {}
            } catch {}
          };

          window.addEventListener('playerOverlayLanding', landingListener as EventListener);

          ctx.__lastMoveAnimationMs = 350 + 50 + 20;
        }
      } catch {
        // non-fatal
      }

      const staminaCost = nextChunk?.travelCost ?? 1;
      let newPlayerStats = { ...ctx.playerStats };
      if ((ctx.playerStats.stamina ?? 0) > staminaCost) {
        newPlayerStats.stamina = (newPlayerStats.stamina ?? 0) - staminaCost;
      } else {
        newPlayerStats.stamina = 0;
        newPlayerStats.hp = (newPlayerStats.hp ?? 0) - 5;
      }
      newPlayerStats.dailyActionLog = [...(ctx.playerStats.dailyActionLog || []), actionText];

      runSoon(() => {
        try { ctx.setPlayerStats(() => newPlayerStats); } catch {}
        try { ctx.advanceGameTime(newPlayerStats, { x, y }); } catch {}
      });

      const schedulePostMove = (fn: () => void, delayMs = 0) => {
        try {
          if (!delayMs) delayMs = ctx.__lastMoveAnimationMs ?? 700;
          setTimeout(() => {
            if (typeof (window as any).requestIdleCallback === 'function') {
              (window as any).requestIdleCallback(() => { try { fn(); } catch {} }, { timeout: 600 });
            } else {
              setTimeout(() => { try { fn(); } catch {} }, 30);
            }
          }, delayMs);
        } catch {
          setTimeout(() => { try { fn(); } catch {} }, delayMs || 30);
        }
      };

      const postMoveDefaultDelay = ctx.__lastMoveAnimationMs ?? 700;

      try {
        let applied = false;
        const applyAuthoritative = (origin: string = 'pan') => {
          if (applied) return;
          applied = true;
          try { moveTrace?.events.push({ name: 'authoritative_apply', at: Date.now(), origin, pos: { x, y } }); } catch {}
          try { if (ctx.setPlayerPosition) ctx.setPlayerPosition({ x, y }); } catch {}
        };

        let seenPan = false;
        let seenAnim = false;

        const finalizeAndLog = () => {
          try { window.removeEventListener('minimapPanComplete', panListener as EventListener); } catch {}
          try { window.removeEventListener('moveAnimationsFinished', animListener as EventListener); } catch {}
          try { if (landingListener) window.removeEventListener('playerOverlayLanding', landingListener as EventListener); } catch {}
          try { ctx.logger.debug('[move] sequence end', { id: moveTrace?.id, startAt: moveTrace?.startAt, endAt: Date.now(), events: moveTrace?.events }); } catch {}
        };

        const panListener = (ev: Event) => {
          try {
            const detail = (ev as CustomEvent)?.detail as any;
            if (!detail || !detail.center) return;
            const c = detail.center as { x: number; y: number };
            if (c.x === x && c.y === y) {
              try { moveTrace?.events.push({ name: 'minimap_pan_complete', at: Date.now(), center: c }); } catch {}
              if (applied) {
                finalizeAndLog();
              } else {
                seenPan = true;
              }
            }
          } catch {}
        };

        const removeLandingListener = () => {
          try { window.removeEventListener('playerOverlayLanding', landingListener as EventListener); } catch {}
        };

        const animListener = (ev: Event) => {
          try {
            const detail = (ev as CustomEvent)?.detail as any;
            if (!detail) return;
            const c = detail.center as { x: number; y: number } | undefined;
            const id = detail.id as string | undefined;
            if ((c && c.x === x && c.y === y) || id === moveTrace?.id) {
              seenAnim = true;
              try { moveTrace?.events.push({ name: 'move_animations_finished', at: Date.now(), center: c, id }); } catch {}
              try { ctx.setVisualJustLanded?.(false); } catch {}
              try { ctx.setIsAnimatingMove(false); } catch {}
              try { ctx.setVisualMoveFrom?.(null); } catch {}
              try { ctx.setVisualMoveTo?.(null); } catch {}
              try { applyAuthoritative('moveAnimationsFinished'); } catch {}
              if (seenPan) finalizeAndLog();
            }
          } catch {}
        };

        window.addEventListener('minimapPanComplete', panListener as EventListener);
        window.addEventListener('moveAnimationsFinished', animListener as EventListener);
        try { moveTrace?.events.push({ name: 'pan_or_anim_timeout_disabled', at: Date.now(), timeoutMs: postMoveDefaultDelay + 600, seenPan, seenAnim }); } catch {}
      } catch {
        try { if (ctx.setPlayerPosition) ctx.setPlayerPosition({ x, y }); } catch {}
      }

      schedulePostMove(() => {
        try { moveTrace?.events.push({ name: 'schedule_post_move', at: Date.now(), target: { x, y } }); } catch {}
        const finalChunk = targetChunkSnapshot || ctx.world[`${x},${y}`];
        if (!finalChunk) return;
        let briefSensory = '';
        let shouldAbortAfterPickup = false;
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
            const patternsEn = ["it's {adj}.", "the air feels {adj}.", "a {adj} hush falls over the area.", "{adj} surrounds you.", "you notice it is {adj}."];
            const patternsVi = ["{adj}.", "không khí có cảm giác {adj}.", "một bầu không khí {adj} bao trùm.", "bạn nhận thấy nơi này {adj}.", "cảm giác chiếc {adj} len lỏi."];
            const pickAdj = () => {
              try {
                if (primary === 'temperature') {
                  if (c.temperature >= 80) return ctx.t('temp_hot') || 'scorching';
                  if (c.temperature <= 10) return ctx.t('temp_cold') || 'freezing';
                  return ctx.t('temp_mild') || 'mild';
                }
                if (primary === 'moisture') {
                  if (c.moisture >= 80) return ctx.t('moisture_humid') || 'humid';
                  if (c.moisture <= 20) return ctx.t('moisture_dry') || 'dry';
                  return ctx.t('moisture_normal') || 'fresh';
                }
                if (primary === 'light') {
                  if (c.lightLevel <= 10) return ctx.t('light_level_dark') || 'dark';
                  if (c.lightLevel <= 40) return ctx.t('light_level_dim') || 'dim';
                  return ctx.t('light_level_normal') || 'bright';
                }
              } catch {}
              return '';
            };
            const adj = pickAdj();
            const patterns = ctx.language === 'vi' ? patternsVi : patternsEn;
            const chosenPattern = patterns[Math.floor(Math.random() * patterns.length)];
            return chosenPattern.replace('{adj}', adj).replace(/\s+/g, ' ').trim();
          };

          briefSensory = computeBriefSensory(finalChunk);
          if (briefSensory && briefSensory.length > 0) {
            const updatedPlaceholder = ctx.t(movingKey as any, { direction: directionText, brief_sensory: briefSensory });
            ctx.addNarrativeEntry(String(updatedPlaceholder).replace(/\{[^}]+\}/g, '').trim(), 'narrative', placeholderId);
          }
          try {
            if ((ctx.settings as any).autoPickup) {
              const chunkKeyPickup = `${x},${y}`;
              const currentItems = finalChunk.items || [];
              if (currentItems.length > 0) {
                newPlayerStats.items = newPlayerStats.items || [];
                let anyAdded = true;
                for (const itm of currentItems as any[]) {
                  const inv = newPlayerStats.items.find((i: any) => ctx.getTranslatedText(i.name, 'en') === ctx.getTranslatedText(itm.name, 'en'));
                  if (inv) {
                    inv.quantity += itm.quantity || 1;
                  } else {
                    const added = ctx.tryAddItemToInventory(newPlayerStats, itm as any);
                    if (!added) { anyAdded = false; break; }
                  }

                  try {
                    const resolvedDef = ctx.resolveItemDef(ctx.getTranslatedText(itm.name, 'en'));
                    const senseKey = resolvedDef?.senseEffect?.keywords?.[0] || undefined;
                    ctx.pickupBufferRef.current.items.push({ name: itm.name, quantity: itm.quantity || 1, senseKey, emoji: itm.emoji });
                    if (!ctx.pickupBufferRef.current.timer) {
                      ctx.pickupBufferRef.current.timer = setTimeout(() => ctx.flushPickupBuffer(), 250) as any;
                    }
                  } catch {
                    ctx.addNarrativeEntry(ctx.t('pickedUpItemNarrative', { quantity: itm.quantity, itemName: ctx.t(itm.name as any) }), 'narrative');
                  }
                }

                if (!anyAdded) {
                  ctx.setPlayerStats(() => newPlayerStats);
                  shouldAbortAfterPickup = true;
                }

                try {
                  const summary = (currentItems as any[]).map((i: any) => `${i.quantity} ${ctx.getTranslatedText(i.name, ctx.language)}`).slice(0, 4).join(', ');
                  ctx.toast({ title: ctx.t('itemPickedUpTitle'), description: summary });
                } catch { try { ctx.toast({ title: ctx.t('itemPickedUpTitle') }); } catch {} }

                ctx.setWorld((prev: any) => {
                  const nw = { ...prev };
                  const chunkToUpdate = { ...nw[chunkKeyPickup]! } as any;
                  chunkToUpdate.items = [];
                  chunkToUpdate.actions = (chunkToUpdate.actions || []).filter((a: any) => a.textKey !== 'pickUpAction_item');
                  nw[chunkKeyPickup] = chunkToUpdate;
                  return nw;
                });

                ctx.setPlayerStats(() => newPlayerStats);
              }
            }
          } catch (e) {
            // ignore
          }
        } catch (e: any) {
          console.warn('[narrative] brief sensory computation failed', e);
        }

        if (shouldAbortAfterPickup) return;

        try {
          const prevChunk = prevChunkSnapshot || ctx.world[`${ctx.playerPosition.x},${ctx.playerPosition.y}`];
          if (prevChunk && prevChunk.terrain && finalChunk.terrain && String(prevChunk.terrain) === String(finalChunk.terrain)) {
            const db = ctx.getKeywordVariations(ctx.language as any);
            const pool = (db as any)[`${String(finalChunk.terrain).toLowerCase()}_continuation`] || (db as any)['continuation'];
            if (pool && Array.isArray(pool) && pool.length > 0) {
              const pick = pool[Math.floor(Math.random() * pool.length)];
              const text = String(pick).replace('{direction}', directionText).replace('{biome}', ctx.t(finalChunk.terrain as any));
              ctx.addNarrativeEntry(text, 'narrative', placeholderId);
              ctx.lastMoveRef.current = { biome: finalChunk.terrain, time: Date.now() };
              return;
            }
          }
        } catch {}

        (async () => {
          try {
            try {
              const mn = await import('@/lib/game/movement-narrative');
              const conditional = mn.selectMovementNarrative({ chunk: finalChunk, playerStats: newPlayerStats || ctx.playerStats, directionText, language: ctx.language, briefSensory });
              if (conditional) {
                ctx.addNarrativeEntry(String(conditional).replace(/\{[^}]+\}/g, '').trim(), 'narrative', placeholderId);
                return;
              }
            } catch {}
          } catch {}
          try {
            const loaderMod = await import('@/lib/narrative/loader');
            const orchestrator = await import('@/lib/narrative/runtime-orchestrator');
            const biomeKey = finalChunk.terrain || finalChunk.biome || 'default';
            const bundle = await loaderMod.loadPrecomputedBundle(biomeKey, ctx.language);
            if (bundle && bundle.templates && bundle.templates.length > 0) {
              try {
                const res = orchestrator.pickVariantFromBundleWithConditions ? orchestrator.pickVariantFromBundleWithConditions(bundle as any, { chunk: finalChunk, playerStats: newPlayerStats || ctx.playerStats, briefSensory }, { seed: `${x},${y}`, persona: undefined }) : null;
                if (res && res.text) {
                  let finalText = String(res.text);
                  if (briefSensory && briefSensory.length > 0) {
                    finalText = finalText.replace(/\{\s*brief_sensory\s*\}/g, briefSensory).replace(/{{\s*brief_sensory\s*}}/g, briefSensory);
                  }
                  finalText = finalText.replace(/\{[^}]+\}/g, '').trim();
                  ctx.addNarrativeEntry(finalText, 'narrative', placeholderId);
                  return;
                }
              } catch {
                const seed = `${x},${y}`;
                const idx = Math.abs(seed.split('').reduce((s, c) => s + c.charCodeAt(0), 0)) % bundle.templates.length;
                const tplId = bundle.templates[idx].id;
                const res = orchestrator.pickVariantFromBundle(bundle as any, tplId, { seed, persona: undefined });
                if (res && res.text) {
                  const finalText = String(res.text).replace(/\{[^}]+\}/g, '').trim();
                  ctx.addNarrativeEntry(finalText, 'narrative', placeholderId);
                  return;
                }
              }
            }
          } catch (e: any) {
            console.warn('[narrative] precomputed load failed, falling back', String(e));
          }
          const recent = ctx.narrativeLogRef.current?.slice(-6) || [];
          const repeatCount = recent.reduce((acc: number, e: any) => {
            const txt = (typeof e === 'string' ? e : (e.text || '')).toLowerCase();
            if (txt.includes(directionText.toLowerCase()) || txt.includes((finalChunk.terrain || '').toLowerCase())) return acc + 1;
            return acc;
          }, 0);
          const effectiveLength = (repeatCount >= 3) ? 'short' : ctx.settings.narrativeLength;
          let narrative = ctx.generateOfflineNarrative(finalChunk, effectiveLength as any, ctx.world, { x, y }, ctx.t, ctx.language);
          narrative = String(narrative).replace(/\{[^}]+\}/g, '').trim();
          ctx.addNarrativeEntry(narrative, 'narrative', placeholderId);
        })();
      });
    } catch (err) {
      // swallow to avoid breaking UI
    }
  };
}
