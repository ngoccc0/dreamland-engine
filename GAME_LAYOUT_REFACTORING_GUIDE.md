/**
 * GAME LAYOUT REFACTORING GUIDE - Smart/Dumb Component Pattern
 *
 * @remarks
 * **CURRENT STATE (Before):**
 * - game-layout.tsx: 520 lines, monolithic orchestrator
 * - Manages: dialog toggles, responsive layout, keyboard bindings, game engine
 * - Props drilling: receives 20+ props, passes down to sub-components
 * - Re-render issue: ANY parent state change triggers re-render of ALL children
 *
 * **GOAL (After):**
 * - game-layout.tsx: ~80 lines, pure layout (JSX only, no logic)
 * - Create 5 Container Components (Smart) wrapping feature UI (Dumb)
 * - Each container imports state directly from Context/Store
 * - Sub-components only receive data they need, wrapped in React.memo
 * - Result: Granular re-renders, zero prop drilling
 *
 * **PATTERN:**
 *
 * Dumb Component (Presentational):
 * - Pure JSX + styling
 * - Receives ONLY the data it displays via props
 * - No hooks (except forwardRef if needed)
 * - Wrapped in React.memo
 *
 * Smart Component (Container):
 * - Imports state from Context/Store directly
 * - Selects ONLY the data it needs (Zustand selector pattern)
 * - Calls hooks (useLanguage, useResponsiveLayout, custom hooks)
 * - Passes props to Dumb Component
 * - NOT wrapped in memo (it's supposed to re-render when deps change)
 *
 * ============================================
 * IMPLEMENTATION PLAN
 * ============================================
 *
 * FILE STRUCTURE:
 *
 * src/components/game/panels/
 * ├── game-layout.tsx                  (Dumb - pure JSX)
 * ├── sections/
 * │   ├── narrative-section.tsx        (Smart - connects to engine)
 * │   ├── hud-section.tsx              (Smart - connects to store + UI)
 * │   ├── controls-section.tsx         (Smart - connects to handlers)
 * │   ├── dialogs-section.tsx          (Smart - connects to dialog state)
 * │   └── status-bar-section.tsx       (Smart - connects to player stats)
 * └── game-layout.types.ts             (Types - shared interfaces)
 *
 * ============================================
 * STEP-BY-STEP IMPLEMENTATION
 * ============================================
 *
 * **Step 1:** Extract narrative to NarrativeSection.tsx
 * ```typescript
 * // SMART CONTAINER
 * function NarrativeSection() {
 *   const { narrativeLog } = useGameEngine();
 *   const { showNarrativePanel } = useUIStore(s => ({
 *     showNarrativePanel: s.showNarrativePanel
 *   }));
 *   
 *   return (
 *     <GameLayoutNarrative 
 *       narrativeLog={narrativeLog}
 *       showNarrativePanel={showNarrativePanel}
 *     />
 *   );
 * }
 * export default React.memo(NarrativeSection);
 *
 * // DUMB COMPONENT (rename current GameLayoutNarrative)
 * function GameLayoutNarrative({ narrativeLog, showNarrativePanel }) {
 *   return <div>...</div>;
 * }
 * ```
 *
 * **Step 2:** Extract HUD to HudSection.tsx
 * ```typescript
 * // SMART CONTAINER
 * function HudSection() {
 *   const { isDesktop } = useResponsiveLayout();
 *   const { playerStats } = useGameEngine();
 *   const { playerPosition, weatherZones } = useGameEngine();
 *   const { dialogs, openDialog } = useUIStore(s => ({
 *     dialogs: s.dialogs,
 *     openDialog: s.openDialog
 *   }));
 *   
 *   return (
 *     <GameLayoutHud 
 *       isDesktop={isDesktop}
 *       playerStats={playerStats}
 *       playerPosition={playerPosition}
 *       dialogs={dialogs}
 *       onMapToggle={() => openDialog('map')}
 *     />
 *   );
 * }
 * export default React.memo(HudSection);
 * ```
 *
 * **Step 3:** Extract Controls to ControlsSection.tsx
 * ```typescript
 * // SMART CONTAINER
 * function ControlsSection() {
 *   const { isDesktop } = useResponsiveLayout();
 *   const handlers = useActionHandlers(deps);
 *   
 *   return (
 *     <GameLayoutControls 
 *       isDesktop={isDesktop}
 *       handlers={handlers}
 *     />
 *   );
 * }
 * export default React.memo(ControlsSection);
 * ```
 *
 * **Step 4:** Extract Dialogs to DialogsSection.tsx
 * ```typescript
 * // SMART CONTAINER
 * function DialogsSection() {
 *   const { dialogs, closeDialog, openDialog } = useUIStore(s => ({
 *     dialogs: s.dialogs,
 *     closeDialog: s.closeDialog,
 *     openDialog: s.openDialog
 *   }));
 *   
 *   return (
 *     <GameLayoutDialogs 
 *       dialogs={dialogs}
 *       onClose={closeDialog}
 *     />
 *   );
 * }
 * export default React.memo(DialogsSection);
 * ```
 *
 * **Step 5:** Rewrite game-layout.tsx as pure Dumb layout
 * ```typescript
 * // DUMB COMPONENT - Pure JSX structure
 * function GameLayout() {
 *   return (
 *     <TooltipProvider>
 *       <div className="game-container">
 *         <NarrativeSection />
 *         <HudSection />
 *         <ControlsSection />
 *         <DialogsSection />
 *       </div>
 *     </TooltipProvider>
 *   );
 * }
 * export default React.memo(GameLayout);
 * ```
 *
 * ============================================
 * RE-RENDER BEHAVIOR AFTER REFACTORING
 * ============================================
 *
 * BEFORE:
 * GameEngine state change
 *   → game-layout.tsx re-renders
 *   → ALL children (Narrative, HUD, Controls, Dialogs) re-render
 *   → Minimap recalculates (even if playerPos didn't change)
 *   → Dialog text recalculates (even if dialog is closed)
 *
 * AFTER:
 * GameEngine state change
 *   → NarrativeSection re-renders (subscribed to narrativeLog)
 *   → HudSection re-renders (subscribed to playerStats)
 *   → ControlsSection stays still (not subscribed)
 *   → DialogsSection stays still (not subscribed)
 *   → GameLayout (Dumb) never re-renders (pure JSX, memo)
 *
 * ============================================
 * ZUSTAND SELECTOR PATTERN (Key to Efficiency)
 * ============================================
 *
 * ❌ WRONG (causes re-render on ANY store change):
 * const store = useUIStore();
 * const dialogs = store.dialogs;
 *
 * ✅ RIGHT (re-render ONLY when dialogs change):
 * const dialogs = useUIStore(s => s.dialogs);
 *
 * ============================================
 * ADOPTION STRATEGY
 * ============================================
 *
 * 1. Create the sections/ folder
 * 2. Implement one section at a time (e.g., NarrativeSection first)
 * 3. Keep the old GameLayout until all sections are ready
 * 4. Switch over: new GameLayout imports sections
 * 5. Delete old GameLayout
 * 6. Run tests, ensure no regressions
 *
 * ============================================
 * PERFORMANCE METRICS TO TRACK
 * ============================================
 *
 * Before refactoring:
 * - npm run analyze (webpack-bundle-analyzer)
 * - React DevTools Profiler: measure GameLayout render time
 *
 * After refactoring:
 * - Compare bundle size
 * - Compare render time (should be 2-3x faster)
 * - Each section renders independently
 *
 * ============================================
 * TESTING STRATEGY
 * ============================================
 *
 * After each section is extracted:
 * 1. Run npm test (ensure no regressions)
 * 2. Manual testing: click buttons, open dialogs, check interactions
 * 3. Performance check: open React DevTools, verify granular re-renders
 *
 * ============================================
 * FUTURE IMPROVEMENTS
 * ============================================
 *
 * Once sections are smart/dumb:
 * - Consider extracting HUD sub-sections (Minimap, StatusBar, ActionBar)
 * - Each becomes its own Smart/Dumb pair
 * - Can disable individual HUD sections (Settings → Hide Minimap, etc.)
 * - Modular HUD becomes possible
 */
