import { ai } from './genkit';

/**
 * Compatibility wrapper for older ai.generate({ model, prompt, input, output }) callsites.
 * The project's AI flows historically passed an object with `model`, `prompt`, `input`, and
 * `output.schema`. The current genkit typing prefers a prompt string or typed options.
 *
 * This small adapter keeps callsites working by delegating to `ai.generate` with the
 * prompt string when available and returning the raw response. It is intentionally
 * permissive (uses any) to ease incremental migration.
 */
export async function generateCompat(opts: any): Promise<any> {
  if (!opts) return ai.generate('');
  if (typeof opts === 'string') return ai.generate(opts);
  // If a prompt is provided, call the newer ai.generate with the prompt string.
  if (typeof opts.prompt === 'string') {
    return ai.generate(opts.prompt as string);
  }
  // Fallback: stringify the input to a prompt
  try {
    const fallbackPrompt = JSON.stringify(opts.input ?? opts, null, 2);
    return ai.generate(String(fallbackPrompt));
  } catch (err) {
    return ai.generate(String(opts));
  }
}

export default { generate: generateCompat };
