"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface StatusPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: {
    hp: number;
    mana: number;
  };
  quests: string[];
}

export function StatusPopup({ open, onOpenChange, stats, quests }: StatusPopupProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Trạng thái người chơi</DialogTitle>
          <DialogDescription>
            Tình trạng hiện tại và các nhiệm vụ đang hoạt động.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="hp" className="text-sm font-medium">Máu: {stats.hp}/100</label>
            <Progress id="hp" value={stats.hp} className="h-4" />
          </div>
          <div className="space-y-2">
            <label htmlFor="mana" className="text-sm font-medium">Năng lượng: {stats.mana}/50</label>
            <Progress id="mana" value={(stats.mana / 50) * 100} className="h-4" />
          </div>
        </div>
        <Separator />
        <div>
          <h3 className="mb-2 font-headline font-semibold">Nhiệm vụ</h3>
          <ScrollArea className="h-40">
            <div className="p-4">
              {quests.length > 0 ? (
                <ul className="space-y-2">
                  {quests.map((quest, index) => (
                    <li key={index} className="p-2 bg-muted rounded-md text-muted-foreground">
                      {quest}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-muted-foreground">Không có nhiệm vụ nào.</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
