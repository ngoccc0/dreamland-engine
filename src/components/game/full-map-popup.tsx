
"use client";

import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import type { World, Chunk, Terrain } from "@/lib/game/types";
import { PlayerIcon, EnemyIcon, NpcIcon, ItemIcon, renderItemEmoji } from "./icons";
import { getTranslatedText } from "@/lib/utils";
import { MapCellDetails } from './minimap';
import { Button } from '../ui/button';
import { Minus, Plus } from 'lucide-react';


interface FullMapPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  world: World;
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
  empty: "bg-black/20",
};

const biomeIcons: Record<Exclude<Terrain, 'empty' | 'wall' | 'ocean' | 'city' | 'space_station' | 'underwater'>, React.ReactNode> = {
    forest: <span role="img" aria-label="forest">🌳</span>,
    grassland: <span role="img" aria-label="grassland">🌾</span>,
    desert: <span role="img" aria-label="desert">🏜️</span>,
    swamp: <span role="img" aria-label="swamp">🌿</span>,
    mountain: <span role="img" aria-label="mountain">⛰️</span>,
    cave: <span role="img" aria-label="cave">🪨</span>,
    jungle: <span role="img" aria-label="jungle">🦜</span>,
    volcanic: <span role="img" aria-label="volcanic">🌋</span>,
    floptropica: <span role="img" aria-label="floptropica">💅</span>,
    tundra: <span role="img" aria-label="tundra">❄️</span>,
    beach: <span role="img" aria-label="beach">🏖️</span>,
    mesa: <span role="img" aria-label="mesa">🏞️</span>,
    mushroom_forest: <span role="img" aria-label="mushroom forest">🍄</span>,
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

export function FullMapPopup({ open, onOpenChange, world, playerPosition, turn }: FullMapPopupProps) {
  const { t } = useLanguage();
  const [zoom, setZoom] = React.useState(2);
  const mapRadius = 7;

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(MAX_ZOOM, prev + 1));
    } else {
      setZoom((prev) => Math.max(MIN_ZOOM, prev - 1));
    }
  };

  const cellSizes = ["w-8 h-8", "w-12 h-12", "w-16 h-16", "w-20 h-20", "w-24 h-24"];
  const biomeIconSizes = ["text-base", "text-xl", "text-2xl", "text-3xl", "text-4xl"];
  const showDetails = zoom >= 3;
  const currentCellSize = cellSizes[zoom - 1];
  const currentBiomeIconSize = biomeIconSizes[zoom - 1];

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl lg:max-w-6xl !p-0">
        <div className="flex flex-col h-full">
            <SheetHeader className="p-4 border-b">
                <SheetTitle className="font-headline">{t('minimap')}</SheetTitle>
                <SheetDescription>
                    {t('fullMapDescription')}
                </SheetDescription>
            </SheetHeader>
            <div className="relative flex-grow">
                <ScrollArea className="h-full w-full bg-background">
                    <div 
                        onWheel={handleWheel}
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

                                if (!chunk) {
                                    return <div key={chunkKey} className={cn(currentCellSize, "bg-map-empty border-r border-b border-dashed border-border/50")} />;
                                }

                                const isPlayerHere = playerPosition.x === worldX && playerPosition.y === worldY;
                                const turnDifference = turn - chunk.lastVisited;
                                const isFoggy = turnDifference > 50 && chunk.lastVisited !== 0;

                                if (!chunk.explored || (isFoggy && !isPlayerHere)) {
                                    return (
                                        <div key={chunkKey} className={cn(currentCellSize, "bg-map-empty border-r border-b border-dashed border-border/50 flex items-center justify-center")}>
                                            {chunk.explored && <span className={cn(currentBiomeIconSize, "opacity-30")} title={t('fogOfWarDesc') as string}>🌫️</span>}
                                        </div>
                                    );
                                }
                                
                                const mainIcon = (chunk.structures && chunk.structures.length > 0)
                                    ? <span
                                        className={cn(currentBiomeIconSize, 'opacity-90 drop-shadow-lg')}
                                        role="img"
                                        aria-label={getTranslatedText(chunk.structures[0].name, 'en')}
                                      >
                                        {renderItemEmoji(chunk.structures[0].emoji, 28)}
                                      </span>
                                    : (biomeIcons[chunk.terrain as keyof typeof biomeIcons] || null);
                                
                                return (
                                    <Popover key={chunkKey}>
                                        <PopoverTrigger asChild>
                                            <div
                                                className={cn(
                                                    currentCellSize,
                                                    "relative transition-all duration-300 flex items-center justify-center p-1 cursor-pointer hover:ring-2 hover:ring-white border-r border-b border-dashed border-border/50",
                                                    biomeColors[chunk.terrain as keyof typeof biomeColors],
                                                    isPlayerHere && "ring-2 ring-white shadow-lg z-10"
                                                )}
                                                aria-label={`Map cell at ${chunk.x}, ${chunk.y}. Biome: ${chunk.terrain}`}
                                            >
                                                <div className={cn(currentBiomeIconSize, 'opacity-80')}>
                                                    {mainIcon}
                                                </div>
                                                
                                                {showDetails && (
                                                    <>
                                                        {isPlayerHere && (
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <PlayerIcon />
                                                            </div>
                                                        )}
                                                        {chunk.NPCs.length > 0 && (
                                                            <div className="absolute top-px right-px">
                                                                <NpcIcon />
                                                            </div>
                                                        )}
                                                        {chunk.enemy && (
                                                            <div className="absolute bottom-px left-px">
                                                                <EnemyIcon emoji={chunk.enemy.emoji} />
                                                            </div>
                                                        )}
                                                        {chunk.items.length > 0 && (
                                                            <div className="absolute bottom-px right-px">
                                                                <ItemIcon emoji={chunk.items[0].emoji} />
                                                            </div>
                                                        )}
                                                    </>
                                                )}
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
                <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                    <Button size="icon" onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + 1))}>
                        <Plus />
                    </Button>
                    <Button size="icon" onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - 1))}>
                        <Minus />
                    </Button>
                </div>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
