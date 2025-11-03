import StateManager from '../state-manager';
import createRng from '../rng';

test('StateManager initial state and reset', () => {
  const s = new StateManager();
  const st = s.getState();
  expect(st.repeatCount).toBe(0);
  s.reset();
  const st2 = s.getState();
  expect(st2.repeatCount).toBe(0);
});

test('updateWithSnapshot updates biome and repeats', () => {
  const s = new StateManager();
  const snapshot1 = { chunk: { terrain: 'Jungle' }, action: { id: 'move' } };
  s.updateWithSnapshot(snapshot1, { templateIds: ['t1'] });
  const st1 = s.getState();
  expect(st1.lastBiome).toBe('Jungle');
  expect(st1.motifsSeen['t1']).toBe(1);

  // same biome again increments repeatCount
  s.updateWithSnapshot({ chunk: { terrain: 'Jungle' }, action: { id: 'move' } }, {});
  const st2 = s.getState();
  expect(st2.repeatCount).toBeGreaterThanOrEqual(1);
});

test('updateWithSnapshot rotates connector when rng provided', () => {
  const s = new StateManager();
  const rng = createRng('conn-seed');
  s.updateWithSnapshot({ chunk: { terrain: 'forest' } }, {}, rng);
  const st = s.getState();
  expect(typeof st.lastConnector).toBe('string');
});
