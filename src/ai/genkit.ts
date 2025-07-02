import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {openAI} from 'genkitx-openai';
import {deepseek} from 'genkitx-deepseek';

// Helper function to find all API keys for a given service from environment variables.
const getApiKeys = (prefix: string): string[] => {
  return Object.keys(process.env)
    .filter(key => key.startsWith(prefix) && process.env[key])
    .map(key => process.env[key]!)
    .sort(); // Sort to ensure consistent order
};

// Find all provided API keys.
const geminiApiKeys = getApiKeys('GEMINI_API_KEY');
const openAIApiKeys = getApiKeys('OPENAI_API_KEY');

const plugins = [];

// Initialize Google AI if keys are found.
if (geminiApiKeys.length > 0) {
  plugins.push(googleAI({apiKey: geminiApiKeys}));
  console.log(`Initialized Google AI with ${geminiApiKeys.length} key(s).`);
}

// Initialize OpenAI if keys are found.
if (openAIApiKeys.length > 0) {
  plugins.push(openAI({apiKey: openAIApiKeys}));
  console.log(`Initialized OpenAI with ${openAIApiKeys.length} key(s).`);
}

// Initialize other providers. They will automatically look for their respective environment variables.
// DEEPSEEK_API_KEY
plugins.push(deepseek());

export const ai = genkit({
  plugins,
  // Set Gemini as the default model. Flows can override this.
  model: 'googleai/gemini-2.0-flash',
  // Enable logging for easier debugging.
  logLevel: 'debug',
});
