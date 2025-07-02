import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {openAI} from 'genkitx-openai';
import {config} from 'dotenv';

// Explicitly load variables from the .env file.
// This is a robust way to ensure they are available when this module is imported.
config({ path: '.env' });

// Flexible API key handling.
// It will try to use multiple specific keys first, then fall back to a single default key.
let geminiApiKeys = [
  process.env.GEMINI_API_KEY_PRIMARY,
  process.env.GEMINI_API_KEY_SECONDARY,
].filter((key): key is string => !!key); // Filters out any undefined/empty keys

// If no specific keys are found, try the standard single key.
if (geminiApiKeys.length === 0 && process.env.GEMINI_API_KEY) {
  geminiApiKeys = [process.env.GEMINI_API_KEY];
}


export const ai = genkit({
  plugins: [
    // Initialize Google AI with any found keys.
    // Genkit will manage them for you (e.g., for rate limiting or failover).
    googleAI({
      apiKey: geminiApiKeys.length > 0 ? geminiApiKeys : undefined,
    }),
    // Initialize OpenAI (it will look for OPENAI_API_KEY automatically).
    openAI(),
  ],
  // Keep Gemini as the default model unless specified otherwise in a flow.
  model: 'googleai/gemini-2.0-flash',
});
