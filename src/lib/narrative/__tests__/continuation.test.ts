import path from 'path';
import { Lexicon } from '../lexicon';
import { fillTemplate } from '../assembler';
import createRng from '../rng';

test('continuation phrase is prepended when repeatCount >= 2', () => {
  const lex = new Lexicon();
  const lexPath = path.resolve(__dirname, '../data/lexicon.en.json');
  lex.loadFromFile(lexPath);
  const rng = createRng('cont-seed');

  const tpl = "{{jungle_terrain_desc}}";
  const state = { repeatCount: 2 };
  const out = fillTemplate(tpl, lex as any, {}, { rng, state });

  // should contain the terrain description
  expect(out).toMatch(/tangled undergrowth/);
  // should be prefixed by one of the continuation phrases
  expect(out).toMatch(/^(You keep going,|You continue on,)/);
});
