import path from 'path';
import { Lexicon } from '../lexicon';
import { fillTemplate } from '../assembler';
import createRng from '../rng';

test('voice-aware continuation picks sarcastic variant when persona.voice=sarcastic', () => {
  const lex = new Lexicon();
  const lexPath = path.resolve(__dirname, '../data/lexicon.en.json');
  lex.loadFromFile(lexPath);
  const rng = createRng('voice-seed');

  const tpl = "{{jungle_terrain_desc}}";
  const state = { repeatCount: 2 };
  const persona = { voice: 'sarcastic' };
  const out = fillTemplate(tpl, lex as any, {}, { rng, state, persona });

  // should be prefixed by the sarcastic continuation phrase variant
  expect(out).toMatch(/^You trudge on, as if it's all a joke,/);
});

test('internal_monologue respects persona.voice', () => {
  const lex = new Lexicon();
  const lexPath = path.resolve(__dirname, '../data/lexicon.en.json');
  lex.loadFromFile(lexPath);
  const rng = createRng('voice-seed-2');

  const tpl = "{{internal_monologue}}";
  const persona = { voice: 'thoughtful' };
  const out = fillTemplate(tpl, lex as any, {}, { rng, persona });

  expect(out).toMatch(/You wonder if this is the right path\.|You press onward, lost in thought,/);
});
