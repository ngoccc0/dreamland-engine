/**
 * lib/core/index.ts
 * Barrel export for core utilities
 * These are foundational utilities used across the application
 */

// Debug utilities
export { maybeDebug } from './debug';

// Firebase configuration
export {
    ensureFirebaseInitialized,
    getDb,
    getAuthInstance,
    getGoogleProvider,
    getFirebaseExports
} from './firebase-config';

// i18n setup
export {
    translations,
    LanguageEnum,
    getTranslatedText
} from './i18n';
export type {
    TranslationKey,
    Language
} from './i18n';

// Logger
export { logger } from './logger';
