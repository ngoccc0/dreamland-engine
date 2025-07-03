
import {genkit, type GenkitPlugin} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {openAI} from 'genkitx-openai';
import {deepseek} from 'genkitx-deepseek';

/**
 * This file configures the Genkit AI object.
 *
 * It conditionally initializes model providers (Google AI, OpenAI, DeepSeek)
 * only if their respective API keys are found in the environment variables.
 * This makes the system more robust and prevents crashes if a key is missing.
 *
 * Make sure to set these in your .env file at the project root:
 * - GEMINI_API_KEY
 * - OPENAI_API_KEY
 * - DEEPSEEK_API_KEY
 */

const plugins: GenkitPlugin[] = [];

// This explicit check helps in debugging by confirming if the keys are loaded.
// The logs will appear in the terminal where you run your Next.js app.

if (process.env.GEMINI_API_KEY) {
  console.log('Found GEMINI_API_KEY. Initializing Google AI plugin.');
  plugins.push(googleAI({apiKey: process.env.GEMINI_API_KEY}));
} else {
  console.warn(
    'GEMINI_API_KEY not found. Google AI plugin will not be available.'
  );
}

if (process.env.OPENAI_API_KEY) {
  console.log('Found OPENAI_API_KEY. Initializing OpenAI plugin.');
  plugins.push(openAI({apiKey: process.env.OPENAI_API_KEY}));
} else {
  console.warn(
    'OPENAI_API_KEY not found. OpenAI plugin will not be available.'
  );
}

if (process.env.DEEPSEEK_API_KEY) {
  console.log('Found DEEPSEEK_API_KEY. Initializing Deepseek plugin.');
  plugins.push(deepseek({apiKey: process.env.DEEPSEEK_API_KEY}));
} else {
  console.warn(
    'DEEPSEEK_API_KEY not found. Deepseek plugin will not be available.'
  );
}

export const ai = genkit({
  plugins,
  // Set Gemini as the default model. Flows can override this.
  model: 'googleai/gemini-2.0-flash',
  // Enable logging for easier debugging. This provides detailed I/O with the models.
  logLevel: 'debug',
});
