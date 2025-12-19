import { NextResponse } from 'next/server';
import path from 'path';
import { readFileSync } from 'fs';

import { generateNarrative, loadPersonasSample } from '@/lib/narrative/orchestrator';

const templatesPath = path.resolve(process.cwd(), 'src/lib/narrative/data/templates.sample.json');

export async function GET(req: Request) {
  const url = new URL(req.url);
  const seed = url.searchParams.get('seed') || 'preview';
  const lang = (url.searchParams.get('lang') || 'en') as 'en' | 'vi';
  const personaId = url.searchParams.get('persona') || undefined;

  const templates = JSON.parse(readFileSync(templatesPath, 'utf8'));

  const personas = loadPersonasSample();
  const persona = personaId ? personas.find(p => p.id === personaId) : undefined;

  // sample snapshot - in real use, pass snapshot via POST
  const snapshot = { chunk: { terrain: 'Jungle', lightLevel: 8, moisture: 50 }, moods: ['lush'] };

  const out = generateNarrative(snapshot, templates, { seed, lang, desiredDetail: 2, persona });
  return NextResponse.json(out);
}
