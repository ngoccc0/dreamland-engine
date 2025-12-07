// Compatibility barrel to satisfy older relative imports like `../types` from engine modules.
// Re-export the concrete game-level types and definitions so engine-local imports
// receive the full set of expected symbols.
// Re-export canonical game-level types. Avoid re-exporting definitions here to
// prevent duplicate-symbol collisions (definitions should be imported directly
// where needed).
export * from '@/core/types/game';
