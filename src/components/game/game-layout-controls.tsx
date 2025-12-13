"use client";

import React, { useState, useCallback } from "react";
import { Joystick } from "@/components/game/joystick";
import BottomActionBar from "@/components/game/bottom-action-bar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { WandSparkles, Menu } from "@/components/game/icons";
import { cn, getTranslatedText } from "@/lib/utils";
import type { GameLayoutControlsProps } from "./game-layout.types";

/**
 * Controls component - handles mobile joystick + skills or desktop action bar.
 *
 * @remarks
 * On mobile, renders:
 * - Skills bar (horizontal scroll)
 * - Context-sensitive main action button
 * - Menu button (opens dialog)
 *
 * On desktop, delegates to BottomActionBar component.
 *
 * This component also handles Joystick integration with onMove and onInteract callbacks.
 *
 * @param props - Configuration with action handlers and UI state
 * @returns React component rendering appropriate controls for device
 */
export function GameLayoutControls({
    isDesktop,
    isLoading,
    playerStats,
    contextAction,
    pickUpActions,
    otherActions,
    language,
    t,
    onMove,
    onInteract,
    onUseSkill,
    onActionClick,
    onOpenPickup,
    onOpenAvailableActions,
    onOpenCustomDialog,
    onOpenStatus,
    onOpenInventory,
    onOpenCrafting,
    onOpenBuilding,
    onOpenFusion,
}: GameLayoutControlsProps) {
    const [joystickKey, setJoystickKey] = useState(0);

    // Helper function to get icon for context action
    const getContextActionIcon = useCallback(() => {
        // Icons could be imported from lucide-react or game icons
        // For now, using emoji as fallback
        const iconMap: Record<string, string> = {
            attack: "⚔️",
            pickup: "🎒",
            rest: "🛌",
            interact: "💬",
            explore: "🔍",
        };
        return iconMap[contextAction.type] || "🎯";
    }, [contextAction.type]);

    return (
        <>
            {/* MOBILE CONTROLS: Joystick + Skills Bar + Menu */}
            {!isDesktop && (
                <div className="flex flex-col gap-4 w-full md:hidden">
                    {/* Skills Bar (horizontal scroll) */}
                    <div className="w-full bg-transparent p-4 flex items-center gap-3">
                        {/* Skills (left) */}
                        <div className="flex items-center gap-2 overflow-x-auto flex-1">
                            {playerStats.skills?.map((skill: any) => {
                                const skillName = getTranslatedText(skill.name, language as any);
                                return (
                                    <Tooltip key={skillName}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="secondary"
                                                className="text-xs px-2 py-1 flex-shrink-0"
                                                onClick={() => onUseSkill(skillName)}
                                                disabled={isLoading || (playerStats.mana ?? 0) < (skill.manaCost ?? 0)}
                                            >
                                                <WandSparkles className="h-4 w-4 mr-1" />
                                                <span className="hidden sm:inline">{skillName}</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{getTranslatedText(skill.description, language as any)}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </div>

                        {/* Context-Sensitive Main Action (center) */}
                        <div className="flex-1 flex justify-center">
                            <Button
                                variant={contextAction.type === "attack" ? "destructive" : "default"}
                                className="px-6 py-3 text-base font-semibold"
                                onClick={() => {
                                    contextAction.handler();
                                    // Trigger haptic feedback if available
                                    if (typeof window !== "undefined" && navigator.vibrate) {
                                        navigator.vibrate(20);
                                    }
                                }}
                                disabled={isLoading}
                            >
                                {contextAction.label}
                            </Button>
                        </div>

                        {/* Menu Button (right) */}
                        <div className="flex items-center">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={onOpenAvailableActions}
                                aria-label="Menu"
                            >
                                <Menu className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* DESKTOP CONTROLS: Bottom Action Bar */}
            {isDesktop && (
                <BottomActionBar
                    skills={playerStats.skills}
                    playerStats={playerStats}
                    language={language}
                    t={t}
                    pickUpActions={pickUpActions}
                    otherActions={otherActions}
                    isLoading={isLoading}
                    onUseSkill={onUseSkill}
                    onActionClick={onActionClick}
                    onOpenPickup={onOpenPickup}
                    onOpenAvailableActions={onOpenAvailableActions}
                    onOpenCustomDialog={onOpenCustomDialog}
                    onOpenStatus={onOpenStatus}
                    onOpenInventory={onOpenInventory}
                    onOpenCrafting={onOpenCrafting}
                    onOpenBuilding={onOpenBuilding}
                    onOpenFusion={onOpenFusion}
                />
            )}
        </>
    );
}

/**
 * Floating Joystick component for mobile.
 *
 * @remarks
 * Renders a floating, fixed-position joystick that sits above all other content
 * on mobile devices. Shows context-sensitive action icon when not dragging.
 *
 * @param props - Joystick props (onMove, onInteract, interactIcon, size)
 * @returns React component rendering floating joystick
 */
export function FloatingJoystick({
    onMove,
    onInteract,
    interactIcon,
    size = 140,
}: {
    onMove: (direction: "north" | "south" | "east" | "west" | null) => void;
    onInteract: () => void;
    interactIcon?: React.ReactNode;
    size?: number;
}) {
    return (
        <div className="fixed z-50 bottom-8 right-8 flex flex-col items-end gap-3 pointer-events-auto">
            <Joystick
                size={size}
                onMove={onMove}
                onInteract={onInteract}
                interactIcon={interactIcon}
                className="text-foreground"
            />
        </div>
    );
}
