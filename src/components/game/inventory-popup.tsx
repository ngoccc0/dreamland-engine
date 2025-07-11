

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
import type { PlayerItem, ItemDefinition, Chunk, ItemCategory, PlayerAttributes } from "@/lib/game/types";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface InventoryPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: PlayerItem[];
  itemDefinitions: Record<string, ItemDefinition>;
  enemy: Chunk['enemy'];
  onUseItem: (itemName: string, target: 'player' | string) => void;
  onEquipItem: (itemName: string) => void;
}

const categoryEmojis: Record<string, string> = {
  Weapon: '⚔️',
  Tool: '🛠️',
  Material: '🧱',
  Food: '🍴',
  Support: '❤️‍🩹',
  Magic: '✨',
  Equipment: '🛡️',
  'Energy Source': '⚡',
  Data: '📜',
  Fusion: '🌀',
  Meat: '🥩',
  Fruit: '🍎',
  Vegetable: '🥬',
  Potion: '🧪',
};

const attributeLabels: Record<keyof PlayerAttributes, TranslationKey> = {
    physicalAttack: 'physicalAttack',
    magicalAttack: 'magicalAttack',
    critChance: 'critChance',
    attackSpeed: 'attackSpeed',
    cooldownReduction: 'cooldownReduction',
};


export function InventoryPopup({ open, onOpenChange, items, itemDefinitions, enemy, onUseItem, onEquipItem }: InventoryPopupProps) {
  const { t } = useLanguage();

  const handleAction = (callback: () => void) => {
    callback();
    onOpenChange(false); // Close popup after any action
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
                    const definition = itemDefinitions[item.name];
                    const isUsableOnSelf = definition && definition.effects.length > 0;
                    const isUsableOnEnemy = enemy && definition && enemy.diet.includes(item.name);
                    const isEquippable = definition && definition.equipmentSlot;
                    const isInteractable = isUsableOnSelf || isUsableOnEnemy || isEquippable;

                    const itemCategory = definition?.category;
                    const itemSubCategory = definition?.subCategory;
                    const categoryEmoji = itemSubCategory ? categoryEmojis[itemSubCategory] : (itemCategory ? categoryEmojis[itemCategory] : '❓');

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
                                        <span className="text-2xl mr-2">{item.emoji}</span>
                                        <div className="flex flex-col items-start">
                                            <span className="text-foreground">{t(item.name)}</span>
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
                                    <p className="font-bold">{item.emoji} {t(item.name)}</p>
                                    <p className="text-xs text-muted-foreground whitespace-normal">{t(definition?.description)}</p>
                                </DropdownMenuLabel>
                                
                                {isInteractable && (
                                  <>
                                    {(definition?.effects?.length > 0 || definition?.attributes) && <DropdownMenuSeparator />}
                                    
                                    {definition?.attributes && (
                                        <div className="px-2 py-1.5 text-xs space-y-1">
                                            <p className="font-semibold text-muted-foreground">{t('attributes')}:</p>
                                            {Object.entries(definition.attributes).map(([key, value]) => {
                                                if (value === 0) return null;
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
                                            {definition.effects.map((effect, i) => (
                                                <p key={i} className="text-green-500 ml-2">
                                                    {effect.type === 'HEAL' && `+${effect.amount} ${t('healthShort')}`}
                                                    {effect.type === 'RESTORE_STAMINA' && `+${effect.amount} ${t('staminaShort')}`}
                                                </p>
                                            ))}
                                        </div>
                                    )}

                                    <DropdownMenuSeparator />
                                    {isUsableOnSelf && <DropdownMenuItem onClick={() => handleAction(() => onUseItem(item.name, 'player'))}>{t('useOnSelf')}</DropdownMenuItem>}
                                    {isUsableOnEnemy && <DropdownMenuItem onClick={() => handleAction(() => onUseItem(item.name, enemy!.type))}>{t('useOnTarget', { target: t(enemy!.type) })}</DropdownMenuItem>}
                                    {isEquippable && <DropdownMenuItem onClick={() => handleAction(() => onEquipItem(item.name))}>{t('equipItem')}</DropdownMenuItem>}
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
