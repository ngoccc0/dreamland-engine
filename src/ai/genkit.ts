
import 'dotenv/config';
import { genkit, type Genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { openAI } from 'genkitx-openai';
import { deepseekPlugin } from './plugins/deepseek';

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

const plugins = [];

try {
    // Initialize Google AI Plugin
    if (process.env.GEMINI_API_KEY_PRIMARY || process.env.GEMINI_API_KEY_SECONDARY) {
        const plugin = googleAI({
            apiKey: process.env.GEMINI_API_KEY_PRIMARY || process.env.GEMINI_API_KEY_SECONDARY
        });
        plugins.push(plugin);
        console.log('Google AI Plugin initialized');
    }

    // Initialize OpenAI Plugin
    if (process.env.OPENAI_API_KEY) {
        const plugin = openAI();
        plugins.push(plugin);
        console.log('OpenAI Plugin initialized');
    }

    // Initialize Deepseek Plugin
    if (process.env.DEEPSEEK_API_KEY) {
        const plugin = deepseekPlugin();
        plugins.push(plugin);
        console.log('Deepseek Plugin initialized');
    }
} catch (error) {
    console.error('Error initializing plugins:', error);
}

// Initialize Genkit with plugins and error handling
let ai: Genkit;
try {
    ai = genkit({
        plugins,
        model: 'googleai/gemini-2.0-flash'
    });
} catch (error: any) {
    console.error('Error initializing Genkit:', error);
    // Provide a fallback or throw a more informative error
    throw new Error(`Failed to initialize AI system: ${error.message || 'Unknown error'}`);
}

export { ai, type Genkit };
