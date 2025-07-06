
import {genkit, Plugin} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {openAI} from 'genkitx-openai';
import {deepseek} from './plugins/deepseek';

/**
 * This file configures the Genkit AI object.
 *
 * It conditionally initializes model providers (Google AI, OpenAI, DeepSeek)
 * only if their respective API keys are found in the environment variables.
 * This makes the system more robust and prevents crashes if a key is missing.
 *
 * Make sure to set these in your .env file at the project root:
 * - GEMINI_API_KEY_PRIMARY (and/or GEMINI_API_KEY_SECONDARY)
 * - OPENAI_API_KEY
 * - DEEPSEEK_API_KEY
 */

const plugins: Plugin[] = [];

// This explicit check helps in debugging by confirming if the keys are loaded.
// The logs will appear in the terminal where you run your Next.js app.

// Collect all provided Gemini API keys from environment variables.
const geminiApiKeys = [
  process.env.GEMINI_API_KEY_PRIMARY,
  process.env.GEMINI_API_KEY_SECONDARY,
].filter((key): key is string => !!key); // Filters out any undefined/empty keys

if (geminiApiKeys.length > 0) {
  console.log(`Found ${geminiApiKeys.length} Gemini API key(s). Initializing Google AI plugin.`);
  // Pass all found keys to the plugin. Genkit will manage them.
  plugins.push(googleAI({apiKey: geminiApiKeys}));
} else {
  console.warn(
    'GEMINI_API_KEY_PRIMARY or GEMINI_API_KEY_SECONDARY not found. Google AI plugin will not be available.'
  );
}

if (process.env.OPENAI_API_KEY) {
  console.log('Found OPENAI_API_KEY. Initializing OpenAI plugin.');
  // The plugin automatically reads the key from the environment.
  plugins.push(openAI());
} else {
  console.warn(
    'OPENAI_API_KEY not found. OpenAI plugin will not be available.'
  );
}

if (process.env.DEEPSEEK_API_KEY) {
  console.log('Found DEEPSEEK_API_KEY. Initializing Deepseek plugin.');
  // The custom plugin also reads the key from the environment.
  plugins.push(deepseek());
} else {
  console.warn(
    'DEEPSEEK_API_KEY not found. Deepseek plugin will not be available.'
  );
}

export const ai = genkit({
  plugins,
  // Set a default model to be used by flows that don't specify one.
  // This resolves the error where `generate()` is called without a model.
  model: 'googleai/gemini-2.0-flash',
});
