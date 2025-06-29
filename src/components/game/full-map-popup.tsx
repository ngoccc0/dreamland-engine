"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import type { World, Chunk } from "@/lib/game/types";
import { PlayerIcon, EnemyIcon, NpcIcon, ItemIcon } from "./icons";

interface FullMapPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  world: World;
  playerPosition: { x: number; y: number };
}

// Re-using styles and icons from minimap for consistency
const biomeColors = {
  forest: "bg-map-forest",
  grassland: "bg-map-grassland",
  desert: "bg-map-desert",
  swamp: "bg-map-swamp",
  mountain: "bg-map-mountain",
  cave: "bg-map-cave",
  empty: "bg-black/20", // Use a different color for unexplored but within bounds
};

const biomeIcons: Record<"forest" | "grassland" | "desert" | "swamp" | "mountain" | "cave", React.ReactNode> = {
    forest: <span className="text-xl opacity-80" role="img" aria-label="forest">🌳</span>,
    grassland: <span className="text-xl opacity-80" role="img" aria-label="grassland">🌾</span>,
    desert: <span className="text-xl opacity-80" role="img" aria-label="desert">🏜️</span>,
    swamp: <span className="text-xl opacity-80" role="img" aria-label="swamp">🌿</span>,
    mountain: <span className="text-xl opacity-80" role="img" aria-label="mountain">⛰️</span>,
    cave: <span className="text-xl opacity-80" role="img" aria-label="cave">🪨</span>,
};

const MapCellDetails = ({ chunk }: { chunk: Chunk }) => {
    return (
        <div className="p-2 text-sm space-y-2">
            <h4 className="font-bold capitalize">{chunk.terrain} ({chunk.x}, {chunk.y})</h4>
            <p className="text-xs text-muted-foreground italic line-clamp-3">{chunk.description}</p>
            {chunk.items.length > 0 && (
                <div>
                    <h5 className="font-semibold">Items:</h5>
                    <ul className="list-disc list-inside text-xs">
                        {chunk.items.map(item => <li key={item.name}>{item.name} (x{item.quantity})</li>)}
                    </ul>
                </div>
            )}
            {chunk.enemy && (
                <div>
                    <h5 className="font-semibold">Enemy:</h5>
                    <p className="text-xs">{chunk.enemy.type} (HP: {chunk.enemy.hp})</p>
                </div>
            )}
            {chunk.NPCs.length > 0 && (
                 <div>
                    <h5 className="font-semibold">NPCs:</h5>
                    <ul className="list-disc list-inside text-xs">
                        {chunk.NPCs.map(npc => <li key={npc}>{npc}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
};


export function FullMapPopup({ open, onOpenChange, world, playerPosition }: FullMapPopupProps) {
  const { t } = useLanguage();

  const mapBounds = React.useMemo(() => {
    const keys = Object.keys(world);
    if (keys.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 1, height: 1 };
    }

    const coords = keys.map(k => k.split(',').map(Number));
    const allX = coords.map(([x]) => x);
    const allY = coords.map(([, y]) => y);
    
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);

    return { 
        minX, maxX, minY, maxY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
    };
  }, [world]);

  const gridRef = React.useRef<HTMLDivElement>(null);
  
  // Scroll to player position when map opens
  React.useEffect(() => {
      if(open && gridRef.current) {
          const playerCell = gridRef.current.querySelector('[data-is-player="true"]');
          if(playerCell) {
              playerCell.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
          }
      }
  }, [open]);

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
                ref={gridRef}
                className="p-4 grid"
                style={{
                    gridTemplateColumns: `repeat(${mapBounds.width}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${mapBounds.height}, minmax(0, 1fr))`,
                    gap: '4px',
                }}
            >
                {Array.from({ length: mapBounds.height }).map((_, yIndex) => 
                    Array.from({ length: mapBounds.width }).map((_, xIndex) => {
                        const worldX = mapBounds.minX + xIndex;
                        const worldY = mapBounds.maxY - yIndex;
                        const chunkKey = `${worldX},${worldY}`;
                        const chunk = world[chunkKey];

                        if (!chunk || !chunk.explored) {
                            return <div key={chunkKey} className="w-12 h-12 bg-map-empty rounded-sm" />;
                        }

                        const isPlayerHere = playerPosition.x === worldX && playerPosition.y === worldY;

                        return (
                            <Popover key={chunkKey}>
                                <PopoverTrigger asChild>
                                    <div
                                        data-is-player={isPlayerHere}
                                        className={cn(
                                            "w-12 h-12 rounded-sm relative transition-all duration-300 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-white",
                                            biomeColors[chunk.terrain as keyof typeof biomeColors],
                                            isPlayerHere && "ring-2 ring-white shadow-lg"
                                        )}
                                        aria-label={`Map cell at ${chunk.x}, ${chunk.y}. Biome: ${chunk.terrain}`}
                                    >
                                        {biomeIcons[chunk.terrain as keyof typeof biomeIcons]}
                                        {chunk.enemy && <EnemyIcon />}
                                        {isPlayerHere && <PlayerIcon />}
                                        {chunk.NPCs.length > 0 && <NpcIcon />}
                                        {chunk.items.length > 0 && <ItemIcon />}
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
