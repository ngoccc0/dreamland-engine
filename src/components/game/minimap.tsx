

"use client";

import { cn } from "@/lib/utils";
import { PlayerIcon, EnemyIcon, NpcIcon, ItemIcon, Home, MapPin } from "./icons";
import { useLanguage } from "@/context/language-context";
import type React from "react";
import type { Chunk, Terrain, Structure } from "@/lib/game/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "../ui/separator";
import { SwordIcon } from "./icons";
import { Backpack } from "lucide-react";
import { getTranslatedText } from "@/lib/utils";


export const MapCellDetails = ({ chunk }: { chunk: Chunk }) => {
    const { t, language } = useLanguage();
    return (
        <div className="p-1 space-y-2">
            <div className="flex items-center gap-2">
                 <MapPin className="h-4 w-4 text-muted-foreground" />
                 <h4 className="font-bold capitalize">{chunk.terrain === 'wall' ? t('wall') : t(chunk.terrain)} ({chunk.x}, {chunk.y})</h4>
            </div>
            <p className="text-xs text-muted-foreground italic line-clamp-3">{chunk.description}</p>
            
            {(chunk.structures && chunk.structures.length > 0 || chunk.items.length > 0 || chunk.enemy || chunk.NPCs.length > 0) && <Separator />}

            <div className="space-y-2 mt-2">
                {chunk.structures && chunk.structures.length > 0 && (
                    <div>
                        <h5 className="font-semibold text-xs flex items-center gap-1.5 mb-1"><Home />{t('structures')}:</h5>
                        <ul className="space-y-1 text-xs pl-5">
                            {chunk.structures.map((s: any) => {
                                const structData = s.data || s;
                                const name = getTranslatedText(structData.name, 'en');
                                return <li key={name}>{structData.emoji} {getTranslatedText(structData.name, language, t)}</li>
                            })}
                        </ul>
                    </div>
                )}
                {chunk.items.length > 0 && (
                    <div>
                        <h5 className="font-semibold text-xs flex items-center gap-1.5 mb-1"><Backpack />{t('inventory')}:</h5>
                        <ul className="space-y-1 text-xs pl-5">
                            {chunk.items.map(item => <li key={getTranslatedText(item.name, 'en')}>{item.emoji} {getTranslatedText(item.name, language, t)} (x{item.quantity})</li>)}
                        </ul>
                    </div>
                )}
                {chunk.enemy && (
                    <div>
                        <h5 className="font-semibold text-xs flex items-center gap-1.5 mb-1"><SwordIcon />{t('enemy')}:</h5>
                        <p className="text-xs pl-5">{chunk.enemy.emoji} {getTranslatedText(chunk.enemy.type, language, t)} (HP: {chunk.enemy.hp})</p>
                    </div>
                )}
                {chunk.NPCs.length > 0 && (
                     <div>
                        <h5 className="font-semibold text-xs flex items-center gap-1.5 mb-1"><NpcIcon />{t('npcs')}:</h5>
                        <ul className="space-y-1 text-xs pl-5">
                            {chunk.NPCs.map(npc => <li key={getTranslatedText(npc.name, 'en')}>{getTranslatedText(npc.name, language, t)}</li>)}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};


interface MinimapProps {
  grid: (Chunk | null)[][];
  playerPosition: { x: number; y: number };
  turn: number;
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
  ocean: "bg-map-ocean",
  city: "bg-map-city",
  space_station: "bg-map-space_station",
  underwater: "bg-map-underwater",
  empty: "bg-map-empty",
};

const biomeIcons: Record<Exclude<Terrain, 'empty' | 'wall' | 'ocean' | 'city' | 'space_station' | 'underwater'>, React.ReactNode> = {
    forest: <span className="text-3xl opacity-80" role="img" aria-label="forest">🌳</span>,
    grassland: <span className="text-3xl opacity-80" role="img" aria-label="grassland">🌾</span>,
    desert: <span className="text-3xl opacity-80" role="img" aria-label="desert">🏜️</span>,
    swamp: <span className="text-3xl opacity-80" role="img" aria-label="swamp">🌿</span>,
    mountain: <span className="text-3xl opacity-80" role="img" aria-label="mountain">⛰️</span>,
    cave: <span className="text-3xl opacity-80" role="img" aria-label="cave">🪨</span>,
    jungle: <span className="text-3xl opacity-80" role="img" aria-label="jungle">🦜</span>,
    volcanic: <span className="text-3xl opacity-80" role="img" aria-label="volcanic">🌋</span>,
    floptropica: <span className="text-3xl opacity-80" role="img" aria-label="floptropica">💅</span>,
    tundra: <span className="text-3xl opacity-80" role="img" aria-label="tundra">❄️</span>,
    beach: <span className="text-3xl opacity-80" role="img" aria-label="beach">🏖️</span>,
    mesa: <span className="text-3xl opacity-80" role="img" aria-label="mesa">🏞️</span>,
    mushroom_forest: <span className="text-3xl opacity-80" role="img" aria-label="mushroom forest">🍄</span>,
};


export function Minimap({ grid, playerPosition, turn }: MinimapProps) {
  const { t, language } = useLanguage();
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
              const turnDifference = turn - cell.lastVisited;
              const isFoggy = turnDifference > 50 && cell.lastVisited !== 0;

              if (!cell.explored || (isFoggy && !isPlayerHere)) {
                return (
                    <div key={key} className={cn(responsiveCellSize, "bg-map-empty border-r border-b border-dashed border-border/50 flex items-center justify-center")}>
                        {cell.explored && <span className="text-2xl opacity-30" title={t('fogOfWarDesc') as string}>🌫️</span>}
                    </div>
                );
              }
              
              const firstStructure = cell.structures && cell.structures.length > 0 ? (cell.structures[0] as any) : null;
              const mainIcon = firstStructure
                ? <span className="text-3xl opacity-90 drop-shadow-lg" role="img" aria-label={getTranslatedText(firstStructure.data?.name || firstStructure.name, language, t)}>{firstStructure.data?.emoji || firstStructure.emoji}</span>
                : (biomeIcons[cell.terrain as keyof typeof biomeIcons] || null);

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
                            {mainIcon}
                            
                            {isPlayerHere && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <PlayerIcon />
                                </div>
                            )}
                            
                            {cell.NPCs.length > 0 && (
                                <div className="absolute top-px right-px">
                                    <NpcIcon />
                                </div>
                            )}
                            
                            {cell.enemy && (
                                <div className="absolute bottom-px left-px">
                                    <EnemyIcon emoji={cell.enemy.emoji} />
                                </div>
                            )}

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
