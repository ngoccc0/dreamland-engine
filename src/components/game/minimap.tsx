
"use client";
// Helper: render emoji or image file
function renderItemEmoji(emoji: string | { type: 'image'; url: string }, size: number = 24) {
  if (!emoji) return null;

  // Nếu là object với type 'image'
  if (typeof emoji === 'object' && emoji.type === 'image') {
    return <img src={emoji.url.startsWith('/') ? emoji.url : `/assets/${emoji.url}`} alt="icon" style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle' }} />;
  }

  // Nếu là string
  const emojiStr = emoji as string;
  // Nếu là emoji unicode (không có dấu chấm, không phải đường dẫn)
  if (/^[^./\\]{1,3}$/.test(emojiStr)) {
    return <span>{emojiStr}</span>;
  }
  // Nếu là tên file hình ảnh (svg/png/jpg...)
  return <img src={emojiStr.startsWith('/') ? emojiStr : `/assets/${emojiStr}`} alt="icon" style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle' }} />;
}

import { cn } from "@/lib/utils";
import { PlayerIcon, EnemyIcon, NpcIcon, ItemIcon, Home, MapPin } from "./icons";
import { useLanguage } from "@/context/language-context";
import React, { useEffect } from "react";
import type { Chunk, Terrain, Structure } from "@/lib/game/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "../ui/separator";
import { SwordIcon } from "./icons";
import { Backpack } from "lucide-react";
import { getTranslatedText } from "@/lib/utils";
import { logger } from "@/lib/logger";


export const MapCellDetails = ({ chunk }: { chunk: Chunk }) => {
    const { t, language } = useLanguage();
    return (
        <div className="p-1 space-y-2">
            <div className="flex items-center gap-2">
                 <MapPin className="h-4 w-4 text-muted-foreground" />
                 <h4 className="font-bold capitalize">{chunk.terrain === 'wall' ? t('wall') : t(chunk.terrain as any)} ({chunk.x}, {chunk.y})</h4>
            </div>
            <p className="text-xs text-muted-foreground italic line-clamp-3">{chunk.description}</p>
            
            {(chunk.structures && chunk.structures.length > 0 || chunk.items.length > 0 || chunk.enemy || chunk.NPCs.length > 0) && <Separator />}

            <div className="space-y-2 mt-2">
                {chunk.structures && chunk.structures.length > 0 && (
                    <div>
                        <h5 className="font-semibold text-xs flex items-center gap-1.5 mb-1"><Home />{t('structures')}:</h5>
                        <ul className="space-y-1 text-xs pl-5">
                           {chunk.structures.map((s, idx) => {
                                const structData = (s as any).data || s;
                                // Use index as key here to avoid relying on language-specific strings for React keys
                                return <li key={idx}>{renderItemEmoji(structData.emoji, 18)} {getTranslatedText(structData.name, language, t)}</li>
                            })}
                        </ul>
                    </div>
                )}
                {chunk.items.length > 0 && (
                    <div>
                        <h5 className="font-semibold text-xs flex items-center gap-1.5 mb-1"><Backpack />{t('inventory')}:</h5>
                        <ul className="space-y-1 text-xs pl-5">
                            {chunk.items.map((item, idx) => <li key={idx}>{renderItemEmoji(item.emoji, 16)} {getTranslatedText(item.name, language, t)} (x{item.quantity})</li>)}
                        </ul>
                    </div>
                )}
                {chunk.enemy && (
                    <div>
                        <h5 className="font-semibold text-xs flex items-center gap-1.5 mb-1"><SwordIcon />{t('enemy')}:</h5>
                        <p className="text-xs pl-5">{renderItemEmoji(chunk.enemy.emoji, 16)} {chunk.enemy.type ? getTranslatedText(chunk.enemy.type, language, t) : t('no_enemy_found')} (HP: {chunk.enemy.hp})</p>
                    </div>
                )}
                {chunk.NPCs.length > 0 && (
                     <div>
                        <h5 className="font-semibold text-xs flex items-center gap-1.5 mb-1"><NpcIcon />{t('npcs')}:</h5>
                        <ul className="space-y-1 text-xs pl-5">
                            {chunk.NPCs.map((npc, idx) => <li key={idx}>{getTranslatedText(npc.name, language, t)}</li>)}
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
    // Use clamp() so cell sizes scale down on smaller viewports and the full map can fit without panning
    const responsiveCellSize = "w-[clamp(28px,6vw,48px)] h-[clamp(28px,6vw,48px)]";

  useEffect(() => {
    if (grid?.length > 0) {
    }
  }, [grid, playerPosition, turn]);


  if (!grid || grid.length === 0) {
    logger.warn("[MINIMAP] No map data provided.");
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="grid grid-cols-5 border-l border-t border-dashed border-border/50 bg-black/20 rounded-md shadow-inner overflow-visible">
          {Array.from({ length: 25 }).map((_, i) => (
             <div key={i} className={cn(responsiveCellSize, "bg-map-empty border-r border-b border-dashed border-border/50")} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
    <div className="grid grid-cols-5 border-l border-t border-dashed border-border/50 bg-black/20 rounded-md shadow-inner overflow-visible">
        {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const key = `${rowIndex}-${colIndex}`;
              
              if (!cell) {
                return <div key={key} className={cn(responsiveCellSize, "bg-map-empty border-r border-b border-dashed border-border/50")} />;
              }
              
              const isPlayerHere = playerPosition.x === cell.x && playerPosition.y === cell.y;
              const turnDifference = turn - cell.lastVisited;
              // Calculate if the tile is within the 3x3 visibility radius
              const distanceFromPlayer = Math.max(
                Math.abs(cell.x - playerPosition.x),
                Math.abs(cell.y - playerPosition.y)
              );
              const isInVisibleRange = distanceFromPlayer <= 1; // 1 tile radius for 3x3 area

              // Shorter fog of war timing (25 turns)
              const isFoggy = turnDifference > 25 && cell.lastVisited !== 0;

              // Unexplored tiles should still be rendered but with a fog effect
              if (!cell.explored) {
                return (
                    <Popover key={key}>
                        <PopoverTrigger asChild>
                            <div className={cn(
                                responsiveCellSize, 
                                "bg-map-empty/50 border-r border-b border-dashed border-border/50 flex items-center justify-center"
                            )}>
                                <span className="text-2xl opacity-20" title={t('unexploredArea') as string}>🌫️</span>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="p-2 text-sm text-muted-foreground">
                                {t('unexploredAreaDesc')}
                            </div>
                        </PopoverContent>
                    </Popover>
                );
              }
              
              // Tiles in fog of war show more detailed tooltips
              if (isFoggy && !isInVisibleRange) {
                 const tooltipMessages = [
                    { vi: "Đã lâu bạn không đến đây, mọi thứ dường như đã thay đổi...", en: "It's been a while since you've been here, things might have changed..." },
                    { vi: "Thời gian trôi qua khiến ký ức về nơi này trở nên mờ nhạt.", en: "Time has made your memories of this place fade." },
                    { vi: "Sương mù dày đặc khiến bạn không thể nhớ rõ nơi này có gì.", en: "The thick fog makes it hard to remember what's here." }
                 ];
                 const randomMessage = tooltipMessages[Math.floor(Math.random() * tooltipMessages.length)];

                 return (
                    <Popover key={key}>
                        <PopoverTrigger asChild>
                            <div className={cn(
                                responsiveCellSize, 
                                "bg-map-empty border-r border-b border-dashed border-border/50 flex items-center justify-center"
                            )}>
                                <span className="text-2xl opacity-30" title={t('fogOfWarDesc') as string}>🌫️</span>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="p-2 space-y-2">
                                <p className="text-sm text-muted-foreground">{language === 'vi' ? randomMessage.vi : randomMessage.en}</p>
                                {cell.terrain && (
                                    <p className="text-xs text-muted-foreground/70">
                                        {t('lastKnownTerrain')}: {t(cell.terrain as any)}
                                    </p>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                );
              }
              
              const firstStructure = cell.structures && cell.structures.length > 0 ? (cell.structures[0] as any) : null;
              const structData = firstStructure?.data || firstStructure;
              const mainIcon = structData
                ? <span className="text-3xl opacity-90 drop-shadow-lg" role="img" aria-label={getTranslatedText(structData.name, language, t)}>{renderItemEmoji(structData.emoji, 28)}</span>
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
                                    {renderItemEmoji(cell.enemy.emoji, 20)}
                                </div>
                            )}

                            {cell.items.length > 0 && (
                                <div className="absolute bottom-px right-px">
                                    {renderItemEmoji(cell.items[0].emoji, 20)}
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
