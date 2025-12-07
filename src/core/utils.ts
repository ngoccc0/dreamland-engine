// Compatibility shim: re-export commonly used utilities from `src/lib/utils` so
// older relative imports targeting `src/core/utils` or `src/core/*/../utils` resolve.
export * from '@/lib/utils';
