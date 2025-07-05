
"use client";

import { cn } from "@/lib/utils";
import { PlayerIcon, EnemyIcon, NpcIcon, ItemIcon, StructureIcon } from "./icons";
import { useLanguage } from "@/context/language-context";
import type React from "react";
import type { Chunk, Terrain } from "@/lib/game/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { TranslationKey } from "@/lib/i18n";


export const MapCellDetails = ({ chunk }: { chunk: Chunk }) => {
    const { t } = useLanguage();
    return (
        <div className="p-2 text-sm space-y-2">
            <h4 className="font-bold capitalize">{chunk.terrain === 'wall' ? t('wall') : t(chunk.terrain as TranslationKey)} ({chunk.x}, {chunk.y})</h4>
            <p className="text-xs text-muted-foreground italic line-clamp-3">{chunk.description}</p>
            {chunk.structures && chunk.structures.length > 0 && (
                <div>
                    <h5 className="font-semibold">{t('structures')}:</h5>
                    <ul className="list-disc list-inside text-xs">
                        {chunk.structures.map(s => <li key={s.name}>{s.emoji} {t(s.name as TranslationKey)}</li>)}
                    </ul>
                </div>
            )}
            {chunk.items.length > 0 && (
                <div>
                    <h5 className="font-semibold">{t('inventory')}:</h5>
                    <ul className="list-disc list-inside text-xs">
                        {chunk.items.map(item => <li key={item.name}>{item.emoji} {t(item.name as TranslationKey)} (x{item.quantity})</li>)}
                    </ul>
                </div>
            )}
            {chunk.enemy && (
                <div>
                    <h5 className="font-semibold">{t('enemy')}:</h5>
                    <p className="text-xs">{chunk.enemy.emoji} {t(chunk.enemy.type as TranslationKey)} (HP: {chunk.enemy.hp})</p>
                </div>
            )}
            {chunk.NPCs.length > 0 && (
                 <div>
                    <h5 className="font-semibold">{t('npcs')}:</h5>
                    <ul className="list-disc list-inside text-xs">
                        {chunk.NPCs.map(npc => <li key={npc.name}>{t(npc.name as TranslationKey)}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
};


interface MinimapProps {
  grid: (Chunk | null)[][];
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
  floptropica: "bg-map-floptropica",
  wall: "bg-map-wall",
  tundra: "bg-map-tundra",
  beach: "bg-map-beach",
  mesa: "bg-map-mesa",
  mushroom_forest: "bg-map-mushroom_forest",
  corrupted_lands: "bg-map-corrupted_lands",
  floating_islands: "bg-map-floating_islands",
  empty: "bg-map-empty",
};

const biomeIcons: Record<Exclude<Terrain, 'empty'>, React.ReactNode> = {
    forest: <span className="text-3xl opacity-80" role="img" aria-label="forest">🌳</span>,
    grassland: <span className="text-3xl opacity-80" role="img" aria-label="grassland">🌾</span>,
    desert: <span className="text-3xl opacity-80" role="img" aria-label="desert">🏜️</span>,
    swamp: <span className="text-3xl opacity-80" role="img" aria-label="swamp">🌿</span>,
    mountain: <span className="text-3xl opacity-80" role="img" aria-label="mountain">⛰️</span>,
    cave: <span className="text-3xl opacity-80" role="img" aria-label="cave">🪨</span>,
    jungle: <span className="text-3xl opacity-80" role="img" aria-label="jungle">🦜</span>,
    volcanic: <span className="text-3xl opacity-80" role="img" aria-label="volcanic">🌋</span>,
    floptropica: <span className="text-3xl opacity-80" role="img" aria-label="floptropica">💅</span>,
    wall: <span className="text-3xl opacity-80" role="img" aria-label="wall">🧱</span>,
    tundra: <span className="text-3xl opacity-80" role="img" aria-label="tundra">❄️</span>,
    beach: <span className="text-3xl opacity-80" role="img" aria-label="beach">🏖️</span>,
    mesa: <span className="text-3xl opacity-80" role="img" aria-label="mesa">🏞️</span>,
    mushroom_forest: <span className="text-3xl opacity-80" role="img" aria-label="mushroom forest">🍄</span>,
    corrupted_lands: <span className="text-3xl opacity-80" role="img" aria-label="corrupted lands">☠️</span>,
    floating_islands: <span className="text-3xl opacity-80" role="img" aria-label="floating islands">☁️</span>,
};


export function Minimap({ grid, playerPosition }: MinimapProps) {
  const { t } = useLanguage();
  const responsiveCellSize = "w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20";

  return (
    <div className="flex flex-col items-center gap-2">
        <div className="grid grid-cols-5 border-l border-t border-dashed border-border/50 bg-black/20 rounded-md shadow-inner overflow-hidden">
        {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const key = `${rowIndex}-${colIndex}`;
              
              if (!cell) {
                return <div key={key} className={cn(responsiveCellSize, "bg-map-empty border-r border-b border-dashed border-border/50")} />;
              }
              
              const isPlayerHere = playerPosition.x === cell.x && playerPosition.y === cell.y;

              return (
                 <Popover key={key}>
                    <PopoverTrigger asChild>
                        <div
                            className={cn(
                                responsiveCellSize,
                                "relative transition-all duration-300 flex items-center justify-center p-1 cursor-pointer hover:ring-2 hover:ring-white border-r border-b border-dashed border-border/50",
                                biomeColors[cell.terrain],
                                isPlayerHere && "ring-2 ring-white shadow-lg z-10"
                            )}
                            aria-label={`Map cell at ${cell.x}, ${cell.y}. Biome: ${cell.terrain}`}
                        >
                            {/* Biome Icon in the center */}
                            {cell.terrain !== 'empty' && biomeIcons[cell.terrain as Exclude<Terrain, 'empty'>]}
                            
                            {/* Player Icon in the center */}
                            {isPlayerHere && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <PlayerIcon />
                                </div>
                            )}
                            
                            {/* Structure Icon in top-left */}
                            {cell.structures?.length > 0 && (
                                <div className="absolute top-px left-px">
                                    <StructureIcon emoji={cell.structures[0].emoji} />
                                </div>
                            )}

                            {/* NPC Icon in top-right */}
                            {cell.NPCs.length > 0 && (
                                <div className="absolute top-px right-px">
                                    <NpcIcon />
                                </div>
                            )}
                            
                            {/* Enemy Icon in bottom-left */}
                            {cell.enemy && (
                                <div className="absolute bottom-px left-px">
                                    <EnemyIcon emoji={cell.enemy.emoji} />
                                </div>
                            )}

                            {/* Item Icon in bottom-right */}
                            {cell.items.length > 0 && (
                                <div className="absolute bottom-px right-px">
                                    <ItemIcon emoji={cell.items[0].emoji} />
                                </div>
                            )}
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <MapCellDetails chunk={cell} />
                    </PopoverContent>
                  </Popover>
              );
            })
        )}
        </div>
    </div>
  );
}
