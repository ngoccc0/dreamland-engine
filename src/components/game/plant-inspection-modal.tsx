"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/context/language-context";
import type { CreatureDefinition } from "@/core/types/creature";
import { getTranslatedText } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

interface PlantInspectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    plant?: CreatureDefinition;
    currentGameTime: number;
    onHarvestPart: (partName: string) => void;
}

/**
 * Format remaining ticks into human-readable time format (e.g., "2d 14h").
 * Assumes ~100 ticks per day.
 */
function formatETA(remainingTicks: number): string {
    const TICKS_PER_DAY = 100;
    const TICKS_PER_HOUR = 100 / 24; // ~4.17 ticks per hour

    if (remainingTicks <= 0) return "Ready";

    const days = Math.floor(remainingTicks / TICKS_PER_DAY);
    const remainingAfterDays = remainingTicks % TICKS_PER_DAY;
    const hours = Math.floor(remainingAfterDays / TICKS_PER_HOUR);

    if (days > 0) {
        return `${days}d ${hours}h`;
    }
    return `${hours}h`;
}

/**
 * Get color className for a part based on part type.
 */
function getPartColor(partName: string): string {
    const lowerName = partName.toLowerCase();
    if (lowerName.includes("leaf") || lowerName.includes("leaves")) return "text-green-600";
    if (lowerName.includes("flower") || lowerName.includes("bloom")) return "text-purple-600";
    if (lowerName.includes("fruit") || lowerName.includes("berry")) return "text-red-600";
    if (lowerName.includes("seed")) return "text-amber-700";
    if (lowerName.includes("root") || lowerName.includes("trunk")) return "text-amber-900";
    return "text-gray-600";
}

/**
 * Get suitability state color badge.
 */
function getSuitabilityBadge(state: string): { color: string; label: string } {
    switch (state) {
        case "SUITABLE":
            return { color: "bg-green-100 text-green-800", label: "✓ Thriving" };
        case "UNFAVORABLE":
            return { color: "bg-amber-100 text-amber-800", label: "⚠ Stressed" };
        case "UNSUITABLE":
            return { color: "bg-red-100 text-red-800", label: "✗ Wilting" };
        default:
            return { color: "bg-gray-100 text-gray-800", label: "Unknown" };
    }
}

export function PlantInspectionModal({
    open,
    onOpenChange,
    plant,
    currentGameTime,
    onHarvestPart,
}: PlantInspectionModalProps) {
    const { t } = useLanguage();

    if (!plant || !plant.plantProperties?.parts) {
        return null;
    }

    const parts = plant.plantProperties.parts as any[];
    const plantName = getTranslatedText(plant.name, "en");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="font-headline flex items-center gap-2">
                        <span className="text-3xl">{plant.emoji}</span>
                        {plantName}
                    </DialogTitle>
                    <DialogDescription>
                        Plant inspection and harvesting
                    </DialogDescription>
                </DialogHeader>
                <Separator />

                <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-6 py-4">
                        {/* Plant Status Overview */}
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm">Status</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-xs space-y-1">
                                    <p className="text-gray-600">Overall Health</p>
                                    <div className="h-2 bg-gray-200 rounded w-full" />
                                </div>
                            </div>
                        </div>

                        {/* Parts List */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm">Plant Parts</h3>
                            {parts.map((part: any) => {
                                const currentQty = part.currentQty || 0;
                                const maxQty = part.maxQty || 1;
                                const progressPercent = (currentQty / maxQty) * 100;
                                const eta = part.nextTick ? part.nextTick - currentGameTime : -1;
                                const isStructural = part.structural;
                                const isHidden = part.hidden;
                                const isHarvestable =
                                    !isStructural &&
                                    !isHidden &&
                                    currentQty > 0 &&
                                    (part.staminaCost ?? 5) > 0;

                                return (
                                    <div
                                        key={part.name}
                                        className="border border-gray-200 rounded-lg p-3 space-y-2 hover:bg-gray-50 transition"
                                    >
                                        {/* Part Name and Status */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={cn("font-medium text-sm", getPartColor(part.name))}>
                                                    {part.name}
                                                </span>
                                                {isStructural && (
                                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                        Structural
                                                    </span>
                                                )}
                                                {isHidden && (
                                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                        Hidden
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {currentQty}/{maxQty}
                                            </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="space-y-1">
                                            <Progress
                                                value={progressPercent}
                                                className="h-2"
                                                indicatorClassName={cn(
                                                    "rounded-full",
                                                    currentQty === 0
                                                        ? "bg-gray-300"
                                                        : progressPercent < 50
                                                            ? "bg-orange-500"
                                                            : "bg-green-600"
                                                )}
                                            />
                                        </div>

                                        {/* ETA and Cost */}
                                        <div className="flex items-center justify-between text-xs text-gray-600">
                                            <span>
                                                ETA:{" "}
                                                <span className="font-medium">
                                                    {eta > 0 ? formatETA(eta) : "Ready"}
                                                </span>
                                            </span>
                                            {isHarvestable && (
                                                <span className="text-blue-600 font-medium">
                                                    {part.staminaCost ?? 5} stamina
                                                </span>
                                            )}
                                        </div>

                                        {/* Harvest Button */}
                                        {isHarvestable && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full text-xs h-7"
                                                onClick={() => onHarvestPart(part.name)}
                                            >
                                                Harvest {part.name}
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Environmental Notes */}
                        <div className="space-y-2 text-xs text-gray-600">
                            <p className="text-gray-500">
                                Growth is affected by moisture, light, temperature, and season.
                            </p>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
