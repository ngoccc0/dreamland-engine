import { selectPrimaryTemplate } from '../selector';
import createRng from '../rng';

const templates = [
  { id: 't1', tags: ['gloomy'], lengthHint: 4, weight: 1, conditions: { all: [{ path: 'chunk.lightLevel', op: '<=', value: 10 }] }, patterns: [{ template: 't1' }] },
  { id: 't2', tags: ['lush'], lengthHint: 2, weight: 1, conditions: { all: [{ path: 'chunk.lightLevel', op: '>=', value: 5 }] }, patterns: [{ template: 't2' }] }
];

test('select primary template respects conditions and seed', () => {
  const rng = createRng('sel-seed');
  const context = { chunk: { lightLevel: 8 }, moods: ['lush'] };
  const state = { motifsSeen: {} };
  const chosen = selectPrimaryTemplate(templates as any, context, state, 2, rng);
  expect(chosen).not.toBeNull();
  expect(chosen!.id).toBe('t2');
});

test('selector prefers templates with continuation_fragment when repeating', () => {
  const rng = createRng('sel-repeat');
  const context = { chunk: { lightLevel: 8 }, moods: ['lush'] };
  // template a has a continuation slot; b does not
  const templates2 = [
    { id: 'a', patterns: [{ template: '{{continuation_fragment}} A path', slots: ['continuation_fragment'] }], weight: 1, lengthHint: 2 },
    { id: 'b', patterns: [{ template: 'A fresh path' }], weight: 1, lengthHint: 2 }
  ];
  const state = { motifsSeen: {}, repeatCount: 3 };
  const chosen = selectPrimaryTemplate(templates2 as any, context, state, 2, rng);
  expect(chosen).not.toBeNull();
  expect(chosen!.id).toBe('a');
});
