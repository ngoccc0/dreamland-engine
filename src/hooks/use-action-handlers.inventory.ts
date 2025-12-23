
import { ActionHandlerDeps } from '@/hooks/actions/types';
import { resolveItemDef as resolveItemDefHelper } from '@/lib/utils/item-utils';
import { getTranslatedText, ensurePlayerItemId } from '@/lib/utils';
import { getEffectiveChunk } from '@/core/engines/game/weather-generation';
import { PlayerItem, TranslationKey } from '@/core/types/game';

// Extended deps including UI hooks which are injected by the main hook
type InventoryHandlerDeps = ActionHandlerDeps & {
    t: (key: string | TranslationKey, params?: any) => string;
    toast: (props: any) => void;
    language: string;
};

export const createHandleInventoryActions = (deps: InventoryHandlerDeps) => {
    const {
        isLoading, isGameOver, playerStats, setPlayerStats, customItemDefinitions,
        t, language, playerPosition, setWorld, addNarrativeEntry, advanceGameTime,
        world, weatherZones, gameTime, setCurrentChunk
    } = deps;

    // Defensive typed aliases for legacy fields
    const sStart = (deps.settings as any)?.startTime ?? 0;
    const sDayDuration = (deps.settings as any)?.dayDuration ?? 24000;

    const resolveItemDef = (name: string) => {
        return resolveItemDefHelper(name, customItemDefinitions);
    };

    const handleEquipItem = (itemName: string) => {
        if (isLoading || isGameOver) return;

        setPlayerStats((prevStats: any) => {
            const newStats: any = JSON.parse(JSON.stringify(prevStats));
            const itemDef = resolveItemDef(getTranslatedText(itemName as any, 'en'));
            if (!itemDef || !itemDef.equipmentSlot) return prevStats;

            const itemToEquipIndex = newStats.items.findIndex((i: any) => getTranslatedText(i.name, 'en') === getTranslatedText(itemName as any, 'en'));
            if (itemToEquipIndex === -1) return prevStats;

            const itemToEquip = newStats.items[itemToEquipIndex];
            const slot = itemDef.equipmentSlot;

            const currentEquipped = (newStats.equipment as any)[slot];
            if (currentEquipped) {
                const existingInInventory = newStats.items.find((i: any) => getTranslatedText(i.name, 'en') === getTranslatedText(currentEquipped.name, 'en'));
                if (existingInInventory) {
                    existingInInventory.quantity += 1;
                } else {
                    newStats.items.push(ensurePlayerItemId({ ...currentEquipped, quantity: 1 }, customItemDefinitions, t, language));
                }
            }

            (newStats.equipment as any)[slot] = { name: itemToEquip.name, quantity: 1, tier: itemToEquip.tier, emoji: itemDef.emoji };

            if (itemToEquip.quantity > 1) {
                itemToEquip.quantity -= 1;
            } else {
                newStats.items.splice(itemToEquipIndex, 1);
            }

            let basePhysAtk = 10, baseMagAtk = 5, baseCrit = 5, baseAtkSpd = 1.0, baseCd = 0, basePhysDef = 0, baseMagDef = 0;
            Object.values(newStats.equipment).forEach((equipped: any) => {
                if (equipped) {
                    const def = resolveItemDef(getTranslatedText(equipped.name, 'en'));
                    if (def?.attributes) {
                        basePhysAtk += def.attributes.physicalAttack || 0;
                        baseMagAtk += def.attributes.magicalAttack || 0;
                        baseCrit += def.attributes.critChance || 0;
                        baseAtkSpd += def.attributes.attackSpeed || 0;
                        baseCd += def.attributes.cooldownReduction || 0;
                        basePhysDef += def.attributes.physicalDefense || 0;
                        baseMagDef += def.attributes.magicalDefense || 0;
                    }
                }
            });
            newStats.attributes = { physicalAttack: basePhysAtk, magicalAttack: baseMagAtk, physicalDefense: basePhysDef, magicalDefense: baseMagDef, critChance: baseCrit, attackSpeed: baseAtkSpd, cooldownReduction: baseCd };

            return newStats;
        });
    };

    const handleUnequipItem = (slot: any) => {
        if (isLoading || isGameOver) return;

        setPlayerStats((prevStats: any) => {
            const newStats: any = JSON.parse(JSON.stringify(prevStats));
            const itemToUnequip = newStats.equipment[slot];
            if (!itemToUnequip) return prevStats;

            const existingInInventory = newStats.items.find((i: any) => getTranslatedText(i.name, 'en') === getTranslatedText(itemToUnequip.name, 'en'));
            if (existingInInventory) {
                existingInInventory.quantity += 1;
            } else {
                const itemDef = resolveItemDef(getTranslatedText(itemToUnequip.name, 'en'));
                newStats.items.push(ensurePlayerItemId({ ...itemToUnequip, quantity: 1, emoji: itemDef?.emoji || '📦' }, customItemDefinitions, t, language));
            }

            (newStats.equipment as any)[slot] = null;

            let basePhysAtk = 10, baseMagAtk = 5, baseCrit = 5, baseAtkSpd = 1.0, baseCd = 0, basePhysDef = 0, baseMagDef = 0;
            Object.values(newStats.equipment).forEach((equipped: any) => {
                if (equipped) {
                    const def = resolveItemDef(getTranslatedText(equipped.name, 'en'));
                    if (def?.attributes) {
                        basePhysAtk += def.attributes.physicalAttack || 0;
                        baseMagAtk += def.attributes.magicalAttack || 0;
                        baseCrit += def.attributes.critChance || 0;
                        baseAtkSpd += def.attributes.attackSpeed || 0;
                        baseCd += def.attributes.cooldownReduction || 0;
                        basePhysDef += def.attributes.physicalDefense || 0;
                        baseMagDef += def.attributes.magicalDefense || 0;
                    }
                }
            });
            newStats.attributes = { physicalAttack: basePhysAtk, magicalAttack: baseMagAtk, physicalDefense: basePhysDef, magicalDefense: baseMagDef, critChance: baseCrit, attackSpeed: baseAtkSpd, cooldownReduction: baseCd };

            return newStats;
        });
    };

    const handleDropItem = (itemName: string, quantity: number = 1) => {
        try {
            const key = `${playerPosition.x},${playerPosition.y}`;
            setPlayerStats((prev: any) => {
                const next = JSON.parse(JSON.stringify(prev));
                next.items = next.items || [];
                const idx = next.items.findIndex((i: any) => getTranslatedText(i.name, 'en') === itemName);
                if (idx === -1) return prev;
                next.items[idx].quantity = (next.items[idx].quantity || 0) - quantity;
                if (next.items[idx].quantity <= 0) next.items = next.items.filter((i: any) => getTranslatedText(i.name, 'en') !== itemName);
                return next;
            });
            // Build the updated chunk locally and set world + refresh currentChunk so UI sees the item
            const baseChunk = world[`${playerPosition.x},${playerPosition.y}`];
            if (!baseChunk) return;
            const dropItem = { name: { en: itemName, vi: t(itemName as TranslationKey) }, quantity, emoji: '📦' } as any;
            const newChunk = { ...baseChunk, items: [...(baseChunk.items || []), dropItem] };

            setWorld((prev: any) => {
                const nw = { ...prev };
                nw[key] = newChunk;
                return nw;
            });

            // Refresh the live currentChunk used by UI/handlers
            try { if (typeof setCurrentChunk === 'function') setCurrentChunk(getEffectiveChunk(newChunk, weatherZones, gameTime, sStart, sDayDuration)); } catch { }

            addNarrativeEntry(t('droppedItem', { itemName: t(itemName as TranslationKey) }), 'system');
            advanceGameTime(playerStats);
        } catch {
            // ignore
        }
    };

    return {
        handleEquipItem,
        handleUnequipItem,
        handleDropItem
    };
};
