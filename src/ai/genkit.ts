import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {openAI} from 'genkitx-openai';
import {deepseek} from 'genkitx-deepseek';

/**
 * This file configures the Genkit AI object.
 *
 * It initializes all available model providers (Google AI, OpenAI, DeepSeek)
 * by explicitly reading their API keys from the environment variables.
 * This approach is more robust and helps prevent issues where keys might
 * not be automatically detected.
 *
 * Make sure to set these in your .env file at the project root:
 * - GEMINI_API_KEY
 * - OPENAI_API_KEY
 * - DEEPSEEK_API_KEY
 */

// This explicit check helps in debugging by confirming if the keys are loaded.
// The logs will appear in the terminal where you run your Next.js app.
if (process.env.GEMINI_API_KEY) {
  console.log('Found and loaded GEMINI_API_KEY.');
}
if (process.env.OPENAI_API_KEY) {
  console.log('Found and loaded OPENAI_API_KEY.');
}
if (process.env.DEEPSEEK_API_KEY) {
    console.log('Found and loaded DEEPSEEK_API_KEY.');
}

export const ai = genkit({
  plugins: [
    // Explicitly pass API keys from environment variables.
    // This prevents issues where the library might not find the key.
    googleAI({ apiKey: process.env.GEMINI_API_KEY }),
    openAI({ apiKey: process.env.OPENAI_API_KEY }),
    deepseek({ apiKey: process.env.DEEPSEEK_API_KEY }),
  ],
  // Set Gemini as the default model. Flows can override this.
  model: 'googleai/gemini-2.0-flash',
  // Enable logging for easier debugging. This provides detailed I/O with the models.
  logLevel: 'debug',
});
