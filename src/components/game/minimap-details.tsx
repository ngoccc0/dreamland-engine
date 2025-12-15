/**
 * OVERVIEW: MapCellDetails component displays detailed information about a map chunk
 * in a popover. Memoized to avoid re-renders when chunk data hasn't changed.
 * Shows terrain, structures, items, enemies, and NPCs for a specific tile.
 */

"use client";

import React, { useEffect } from "react";
import { Home, MapPin, Backpack } from "../game/icons";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/context/language-context";
import type { Chunk } from "@/lib/game/types";
import { SwordIcon } from "./icons";
import { getTranslatedText } from "@/lib/utils";
import { resolveItemDef } from "@/lib/utils/item-utils";
import { IconRenderer } from "@/components/ui/icon-renderer";

export const MapCellDetails = React.memo(({ chunk, itemDefinitions }: { chunk: Chunk; itemDefinitions?: Record<string, any> }) => {
    const { t, language } = useLanguage();
    useEffect(() => {
        try { console.info('[MapCellDetails] mounted'); } catch { }
        return () => { try { console.info('[MapCellDetails] unmounted'); } catch { } };
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
                                return <li key={idx} className="flex items-center gap-1"><IconRenderer icon={structData.emoji} size={16} /> {getTranslatedText(structData.name, language as any, t)}</li>
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
                                return <li key={idx} className="flex items-center gap-1"><IconRenderer icon={emoji} size={16} /> {getTranslatedText(item.name, language as any, t)} (x{item.quantity})</li>;
                            })}
                        </ul>
                    </div>
                )}
                {chunk.enemy && (
                    <div>
                        <h5 className="font-semibold text-xs flex items-center gap-1.5 mb-1"><SwordIcon />{t('enemy')}:</h5>
                        <p className="text-xs pl-5 flex items-center gap-1"><IconRenderer icon={chunk.enemy.emoji} size={16} /> {chunk.enemy.type ? getTranslatedText(chunk.enemy.type, language as any, t) : t('no_enemy_found')} (HP: {chunk.enemy.hp})</p>
                    </div>
                )}
                {chunk.NPCs.length > 0 && (
                    <div>
                        <h5 className="font-semibold text-xs flex items-center gap-1.5 mb-1"><span className="icon">👤</span>{t('npcs')}:</h5>
                        <ul className="space-y-1 text-xs pl-5">
                            {chunk.NPCs.map((npc, idx) => <li key={idx}>{getTranslatedText(npc.name, language as any, t)}</li>)}
                        </ul>
                    </div>
                )}
            </div>

        </div>
    );
});

MapCellDetails.displayName = 'MapCellDetails';
