/**
 * CONSOLIDATION PLAN - Overlapping Hooks Refactoring
 * 
 * Goal: Merge overlapping state selector hooks into their management counterparts
 * This reduces code duplication and improves module clarity.
 * 
 * PHASE 2: Consolidate exploration hooks
 * =====================================
 */

// BEFORE (separate files):
// src/hooks/use-exploration-state.ts - exports useExplorationState(gameState)
// src/hooks/use-exploration.ts - exports useExploration() handler

// AFTER (consolidated):
// src/hooks/use-exploration.ts - exports BOTH useExplorationState + useExploration
// Delete: src/hooks/use-exploration-state.ts

/**
 * PHASE 3: Consolidate quest hooks
 * ================================
 */

// BEFORE (separate files):
// src/hooks/use-quest-state.ts - exports useQuestState(gameState)
// src/hooks/use-quest-integration.ts - exports useQuestIntegration() handler

// AFTER (consolidated):
// src/hooks/use-quest-integration.ts - exports BOTH useQuestState + useQuestIntegration
// Delete: src/hooks/use-quest-state.ts

/**
 * PHASE 4: Consolidate weather hooks
 * ==================================
 */

// BEFORE (separate files):
// src/hooks/use-weather-state.ts - exports useWeatherState(gameState)
// src/hooks/use-weather-integration.ts - exports useWeatherIntegration() handler

// AFTER (consolidated):
// src/hooks/use-weather-integration.ts - exports BOTH useWeatherState + useWeatherIntegration
// Delete: src/hooks/use-weather-state.ts

/**
 * PHASE 5: Update index exports
 * =============================
 */

// src/hooks/state/index.ts:
// export { useExplorationState } from '../use-exploration';
// export { useQuestState } from '../use-quest-integration';
// export { useWeatherState } from '../use-weather-integration';

// src/hooks/features/exploration/index.ts:
// export { useExplorationState, useExploration } from '../../use-exploration';

// src/hooks/features/quest/index.ts:
// export { useQuestState, useQuestIntegration } from '../../use-quest-integration';

// src/hooks/features/weather/index.ts:
// export { useWeatherState, useWeatherIntegration } from '../../use-weather-integration';

/**
 * Import paths that will be affected:
 * ===================================
 */

// weather-hud.tsx:
// import { useWeatherState } from '@/hooks/use-weather-state';
// CHANGE TO:
// import { useWeatherState } from '@/hooks/use-weather-integration';

// quest-tracker.tsx:
// import { useQuestState } from '@/hooks/use-quest-state';
// CHANGE TO:
// import { useQuestState } from '@/hooks/use-quest-integration';

// Any exploration uses:
// import { useExplorationState } from '@/hooks/use-exploration-state';
// CHANGE TO:
// import { useExplorationState } from '@/hooks/use-exploration';
