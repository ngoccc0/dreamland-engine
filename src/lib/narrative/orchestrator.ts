import createRng from './rng';
import Lexicon from './lexicon';
import { selectPrimaryTemplate } from './selector';
import { fillTemplate } from './assembler';
import StateManager from './state-manager';
import path from 'path';
import fs from 'fs';

export type Persona = { id: string; name: string; voice?: string };

export type GenerateOptions = {
  seed?: string | number;
  lang?: 'en' | 'vi';
  desiredDetail?: number;
  persona?: Persona;
  tone?: string;
};

export function generateNarrative(snapshot: any, templates: any[], options: GenerateOptions = {}) {
  const seed = options.seed ?? 'gen-preview';
  const rng = createRng(seed);

  const lang = options.lang ?? 'en';
  const lexPath = path.resolve(process.cwd(), `src/lib/narrative/data/lexicon.${lang}.json`);
  const lex = new Lexicon();
  if (fs.existsSync(lexPath)) lex.loadFromFile(lexPath);

  const stateManager = new StateManager();
  // naive initial state; in real use we'd pass persisted state
  const state = stateManager.getState();

  const desiredDetail = typeof options.desiredDetail === 'number' ? options.desiredDetail : 2;

  const primary = selectPrimaryTemplate(templates, snapshot, state, desiredDetail, rng);
  if (!primary) return { text: 'No template matched', meta: { templateId: null, seed } };

  const pattern = primary.patterns && primary.patterns[0] ? primary.patterns[0].template : primary.id;

  const text = fillTemplate(pattern, lex as any, snapshot, {
    lang,
    detail: desiredDetail,
    biome: snapshot?.chunk?.terrain,
    rng,
    state,
    persona: options.persona,
    tone: options.tone,
  });

  // update state based on decision
  stateManager.updateWithSnapshot(snapshot, { templateIds: [primary.id], detailLevel: desiredDetail }, rng as any);

  return { text, meta: { templateId: primary.id, seed, persona: options.persona } };
}

export function loadPersonasSample() : Persona[] {
  const p = path.resolve(process.cwd(), 'src/lib/narrative/data/personas.sample.json');
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8')) as Persona[];
}

export default generateNarrative;
