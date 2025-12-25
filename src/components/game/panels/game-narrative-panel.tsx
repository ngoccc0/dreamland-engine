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
import { cn, getTranslatedText } from "@/lib/utils";
import type { NarrativeEntry } from "@/lib/game/types";
import type { TranslationKey } from "@/lib/i18n";
import { Loader2 } from "./icons";
import { useTypingAnimation } from "@/hooks/useTypingAnimation";
import { applyEmphasisRules, getEmphasisClass } from "@/lib/narrative/textEmphasisRules";
import { useMobileOptimization } from "@/hooks/useMobileOptimization";
import { NarrativeHeader } from "./narrative-header";

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

    /** Callback to open cooking popup */
    onOpenCooking: () => void;

    /** Optional className for styling */
    className?: string;

    /** Animation mode: 'instant' | 'typing' | 'fade' (default: 'typing') */
    animationMode?: 'instant' | 'typing' | 'fade';

    /** Enable text emphasis rules (bold, italic, color highlights) */
    enableEmphasis?: boolean;

    /** Cap narrative panel at this many entries (for performance, default: 50) */
    maxEntries?: number;

    // Open states for morph animation
    isStatusOpen?: boolean;
    isInventoryOpen?: boolean;
    isCraftingOpen?: boolean;
    isBuildingOpen?: boolean;
    isFusionOpen?: boolean;
    isCookingOpen?: boolean;
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
    onOpenCooking,
    className = "",
    animationMode = 'typing',
    enableEmphasis = true,

    maxEntries = 50,
    ...props
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
                    if (container.scrollHeight > container.clientHeight) {
                        container.scrollTop = container.scrollHeight - container.clientHeight;
                    }
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
            <NarrativeHeader
                worldName={worldName}
                t={t}
                onOpenStatus={onOpenStatus}
                onOpenInventory={onOpenInventory}
                onOpenCrafting={onOpenCrafting}
                onOpenBuilding={onOpenBuilding}
                onOpenFusion={onOpenFusion}
                onOpenCooking={onOpenCooking}
                onOpenTutorial={onOpenTutorial}
                onOpenSettings={onOpenSettings}
                onReturnToMenu={onReturnToMenu}
                isStatusOpen={props.isStatusOpen}
                isInventoryOpen={props.isInventoryOpen}
                isCraftingOpen={props.isCraftingOpen}
                isBuildingOpen={props.isBuildingOpen}
                isFusionOpen={props.isFusionOpen}
                isCookingOpen={props.isCookingOpen}
            />

            {/* Narrative Log Container */}
            < main
                ref={narrativeContainerRef}
                className={
                    cn(
                        "flex-grow p-3 md:p-6 overflow-y-auto hide-scrollbar text-sm md:text-base",
                        mobileConfig.fontSize,
                        mobileConfig.padding,
                        mobileConfig.maxHeight
                    )
                }
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
            </main >
        </div >
    );
}

export default GameNarrativePanel;
