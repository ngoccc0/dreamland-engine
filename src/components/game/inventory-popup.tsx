"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/context/language-context";
import type { PlayerItem } from "@/lib/game/types";

interface InventoryPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: PlayerItem[];
}

export function InventoryPopup({ open, onOpenChange, items }: InventoryPopupProps) {
  const { t } = useLanguage();

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
                {items.map((item, index) => (
                  <li key={index} className="flex justify-between items-center p-2 bg-muted rounded-md text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>{item.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary-foreground font-semibold">{t('tier', { tier: item.tier })}</span>
                    </div>
                    <span className="font-mono text-sm font-bold text-foreground">x{item.quantity}</span>
                  </li>
                ))}
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
