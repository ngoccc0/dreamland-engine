import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import openai from 'genkitx-openai';

// NOTE: .env file is automatically loaded by Next.js.
// No need for explicit dotenv configuration.

export const ai = genkit({
  plugins: [
    googleAI(),
    openai,
  ],
  model: 'googleai/gemini-2.0-flash',
});
