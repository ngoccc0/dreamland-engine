
"use client";

import { cn } from "@/lib/utils";
import { PlayerIcon, NpcIcon, Home, MapPin } from "./icons";
import { useLanguage } from "@/context/language-context";
import React, { useEffect } from "react";
import PlayerOverlay from './player-overlay';
import type { Chunk, Terrain, BiomeDefinition } from "@/lib/game/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "../ui/separator";
import { SwordIcon } from "./icons";
import { Backpack } from "lucide-react";
import { getTranslatedText } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { resolveItemDef } from '@/lib/game/item-utils';
import { IconRenderer } from "@/components/ui/icon-renderer";
import ProgressBar from '@/components/ui/ProgressBar';
import { useState, useRef } from 'react';

const DEFAULT_LIFT_MS = 150;
const DEFAULT_BOUNCE_MS = 50;


export const MapCellDetails = ({ chunk, itemDefinitions }: { chunk: Chunk; itemDefinitions?: Record<string, any> }) => {
    const { t, language } = useLanguage();
    useEffect(() => {
        try { console.info('[minimap] mounted'); } catch {}
        return () => { try { console.info('[minimap] unmounted'); } catch {} };
    }, []);
    const pickIcon = (definition: any, item: any) => {
        // Prefer image objects when available
        if (definition?.emoji && typeof definition.emoji === 'object' && definition.emoji.type === 'image') return definition.emoji;
        if (definition && (definition as any).image) return (definition as any).image;
        if (item?.emoji && typeof item.emoji === 'object' && item.emoji.type === 'image') return item.emoji;
        return definition?.emoji ?? item?.emoji ?? '❓';
    };
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
                                return <li key={idx} className="flex items-center gap-1"><IconRenderer icon={structData.emoji} size={16} /> {getTranslatedText(structData.name, language, t)}</li>
                            })}
                        </ul>
                    </div>
                )}
                {chunk.items.length > 0 && (
                    <div>
                        <h5 className="font-semibold text-xs flex items-center gap-1.5 mb-1"><Backpack />{t('inventory')}:</h5>
                        <ul className="space-y-1 text-xs pl-5">
                            {chunk.items.map((item, idx) => {
                                const definition = itemDefinitions ? resolveItemDef(getTranslatedText(item.name, 'en'), itemDefinitions) : null;
                                const emoji = pickIcon(definition, item);
                                return <li key={idx} className="flex items-center gap-1"><IconRenderer icon={emoji} size={16} /> {getTranslatedText(item.name, language, t)} (x{item.quantity})</li>;
                            })}
                        </ul>
                    </div>
                )}
                {chunk.enemy && (
                    <div>
                        <h5 className="font-semibold text-xs flex items-center gap-1.5 mb-1"><SwordIcon />{t('enemy')}:</h5>
                        <p className="text-xs pl-5 flex items-center gap-1"><IconRenderer icon={chunk.enemy.emoji} size={16} /> {chunk.enemy.type ? getTranslatedText(chunk.enemy.type, language, t) : t('no_enemy_found')} (HP: {chunk.enemy.hp})</p>
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
    // authoritative player position (game state)
    playerPosition: { x: number; y: number };
    // visual position used while animating move (optional)
    visualPlayerPosition?: { x: number; y: number } | null;
    // whether a visual move animation is active
    isAnimatingMove?: boolean;
    // visual flight endpoints for overlay animation
    visualMoveFrom?: { x: number; y: number } | null;
    visualMoveTo?: { x: number; y: number } | null;
    // toggles briefly after landing so UI can play a small bounce
    visualJustLanded?: boolean;
    turn: number;
    biomeDefinitions: Record<string, BiomeDefinition>;
}

export default function Minimap({
    grid,
    playerPosition,
    visualPlayerPosition = null,
    isAnimatingMove = false,
    visualMoveFrom = null,
    visualMoveTo = null,
    visualJustLanded = false,
    turn,
    biomeDefinitions,
}: MinimapProps) {
    const { t, language } = useLanguage();

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
    // Track transient visibility of enemy HP bars keyed by chunk coordinate
    const [hpBarVisible, setHpBarVisible] = useState<Record<string, boolean>>({});
    const hpBaseMap = useRef<Record<string, number>>({}); // stores observed max HP for percent calculations
    const prevHpMap = useRef<Record<string, number>>({}); // stores last seen hp to detect changes
    const hideTimers = useRef<Record<string, ReturnType<typeof setTimeout> | undefined>>({});
    // Use clamp() so cell sizes scale up on mobile and scale down on smaller viewports and the full map can fit without panning
    const responsiveCellSize = "w-[clamp(48px,12vw,64px)] h-[clamp(48px,12vw,64px)]";

  useEffect(() => {
    if (grid?.length > 0) {
    }
  }, [grid, playerPosition, turn]);

    // Track the most recent moveStart detail so overlay callbacks can dispatch
    // landing/finished events that include the move id and target center.
    const lastOverlayDetailRef = useRef<any>(null);
    // Pan animation vars: triggered when recenter happens after landing to make
    // the map's repositioning visually perceptible.
    const [panVars, setPanVars] = useState<{ x: string; y: string; active: boolean; duration?: number }>({ x: '0px', y: '0px', active: false, duration: 520 });
    const mapRef = useRef<HTMLDivElement | null>(null);
    const viewportRef = useRef<HTMLDivElement | null>(null);
    // current transform offset applied to maplayer (px)
    const offsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const rafRef = useRef<number | null>(null);
    const panCancelRef = useRef<(() => void) | null>(null);
    const panSnapshotRefPos = useRef<{ x: number; y: number } | null>(null);

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const getTilePx = () => {
        try {
            const v = getComputedStyle(document.documentElement).getPropertyValue('--minimap-tile-size');
            if (v) return Number(v.trim().replace('px', '')) || 48;
        } catch {}
        return 48;
    };

    const startPanRAF = (startX: number, startY: number, endX: number, endY: number, duration: number, onComplete?: () => void) => {
        // Cancel any existing RAF-driven pan
        if (rafRef.current) {
            try { cancelAnimationFrame(rafRef.current); } catch {}
            rafRef.current = null;
        }
        if (panCancelRef.current) {
            try { panCancelRef.current(); } catch {}
            panCancelRef.current = null;
        }
        const start = performance.now();
        const tick = (now: number) => {
            const elapsed = now - start;
            const t = Math.min(1, elapsed / Math.max(1, duration));
            const eased = easeOutCubic(t);
            const curX = startX + (endX - startX) * eased;
            const curY = startY + (endY - startY) * eased;
            if (mapRef.current) {
                mapRef.current.style.transform = `translate3d(${curX * scale}px, ${curY * scale}px, 0) scale(${scale})`;
            }
            if (t < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                // finish
                rafRef.current = null;
                setPanVars(p => ({ ...p, active: false }));
                try { onComplete && onComplete(); } catch {}
                // clear snapshot so the grid can re-render to the authoritative center
                panSnapshotRefPos.current = null;
                // persist final offset
                offsetRef.current = { x: endX, y: endY };
                try { setOffsetState({ x: endX, y: endY }); } catch {}
            }
        };
        // start RAF loop
        if (mapRef.current) mapRef.current.style.transform = `translate3d(${startX * scale}px, ${startY * scale}px, 0) scale(${scale})`;
        rafRef.current = requestAnimationFrame(tick);
        // allow external cancellation
        panCancelRef.current = () => {
            if (rafRef.current) { try { cancelAnimationFrame(rafRef.current); } catch {} rafRef.current = null; }
            if (mapRef.current) mapRef.current.style.transform = `translate3d(${offsetRef.current.x * scale}px, ${offsetRef.current.y * scale}px, 0) scale(${scale})`;
            try { setOffsetState(offsetRef.current); } catch {}
            setPanVars(p => ({ ...p, active: false }));
        };
    };
    const prevAnimatingRef = useRef<boolean>(Boolean(isAnimatingMove));
    const prevCenterRef = useRef<{ x: number; y: number } | null>(null);
    const panTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Prevent double-triggering pan when we initiate it at animation start
    const panInProgressRef = useRef<boolean>(false);
    // Track keys of tiles that are currently fading in from unexplored -> explored
    const [fadingExplored, setFadingExplored] = useState<Record<string, boolean>>({});
    const prevExploredRef = useRef<Record<string, boolean>>({});
    const [externalFlyDuration, setExternalFlyDuration] = useState<number | null>(null);

    // PlayerOverlay now owns the lift->fly->land->bounce timing. Minimap only
    // computes geometry and supplies overlayData; PlayerOverlay will emit
    // landing/finished events that the orchestrator listens to.

    // Listen for moveStart events so we can begin panning immediately in sync
    // with the avatar animation. moveStart.detail should contain { id, from, to, visualTotalMs }.
    useEffect(() => {
        const onMoveStart = (ev: Event) => {
            try {
                const detail = (ev as CustomEvent).detail as any;
                try { console.debug('[minimap] moveStart received', detail); } catch {}
                if (!detail) return;
                const target = detail.to as { x: number; y: number } | undefined;
                if (!target) return;
                // adopt external fly duration for overlay + pan
                if (typeof detail.visualTotalMs === 'number') setExternalFlyDuration(detail.visualTotalMs);
                // remember detail for overlay callbacks (landing/finished)
                lastOverlayDetailRef.current = detail;
                // trigger pan immediately
                const currentCenter = (() => {
                    if (isAnimatingMove) {
                        if (visualMoveTo) return visualMoveTo;
                        if (visualPlayerPosition) return visualPlayerPosition;
                    }
                    return playerPosition;
                })();
                const prev = prevCenterRef.current || currentCenter;
                const dx = target.x - prev.x;
                const dy = target.y - prev.y;
                if (dx === 0 && dy === 0) return;
                const perTilePx = getTilePx();
                const panPX = dx * perTilePx;
                const panPY = -dy * perTilePx;
                // start pan in sync with the overlay's fly phase (start after lift)
                setPanVars(p => ({ ...p, active: false }));
                const total = typeof detail.visualTotalMs === 'number' ? Number(detail.visualTotalMs) : 500;
                const lift = typeof detail.liftDuration === 'number' ? Number(detail.liftDuration) : DEFAULT_LIFT_MS;
                const bounce = typeof detail.bounceDuration === 'number' ? Number(detail.bounceDuration) : DEFAULT_BOUNCE_MS;
                const flyMs = Math.max(total - lift - bounce, 80);
                const startDelay = lift;
                if (panTimer.current) { clearTimeout(panTimer.current as any); panTimer.current = null; }
                // freeze the visible refPos so tiles don't re-render during pan
                panSnapshotRefPos.current = prevCenterRef.current || currentCenter;
                panTimer.current = setTimeout(() => {
                    panInProgressRef.current = true;
                    setPanVars({ x: `${panPX}px`, y: `${panPY}px`, active: true, duration: flyMs });
                    // Use RAF-driven pan to avoid CSS class toggle jitter
                    try {
                        const prevIdx = findIndexForWorld(prev.x, prev.y) || { r: Math.floor(rows / 2), c: Math.floor(cols / 2) };
                        const targetIdx = findIndexForWorld(target.x, target.y) || prevIdx;
                        const start = offsetRef.current || computeOffsetForIndex(prevIdx.r, prevIdx.c);
                        const end = computeOffsetForIndex(targetIdx.r, targetIdx.c);
                        startPanRAF(start.x, start.y, end.x, end.y, flyMs, () => {
                            panInProgressRef.current = false;
                            try {
                                const ev2 = new CustomEvent('minimapPanComplete', { detail: { center: target, id: detail.id } });
                                try { console.info('[minimap] dispatch minimapPanComplete', { center: target, id: detail.id }); } catch {}
                                window.dispatchEvent(ev2 as any);
                            } catch {}
                        });
                    } catch (e) {
                        // fallback to simple pan if anything fails
                        try {
                            startPanRAF(offsetRef.current.x, offsetRef.current.y, offsetRef.current.x + panPX, offsetRef.current.y + panPY, flyMs, () => {
                                panInProgressRef.current = false;
                                const ev2 = new CustomEvent('minimapPanComplete', { detail: { center: target, id: detail.id } });
                                window.dispatchEvent(ev2 as any);
                            });
                        } catch {}
                    }
                }, startDelay);
            } catch {}
        };
        window.addEventListener('moveStart', onMoveStart as EventListener);
        return () => window.removeEventListener('moveStart', onMoveStart as EventListener);
    }, [isAnimatingMove, visualMoveTo, visualPlayerPosition, playerPosition]);

    // Trigger a subtle pan animation when recentering occurs after the visual
    // animation finishes so the viewport movement is more noticeable.
    useEffect(() => {
        try {
            // Prefer the visual destination (`visualMoveTo`) when available during
            // an animation; fall back to `visualPlayerPosition` then authoritative.
            const currentCenter = (() => {
                if (isAnimatingMove) {
                    if (visualMoveTo) return visualMoveTo;
                    if (visualPlayerPosition) return visualPlayerPosition;
                }
                return playerPosition;
            })();
            if (!prevCenterRef.current) prevCenterRef.current = currentCenter;

            // No per-frame logging here; the move sequence emits a single
            // consolidated start/end record to avoid timing perturbations.

            // If we just transitioned from animating -> not animating, and the
            // visible center changed, trigger pan. Historically we waited until
            // the landing/bounce finished before panning; to make the UI feel
            // more immediate we also allow starting the pan when an animation
            // begins so minimap moves in parallel with the avatar. Use
            // panInProgressRef to avoid double-triggering.
            if ((prevAnimatingRef.current && !isAnimatingMove && !visualJustLanded) || (isAnimatingMove && visualMoveTo && !panInProgressRef.current)) {
                const prev = prevCenterRef.current || currentCenter;
                const targetCenter = isAnimatingMove && visualMoveTo ? visualMoveTo : currentCenter;
                const dx = targetCenter.x - prev.x;
                const dy = targetCenter.y - prev.y;
                    if (dx !== 0 || dy !== 0) {
                    // per-tile offset scales with the CSS-driven tile size
                    const perTilePx = getTilePx();
                    const panX = `${dx * perTilePx}px`;
                    const panY = `${-dy * perTilePx}px`;
                    // Force a restart of the animation by briefly toggling active=false
                    setPanVars(p => ({ ...p, active: false }));
                    // small timeout ensures DOM sees the class removal before re-adding
                    setTimeout(() => {
                        const total = externalFlyDuration ?? 500;
                            const lift = DEFAULT_LIFT_MS;
                            const bounce = DEFAULT_BOUNCE_MS;
                            const flyMs = Math.max(total - lift - bounce, 80);
                            const startDelay = lift;
                            if (panTimer.current) { clearTimeout(panTimer.current as any); panTimer.current = null; }
                            panTimer.current = setTimeout(() => {
                                panInProgressRef.current = true;
                                const panPX = dx * perTilePx;
                                const panPY = -dy * perTilePx;
                                setPanVars({ x: `${panPX}px`, y: `${panPY}px`, active: true, duration: flyMs });
                                try {
                                    const prevIdx = findIndexForWorld(prev.x, prev.y) || { r: Math.floor(rows / 2), c: Math.floor(cols / 2) };
                                    const targetIdx = findIndexForWorld(targetCenter.x, targetCenter.y) || prevIdx;
                                    const start = offsetRef.current || computeOffsetForIndex(prevIdx.r, prevIdx.c);
                                    const end = computeOffsetForIndex(targetIdx.r, targetIdx.c);
                                    startPanRAF(start.x, start.y, end.x, end.y, flyMs, () => {
                                        panInProgressRef.current = false;
                                        try {
                                            const ev = new CustomEvent('minimapPanComplete', { detail: { center: targetCenter } });
                                            try { console.info('[minimap] dispatch minimapPanComplete', { center: targetCenter }); } catch {}
                                            window.dispatchEvent(ev as any);
                                        } catch {}
                                    });
                                } catch (e) {
                                    try {
                                        startPanRAF(offsetRef.current.x, offsetRef.current.y, offsetRef.current.x + panPX, offsetRef.current.y + panPY, flyMs, () => {
                                            panInProgressRef.current = false;
                                            const ev = new CustomEvent('minimapPanComplete', { detail: { center: targetCenter } });
                                            window.dispatchEvent(ev as any);
                                        });
                                    } catch {}
                                }
                            }, startDelay);
                    }, 20);
                }
            }

            prevAnimatingRef.current = Boolean(isAnimatingMove);
            prevCenterRef.current = currentCenter;
        } catch {
            // ignore
        }
    }, [isAnimatingMove, visualPlayerPosition, playerPosition]);

    // Watch for newly explored tiles and trigger a fade-in when they transition
    useEffect(() => {
        try {
            const newFlags: Record<string, boolean> = {};
            for (let r = 0; r < grid.length; r++) {
                for (let c = 0; c < grid[r].length; c++) {
                    const cell = grid[r][c];
                    if (!cell) continue;
                    const key = `${cell.x},${cell.y}`;
                    const prev = prevExploredRef.current[key] || false;
                    if (!prev && cell.explored) {
                        // newly explored — always fade in (not only during move animations)
                        newFlags[key] = true;
                    }
                    prevExploredRef.current[key] = !!cell.explored;
                }
            }
            if (Object.keys(newFlags).length > 0) {
                setFadingExplored(prev => ({ ...prev, ...newFlags }));
                // clear flags after 500ms
                const id = setTimeout(() => {
                    setFadingExplored(prev => {
                        const copy = { ...prev };
                        Object.keys(newFlags).forEach(k => delete copy[k]);
                        return copy;
                    });
                }, 500);
                return () => clearTimeout(id);
            }
        } catch {
            // ignore
        }
    }, [grid, isAnimatingMove]);


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

    // compute overlay flight geometry (grid-relative percentages)
    const overlayData = (() => {
        if (!visualMoveFrom || !visualMoveTo || !isAnimatingMove) return null;
        // find source/target indices in the shown grid
        let fromRow = -1, fromCol = -1, toRow = -1, toCol = -1;
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[r].length; c++) {
                const cell = grid[r][c];
                if (!cell) continue;
                if (cell.x === visualMoveFrom.x && cell.y === visualMoveFrom.y) { fromRow = r; fromCol = c; }
                if (cell.x === visualMoveTo.x && cell.y === visualMoveTo.y) { toRow = r; toCol = c; }
            }
        }
        if (fromRow === -1 || fromCol === -1 || toRow === -1 || toCol === -1) return null;
        const size = grid.length || 5;
        const cellPct = 100 / size;
        const left = `${fromCol * cellPct}%`;
        const top = `${fromRow * cellPct}%`;
        const width = `${cellPct}%`;
        const height = `${cellPct}%`;
        const dx = (toCol - fromCol) * 100;
        const dy = (toRow - fromRow) * 100;
        const flyDurationMs = externalFlyDuration ?? 500;
        return { left, top, width, height, dx, dy, flyDurationMs };
    })();

    // compute tile/viewport measurements for viewbox layout
    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;
    const baseTilePx = (() => {
        try {
            const v = getComputedStyle(document.documentElement).getPropertyValue('--minimap-tile-size');
            if (v) return Number(v.trim().replace('px', '')) || 48;
        } catch {}
        return 48;
    })();

    // effectiveTilePx kept for backwards compatibility in places that used it;
    // we now compute a separate `scale` so the logical tile size remains `baseTilePx`
    const [effectiveTilePx, setEffectiveTilePx] = useState<number>(baseTilePx);
    const [scale, setScale] = useState<number>(1);

    // ResizeObserver to make the minimap responsive: compute tile size based on
    // the available viewport area (width/height) and number of cols/rows.
    useEffect(() => {
        const el = viewportRef.current;
        if (!el) {
            // ensure CSS var still defaults
            try { document.documentElement.style.setProperty('--minimap-tile-size', `${baseTilePx}px`); } catch {}
            return;
        }

        const computeAndApply = () => {
            try {
                // Use bounding client rect to get the true available space inside the viewport
                const rect = el.getBoundingClientRect();
                const availW = Math.max(16, rect.width || el.clientWidth || window.innerWidth);
                const availH = Math.max(16, rect.height || el.clientHeight || window.innerHeight);
                // compute scale that makes the logical map (cols*baseTilePx x rows*baseTilePx)
                // fill the available area. Allow upscaling so minimap can fill tall containers.
                const logicalW = Math.max(1, cols * baseTilePx);
                const logicalH = Math.max(1, rows * baseTilePx);
                const rect2 = el.getBoundingClientRect();
                const sW = (rect2.width || availW) / logicalW;
                const sH = (rect2.height || availH) / logicalH;
                // prefer a 'cover' style scale so the map visually fills the viewport
                // (use max instead of min). Clamp to avoid extreme zooms and tiny maps.
                const chosenScale = Math.max(0.8, Math.min(3, Math.max(sW, sH)));
                // keep logical tile px stable; scale handles visual fill
                const finalScale = chosenScale || 1;
                setScale(finalScale);
                setEffectiveTilePx(baseTilePx);
                try { el.style.setProperty('--minimap-tile-size', `${baseTilePx}px`); } catch {}
                // center map on the player after computing scale so initial render
                // positions the map correctly instead of leaving it at top-left
                try {
                    const idx = findIndexForWorld(playerPosition.x, playerPosition.y) || { r: Math.floor(rows / 2), c: Math.floor(cols / 2) };
                    const off = computeOffsetForIndex(idx.r, idx.c);
                    offsetRef.current = off;
                    setOffsetState(off);
                    // immediately apply transform so the map is centered on first render
                    if (mapRef.current) {
                        mapRef.current.style.transform = `translate3d(${off.x * finalScale}px, ${off.y * finalScale}px, 0) scale(${finalScale})`;
                    }
                } catch (e) {
                    // ignore
                }
                // re-run measurement after a short delay in case layout is still stabilizing
                setTimeout(() => {
                    try { computeAndApply(); } catch {};
                }, 80);
            } catch (e) {
                // ignore
            }
        };

        // initial compute
        computeAndApply();

        const ro = new ResizeObserver(() => computeAndApply());
        ro.observe(el);
        // also observe parent as a fallback
        if (el.parentElement) ro.observe(el.parentElement);

        return () => { try { ro.disconnect(); } catch {} };
    }, [cols, rows, baseTilePx]);

    // track offset in state so we can react to changes and reapply scaled transform
    const [offsetState, setOffsetState] = useState<{ x: number; y: number }>(offsetRef.current);

    // Re-apply the transform whenever scale or offsetState changes
    useEffect(() => {
        try {
            const off = offsetState || offsetRef.current || { x: 0, y: 0 };
            if (mapRef.current) {
                mapRef.current.style.transform = `translate3d(${off.x * scale}px, ${off.y * scale}px, 0) scale(${scale})`;
            }
        } catch {}
    }, [scale, offsetState]);

    // Ensure transform reflects current scale when scale changes (re-apply)
    useEffect(() => {
        try {
            const off = offsetRef.current || { x: 0, y: 0 };
            if (mapRef.current) {
                mapRef.current.style.transform = `translate3d(${off.x * scale}px, ${off.y * scale}px, 0) scale(${scale})`;
            }
        } catch {}
    }, [scale]);

    // helper to find indices for a world coord inside the current grid
    const findIndexForWorld = (wx: number, wy: number) => {
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < (grid[r] || []).length; c++) {
                const cell = grid[r][c];
                if (!cell) continue;
                if (cell.x === wx && cell.y === wy) return { r, c };
            }
        }
        return null;
    };

    const computeOffsetForIndex = (rIndex: number, cIndex: number) => {
        // compute offsets in logical (unscaled) pixels; use the viewport's bounding
        // rect to get accurate available visual size and derive logical center.
        const tile = baseTilePx;
        let vw = cols * tile;
        let vh = rows * tile;
        try {
            const rect = viewportRef.current?.getBoundingClientRect();
            if (rect) {
                vw = rect.width;
                vh = rect.height;
            }
        } catch {}
        // vw/vh are visual pixels; convert to logical center by dividing by scale
        const logicalCenterX = (vw / scale) / 2;
        const logicalCenterY = (vh / scale) / 2;
        const x = -(cIndex * tile) + logicalCenterX - (tile / 2);
        const y = -(rIndex * tile) + logicalCenterY - (tile / 2);
        return { x, y };
    };

    return (
        <div className="flex flex-col items-center gap-2 w-full flex-1 min-h-0">
            <div
                ref={viewportRef}
                className={cn(
                    "minimap-viewport border-l border-t border-dashed border-border/50 bg-black/20 rounded-md shadow-inner",
                    panVars.active ? 'map-pan-anim' : ''
                )}
                style={{
                    ['--map-pan-duration' as any]: `${panVars.duration ?? 520}ms`,
                    width: '100%',
                    height: '100%',
                    minHeight: `${Math.max(Math.round(rows * baseTilePx * scale), 96)}px`
                }}
                        >
                        <div
                            ref={el => { mapRef.current = el; }}
                            className="minimap-maplayer"
                            style={{ width: `${cols * baseTilePx}px`, height: `${rows * baseTilePx}px`, transform: `translate3d(${offsetRef.current.x * scale}px, ${offsetRef.current.y * scale}px, 0) scale(${scale})` }}
                        >
                    {grid.map((row, rowIndex) =>
                        row.map((cell, colIndex) => {
                            const key = `${rowIndex}-${colIndex}`;
                            const left = `${colIndex * baseTilePx}px`;
                            const top = `${rowIndex * baseTilePx}px`;

                            if (!cell) {
                                return <div key={key} className={cn('minimap-cell', "bg-map-empty border-r border-b border-dashed border-border/50")} style={{ left, top }} />;
                            }

                            const refPos = (() => {
                                if (panSnapshotRefPos.current) return panSnapshotRefPos.current;
                                if (isAnimatingMove) {
                                    if (visualMoveTo) return visualMoveTo;
                                    if (visualPlayerPosition) return visualPlayerPosition;
                                }
                                return playerPosition;
                            })();
                            const playerToShow = refPos;
                            const isPlayerHere = playerToShow.x === cell.x && playerToShow.y === cell.y;
                            const turnDifference = turn - cell.lastVisited;
                            const distanceFromPlayer = Math.max(Math.abs(cell.x - refPos.x), Math.abs(cell.y - refPos.y));
                            const isInVisibleRange = distanceFromPlayer <= 1;
                            const isFoggy = turnDifference > 25 && cell.lastVisited !== 0;

                            const firstStructure = cell.structures && cell.structures.length > 0 ? (cell.structures[0] as any) : null;
                            const structData = firstStructure?.data || firstStructure;
                            const lookupBiomeDef = (terrain: string | undefined) => {
                                if (!terrain) return undefined;
                                if (!biomeDefinitions) return undefined;
                                if (biomeDefinitions[terrain]) return biomeDefinitions[terrain];
                                const keyLower = String(terrain).toLowerCase();
                                if (biomeDefinitions[keyLower]) return biomeDefinitions[keyLower];
                                const underscored = keyLower.replace(/\s+/g, '_');
                                if (biomeDefinitions[underscored]) return biomeDefinitions[underscored];
                                return undefined;
                            };
                            const biomeDef = lookupBiomeDef(cell.terrain as string);
                            const mainIcon = structData
                                ? <IconRenderer icon={structData.emoji} size={28} className="text-3xl opacity-90 drop-shadow-lg" alt={getTranslatedText(structData.name, language, t)} />
                                : (biomeDef?.emoji ? <IconRenderer icon={biomeDef.emoji} size={28} className="text-3xl opacity-90 drop-shadow-lg" alt={getTranslatedText(cell.terrain as any, language, t)} /> : null);

                            return (
                                <Popover key={key}>
                                    <PopoverTrigger asChild>
                                        <div
                                            className={cn(
                                                'minimap-cell',
                                                "relative transition-all duration-300 flex items-center justify-center p-1 cursor-pointer hover:ring-2 hover:ring-white border-r border-b border-dashed border-border/50",
                                                biomeColors[cell.terrain],
                                                isPlayerHere && "ring-2 ring-white shadow-lg z-10"
                                            )}
                                            aria-label={`Map cell at ${cell.x}, ${cell.y}. Biome: ${cell.terrain}`}
                                            style={{ left, top }}
                                        >
                                            {mainIcon}
                                            {isPlayerHere && (() => {
                                                if (isAnimatingMove) return null;
                                                return (
                                                    <div className={cn(
                                                        "absolute inset-0 flex items-center justify-center fade-explored",
                                                        fadingExplored[`${cell.x},${cell.y}`] && 'show'
                                                    )}>
                                                        <PlayerIcon />
                                                    </div>
                                                );
                                            })()}
                                            {cell.NPCs.length > 0 && (
                                                <div className="absolute top-px right-px">
                                                    <NpcIcon />
                                                </div>
                                            )}
                                            {cell.enemy && (() => {
                                                const keyCoord = `${cell.x},${cell.y}`;
                                                try {
                                                    const curHp = Number(cell.enemy.hp ?? 0);
                                                    if (prevHpMap.current[keyCoord] === undefined) {
                                                        prevHpMap.current[keyCoord] = curHp;
                                                        if (!hpBaseMap.current[keyCoord]) hpBaseMap.current[keyCoord] = Math.max(1, curHp || 100);
                                                    } else {
                                                        const last = prevHpMap.current[keyCoord];
                                                        if (last !== curHp) {
                                                            prevHpMap.current[keyCoord] = curHp;
                                                            if ((curHp || 0) > (hpBaseMap.current[keyCoord] || 0)) hpBaseMap.current[keyCoord] = curHp;
                                                            setHpBarVisible(v => ({ ...v, [keyCoord]: true }));
                                                            if (hideTimers.current[keyCoord]) clearTimeout(hideTimers.current[keyCoord] as any);
                                                            hideTimers.current[keyCoord] = setTimeout(() => {
                                                                setHpBarVisible(v => ({ ...v, [keyCoord]: false }));
                                                                hideTimers.current[keyCoord] = undefined;
                                                            }, 2000) as any;
                                                        }
                                                    }
                                                } catch (e) {}

                                                const showHp = Boolean(hpBarVisible[`${cell.x},${cell.y}`]);
                                                const maxHp = hpBaseMap.current[`${cell.x},${cell.y}`] ?? (Number(cell.enemy.hp) > 0 ? Number(cell.enemy.hp) : 100);
                                                return (
                                                    <div className="absolute bottom-px left-px flex items-end" style={{ gap: 6 }}>
                                                        <div style={{ transform: 'translateY(-22px)' }}>
                                                            {showHp ? <ProgressBar value={Number(cell.enemy.hp ?? 0)} max={maxHp} width={140} height={18} ariaLabel="Enemy health" /> : null}
                                                        </div>
                                                        <div>
                                                            <IconRenderer icon={cell.enemy.emoji} size={20} />
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                            {cell.items.length > 0 && (
                                                <div className="absolute bottom-px right-px">
                                                    <IconRenderer icon={cell.items[0].emoji} size={20} />
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

                    {overlayData ? (
                        <PlayerOverlay
                            overlayData={overlayData}
                            autoPlay={true}
                            usePortal={false}
                            onLanding={() => {
                                try {
                                    const d = lastOverlayDetailRef.current;
                                    if (!d) return;
                                    const ev = new CustomEvent('playerOverlayLanding', { detail: { center: d.to, id: d.id } });
                                    window.dispatchEvent(ev as any);
                                } catch {}
                            }}
                            onFinished={() => {
                                try {
                                    const d = lastOverlayDetailRef.current;
                                    const ev = new CustomEvent('moveAnimationsFinished', { detail: { center: d?.to, id: d?.id } });
                                    window.dispatchEvent(ev as any);
                                } catch {}
                            }}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
}
