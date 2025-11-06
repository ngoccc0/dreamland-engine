

"use client";

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


export function InventoryPopup({ open, onOpenChange, items, itemDefinitions, enemy, onUseItem, onEquipItem }: InventoryPopupProps) {
  const { t, language } = useLanguage();

  const handleAction = (callback: () => void) => {
    // Close the popup first to ensure any modal overlay is removed before
    // executing the action callback which may trigger toasts, state updates
    // or other UI that could be affected by an overlay still present.
    // This ordering avoids transient UI-blocking issues where a dialog
    // overlay remains in the DOM while other components update.
    onOpenChange(false);
    try {
      callback();
    } catch (e) {
      // swallow to avoid breaking UI; errors should still be visible in console
      // but don't leave the popup open or block further interactions.
      // eslint-disable-next-line no-console
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
      } catch (e) {
        // ignore; defensive best-effort only
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{t('inventoryPopupTitle')}</DialogTitle>
          <DialogDescription>
            {t('inventoryPopupDesc')}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <ScrollArea className="h-60">
            <div className="p-4">
              {items.length > 0 ? (
                <ul className="space-y-2">
                  {items.map((item, index) => {
                    // Resolve using helper which supports both keys and display names
                    const definition = resolveItemDef(getTranslatedText(item.name, 'en'), itemDefinitions || undefined);
                    const isUsableOnSelf = !!(definition && definition.effects && definition.effects.length > 0);
                    const isUsableOnEnemy = !!(enemy && definition && enemy.diet && enemy.diet.includes(getTranslatedText(item.name, 'en')));
                    const isEquippable = definition && definition.equipmentSlot;
                    const isInteractable = isUsableOnSelf || isUsableOnEnemy || isEquippable;

                    const itemCategory = definition?.category;
                    const categoryEmoji = itemCategory ? categoryEmojis[itemCategory as keyof typeof categoryEmojis] : '❓';

                    return (
                      <li key={index}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className={cn(
                                        "w-full flex justify-between items-center p-2 bg-muted rounded-md text-left text-sm cursor-pointer hover:bg-accent/20"
                                    )}
                                >
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <IconRenderer icon={item.emoji} size={32} alt={getTranslatedText(item.name, language)} />
                                        <div className="flex flex-col items-start">
                                            <span className="text-foreground">{getTranslatedText(item.name, language)}</span>
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary-foreground font-semibold">{t('tier', { tier: item.tier })}</span>
                                              {definition && definition.category && <span title={t(definition.category)} className="text-xs px-1.5 py-0.5 rounded-full bg-accent/80 text-accent-foreground flex items-center gap-1">{categoryEmoji}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="font-mono text-sm font-bold text-foreground">x{item.quantity}</span>
                                </button>
                            </DropdownMenuTrigger>
                            
                            <DropdownMenuContent className="w-64">
                <DropdownMenuLabel className="font-normal">
                  <p className="font-bold flex items-center gap-2">
                    <IconRenderer icon={item.emoji} size={20} alt={getTranslatedText(item.name, language)} />
                    {getTranslatedText(item.name, language)}
                  </p>
                  {!definition ? (
                    <p className="text-xs text-red-500 whitespace-normal">Item definition not found!</p>
                  ) : (
                    <p className="text-xs text-muted-foreground whitespace-normal">{getTranslatedText(definition?.description ?? '', language)}</p>
                  )}
                </DropdownMenuLabel>
                                
                                {isInteractable && (
                                  <>
                                    {(definition?.effects?.length > 0 || definition?.attributes) && <DropdownMenuSeparator />}
                                    
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

                                    {definition?.effects?.length > 0 && (
                                        <div className="px-2 py-1.5 text-xs space-y-1">
                                            <p className="font-semibold text-muted-foreground">{t('effects')}:</p>
                                            {definition.effects.map((effect: ItemEffect, i) => (
                                                <p key={i} className="text-green-500 ml-2">
                                                    {effect.type === 'HEAL' && `+${effect.amount} ${t('healthShort')}`}
                                                    {effect.type === 'RESTORE_STAMINA' && `+${effect.amount} ${t('staminaShort')}`}
                                                </p>
                                            ))}
                                        </div>
                                    )}

                                    <DropdownMenuSeparator />
                                    {isUsableOnSelf && <DropdownMenuItem onClick={() => handleAction(() => onUseItem(item.name, 'player'))}>{t('useOnSelf')}</DropdownMenuItem>}
                                    {isUsableOnEnemy && <DropdownMenuItem onClick={() => handleAction(() => onUseItem(item.name, enemy?.type ?? 'player'))}>{t('useOnTarget', { target: enemy?.type ? getTranslatedText(enemy.type, language, t) : t('no_enemy_found') })}</DropdownMenuItem>}
                                    {isEquippable && <DropdownMenuItem onClick={() => handleAction(() => onEquipItem(getTranslatedText(item.name, 'en')))}>{t('equipItem')}</DropdownMenuItem>}
                                  </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-center text-muted-foreground">{t('inventoryEmpty')}</p>
              )}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
