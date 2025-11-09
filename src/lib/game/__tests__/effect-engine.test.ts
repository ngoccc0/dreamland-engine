import { applyTickEffects } from '@/lib/game/effect-engine';
import type { PlayerStatusDefinition } from '@/lib/game/types';

// Minimal i18n stub used by tests
const t = (k: string, p?: any) => {
  if (k === 'poisonDamage') return `You suffer ${p.amount} poison damage.`;
  if (k === 'effectWornOff') return `Effect ${p.effect} has worn off.`;
  if (k === 'youAreStarving') return `You are starving.`;
  return k;
};

describe('applyTickEffects', () => {
  test('applies poison damage and decrements duration', () => {
  const stats = ({ hp: 10, stamina: 5, hunger: 50, statusEffects: [{ id: 'e1', type: 'poison', duration: 2, magnitude: 2, description: { en: 'poison' }, appliedTurn: 0 }] } as unknown) as PlayerStatusDefinition;
  const { newStats, messages } = applyTickEffects(stats, 100, t);
    expect(newStats.hp).toBe(8); // 10 - 2
    expect(newStats.statusEffects.length).toBe(1);
    expect(newStats.statusEffects[0].duration).toBe(1);
    expect(messages.some(m => m.text.includes('poison'))).toBeTruthy();
  });

  test('hunger decay and starvation damage', () => {
  const stats = ({ hp: 5, hunger: 0.4, statusEffects: [] } as unknown) as PlayerStatusDefinition;
  const { newStats, messages } = applyTickEffects(stats, 200, t);
    // hunger 0.4 - 0.5 => 0
    expect(newStats.hunger).toBe(0);
    // hp decreased by 1 due starvation
    expect(newStats.hp).toBe(4);
    expect(messages.some(m => m.text.includes('starving'))).toBeTruthy();
  });

  test('effect expiry message when duration hits zero', () => {
  const stats = ({ hp: 20, hunger: 50, statusEffects: [{ id: 'e2', type: 'weakness', duration: 1, magnitude: 1, description: { en: 'weak' }, appliedTurn: 0 }] } as unknown) as PlayerStatusDefinition;
  const { newStats, messages } = applyTickEffects(stats, 300, t);
    // effect should expire (duration goes 1 -> 0 and be removed)
    expect(newStats.statusEffects.length).toBe(0);
    expect(messages.some(m => m.text.includes('worn off'))).toBeTruthy();
  });
});
