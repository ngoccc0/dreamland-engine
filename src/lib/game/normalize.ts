import type { PlayerStatus, Chunk, TranslatableString, Language } from '@/core/types/game';
import { getTranslatedText } from '@/lib/utils';

/**
 * Minimal default player status used to fill missing fields during normalization.
 */
const DEFAULT_PLAYER_STATUS: PlayerStatus = {
  hp: 100,
  stamina: 100,
  maxStamina: 100,
  mana: 0,
  items: [],
  quests: [],
  skills: [],
  persona: 'none',
  pets: [],
  unlockProgress: { kills: 0, damageSpells: 0, moves: 0 },
  playerLevel: { level: 1, experience: 0 },
  questsCompleted: 0,
  equipment: {} as any,
  attributes: {},
};

/**
 * Normalize a partial PlayerStatus (loaded from save or other sources) into the
 * canonical PlayerStatus shape used through the engine.
 */
export function normalizePlayerStatus(partial: Partial<PlayerStatus> | undefined | null): PlayerStatus {
  const s = partial || {};
  return {
    ...DEFAULT_PLAYER_STATUS,
    ...s,
    hp: s.hp ?? DEFAULT_PLAYER_STATUS.hp,
    stamina: s.stamina ?? DEFAULT_PLAYER_STATUS.stamina,
    mana: s.mana ?? DEFAULT_PLAYER_STATUS.mana,
    items: s.items ?? [],
    quests: s.quests ?? [],
    skills: s.skills ?? [],
    persona: (s.persona as any) ?? 'none',
    pets: s.pets ?? [],
    unlockProgress: {
      kills: s.unlockProgress?.kills ?? 0,
      damageSpells: s.unlockProgress?.damageSpells ?? 0,
      moves: s.unlockProgress?.moves ?? 0,
    },
    playerLevel: typeof s.playerLevel === 'number'
      ? { level: s.playerLevel as number, experience: 0 }
      : (s.playerLevel ?? { level: 1, experience: 0 }),
    questsCompleted: s.questsCompleted ?? 0,
    equipment: s.equipment ?? {},
    attributes: s.attributes ?? {},
    dailyActionLog: s.dailyActionLog ?? [],
    questHints: s.questHints ?? {},
    // keep any extra dynamic fields
    ...Object.keys(s).reduce((acc, k) => {
      if ((acc as any)[k] === undefined && (s as any)[k] !== undefined) {
        (acc as any)[k] = (s as any)[k];
      }
      return acc;
    }, {} as any),
  } as PlayerStatus;
}

/**
 * Normalize a chunk for AI consumption: primarily converts translatable enemy/item names
 * to plain strings using the provided language and translator `t`.
 */
export function normalizeChunkForAI(chunk: Chunk | undefined | null, language: Language, t?: (key: string, params?: any) => string): Chunk | undefined {
  if (!chunk) return undefined;
  const enemy = chunk.enemy ? { ...chunk.enemy, type: getTranslatedText(chunk.enemy.type as TranslatableString, language, t) } : null;
  const items = (chunk.items || []).map(i => ({ ...i, name: getTranslatedText(i.name as TranslatableString, language, t) }));
  return { ...chunk, enemy, items } as Chunk;
}
