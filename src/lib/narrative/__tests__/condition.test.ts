import { compileCondition } from '../condition';

test('simple comparison true', () => {
  const c = { path: 'chunk.lightLevel', op: '<=', value: 10 };
  const fn = compileCondition(c as any);
  const res = fn({ chunk: { lightLevel: 5 } }, {});
  expect(res.matches).toBe(true);
});

test('requiredEntities false', () => {
  const c = { requiredEntities: { enemyType: 'wolf' } };
  const fn = compileCondition(c as any);
  const res = fn({ chunk: { enemy: { type: 'bear' } } }, {});
  expect(res.matches).toBe(false);
});
