import { getTranslatedText, ensurePlayerItemId } from '@/lib/utils';
import { getKeywordVariations } from '@/lib/game/data/narrative-templates';
import type { PlayerStatus, PlayerItem, ItemDefinition } from '@/core/types/game';

export type ActionHelpersDeps = {
  pickupBufferRef: React.MutableRefObject<{ items: Array<any>; timer?: ReturnType<typeof setTimeout> }>;
  lastPickupMonologueAt: React.MutableRefObject<number>;
  resolveItemDef: (name: string) => ItemDefinition | undefined;
  t: (k: any, p?: any) => string;
  language: string;
  addNarrativeEntry: (text: string, type: 'narrative'|'action'|'system'|'monologue', id?: string) => void;
  audio?: any;
  toast?: any;
  customItemDefinitions?: Record<string, any>;
};

// Factory that returns small helper functions bound to the provided deps.
export function createActionHelpers(deps: ActionHelpersDeps) {
  const { pickupBufferRef, lastPickupMonologueAt, resolveItemDef, t, language, addNarrativeEntry, audio, toast, customItemDefinitions } = deps;

  const flushPickupBuffer = () => {
    const buf = pickupBufferRef.current;
    if (!buf || !buf.items || buf.items.length === 0) return;
    const items = buf.items.splice(0, buf.items.length);
    if (buf.timer) { clearTimeout(buf.timer); buf.timer = undefined; }

    try {
      if (items.length === 1 && items[0].quantity <= 1) {
        const it = items[0];
        const resolvedDef = resolveItemDef(getTranslatedText(it.name, 'en'));
        const buildSensoryText = (def: ItemDefinition | undefined) => {
          if (!def || !def.senseEffect || !Array.isArray(def.senseEffect.keywords) || def.senseEffect.keywords.length === 0) return '';
          const raw = def.senseEffect.keywords[Math.floor(Math.random() * def.senseEffect.keywords.length)];
          const [, ...rest] = raw.split(':');
          return rest.join(':') || raw;
        };
        const itemNameText = t(it.name as any);
        const sensory = buildSensoryText(resolvedDef);
        const narrativeText = t('pickedUpItem_single_1' as any, { itemName: itemNameText, sensory });
        addNarrativeEntry(narrativeText, 'narrative');
        try { audio?.playSfx('Pickup_Gold_00'); } catch {}
        return;
      }

      const grouped: Record<string, number> = {};
  items.forEach((it: any) => { const key = getTranslatedText(it.name, language as any); grouped[key] = (grouped[key] || 0) + (it.quantity || 1); });
      const summaryList = Object.keys(grouped).map(k => `${grouped[k]} ${k}`).slice(0, 6).join(', ');
      const summaryText = language === 'vi' ? `Bạn gom được ${summaryList}.` : `You picked up ${summaryList}.`;
      addNarrativeEntry(summaryText, 'narrative');
      try { audio?.playSfx('Pickup_Gold_00'); } catch {}

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
      // ignore
    }
  };

  const tryAddItemToInventory = (player: PlayerStatus, item: PlayerItem): boolean => {
    try {
      player.items = player.items || [];
      const existing = player.items.find(i => getTranslatedText(i.name, 'en') === getTranslatedText(item.name, 'en'));
      if (existing) {
        existing.quantity += item.quantity || 1;
        return true;
      }
      if ((player.items || []).length >= 40) {
        try { toast?.({ title: t('inventoryFull') || 'Inventory Full', description: t('inventoryFullDesc') || 'You have no free slots.', variant: 'destructive' }); } catch {}
        return false;
      }
  player.items.push(ensurePlayerItemId({ ...item }, customItemDefinitions || {}, t, language as any));
      return true;
    } catch (e) {
      // Silently handle inventory add errors
      return false;
    }
  };

  return { flushPickupBuffer, tryAddItemToInventory };
}
