
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useSettings } from "@/context/settings-context";
import { useLanguage } from "@/context/language-context";
import { Settings, BrainCircuit, Dice6 } from "lucide-react";
import type { DiceType, GameMode } from "@/lib/game/types";

interface SettingsPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsPopup({ open, onOpenChange }: SettingsPopupProps) {
  const { t } = useLanguage();
  const { settings, setSettings } = useSettings();

  const handleGameModeChange = (checked: boolean) => {
    setSettings({ gameMode: checked ? 'ai' : 'offline' });
  };

  const handleDiceTypeChange = (value: string) => {
    setSettings({ diceType: value as DiceType });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Settings /> {t('gameSettings')}
          </DialogTitle>
          <DialogDescription>{t('gameSettingsDesc')}</DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between space-x-4">
            <Label htmlFor="game-mode" className="flex flex-col space-y-1">
              <span className="font-semibold flex items-center gap-2"><BrainCircuit /> {t('aiStoryteller')}</span>
              <span className="font-normal leading-snug text-muted-foreground">
                {t('aiStorytellerDesc')}
              </span>
            </Label>
            <Switch
              id="game-mode"
              checked={settings.gameMode === 'ai'}
              onCheckedChange={handleGameModeChange}
            />
          </div>

          <Separator />
          
          <div className="space-y-3">
            <Label className="font-semibold flex items-center gap-2"><Dice6 /> {t('diceType')}</Label>
            <p className="text-sm leading-snug text-muted-foreground">{t('diceTypeDesc')}</p>
            <RadioGroup
              value={settings.diceType}
              onValueChange={handleDiceTypeChange}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="d20" id="d20" className="peer sr-only" />
                <Label
                  htmlFor="d20"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  D20
                </Label>
              </div>
              <div>
                <RadioGroupItem value="d12" id="d12" className="peer sr-only" />
                <Label
                  htmlFor="d12"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  D12
                </Label>
              </div>
              <div>
                <RadioGroupItem value="2d6" id="2d6" className="peer sr-only" />
                <Label
                  htmlFor="2d6"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  2D6
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
