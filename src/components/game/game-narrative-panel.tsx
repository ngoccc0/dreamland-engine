/**
 * OVERVIEW: Narrative log panel displaying game narrative entries.
 * 
 * Extracted from GameLayout to improve readability and modularize layout.
 * Displays: Story entries, action descriptions, system messages
 * Features: Deduplication, type-based styling, auto-scroll to latest entry
 * 
 * Located: Main content area (left panel in desktop layout)
 */

"use client";

import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn, getTranslatedText } from "@/lib/utils";
import type { NarrativeEntry } from "@/lib/game/types";
import type { TranslationKey } from "@/lib/i18n";
import { Menu, LifeBuoy, Settings, LogOut, Cpu } from "./icons";

interface GameNarrativePanelProps {
    /** Array of narrative entries to display */
    narrativeLog: NarrativeEntry[];

    /** World name displayed in header */
    worldName: string;

    /** Is desktop-sized viewport */
    isDesktop: boolean;

    /** Should narrative be visible (desktop toggle) */
    showNarrativeDesktop: boolean;

    /** Callback to toggle narrative visibility */
    onToggleNarrativeDesktop: (show: boolean) => void;

    /** Is game currently loading (shows loading spinner) */
    isLoading: boolean;

    /** Translated text function for UI labels */
    t: (key: TranslationKey, params?: any) => string;

    /** Language for text display ('en' or 'vi') */
    language: "en" | "vi";

    /** Callback to open tutorial */
    onOpenTutorial: () => void;

    /** Callback to open settings */
    onOpenSettings: () => void;

    /** Callback to return to menu */
    onReturnToMenu: () => void;

    /** Optional className for styling */
    className?: string;
}

/**
 * GameNarrativePanel renders the narrative log and header controls.
 * 
 * Features:
 * - Narrative entry deduplication (renders-time check for duplicate IDs)
 * - Type-based styling: action/monologue (italic gray), system (bold accent)
 * - Auto-scroll to latest entry
 * - Header with world name and menu controls
 * - Desktop toggle for narrative visibility
 * 
 * @param narrativeLog - Array of narrative entries
 * @param worldName - World name for header display
 * @param isDesktop - Desktop viewport flag
 * @param showNarrativeDesktop - Desktop narrative visibility toggle
 * @param onToggleNarrativeDesktop - Callback to toggle narrative visibility
 * @param isLoading - Game loading state
 * @param t - Translation function
 * @param language - Current language
 * @param onOpenTutorial - Callback to open tutorial
 * @param onOpenSettings - Callback to open settings
 * @param onReturnToMenu - Callback to return to menu
 * @param className - Optional CSS classes
 * @returns JSX element rendering the narrative panel
 */
export function GameNarrativePanel({
    narrativeLog,
    worldName,
    isDesktop,
    showNarrativeDesktop,
    onToggleNarrativeDesktop,
    isLoading,
    t,
    language,
    onOpenTutorial,
    onOpenSettings,
    onReturnToMenu,
    className = "",
}: GameNarrativePanelProps) {
    const narrativeContainerRef = useRef<HTMLElement>(null);

    // Auto-scroll to latest entry
    useEffect(() => {
        if (narrativeContainerRef.current) {
            const latestEntry = narrativeContainerRef.current.lastElementChild;
            if (latestEntry) {
                latestEntry.scrollIntoView({ behavior: "smooth", block: "end" });
            }
        }
    }, [narrativeLog.length]);

    return (
        <div
            className={cn(
                isDesktop && !showNarrativeDesktop ? "md:hidden" : "",
                "w-full md:flex-1 flex flex-col md:overflow-hidden md:pb-16",
                className
            )}
        >
            {/* Header: World Name + Controls */}
            <header className="px-3 py-2 md:p-4 border-b flex-shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3 w-full md:max-w-3xl">
                    <h1 className="text-xl md:text-2xl font-bold font-headline">{worldName}</h1>
                </div>

                {/* Header Controls: Hide/Show Toggle + Menu */}
                <div className="flex items-center gap-2">
                    {/* Desktop-only toggle for narrative visibility */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hidden md:inline-flex"
                                onClick={() => onToggleNarrativeDesktop(!showNarrativeDesktop)}
                                aria-label={
                                    showNarrativeDesktop
                                        ? t("hideNarrative") || "Hide narrative"
                                        : t("showNarrative") || "Show narrative"
                                }
                            >
                                {showNarrativeDesktop ? "Hide" : "Show"}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>
                                {showNarrativeDesktop
                                    ? t("hideNarrative") || "Hide narrative"
                                    : t("showNarrative") || "Show narrative"}
                            </p>
                        </TooltipContent>
                    </Tooltip>

                    {/* Menu Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t("openMenu") || "Open menu"}
                            >
                                <Menu />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onOpenTutorial}>
                                <LifeBuoy className="mr-2 h-4 w-4" />
                                <span>{t("tutorialTitle")}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onOpenSettings}>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>{t("gameSettings")}</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onReturnToMenu}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>{t("returnToMenu")}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Narrative Log Container */}
            <main
                ref={narrativeContainerRef}
                className="flex-grow p-4 md:p-6 overflow-y-auto max-h-[50dvh] md:max-h-full hide-scrollbar"
            >
                <div className="prose prose-stone dark:prose-invert max-w-4xl mx-auto">
                    {(() => {
                        // Defensive render-time deduplication: if duplicates exist in state,
                        // keep the last occurrence (most recent) and log the condition for debugging
                        const map = new Map(narrativeLog.map((e: NarrativeEntry) => [e.id, e]));
                        const deduped = Array.from(map.values());
                        if (deduped.length !== narrativeLog.length) {
                            console.warn(
                                "[GameNarrativePanel] narrativeLog contained duplicate ids; rendering deduped list."
                            );
                        }

                        return deduped.map((entry: NarrativeEntry) => (
                            <p
                                key={entry.id}
                                id={entry.id}
                                className={cn(
                                    "animate-in fade-in duration-500 whitespace-pre-line text-base md:text-lg",
                                    String(entry.type) === "action" || String(entry.type) === "monologue"
                                        ? "italic text-muted-foreground"
                                        : "",
                                    entry.type === "system" ? "font-semibold text-accent" : ""
                                )}
                            >
                                {getTranslatedText(entry.text, language, t)}
                            </p>
                        ));
                    })()}

                    {/* Loading indicator */}
                    {isLoading && (
                        <div className="flex items-center gap-2 text-muted-foreground italic mt-4 py-2 px-3 rounded bg-muted/30 animate-pulse">
                            <Cpu className="h-4 w-4 animate-spin" />
                            <p className="text-sm">{t("aiThinking") || "AI is thinking..."}</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default GameNarrativePanel;
