

"use client";

import React from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/context/language-context";
import type { PlayerItem, ItemDefinition, Chunk, ItemCategory, PlayerAttributes, TranslatableString, ItemEffect } from "@/lib/game/types";
import type { TranslationKey } from "@/lib/i18n";
import { cn, getTranslatedText } from "@/lib/utils";
import { resolveItemDef } from '@/lib/game/item-utils';
import { IconRenderer } from "@/components/ui/icon-renderer";

interface InventoryPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: PlayerItem[];
  itemDefinitions?: Record<string, ItemDefinition> | null;
  enemy: Chunk['enemy'];
  onUseItem: (itemName: TranslatableString, target: TranslatableString | 'player') => void;
  onEquipItem: (itemName: string) => void;
  onDropItem?: (itemName: string, quantity?: number) => void;
}

const categoryEmojis = {
  Weapon: '⚔️',
  Tool: '🛠️',
  Material: '🧱',
  Food: '🍴',
  Support: '❤️',
  Magic: '✨',
  Equipment: '🛡️',
  'Energy Source': '⚡',
  Data: '📜',
  Fusion: '🌀',
  Armor: '🛡️',
  Accessory: '💍',
  Consumable: '😋',
  Potion: '🧪',
  Utility: '⚙️',
  Misc: '❓',
} as const;

const attributeLabels: Record<keyof PlayerAttributes, TranslationKey> = {
  physicalAttack: 'physicalAttack',
  magicalAttack: 'magicalAttack',
  critChance: 'critChance',
  attackSpeed: 'attackSpeed',
  cooldownReduction: 'cooldownReduction',
  physicalDefense: 'physicalDefense',
  magicalDefense: 'magicalDefense',
};


export function InventoryPopup({ open, onOpenChange, items, itemDefinitions, enemy, onUseItem, onEquipItem, onDropItem }: InventoryPopupProps) {
  const { t, language } = useLanguage();
  const lastOpenedIndex = React.useRef<number | null>(null);
  const pickIcon = (definition: any, item: any) => {
    if (definition?.emoji && typeof definition.emoji === 'object' && definition.emoji.type === 'image') return definition.emoji;
    if (definition && (definition as any).image) return (definition as any).image;
    if (item?.emoji && typeof item.emoji === 'object' && item.emoji.type === 'image') return item.emoji;
    return definition?.emoji ?? item?.emoji ?? '❓';
  };

  const handleAction = (callback: () => void) => {
    // Close the popup first to ensure any modal overlay is removed before
    // executing the action callback which may trigger toasts, state updates
    // or other UI that could be affected by an overlay still present.
    // This ordering avoids transient UI-blocking issues where a dialog
    // overlay remains in the DOM while other components update.
    onOpenChange(false);
    try {
      callback();
    } catch (e: any) {
      // swallow to avoid breaking UI; errors should still be visible in console
      // but don't leave the popup open or block further interactions.

      console.error('Inventory action callback failed', e);
    } finally {
      // Safety: some third-party floating/dismiss layers temporarily set
      // document.body.style.pointerEvents = 'none' to block outside clicks.
      // If a library failed to restore that style (e.g. due to an exception
      // or an interrupted lifecycle) the whole UI will become unclickable.
      // Clear any residual pointer-events on the root elements here as a
      // low-risk recovery measure.
      try {
        if (typeof document !== 'undefined' && document?.body) {
          document.body.style.pointerEvents = '';
        }
        if (typeof document !== 'undefined' && document?.documentElement) {
          document.documentElement.style.pointerEvents = '';
        }
      } catch {
        // ignore; defensive best-effort only
      }
    }
  }

  const handleActionKeepOpen = (callback: () => void) => {
    // Keep the popup open - no onOpenChange(false) call
    // Useful for repeated item usage without closing/reopening the inventory
    try {
      callback();
    } catch (e: any) {
      console.error('Inventory action callback failed', e);
    } finally {
      // Same cleanup for pointer-events as handleAction
      try {
        if (typeof document !== 'undefined' && document?.body) {
          document.body.style.pointerEvents = '';
        }
        if (typeof document !== 'undefined' && document?.documentElement) {
          document.documentElement.style.pointerEvents = '';
        }
      } catch {
        // ignore; defensive best-effort only
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" tabIndex={0} onKeyDown={(e) => {
        if (e.key.toLowerCase() === 'q' && lastOpenedIndex.current !== null && typeof onDropItem === 'function') {
          const idx = lastOpenedIndex.current;
          const item = items[idx];
          if (item) {
            e.preventDefault();
            onOpenChange(false);
            try { onDropItem(getTranslatedText(item.name, 'en'), 1); } catch { }
          }
        }
      }}>
        <DialogHeader>
          <DialogTitle className="font-headline">{t('inventoryPopupTitle')}</DialogTitle>
          <DialogDescription>
            {t('inventoryPopupDesc')}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <ScrollArea className="h-60">
          <div className="p-4">
            {/* 4 columns x 10 rows = 40 slots */}
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 40 }).map((_, idx) => {
                const item = items[idx] as PlayerItem | undefined;
                if (!item) {
                  return (
                    <div key={idx} className="h-20 flex items-center justify-center border border-dashed rounded bg-muted/30 text-muted-foreground">
                      {/* empty slot */}
                    </div>
                  );
                }

                const definition = resolveItemDef(getTranslatedText(item.name, 'en'), itemDefinitions || undefined);
                const isUsableOnSelf = !!(definition && definition.effects && definition.effects.length > 0);
                const isUsableOnEnemy = !!(enemy && definition && enemy.diet && enemy.diet.includes(getTranslatedText(item.name, 'en')));
                const isEquippable = definition && definition.equipmentSlot;
                const isInteractable = isUsableOnSelf || isUsableOnEnemy || isEquippable;

                return (
                  <div key={idx}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button onClick={() => { lastOpenedIndex.current = idx; }} className="w-full h-20 flex flex-col items-center justify-center bg-muted rounded-md cursor-pointer hover:bg-accent/20 relative">
                          <IconRenderer icon={pickIcon(definition, item)} size={70} alt={getTranslatedText(item.name, language)} />
                          <span className="absolute bottom-1 right-1 text-xs font-bold bg-primary/20 px-1 rounded">x{item.quantity}</span>
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent className="w-64">
                        <DropdownMenuLabel className="font-normal">
                          <p className="font-bold flex items-center gap-2">
                            <IconRenderer icon={pickIcon(definition, item)} size={48} alt={getTranslatedText(item.name, language)} />
                            {getTranslatedText(item.name, language)}
                          </p>
                          {!definition ? (
                            <p className="text-xs text-red-500 whitespace-normal">Item definition not found!</p>
                          ) : (
                            <p className="text-xs text-muted-foreground whitespace-normal">{getTranslatedText(definition?.description ?? '', language)}</p>
                          )}
                        </DropdownMenuLabel>

                        {(definition && ((definition.effects && definition.effects.length > 0) || definition.attributes)) && <DropdownMenuSeparator />}

                        {definition?.attributes && (
                          <div className="px-2 py-1.5 text-xs space-y-1">
                            <p className="font-semibold text-muted-foreground">{t('attributes')}:</p>
                            {Object.entries(definition.attributes).map(([key, value]) => {
                              if (typeof value !== 'number' || value === 0) return null;
                              const sign = value > 0 ? '+' : '';
                              return (
                                <p key={key} className={cn("ml-2", value > 0 ? "text-green-500" : "text-red-500")}>
                                  {sign}{value}{key.includes('Reduction') || key.includes('Chance') ? '%' : ''} {t(attributeLabels[key as keyof PlayerAttributes])}
                                </p>
                              )
                            })}
                          </div>
                        )}

                        {definition && definition.effects && definition.effects.length > 0 && (
                          <div className="px-2 py-1.5 text-xs space-y-1">
                            <p className="font-semibold text-muted-foreground">{t('effects')}:</p>
                            {(definition.effects || []).map((effect: ItemEffect, i) => (
                              <p key={i} className="text-green-500 ml-2">
                                {effect.type === 'HEAL' && `+${effect.amount} ${t('healthShort')}`}
                                {effect.type === 'RESTORE_STAMINA' && `+${effect.amount} ${t('staminaShort')}`}
                                {effect.type === 'RESTORE_MANA' && `+${effect.amount} ${t('manaShort')}`}
                                {effect.type === 'RESTORE_HUNGER' && `−${effect.amount} ${t('hudHunger')}`}
                              </p>
                            ))}
                          </div>
                        )}

                        <DropdownMenuSeparator />
                        {isUsableOnSelf && <DropdownMenuItem onClick={() => handleActionKeepOpen(() => onUseItem(item.name, 'player'))}>{t('useOnSelf')}</DropdownMenuItem>}
                        {isUsableOnEnemy && <DropdownMenuItem onClick={() => handleActionKeepOpen(() => onUseItem(item.name, enemy?.type ?? 'player'))}>{t('useOnTarget', { target: enemy?.type ? getTranslatedText(enemy.type, language, t) : t('no_enemy_found') })}</DropdownMenuItem>}
                        {isEquippable && <DropdownMenuItem onClick={() => handleActionKeepOpen(() => onEquipItem(getTranslatedText(item.name, 'en')))}>{t('equipItem')}</DropdownMenuItem>}
                        {/* Drop action */}
                        {typeof (onDropItem) === 'function' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleAction(() => onDropItem(getTranslatedText(item.name, 'en'), 1))}>{t('dropItem')} ({t('key_q') || 'Q'})</DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
            {items.length === 0 && <p className="text-center text-muted-foreground mt-4">{t('inventoryEmpty')}</p>}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
