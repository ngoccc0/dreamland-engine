"use client";

import { cn } from "@/lib/utils";
import { PlayerIcon, EnemyIcon, NpcIcon, ItemIcon } from "./icons";
import { useLanguage } from "@/context/language-context";
import type React from "react";
import type { MapCell } from "@/lib/game/types";


interface MinimapProps {
  grid: MapCell[][];
  onTitleClick?: () => void;
}

const biomeColors = {
  forest: "bg-map-forest",
  grassland: "bg-map-grassland",
  desert: "bg-map-desert",
  swamp: "bg-map-swamp",
  mountain: "bg-map-mountain",
  cave: "bg-map-cave",
  empty: "bg-map-empty",
};

// Map biome types to their respective emojis
const biomeIcons: Record<"forest" | "grassland" | "desert" | "swamp" | "mountain" | "cave", React.ReactNode> = {
    forest: <span className="text-3xl opacity-80" role="img" aria-label="forest">🌳</span>,
    grassland: <span className="text-3xl opacity-80" role="img" aria-label="grassland">🌾</span>,
    desert: <span className="text-3xl opacity-80" role="img" aria-label="desert">🏜️</span>,
    swamp: <span className="text-3xl opacity-80" role="img" aria-label="swamp">🌿</span>,
    mountain: <span className="text-3xl opacity-80" role="img" aria-label="mountain">⛰️</span>,
    cave: <span className="text-3xl opacity-80" role="img" aria-label="cave">🪨</span>,
};


export function Minimap({ grid, onTitleClick }: MinimapProps) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center gap-4">
        <h3 
            className="text-lg font-headline font-semibold text-center text-foreground/80 cursor-pointer hover:text-accent transition-colors"
            onClick={onTitleClick}
        >
            {t('minimap')}
        </h3>
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
                aria-label={`Map cell at ${rowIndex}, ${colIndex}. Biome: ${cell.biome}${cell.hasPlayer ? '. Player is here.' : ''}${cell.hasEnemy ? '. Enemy is here.' : ''}${cell.hasNpc ? '. NPC is here.' : ''}${cell.hasItem ? '. Item is here.' : ''}`}
            >
                {/* Render the biome icon if the cell is not empty */}
                {cell.biome !== 'empty' && biomeIcons[cell.biome]}
                
                {/* Player and Enemy icons will be rendered on top of biome */}
                {cell.hasEnemy && <EnemyIcon />}
                {cell.hasPlayer && <PlayerIcon />}
                
                {/* Corner indicators for other entities, rendered on top of everything */}
                {cell.hasNpc && <NpcIcon />}
                {cell.hasItem && <ItemIcon />}
            </div>
            ))
        )}
        </div>
    </div>
  );
}
