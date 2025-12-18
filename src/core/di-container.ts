/**
 * Dependency Injection Container for Game Engine.
 *
 * @remarks
 * Centralizes instantiation of all usecases and their dependencies.
 * This enables:
 * - **Testability:** Inject mock usecases in tests
 * - **Decoupling:** Hooks don't hardcode usecase instantiation
 * - **Single Point of Control:** All usecases created here
 *
 * **Pattern:**
 * 1. Container created once in GameEngineProvider
 * 2. Passed to all hooks via useGameEngine() context hook
 * 3. Each hook requests the usecase it needs (e.g., explorationUsecase)
 * 4. No new ExplorationUseCase() calls scattered in components
 *
 * **Lazy Initialization:**
 * Usecases are instantiated on first access (lazy), not all at once.
 * This reduces startup time and memory for unused features.
 *
 * @example
 * ```typescript
 * // In GameEngineProvider
 * const container = createGameEngineContainer();
 *
 * // In hook
 * const { explorationUsecase } = useGameEngine();
 * const result = explorationUsecase.exploreLocation(position);
 * ```
 */

import { ExplorationUseCase } from './usecases/exploration-usecase';
import { WorldUseCase } from './usecases/world-usecase';
import { WeatherUseCase } from './usecases/weather-usecase';
import { SkillUseCase } from './usecases/skill-usecase';
import { CombatUseCase } from './usecases/combat-usecase';
import { ExperienceUseCase } from './usecases/experience-usecase';
import { ExplorationManager } from './entities/exploration';
import { WeatherEngine } from './engines/weather-engine';

/**
 * Container interface defining all available usecases.
 *
 * @remarks
 * Each usecase is lazily instantiated. Add new usecases here
 * by:
 * 1. Adding a property to this interface
 * 2. Adding lazy getter to GameEngineContainerImpl
 * 3. Updating createGameEngineContainer() factory
 */
export interface GameEngineContainer {
    explorationUsecase: ExplorationUseCase;
    worldUsecase: WorldUseCase;
    weatherUsecase: WeatherUseCase;
    skillUsecase: SkillUseCase;
    combatUsecase: CombatUseCase;
    experienceUsecase: ExperienceUseCase;
}

/**
 * Implementation of the DI container.
 *
 * @remarks
 * Uses lazy initialization (getters) to avoid instantiating
 * all usecases at startup. Only requested usecases are created.
 */
class GameEngineContainerImpl implements GameEngineContainer {
    private _explorationUsecase: ExplorationUseCase | null = null;
    private _worldUsecase: WorldUseCase | null = null;
    private _weatherUsecase: WeatherUseCase | null = null;
    private _skillUsecase: SkillUseCase | null = null;
    private _combatUsecase: CombatUseCase | null = null;
    private _experienceUsecase: ExperienceUseCase | null = null;

    /**
     * Lazy getter for ExplorationUseCase.
     *
     * @remarks
     * First call creates the instance; subsequent calls return cached instance.
     * Dependencies injected here (ExplorationManager, repositories).
     */
    get explorationUsecase(): ExplorationUseCase {
        if (!this._explorationUsecase) {
            const explorationManager = new ExplorationManager();
            this._explorationUsecase = new ExplorationUseCase(
                explorationManager,
                null as any, // worldRepository (injected from infrastructure when needed)
                null as any  // playerRepository (injected from infrastructure when needed)
            );
        }
        return this._explorationUsecase;
    }

    /**
     * Lazy getter for WorldUseCase.
     */
    get worldUsecase(): WorldUseCase {
        if (!this._worldUsecase) {
            // NOTE: WorldUseCase dependencies are heavy; defer initialization
            // until they're actually used. For now, pass null for testing.
            this._worldUsecase = new WorldUseCase(
                null as any, // World instance
                null as any, // worldGenerator
                null as any, // worldRepository
                null as any  // creatureEngine
            );
        }
        return this._worldUsecase;
    }

    /**
     * Lazy getter for WeatherUseCase.
     */
    get weatherUsecase(): WeatherUseCase {
        if (!this._weatherUsecase) {
            const weatherEngine = new WeatherEngine(null as any, null as any);
            this._weatherUsecase = new WeatherUseCase(
                weatherEngine,
                null as any // worldRepository
            );
        }
        return this._weatherUsecase;
    }

    /**
     * Lazy getter for SkillUseCase.
     */
    get skillUsecase(): SkillUseCase {
        if (!this._skillUsecase) {
            this._skillUsecase = new SkillUseCase(
                null as any, // characterRepository
                null as any  // skillRepository
            );
        }
        return this._skillUsecase;
    }

    /**
     * Lazy getter for CombatUseCase.
     */
    get combatUsecase(): CombatUseCase {
        if (!this._combatUsecase) {
            this._combatUsecase = new CombatUseCase();
        }
        return this._combatUsecase;
    }

    /**
     * Lazy getter for ExperienceUseCase.
     */
    get experienceUsecase(): ExperienceUseCase {
        if (!this._experienceUsecase) {
            this._experienceUsecase = new ExperienceUseCase(
                null as any, // characterRepository
                null as any  // notificationService
            );
        }
        return this._experienceUsecase;
    }
}

/**
 * Factory function to create a new DI container.
 *
 * @remarks
 * Called once at application startup in GameEngineProvider.
 * Returns a singleton container instance.
 *
 * @returns Fresh GameEngineContainer with lazy-initialized usecases
 */
export function createGameEngineContainer(): GameEngineContainer {
    return new GameEngineContainerImpl();
}
