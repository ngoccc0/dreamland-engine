// Main export
export { CreatureEngine, arePositionsWithinSquareRange, scanAreaAround } from './core';
export type { CreatureState } from './core';

// Behavior exports
export { updateBehavior } from './behavior';

// Feeding exports
export { updateHunger, canEatPlants, attemptEatPlants } from './feeding';

// Movement exports
export { executeMovement, calculateFleePosition, calculateHuntPosition, calculateRandomPosition, isValidMove, shouldMove } from './movement';

// Breeding behavior exports
export {
    canBreed,
    findMate,
    generateOffspring,
    applyBreedingCost,
    shouldBecomeAdult,
    promoteToAdult,
    recordFeeding,
    getBreedingCostMultiplier,
} from './breeding';

// Fleeing behavior exports
export { shouldFlee, calculateFleeDirection, findSafeRefuge, panicMovement };
export type { Threat } from './fleeing';
import type { Threat } from './fleeing';
import { shouldFlee, calculateFleeDirection, findSafeRefuge, panicMovement } from './fleeing';

// Herding/Pack behavior exports
export {
    prefersPack,
    calculateFlockingMovement,
    electAlpha,
    evaluatePackCohesion,
    shouldPackHunt,
    getPackHuntingBonus,
    isLostFromPack,
    seekPackMovement,
} from './herding';
export type { PackState } from './herding';

// Hunting/Foraging exports
export {
    shouldHunt,
    getHuntingRange,
    evaluateFoodSource,
    calculateHuntingMovement,
    attemptHunt,
    calculateHungerSatisfaction,
} from './hunting';
export type { FoodSource } from './hunting';

// Immersive Events exports
export {
    createLostMemberEvent,
    createTerritorialFightEvent,
    createBirthEvent,
    createPredatorChaseEvent,
    createDeathEvent,
    createPackSeparationEvent,
    createCuriosityEvent,
    createScavengingEvent,
    shouldDisplayEvent,
} from './immersive-events';
export type { CreatureEvent, CreatureEventType } from './immersive-events';
