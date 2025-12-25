"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, LifeBuoy, Settings, LogOut, Shield, Backpack, Hammer, Home, FlaskConical, CookingPot } from "./icons";
import type { TranslationKey } from "@/lib/i18n";

interface NarrativeHeaderProps {
    worldName: string;
    t: (key: TranslationKey, params?: any) => string;

    // Actions
    onOpenStatus: () => void;
    onOpenInventory: () => void;
    onOpenCrafting: () => void;
    onOpenBuilding: () => void;
    onOpenFusion: () => void;
    onOpenCooking: () => void;

    onOpenTutorial: () => void;
    onOpenSettings: () => void;
    onReturnToMenu: () => void;

    // Open States (for morph visibility)
    isStatusOpen?: boolean;
    isInventoryOpen?: boolean;
    isCraftingOpen?: boolean;
    isBuildingOpen?: boolean;
    isFusionOpen?: boolean;
    isCookingOpen?: boolean;
}

export function NarrativeHeader({
    worldName,
    t,
    onOpenStatus,
    onOpenInventory,
    onOpenCrafting,
    onOpenBuilding,
    onOpenFusion,
    onOpenCooking,
    onOpenTutorial,
    onOpenSettings,
    onReturnToMenu,
    isStatusOpen,
    isInventoryOpen,
    isCraftingOpen,
    isBuildingOpen,
    isFusionOpen,
    isCookingOpen
}: NarrativeHeaderProps) {
    return (
        <header className="px-3 py-2 md:p-4 border-b flex-shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3 w-full md:max-w-3xl">
                <h1 className="text-xl md:text-2xl font-bold font-headline">{worldName}</h1>

                {/* Desktop-only: muted, icon-only quick actions next to world title */}
                <div className="hidden md:flex items-center gap-2 ml-3">
                    {/* Status Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <motion.div layoutId="popup-status" style={{ opacity: isStatusOpen ? 0 : 1 }}>
                                <Button variant="ghost" size="icon" onClick={onOpenStatus} className="text-amber-400" aria-label={t('statusShort') || 'Status'}>
                                    <Shield className="h-5 w-5" />
                                </Button>
                            </motion.div>
                        </TooltipTrigger>
                        <TooltipContent><p>{t('statusShort') || 'Status'}</p></TooltipContent>
                    </Tooltip>

                    {/* Inventory Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <motion.div layoutId="popup-inventory" style={{ opacity: isInventoryOpen ? 0 : 1 }}>
                                <Button variant="ghost" size="icon" onClick={onOpenInventory} className="text-sky-400" aria-label={t('inventoryShort') || 'Inventory'}>
                                    <Backpack className="h-5 w-5" />
                                </Button>
                            </motion.div>
                        </TooltipTrigger>
                        <TooltipContent><p>{t('inventoryShort') || 'Inventory'}</p></TooltipContent>
                    </Tooltip>

                    {/* Crafting Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <motion.div layoutId="popup-crafting" style={{ opacity: isCraftingOpen ? 0 : 1 }}>
                                <Button variant="ghost" size="icon" onClick={onOpenCrafting} className="text-purple-400" aria-label={t('craftingShort') || 'Craft'}>
                                    <Hammer className="h-5 w-5" />
                                </Button>
                            </motion.div>
                        </TooltipTrigger>
                        <TooltipContent><p>{t('craftingShort') || 'Craft'}</p></TooltipContent>
                    </Tooltip>

                    {/* Building Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <motion.div layoutId="popup-building" style={{ opacity: isBuildingOpen ? 0 : 1 }}>
                                <Button variant="ghost" size="icon" onClick={onOpenBuilding} className="text-green-400" aria-label={t('buildingShort') || 'Build'}>
                                    <Home className="h-5 w-5" />
                                </Button>
                            </motion.div>
                        </TooltipTrigger>
                        <TooltipContent><p>{t('buildingShort') || 'Build'}</p></TooltipContent>
                    </Tooltip>

                    {/* Fusion Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <motion.div layoutId="popup-fusion" style={{ opacity: isFusionOpen ? 0 : 1 }}>
                                <Button variant="ghost" size="icon" onClick={onOpenFusion} className="text-pink-400" aria-label={t('fusionShort') || 'Fuse'}>
                                    <FlaskConical className="h-5 w-5" />
                                </Button>
                            </motion.div>
                        </TooltipTrigger>
                        <TooltipContent><p>{t('fusionShort') || 'Fuse'}</p></TooltipContent>
                    </Tooltip>

                    {/* Cooking Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <motion.div layoutId="popup-cooking" style={{ opacity: isCookingOpen ? 0 : 1 }}>
                                <Button variant="ghost" size="icon" onClick={onOpenCooking} className="text-orange-400" aria-label={t('cookingShort') || 'Cook'}>
                                    <CookingPot className="h-5 w-5" />
                                </Button>
                            </motion.div>
                        </TooltipTrigger>
                        <TooltipContent><p>{t('cookingShort') || 'Cook'}</p></TooltipContent>
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
    );
}
