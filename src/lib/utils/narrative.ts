/**
 * Narrative & Text Processing Utilities
 *
 * @remarks
 * Contains helper functions for combining and formatting narrative text,
 * including intelligent sentence joining with appropriate connectors.
 */

import type { NarrativeLength } from '@/lib/game/types';

/**
 * Join sentences into a coherent narrative with intelligent connectors
 *
 * @remarks
 * Uses appropriate connectors based on desired narrative length.
 * Handles punctuation cleanup and maintains grammatical coherence.
 * Currently Vietnamese-focused but easily extensible to other languages.
 *
 * Narrative length affects connector choice:
 * - **short**: Minimal connectors, simple joining
 * - **medium**: Mix of connectors for variety
 * - **long/detailed**: Rich transitional phrases
 *
 * @param sentences - Array of sentences to join
 * @param narrativeLength - Desired narrative style
 * @returns Single coherent narrative string
 *
 * @example
 * SmartJoinSentences(
 *   ["It's getting dark.", "You should find shelter."],
 *   "medium"
 * )
 * // → "It's getting dark. Suddenly, you should find shelter."
 */
export const SmartJoinSentences = (
    sentences: string[],
    narrativeLength: NarrativeLength
): string => {
    if (!sentences || sentences.length === 0) return '';
    if (sentences.length === 1) return sentences[0];

    let result = sentences[0].trim();

    for (let i = 1; i < sentences.length; i++) {
        const currentSentence = sentences[i].trim();
        if (!currentSentence) continue;

        // Remove trailing punctuation for smooth joining
        const lastCharOfPrev = result[result.length - 1];
        if (lastCharOfPrev === '.' || lastCharOfPrev === ',' || lastCharOfPrev === '!' || lastCharOfPrev === '?') {
            result = result.slice(0, -1);
        }

        let connector = '';
        switch (narrativeLength) {
            case 'short':
                // Minimal connectors for short narratives
                connector = ' và ';
                break;

            case 'medium':
                // Mixed connectors for variety
                const mediumConnectors = [' và ', '. Bỗng nhiên, ', '. Ngoài ra, ', '.'];
                connector = mediumConnectors[Math.floor(Math.random() * mediumConnectors.length)];
                break;

            case 'long':
            case 'detailed':
                // Rich transitional phrases for detailed narratives
                const longConnectors = [
                    ', thêm vào đó ', '. Hơn thế nữa, ', '. Không chỉ vậy, ', '. Đáng chú ý là, ',
                    '. Trong khi đó, ', '. Tuy nhiên, '
                ];
                connector = longConnectors[Math.floor(Math.random() * longConnectors.length)];
                break;

            default:
                connector = '. ';
                break;
        }

        // Ensure space after punctuation if needed
        if (result.length > 0 && ['.', '!', '?'].includes(result[result.length - 1]) && !connector.startsWith(' ')) {
            result += ' ';
        }

        // Handle punctuation at start of current sentence
        if (currentSentence.startsWith('.') || currentSentence.startsWith(',') || currentSentence.startsWith('!') || currentSentence.startsWith('?')) {
            result += ' ';
        } else {
            result += connector;
        }

        result += currentSentence;
    }

    // Final cleanup: remove extra whitespace and fix punctuation
    result = result.replace(/\s{2,}/g, ' ').trim(); // Remove extra spaces
    result = result.replace(/\s+([.,!?;:])/g, '$1'); // Remove space before punctuation
    result = result.replace(/([.,!?;:]){2,}/g, '$1'); // Remove duplicate punctuation
    result = result.replace(/([.,])([A-Z])/g, '$1 $2'); // Space after punctuation before capitals

    // Ensure sentence ends with punctuation
    if (result.length > 0 && !result.endsWith('.') && !result.endsWith('!') && !result.endsWith('?')) {
        result += '.';
    }

    return result;
};
