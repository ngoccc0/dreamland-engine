"use client";

import React from "react";
import { GameNarrativePanel } from "./game-narrative-panel";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import type { GameLayoutNarrativeProps } from "./game-layout.types";

/**
 * Narrative panel container (left on desktop, bottom on mobile).
 *
 * @remarks
 * This component wraps the GameNarrativePanel and handles responsive layout.
 * On mobile, it receives pb-20 padding to prevent the floating Joystick
 * from covering the last lines of narrative text.
 *
 * **Mobile:** Bottom panel (order-2), scrollable, with bottom padding
 * **Desktop:** Left panel (order-1), scrollable, full height
 *
 * @param props - Configuration object with narrative and handler callbacks
 * @returns React component rendering the narrative panel
 */
export function GameLayoutNarrative({
    narrativeLog,
    worldName,
    isDesktop,
    isLoading,
    showNarrativeDesktop,
    onToggleNarrativeDesktop,
    onOpenTutorial,
    onOpenSettings,
    onReturnToMenu,
    onOpenStatus,
    onOpenInventory,
    onOpenCrafting,
    onOpenBuilding,
    onOpenFusion,
    onOpenCooking,
}: GameLayoutNarrativeProps) {
    const { language, t } = useLanguage();
    return (
        <div
            className={cn(
                "flex flex-col min-h-0 overflow-hidden transition-all duration-300 relative",
                // Mobile: Bottom panel (order-2), takes remaining vertical space
                // Desktop: Left panel (order-1), full height
                isDesktop ? "order-1 flex-1 h-full" : "order-2 flex-1 w-full"
            )}
        >
            {/* Wrapper with padding on mobile to avoid Joystick covering text */}
            <div className={cn("h-full w-full", !isDesktop && "pb-20")}>
                <GameNarrativePanel
                    narrativeLog={narrativeLog}
                    worldName={worldName}
                    isDesktop={isDesktop}
                    showNarrativeDesktop={showNarrativeDesktop}
                    onToggleNarrativeDesktop={onToggleNarrativeDesktop}
                    isLoading={isLoading}
                    onOpenTutorial={onOpenTutorial}
                    onOpenSettings={onOpenSettings}
                    onReturnToMenu={onReturnToMenu}
                    onOpenStatus={onOpenStatus}
                    onOpenInventory={onOpenInventory}
                    onOpenCrafting={onOpenCrafting}
                    onOpenBuilding={onOpenBuilding}
                    onOpenFusion={onOpenFusion}
                    onOpenCooking={onOpenCooking}
                    language={language}
                    t={t}
                    animationMode="instant"
                    enableEmphasis={true}
                    maxEntries={50}
                />
            </div>
        </div>
    );
}
