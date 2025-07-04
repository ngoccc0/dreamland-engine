
"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import type { World, Chunk, Terrain } from "@/lib/game/types";
import { PlayerIcon, EnemyIcon, NpcIcon, ItemIcon, StructureIcon } from "./icons";
import { MapCellDetails } from './minimap';
import type { TranslationKey } from '@/lib/i18n';

interface FullMapPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  world: World;
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
  empty: "bg-black/20",
};

const biomeIcons: Record<Exclude<Terrain, 'empty'>, React.ReactNode> = {
    forest: <span className="text-2xl opacity-80" role="img" aria-label="forest">🌳</span>,
    grassland: <span className="text-2xl opacity-80" role="img" aria-label="grassland">🌾</span>,
    desert: <span className="text-2xl opacity-80" role="img" aria-label="desert">🏜️</span>,
    swamp: <span className="text-2xl opacity-80" role="img" aria-label="swamp">🌿</span>,
    mountain: <span className="text-2xl opacity-80" role="img" aria-label="mountain">⛰️</span>,
    cave: <span className="text-2xl opacity-80" role="img" aria-label="cave">🪨</span>,
    jungle: <span className="text-2xl opacity-80" role="img" aria-label="jungle">🦜</span>,
    volcanic: <span className="text-2xl opacity-80" role="img" aria-label="volcanic">🌋</span>,
    wall: <span className="text-2xl opacity-80" role="img" aria-label="wall">🧱</span>,
};

export function FullMapPopup({ open, onOpenChange, world, playerPosition }: FullMapPopupProps) {
  const { t } = useLanguage();
  const mapRadius = 7;

  const mapBounds = React.useMemo(() => {
    const minX = playerPosition.x - mapRadius;
    const maxX = playerPosition.x + mapRadius;
    const minY = playerPosition.y - mapRadius;
    const maxY = playerPosition.y + mapRadius;

    return { 
        minX, maxX, minY, maxY,
        width: (maxX - minX) + 1,
        height: (maxY - minY) + 1,
    };
  }, [playerPosition.x, playerPosition.y]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-[95vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">{t('minimap')}</DialogTitle>
          <DialogDescription>
            {t('fullMapDescription')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow bg-background rounded-md border">
            <div 
                className="p-4 inline-grid border-l border-t border-dashed border-border/50"
                style={{
                    gridTemplateColumns: `repeat(${mapBounds.width}, auto)`,
                }}
            >
                {Array.from({ length: mapBounds.height }).map((_, yIndex) => 
                    Array.from({ length: mapBounds.width }).map((_, xIndex) => {
                        const worldX = mapBounds.minX + xIndex;
                        const worldY = mapBounds.maxY - yIndex;
                        const chunkKey = `${worldX},${worldY}`;
                        const chunk = world[chunkKey];

                        if (!chunk || !chunk.explored) {
                            return <div key={chunkKey} className="w-12 h-12 bg-map-empty border-r border-b border-dashed border-border/50" />;
                        }

                        const isPlayerHere = playerPosition.x === worldX && playerPosition.y === worldY;

                        return (
                            <Popover key={chunkKey}>
                                <PopoverTrigger asChild>
                                    <div
                                        className={cn(
                                            "w-12 h-12 relative transition-all duration-300 flex flex-col items-center justify-between p-1 cursor-pointer hover:ring-2 hover:ring-white border-r border-b border-dashed border-border/50",
                                            biomeColors[chunk.terrain as keyof typeof biomeColors],
                                            isPlayerHere && "ring-2 ring-white shadow-lg z-10"
                                        )}
                                        aria-label={`Map cell at ${chunk.x}, ${chunk.y}. Biome: ${chunk.terrain}`}
                                    >
                                        <div className="flex-grow flex items-center justify-center">
                                          {biomeIcons[chunk.terrain as keyof typeof biomeIcons]}
                                        </div>
                                        <div className="h-5 flex items-end justify-center gap-1">
                                          {isPlayerHere && <PlayerIcon />}
                                          {chunk.enemy && <EnemyIcon emoji={chunk.enemy.emoji} />}
                                          {chunk.NPCs.length > 0 && <NpcIcon />}
                                          {chunk.items.length > 0 && <ItemIcon emoji={chunk.items[0].emoji} />}
                                          {chunk.structures?.length > 0 && <StructureIcon emoji={chunk.structures[0].emoji} />}
                                        </div>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                    <MapCellDetails chunk={chunk} />
                                </PopoverContent>
                            </Popover>
                        );
                    })
                )}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
