/**
 * OVERVIEW: Type definitions and constants for the Minimap component.
 * Exports biomeColors mapping, props interfaces, and shared types.
 */

import type { Terrain, PlayerStatusDefinition, Chunk } from "@/lib/game/types";

export const biomeColors: Record<Terrain | 'empty', string> = {
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

/**
 * Defines the visibility level of a minimap cell.
 */
export enum VisibilityLevel {
    Obscured,          // Completely hidden, like unexplored fog of war
    PartiallyVisible,  // Revealed but with reduced detail, desaturated, or faint
    FullyVisible,      // Normal, full detail rendering
}

export interface MinimapProps {
    grid: (any)[][];
    playerPosition: { x: number; y: number };
    visualPlayerPosition?: { x: number; y: number } | null;
    isAnimatingMove?: boolean;
    visualMoveFrom?: { x: number; y: number } | null;
    visualMoveTo?: { x: number; y: number } | null;
    visualJustLanded?: boolean;
    turn: number;
    biomeDefinitions: Record<string, any>;
    playerStats: PlayerStatusDefinition;
    currentChunk: Chunk | null; // Added currentChunk for player elevation
}

export interface PanAnimState {
    active: boolean;
    startTime: number | null;
    duration: number;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    rafId: number | null;
}

export interface OverlayData {
    left: string;
    top: string;
    width: string;
    height: string;
    dx: number;
    dy: number;
    flyDurationMs: number;
}
