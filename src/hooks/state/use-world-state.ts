'use client';

import { useState, useEffect } from "react";
import type { WorldProfile, Region, WeatherZone, Chunk } from "@/core/types/game";
import WorldImpl from '@/core/entities/world-impl';
import { TerrainFactory } from '@/core/factories/terrain-factory';
import { WorldGenerator } from '@/core/generators/world-generator';

type WorldType = any;

const TERRAIN_LITERALS = [
    'forest', 'grassland', 'desert', 'swamp', 'mountain', 'cave', 'jungle', 'volcanic', 'wall', 'floptropica', 'tundra', 'beach', 'mesa', 'mushroom_forest', 'ocean', 'city', 'space_station', 'underwater'
];

export function useWorldState() {
    const [worldProfile, setWorldProfile] = useState<WorldProfile>({
        climateBase: 'temperate',
        magicLevel: 5,
        mutationFactor: 2,
        sunIntensity: 7,
        weatherTypesAllowed: ['clear', 'rain', 'fog'],
        moistureBias: 0,
        tempBias: 0,
        resourceDensity: Math.random() * 1.0 + 0.5,
        theme: 'Normal',
    });

    const [weatherZones, setWeatherZones] = useState<{ [zoneId: string]: WeatherZone }>({});
    const [regions, setRegions] = useState<{ [id: number]: Region }>({});
    const [regionCounter, setRegionCounter] = useState<number>(0);
    const [currentChunk, setCurrentChunk] = useState<Chunk | null>(null);
    const [finalWorldSetup, setFinalWorldSetup] = useState<any>(null); // Weak typing for now to match original

    // World Initialization
    const [isEnteredWorld, setIsEnteredWorld] = useState(false); // Internal loading state for world gen
    const [world, setWorld] = useState<any>(() => {
        return new WorldImpl() as unknown as any;
    });

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const terrainFactory = new TerrainFactory();
                const terrainDist: Record<string, number> = {};
                for (const t of TERRAIN_LITERALS) terrainDist[t] = 1;

                const gen = new WorldGenerator({
                    width: 25,
                    height: 25,
                    minRegionSize: 4,
                    maxRegionSize: 16,
                    terrainDistribution: terrainDist as any,
                    baseAttributes: {}
                }, terrainFactory as any);

                const w = await gen.generateWorld();
                if (!mounted) return;
                setWorld(w as unknown as any);
                setIsEnteredWorld(true);
            } catch (e) {
                // Silently handle world generation failures
            }
        })();
        return () => { mounted = false; };
    }, []);

    return {
        world, setWorld,
        worldProfile, setWorldProfile,
        weatherZones, setWeatherZones,
        regions, setRegions,
        regionCounter, setRegionCounter,
        currentChunk, setCurrentChunk,
        finalWorldSetup, setFinalWorldSetup,
        isWorldGenerated: isEnteredWorld,
        setIsWorldGenerated: setIsEnteredWorld
    };
}
