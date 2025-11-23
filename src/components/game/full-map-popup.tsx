
"use client";

import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import type { World, Terrain } from "@/lib/game/types";
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
    const { t, language } = useLanguage();
  const [zoom, setZoom] = React.useState(2);
  const mapRadius = 7;
    const gridRef = React.useRef<HTMLDivElement | null>(null);
        const isPanningRef = React.useRef(false);
        const lastPointerRef = React.useRef<{ x: number; y: number } | null>(null);
        const activePointerIdRef = React.useRef<number | null>(null);
        const initialPinchDistanceRef = React.useRef<number | null>(null);
        const pinchStartZoomRef = React.useRef<number | null>(null);

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

    const getTilePx = () => {
        try {
            const v = getComputedStyle(document.documentElement).getPropertyValue('--minimap-tile-size');
            if (v) return Number(v.trim().replace('px', '')) || 48;
        } catch {}
        return 48;
    };

    const cellSizePx = React.useMemo(() => Math.round(getTilePx() * (zoom / 2)), [zoom]);
    const iconSizePx = Math.max(12, Math.round(cellSizePx * 0.6));

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

    // Memoized MapCell component to reduce heavy re-renders when rendering the
    // full grid. The comparator checks a small set of chunk-affecting fields.
    const MapCell = React.useMemo(() => {
        const Inner = ({ chunkKey, chunk, isPlayerHere, showDetails, cellSizePx, iconSizePx, mainIcon, language, t }: any) => {
            const sizeStyle = { width: `${cellSizePx}px`, height: `${cellSizePx}px` } as React.CSSProperties;
            const iconStyle = { fontSize: `${iconSizePx}px`, lineHeight: 1 } as React.CSSProperties;

            if (!chunk) {
                return <div key={chunkKey} data-map-cell className={cn("bg-map-empty border-r border-b border-dashed border-border/50")} style={sizeStyle} />;
            }

            const turnDifference = turn - chunk.lastVisited;
            const isFoggy = turnDifference > 50 && chunk.lastVisited !== 0;

            if (!chunk.explored || (isFoggy && !isPlayerHere)) {
                return (
                    <div key={chunkKey} data-map-cell className={cn("bg-map-empty border-r border-b border-dashed border-border/50 flex items-center justify-center")} style={sizeStyle}>
                        {chunk.explored && <span style={iconStyle} className={cn("opacity-30")} title={t('fogOfWarDesc') as string}>🌫️</span>}
                    </div>
                );
            }

            return (
                <Popover key={chunkKey}>
                    <PopoverTrigger asChild>
                        <div
                            data-map-cell
                            className={cn(
                                "relative transition-all duration-300 flex items-center justify-center p-1 cursor-pointer hover:ring-2 hover:ring-white border-r border-b border-dashed border-border/50",
                                biomeColors[chunk.terrain as keyof typeof biomeColors],
                                isPlayerHere && "ring-2 ring-white shadow-lg z-10"
                            )}
                            aria-label={`Map cell at ${chunk.x}, ${chunk.y}. Biome: ${chunk.terrain}`}
                            style={sizeStyle}
                        >
                            <div style={iconStyle} className={cn('opacity-80')}>
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
        };

        return React.memo(Inner, (a: any, b: any) => {
            if (a.isPlayerHere !== b.isPlayerHere) return false;
            if (a.showDetails !== b.showDetails) return false;
            if (a.cellSizePx !== b.cellSizePx) return false;
            if (a.iconSizePx !== b.iconSizePx) return false;
            const ca = a.chunk || {};
            const cb = b.chunk || {};
            if (ca.explored !== cb.explored) return false;
            if ((ca.lastVisited || 0) !== (cb.lastVisited || 0)) return false;
            if ((ca.structures?.length || 0) !== (cb.structures?.length || 0)) return false;
            if ((ca.NPCs?.length || 0) !== (cb.NPCs?.length || 0)) return false;
            if ((ca.items?.length || 0) !== (cb.items?.length || 0)) return false;
            if ((ca.enemy?.hp || 0) !== (cb.enemy?.hp || 0)) return false;
            return true;
        });
    }, [turn, cellSizePx, iconSizePx]);

    // Find nearest scrollable ancestor (viewport for panning)
    const findScrollParent = (el: HTMLElement | null): HTMLElement | null => {
        let p = el?.parentElement ?? null;
        while (p && p !== document.body) {
            try {
                const style = getComputedStyle(p);
                if (/auto|scroll/.test(`${style.overflow}${style.overflowY}${style.overflowX}`)) return p;
            } catch {
                // ignore
            }
            p = p.parentElement;
        }
        return document.scrollingElement as HTMLElement | null;
    };

    // Keyboard pan & zoom when the full map is open. Arrow keys / WASD pan the viewport.
    React.useEffect(() => {
        if (!open) return;

        const handleKey = (e: KeyboardEvent) => {
            try {
                const active = document.activeElement as HTMLElement | null;
                if (active) {
                    const tag = (active.tagName || '').toUpperCase();
                    if (tag === 'INPUT' || tag === 'TEXTAREA' || active.isContentEditable) return;
                }

                const grid = gridRef.current;
                if (!grid) return;
                const viewport = findScrollParent(grid) ?? (grid.parentElement as HTMLElement | null);
                if (!viewport) return;

                // Use the CSS-driven cell size for keyboard panning
                const cellSize = cellSizePx || 48;

                let dx = 0;
                let dy = 0;

                switch (e.key) {
                    case 'ArrowLeft':
                    case 'a':
                    case 'A':
                        dx = -cellSize;
                        break;
                    case 'ArrowRight':
                    case 'd':
                    case 'D':
                        dx = cellSize;
                        break;
                    case 'ArrowUp':
                    case 'w':
                    case 'W':
                        dy = -cellSize;
                        break;
                    case 'ArrowDown':
                    case 's':
                    case 'S':
                        dy = cellSize;
                        break;
                    case '+':
                    case '=':
                        e.preventDefault();
                        setZoom(z => Math.min(MAX_ZOOM, z + 1));
                        return;
                    case '-':
                        e.preventDefault();
                        setZoom(z => Math.max(MIN_ZOOM, z - 1));
                        return;
                    default:
                        return;
                }

                if (dx !== 0 || dy !== 0) {
                    e.preventDefault();
                    viewport.scrollBy({ left: dx, top: dy, behavior: 'smooth' });
                }
            } catch {
                // ignore
            }
        };

        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full md:max-w-4xl lg:max-w-6xl !p-0">
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
                        ref={gridRef}
                        onWheel={handleWheel}
                                                className="p-4 inline-grid border-l border-t border-dashed border-border/50"
                        style={{
                            gridTemplateColumns: `repeat(${mapBounds.width}, auto)`,
                            touchAction: 'none',
                        }}
                                                onPointerDown={(e) => {
                                                    // start panning with primary pointer
                                                    try {
                                                        const el = gridRef.current;
                                                        if (!el) return;
                                                        // capture pointer on the grid element so we reliably receive move/up events
                                                        (el as Element).setPointerCapture?.(e.pointerId);
                                                        isPanningRef.current = true;
                                                        activePointerIdRef.current = e.pointerId;
                                                        lastPointerRef.current = { x: e.clientX, y: e.clientY };
                                                    } catch {}
                                                }}
                                                onPointerMove={(e) => {
                                                    try {
                                                        if (!isPanningRef.current) return;
                                                        if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;
                                                        const el = gridRef.current;
                                                        if (!el) return;
                                                        const viewport = findScrollParent(el) ?? (el.parentElement as HTMLElement | null);
                                                        if (!viewport) return;
                                                        const last = lastPointerRef.current;
                                                        if (!last) return;
                                                        const dx = e.clientX - last.x;
                                                        const dy = e.clientY - last.y;
                                                        // move viewport opposite to pointer delta so content follows pointer
                                                        viewport.scrollBy({ left: -dx, top: -dy });
                                                        lastPointerRef.current = { x: e.clientX, y: e.clientY };
                                                    } catch {}
                                                }}
                                                onPointerUp={(e) => {
                                                    try {
                                                        isPanningRef.current = false;
                                                        activePointerIdRef.current = null;
                                                        lastPointerRef.current = null;
                                                        const el = gridRef.current;
                                                        el?.releasePointerCapture?.(e.pointerId);
                                                    } catch {}
                                                }}
                                                onPointerCancel={(e) => {
                                                    try {
                                                        isPanningRef.current = false;
                                                        activePointerIdRef.current = null;
                                                        lastPointerRef.current = null;
                                                        gridRef.current?.releasePointerCapture?.(e.pointerId);
                                                    } catch {}
                                                }}
                                                onTouchStart={(e) => {
                                                    try {
                                                        if (e.touches && e.touches.length === 2) {
                                                            const dx = e.touches[0].clientX - e.touches[1].clientX;
                                                            const dy = e.touches[0].clientY - e.touches[1].clientY;
                                                            initialPinchDistanceRef.current = Math.hypot(dx, dy);
                                                            pinchStartZoomRef.current = zoom;
                                                        }
                                                    } catch {}
                                                }}
                                                onTouchMove={(e) => {
                                                    try {
                                                        if (e.touches && e.touches.length === 2 && initialPinchDistanceRef.current && pinchStartZoomRef.current != null) {
                                                            e.preventDefault();
                                                            const dx = e.touches[0].clientX - e.touches[1].clientX;
                                                            const dy = e.touches[0].clientY - e.touches[1].clientY;
                                                            const dist = Math.hypot(dx, dy);
                                                            const ratio = dist / initialPinchDistanceRef.current;
                                                            const targetZoom = Math.round(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, (pinchStartZoomRef.current * ratio))));
                                                            setZoom(targetZoom);
                                                            return;
                                                        }
                                                        // If single touch and not pinching, allow panning via pointer events
                                                    } catch {}
                                                }}
                                                onTouchEnd={(_e) => {
                                                    try {
                                                        initialPinchDistanceRef.current = null;
                                                        pinchStartZoomRef.current = null;
                                                    } catch {}
                                                }}
                    >
                        {Array.from({ length: mapBounds.height }).map((_, yIndex) => 
                            Array.from({ length: mapBounds.width }).map((_, xIndex) => {
                                const worldX = mapBounds.minX + xIndex;
                                const worldY = mapBounds.maxY - yIndex;
                                const chunkKey = `${worldX},${worldY}`;
                                const chunk = world[chunkKey];

                                if (!chunk) {
                                    return <div key={chunkKey} data-map-cell className={cn("bg-map-empty border-r border-b border-dashed border-border/50")} style={{ width: `${cellSizePx}px`, height: `${cellSizePx}px` }} />;
                                }

                                const isPlayerHere = playerPosition.x === worldX && playerPosition.y === worldY;
                                const turnDifference = turn - chunk.lastVisited;
                                const isFoggy = turnDifference > 50 && chunk.lastVisited !== 0;

                                if (!chunk.explored || (isFoggy && !isPlayerHere)) {
                                    return (
                                        <div key={chunkKey} data-map-cell className={cn("bg-map-empty border-r border-b border-dashed border-border/50 flex items-center justify-center")} style={{ width: `${cellSizePx}px`, height: `${cellSizePx}px` }}>
                                            {chunk.explored && <span style={{ fontSize: `${iconSizePx}px` }} className={cn("opacity-30")} title={t('fogOfWarDesc') as string}>🌫️</span>}
                                        </div>
                                    );
                                }
                                
                                                                const mainIcon = (chunk.structures && chunk.structures.length > 0)
                                                                        ? <span
                                                                                style={{ fontSize: `${iconSizePx}px`, lineHeight: 1 }}
                                                                                className={cn('opacity-90 drop-shadow-lg')}
                                                                                role="img"
                                                                                aria-label={getTranslatedText(chunk.structures[0].name, language, t)}
                                                                            >
                                                                                {renderItemEmoji(chunk.structures[0].emoji, iconSizePx)}
                                                                            </span>
                                                                        : (biomeIcons[chunk.terrain as keyof typeof biomeIcons] || null);

                                                                return (
                                                                    <MapCell
                                                                        key={chunkKey}
                                                                        chunkKey={chunkKey}
                                                                        chunk={chunk}
                                                                        isPlayerHere={isPlayerHere}
                                                                        showDetails={showDetails}
                                                                        cellSizePx={cellSizePx}
                                                                        iconSizePx={iconSizePx}
                                                                        mainIcon={mainIcon}
                                                                        language={language}
                                                                        t={t}
                                                                    />
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
