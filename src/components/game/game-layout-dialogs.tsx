"use client";

import React, { Suspense, lazy } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { StatusPopup } from "@/components/game/status-popup";
import { IconRenderer } from "@/components/ui/icon-renderer";
import {
    Backpack,
    Shield,
    Hammer,
    Home,
    FlaskConical,
    CookingPot,
    Settings,
    LifeBuoy,
    MapPin,
} from "@/components/game/icons";
import { getTranslatedText } from "@/lib/utils";
import { resolveItemDef } from "@/lib/utils/item-utils";
import type { Action } from "@/lib/game/types";
import type { GameLayoutDialogsProps } from "./game-layout.types";

// Lazy load heavy popup components
const InventoryPopup = lazy(() =>
    import("@/components/game/inventory-popup").then((m) => ({
        default: m.InventoryPopup,
    }))
);
const FullMapPopup = lazy(() =>
    import("@/components/game/full-map-popup").then((m) => ({ default: m.FullMapPopup }))
);
const CraftingPopup = lazy(() =>
    import("@/components/game/crafting-popup").then((m) => ({ default: m.CraftingPopup }))
);
const BuildingPopup = lazy(() =>
    import("@/components/game/building-popup").then((m) => ({ default: m.BuildingPopup }))
);
const TutorialPopup = lazy(() =>
    import("@/components/game/tutorial-popup").then((m) => ({ default: m.TutorialPopup }))
);
const FusionPopup = lazy(() =>
    import("@/components/game/fusion-popup").then((m) => ({ default: m.FusionPopup }))
);
const PwaInstallPopup = lazy(() =>
    import("@/components/game/pwa-install-popup").then((m) => ({ default: m.PwaInstallPopup }))
);
const SettingsPopup = lazy(() =>
    import("@/components/game/settings-popup").then((m) => ({ default: m.SettingsPopup }))
);
const CookingWithInventoryManager = lazy(() =>
    import("@/components/game/cooking-with-inventory-manager").then((m) => ({ default: m.CookingWithInventoryManager }))
);

/**
 * Game layout dialogs and popups component.
 *
 * @remarks
 * Renders all dialog and popup UI elements:
 * - Menu dialog (status, inventory, crafting, etc.)
 * - Custom action input dialog
 * - Pickup items selection dialog
 * - Status popup
 * - Lazy-loaded heavy popups (inventory, crafting, building, etc.)
 * - Game over alert dialog
 *
 * Heavy popups are lazy-loaded with Suspense to improve initial page load performance.
 * They are only loaded when first opened.
 *
 * @param props - Configuration with dialog states and handlers
 * @returns React component rendering all game dialogs
 */
export function GameLayoutDialogs({
    // Dialog visibility state
    isStatusOpen,
    isInventoryOpen,
    isCraftingOpen,
    isBuildingOpen,
    isFusionOpen,
    isFullMapOpen,
    isTutorialOpen,
    isSettingsOpen,
    showInstallPopup,
    isAvailableActionsOpen,
    isCustomDialogOpen,
    isPickupDialogOpen,
    isCookingOpen,

    // Dialog state handlers
    onStatusOpenChange,
    onInventoryOpenChange,
    onCraftingOpenChange,
    onBuildingOpenChange,
    onFusionOpenChange,
    onFullMapOpenChange,
    onTutorialOpenChange,
    onSettingsOpenChange,
    onInstallPopupOpenChange,
    onAvailableActionsOpenChange,
    onCustomDialogOpenChange,
    onPickupDialogOpenChange,
    onCookingOpenChange,

    // Data
    playerStats,
    currentChunk,
    world,
    pickUpActions,
    otherActions: _otherActions,
    selectedPickupIds,
    customDialogValue,
    isLoading,

    // Handlers
    onToggleStatus,
    onToggleInventory,
    onToggleCrafting,
    onToggleMap,
    onActionClick: _onActionClick,
    onCustomDialogSubmit,
    onTogglePickupSelection,
    onPickupConfirm,
    onEquipItem,
    onUnequipItem,
    onDropItem,
    onItemUsed,
    onCraft,
    onBuild,
    onFuse,
    onTutorialOpenChange: _onTutorialOpenChange,
    onToggleTutorial,
    onToggleSettings,
    onToggleFusion,
    onToggleBuilding,
    onReturnToMenu: _onReturnToMenu,
    onCustomDialogValueChange,

    // Other props
    gameSlot,
    language,
    t,
    recipes,
    buildableStructures,
    customItemDefinitions,
    finalWorldSetup: _finalWorldSetup,
    biomeDefinitions: _biomeDefinitions,
}: GameLayoutDialogsProps) {
    const handleRequestQuestHint = async (_questText: string) => {
        // Stub for quest hint functionality
    };

    return (
        <>
            {/* STATUS POPUP */}
            <StatusPopup
                open={isStatusOpen}
                onOpenChange={onStatusOpenChange}
                stats={playerStats}
                onRequestHint={handleRequestQuestHint}
                onUnequipItem={onUnequipItem}
            />

            {/* MENU DIALOG */}
            <Dialog open={isAvailableActionsOpen} onOpenChange={onAvailableActionsOpenChange}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t("menu") || "Menu"}</DialogTitle>
                        <DialogDescription>
                            {t("menuDesc") || "Access game features and settings."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                        <Button
                            variant="outline"
                            className="flex flex-col items-center gap-1 h-16"
                            onClick={() => {
                                onToggleStatus();
                                onAvailableActionsOpenChange(false);
                            }}
                        >
                            <Shield className="h-6 w-6" />
                            <span className="text-xs">{t("statusShort") || "Status"}</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col items-center gap-1 h-16"
                            onClick={() => {
                                onToggleInventory();
                                onAvailableActionsOpenChange(false);
                            }}
                        >
                            <Backpack className="h-6 w-6" />
                            <span className="text-xs">{t("inventoryShort") || "Inventory"}</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col items-center gap-1 h-16"
                            onClick={() => {
                                onToggleCrafting();
                                onAvailableActionsOpenChange(false);
                            }}
                        >
                            <Hammer className="h-6 w-6" />
                            <span className="text-xs">{t("craftingShort") || "Craft"}</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col items-center gap-1 h-16"
                            onClick={() => {
                                onToggleBuilding();
                                onAvailableActionsOpenChange(false);
                            }}
                        >
                            <Home className="h-6 w-6" />
                            <span className="text-xs">{t("buildingShort") || "Build"}</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col items-center gap-1 h-16"
                            onClick={() => {
                                onToggleFusion();
                                onAvailableActionsOpenChange(false);
                            }}
                        >
                            <FlaskConical className="h-6 w-6" />
                            <span className="text-xs">{t("fusionShort") || "Fuse"}</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col items-center gap-1 h-16"
                            onClick={() => {
                                onToggleMap();
                                onAvailableActionsOpenChange(false);
                            }}
                        >
                            <MapPin className="h-6 w-6" />
                            <span className="text-xs">{t("map") || "Map"}</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col items-center gap-1 h-16"
                            onClick={() => {
                                onCookingOpenChange(true);
                                onAvailableActionsOpenChange(false);
                            }}
                        >
                            <CookingPot className="h-6 w-6" />
                            <span className="text-xs">{t("cookingShort") || "Cook"}</span>
                        </Button>
                    </div>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-1 gap-2">
                        <Button
                            variant="ghost"
                            className="justify-start"
                            onClick={() => {
                                onToggleTutorial();
                                onAvailableActionsOpenChange(false);
                            }}
                        >
                            <LifeBuoy className="mr-2 h-4 w-4" />
                            <span>{t("tutorialTitle") || "Tutorial"}</span>
                        </Button>
                        <Button
                            variant="ghost"
                            className="justify-start"
                            onClick={() => {
                                onToggleSettings();
                                onAvailableActionsOpenChange(false);
                            }}
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            <span>{t("gameSettings") || "Settings"}</span>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* CUSTOM ACTION DIALOG */}
            <Dialog open={isCustomDialogOpen} onOpenChange={onCustomDialogOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t("customAction") || "Custom Action"}</DialogTitle>
                        <DialogDescription>
                            {t("customActionDesc") || "Type a custom action and submit."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        <Input
                            placeholder={t("customActionPlaceholder") || "Describe your action..."}
                            value={customDialogValue}
                            onChange={(e) => onCustomDialogValueChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    onCustomDialogSubmit();
                                }
                            }}
                        />
                        <div className="flex justify-end mt-3">
                            <Button variant="ghost" onClick={() => onCustomDialogOpenChange(false)} className="mr-2">
                                {t("cancel") || "Cancel"}
                            </Button>
                            <Button onClick={onCustomDialogSubmit}>{t("submit") || "Submit"}</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* PICKUP DIALOG */}
            <Dialog open={isPickupDialogOpen} onOpenChange={onPickupDialogOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t("pickUpItems") || "Pick up items"}</DialogTitle>
                        <DialogDescription>
                            {t("pickUpItemsDesc") || "Select which items to pick up from this location."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 grid grid-cols-1 gap-2">
                        {pickUpActions.length ? (
                            pickUpActions.map((action: Action) => {
                                const item =
                                    (currentChunk?.items || []).find(
                                        (i: any) =>
                                            getTranslatedText(i.name, "en") === action.params?.itemName
                                    ) || currentChunk?.items?.[0];
                                const itemName = item
                                    ? getTranslatedText(item.name, language as any)
                                    : getTranslatedText({ key: action.textKey, params: action.params }, language as any);

                                return (
                                    <div key={action.id} className="flex items-center justify-between gap-2">
                                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                                            <Checkbox
                                                checked={selectedPickupIds.includes(action.id)}
                                                onCheckedChange={() => onTogglePickupSelection(action.id)}
                                            />
                                            <div className="flex flex-col text-sm flex-1">
                                                <span className="font-medium flex items-center gap-1">
                                                    <IconRenderer
                                                        icon={
                                                            resolveItemDef(
                                                                getTranslatedText(item.name, "en"),
                                                                customItemDefinitions
                                                            )?.emoji || item.emoji
                                                        }
                                                        size={typeof (resolveItemDef(
                                                            getTranslatedText(item.name, "en"),
                                                            customItemDefinitions
                                                        )?.emoji || item.emoji) === "object"
                                                            ? 40
                                                            : 25}
                                                        alt={itemName}
                                                    />
                                                    {itemName}
                                                </span>
                                                {item && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {t("quantityShort") || "Qty"}: {item.quantity}
                                                    </span>
                                                )}
                                            </div>
                                        </label>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                {t("noItemsHere") || "No items to pick up."}
                            </p>
                        )}
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                onPickupDialogOpenChange(false);
                            }}
                            className="mr-2"
                        >
                            {t("cancel") || "Cancel"}
                        </Button>
                        <Button onClick={onPickupConfirm} disabled={selectedPickupIds.length === 0}>
                            {t("pickUp") || "Pick up"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* LAZY-LOADED POPUPS */}
            {isInventoryOpen && (
                <Suspense fallback={<div />}>
                    <InventoryPopup
                        open={isInventoryOpen}
                        onOpenChange={onInventoryOpenChange}
                        items={playerStats.items}
                        itemDefinitions={customItemDefinitions}
                        enemy={currentChunk?.enemy || null}
                        onUseItem={onItemUsed}
                        onEquipItem={onEquipItem}
                        onDropItem={onDropItem}
                    />
                </Suspense>
            )}

            {isCraftingOpen && (
                <Suspense fallback={<div />}>
                    <CraftingPopup
                        open={isCraftingOpen}
                        onOpenChange={onCraftingOpenChange}
                        playerItems={playerStats.items}
                        recipes={recipes || {}}
                        onCraft={onCraft}
                        itemDefinitions={customItemDefinitions || {}}
                    />
                </Suspense>
            )}

            {isBuildingOpen && (
                <Suspense fallback={<div />}>
                    <BuildingPopup
                        open={isBuildingOpen}
                        onOpenChange={onBuildingOpenChange}
                        playerItems={playerStats.items}
                        buildableStructures={buildableStructures || {}}
                        onBuild={onBuild}
                    />
                </Suspense>
            )}

            {isFusionOpen && (
                <Suspense fallback={<div />}>
                    <FusionPopup
                        open={isFusionOpen}
                        onOpenChange={onFusionOpenChange}
                        playerItems={playerStats.items}
                        itemDefinitions={customItemDefinitions || {}}
                        onFuse={onFuse}
                        isLoading={isLoading}
                    />
                </Suspense>
            )}

            {isFullMapOpen && (
                <Suspense fallback={<div />}>
                    <FullMapPopup
                        open={isFullMapOpen}
                        onOpenChange={onFullMapOpenChange}
                        world={world}
                        playerPosition={playerStats.position}
                        turn={0}
                    />
                </Suspense>
            )}

            {isTutorialOpen && (
                <Suspense fallback={<div />}>
                    <TutorialPopup open={isTutorialOpen} onOpenChange={onTutorialOpenChange} />
                </Suspense>
            )}

            {isSettingsOpen && (
                <Suspense fallback={<div />}>
                    <SettingsPopup
                        open={isSettingsOpen}
                        onOpenChange={onSettingsOpenChange}
                        isInGame={true}
                        currentBiome={currentChunk?.terrain ?? null}
                    />
                </Suspense>
            )}

            {showInstallPopup && (
                <Suspense fallback={<div />}>
                    <PwaInstallPopup open={showInstallPopup} onOpenChange={onInstallPopupOpenChange} />
                </Suspense>
            )}

            {isCookingOpen && (
                <Suspense fallback={<div />}>
                    <CookingWithInventoryManager
                        isOpen={isCookingOpen}
                        onClose={() => onCookingOpenChange(false)}
                        gameState={_finalWorldSetup as any}
                        itemDefinitions={customItemDefinitions || {}}
                        onCookSuccess={onItemUsed}
                        onUseItem={onItemUsed}
                        onEquipItem={onEquipItem}
                        onDropItem={onDropItem}
                    />
                </Suspense>
            )}

            {/* GAME OVER ALERT */}
            <AlertDialog open={false}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("gameOverTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("gameOverDesc")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            onClick={() => {
                                localStorage.removeItem(`gameState_${gameSlot}`);
                                window.location.reload();
                            }}
                        >
                            {t("startNewAdventure")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
