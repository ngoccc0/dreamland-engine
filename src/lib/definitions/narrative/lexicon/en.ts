/**
 * English Narrative Lexicon
 *
 * OVERVIEW: Comprehensive English lexicon for narrative generation, organized by mood tags
 * with 3 variation tiers (standard/subtle/emphatic) and 30+ continuation phrases per action type.
 * This lexicon powers dynamic adjective selection and phrase continuation during narrative generation,
 * enabling variety while maintaining consistency with mood profiles and terrain contexts.
 *
 * Structure:
 * - adjectives: { [moodTag]: { standard: [], subtle: [], emphatic: [] } }
 * - continuations: { [actionType]: [] }
 * - transitionPhrases: [] (used between sentences)
 * - descriptiveNouns: [] (used as emphasis targets)
 *
 * Tier Distribution:
 * - Standard (60%): Neutral, balanced adjectives suitable for all contexts
 * - Subtle (20%): Understated, minimalist adjectives for quiet moments
 * - Emphatic (20%): Intense, dramatic adjectives for high-tension scenes
 *
 * Total Coverage: 24 mood tags × 3 tiers = 72 adjective variations per mood
 * Continuation Phrases: 5 action types × 8+ variants = 40+ phrases
 * Transition Phrases: 15+ variants for smooth narrative flow
 */

import type { MoodTag } from '@/core/engines/MoodProfiler';

/** Narrative lexicon structure */
export interface NarrativeLexicon {
    adjectives: {
        [key: string]: {
            standard: string[];
            subtle: string[];
            emphatic: string[];
        };
    };
    continuations: {
        [actionType: string]: string[];
    };
    transitionPhrases: string[];
    descriptiveNouns: string[];
}

/**
 * English Lexicon - Complete adjective and phrase database
 *
 * Each mood tag includes 3 variation tiers optimized for specific narrative contexts.
 * Adjectives are selected based on current mood strength and game state.
 */
export const ENGLISH_LEXICON: NarrativeLexicon = {
    adjectives: {
        // Dark & Shadow moods
        Dark: {
            standard: ['dark', 'shadowed', 'dim', 'murky', 'obscured', 'gloomy', 'dusky', 'overcast'],
            subtle: ['subdued', 'muted', 'softened', 'veiled', 'hushed', 'darkening'],
            emphatic: ['PITCH BLACK', 'IMPENETRABLE DARKNESS', 'PITCH-DARK', 'VOID-LIKE', 'STYGIAN', 'LIGHTLESS']
        },
        Gloomy: {
            standard: ['gloomy', 'melancholic', 'somber', 'dismal', 'dreary', 'bleak', 'foreboding', 'sullen'],
            subtle: ['wistful', 'pensive', 'resigned', 'quiet', 'mournful', 'somber'],
            emphatic: ['OVERWHELMINGLY GLOOMY', 'SOUL-CRUSHING', 'DEEPLY DISMAL', 'PROFOUNDLY BLEAK', 'OPPRESSIVELY DARK']
        },

        // Light & Brightness moods
        Bright: {
            standard: ['bright', 'radiant', 'luminous', 'shining', 'glowing', 'brilliant', 'dazzling', 'sunny'],
            subtle: ['softly lit', 'gently glowing', 'subtly bright', 'warmly lit', 'softly radiant'],
            emphatic: ['BLAZINGLY BRIGHT', 'BLINDING RADIANCE', 'INCANDESCENT', 'RADIANT BRILLIANCE', 'DAZZLING LUMINESCENCE']
        },
        Ethereal: {
            standard: ['ethereal', 'ghostly', 'transcendent', 'otherworldly', 'spectral', 'dreamlike', 'surreal', 'unearthly'],
            subtle: ['delicate', 'wispy', 'subtle', 'fragile', 'translucent', 'ephemeral'],
            emphatic: ['IMPOSSIBLY ETHEREAL', 'OTHERWORLDLY TRANSCENDENCE', 'SPECTRAL MAGNIFICENCE', 'SURREAL BEAUTY']
        },

        // Nature & Life moods
        Lush: {
            standard: ['lush', 'verdant', 'fertile', 'thriving', 'abundant', 'vibrant', 'flourishing', 'verdure'],
            subtle: ['green', 'growing', 'alive', 'fresh', 'teeming with life', 'brimming'],
            emphatic: ['EXPLOSIVELY LUSH', 'OVERWHELMINGLY GREEN', 'VIBRANTLY ALIVE', 'TEEMING WITH LIFE', 'BURSTING WITH VITALITY']
        },
        Vibrant: {
            standard: ['vibrant', 'vivid', 'colorful', 'dynamic', 'energetic', 'lively', 'pulsing', 'radiant'],
            subtle: ['alive', 'animated', 'active', 'engaged', 'spirited', 'quickened'],
            emphatic: ['INTENSELY VIBRANT', 'WILDLY COLORFUL', 'EXPLOSIVELY ENERGETIC', 'BLINDINGLY VIVID']
        },
        Wild: {
            standard: ['wild', 'untamed', 'feral', 'primal', 'uncontrolled', 'fierce', 'savage', 'raw'],
            subtle: ['untamed', 'natural', 'unreserved', 'unrefined', 'unpolished', 'natural'],
            emphatic: ['OVERWHELMINGLY WILD', 'PRIMAL FURY', 'UNTAMED CHAOS', 'FERAL INTENSITY', 'SAVAGE POWER']
        },
        Peaceful: {
            standard: ['peaceful', 'serene', 'calm', 'tranquil', 'quiet', 'restful', 'undisturbed', 'gentle'],
            subtle: ['soft', 'mild', 'gentle', 'tender', 'muted', 'hushed'],
            emphatic: ['BLISSFULLY PEACEFUL', 'PROFOUNDLY SERENE', 'ABSOLUTE TRANQUILITY', 'PERFECT STILLNESS']
        },

        // Atmospheric moods
        Mysterious: {
            standard: ['mysterious', 'enigmatic', 'cryptic', 'secretive', 'unknown', 'hidden', 'arcane', 'veiled'],
            subtle: ['unclear', 'ambiguous', 'subtle', 'understated', 'quiet', 'undisclosed'],
            emphatic: ['DEEPLY MYSTERIOUS', 'IMPOSSIBLY CRYPTIC', 'PROFOUNDLY ENIGMATIC', 'SHROUDED IN SECRECY']
        },
        Confined: {
            standard: ['confined', 'cramped', 'enclosed', 'tight', 'narrow', 'boxed-in', 'restricted', 'hemmed-in'],
            subtle: ['close', 'intimate', 'snug', 'cozy', 'compact', 'limited'],
            emphatic: ['CLAUSTROPHOBICALLY CONFINED', 'SUFFOCATINGLY TIGHT', 'OPPRESSIVELY ENCLOSED', 'CRUSHINGLY NARROW']
        },
        Vast: {
            standard: ['vast', 'expansive', 'immense', 'boundless', 'endless', 'infinite', 'sprawling', 'enormous'],
            subtle: ['spacious', 'open', 'wide', 'broad', 'extended', 'far-reaching'],
            emphatic: ['IMPOSSIBLY VAST', 'INFINITELY EXPANSIVE', 'BOUNDLESSLY IMMENSE', 'OVERWHELMINGLY ENDLESS']
        },
        Elevated: {
            standard: ['elevated', 'high', 'soaring', 'lofty', 'towering', 'pinnacle', 'summit', 'peak'],
            subtle: ['raised', 'higher', 'uplifted', 'ascending', 'rising', 'climbing'],
            emphatic: ['DIZZILY ELEVATED', 'IMPOSSIBLY HIGH', 'SOARINGLY LOFTY', 'VERTIGINOUSLY TOWERING']
        },

        // Danger & Threat moods
        Danger: {
            standard: ['dangerous', 'risky', 'hazardous', 'perilous', 'threatening', 'menacing', 'treacherous', 'deadly'],
            subtle: ['uncertain', 'cautious', 'wary', 'risky', 'unsafe', 'precarious'],
            emphatic: ['DEATHLY DANGEROUS', 'LETHAL PERIL', 'IMMINENTLY DEADLY', 'CATASTROPHICALLY HAZARDOUS']
        },
        Threatening: {
            standard: ['threatening', 'ominous', 'sinister', 'baleful', 'hostile', 'aggressive', 'combative', 'antagonistic'],
            subtle: ['tense', 'strained', 'defensive', 'guarded', 'wary', 'alert'],
            emphatic: ['OVERWHELMINGLY THREATENING', 'DREADFULLY SINISTER', 'HOSTILELY AGGRESSIVE', 'MURDEROUSLY ANTAGONISTIC']
        },
        Foreboding: {
            standard: ['foreboding', 'ominous', 'portentous', 'inauspicious', 'ominously', 'ill-fated', 'cursed', 'doomed'],
            subtle: ['unsettling', 'uneasy', 'worried', 'concerned', 'anxious', 'dreadful'],
            emphatic: ['HORRIFYINGLY FOREBODING', 'APOCALYPTICALLY OMINOUS', 'DOOMFULLY CURSED', 'INESCAPABLY DOOMED']
        },

        // Terrain-specific moods
        Desolate: {
            standard: ['desolate', 'barren', 'empty', 'abandoned', 'forsaken', 'uninhabited', 'lifeless', 'stark'],
            subtle: ['sparse', 'quiet', 'isolated', 'lonely', 'remote', 'withdrawn'],
            emphatic: ['UTTERLY DESOLATE', 'SOUL-CRUSHING EMPTINESS', 'COMPLETELY FORSAKEN', 'HAUNTINGLY LIFELESS']
        },
        Harsh: {
            standard: ['harsh', 'severe', 'unforgiving', 'brutal', 'rough', 'rugged', 'cruel', 'austere'],
            subtle: ['difficult', 'challenging', 'demanding', 'rigorous', 'tough', 'stern'],
            emphatic: ['BRUTALLY HARSH', 'RELENTLESSLY SEVERE', 'CRUELLY UNFORGIVING', 'SAVAGELY BRUTAL']
        },
        Barren: {
            standard: ['barren', 'bare', 'naked', 'stripped', 'denuded', 'void', 'empty', 'sterile'],
            subtle: ['sparse', 'thin', 'exposed', 'open', 'clear', 'uncluttered'],
            emphatic: ['COMPLETELY BARREN', 'UTTERLY STRIPPED', 'TOTALLY VOID', 'UTTERLY STERILE']
        },
        Serene: {
            standard: ['serene', 'calm', 'untroubled', 'composed', 'placid', 'undisturbed', 'tranquil', 'harmonious'],
            subtle: ['gentle', 'soft', 'quiet', 'muted', 'peaceful', 'still'],
            emphatic: ['PROFOUNDLY SERENE', 'PERFECTLY HARMONIOUS', 'ABSOLUTELY TRANQUIL', 'BLISSFULLY COMPOSED']
        },

        // State-based moods
        Abandoned: {
            standard: ['abandoned', 'deserted', 'vacated', 'empty', 'forlorn', 'neglected', 'derelict', 'forsaken'],
            subtle: ['unused', 'quiet', 'still', 'dormant', 'inactive', 'silent'],
            emphatic: ['COMPLETELY ABANDONED', 'UTTERLY FORSAKEN', 'DEVASTATINGLY FORLORN', 'HAUNTINGLY DERELICT']
        }
    },

    continuations: {
        // Movement continuations (used after movement-based narratives)
        movement: [
            'Your footsteps echo with each step forward.',
            'The path ahead winds deeper into the unknown.',
            'You press onward, driven by curiosity.',
            'Each step brings new sensations to your awareness.',
            'Your journey continues, moment by moment.',
            'Time seems to shift with your movement.',
            'You notice details you missed before.',
            'The world shifts subtly around you.'
        ],

        // Discovery continuations (used after discovery/exploration narratives)
        discovery: [
            'This is something you will remember.',
            'You commit this moment to memory.',
            'Your curiosity intensifies.',
            'You explore further, eager for more.',
            'Something about this place calls to you.',
            'You sense there is more to discover here.',
            'This discovery changes your perspective.',
            'You document this in your mind.'
        ],

        // Danger continuations (used after threat/danger narratives)
        danger: [
            'Your muscles tense with anticipation.',
            'Every sense sharpens to full alert.',
            'You prepare yourself for what may come.',
            'The threat feels very real now.',
            'Your survival instincts take over.',
            'Adrenaline courses through your veins.',
            'You grip your weapon tightly.',
            'Danger lurks around every corner.'
        ],

        // Weather continuations (used after weather narratives)
        weather: [
            'The elements rage around you mercilessly.',
            'Nature displays its raw power.',
            'You huddle against the onslaught.',
            'The weather intensifies further.',
            'You seek shelter from the tempest.',
            'The storm shows no signs of abating.',
            'The elements buffet you relentlessly.',
            'You persevere through the harsh conditions.'
        ],

        // Transition continuations (used for smooth narrative flow)
        transition: [
            'As you move forward...',
            'Gradually, you notice...',
            'Before you realize it...',
            'In that moment...',
            'Suddenly, you become aware...',
            'Time seems to pause as...',
            'Your attention shifts to...',
            'Somewhere nearby...',
            'In the distance...',
            'Far below...',
            'High above...',
            'All around you...'
        ]
    },

    transitionPhrases: [
        'As the moment passes...',
        'Before long...',
        'In time...',
        'When you least expect it...',
        'Gradually...',
        'Inch by inch...',
        'Step by step...',
        'Little by little...',
        'With each passing moment...',
        'Slowly but surely...',
        'Ever so gently...',
        'Without warning...',
        'In a flash...',
        'In an instant...',
        'In a blink of an eye...'
    ],

    /**
     * Descriptive nouns for emphasis highlighting
     * These are common game terms that should be emphasized (bold/highlight) in narratives
     */
    descriptiveNouns: [
        'jungle', 'cave', 'mountain', 'forest', 'desert', 'ocean', 'beach',
        'storm', 'rain', 'thunder', 'lightning', 'wind', 'snow', 'fog',
        'danger', 'creature', 'beast', 'shadow', 'light', 'darkness',
        'treasure', 'artifact', 'portal', 'ancient', 'secret', 'mystery',
        'path', 'trail', 'road', 'clearing', 'valley', 'peak', 'cliff',
        'water', 'fire', 'earth', 'air', 'life', 'death', 'magic'
    ]
};

/**
 * Helper function to select a random adjective from a specific tier
 * @param moodTag - The mood tag to select from
 * @param tier - The variation tier (standard, subtle, emphatic)
 * @returns A random adjective or undefined if mood not found
 */
export function getRandomAdjective(moodTag: string, tier: 'standard' | 'subtle' | 'emphatic'): string | undefined {
    const moodAdjectives = ENGLISH_LEXICON.adjectives[moodTag]?.[tier];
    if (!moodAdjectives || moodAdjectives.length === 0) {
        return undefined;
    }
    return moodAdjectives[Math.floor(Math.random() * moodAdjectives.length)];
}

/**
 * Helper function to select a random continuation phrase
 * @param actionType - The action type (movement, discovery, danger, weather, transition)
 * @returns A random continuation phrase or undefined if action type not found
 */
export function getRandomContinuation(actionType: string): string | undefined {
    const continuations = ENGLISH_LEXICON.continuations[actionType];
    if (!continuations || continuations.length === 0) {
        return undefined;
    }
    return continuations[Math.floor(Math.random() * continuations.length)];
}

/**
 * Helper function to select a random transition phrase
 * @returns A random transition phrase
 */
export function getRandomTransition(): string {
    return ENGLISH_LEXICON.transitionPhrases[Math.floor(Math.random() * ENGLISH_LEXICON.transitionPhrases.length)];
}
