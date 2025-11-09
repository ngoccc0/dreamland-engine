import { createRng, hashStringTo32 } from '../rng';

test('hashStringTo32 is stable', () => {
  const h1 = hashStringTo32('test-seed');
  const h2 = hashStringTo32('test-seed');
  expect(h1).toBe(h2);
});

test('createRng produces deterministic sequence for same seed', () => {
  const rngA = createRng('seed-123');
  const seqA = [rngA.float(), rngA.float(), rngA.int(1, 10)];

  const rngB = createRng('seed-123');
  const seqB = [rngB.float(), rngB.float(), rngB.int(1, 10)];

  expect(seqA).toEqual(seqB);
});

test('weightedChoice prefers higher weight', () => {
  const rng = createRng('wtest');
  const items = ['a', 'b', 'c'];
  const weights = [0.1, 0.1, 10];
  // deterministic; should pick 'c'
  const pick = rng.weightedChoice(items, weights);
  expect(pick).toBe('c');
});
