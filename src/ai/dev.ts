import { config } from 'dotenv';
config();

import '@/ai/schemas';
import '@/ai/tools/game-actions';
import '@/ai/flows/generate-world-setup.ts';
import '@/ai/flows/suggest-keywords.ts';
import '@/ai/flows/generate-narrative-flow.ts';
