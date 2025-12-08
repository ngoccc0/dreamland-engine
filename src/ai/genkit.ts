import 'dotenv/config';
import { genkit, type Genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

/**
 * This file configures the Genkit AI object with lazy initialization.
 *
 * It conditionally initializes model providers (Google AI, OpenAI, DeepSeek)
 * only if their respective API keys are found in the environment variables.
 * This makes the system more robust and prevents crashes if a key is missing.
 *
 * IMPORTANT: Genkit is initialized lazily (at first request time) to avoid
 * module-level initialization during Next.js build time, which would cause
 * "noConflict is not a function" errors during server-side collection.
 *
 * Make sure to set these in your .env file at the project root:
 * - GEMINI_API_KEY_PRIMARY (and/or GEMINI_API_KEY_SECONDARY)
 * - OPENAI_API_KEY
 * - DEEPSEEK_API_KEY
 */

let ai: Genkit | null = null;

/**
 * Get or initialize the Genkit AI instance.
 * Lazy loads on first call to avoid build-time module evaluation.
 */
export async function getAi(): Promise<Genkit> {
    if (ai !== null) {
        return ai;
    }

    // Only initialize Google Gemini (Gemini API). Other providers (OpenAI, Deepseek)
    // were intentionally removed so all LLM behavior is driven by Gemini and by
    // varying prompts (storytellers are implemented as prompt templates).

    const plugins = [];

    try {
        if (process.env.GEMINI_API_KEY_PRIMARY || process.env.GEMINI_API_KEY_SECONDARY) {
            const plugin = googleAI({
                apiKey: process.env.GEMINI_API_KEY_PRIMARY || process.env.GEMINI_API_KEY_SECONDARY,
            });
            plugins.push(plugin);
            console.log('Google Gemini Plugin initialized');
        } else {
            console.warn('No Gemini API key found (GEMINI_API_KEY_PRIMARY / GEMINI_API_KEY_SECONDARY). Genkit will be initialized without a Gemini plugin.');
        }
    } catch (error: any) {
        console.error('Error initializing Gemini plugin:', error);
    }

    try {
        const usablePlugins = plugins.filter(Boolean);
        ai = genkit({
            plugins: usablePlugins,
            model: 'googleai/gemini-2.0-flash',
        });
    } catch (error: any) {
        console.error('Error initializing Genkit:', error);
        throw new Error(`Failed to initialize AI system: ${error.message || 'Unknown error'}`);
    }

    return ai;
}

/**
 * For compatibility with dynamic imports in generate-world-setup.ts
 * Export the lazy-loaded ai instance (only available after initialization)
 */
export { ai };

