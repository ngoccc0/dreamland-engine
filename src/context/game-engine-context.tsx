'use client';

import React, { createContext, useContext, ReactNode, useRef } from 'react';
import type { GameEngineContainer } from '@/core/di-container';
import { createGameEngineContainer } from '@/core/di-container';

/**
 * Context for Game Engine dependency injection.
 *
 * @remarks
 * Provides access to all game usecases throughout the component tree.
 * **Pattern:**
 * - Provider created at app root (before all game components)
 * - Container instantiated once and never recreated
 * - All hooks use useGameEngine() to access container
 *
 * **Benefits:**
 * - Centralized usecase management
 * - Easy to swap mock usecases in tests
 * - No hardcoded `new ExplorationUseCase()` scattered in components
 * - Single point of control for usecase lifecycle
 *
 * @example
 * ```typescript
 * // In app/layout.tsx or app/page.tsx
 * <GameEngineProvider>
 *   <Game />
 * </GameEngineProvider>
 *
 * // In any hook
 * const { explorationUsecase, skillUsecase } = useGameEngine();
 * ```
 */
const GameEngineContext = createContext<GameEngineContainer | undefined>(
    undefined
);

/**
 * Provider component for Game Engine dependency injection.
 *
 * @remarks
 * Wraps the application and provides access to all usecases.
 * Should be placed at the app root, before the game layout.
 *
 * **Initialization:**
 * - Container created once in useRef (persists across renders)
 * - Never recreated on re-renders
 *
 * @param children - React components to wrap
 * @returns Provider element
 *
 * @example
 * ```typescript
 * export default function RootLayout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <html>
 *       <body>
 *         <GameEngineProvider>
 *           <LanguageProvider>
 *             {children}
 *           </LanguageProvider>
 *         </GameEngineProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export const GameEngineProvider = ({ children }: { children: ReactNode }) => {
    const containerRef = useRef<GameEngineContainer | null>(null);

    // Lazy initialize container on first render
    if (!containerRef.current) {
        containerRef.current = createGameEngineContainer();
    }

    return (
        <GameEngineContext.Provider value={containerRef.current}>
            {children}
        </GameEngineContext.Provider>
    );
};

/**
 * Hook to access the Game Engine container.
 *
 * @remarks
 * Use this hook in any hook or component that needs to call usecases.
 *
 * **Usage Pattern:**
 * ```typescript
 * export function useExploration() {
 *   const { explorationUsecase } = useGameEngine();
 *   // Now you can call explorationUsecase.exploreLocation()
 * }
 * ```
 *
 * **Error Handling:**
 * Throws an error if called outside GameEngineProvider.
 * Ensure provider wraps your components at the app root.
 *
 * @returns GameEngineContainer with all usecases
 * @throws {Error} If used outside GameEngineProvider
 */
export function useGameEngine(): GameEngineContainer {
    const context = useContext(GameEngineContext);

    if (!context) {
        throw new Error(
            'useGameEngine() must be used within a <GameEngineProvider>. ' +
            'Ensure GameEngineProvider wraps your app at the root level.'
        );
    }

    return context;
}
