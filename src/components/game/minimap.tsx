
"use client";

import { cn } from "@/lib/utils";
import { PlayerIcon, EnemyIcon, NpcIcon, ItemIcon, StructureIcon } from "./icons";
import { useLanguage } from "@/context/language-context";
import type React from "react";
import type { MapCell, Terrain } from "@/lib/game/types";


interface MinimapProps {
  grid: MapCell[][];
  playerPosition: { x: number; y: number };
}

const biomeColors: Record<Terrain | 'empty', string> = {
  forest: "bg-map-forest",
  grassland: "bg-map-grassland",
  desert: "bg-map-desert",
  swamp: "bg-map-swamp",
  mountain: "bg-map-mountain",
  cave: "bg-map-cave",
  jungle: "bg-map-jungle",
  volcanic: "bg-map-volcanic",
  wall: "bg-map-wall",
  empty: "bg-map-empty",
};

// Map biome types to their respective emojis
const biomeIcons: Record<Exclude<Terrain, 'empty'>, React.ReactNode> = {
    forest: <span className="text-3xl opacity-80" role="img" aria-label="forest">🌳</span>,
    grassland: <span className="text-3xl opacity-80" role="img" aria-label="grassland">🌾</span>,
    desert: <span className="text-3xl opacity-80" role="img" aria-label="desert">🏜️</span>,
    swamp: <span className="text-3xl opacity-80" role="img" aria-label="swamp">🌿</span>,
    mountain: <span className="text-3xl opacity-80" role="img" aria-label="mountain">⛰️</span>,
    cave: <span className="text-3xl opacity-80" role="img" aria-label="cave">🪨</span>,
    jungle: <span className="text-3xl opacity-80" role="img" aria-label="jungle">🦜</span>,
    volcanic: <span className="text-3xl opacity-80" role="img" aria-label="volcanic">🌋</span>,
    wall: <span className="text-3xl opacity-80" role="img" aria-label="wall">🧱</span>,
};


export function Minimap({ grid, playerPosition }: MinimapProps) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center gap-2">
        <div className="grid grid-cols-5 border-l border-t border-dashed border-border/50 bg-black/20 rounded-md shadow-inner overflow-hidden">
        {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
            <div
                key={`${rowIndex}-${colIndex}`}
                className={cn(
                "w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 relative transition-all duration-300 flex items-center justify-center border-r border-b border-dashed border-border/50",
                biomeColors[cell.biome],
                cell.hasPlayer && "ring-2 ring-white shadow-lg z-10"
                )}
                aria-label={`Map cell at ${rowIndex}, ${colIndex}. Biome: ${cell.biome}${cell.hasPlayer ? '. Player is here.' : ''}${cell.enemyEmoji ? '. Enemy is here.' : ''}${cell.hasNpc ? '. NPC is here.' : ''}${cell.itemEmoji ? '. Item is here.' : ''}${cell.structureEmoji ? '. Structure is here.' : ''}`}
            >
                {/* Render the biome icon if the cell is not empty */}
                {cell.biome !== 'empty' && biomeIcons[cell.biome as Exclude<Terrain, 'empty'>]}
                
                {/* Player and Enemy icons will be rendered on top of biome */}
                {cell.enemyEmoji && <EnemyIcon emoji={cell.enemyEmoji} />}
                {cell.hasPlayer && <PlayerIcon key={`${playerPosition.x},${playerPosition.y}`} />}
                
                {/* Corner indicators for other entities, rendered on top of everything */}
                {cell.hasNpc && <NpcIcon />}
                {cell.itemEmoji && <ItemIcon emoji={cell.itemEmoji} />}
                {cell.structureEmoji && <StructureIcon emoji={cell.structureEmoji} />}
            </div>
            ))
        )}
        </div>
    </div>
  );
}
