import { fill_template, generateOfflineNarrative } from '../offline';
import { biomeNarrativeTemplates } from '@/lib/game/data/narrative-templates';
import { narrativeTranslations } from '@/lib/locales/narrative';
import type { PlayerStatus } from '@/lib/game/types';

// Minimal mock translation function: use real translation entries when present
function makeT(lang: 'en' | 'vi') {
  const dict: any = (narrativeTranslations as any)[lang] || {};
  return (key: string, replacements?: Record<string, any>) => {
    let v: any = dict[key] ?? key;
    if (Array.isArray(v)) v = v[0];
    v = String(v);
    if (replacements) {
      for (const k of Object.keys(replacements)) {
        v = v.replace(new RegExp('\\{' + k + '\\}', 'g'), String(replacements[k]));
      }
    }
    // remove any remaining braces for safety in tests
    return v.replace(/\{\{|\}\}/g, '');
  };
}

function makeChunkForTerrain(terrain: string) {
  return {
    terrain,
    lightLevel: 50,
    temperature: 50,
    moisture: 50,
    items: [{ name: 'healing_herb' }],
    enemy: { type: 'wolf' },
  } as any;
}

test('all templates fill their {{}} placeholders (en)', () => {
  const t = makeT('en');
  const language: any = 'en';
  for (const key of Object.keys(biomeNarrativeTemplates)) {
    const data = (biomeNarrativeTemplates as any)[key];
    if (!data || !Array.isArray(data.descriptionTemplates)) continue;
    const chunk = makeChunkForTerrain(data.terrain);
    for (const tmpl of data.descriptionTemplates) {
      const mockPlayerState: PlayerStatus = {
        hp: 100,
        mana: 100,
        stamina: 100,
        maxStamina: 100,
        hunger: 0,
        statusEffects: [],
        staminaRecoveryTurns: 0,
        maxHpModifier: 1,
        maxStaminaModifier: 1,
        bodyTemperature: 37,
        items: [],
        equipment: { weapon: null, armor: null, accessory: null },
        quests: [],
        questsCompleted: 0,
        skills: [],
        persona: 'explorer',
        attributes: {},
        unlockProgress: { kills: 0, damageSpells: 0, moves: 0 },
        language: 'en',
        journal: {},
        dailyActionLog: [],
        questHints: {},
        trackedEnemy: undefined,
      } as PlayerStatus;

      const out = fill_template(tmpl.template, chunk, {}, { x: 0, y: 0 }, t as any, language, mockPlayerState);
      expect(out).not.toMatch(/{{\s*[^}]+\s*}}/);
    }
  }
});

test('generateOfflineNarrative produces no raw mustache tokens (en)', () => {
  const t = makeT('en');
  const language: any = 'en';
  // pick a terrain with templates
  const terrain = Object.keys(biomeNarrativeTemplates).find(k => (biomeNarrativeTemplates as any)[k].descriptionTemplates && (biomeNarrativeTemplates as any)[k].descriptionTemplates.length > 0) as string;
  expect(terrain).toBeTruthy();
  const chunk = makeChunkForTerrain((biomeNarrativeTemplates as any)[terrain].terrain);
  const previewPlayerState: PlayerStatus = {
    hp: 100,
    mana: 100,
    stamina: 100,
    maxStamina: 100,
    hunger: 0,
    statusEffects: [],
    staminaRecoveryTurns: 0,
    maxHpModifier: 1,
    maxStaminaModifier: 1,
    bodyTemperature: 37,
    items: [],
    equipment: { weapon: null, armor: null, accessory: null },
    quests: [],
    questsCompleted: 0,
    skills: [],
    persona: 'explorer',
    attributes: {},
    unlockProgress: { kills: 0, damageSpells: 0, moves: 0 },
    language: 'en',
    journal: {},
    dailyActionLog: [],
    questHints: {},
    trackedEnemy: undefined,
  } as PlayerStatus;

  const out = generateOfflineNarrative(chunk, 'medium' as any, {}, { x: 0, y: 0 }, t as any, language, previewPlayerState);
  expect(out).not.toMatch(/{{\s*[^}]+\s*}}/);
});
