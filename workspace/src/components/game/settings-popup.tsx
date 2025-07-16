

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useSettings } from "@/context/settings-context";
import { useLanguage } from "@/context/language-context";
import { usePwaInstall } from "@/context/pwa-install-context";
import { useAuth } from "@/context/auth-context";
import type { DiceType, AiModel, NarrativeLength, FontFamily, FontSize, Theme } from "@/lib/game/types";
import { Language } from "@/lib/i18n";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings, BrainCircuit, Dice6, Bot, Feather, Languages, Download, LogIn, LogOut, UserCircle2, Home, Palette, Type, BookOpen } from "./icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


interface SettingsPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isInGame: boolean;
}

export function SettingsPopup({ open, onOpenChange, isInGame }: SettingsPopupProps) {
  const { t, language, setLanguage } = useLanguage();
  const { settings, setSettings, applyMods, clearMods } = useSettings();
  const { installPrompt, setInstallPrompt } = usePwaInstall();
  const { user, login, logout, isFirebaseConfigured } = useAuth();
  const [modInput, setModInput] = useState(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('gameMods') || '';
    }
    return '';
  });

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA installation');
      } else {
        console.log('User dismissed the PWA installation');
      }
      setInstallPrompt(null);
    });
  };

  const handleApplyMods = () => {
      applyMods(modInput);
      alert(t('modsApplied'));
  }
  
  const handleClearMods = () => {
      clearMods();
      setModInput('');
      alert(t('modsCleared'));
  }

  const handleLanguageChange = (value: string) => setLanguage(value as Language);
  const handleGameModeChange = (checked: boolean) => setSettings({ gameMode: checked ? 'ai' : 'offline' });
  const handleDiceTypeChange = (value: string) => setSettings({ diceType: value as DiceType });
  const handleAiModelChange = (value: string) => setSettings({ aiModel: value as AiModel });
  const handleNarrativeLengthChange = (value: string) => setSettings({ narrativeLength: value as NarrativeLength });
  const handleThemeChange = (checked: boolean) => setSettings({ theme: checked ? 'dark' : 'light' });
  const handleFontFamilyChange = (value: string) => setSettings({ fontFamily: value as FontFamily });
  const handleFontSizeChange = (value: string) => setSettings({ fontSize: value as FontSize });


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2"><Settings /> {t('gameSettings')}</DialogTitle>
          <DialogDescription>{t('gameSettingsDesc')}</DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">{t('settingsTabGeneral')}</TabsTrigger>
                <TabsTrigger value="gameplay">{t('settingsTabGameplay')}</TabsTrigger>
                <TabsTrigger value="mods">{t('settingsTabMods')}</TabsTrigger>
            </TabsList>
            
            <div className="max-h-[70vh] overflow-y-auto pr-4 mt-4">

            <TabsContent value="general" className="space-y-6">
                 <div className="space-y-3">
                    <Label className="font-semibold flex items-center gap-2"><UserCircle2 /> {t('accountSync')}</Label>
                    {isFirebaseConfigured ? (
                    <>
                        <p className="text-sm leading-snug text-muted-foreground">{t('accountSyncDesc')}</p>
                        {user ? (
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground truncate">{user.displayName || user.email}</span>
                            <Button variant="ghost" onClick={logout}><LogOut className="mr-2" />{t('logout')}</Button>
                        </div>
                        ) : (
                        <Button onClick={login} className="w-full"><LogIn className="mr-2" />{t('loginWithGoogle')}</Button>
                        )}
                    </>
                    ) : (
                    <p className="text-sm leading-snug text-destructive">{t('firebaseNotConfigured')}</p>
                    )}
                </div>
                
                <Separator />

                <div className="space-y-3">
                    <Label className="font-semibold flex items-center gap-2"><Languages /> {t('language')}</Label>
                    <p className="text-sm leading-snug text-muted-foreground">{t('languageDesc')}</p>
                    <RadioGroup value={language} onValueChange={handleLanguageChange} className="grid grid-cols-2 gap-4">
                        <div><RadioGroupItem value="vi" id="vi" className="sr-only peer" /><Label htmlFor="vi" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">Tiếng Việt</Label></div>
                        <div><RadioGroupItem value="en" id="en" className="sr-only peer" /><Label htmlFor="en" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">English</Label></div>
                    </RadioGroup>
                </div>

                <Separator />
          
                <div className="space-y-3">
                    <Label className="font-semibold flex items-center gap-2"><Palette /> {t('theme')}</Label>
                    <p className="text-sm leading-snug text-muted-foreground">{t('themeDesc')}</p>
                    <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                    <Label htmlFor="theme-switch" className="flex flex-col space-y-1"><span>{settings.theme === 'dark' ? t('darkTheme') : t('lightTheme')}</span></Label>
                    <Switch id="theme-switch" checked={settings.theme === 'dark'} onCheckedChange={handleThemeChange}/>
                    </div>
                </div>

                <Separator />
                
                <div className="space-y-3">
                    <Label className="font-semibold flex items-center gap-2"><Type /> {t('fontFamily')}</Label>
                    <p className="text-sm leading-snug text-muted-foreground">{t('fontFamilyDesc')}</p>
                    <RadioGroup value={settings.fontFamily} onValueChange={handleFontFamilyChange} className="grid grid-cols-3 gap-2">
                        <div><RadioGroupItem value="literata" id="literata" className="sr-only peer" /><Label htmlFor="literata" className="flex h-full text-center items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer font-literata">{t('fontLiterata')}</Label></div>
                        <div><RadioGroupItem value="inter" id="inter" className="sr-only peer" /><Label htmlFor="inter" className="flex h-full text-center items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer font-inter">{t('fontInter')}</Label></div>
                        <div><RadioGroupItem value="source_code_pro" id="source-code-pro" className="sr-only peer" /><Label htmlFor="source-code-pro" className="flex h-full text-center items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer font-source-code-pro">{t('fontSourceCodePro')}</Label></div>
                    </RadioGroup>
                </div>

                <div className="space-y-3">
                    <Label className="font-semibold flex items-center gap-2"><Type /> {t('fontSize')}</Label>
                    <p className="text-sm leading-snug text-muted-foreground">{t('fontSizeDesc')}</p>
                    <RadioGroup value={settings.fontSize} onValueChange={handleFontSizeChange} className="grid grid-cols-3 gap-4">
                        <div><RadioGroupItem value="sm" id="sm" className="sr-only peer" /><Label htmlFor="sm" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">{t('fontSizeSmall')}</Label></div>
                        <div><RadioGroupItem value="base" id="base" className="sr-only peer" /><Label htmlFor="base" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">{t('fontSizeMedium')}</Label></div>
                        <div><RadioGroupItem value="lg" id="lg" className="sr-only peer" /><Label htmlFor="lg" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">{t('fontSizeLarge')}</Label></div>
                    </RadioGroup>
                </div>
            </TabsContent>

            <TabsContent value="gameplay" className="space-y-6">
                <div className="flex items-center justify-between space-x-4">
                    <Label htmlFor="game-mode" className="flex flex-col space-y-1">
                        <span className="font-semibold flex items-center gap-2"><BrainCircuit /> {t('aiStoryteller')}</span>
                        <span className="font-normal leading-snug text-muted-foreground">{t('aiStorytellerDesc')}</span>
                    </Label>
                    <Switch id="game-mode" checked={settings.gameMode === 'ai'} onCheckedChange={handleGameModeChange}/>
                </div>
                <Separator />
                <div className="space-y-3">
                    <Label className="font-semibold flex items-center gap-2"><Dice6 /> {t('diceType')}</Label>
                    <p className="text-sm leading-snug text-muted-foreground">{t('diceTypeDesc')}</p>
                    <RadioGroup value={settings.diceType} onValueChange={handleDiceTypeChange} className="grid grid-cols-3 gap-4">
                        <div><RadioGroupItem value="d20" id="d20" className="sr-only peer" /><Label htmlFor="d20" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">D20</Label></div>
                        <div><RadioGroupItem value="d12" id="d12" className="sr-only peer" /><Label htmlFor="d12" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">D12</Label></div>
                        <div><RadioGroupItem value="2d6" id="2d6" className="sr-only peer" /><Label htmlFor="2d6" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">2D6</Label></div>
                    </RadioGroup>
                </div>
                <Separator />
                <div className="space-y-3">
                    <Label className="font-semibold flex items-center gap-2"><Bot /> {t('aiModelPreference')}</Label>
                    <p className="text-sm leading-snug text-muted-foreground">{t('aiModelPreferenceDesc')}</p>
                    <RadioGroup value={settings.aiModel} onValueChange={handleAiModelChange} className="grid grid-cols-2 gap-4">
                        <div><RadioGroupItem value="balanced" id="balanced" className="sr-only peer" /><Label htmlFor="balanced" className="flex h-full cursor-pointer flex-col items-start justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><span className="font-semibold">{t('modelChronicler')}</span><span className="mt-2 text-xs text-muted-foreground">{t('modelChroniclerDesc')}</span></Label></div>
                        <div><RadioGroupItem value="quality" id="quality" className="sr-only peer" /><Label htmlFor="quality" className="flex h-full cursor-pointer flex-col items-start justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><span className="font-semibold">{t('modelOracle')}</span><span className="mt-2 text-xs text-muted-foreground">{t('modelOracleDesc')}</span></Label></div>
                        <div><RadioGroupItem value="creative" id="creative" className="sr-only peer" /><Label htmlFor="creative" className="flex h-full cursor-pointer flex-col items-start justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><span className="font-semibold">{t('modelDreamer')}</span><span className="mt-2 text-xs text-muted-foreground">{t('modelDreamerDesc')}</span></Label></div>
                        <div><RadioGroupItem value="fast" id="fast" className="sr-only peer" /><Label htmlFor="fast" className="flex h-full cursor-pointer flex-col items-start justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><span className="font-semibold">{t('modelImp')}</span><span className="mt-2 text-xs text-muted-foreground">{t('modelImpDesc')}</span></Label></div>
                    </RadioGroup>
                </div>
                <Separator />
                <div className="space-y-3">
                    <Label className="font-semibold flex items-center gap-2"><Feather /> {t('narrativeLength')}</Label>
                    <p className="text-sm leading-snug text-muted-foreground">{t('narrativeLengthDesc')}</p>
                    <RadioGroup value={settings.narrativeLength} onValueChange={handleNarrativeLengthChange} className="grid grid-cols-3 gap-4">
                        <div><RadioGroupItem value="short" id="short" className="sr-only peer" /><Label htmlFor="short" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">{t('lengthShort')}</Label></div>
                        <div><RadioGroupItem value="medium" id="medium" className="sr-only peer" /><Label htmlFor="medium" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">{t('lengthMedium')}</Label></div>
                        <div><RadioGroupItem value="long" id="long" className="sr-only peer" /><Label htmlFor="long" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">{t('lengthLong')}</Label></div>
                    </RadioGroup>
                </div>
            </TabsContent>
            
            <TabsContent value="mods" className="space-y-6">
                <div className="space-y-3">
                    <Label className="font-semibold flex items-center gap-2"><BookOpen /> {t('modsTitle')}</Label>
                    <p className="text-sm leading-snug text-muted-foreground">{t('modsDesc')}</p>
                    <Textarea 
                        placeholder={t('modsPlaceholder')}
                        value={modInput}
                        onChange={(e) => setModInput(e.target.value)}
                        rows={8}
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="destructive" onClick={handleClearMods}>{t('modsClear')}</Button>
                        <Button onClick={handleApplyMods}>{t('modsApply')}</Button>
                    </div>
                     <p className="text-xs leading-snug text-muted-foreground pt-2">{t('modsWarning')}</p>
                </div>
                 <Separator />
                <div className="space-y-3">
                    <Label className="font-semibold flex items-center gap-2"><Download /> {t('installAppTitle')}</Label>
                    <p className="text-sm leading-snug text-muted-foreground">{t('installAppSettingDesc')}</p>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild><span className="inline-block w-full"><Button onClick={handleInstallClick} className="w-full" disabled={!installPrompt}><Download className="mr-2 h-4 w-4" />{t('install')}</Button></span></TooltipTrigger>
                            {!installPrompt && (<TooltipContent><p>{t('installNotAvailableTooltip')}</p></TooltipContent>)}
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </TabsContent>

            </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
