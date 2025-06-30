import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { openai } from 'genkitx-openai';
import { config } from 'dotenv';

// Explicitly load environment variables from the .env file in the project root.
// This ensures API keys are available for the Next.js server environment.
config({ path: '.env' });

export const ai = genkit({
  plugins: [
    googleAI(),
    openai(),
  ],
  model: 'googleai/gemini-2.0-flash',
});
