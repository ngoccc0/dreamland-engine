import type { TranslationKey } from "@/lib/i18n"


'use client';
// NOTE: react-hooks/exhaustive-deps is being audited. Removed the file-level disable
// so ESLint can report missing/unnecessary deps per-hook. We'll fix each hook's deps in small commits.

import { useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';

import { generateNarrative } from '@/ai/flows/generate-narrative-flow';
import { fuseItems } from '@/ai/flows/fuse-items-flow';
import { provideQuestHint } from '@/ai/flows/provide-quest-hint';
import { rollDice, getSuccessLevel, successLevelToTranslationKey } from '@/lib/game/dice';

import { resolveItemDef as resolveItemDefHelper } from '@/lib/game/item-utils';
import { generateOfflineNarrative, generateOfflineActionNarrative, handleSearchAction } from '@/lib/game/engine/offline';
import { getEffectiveChunk } from '@/lib/game/engine/generation';
import { analyze_chunk_mood } from '@/lib/game/engine/offline';
import { useAudio } from '@/lib/audio/useAudio';
import { getTemplates } from '@/lib/game/templates';
import { clamp, getTranslatedText, resolveItemId, ensurePlayerItemId } from '@/lib/utils';
import { getKeywordVariations } from '@/lib/game/data/narrative-templates';

import type { GameState, World, PlayerStatus, Recipe, CraftingOutcome, EquipmentSlot, Action, TranslationKey, PlayerItem, ItemEffect, ChunkItem, NarrativeEntry, GeneratedItem, TranslatableString, ItemDefinition, Chunk, Enemy } from '@/lib/game/types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-config';
import { logger } from '@/lib/logger';

type ActionHandlerDeps = {
  isLoaded: boolean;
  isLoading: boolean;
  isGameOver: boolean;
  setIsLoading: (loading: boolean) => void;
    playerStats: PlayerStatus;
    setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStatus>>;
    world: World;
    setWorld: React.Dispatch<React.SetStateAction<World>>;
    recipes: Record<string, Recipe>;
    buildableStructures: Record<string, any>;
    customItemDefinitions: Record<string, ItemDefinition>;
    setCustomItemCatalog: React.Dispatch<React.SetStateAction<GeneratedItem[]>>;
    setCustomItemDefinitions: React.Dispatch<React.SetStateAction<Record<string, ItemDefinition>>>;
  finalWorldSetup: GameState['worldSetup'] | null;
    addNarrativeEntry: (text: string, type: 'narrative' | 'action' | 'system' | 'monologue', entryId?: string) => void;
  advanceGameTime: (stats?: PlayerStatus, pos?: { x: number, y: number }) => void;
  setPlayerBehaviorProfile: (fn: (prev: any) => any) => void;
  playerPosition: { x: number, y: number };
  setPlayerPosition: (pos: { x: number, y: number }) => void;
  weatherZones: Record<string, any>;
  turn: number;
  gameTime: number;
  regions: GameState['regions'];
  setRegions: (regions: GameState['regions']) => void;
  regionCounter: number;
  setRegionCounter: (counter: number) => void;
  worldProfile: GameState['worldProfile'];
  currentSeason: GameState['currentSeason'];
  customItemCatalog: GameState['customItemCatalog'];
  customStructures: GameState['customStructures'];
  narrativeLogRef: React.RefObject<NarrativeEntry[]>;
};

export function useActionHandlers(deps: ActionHandlerDeps) {
    const {
        isLoaded, isLoading, isGameOver, setIsLoading, playerStats, setPlayerStats, world, setWorld, buildableStructures,
            customItemDefinitions, setCustomItemCatalog, setCustomItemDefinitions, finalWorldSetup, addNarrativeEntry, advanceGameTime,
            setPlayerBehaviorProfile, playerPosition, setPlayerPosition, weatherZones, turn, gameTime, customItemCatalog, narrativeLogRef
    } = deps;
    // worldProfile contains global spawn/config modifiers (e.g., spawnMultiplier)
    const { worldProfile } = deps;

    // Helper to resolve an item definition by name. Prefer custom/generated definitions
    // (world-specific), but fall back to the built-in master item catalog when needed.
    const resolveItemDef = (name: string) => {
        return resolveItemDefHelper(name, customItemDefinitions);
    };

  const { t, language } = useLanguage();
  const { settings } = useSettings();
    // Defensive typed aliases for legacy fields that may be missing from GameSettings type
    // Some code expects startTime/dayDuration to exist; cast to any and provide sensible defaults
    const sStart = (settings as any).startTime ?? 0;
    const sDayDuration = (settings as any).dayDuration ?? 24000;
  const { toast } = useToast();
    const isOnline = settings.gameMode === 'ai';

    // audio: auto-play background based on mood when player moves or environment changes
    // useAudio must be used inside AudioProvider (layouts already wrap the app)
    const audio = useAudio();

    // Track last move biome/time so we can emit a shorter "continuation" narrative when
    // the player moves repeatedly within the same biome.
    const lastMoveRef = useRef<{ biome?: string; time?: number }>({});

    // Buffer pick-up events that occur within a short window so we aggregate multi-pick
    // events into a single summary narrative instead of spamming detailed lines per item.
    const pickupBufferRef = useRef<{ items: Array<any>; timer?: ReturnType<typeof setTimeout> }>({ items: [] });
    const lastPickupMonologueAt = useRef(0);

    const flushPickupBuffer = () => {
        const buf = pickupBufferRef.current;
        if (!buf || !buf.items || buf.items.length === 0) return;
        const items = buf.items.splice(0, buf.items.length);
        if (buf.timer) { clearTimeout(buf.timer); buf.timer = undefined; }

        try {
            // If only one distinct item and qty ===1, render the detailed single-pick template
            if (items.length === 1 && items[0].quantity <= 1) {
                const it = items[0];
                // try to recreate the previous single-item detailed narrative path
                const resolvedDef = resolveItemDef(getTranslatedText(it.name, 'en'));
                const buildSensoryText = (def: ItemDefinition | undefined, itemName?: string) => {
                    if (!def || !def.senseEffect || !Array.isArray(def.senseEffect.keywords) || def.senseEffect.keywords.length === 0) return '';
                    const raw = def.senseEffect.keywords[Math.floor(Math.random() * def.senseEffect.keywords.length)];
                    const [kindRaw, ...rest] = raw.split(':');
                    const kind = kindRaw || 'generic';
                    const valRaw = rest.join(':') || '';
                    // fallback translation helper (keep minimal)
                    const sensory = valRaw || raw;
                    return sensory;
                };
                const itemNameText = t(it.name as TranslationKey);
                const sensory = buildSensoryText(resolvedDef, itemNameText);
                const narrativeText = t('pickedUpItem_single_1' as TranslationKey, { itemName: itemNameText, sensory });
                addNarrativeEntry(narrativeText, 'narrative');
                return;
            }

            // Multi-summary: group by name and sum quantities
            const grouped: Record<string, number> = {};
            items.forEach((it: any) => { const key = getTranslatedText(it.name, language); grouped[key] = (grouped[key] || 0) + (it.quantity || 1); });
            const summaryList = Object.keys(grouped).map(k => `${grouped[k]} ${k}`).slice(0, 6).join(', ');
            const totalCount = Object.values(grouped).reduce((s, v) => s + v, 0);
            const summaryText = language === 'vi' ? `Bạn gom được ${summaryList}.` : `You picked up ${summaryList}.`;
            addNarrativeEntry(summaryText, 'narrative');

            // Optionally add a brief monologue if many distinct items found, but throttle it
            const distinct = Object.keys(grouped).length;
            const now = Date.now();
            if (distinct >= 3 && now - lastPickupMonologueAt.current > 60_000) {
                const db = getKeywordVariations(language as any);
                const pool = (db as any)['monologue_tired'] || [];
                if (pool.length > 0) {
                    const line = pool[Math.floor(Math.random() * pool.length)];
                    addNarrativeEntry(line, 'monologue');
                    lastPickupMonologueAt.current = now;
                }
            }
        } catch {
            // fallback: nothing
        }
    };

    // When the player's current chunk or environment changes, prefer playing
    // biome-specific ambience (files named like Ambience_<Biome>) and fall back
    // to mood-based background tracks when a matching ambience isn't available.
    // We respect the playbackMode in the provider by checking it before
    // triggering playback.
    useEffect(() => {
        try {
            if (!audio || audio.playbackMode === 'off') return;
            const key = `${playerPosition.x},${playerPosition.y}`;
            const baseChunk = world[key];
            if (!baseChunk) return;
            const currentChunk = getEffectiveChunk(baseChunk, weatherZones, gameTime, sStart, sDayDuration);
            // prefer biome-based ambience when possible (matches filenames like Ambience_Cave_00.mp3)
            const biome = (currentChunk.terrain || (currentChunk as any).biome) as string | undefined | null;
            if (biome) {
                // playAmbienceForBiome will no-op if no matching file exists
                audio.playAmbienceForBiome(biome);
            } else {
                const moods = analyze_chunk_mood(currentChunk);
                audio.playBackgroundForMoods(moods);
            }
        } catch {
            // non-fatal: don't block game logic if audio fails
        }
    }, [world, playerPosition.x, playerPosition.y, weatherZones, gameTime, audio, sStart, sDayDuration]);

  const handleOnlineNarrative = useCallback(async (action: string, worldCtx: World, playerPosCtx: { x: number, y: number }, playerStatsCtx: PlayerStatus) => {
    setIsLoading(true);
    
    const entryId = `${Date.now()}-ai-response`;
    logger.info(`[AI] Starting narrative generation for action: "${action}"`, { entryId });
    
    const baseChunk = worldCtx[`${playerPosCtx.x},${playerPosCtx.y}`];
    if (!baseChunk || !finalWorldSetup) { setIsLoading(false); return; }

    const { roll, range } = rollDice(settings.diceType);
    const successLevel = getSuccessLevel(roll, settings.diceType);
    addNarrativeEntry(t('diceRollMessage', { diceType: settings.diceType, roll, level: t(successLevelToTranslationKey[successLevel]) }), 'system', `${Date.now()}-dice`);

    const currentChunk = getEffectiveChunk(baseChunk, weatherZones, gameTime, sStart, sDayDuration);

    const surroundingChunks: Chunk[] = [];
    if (settings.narrativeLength === 'long') {
        for (let dy = 1; dy >= -1; dy--) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const key = `${playerPosCtx.x + dx},${playerPosCtx.y + dy}`;
                const adjacentChunk = worldCtx[key];
                if (adjacentChunk && adjacentChunk.explored) {
                    surroundingChunks.push(getEffectiveChunk(adjacentChunk, weatherZones, gameTime, sStart, sDayDuration));
                }
            }
        }
    }
    
    try {
        const recentNarrative = narrativeLogRef.current?.slice(-5).map(e => e.text) || [];
        
        logger.debug('[AI] Input for generateNarrative', { entryId, action, playerPosCtx });
        // Normalize player status and chunk data for AI flows so Zod schemas expecting
        // concrete numeric fields and plain string enemy.type are satisfied.
        const normalizedPlayerStatus = {
            ...playerStatsCtx,
            unlockProgress: {
                kills: playerStatsCtx.unlockProgress?.kills ?? 0,
                damageSpells: playerStatsCtx.unlockProgress?.damageSpells ?? 0,
                moves: playerStatsCtx.unlockProgress?.moves ?? 0,
            },
            playerLevel: typeof playerStatsCtx.playerLevel === 'number'
                ? { level: playerStatsCtx.playerLevel as number, experience: 0 }
                : (playerStatsCtx.playerLevel ?? { level: 1, experience: 0 }),
            questsCompleted: playerStatsCtx.questsCompleted ?? 0,
        };

    const normalizeChunkForAI = (c: Chunk): Chunk => {
            // Force the enemy.type translation to a plain string for AI inputs.
            // Use the declared enemy.type (TranslatableString) directly when translating.
            const enemy = c.enemy
                ? ({ ...c.enemy, type: getTranslatedText(c.enemy.type ?? { en: '' }, language) } as any)
                : null;
            return { ...c, enemy } as any as Chunk;
        };

    const normalizedCurrentChunk = normalizeChunkForAI(currentChunk as Chunk);
    const normalizedSurrounding = surroundingChunks.length > 0 ? surroundingChunks.map(normalizeChunkForAI) : undefined;

        const input: GenerateNarrativeInput = {
            worldName: t(finalWorldSetup.worldName as TranslationKey),
            playerAction: action,
            playerStatus: normalizedPlayerStatus,
            // normalizedCurrentChunk has been massaged for AI; cast to any to satisfy the Zod-derived input shape
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
        const result = await generateNarrative(input);
        
        logger.info('[AI] Narrative generated successfully', { entryId, result });

        addNarrativeEntry(result.narrative, 'narrative', entryId);
        if(result.systemMessage) addNarrativeEntry(result.systemMessage, 'system', `${Date.now()}-system`);

        let finalPlayerStats: PlayerStatus = { ...playerStatsCtx, ...(result.updatedPlayerStatus || {})};
        // Ensure unlockProgress numeric fields are present to satisfy stricter typings
        finalPlayerStats.unlockProgress = {
            kills: finalPlayerStats.unlockProgress?.kills ?? 0,
            damageSpells: finalPlayerStats.unlockProgress?.damageSpells ?? 0,
            moves: finalPlayerStats.unlockProgress?.moves ?? 0,
        };
        
            if (worldCtx[`${playerPosCtx.x},${playerPosCtx.y}`]?.enemy && result.updatedChunk?.enemy === null) {
                finalPlayerStats.unlockProgress = { ...finalPlayerStats.unlockProgress, kills: (finalPlayerStats.unlockProgress?.kills ?? 0) + 1 };
            }

        setWorld(prev => {
            const newWorld = { ...prev };
            const key = `${currentChunk.x},${currentChunk.y}`;
            if (result.updatedChunk) {
                const chunkToUpdate = newWorld[key];
                const updatedEnemy: Enemy | null = result.updatedChunk?.enemy !== undefined ? result.updatedChunk.enemy : chunkToUpdate.enemy;
                // result.updatedChunk may be partial — treat it as Partial<Chunk> when merging
                const partial: Partial<Chunk> | undefined = result.updatedChunk as Partial<Chunk> | undefined;
                newWorld[key] = { ...chunkToUpdate, ...(partial || {}), enemy: updatedEnemy } as Chunk;
            }
            return newWorld;
        });
        
        if (result.newlyGeneratedItem) {
            const newItem = result.newlyGeneratedItem;
            // Resolve a canonical id for the generated item (prefer id/key from defs)
            const newItemId = resolveItemId(newItem.name, customItemDefinitions, t, language) ?? getTranslatedText(newItem.name, 'en');
            if (!resolveItemDef(newItemId)) {
                logger.info('[AI] A new item was generated for the world', { newItem, newItemId });
                setCustomItemCatalog(prev => [...prev, newItem]);
                setCustomItemDefinitions(prev => ({ ...prev, [newItemId]: { ...newItem } }));
                if (db) {
                    await setDoc(doc(db, "world-catalog", "items", "generated", newItemId), newItem);
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
    }, [settings.diceType, settings.aiModel, settings.narrativeLength, finalWorldSetup, weatherZones, gameTime, customItemDefinitions, narrativeLogRef, language, setIsLoading, addNarrativeEntry, setWorld, setCustomItemCatalog, setCustomItemDefinitions, setPlayerStats, advanceGameTime, toast, t]);

  const handleOfflineAttack = useCallback(() => {
    const key = `${playerPosition.x},${playerPosition.y}`;
    const baseChunk = world[key];
    if (!baseChunk || !baseChunk.enemy) { addNarrativeEntry(t('noTarget'), 'system'); return; }
    
    logger.debug('[Offline] Starting attack sequence', { playerPosition, enemy: baseChunk.enemy });
    const currentChunk = getEffectiveChunk(baseChunk, weatherZones, gameTime, sStart, sDayDuration);

    const { roll } = rollDice(settings.diceType);
    const successLevel = getSuccessLevel(roll, settings.diceType);
    addNarrativeEntry(t('diceRollMessage', { diceType: settings.diceType, roll, level: t(successLevelToTranslationKey[successLevel]) }), 'system');

    let playerDamage = 0;
    const damageMultiplier = successLevel === 'CriticalFailure' ? 0 : successLevel === 'Failure' ? 0 : successLevel === 'GreatSuccess' ? 1.5 : successLevel === 'CriticalSuccess' ? 2.0 : 1.0;
    
    if (damageMultiplier > 0) {
    let playerDamageModifier = 1.0;
    if ((currentChunk.lightLevel ?? 0) < -3) { playerDamageModifier *= 0.8; }
    if ((currentChunk.moisture ?? 0) > 8) { playerDamageModifier *= 0.9; }
        
    let playerBaseDamage = (playerStats.attributes?.physicalAttack ?? 0) + (playerStats.persona === 'warrior' ? 2 : 0);
        playerDamage = Math.round(playerBaseDamage * damageMultiplier * playerDamageModifier);
    }

    const finalEnemyHp = Math.max(0, currentChunk.enemy!.hp - playerDamage);
    const enemyDefeated = finalEnemyHp <= 0;
    let lootDrops: ChunkItem[] = [];

    let enemyDamage = 0;
    let fled = false;

    if (enemyDefeated) {
        const templates = getTemplates(language);
        const enemyTemplate = templates[currentChunk.terrain]?.enemies.find((e: any) => getTranslatedText(e.data.type as TranslatableString, 'en') === getTranslatedText(currentChunk.enemy!.type as TranslatableString, 'en'));
        if (enemyTemplate?.data?.loot) {
            type LootEntry = { name: string; chance: number };
            for (const lootItem of (enemyTemplate.data.loot as LootEntry[])) {
                if (Math.random() < lootItem.chance) {
                    const definition = resolveItemDef(lootItem.name);
                    if (definition) {
                        lootDrops.push({
                            name: { en: lootItem.name, vi: t(lootItem.name as TranslationKey) },
                            description: definition.description,
                            tier: definition.tier,
                            quantity: clamp(Math.floor(Math.random() * (definition.baseQuantity.max - definition.baseQuantity.min + 1)) + definition.baseQuantity.min, 1, Infinity),
                            emoji: definition.emoji,
                        } as ChunkItem);
                    }
                }
            }
        }
    } else {
        fled = currentChunk.enemy!.behavior === 'passive' || (successLevel === 'CriticalSuccess' && currentChunk.enemy!.size === 'small');
        if (!fled) enemyDamage = Math.round(currentChunk.enemy!.damage);
    }

    let nextPlayerStats = {...playerStats};
    nextPlayerStats.hp = Math.max(0, nextPlayerStats.hp - enemyDamage);
    if (enemyDefeated) {
        nextPlayerStats.unlockProgress = { ...nextPlayerStats.unlockProgress, kills: (nextPlayerStats.unlockProgress?.kills ?? 0) + 1 };
    }

    const narrativeResult = { successLevel, playerDamage, enemyDamage, enemyDefeated, fled, enemyType: currentChunk.enemy!.type };
    const narrative = generateOfflineActionNarrative('attack', narrativeResult, currentChunk, t, language);
    addNarrativeEntry(narrative, 'narrative');

    if (enemyDefeated && lootDrops.length > 0) {
        addNarrativeEntry(t('enemyDropped', { items: lootDrops.map(i => `${i.quantity} ${getTranslatedText(i.name, language)}`).join(', ') }), 'system');
    }

    setWorld(prev => {
        const newWorld = { ...prev };
        const chunkToUpdate = { ...newWorld[key]! };
        chunkToUpdate.enemy = (enemyDefeated || fled) ? null : { ...chunkToUpdate.enemy!, hp: finalEnemyHp };
        if (lootDrops.length > 0) {
            const newItemsMap = new Map<string, PlayerItem>((chunkToUpdate.items || []).map((item: PlayerItem) => [getTranslatedText(item.name, 'en'), { ...item } as PlayerItem]));
            lootDrops.forEach((droppedItem: ChunkItem) => {
                const dropName = getTranslatedText(droppedItem.name, 'en');
                const existingItem = newItemsMap.get(dropName);
                if (existingItem) {
                    existingItem.quantity += droppedItem.quantity;
                } else {
                    newItemsMap.set(dropName, droppedItem);
                }
            });
            chunkToUpdate.items = Array.from(newItemsMap.values());
        }
        newWorld[key] = chunkToUpdate;
        return newWorld;
    });

    setPlayerStats(() => nextPlayerStats);
    advanceGameTime(nextPlayerStats);
    }, [playerPosition, world, addNarrativeEntry, settings.diceType, t, playerStats, customItemDefinitions, advanceGameTime, setWorld, weatherZones, gameTime, setPlayerStats, language]);

  const handleOfflineItemUse = useCallback((itemName: string, target: string) => {
    const itemDef = resolveItemDef(itemName);
    if (!itemDef) return;

    let newPlayerStats: PlayerStatus = JSON.parse(JSON.stringify(playerStats));
    newPlayerStats.items = newPlayerStats.items || [];
    newPlayerStats.pets = newPlayerStats.pets || [];
    newPlayerStats.skills = newPlayerStats.skills || [];
    const itemIndex = newPlayerStats.items.findIndex(i => getTranslatedText(i.name, 'en') === itemName);

    if (itemIndex === -1) {
        addNarrativeEntry(t('itemNotFound'), 'system');
        return;
    }
    
    const key = `${playerPosition.x},${playerPosition.y}`;
    const currentChunk = world[key];
    if (!currentChunk) return;

    let narrativeResult: any = { itemName, target };
    let itemWasConsumed = false;
    let finalWorldUpdate: Partial<World> | null = null;

    if (target === 'player') {
        if (!itemDef.effects.length) {
            addNarrativeEntry(t('itemNoEffect', { item: t(itemName as TranslationKey) }), 'system');
            return;
        }
        itemWasConsumed = true;
        let effectDescriptions: string[] = [];
        itemDef.effects.forEach((effect: ItemEffect) => {
            const amt = effect.amount ?? 0;
            if (effect.type === 'HEAL') {
                const old = newPlayerStats.hp;
                newPlayerStats.hp = Math.min(100, newPlayerStats.hp + amt);
                if (newPlayerStats.hp > old) effectDescriptions.push(t('itemHealEffect', { amount: newPlayerStats.hp - old }));
            }
            if (effect.type === 'RESTORE_STAMINA') {
                const old = newPlayerStats.stamina;
                newPlayerStats.stamina = Math.min(100, newPlayerStats.stamina + amt);
                if (newPlayerStats.stamina > old) effectDescriptions.push(t('itemStaminaEffect', { amount: (newPlayerStats.stamina - old).toFixed(0) }));
            }
            if (effect.type === 'RESTORE_HUNGER') {
                if (newPlayerStats.hunger === undefined) newPlayerStats.hunger = 100;
                const old = newPlayerStats.hunger;
                newPlayerStats.hunger = Math.min(100, newPlayerStats.hunger + amt);
                if (newPlayerStats.hunger > old) effectDescriptions.push(t('itemHungerEffect', { amount: (newPlayerStats.hunger - old).toFixed(0) }));
            }
            if (effect.type === 'APPLY_EFFECT') {
                // Apply a status effect instance to the player (makes the item grant a timed effect)
                if (effect.effectType) {
                        type LocalStatusEffect = {
                            id: string;
                            type: string;
                            duration: number;
                            magnitude?: number;
                            description: TranslatableString;
                            appliedTurn: number;
                            source?: string;
                        };
                        const newEffect: LocalStatusEffect = {
                            id: `item-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
                            type: String(effect.effectType),
                            duration: Number(effect.effectDuration ?? 0),
                            magnitude: typeof effect.effectMagnitude === 'number' ? effect.effectMagnitude : undefined,
                            // lightweight description: use the effect type as fallback text
                            description: { en: String(effect.effectType), vi: String(effect.effectType) },
                            appliedTurn: (turn ?? 0),
                            source: itemName,
                        };
                        newPlayerStats.statusEffects = newPlayerStats.statusEffects || [];
                        newPlayerStats.statusEffects.push(newEffect as any);
                        effectDescriptions.push(`${t('appliedEffect') || 'Applied effect'}: ${String(effect.effectType)}`);
                    }
            }
            if (effect.type === 'GAMBLE_EFFECT') {
                // Gamble effect: 50/50 chance between positive and negative outcomes
                const gambleType = effect.gambleType || 'balanced';
                const isPositive = Math.random() < 0.5;

                if (isPositive) {
                    if (gambleType === 'mana') {
                        const healAmount = 30; // Large mana restoration
                        const old = newPlayerStats.mana ?? 0;
                        newPlayerStats.mana = Math.min(100, (newPlayerStats.mana ?? 0) + healAmount);
                        if (newPlayerStats.mana > old) effectDescriptions.push(t('itemManaEffect', { amount: newPlayerStats.mana - old }));
                    } else if (gambleType === 'health') {
                        const healAmount = 30; // Large health restoration
                        const old = newPlayerStats.hp;
                        newPlayerStats.hp = Math.min(100, newPlayerStats.hp + healAmount);
                        if (newPlayerStats.hp > old) effectDescriptions.push(t('itemHealEffect', { amount: newPlayerStats.hp - old }));
                    } else { // balanced
                        const healAmount = 20; // Medium restoration for both
                        const oldHp = newPlayerStats.hp;
                        const oldMana = newPlayerStats.mana ?? 0;
                        newPlayerStats.hp = Math.min(100, newPlayerStats.hp + healAmount);
                        newPlayerStats.mana = Math.min(100, (newPlayerStats.mana ?? 0) + healAmount);
                        if (newPlayerStats.hp > oldHp) effectDescriptions.push(t('itemHealEffect', { amount: newPlayerStats.hp - oldHp }));
                        if (newPlayerStats.mana > oldMana) effectDescriptions.push(t('itemManaEffect', { amount: newPlayerStats.mana - oldMana }));
                    }
                } else {
                    // Apply poison effect (negative outcome)
                    type LocalStatusEffect = {
                        id: string;
                        type: string;
                        duration: number;
                        magnitude?: number;
                        description: TranslatableString;
                        appliedTurn: number;
                        source?: string;
                    };
                    const poisonEffect: LocalStatusEffect = {
                        id: `item-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
                        type: 'poison',
                        duration: 5,
                        magnitude: 2,
                        description: { en: 'Poisoned', vi: 'Bị độc' },
                        appliedTurn: (turn ?? 0),
                        source: itemName,
                    };
                    newPlayerStats.statusEffects = newPlayerStats.statusEffects || [];
                    newPlayerStats.statusEffects.push(poisonEffect as any);
                    effectDescriptions.push(t('appliedEffect') || 'Applied effect: Poison');
                }
            }
        });
        narrativeResult.wasUsed = effectDescriptions.length > 0;
        narrativeResult.effectDescription = effectDescriptions.join(', ');
    } else { // Taming logic
        if (!currentChunk.enemy || getTranslatedText(currentChunk.enemy.type, 'en') !== target) {
            addNarrativeEntry(t('noTargetForITEM', { target: t(target as TranslationKey) }), 'system');
            return;
        }
        if (!currentChunk.enemy.diet.includes(itemName)) {
            addNarrativeEntry(t('targetNotInterested', { target: t(target as TranslationKey), item: t(itemName as TranslationKey) }), 'system');
            return;
        }

        itemWasConsumed = true;
        narrativeResult.itemConsumed = true;
        const newEnemyState = { ...currentChunk.enemy, satiation: Math.min(currentChunk.enemy.satiation + 1, currentChunk.enemy.maxSatiation) };
        const tamingChance = 0.1 + (newEnemyState.satiation / newEnemyState.maxSatiation) * 0.4 - (newEnemyState.hp / 100) * 0.2;

        if (Math.random() < tamingChance) {
            newPlayerStats.pets = [...(newPlayerStats.pets || []), { type: currentChunk.enemy.type, level: 1 }];
            finalWorldUpdate = { [key]: { ...currentChunk, enemy: null } };
            narrativeResult.wasTamed = true;
            narrativeResult.newPet = newPlayerStats.pets.at(-1);
        } else {
            finalWorldUpdate = { [key]: { ...currentChunk, enemy: newEnemyState } };
            narrativeResult.wasTamed = false;
        }
    }
    
    if (itemWasConsumed) {
        newPlayerStats.items[itemIndex].quantity -= 1;
    }
    
    const narrative = generateOfflineActionNarrative('useItem', narrativeResult, currentChunk, t, language);
    addNarrativeEntry(narrative, 'narrative');

    // Apply state changes at the end
    if (finalWorldUpdate) {
        setWorld(prev => ({ ...prev, ...finalWorldUpdate! }));
    }
    
    newPlayerStats.items = newPlayerStats.items.filter(i => i.quantity > 0);
    setPlayerStats(() => newPlayerStats);
    advanceGameTime(newPlayerStats);
    }, [playerStats, customItemDefinitions, playerPosition, world, addNarrativeEntry, t, advanceGameTime, setWorld, setPlayerStats, language]);

  const handleOfflineSkillUse = useCallback((skillName: string) => {

    let newPlayerStats: PlayerStatus = JSON.parse(JSON.stringify(playerStats));
    newPlayerStats.skills = newPlayerStats.skills || [];
    newPlayerStats.items = newPlayerStats.items || [];
    const skillToUse = newPlayerStats.skills.find((s: any) => t(s.name as TranslationKey) === skillName);

    if (!skillToUse) { addNarrativeEntry(t('skillNotFound', { skillName: t(skillName as TranslationKey) }), 'system'); return; }
    if ((newPlayerStats.mana ?? 0) < skillToUse.manaCost) { addNarrativeEntry(t('notEnoughMana', { skillName: t(skillName as TranslationKey) }), 'system'); return; }

    const { roll } = rollDice(settings.diceType);
    const successLevel = getSuccessLevel(roll, settings.diceType);
    addNarrativeEntry(t('diceRollMessage', { diceType: settings.diceType, roll, level: t(successLevelToTranslationKey[successLevel]) }), 'system');
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
    
    const narrative = generateOfflineActionNarrative('useSkill', narrativeResult, currentChunk, t, language);
    addNarrativeEntry(narrative, 'narrative');

    if(newEnemy !== currentChunk.enemy) setWorld(prev => ({...prev, [key]: {...prev[key]!, enemy: newEnemy}}));
    setPlayerStats(() => newPlayerStats);
    advanceGameTime(newPlayerStats);
    }, [playerStats, settings.diceType, t, addNarrativeEntry, playerPosition, world, advanceGameTime, setWorld, setPlayerStats, language]);

    const handleOfflineAction = useCallback((action: Action) => {
        let newPlayerStats: PlayerStatus = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), t(action.textKey as TranslationKey, action.params)] };
    newPlayerStats.items = newPlayerStats.items || [];
    newPlayerStats.quests = newPlayerStats.quests || [];
      const currentChunk = world[`${playerPosition.x},${playerPosition.y}`];
      if (!currentChunk) return;

      const { textKey } = action;

      if (textKey === 'observeAction_enemy') {
          const enemy = currentChunk.enemy;
          if (enemy) {
              const enemyName = t(enemy.type as TranslationKey);
              newPlayerStats.trackedEnemy = {
                  chunkKey: `${currentChunk.x},${currentChunk.y}`,
                  type: getTranslatedText(enemy.type, 'en'),
                  lastSeen: turn,
              };
              addNarrativeEntry(t('observeSuccess', { enemyName }), 'system');
          }
      } else if (textKey === 'talkToAction_npc') {
          const npcName = t(action.params!.npcName as TranslationKey);
          const npc = currentChunk.NPCs.find((n: any) => t(n.name as TranslationKey) === npcName);
          if (npc) {
              const templates = getTemplates(language);
              let npcDef: any;
               for (const terrain of Object.keys(templates)) {
                      const templateNpc = templates[terrain as 'forest']?.NPCs.find((n: any) => t(n.data.name as TranslationKey) === npcName);
                  if (templateNpc) {
                      npcDef = templateNpc.data;
                      break;
                  }
              }
              if (npcDef?.quest && npcDef.questItem) {
                  const questText = t(npcDef.quest as TranslationKey);
                  if (newPlayerStats.quests.includes(questText)) {
                      const itemInInventory = newPlayerStats.items.find((i: PlayerItem) => getTranslatedText(i.name, 'en') === npcDef.questItem!.name);
                      if (itemInInventory && itemInInventory.quantity >= npcDef.questItem!.quantity) {
                          addNarrativeEntry(t('gaveItemToNpc', { quantity: npcDef.questItem.quantity, itemName: t(npcDef.questItem.name as TranslationKey), npcName: npcName}), 'system');
                          itemInInventory.quantity -= npcDef.questItem!.quantity;
                          if (itemInInventory.quantity <= 0) newPlayerStats.items = newPlayerStats.items.filter(i => getTranslatedText(i.name, 'en') !== npcDef!.questItem!.name);
                          (npcDef.rewardItems || []).forEach((reward: PlayerItem) => {
                          const existingItem = newPlayerStats.items.find((i: PlayerItem) => getTranslatedText(i.name, 'en') === getTranslatedText(reward.name, 'en'));
                          if (existingItem) existingItem.quantity += reward.quantity;
                              else newPlayerStats.items.push(ensurePlayerItemId({...reward}, customItemDefinitions, t, language));
                          });
                          newPlayerStats.quests = newPlayerStats.quests.filter(q => q !== questText);
                          addNarrativeEntry(t('npcQuestCompleted', { npcName: npcName }), 'narrative');
                          toast({ title: t('questCompletedTitle'), description: questText });
                      } else addNarrativeEntry(t('npcQuestNotEnoughItems', { npcName: npcName, needed: npcDef.questItem.quantity - (itemInInventory?.quantity || 0), itemName: t(npcDef.questItem.name as TranslationKey) }), 'narrative');
                  } else { newPlayerStats.quests.push(questText); addNarrativeEntry(t('npcQuestGive', { npcName: npcName, questText: questText }), 'narrative'); }
              } else addNarrativeEntry(t('npcNoQuest', { npcName: npcName }), 'narrative');
          }
      } else if (textKey === 'useItemOnNpcAction') {
          const npcName = t(action.params!.npcName as TranslationKey);
          const itemName = action.params!.itemName as string;
          const npc = currentChunk.NPCs.find((n: any) => t(n.name as TranslationKey) === npcName);
          if (npc && itemName === 'cvnt_essence') {
              // Special logic for Floptropica quest completion
              const questText = t('floptropica_quest2');
              if (newPlayerStats.quests.includes(questText)) {
                  const itemInInventory = newPlayerStats.items.find((i: PlayerItem) => getTranslatedText(i.name, 'en') === 'cvnt_essence');
                  if (itemInInventory && itemInInventory.quantity >= 1) {
                      // Consume the item
                      itemInInventory.quantity -= 1;
                      if (itemInInventory.quantity <= 0) {
                          newPlayerStats.items = newPlayerStats.items.filter(i => getTranslatedText(i.name, 'en') !== 'cvnt_essence');
                      }

                      // Complete the quest
                      newPlayerStats.quests = newPlayerStats.quests.filter(q => q !== questText);

                      // Add reward item (meme_template)
                      const rewardItemName = 'meme_template';
                      const existingRewardItem = newPlayerStats.items.find((i: PlayerItem) => getTranslatedText(i.name, 'en') === rewardItemName);
                      if (existingRewardItem) {
                          existingRewardItem.quantity += 1;
                      } else {
                          const rewardItemDef = resolveItemDef(rewardItemName);
                          if (rewardItemDef) {
                              newPlayerStats.items.push(ensurePlayerItemId({
                                  name: { en: rewardItemName, vi: t(rewardItemName as TranslationKey) },
                                  quantity: 1,
                                  tier: rewardItemDef.tier,
                                  emoji: rewardItemDef.emoji
                              }, customItemDefinitions, t, language));
                          }
                      }

                      // Add narrative and toast
                      addNarrativeEntry(t('floptropicaQuest2Completed', { npcName: npcName }), 'narrative');
                      toast({ title: t('questCompletedTitle'), description: questText });
                  } else {
                      addNarrativeEntry(t('itemNotFound'), 'system');
                  }
              } else {
                  addNarrativeEntry(t('npcNoQuest', { npcName: npcName }), 'narrative');
              }
          } else {
              addNarrativeEntry(t('invalidAction'), 'system');
          }
      } else if (textKey === 'exploreAction') {
          const result = handleSearchAction(
              currentChunk,
              action.id,
              language,
              t,
              customItemDefinitions,
              (range) => clamp(Math.floor(Math.random() * (range.max - range.min + 1)) + range.min, 1, Infinity),
              // pass optional spawnMultiplier from worldProfile (fallback to 1)
              (worldProfile && worldProfile.spawnMultiplier) || 1
          );
          
          if (result.toastInfo) {
              toast({
                  title: t(result.toastInfo.title),
                  description: t(result.toastInfo.description, result.toastInfo.params)
              });
          }
          addNarrativeEntry(result.narrative, 'narrative');
          setWorld(prev => ({...prev, [`${playerPosition.x},${playerPosition.y}`]: result.newChunk}));
      } else if (textKey === 'pickUpAction_item') {
          const chunkKey = `${playerPosition.x},${playerPosition.y}`;
      const itemInChunk = currentChunk.items.find((i: ChunkItem) => getTranslatedText(i.name, 'en') === action.params!.itemName);
          
          if (!itemInChunk) {
              toast({ title: t('actionNotAvailableTitle'), description: t('itemNotFoundNarrative', {itemName: t(action.params!.itemName as TranslationKey)}), variant: 'destructive' });
               setWorld(prev => {
                  const newWorld = { ...prev };
                  const chunkToUpdate = { ...newWorld[chunkKey]! };
                  chunkToUpdate.actions = chunkToUpdate.actions.filter((a: any) => a.id !== action.id);
                  newWorld[chunkKey] = chunkToUpdate;
                  return newWorld;
              });
              return;
          }

          toast({
              title: t('itemPickedUpTitle'),
              description: t('pickedUpItemToast', { quantity: itemInChunk.quantity, itemName: t(itemInChunk.name as TranslationKey) }),
          });
          
              const itemInInventory = newPlayerStats.items.find((i: PlayerItem) => getTranslatedText(i.name, 'en') === getTranslatedText(itemInChunk.name, 'en'));
          if (itemInInventory) {
              itemInInventory.quantity += itemInChunk.quantity;
          } else {
              newPlayerStats.items.push(ensurePlayerItemId({...itemInChunk}, customItemDefinitions, t, language));
          }
          
          // Buffer pickup narratives: collect into a short window and flush a single
          // aggregated narrative to avoid spamming a long sequence of per-item details.
          try {
              const resolvedDef = resolveItemDef(getTranslatedText(itemInChunk.name, 'en'));
              const senseKey = resolvedDef?.senseEffect?.keywords?.[0] || undefined;
              pickupBufferRef.current.items.push({ name: itemInChunk.name, quantity: itemInChunk.quantity || 1, senseKey, emoji: itemInChunk.emoji });
              // schedule flush in 250ms if not already scheduled
              if (!pickupBufferRef.current.timer) {
                  pickupBufferRef.current.timer = setTimeout(() => flushPickupBuffer(), 250) as any;
              }
          } catch {
              // If buffering fails, fall back to adding a safe single-line narrative
              addNarrativeEntry(t('pickedUpItemNarrative', { quantity: itemInChunk.quantity, itemName: t(itemInChunk.name as TranslationKey) }), 'narrative');
          }

          setWorld(prev => {
              const newWorld = { ...prev };
              const chunkToUpdate = { ...newWorld[chunkKey]! };
              chunkToUpdate.items = chunkToUpdate.items.filter((i: any) => getTranslatedText(i.name, 'en') !== getTranslatedText(itemInChunk.name, 'en'));
                  chunkToUpdate.actions = chunkToUpdate.actions.filter((a: any) => a.id !== action.id);
              newWorld[chunkKey] = chunkToUpdate;
              return newWorld;
          });
      } else if (textKey === 'listenToSurroundingsAction') {
          const directions = [{ dx: 0, dy: 1, dir: 'North' }, { dx: 0, dy: -1, dir: 'South' }, { dx: 1, dy: 0, dir: 'East' }, { dx: -1, dy: 0, dir: 'West' }];
          let heardSomething = false;
          for (const dir of directions) {
              const checkPos = { x: playerPosition.x + dir.dx, y: playerPosition.y + dir.dy };
              const chunkKey = `${checkPos.x},${checkPos.y}`;
              if (world[chunkKey] && world[chunkKey].enemy) {
                  addNarrativeEntry(t('listenHearSomething', { direction: t(`direction${dir.dir}` as TranslationKey), sound: t('enemySoundGeneric') }), 'narrative');
                  heardSomething = true;
                  break;
              }
          }
           if (!heardSomething) {
              let hintGiven = false;
              for (const dir of directions) {
                  const biomeCheckPos = { x: playerPosition.x + dir.dx * 3, y: playerPosition.y + dir.dy * 3 };
                  const biomeKey = `${biomeCheckPos.x},${biomeCheckPos.y}`;
                  const adjacentChunk = world[biomeKey];
                  if (adjacentChunk && adjacentChunk.terrain !== currentChunk.terrain) {
                      const biomeSoundKey = `biomeSound_${adjacentChunk.terrain}` as TranslationKey;
                      const sound = t(biomeSoundKey);
                      if (sound !== biomeSoundKey) {
                           addNarrativeEntry(t('listenHearBiome', { direction: t(`direction${dir.dir}` as TranslationKey), sound: sound }), 'narrative');
                           hintGiven = true;
                           break;
                      }
                  }
              }
               if (!hintGiven) {
                  addNarrativeEntry(t('listenHearNothing'), 'narrative');
              }
          }
      } else if (textKey === 'analyzeAction') {
          const chunk = getEffectiveChunk(currentChunk, weatherZones, gameTime, sStart, sDayDuration);
          let analysis = `[Analysis Report]\nCoordinates: (${chunk.x}, ${chunk.y})\nRegion ID: ${chunk.regionId}\nTerrain: ${t(chunk.terrain as TranslationKey)}\nTravel Cost: ${chunk.travelCost}\n\nEnvironmental Factors:\n- Temperature: ${chunk.temperature?.toFixed(1)}°C\n- Moisture: ${chunk.moisture}/100\n- Light Level: ${chunk.lightLevel}/100\n- Danger Level: ${chunk.dangerLevel}/100\n- Explorability: ${chunk.explorability.toFixed(1)}/100\n- Magic Affinity: ${chunk.magicAffinity}/100\n- Human Presence: ${chunk.humanPresence}/100\n- Predator Presence: ${chunk.predatorPresence}/100\n- Vegetation Density: ${chunk.vegetationDensity}/100\n- Soil Type: ${t(chunk.soilType as TranslationKey)}\n- Wind Level: ${chunk.windLevel?.toFixed(1) ?? 'N/A'}/100\n\nEntities:\n- Items: ${chunk.items.map((i: any) => t(i.name) + ` (x${i.quantity})`).join(', ') || 'None'}\n- NPCs: ${chunk.NPCs.map((n: any) => t(n.name)).join(', ') || 'None'}\n- Structures: ${chunk.structures.map((s: any) => t(s.name)).join(', ') || 'None'}`;

          if (chunk.enemy) {
              const enemy = chunk.enemy;
              analysis += `\n\nEnemy:\n  Type: ${t(enemy.type as any)}\n  HP: ${enemy.hp}\n  Damage: ${enemy.damage}\n  Behavior: ${enemy.behavior}\n  Size: ${enemy.size}\n  Diet: ${enemy.diet.join(', ')}\n  Satiation: ${enemy.satiation}/${enemy.maxSatiation}`;
              if (enemy.senseEffect) {
                  analysis += `\n  Sense Effect: ${enemy.senseEffect.keywords.join(', ')}`;
              }
              if (enemy.harvestable) {
                  analysis += `\n  Harvestable:\n    Difficulty: ${enemy.harvestable.difficulty}\n    Required Tool: ${t(enemy.harvestable.requiredTool as TranslationKey)}\n    Loot: ${enemy.harvestable.loot.map((loot: any) => `${t(loot.name as TranslationKey)} (${loot.chance * 100}% chance)`).join(', ')}`;
              }
          }

          addNarrativeEntry(analysis, 'system');
      }

      setPlayerStats(() => newPlayerStats);
      advanceGameTime(newPlayerStats);
    }, [addNarrativeEntry, playerStats, t, world, playerPosition, toast, advanceGameTime, customItemDefinitions, setWorld, turn, weatherZones, gameTime, setPlayerStats, language]);

  const handleAction = useCallback((actionId: number) => {
    if (isLoading || isGameOver || !isLoaded) return;
    const chunk = world[`${playerPosition.x},${playerPosition.y}`];
    if(!chunk) return;
    
    const action = chunk.actions.find((a: any) => a.id === actionId);
    if (!action) {
        toast({ title: t('actionNotAvailableTitle'), description: t('actionNotAvailableDesc'), variant: 'destructive' });
        return;
    }
    
    const actionText = t(action.textKey as TranslationKey, action.params);
    addNarrativeEntry(actionText, 'action');
    if (isOnline && action.textKey === 'talkToAction_npc') {
        const newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText]};
        handleOnlineNarrative(actionText, world, playerPosition, newPlayerStats);
    } else {
        handleOfflineAction(action);
    }
  }, [isLoading, isGameOver, isLoaded, world, playerPosition, playerStats, isOnline, handleOnlineNarrative, handleOfflineAction, toast, t, addNarrativeEntry]);

  const handleAttack = useCallback(() => {
    if (isLoading || isGameOver || !isLoaded) return;
    setPlayerBehaviorProfile(p => ({ ...p, attacks: p.attacks + 1 }));
    const baseChunk = world[`${playerPosition.x},${playerPosition.y}`];
    if (!baseChunk?.enemy) { addNarrativeEntry(t('noTarget'), 'system'); return; }
    
    const actionText = `${t('attackAction')} ${t(baseChunk.enemy.type as TranslationKey)}`;
    addNarrativeEntry(actionText, 'action');
    const newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText]};

    setPlayerStats(() => newPlayerStats);
    handleOfflineAttack();
    }, [isLoading, isGameOver, isLoaded, setPlayerBehaviorProfile, world, playerPosition, addNarrativeEntry, t, playerStats, handleOfflineAttack, setPlayerStats]);

  const handleCustomAction = useCallback((text: string) => {
    if (!text.trim() || isLoading || isGameOver || !isLoaded) return;
    setPlayerBehaviorProfile(p => ({ ...p, customActions: p.customActions + 1 }));

    if (text.trim().toLowerCase() === 'analyze') {
        handleOfflineAction({id: -1, textKey: 'analyzeAction'});
        return;
    }

    const newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), text]};
    addNarrativeEntry(text, 'action');
    if (isOnline) {
        handleOnlineNarrative(text, world, playerPosition, newPlayerStats);
    }
    else {
         addNarrativeEntry(t('customActionFail'), 'narrative');
         setPlayerStats(() => newPlayerStats);
         advanceGameTime(newPlayerStats);
    }
  }, [isLoading, isGameOver, isLoaded, setPlayerBehaviorProfile, playerStats, isOnline, handleOnlineNarrative, handleOfflineAction, world, playerPosition, addNarrativeEntry, t, advanceGameTime, setPlayerStats]);

  const handleCraft = useCallback(async (recipe: Recipe, outcome: CraftingOutcome) => {
    if (isLoading || isGameOver) return;
    setPlayerBehaviorProfile(p => ({ ...p, crafts: p.crafts + 1 }));

    if (!outcome.canCraft) { toast({ title: t('error'), description: t('notEnoughIngredients'), variant: "destructive" }); return; }
    
    const actionText = t('craftAction', {itemName: t(recipe.result.name as TranslationKey)});
    addNarrativeEntry(actionText, 'action');
    let updatedItems = (playerStats.items || []).map(i => ({...i}));
    outcome.ingredientsToConsume.forEach((itemToConsume: any) => {
        const itemIndex = updatedItems.findIndex((i: PlayerItem) => getTranslatedText(i.name, 'en') === itemToConsume.name);
        if (itemIndex > -1) updatedItems[itemIndex].quantity -= itemToConsume.quantity;
    });
    
    let nextPlayerStats = { ...playerStats, items: updatedItems.filter(i => i.quantity > 0), dailyActionLog: [...(playerStats.dailyActionLog || []), actionText] };

    if (Math.random() * 100 < outcome.chance) {
        const newInventory = [...nextPlayerStats.items];
        const resultItemIndex = newInventory.findIndex(i => getTranslatedText(i.name, 'en') === recipe.result.name);
        if (resultItemIndex > -1) newInventory[resultItemIndex].quantity += recipe.result.quantity;
    else newInventory.push({ ...(recipe.result as PlayerItem), tier: resolveItemDef(recipe.result.name)?.tier || 1, emoji: recipe.result.emoji || resolveItemDef(recipe.result.name)?.emoji || '📦' });
        nextPlayerStats.items = newInventory;
        
        const successKeys: TranslationKey[] = ['craftSuccess1', 'craftSuccess2', 'craftSuccess3'];
        const randomKey = successKeys[Math.floor(Math.random() * successKeys.length)];
        addNarrativeEntry(t(randomKey, { itemName: t(recipe.result.name as TranslationKey) }), 'system');
        toast({ title: t('craftSuccessTitle'), description: t('craftSuccess', { itemName: t(recipe.result.name as TranslationKey) }) });
    } else {
        const failKeys: TranslationKey[] = ['craftFail1', 'craftFail2', 'craftFail3'];
        const randomKey = failKeys[Math.floor(Math.random() * failKeys.length)];
        addNarrativeEntry(t(randomKey, { itemName: t(recipe.result.name as TranslationKey) }), 'system');
        toast({ title: t('craftFailTitle'), description: t('craftFail', { itemName: t(recipe.result.name as TranslationKey) }), variant: 'destructive' });
    }
    setPlayerStats(() => nextPlayerStats);
    advanceGameTime(nextPlayerStats);
    }, [isLoading, isGameOver, setPlayerBehaviorProfile, playerStats, customItemDefinitions, addNarrativeEntry, toast, t, advanceGameTime, setPlayerStats]);

  const handleItemUsed = useCallback((itemName: TranslatableString, target: 'player' | TranslatableString) => {
    if (isLoading || isGameOver || !isLoaded) return;
    const actionText = target === 'player' ? `${t('useAction')} ${t(itemName as TranslationKey)}` : `${t('useOnAction', {item: t(itemName as TranslationKey), target: t(target as TranslationKey)})}`;
    addNarrativeEntry(actionText, 'action');
    
    handleOfflineItemUse(getTranslatedText(itemName, 'en'), getTranslatedText(target, 'en'));

    }, [isLoading, isGameOver, isLoaded, t, handleOfflineItemUse, addNarrativeEntry]);

  const handleUseSkill = useCallback((skillName: string) => {
    if (isLoading || isGameOver || !isLoaded) return;
    const actionText = `${t('useSkillAction')} ${skillName}`;
    addNarrativeEntry(actionText, 'action');

    handleOfflineSkillUse(skillName);
    }, [isLoading, isGameOver, isLoaded, t, handleOfflineSkillUse, addNarrativeEntry]);

  const handleBuild = useCallback((structureName: string) => {
    if (isLoading || isGameOver) return;

    const currentChunk = world[`${playerPosition.x},${playerPosition.y}`];
    if (currentChunk?.structures.length > 0) {
        toast({ title: t('structureLimitTitle'), description: t('structureLimitDesc'), variant: "destructive" });
        return;
    }

    const structureToBuild = buildableStructures[structureName];
    if (!structureToBuild?.buildable) return;

    const buildStaminaCost = 15;
    if ((playerStats.stamina ?? 0) < buildStaminaCost) { toast({ title: t('notEnoughStamina'), description: t('notEnoughStaminaDesc', { cost: buildStaminaCost, current: (playerStats.stamina ?? 0).toFixed(0) }), variant: "destructive" }); return; }

    const inventoryMap = new Map((playerStats.items || []).map(item => [getTranslatedText(item.name, 'en'), item.quantity]));
    if (!structureToBuild.buildCost?.every((cost: any) => (inventoryMap.get(cost.name) || 0) >= cost.quantity)) { toast({ title: t('notEnoughIngredients'), variant: "destructive" }); return; }
    
    const actionText = t('buildConfirm',{structureName: t(structureName as TranslationKey)});
    addNarrativeEntry(actionText, 'action');
    let updatedItems = (playerStats.items || []).map(i => ({...i}));
    structureToBuild.buildCost?.forEach((cost: any) => { updatedItems.find((i: PlayerItem) => getTranslatedText(i.name, 'en') === cost.name)!.quantity -= cost.quantity; });
    
    const nextPlayerStats = { ...playerStats, items: updatedItems.filter(item => item.quantity > 0), stamina: playerStats.stamina - buildStaminaCost, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText] };
    
    const key = `${playerPosition.x},${playerPosition.y}`;
    setWorld(prev => {
        const newWorld = { ...prev };
        const chunkToUpdate = { ...newWorld[key]! };
        const newStructure = { name: structureToBuild.name, description: t(structureToBuild.description as TranslationKey), emoji: structureToBuild.emoji, providesShelter: structureToBuild.providesShelter, restEffect: structureToBuild.restEffect, heatValue: structureToBuild.heatValue };
        chunkToUpdate.structures = [...(chunkToUpdate.structures || []), newStructure];
        newWorld[key] = chunkToUpdate;
        return newWorld;
    });

    addNarrativeEntry(t('builtStructure', { structureName: t(structureName as TranslationKey) }), 'system');
    setPlayerStats(() => nextPlayerStats);
    advanceGameTime(nextPlayerStats);
    }, [isLoading, isGameOver, buildableStructures, playerStats, playerPosition, addNarrativeEntry, advanceGameTime, toast, t, setWorld, world, setPlayerStats]);

  const handleRest = useCallback(() => {
    if (isLoading || isGameOver) return;
    const shelter = world[`${playerPosition.x},${playerPosition.y}`]?.structures.find((s: any) => s.restEffect);
    if (!shelter?.restEffect) { toast({ title: t('cantRestTitle'), description: t('cantRestDesc') }); return; }

    const actionText = t('restInShelter', { shelterName: t(shelter.name as TranslationKey) });
    addNarrativeEntry(actionText, 'action');
    
    const oldStats = {...playerStats};
    const newHp = Math.min(100, oldStats.hp + shelter.restEffect.hp);
    const newStamina = Math.min(100, oldStats.stamina + shelter.restEffect.stamina);
    const newTemp = 37;

    let restoredParts: string[] = [];
    if (newHp > oldStats.hp) {
        restoredParts.push(t('restHP', { amount: newHp - oldStats.hp }));
    }
    if (newStamina > oldStats.stamina) {
        restoredParts.push(t('restStamina', { amount: (newStamina - oldStats.stamina).toFixed(0) }));
    }

    if(restoredParts.length > 0) {
        addNarrativeEntry(t('restSuccess', { restoration: restoredParts.join(t('andConnector')) }), 'system');
    } else {
        addNarrativeEntry(t('restNoEffect'), 'system');
    }

    if(oldStats.bodyTemperature !== newTemp) {
        addNarrativeEntry(t('restSuccessTemp'), 'system');
    }

    const nextPlayerStats = { ...playerStats, hp: newHp, stamina: newStamina, bodyTemperature: newTemp, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText] };
    setPlayerStats(() => nextPlayerStats);
    advanceGameTime(nextPlayerStats);
    }, [isLoading, isGameOver, world, playerPosition, addNarrativeEntry, advanceGameTime, t, toast, playerStats, setPlayerStats]);
  
  const handleFuseItems = useCallback(async (itemsToFuse: PlayerItem[]) => {
    if (isLoading || isGameOver) return;
    setIsLoading(true);

    const baseChunk = world[`${playerPosition.x},${playerPosition.y}`];
    if (!baseChunk) { setIsLoading(false); return; }

    const effectiveChunk = getEffectiveChunk(baseChunk, weatherZones, gameTime, sStart, sDayDuration);
    const weather = weatherZones[effectiveChunk.regionId]?.currentWeather;
    let successChanceBonus = playerStats.persona === 'artisan' ? 10 : 0;
    let elementalAffinity: any = 'none';
    let chaosFactor = effectiveChunk.magicAffinity;

    if(weather?.exclusive_tags.includes('storm')) { successChanceBonus += 5; elementalAffinity = 'electric'; }
    if(weather?.exclusive_tags.includes('heat')) elementalAffinity = 'fire';
    if(effectiveChunk.dangerLevel > 80) { successChanceBonus -= 5; chaosFactor += 20; }
    
    const actionText = t('fuseAction', { items: itemsToFuse.map(i => t(i.name as TranslationKey)).join(', ') });
    addNarrativeEntry(actionText, 'action');
    let newItems = (playerStats.items || []).map(i => ({...i}));
    itemsToFuse.forEach((item: PlayerItem) => { newItems.find((i: PlayerItem) => getTranslatedText(i.name, 'en') === getTranslatedText(item.name, 'en'))!.quantity -= 1; });
    let nextPlayerStats = { ...playerStats, items: newItems.filter(i => i.quantity > 0), dailyActionLog: [...(playerStats.dailyActionLog || []), actionText] };
    setPlayerStats(() => nextPlayerStats);

    try {
        const normalizeChunkForAI = (c?: Chunk | null): Chunk | null => {
            if (!c) return null;
            const enemy = c.enemy ? { ...c.enemy, type: getTranslatedText(c.enemy.type ?? { en: '' }, language) } : null;
            return { ...c, enemy } as Chunk;
        };

    const normalizedEffectiveChunk = normalizeChunkForAI(effectiveChunk as Chunk);

        const result = await fuseItems({
            itemsToFuse, playerPersona: playerStats.persona, currentChunk: normalizedEffectiveChunk as any,
            environmentalContext: { biome: effectiveChunk.terrain, weather: t(weather?.name as TranslationKey) || 'clear' },
            environmentalModifiers: { successChanceBonus, elementalAffinity, chaosFactor: clamp(chaosFactor, 0, 100) },
            language, customItemDefinitions, fullItemCatalog: customItemCatalog,
        });

        addNarrativeEntry(result.narrative, 'narrative');
        
            if (result.resultItem) {
            nextPlayerStats = { ...nextPlayerStats, items: [...nextPlayerStats.items] }; 
            const resultItemId = resolveItemId(result.resultItem.name, customItemDefinitions, t, language) ?? getTranslatedText(result.resultItem.name, 'en');
            const existingItem = nextPlayerStats.items.find((i: PlayerItem) => i.id === resultItemId || getTranslatedText(i.name, 'en') === resultItemId);
            if (existingItem) {
                existingItem.quantity += result.resultItem!.baseQuantity.min;
            } else {
                const itemToAdd: PlayerItem = {
                    name: result.resultItem.name,
                    quantity: result.resultItem.baseQuantity.min,
                    tier: result.resultItem.tier,
                    emoji: result.resultItem.emoji,
                    id: resultItemId
                };
                nextPlayerStats.items.push(ensurePlayerItemId(itemToAdd, customItemDefinitions, t, language));
            }
            
            if(!resolveItemDef(resultItemId)) {
                const newItem = result.resultItem;
                setCustomItemCatalog(prev => [...prev, newItem]);
                setCustomItemDefinitions(prev => ({ ...prev, [resultItemId]: { ...newItem }}));
                if(db) {
                    await setDoc(doc(db, "world-catalog", "items", "generated", resultItemId), newItem);
                }
            }
        }
        setPlayerStats(() => nextPlayerStats);
        advanceGameTime(nextPlayerStats);
    } catch (error: any) {
        logger.error("AI Fusion failed:", e);
        toast({ title: t('error'), description: t('fusionError'), variant: "destructive" });
        setPlayerStats(() => nextPlayerStats);
        advanceGameTime(nextPlayerStats);
    } finally {
        setIsLoading(false);
    }
  }, [isLoading, isGameOver, world, playerPosition, playerStats, weatherZones, language, customItemDefinitions, customItemCatalog, addNarrativeEntry, advanceGameTime, t, toast, setIsLoading, setPlayerStats, setCustomItemCatalog, setCustomItemDefinitions, gameTime]);

  const handleRequestQuestHint = useCallback(async (questText: string) => {
    if (playerStats.questHints?.[questText] || !isOnline) return;

    try {
        const result = await provideQuestHint({ questText, language });
        setPlayerStats(prev => ({ ...prev, questHints: { ...prev.questHints, [questText]: result.hint } }));
    } catch (error: any) {
        logger.error("Failed to get quest hint:", error);
        toast({ title: t('error'), description: t('suggestionError'), variant: "destructive" });
    }
  }, [playerStats.questHints, isOnline, language, setPlayerStats, toast, t]);

  const handleEquipItem = useCallback((itemName: string) => {
    if (isLoading || isGameOver) return;

    setPlayerStats(prevStats => {
        const newStats: PlayerStatus = JSON.parse(JSON.stringify(prevStats));
    const itemDef = resolveItemDef(getTranslatedText(itemName as TranslationKey, 'en'));
        if (!itemDef || !itemDef.equipmentSlot) return prevStats;

        const itemToEquipIndex = newStats.items.findIndex(i => getTranslatedText(i.name, 'en') === getTranslatedText(itemName as TranslationKey, 'en'));
        if (itemToEquipIndex === -1) return prevStats; 
    
        const itemToEquip = newStats.items[itemToEquipIndex];
        const slot = itemDef.equipmentSlot!;
    
        const currentEquipped = (newStats.equipment as any)[slot];
        if (currentEquipped) {
            const existingInInventory = newStats.items.find((i: PlayerItem) => getTranslatedText(i.name, 'en') === getTranslatedText(currentEquipped.name, 'en'));
            if (existingInInventory) {
                existingInInventory.quantity += 1;
            } else {
                newStats.items.push(ensurePlayerItemId({ ...currentEquipped, quantity: 1 }, customItemDefinitions, t, language));
            }
        }
    
        (newStats.equipment as any)[slot] = { name: itemToEquip.name, quantity: 1, tier: itemToEquip.tier, emoji: itemDef.emoji };
    
        if (itemToEquip.quantity > 1) {
            itemToEquip.quantity -= 1;
        } else {
            newStats.items.splice(itemToEquipIndex, 1);
        }
        
        let basePhysAtk = 10, baseMagAtk = 5, baseCrit = 5, baseAtkSpd = 1.0, baseCd = 0, basePhysDef = 0, baseMagDef = 0;
    Object.values(newStats.equipment).forEach((equipped: any) => {
            if (equipped) {
                const def = resolveItemDef(getTranslatedText(equipped.name, 'en'));
                if (def?.attributes) {
                    basePhysAtk += def.attributes.physicalAttack || 0;
                    baseMagAtk += def.attributes.magicalAttack || 0;
                    baseCrit += def.attributes.critChance || 0;
                    baseAtkSpd += def.attributes.attackSpeed || 0;
                    baseCd += def.attributes.cooldownReduction || 0;
                    basePhysDef += def.attributes.physicalDefense || 0;
                    baseMagDef += def.attributes.magicalDefense || 0;
                }
            }
        });
        newStats.attributes = { physicalAttack: basePhysAtk, magicalAttack: baseMagAtk, physicalDefense: basePhysDef, magicalDefense: baseMagDef, critChance: baseCrit, attackSpeed: baseAtkSpd, cooldownReduction: baseCd };

        return newStats;
    });
  }, [isLoading, isGameOver, customItemDefinitions, setPlayerStats]);
  
  const handleUnequipItem = useCallback((slot: EquipmentSlot) => {
    if (isLoading || isGameOver) return;

    setPlayerStats(prevStats => {
        const newStats: PlayerStatus = JSON.parse(JSON.stringify(prevStats));
        const itemToUnequip = newStats.equipment[slot];
        if (!itemToUnequip) return prevStats;

    const existingInInventory = newStats.items.find((i: PlayerItem) => getTranslatedText(i.name, 'en') === getTranslatedText(itemToUnequip.name, 'en'));
        if (existingInInventory) {
            existingInInventory.quantity += 1;
        } else {
            const itemDef = resolveItemDef(getTranslatedText(itemToUnequip.name, 'en'));
            newStats.items.push(ensurePlayerItemId({ ...itemToUnequip, quantity: 1, emoji: itemDef?.emoji || '📦' }, customItemDefinitions, t, language));
        }

        (newStats.equipment as any)[slot] = null;
        
        let basePhysAtk = 10, baseMagAtk = 5, baseCrit = 5, baseAtkSpd = 1.0, baseCd = 0, basePhysDef = 0, baseMagDef = 0;
    Object.values(newStats.equipment).forEach((equipped: any) => {
            if (equipped) {
                const def = resolveItemDef(getTranslatedText(equipped.name, 'en'));
                if (def?.attributes) {
                    basePhysAtk += def.attributes.physicalAttack || 0;
                    baseMagAtk += def.attributes.magicalAttack || 0;
                    baseCrit += def.attributes.critChance || 0;
                    baseAtkSpd += def.attributes.attackSpeed || 0;
                    baseCd += def.attributes.cooldownReduction || 0;
                    basePhysDef += def.attributes.physicalDefense || 0;
                    baseMagDef += def.attributes.magicalDefense || 0;
                }
            }
        });
        newStats.attributes = { physicalAttack: basePhysAtk, magicalAttack: baseMagAtk, physicalDefense: basePhysDef, magicalDefense: baseMagDef, critChance: baseCrit, attackSpeed: baseAtkSpd, cooldownReduction: baseCd };
        
        return newStats;
    });
  }, [isLoading, isGameOver, customItemDefinitions, setPlayerStats]);

  const handleReturnToMenu = () => {
    window.location.href = '/';
  };

  const handleHarvest = useCallback((actionId: number) => {
    if (isLoading || isGameOver || !isLoaded) return;
    const chunk = world[`${playerPosition.x},${playerPosition.y}`];
    if(!chunk) return;
    
    const action = chunk.actions.find((a: any) => a.id === actionId);
    if (!action) {
        toast({ title: t('actionNotAvailableTitle'), description: t('actionNotAvailableDesc'), variant: 'destructive' });
        return;
    }

    const targetName = action.params?.targetName as string;
    const enemy = chunk.enemy;
    if (!enemy || getTranslatedText(enemy.type, 'en') !== targetName || !enemy.harvestable) {
        toast({ title: t('actionNotAvailableTitle'), description: t('cantHarvest'), variant: 'destructive' });
        return;
    }

    const requiredTool = enemy.harvestable.requiredTool;
    const playerHasTool = (playerStats.items || []).some(item => getTranslatedText(item.name, 'en') === requiredTool);

    if (!playerHasTool) {
        toast({ title: t('harvestFail_noTool'), description: t('harvestFail_noTool_desc', { tool: t(requiredTool as TranslationKey), target: t(targetName as TranslationKey) }), variant: 'destructive' });
        return;
    }
    
    const actionText = t('harvestAction', { target: t(targetName as TranslationKey) });
    addNarrativeEntry(actionText, 'action');

    let nextPlayerStats = { ...playerStats };
    nextPlayerStats.items = nextPlayerStats.items || [];
    let worldWasModified = false;
    const newWorld = { ...world };
    
    const lootItems: ChunkItem[] = [];
    enemy.harvestable.loot.forEach((loot: any) => {
        if (Math.random() < loot.chance) {
        const itemDef = resolveItemDef(loot.name);
            if(itemDef) {
                lootItems.push({
                    ...itemDef,
                    description: t(itemDef.description as TranslationKey),
                    quantity: clamp(Math.floor(Math.random() * (itemDef.baseQuantity.max - itemDef.baseQuantity.min + 1)) + itemDef.baseQuantity.min, 1, Infinity)
                });
            }
        }
    });
    
    if (lootItems.length > 0) {
        const lootText = lootItems.map(l => `${l.quantity} ${t(l.name as TranslationKey)}`).join(', ');
        addNarrativeEntry(t('harvestSuccess', { loot: lootText, target: t(targetName as TranslationKey)}), 'system');
        
        lootItems.forEach((lootItem: ChunkItem) => {
            const existingItem = nextPlayerStats.items.find((i: PlayerItem) => getTranslatedText(i.name, 'en') === getTranslatedText(lootItem.name, 'en'));
            if(existingItem) {
                existingItem.quantity += lootItem.quantity;
            } else {
                nextPlayerStats.items.push(ensurePlayerItemId(lootItem as PlayerItem, customItemDefinitions, t, language));
            }
        });
    } else {
        addNarrativeEntry(t('harvestFail_noLoot', { target: t(targetName as TranslationKey) }), 'system');
    }

    newWorld[`${playerPosition.x},${playerPosition.y}`]!.enemy = null;
    newWorld[`${playerPosition.x},${playerPosition.y}`]!.actions = newWorld[`${playerPosition.x},${playerPosition.y}`]!.actions.filter((a: any) => a.id !== actionId);
    worldWasModified = true;
    
    if(worldWasModified) {
        setWorld(() => newWorld);
    }

    setPlayerStats(() => nextPlayerStats);
    advanceGameTime(nextPlayerStats);
    }, [isLoading, isGameOver, isLoaded, world, playerPosition, playerStats, toast, t, addNarrativeEntry, customItemDefinitions, advanceGameTime, setWorld, setPlayerStats]);

  const handleMove = useCallback((direction: "north" | "south" | "east" | "west") => {
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
     if (nextChunk?.terrain === 'ocean' && !(playerStats.items || []).some(item => getTranslatedText(item.name, 'en') === 'inflatable_raft')) {
        addNarrativeEntry(t('oceanTravelBlocked'), 'system');
        return;
    }
    
    setPlayerBehaviorProfile(prev => ({ ...prev, moves: prev.moves + 1 }));
    
    const dirKey = `direction${direction.charAt(0).toUpperCase() + direction.slice(1)}` as TranslationKey;
    const directionText = t(dirKey);
    const actionText = t('wentDirection', { direction: directionText });
    addNarrativeEntry(actionText, 'action');

    // optimistic placeholder: add a low-detail movement narrative immediately
    const placeholderId = `${Date.now()}-move-${x}-${y}`;
    // choose short vs long placeholder based on narrative length setting
    const movingKey = settings.narrativeLength === 'long' ? 'movingLong' : 'movingShort';
    // brief_sensory will be computed after we read finalChunk (best-effort)
    const placeholderText = t(movingKey as TranslationKey, { direction: directionText, brief_sensory: '' });
    addNarrativeEntry(placeholderText, 'narrative', placeholderId);

    setPlayerPosition({ x, y });
    
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
            // Best-effort: compute a short, localized sensory hint from the chunk
            let briefSensory = '';
            try {
                const computeBriefSensory = (c: any) => {
                    // Pick the single most prominent sensory condition (temperature/moisture/light)
                    // to avoid chaining multiple 'in the X, in the Y' fragments. We choose the
                    // condition with the largest deviation from neutral and render one concise
                    // localized phrase based on that.
                    const scores: { key: string; score: number }[] = [];
                    if (typeof c.temperature === 'number') {
                        // score = distance from comfortable (50) biasing extremes
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
                        // lightLevel in this project is typically -100..100; treat low values as dark
                        const l = c.lightLevel;
                        // light extremes get a boost
                        const score = Math.abs((l <= 0 ? 0 - l : 100 - l)) + (l <= 10 ? 10 : 0);
                        scores.push({ key: 'light', score });
                    }

                    // fallback: if nothing numeric present, return empty
                    if (scores.length === 0) return '';

                    scores.sort((a, b) => b.score - a.score);
                    const primary = scores[0].key;

                    // language-aware short patterns (keep these short so optimistic placeholder is not verbose)
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
                        "cảm giác chiếc {adj} len lỏi." // intentionally short
                    ];

                    // Helper: pick a localized adjective based on the primary condition
                    const pickAdj = () => {
                        try {
                            // Use the shared keyword variations DB if available on window scope via import
                            // but to avoid extra imports here, prefer existing translation keys for simple mapping.
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
                            // fallback
                        }
                        return '';
                    };

                    const adj = pickAdj();
                    const patterns = language === 'vi' ? patternsVi : patternsEn;
                    const chosenPattern = patterns[Math.floor(Math.random() * patterns.length)];
                    // Insert adjective into pattern; keep result short and trimmed.
                    return chosenPattern.replace('{adj}', adj).replace(/\s+/g, ' ').trim();
                };

                    briefSensory = computeBriefSensory(finalChunk);
                    if (briefSensory && briefSensory.length > 0) {
                        const updatedPlaceholder = t(movingKey as TranslationKey, { direction: directionText, brief_sensory: briefSensory });
                        // replace the optimistic placeholder with the improved brief sensory text
                        addNarrativeEntry(String(updatedPlaceholder).replace(/\{[^}]+\}/g, '').trim(), 'narrative', placeholderId);
                    }
            } catch (e: any) {
                // non-fatal: if computing brief sensory fails, continue to orchestrator/fallback
                 
                console.warn('[narrative] brief sensory computation failed', e);
            }

            // If the player moved repeatedly inside the same biome, prefer a short
            // "continuation" template (a smaller, linking sentence) rather than
            // loading a full descriptive template. This keeps movement prose compact.
            try {
                const prevChunk = worldSnapshot[`${playerPosition.x},${playerPosition.y}`];
                if (prevChunk && prevChunk.terrain && finalChunk.terrain && String(prevChunk.terrain) === String(finalChunk.terrain)) {
                    const db = getKeywordVariations(language as any);
                    const pool = (db as any)[`${String(finalChunk.terrain).toLowerCase()}_continuation`] || (db as any)['continuation'];
                    if (pool && Array.isArray(pool) && pool.length > 0) {
                        const pick = pool[Math.floor(Math.random() * pool.length)];
                        // Replace simple tokens
                        const text = String(pick).replace('{direction}', directionText).replace('{biome}', t(finalChunk.terrain as TranslationKey));
                        addNarrativeEntry(text, 'narrative', placeholderId);
                        lastMoveRef.current = { biome: finalChunk.terrain, time: Date.now() };
                        return;
                    }
                }
            } catch {
                // non-fatal
            }

                // Try to use precomputed bundle + runtime orchestrator first (lazy-loaded).
                (async () => {
                // First, attempt conditional movement templates (fast, local)
                try {
                    try {
                        const mn = await import('@/lib/game/movement-narrative');
                        const conditional = mn.selectMovementNarrative({ chunk: finalChunk, playerStats: newPlayerStats || playerStats, directionText, language, briefSensory });
                        if (conditional) {
                            addNarrativeEntry(String(conditional).replace(/\{[^}]+\}/g, '').trim(), 'narrative', placeholderId);
                            return;
                        }
                    } catch {
                        // non-fatal: if selector import or execution fails, continue to loader
                    }
                } catch {
                    // ignore and fallthrough to precomputed loader
                }
                try {
                    const loaderMod = await import('@/lib/narrative/loader');
                    const orchestrator = await import('@/lib/narrative/runtime-orchestrator');
                    const biomeKey = finalChunk.terrain || finalChunk.biome || 'default';
                    const bundle = await loaderMod.loadPrecomputedBundle(biomeKey, language);
                    if (bundle && bundle.templates && bundle.templates.length > 0) {
                        // Use conditional-aware orchestrator pick if available
                        try {
                            const res = orchestrator.pickVariantFromBundleWithConditions
                                ? orchestrator.pickVariantFromBundleWithConditions(bundle as any, { chunk: finalChunk, playerStats: newPlayerStats || playerStats, briefSensory }, { seed: `${x},${y}`, persona: undefined })
                                : null;
                            if (res && res.text) {
                                let finalText = String(res.text);
                                // Replace brief_sensory placeholder if present
                                if (briefSensory && briefSensory.length > 0) {
                                    finalText = finalText.replace(/\{\s*brief_sensory\s*\}/g, briefSensory).replace(/{{\s*brief_sensory\s*}}/g, briefSensory);
                                }
                                finalText = finalText.replace(/\{[^}]+\}/g, '').trim();
                                addNarrativeEntry(finalText, 'narrative', placeholderId);
                                return;
                            }
                        } catch {
                            // fall back to deterministic index-based pick
                            const seed = `${x},${y}`;
                            const idx = Math.abs(seed.split('').reduce((s, c) => s + c.charCodeAt(0), 0)) % bundle.templates.length;
                            const tplId = bundle.templates[idx].id;
                            const res = orchestrator.pickVariantFromBundle(bundle as any, tplId, { seed, persona: undefined });
                            if (res && res.text) {
                                const finalText = String(res.text).replace(/\{[^}]+\}/g, '').trim();
                                addNarrativeEntry(finalText, 'narrative', placeholderId);
                                return;
                            }
                        }
                    }
                } catch (e: any) {
                    // If anything fails, fall back to legacy offline generator
                     
                    console.warn('[narrative] precomputed load failed, falling back', String(e));
                }
                // fallback: use offline generator but reduce verbosity if this is a repeated movement
                const recent = narrativeLogRef.current?.slice(-6) || [];
                const repeatCount = recent.reduce((acc, e) => {
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

    }, [isLoading, isGameOver, playerPosition, world, addNarrativeEntry, t, playerStats, setPlayerBehaviorProfile, setPlayerPosition, settings.narrativeLength, language, advanceGameTime]);

  return {
    handleMove,
    handleAttack,
    handleAction,
    handleCustomAction,
    handleCraft,
    handleBuild,
    handleItemUsed,
    handleUseSkill,
    handleRest,
    handleFuseItems,
    handleRequestQuestHint,
    handleEquipItem,
    handleUnequipItem,
    handleReturnToMenu,
    handleHarvest,
  };
}
