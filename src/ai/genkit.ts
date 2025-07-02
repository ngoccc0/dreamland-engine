import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {openAI} from 'genkitx-openai';

// NOTE: .env file is automatically loaded by Next.js.

// Find all GEMINI_API_KEYs provided in environment variables.
// This allows for using multiple keys for rate-limiting or failover.
const geminiApiKeys = Object.keys(process.env)
  .filter(key => key.startsWith('GEMINI_API_KEY'))
  .map(key => process.env[key])
  .filter((key): key is string => !!key);

export const ai = genkit({
  plugins: [
    // Initialize Google AI. If keys are found, use them. Otherwise, let the plugin handle it.
    googleAI({
      apiKey: geminiApiKeys.length > 0 ? geminiApiKeys : undefined,
    }),
    
    // Initialize OpenAI. It automatically looks for OPENAI_API_KEY.
    openAI(),
  ],
  // Set Gemini as the default model. Specific flows can override this.
  model: 'googleai/gemini-2.0-flash',
});
