/**
 * OVERVIEW: Popup state management orchestrator for GameLayout.
 * 
 * Centralizes all popup dialog states (open/close booleans) and their handlers.
 * Extracted from GameLayout to improve readability and enable file size compliance.
 * 
 * Manages 8 popup dialogs:
 * - Status, Inventory, Crafting, Building, Fusion, FullMap, Tutorial, Settings
 * 
 * Each popup has:
 * - isOpen: boolean state
 * - setIsOpen: setState callback
 * - handler: toggle/open/close function
 */

"use client";

import { useCallback, useState } from "react";
import { useAudio } from "@/lib/audio/useAudio";
import { AudioActionType } from "@/core/data/audio-events";

/**
 * Hook managing all popup dialog states and handlers.
 * Returns object with popup state + callbacks.
 * 
 * Usage in GameLayout:
 * ```tsx
 * const popups = usePopupOrchestrator();
 * // Access: popups.isStatusOpen, popups.handleStatusToggle()
 * // Pass: <StatusPopup open={popups.isStatusOpen} onOpenChange={popups.setStatusOpen} />
 * ```
 */
export function usePopupOrchestrator() {
    // All popup open/close states
    const [isStatusOpen, setStatusOpen] = useState(false);
    const [isInventoryOpen, setInventoryOpen] = useState(false);
    const [isCraftingOpen, setCraftingOpen] = useState(false);
    const [isBuildingOpen, setBuildingOpen] = useState(false);
    const [isFusionOpen, setFusionOpen] = useState(false);
    const [isFullMapOpen, setIsFullMapOpen] = useState(false);
    const [isTutorialOpen, setTutorialOpen] = useState(false);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [showInstallPopup, setShowInstallPopup] = useState(false);

    // Audio for UI feedback
    const audio = useAudio();

    // Generic handler factory for toggling popups with audio
    const createToggleHandler = useCallback(
        (isOpen: boolean, setOpen: (val: (prev: boolean) => boolean) => void) => {
            return () => {
                setOpen((prev: boolean) => {
                    const newState = !prev;
                    if (newState) {
                        audio.playSfxForAction(AudioActionType.UI_CONFIRM);
                    } else {
                        audio.playSfxForAction(AudioActionType.UI_CANCEL);
                    }
                    return newState;
                });
            };
        },
        [audio]
    );

    // Popup toggle handlers
    const handleStatusToggle = useCallback(
        () => createToggleHandler(isStatusOpen, setStatusOpen)(),
        [isStatusOpen, createToggleHandler]
    );

    const handleInventoryToggle = useCallback(
        () => createToggleHandler(isInventoryOpen, setInventoryOpen)(),
        [isInventoryOpen, createToggleHandler]
    );

    const handleCraftingToggle = useCallback(
        () => createToggleHandler(isCraftingOpen, setCraftingOpen)(),
        [isCraftingOpen, createToggleHandler]
    );

    const handleMapToggle = useCallback(
        () => createToggleHandler(isFullMapOpen, setIsFullMapOpen)(),
        [isFullMapOpen, createToggleHandler]
    );

    // Generic close handler (used by Dialog's onOpenChange)
    const handleCraftingClose = useCallback((open: boolean) => {
        setCraftingOpen(open);
    }, []);

    // Return all state + handlers
    return {
        // Status popup
        isStatusOpen,
        setStatusOpen,
        handleStatusToggle,

        // Inventory popup
        isInventoryOpen,
        setInventoryOpen,
        handleInventoryToggle,

        // Crafting popup
        isCraftingOpen,
        setCraftingOpen,
        handleCraftingToggle,
        handleCraftingClose,

        // Building popup
        isBuildingOpen,
        setBuildingOpen,

        // Fusion popup
        isFusionOpen,
        setFusionOpen,

        // Full map popup
        isFullMapOpen,
        setIsFullMapOpen,
        handleMapToggle,

        // Tutorial popup
        isTutorialOpen,
        setTutorialOpen,

        // Settings popup
        isSettingsOpen,
        setSettingsOpen,

        // PWA install popup
        showInstallPopup,
        setShowInstallPopup,
    };
}

/**
 * Props type for components that need popup state.
 * Exported for use in other components.
 */
export type PopupOrchestratorState = ReturnType<typeof usePopupOrchestrator>;
