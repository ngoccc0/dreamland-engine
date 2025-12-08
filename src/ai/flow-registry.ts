/**
 * Lazy Flow Registry
 *
 * This module provides helpers to defer Genkit flow registration until request-time
 * (not build-time). This prevents "noConflict is not a function" errors during
 * Next.js build when the googleAI plugin is evaluated in a Node.js server context.
 *
 * @remarks
 * Instead of calling ai.defineFlow() at module-eval time, wrap the definition
 * in a lazy initialization function and cache the result.
 */

import type { Genkit, Flow } from 'genkit';
import type { ZodTypeAny } from 'zod';
import { getAi } from './genkit';

/**
 * Creates a lazy-initialized flow wrapper.
 * The flow is not registered until the first call.
 */
export function createLazyFlow<I extends ZodTypeAny, O extends ZodTypeAny>(
    flowDefinition: (ai: Genkit) => Flow<I, O>
): (input: I) => Promise<O> {
    let cachedFlow: Flow<I, O> | null = null;

    return async (input: I): Promise<O> => {
        if (!cachedFlow) {
            const ai = await getAi();
            cachedFlow = flowDefinition(ai);
        }
        return cachedFlow(input);
    };
}
