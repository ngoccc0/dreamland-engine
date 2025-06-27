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

interface InventoryPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: string[];
}

export function InventoryPopup({ open, onOpenChange, items }: InventoryPopupProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Inventory</DialogTitle>
          <DialogDescription>
            Items you have collected on your journey.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <ScrollArea className="h-60">
          <div className="p-4">
            {items.length > 0 ? (
              <ul className="space-y-2">
                {items.map((item, index) => (
                  <li key={index} className="p-2 bg-muted rounded-md text-muted-foreground">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-muted-foreground">Your inventory is empty.</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
