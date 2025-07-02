import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {openAI} from 'genkitx-openai';

// NOTE: .env file is automatically loaded by Next.js.
// No need for explicit dotenv configuration.

export const ai = genkit({
  plugins: [
    googleAI(),
    openAI(),
  ],
  model: 'googleai/gemini-2.0-flash',
});
