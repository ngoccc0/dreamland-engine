import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {openAI} from 'genkitx-openai';
import {deepseek} from 'genkitx-deepseek';

/**
 * This file configures the Genkit AI object.
 * 
 * It initializes all available model providers (Google AI, OpenAI, DeepSeek).
 * The Genkit plugins will automatically look for the necessary API keys in
 * the environment variables (e.g., GEMINI_API_KEY, OPENAI_API_KEY, DEEPSEEK_API_KEY).
 * 
 * Make sure to set these in your .env or environment configuration.
 */

export const ai = genkit({
  plugins: [
    // The plugins will automatically find their API keys from environment
    // variables like GEMINI_API_KEY, OPENAI_API_KEY, etc.
    googleAI(),
    openAI(),
    deepseek(),
  ],
  // Set Gemini as the default model. Flows can override this.
  model: 'googleai/gemini-2.0-flash',
  // Enable logging for easier debugging. This provides detailed I/O with the models.
  logLevel: 'debug',
});
