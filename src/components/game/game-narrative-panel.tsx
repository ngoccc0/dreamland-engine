/**
 * OVERVIEW: Narrative log panel displaying game narrative entries.
 * 
 * Extracted from GameLayout to improve readability and modularize layout.
 * Displays: Story entries, action descriptions, system messages
 * Features: Deduplication, type-based styling, auto-scroll to latest entry
 * Enhanced (Phase 1a): Typing animations, emphasis rendering, mobile optimization
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
import { Menu, LifeBuoy, Settings, LogOut, Shield, Backpack, Hammer, Home, FlaskConical, Loader2 } from "./icons";
import { useTypingAnimation } from "@/hooks/useTypingAnimation";
import { applyEmphasisRules, getEmphasisClass } from "@/lib/narrative/textEmphasisRules";
import { useMobileOptimization } from "@/hooks/useMobileOptimization";

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

    /** Callback to open status popup */
    onOpenStatus: () => void;

    /** Callback to open inventory popup */
    onOpenInventory: () => void;

    /** Callback to open crafting popup */
    onOpenCrafting: () => void;

    /** Callback to open building popup */
    onOpenBuilding: () => void;

    /** Callback to open fusion popup */
    onOpenFusion: () => void;

    /** Optional className for styling */
    className?: string;

    /** Animation mode: 'instant' | 'typing' | 'fade' (default: 'typing') */
    animationMode?: 'instant' | 'typing' | 'fade';

    /** Enable text emphasis rules (bold, italic, color highlights) */
    enableEmphasis?: boolean;

    /** Cap narrative panel at this many entries (for performance, default: 50) */
    maxEntries?: number;
}

/**
 * Helper component: Renders narrative entry with optional animation.
 * Phase 2.2-4 Integration: Uses mobile optimization, animation metadata, and emphasis rules.
 */
function NarrativeEntryRenderer({
    entry,
    language,
    t,
    animationMode,
    enableEmphasis,
}: {
    entry: NarrativeEntry;
    language: "en" | "vi";
    t: (key: TranslationKey, params?: any) => string;
    animationMode?: 'instant' | 'typing' | 'fade';
    enableEmphasis?: boolean;
}) {
    // Phase 4: Get mobile-optimized configuration
    const mobileConfig = useMobileOptimization();

    // Determine animation speed based on mobile config and animation metadata
    // Phase 3: If entry has animationMetadata, use its speedMultiplier and animationType
    const speedMultiplier = (entry as any).animationMetadata?.speedMultiplier ?? 1.0;
    const effectiveDelay = Math.round(mobileConfig.delayPerWord * speedMultiplier);

    // Choose animation type: mobile config provides base, metadata overrides
    const finalAnimationType = (entry as any).animationMetadata?.animationType ?? mobileConfig.animationType;
    const isTypingAnimation = animationMode === 'typing' && (finalAnimationType === 'typing' || finalAnimationType === 'typing-mobile');

    const text = getTranslatedText(entry.text, language, t);
    const { displayedText } = useTypingAnimation(text, {
        delayPerWord: effectiveDelay,
        enabled: isTypingAnimation,
    });

    const renderedText = isTypingAnimation ? displayedText : text;

    if (!enableEmphasis) {
        return <>{renderedText}</>;
    }

    const emphasized = applyEmphasisRules(renderedText);

    return (
        <>
            {emphasized.map((node, idx) => {
                if (node.type === 'text') {
                    return <span key={idx}>{node.content}</span>;
                }

                const styleClass = getEmphasisClass(node.style!);
                return (
                    <span key={idx} className={styleClass}>
                        {node.content}
                    </span>
                );
            })}
        </>
    );
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
 * - Phase 1a: Optional typing animation, text emphasis, entry capping
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
 * @param animationMode - Animation type for narrative entries
 * @param enableEmphasis - Enable keyword emphasis highlighting
 * @param maxEntries - Cap panel at N entries
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
    onOpenStatus,
    onOpenInventory,
    onOpenCrafting,
    onOpenBuilding,
    onOpenFusion,
    className = "",
    animationMode = 'typing',
    enableEmphasis = true,
    maxEntries = 50,
}: GameNarrativePanelProps) {
    const narrativeContainerRef = useRef<HTMLElement>(null);
    const mobileConfig = useMobileOptimization();

    // Auto-scroll to latest entry - scroll to absolute bottom after each new entry
    useEffect(() => {
        if (narrativeContainerRef.current) {
            // Use multiple timing attempts to ensure scroll reaches actual bottom
            // even if content is still being laid out
            const scrollToBottom = () => {
                const container = narrativeContainerRef.current;
                if (container) {
                    // Scroll to the absolute bottom of the scrollable area
                    container.scrollTop = container.scrollHeight - container.clientHeight;
                }
            };

            // Try multiple times with different delays to catch all layout updates
            requestAnimationFrame(() => scrollToBottom());
            setTimeout(() => scrollToBottom(), 0);
            setTimeout(() => scrollToBottom(), 10);
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

                    {/* Desktop-only: muted, icon-only quick actions next to world title */}
                    <div className="hidden md:flex items-center gap-2 ml-3">
                        {/* Status Button */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={onOpenStatus} className="text-amber-400" aria-label={t('statusShort') || 'Status'}>
                                    <Shield className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('statusShort') || 'Status'}</p></TooltipContent>
                        </Tooltip>

                        {/* Inventory Button */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={onOpenInventory} className="text-sky-400" aria-label={t('inventoryShort') || 'Inventory'}>
                                    <Backpack className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('inventoryShort') || 'Inventory'}</p></TooltipContent>
                        </Tooltip>

                        {/* Crafting Button */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={onOpenCrafting} className="text-purple-400" aria-label={t('craftingShort') || 'Craft'}>
                                    <Hammer className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('craftingShort') || 'Craft'}</p></TooltipContent>
                        </Tooltip>

                        {/* Building Button */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={onOpenBuilding} className="text-green-400" aria-label={t('buildingShort') || 'Build'}>
                                    <Home className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('buildingShort') || 'Build'}</p></TooltipContent>
                        </Tooltip>

                        {/* Fusion Button */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={onOpenFusion} className="text-pink-400" aria-label={t('fusionShort') || 'Fuse'}>
                                    <FlaskConical className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('fusionShort') || 'Fuse'}</p></TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* Header Controls: Menu */}
                <div className="flex items-center gap-2">

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
                className={cn(
                    "flex-grow p-3 md:p-6 overflow-y-auto hide-scrollbar text-sm md:text-base",
                    mobileConfig.fontSize,
                    mobileConfig.padding,
                    mobileConfig.maxHeight
                )}
            >
                <div className="prose prose-stone dark:prose-invert max-w-4xl mx-auto leading-relaxed">
                    {(() => {
                        // Defensive render-time deduplication
                        const map = new Map(narrativeLog.map((e: NarrativeEntry) => [e.id, e]));
                        let deduped = Array.from(map.values());

                        if (deduped.length !== narrativeLog.length) {
                            console.warn(
                                "[GameNarrativePanel] narrativeLog contained duplicate ids; rendering deduped list."
                            );
                        }

                        // Cap entries to prevent performance issues
                        if (deduped.length > maxEntries) {
                            deduped = deduped.slice(-maxEntries);
                        }

                        return deduped.map((entry: NarrativeEntry) => (
                            <p
                                key={entry.id}
                                id={entry.id}
                                className={cn(
                                    "whitespace-pre-line",
                                    entry.isNew ? "animate-in fade-in duration-500" : "",
                                    String(entry.type) === "action" || String(entry.type) === "monologue"
                                        ? "italic text-muted-foreground"
                                        : "",
                                    entry.type === "system" ? "font-semibold text-accent" : "",
                                    animationMode === 'fade' ? 'animate-fade-in' : '',
                                    "mb-3" // Add spacing between entries
                                )}
                            >
                                <NarrativeEntryRenderer
                                    entry={entry}
                                    language={language}
                                    t={t}
                                    animationMode={animationMode}
                                    enableEmphasis={enableEmphasis}
                                />
                            </p>
                        ));
                    })()}

                    {/* Loading indicator */}
                    {isLoading && (
                        <div className="flex items-center gap-2 text-muted-foreground italic mt-4 py-2 px-3 rounded bg-muted/30 animate-pulse text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <p>{t("aiThinking") || "AI is thinking..."}</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default GameNarrativePanel;
