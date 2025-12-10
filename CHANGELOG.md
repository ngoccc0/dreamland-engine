# Dreamland Engine Changelog - Early Alpha

## Version 0.7.0 - Deployment Optimization & Build Reduction (December 7-9, 2025)

Hello, Explorers! This update focuses on making Dreamland Engine leaner, faster, and more deployment-ready. We've achieved significant build size reductions and resolved critical deployment issues to ensure smooth sailing for our upcoming Alpha release!

### What's New & Fixed:
*   **Massive Build Size Reduction**: Converted all audio files from WAV to MP3 format, achieving a stunning 95% reduction in build size! This transforms our deployment from heavy to lightning-fast.
*   **Netlify Deployment Excellence**: Implemented Next.js standalone output mode to stay under Netlify's 250MB function limit. Added comprehensive netlify.toml configuration and aligned Node.js version to 22.17.0 for optimal compatibility.
*   **Security Enhancement**: Upgraded Next.js from 15.5.6 to 15.5.7 to patch critical security vulnerability CVE-2025-55182, keeping our explorers safe.
*   **Development Tool Optimization**: Excluded .next directory from Jest module resolution to prevent Haste collisions. Implemented lazy initialization for Genkit flows and game action tools to eliminate build-time errors.
*   **CI/CD Pipeline Stability**: Fixed Husky installation failures in Netlify CI environment and enabled devDependencies installation with NPM_CONFIG_PRODUCTION=false for smoother builds.
*   **Audio System Cleanup**: Performed aggressive audio cleanup and optimization, removing redundant files and streamlining our 407 SFX asset collection for deployment efficiency.

**With this optimization milestone, Dreamland Engine is now ready for its Alpha 0.7.0 release! We've transformed a bulky prototype into a sleek, deployment-ready experience that's 95% smaller and far more stable. This is a massive step toward our vision of making immersive gaming accessible to all explorers.**

### What's Brewing Next:
As we prepare for the official Alpha 1 launch, our focus will be on final stability testing, performance monitoring, and gathering early explorer feedback. We're committed to delivering the smoothest possible experience as Dreamland grows from prototype to full-fledged adventure!

## Version 0.6.0 - UI Polish & Core Documentation (December 1-7, 2025)

Greetings, Adventurers! This update brings Dreamland's interface and core systems to a new level of polish and reliability. We've enhanced the visual experience, strengthened our foundation with comprehensive documentation, and added meaningful time mechanics that make every moment in Dreamland feel special.

### What's New & Fixed:
*   **Comprehensive Documentation (Phase 2.3 COMPLETE)**: Added complete tSDoc documentation to all 15 core entities, covering entity systems, time & weather, world & exploration, and core logic. This creates a robust foundation for future development and modding.
*   **Game Time System Overhaul**: Implemented complete game time synchronization with the game engine, featuring a beautiful clock widget that rotates smoothly, starts at 6 AM, and uses 15-minute turns for meaningful progression.
*   **Enhanced HUD & Visual Polish**: Refined temperature display with dynamic weather integration and color-changing icons. Added PersonStanding icon for body temperature that responds to environmental conditions.
*   **Fog of War Enhancement**: Tripled fog-of-war thresholds on both minimap and full-map views, creating more strategic exploration and discovery.
*   **Audio Immersion**: Implemented biome-specific footstep SFX in move orchestrator, seamless ambience transitions, and dynamic volume updates with proper background music playback.
*   **Mobile Experience Optimization**: Fixed HUD display on mobile devices, enabled smooth narrative panel scrolling, and optimized responsive design across all screen sizes.
*   **Type Safety & Performance**: Strengthened TypeScript types in critical paths, extracted audio fade-out utilities, resolved 5 test failures (effect-engine, RNG seeding, narrative templates), and removed all debug console logging for cleaner production builds.
*   **React Lifecycle Optimization**: Replaced flushSync with microtask to eliminate lifecycle warnings and improve rendering performance.
*   **Repository Cleanup**: Removed all temporary and generated files, ensuring a clean, professional codebase ready for production.

**Dreamland now feels more alive and polished than ever! The time system adds real weight to your decisions, the interface responds beautifully to your environment, and our codebase is now thoroughly documented and battle-tested. We've transformed Dreamland from a promising prototype into a refined experience that honors every explorer's journey.**

### What's Brewing Next:
We're entering the final optimization phase before Alpha! Expect deployment-focused improvements, massive build size reductions, and critical security updates that will make Dreamland ready for its first public release.

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
