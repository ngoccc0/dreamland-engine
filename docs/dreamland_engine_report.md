# Dreamland Engine Code Analysis Report

## 1. Project Overview

Dreamland Engine is an AI-driven text-based adventure game where player decisions shape both the character and the dynamic, ever-changing world.

**Key Features:**

*   **AI Storyteller & Offline Mode:** Offers a choice between an AI-powered narrative and a rule-based offline mode.
*   **Multi-Agent World Generation:** Employs a team of AI "experts" to create unique worlds.
*   **Living World:** Features a dynamic ecosystem, weather system, and resource management.
*   **Deep Survival & Crafting:** Includes stat management, temperature regulation, tool crafting, shelter construction, and item fusion.
*   **Flexible Modding:** Supports easy content addition via JSON-based mod packages.

**Technologies and Libraries:**

Based on `package.json`, the project utilizes the following key technologies:

*   **Next.js:** A React framework for building server-rendered web applications.
*   **React:** A JavaScript library for building user interfaces.
*   **TypeScript:** A superset of JavaScript that adds static typing.
*   **Tailwind CSS:** A utility-first CSS framework.
*   **Genkit AI:** A framework for building AI-powered applications.
*   **Firebase:** A platform for building web and mobile applications.
*   **Radix UI:** A set of accessible UI primitives.
*   **Zod:** A TypeScript-first schema declaration and validation library.
*   **Dexie.js:** A minimalist JavaScript wrapper for IndexedDB.
*   **React Hook Form:** A library for building performant and accessible forms.

## 2. Directory Structure & Main Components

The project's directory structure is organized as follows:

*   `src/`: Contains the main source code of the application.
    *   `ai/`: Contains code related to AI, including flows, schemas, and plugins.
    *   `app/`: Contains the Next.js application routes, pages, and layout.
    *   `components/`: Contains reusable React components.
    *   `context/`: Contains React context providers for managing application state.
    *   `core/`: Contains the core game logic, entities, and use cases.
    *   `game/`: Contains game-specific code, such as terrain and item definitions.
    *   `hooks/`: Contains custom React hooks.
    *   `infrastructure/`: Contains infrastructure-related code, such as persistence implementations.
    *   `lib/`: Contains utility functions and helper modules.
*   `public/`: Contains static assets, such as images and fonts.
*   `docs/`: Contains documentation files.

### Focus on `src/core/`

The `src/core/` directory is central to the game's logic and architecture. It is further divided into the following subdirectories:

*   `engines/`: Contains core game engines.
*   `entities/`: Contains definitions for core game entities.
*   examples/`: Contains example code and data.
*   `factories/`: Contains factories for creating game entities.
*   `generators/`: Contains generators for creating game worlds and other game elements.
*   `repositories/`: Contains repositories for accessing and managing game data.
*   `types/`: Contains TypeScript type definitions for core game concepts.
*   `usecases/`: Contains use cases that orchestrate interactions between entities and engines.
*   `values/`: Contains value objects that represent simple data structures.

#### Key Components in `src/core/`

The `src/core/` directory houses the fundamental building blocks of the game's logic. Here's a brief overview of some key components:

*   **Engines:** These modules (e.g., `EffectEngine`, `WeatherEngine`) manage core game systems and apply their logic to game entities.
*   **Entities:** These modules (e.g., `Character`, `Chunk`, `Terrain`) define the structure and behavior of the game's core objects.
*   **Factories:** These modules (e.g., `EntityFactory`, `TerrainFactory`) are responsible for creating instances of game entities and terrain. See [EntityFactory Report](./entity_factory_report.md) for details on the `EntityFactory`.
*   **Generators:** These modules (e.g., `WorldGenerator`) are responsible for generating the game world. The `WorldGenerator` uses a configuration to create regions, assign terrain, and populate them with entities.
*   **Use Cases:** These modules orchestrate interactions between entities and engines to implement specific game actions and behaviors.

The `TerrainDefinitions` file defines the core types and interfaces for the terrain system. It includes the `TerrainRegistry` class, which manages the available terrain types, and interfaces for terrain attributes, features, and definitions.

## 3. Data Flow & Interaction

(To be continued after analyzing more files)

## 4. Important Functions/Business Logic

(To be continued after analyzing more files)

## 5. Potential Issues & Improvement Suggestions

(To be continued after analyzing more files)

## 6. Detailed Documentation (Docs:API Style)

(To be continued)

#### Key Generators in `src/core/generators/`

**`WorldGenerator` (src/core/generators/world-generator.ts):**

The `WorldGenerator` class is responsible for generating the game world. It uses a configuration object to define the world's dimensions, region sizes, and terrain distribution. It also uses the `TerrainFactory` to create terrain instances and the `EntityFactory` to populate the world with entities. The `generateWorld` method orchestrates the world generation process, creating regions, assigning terrain, and populating them with entities. It uses helper methods such as `generateRegions`, `generateGridPositions`, `selectTerrainForRegion`, `generateRegionCells`, and `selectPositionsForRegion` to perform specific tasks during world generation.

#### Key Use Cases in `src/core/usecases/`

The `src/core/usecases/` directory contains use cases that orchestrate interactions between entities and engines to implement specific game actions and behaviors. The `WorldUseCase` handles high-level world-related actions, such as generating the world, exploring chunks, and managing world updates. The `ExplorationUseCase` handles actions related to exploring the world and discovering new locations. The `CombatUseCase` handles combat-related actions, such as initiating combat, executing combat rounds, and determining the outcome of a battle.
