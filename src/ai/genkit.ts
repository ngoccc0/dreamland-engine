import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {openai} from 'genkitx-openai';

export const ai = genkit({
  plugins: [
    googleAI({apiKey: process.env.GOOGLE_API_KEY}),
    openai({apiKey: process.env.OPENAI_API_KEY}),
  ],
  model: 'googleai/gemini-2.0-flash',
});
