import React from 'react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings, Download, Trash2, Play, PlusCircle, Star, User, Backpack, Swords } from 'lucide-react';
import { cn, getTranslatedText } from "@/lib/utils";
import type { SaveSlotSummary } from '@/hooks/use-save-management';
import type { Language } from '@/lib/i18n';

interface SlotSelectionViewProps {
    saveSlots: SaveSlotSummary[];
    onPlay: (index: number) => void;
    onNewGame: (index: number) => void;
    onDelete: (index: number) => void;
    onSettings: () => void;
    onInstall?: () => void;
    installPromptAvailable: boolean;
    language: Language;
    t: (key: string, options?: any) => string;
}

export function SlotSelectionView({
    saveSlots,
    onPlay,
    onNewGame,
    onDelete,
    onSettings,
    onInstall,
    installPromptAvailable,
    language,
    t
}: SlotSelectionViewProps) {


    // Helper for time formatting
    const getGameTimeAsString = (gameTime: number): string => {
        const hour = Math.floor(gameTime / 60);
        const minute = gameTime % 60;
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    };

    return (
        <TooltipProvider>
            {/* Full Screen Background Container */}
            <div className="relative min-h-dvh w-full overflow-hidden text-foreground">
                {/* Background Image Layer */}
                <div
                    className="absolute inset-0 z-0 bg-center bg-no-repeat"
                    style={{
                        backgroundImage: "url('/asset/images/ui/back_ground/forest_background.jpg')",
                        backgroundSize: '100% 100%',
                        filter: "brightness(0.4) sepia(0.3)"
                    }}
                />

                {/* Content Overlay */}
                <div className="relative z-10 flex flex-col items-center justify-center min-h-dvh p-4 animate-in fade-in duration-700">

                    {/* Top Bar Actions */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        <Button
                            onClick={onSettings}
                            variant="ghost"
                            size="icon"
                            className="text-primary hover:text-accent hover:bg-black/20"
                        >
                            <Settings className="h-6 w-6" />
                        </Button>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="w-full sm:w-auto">
                                    <Button
                                        onClick={onInstall}
                                        variant="ghost"
                                        size="icon"
                                        disabled={!installPromptAvailable}
                                        className="text-primary hover:text-accent hover:bg-black/20"
                                    >
                                        <Download className="h-6 w-6" />
                                    </Button>
                                </span>
                            </TooltipTrigger>
                            {!installPromptAvailable && (
                                <TooltipContent className="panel-eldritch text-primary-foreground border-accent">
                                    <p>{t('installNotAvailableTooltip')}</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </div>

                    <header className="text-center mb-12 space-y-2">
                        <h1 className="text-6xl md:text-7xl font-bold font-headline tracking-tighter text-[#e3dac9] text-shadow-custom drop-shadow-2xl">
                            {t('gameTitle')}
                        </h1>
                        <p className="text-lg text-[#a89f91] font-serif italic text-shadow-custom">
                            {t('welcomeBack')}
                        </p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl px-4">
                        {saveSlots.map((slot, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "relative group transition-all duration-300 transform hover:-translate-y-1",
                                    slot ? "h-[400px]" : "h-[300px] md:h-[400px]"
                                )}
                            >
                                {/* Card Body */}
                                <div className={cn(
                                    "h-full w-full flex flex-col p-6 rounded-xl border-2 transition-all duration-300",
                                    slot
                                        ? "panel-eldritch border-[#8a3324]/50 hover:border-[#8a3324] hover:shadow-[0_0_30px_rgba(138,51,36,0.2)]"
                                        : "bg-black/40 border-dashed border-[#555] hover:bg-black/60 hover:border-[#888]"
                                )}>

                                    {slot ? (
                                        <>
                                            <div className="flex-grow space-y-4">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-2xl font-headline text-[#e3dac9] truncate">
                                                        {getTranslatedText(slot.worldSetup.worldName, language, t)}
                                                    </CardTitle>
                                                    <CardDescription className="text-[#8e806a] font-serif">
                                                        {t('dayX_time', { day: slot.day, time: getGameTimeAsString(slot.gameTime ?? 360) })}
                                                    </CardDescription>
                                                </div>

                                                <Separator className="bg-[#8a3324]/30" />

                                                <div className="text-sm font-serif space-y-3 text-[#c0b298]">
                                                    <div className="flex items-center gap-3">
                                                        <Star className="h-4 w-4 text-[#8a3324]" />
                                                        <span>{t('levelLabel')} <span className="text-white ml-1">{(slot.playerStats.questsCompleted ?? 0) + 1}</span></span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <User className="h-4 w-4 text-[#8a3324]" />
                                                        <span>{t(slot.playerStats.persona)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Backpack className="h-4 w-4 text-[#8a3324]" />
                                                        <span>{t('itemsLabel')}: <span className="text-white ml-1">{slot.playerStats.items.reduce((acc, item) => acc + item.quantity, 0)}</span></span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Swords className="h-4 w-4 text-[#8a3324]" />
                                                        <span>{t('killsLabel')}: <span className="text-white ml-1">{slot.playerStats.unlockProgress.kills}</span></span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-auto pt-6 space-y-3">
                                                <Button
                                                    onClick={() => onPlay(index)}
                                                    className="w-full bg-[#8a3324] hover:bg-[#a04030] text-[#e3dac9] font-headline tracking-wide border border-[#2b1d14] shadow-lg"
                                                >
                                                    <Play className="mr-2 h-4 w-4" /> {t('continueJourney')}
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" className="w-full text-[#8e806a] hover:text-[#b04030] hover:bg-transparent">
                                                            <Trash2 className="mr-2 h-4 w-4" /> {t('deleteSave')}
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="panel-eldritch border-[#8a3324] text-[#e3dac9]">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle className="font-headline text-2xl">{t('confirmDeleteTitle')}</AlertDialogTitle>
                                                            <AlertDialogDescription className="text-[#a89f91]">
                                                                {slot.worldSetup?.worldName
                                                                    ? t('confirmDeleteDesc', { worldName: getTranslatedText(slot.worldSetup.worldName, language, t) })
                                                                    : t('confirmDeleteDescGeneric')
                                                                }
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel className="bg-transparent border-[#8e806a] text-[#c0b298] hover:bg-[#2b1d14] hover:text-white">{t('cancel')}</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => onDelete(index)} className="bg-[#8a3324] hover:bg-[#a04030] text-white">{t('confirm')}</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col h-full items-center justify-center text-center space-y-4 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <div className="p-4 rounded-full bg-white/5 border border-white/10 group-hover:border-white/30 transition-colors">
                                                <PlusCircle className="h-8 w-8 text-[#c0b298]" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl font-headline text-[#c0b298]">{t('emptySlot')}</CardTitle>
                                                <CardDescription className="text-[#8e806a]">{t('newAdventureHint')}</CardDescription>
                                            </div>
                                            <Button onClick={() => onNewGame(index)} variant="outline" className="mt-4 border-[#8e806a] text-[#e3dac9] hover:bg-[#e3dac9] hover:text-[#2b1d14]">
                                                {t('startNewAdventure')}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
