"use client";

import { cn } from "@/lib/utils";
import { PlayerIcon, EnemyIcon } from "./icons";
import { useLanguage } from "@/context/language-context";
import { Trees, Wheat, Sun } from 'lucide-react';
import type React from "react";

export type MapCell = {
  biome: "forest" | "grassland" | "desert" | "empty";
  hasPlayer?: boolean;
  hasEnemy?: boolean;
};

interface MinimapProps {
  grid: MapCell[][];
}

const biomeColors = {
  forest: "bg-map-forest",
  grassland: "bg-map-grassland",
  desert: "bg-map-desert",
  empty: "bg-map-empty",
};

// Map biome types to their respective icons
const biomeIcons: Record<"forest" | "grassland" | "desert", React.ReactNode> = {
    forest: <Trees className="w-8 h-8 text-white/50" />,
    grassland: <Wheat className="w-8 h-8 text-white/50" />,
    desert: <Sun className="w-8 h-8 text-white/50" />,
};


export function Minimap({ grid }: MinimapProps) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center gap-4">
        <h3 className="text-lg font-headline font-semibold text-center text-foreground/80">{t('minimap')}</h3>
        <div className="grid grid-cols-5 gap-1 p-2 bg-black/20 rounded-md shadow-inner">
        {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
            <div
                key={`${rowIndex}-${colIndex}`}
                className={cn(
                "w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-sm relative transition-all duration-300 flex items-center justify-center",
                biomeColors[cell.biome],
                cell.hasPlayer && "ring-2 ring-white shadow-lg"
                )}
                aria-label={`Map cell at ${rowIndex}, ${colIndex}. Biome: ${cell.biome}${cell.hasPlayer ? '. Player is here.' : ''}${cell.hasEnemy ? '. Enemy is here.' : ''}`}
            >
                {/* Render the biome icon if the cell is not empty */}
                {cell.biome !== 'empty' && biomeIcons[cell.biome]}
                
                {/* Player and Enemy icons will be rendered on top */}
                {cell.hasPlayer && <PlayerIcon />}
                {cell.hasEnemy && <EnemyIcon />}
            </div>
            ))
        )}
        </div>
    </div>
  );
}
