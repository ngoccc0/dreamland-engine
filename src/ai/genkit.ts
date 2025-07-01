import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// NOTE: .env file is automatically loaded by Next.js.
// No need for explicit dotenv configuration.

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: 'googleai/gemini-2.0-flash',
});
