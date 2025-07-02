import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {openAI} from 'genkitx-openai';

// NOTE: .env file is automatically loaded by Next.js.
// No need for explicit dotenv configuration.

// Collect all provided Gemini API keys from environment variables.
const geminiApiKeys = [
  process.env.GEMINI_API_KEY_PRIMARY,
  process.env.GEMINI_API_KEY_SECONDARY,
].filter((key): key is string => !!key); // Filters out any undefined/empty keys

export const ai = genkit({
  plugins: [
    // Initialize Google AI with all provided keys.
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
