"use client";

import { cn } from "@/lib/utils";
import { PlayerIcon, EnemyIcon } from "./icons";

export type MapCell = {
  biome: "forest" | "grassland" | "desert";
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
};

export function Minimap({ grid }: MinimapProps) {
  return (
    <div className="flex flex-col items-center gap-4">
        <h3 className="text-lg font-headline font-semibold text-center text-foreground/80">Minimap</h3>
        <div className="grid grid-cols-5 gap-1 p-2 bg-black/20 rounded-md shadow-inner">
        {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
            <div
                key={`${rowIndex}-${colIndex}`}
                className={cn(
                "w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-sm relative transition-all duration-300",
                biomeColors[cell.biome],
                cell.hasPlayer && "ring-2 ring-white shadow-lg"
                )}
                aria-label={`Map cell at ${rowIndex}, ${colIndex}. Biome: ${cell.biome}${cell.hasPlayer ? '. Player is here.' : ''}${cell.hasEnemy ? '. Enemy is here.' : ''}`}
            >
                {cell.hasPlayer && <PlayerIcon />}
                {cell.hasEnemy && <EnemyIcon />}
            </div>
            ))
        )}
        </div>
    </div>
  );
}
