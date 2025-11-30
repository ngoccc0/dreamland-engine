# Dreamland Engine Changelog - Early Alpha

## Version 0.1.0 - The Initial Spark (June 25-29, 2025)

Hey Explorers! Welcome to the very first sparks of Dreamland Engine! We've been busy laying the absolute groundwork for our world, fixing initial glitches, and getting the most basic systems in place.

### What's New & Fixed:
*   **Engine Scaffolding & Next.js Foundation**: Established the core engine structure and resolved foundational Next.js errors to get the application running smoothly.
*   **Basic UI & Layout**: Started sketching out the game's interface, ensuring readability and basic responsiveness across devices.
*   **World Configuration & Chunk Generation**: Implemented initial world generation parameters, improved chunk creation, and handled SVG assets for the minimap.
*   **Core Systems Foundation**: Laid groundwork for critical systems like character stats (HP, Mana, Stamina), progress saving, and an early AI narrative system.
*   **Minimap Essentials**: Introduced basic minimap functionality, dynamic entity icons using emojis, and addressed initial display issues.
*   **Dynamic Entities**: Enabled each map cell to be a distinct entity, allowing for future interactive world elements.
*   **Ecosystem & AI Concepts**: Began defining how creatures and plants interact, setting up basic logic for a dynamic world.

**With this version, the dream of Dreamland Engine officially begins! We've established a stable core, ready to expand into a vibrant, interactive world.**

### What's Brewing Next:
Get ready for a massive architectural overhaul! Our next update will dive deep into refactoring the engine's "brain," introducing a dynamic narrative system, a flexible multilingual architecture, and standardized game data. This is a huge leap towards a truly robust and moddable world!

## Version 0.2.0 - The Architectural Foundation (July 2025)

Hello, Future Builders and Steadfast Engineers! This is a single, monumental update focusing on fortifying the engine's "backbone" and laying down a robust architectural blueprint. We've conducted a sweeping review and deep refactoring, ensuring our engine is resilient, type-safe, and ready for future expansion.

### What's New & Fixed:
*   **Offline Narrative Engine v2.0 & Refinements**: Moved beyond simple static templates to implement a dynamic narrative engine based on "Mood." This transforms the engine into a "storyteller" that "feels" and describes the environment soulfully, even without online AI. Core functions have been moved to their proper homes (`offline.ts`), fixing critical runtime errors and ensuring seamless player actions in offline mode.
*   **Hybrid Multilingual Architecture (i18n Overhaul)**: Implemented a combined multilingual strategy that handles both static UI translation keys and dynamic `TranslatableString` objects for in-game data. A `getTranslatedText` helper ensures consistent text display.
*   **Standardized Game Data & Player Attributes**: All in-game environmental metrics are now standardized to a 0-100 range. `ItemDefinition`s have been overhauled to use unique `id`s and standard multilingual objects for `name` and `description`. `PlayerAttributesSchema` has been made flexible with `.optional().default(0)` for item attributes.
*   **Type Safety & Consistency**: Addressed a series of critical TypeScript errors and refactored core components for data consistency. This includes fixing inconsistent type errors, standardizing `TranslatableString`, and expanding `ItemCategorySchema`.
*   **Performance & Stability Fixes**:
    *   **Infinite Render Loop Fix**: Resolved a critical bug in `useGameInitialization` causing infinite render loops by using safer state update methods.
    *   **Logic Module Refactoring**: Key logic functions were moved to correct engine modules, resolving "Module not found" errors.
    *   **State Update Logic in useActionHandlers**: Fixed a subtle error where action handler functions failed to call `setPlayerStats`, leading to "stale state." Player state now reflects accurately and immediately after every action.
    *   **Crash Fix in generateChunkContent**: Resolved a serious `TypeError` during chunk generation with guard clauses and optional chaining, preventing game crashes and enhancing resilience to invalid data.
    *   **Dependency Cleanup**: Removed unnecessary dependencies from `useCallback` hooks, optimizing performance.
*   **Code Documentation & Debugging**: Integrated TSDoc comment blocks (`/** ... */`) into critical files, preparing for automated API documentation. Created a detailed `report_chunk_creation_and_loading.md` in `docs/` to aid future debugging of chunk and world loading processes.
*   **Template Data Fortification**: Reinforced `generateOfflineNarrative` and `selectEntities` with guard clauses and filtering to handle inconsistent template data gracefully, preventing runtime errors. Removed trailing commas in `forest.ts` and `mountain.ts` to ensure data integrity.

**The engine now boasts absolute reliability and self-recovery capabilities, operating stably even with imperfect template data. This comprehensive overhaul has created a robust, type-safe, and highly maintainable foundation for all future features!**

### What's Brewing Next:
Our journey continues towards a more interactive and living world! Expect to see significant enhancements to creature AI, dynamic world mechanics, and the introduction of foundational gameplay loops like farming. We're setting the stage for truly engaging player experiences!

## Version 0.3.0 - Ecosystem & Core Mechanics (November 06-15, 2025)

Hello, Dynamic Dreamers! This update marks a significant leap in how our world feels alive and interactive, focusing on nuanced narratives, a thriving ecosystem, and core gameplay mechanics.

### What's New & Fixed:
*   **Narrative Voice & Tone Refinements**: Refined narrative voice filtering, ensuring story descriptions are more aligned with the chosen tone, making tales richer and more consistent.
*   **Dynamic World & Visual Refresh**: Further developed world mechanisms for a more dynamic environment. Logo, favicon, and HUD received a refresh for a polished look.
*   **Creature AI & Ecology**: Introduced trophic metadata and predator 5x5 aggro/attack behavior. New eating narrative templates bring interactions to life, and `visibleChunks` have better fallbacks.
*   **Enhanced Type Safety & Linting**: Comprehensive cleanup fixing numerous type-check errors across the codebase, including missing type imports, corrected catch variables, refined AI flow typings, standardized `import type` usage, and restored catch bindings.
*   **AI Flow Optimization & Terrain API**: Deferred Genkit initialization to runtime and streamlined the terrain API by removing legacy wrappers, simplifying world generation.
*   **Farming Mechanics Foundation**: Laid minimal groundwork for farming use cases (till, water, fertilize, plant) and migrated forest creature spawns to definitions.
*   **Refined Spawning Mechanisms**: Separate and more refined spawning mechanisms implemented for items, plants, and animals.
*   **Action Handler Refactoring**: Extracted and wired factories for `offline-attack` and `offline-skill` handlers, and cleaned up unused empty hook files, improving modularity and maintainability.
*   **Hunger Bar & Move Orchestration**: `hudHunger` translation key now correctly displayed. Implemented move handler and overlay/pan fixes, improving move orchestration and addressing missing translation keys.

**With this update, Dreamland feels more alive and coherent than ever! The narrative flows more naturally, creatures interact dynamically, and the engine's foundation is stronger and more reliable. We've introduced fundamental gameplay loops, setting the stage for deeper player engagement.**

### What's Brewing Next:
Get ready for an even smoother visual experience! Our next updates will dive into comprehensive minimap and player movement polishing, addressing scaling, animations, and centering issues to make your exploration truly seamless.

## Version 0.4.0 - Visual & Interactive Harmony (November 16-29, 2025)

Hello, Visionary Voyagers! This update is all about enhancing your journey through Dreamland, with a sharp focus on smoother visuals, clearer interactions, and a more responsive environment. We've been polishing the experience to make every step feel more engaging!

### What's New & Fixed:
*   **Minimap Polish & Control**: Gave the minimap a major facelift! Expect smoother panning animations that now use grid cell sizes, better scaling with inline styles, and a unified magnifying glass icon for zoom. Addressed minimap scaling and centering issues. We've also disabled viewport pan animation and kept the grid frozen during moves to prevent minimap re-renders from turn changes during animation.
*   **Flight Animations Refined**: Player flight animations are now silky smooth! We've unified the lift and flight into a single, seamless arc that adapts to all movement directions. Your avatar will gracefully soar across the map.
*   **Plant Interaction System**: Get ready to become a botanist! Implemented a comprehensive plant interaction system, including stamina costs for harvesting, environmental preferences for plants, a 3-state suitability system (SUITABLE/UNFAVORABLE/UNSUITABLE), and a reactive decay mechanism. The new Plant Inspection Modal provides all the details you need.
*   **Avatar Display Improvements**: Squashed several bugs related to avatar rendering and minimap centering, ensuring your character always looks great and is precisely where they should be on the map.
*   **Debug & Performance**: Added extensive logging and analysis tools (`debug: add logging for avatar visibility issue`) to identify and resolve animation blocking issues and race conditions, leading to a more performant and stable game. This includes detailed animation debugging (blocking, duration, delay, pan calc issues).
*   **Viewport & Scaling**: Preferred cover scaling and relaxed viewport minHeight for minimap, avoiding upscaling beyond native size.

**We've achieved a significant upgrade in how you see and interact with the world! The minimap is clearer, animations are smoother, and interacting with plants is now a rich, strategic experience. Dreamland is more beautiful and responsive than ever!**

### What's Brewing Next:
Get ready for a profound shift in how time passes in Dreamland! Our next updates will introduce an advanced idle progression system, complete with warning notifications and a visual indicator. You'll be able to pause game progression and catch up on elapsed time with immersive narrative messages. Prepare for a more thoughtful and dynamic passage of time, even when you're away!

## Version 0.5.0 - Time Mechanics & Alpha Readiness (November 29-30, 2025)

Greetings, Patient Pioneers! We've reached a pivotal moment in Dreamland's development, with a major focus on making time feel more meaningful and polishing the engine for its first significant release. We're thrilled to announce that with these updates, Dreamland Engine is nearing its Alpha 1 launch!

### What's New & Fixed:
*   **Idle Progression System**: Time truly moves in Dreamland, even when you're not actively playing! We've implemented a robust idle progression system that tracks elapsed time, with smart catch-up mechanics and immersive narrative messages.
*   **Idle Warning Notifications**: To keep you in the loop, we've added a `useIdleWarning` hook that provides timely toast notifications when you're nearing the idle progression threshold.
*   **Pause Idle Progression**: You can now toggle "Pause Idle Progression" directly in the settings UI, complete with a clear HUD indicator.
*   **Engine Finalization & Test Suite**: This update includes a comprehensive polish pass, bringing us closer to a prototype launch. We've fine-tuned animation timings, improved UX, resolved critical type safety issues (including `WorldDefinition` and `Item` typing), and expanded our test suite with four new smoke tests for game loop, combat, crafting, and inventory.
*   **Plant Configuration**: Added missing configuration properties for plant growth simulation, ensuring more realistic and predictable plant mechanics.
*   **Next.js Build Fix**: Addressed a persistent Next.js build error by carefully managing `use server` directives in schema exports, ensuring a smooth and reliable build process.
*   **Minimap Revert**: A small but important fix – we reverted a previous minimap visibility change to ensure stable rendering.
*   **Dynamic Audio Integration System**: Implemented a comprehensive, event-driven audio system for immersive gameplay feedback. Features include:
    *   **Action-Based Audio**: 30+ AudioActionType enums mapping game actions (movement, combat, crafting, harvesting, UI) to contextual sound effects
    *   **407 SFX Assets**: Organized across 15 categories (footsteps, combat, items, crafting, farming, UI, musical stings, etc.)
    *   **Intelligent Playback Modes**: Off (silent), Occasional (50% non-critical events + 100% critical), Always (all events)
    *   **Context-Aware SFX Selection**: Rarity-aware pickups, biome-responsive footsteps (3 random from 20+ rustles), success/fail differentiation
    *   **Clean Architecture**: Pure usecases + registry pattern = no audio logic coupling to game engines
    *   **Persistent Audio Settings**: Playback mode and SFX volume stored in localStorage
    *   **UI Audio Feedback**: Buttons emit hover/click sounds for enhanced UX
    *   **Comprehensive Testing**: 18 unit tests covering playback mode filtering, context resolution, and SFX mapping

**With these extensive updates, Dreamland Engine is a far more stable, feature-rich, and engaging experience. The idle progression system adds a new dimension to gameplay, the dynamic audio system brings immersive feedback to every action, and the comprehensive polish makes everything feel crisp and professional. We are now a strong candidate for Alpha 1!**

### What's Brewing Next:
As we prepare for the Alpha 1 launch, our immediate focus will be on final stability checks and addressing any last-minute feedback. We're constantly working to ensure Dreamland provides the best possible experience from day one. Stay tuned for the official Alpha 1 announcement – your adventure is about to begin!
