

"use client";

import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useAudio } from "@/lib/audio/useAudio";
import { BACKGROUND_MUSIC, MENU_MUSIC } from "@/lib/audio/assets";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { Settings, BrainCircuit, Dice6, Bot, Feather, Languages, Download, LogIn, LogOut, UserCircle2, Palette, Type, BookOpen } from "./icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


interface SettingsPopupProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isInGame: boolean;
    currentBiome?: string | null;
}

export function SettingsPopup({ open, onOpenChange, isInGame, currentBiome }: SettingsPopupProps) {
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

    const handleLanguageChange = (value: string) => setLanguage(value as Language, currentBiome ?? undefined);
    const handleGameModeChange = (checked: boolean) => setSettings({ gameMode: checked ? 'ai' : 'offline' });
    const handleDiceTypeChange = (value: string) => setSettings({ diceType: value as DiceType });
    const handleAiModelChange = (value: string) => setSettings({ aiModel: value as AiModel });
    const handleNarrativeLengthChange = (value: string) => setSettings({ narrativeLength: value as NarrativeLength });
    const handleThemeChange = (checked: boolean) => setSettings({ theme: checked ? 'dark' : 'light' });
    const handleFontFamilyChange = (value: string) => setSettings({ fontFamily: value as FontFamily });
    const handleFontSizeChange = (value: string) => setSettings({ fontSize: value as FontSize });
    const [isDesktop, setIsDesktop] = useState(false);
    const audio = useAudio();

    // Dynamically load music files from API
    const [allMusicTracks, setAllMusicTracks] = useState<string[]>([]);
    const [selectedTrack, setSelectedTrack] = useState<string | undefined>(undefined);

    useEffect(() => {
        // Load background music and menu music on mount
        const loadMusicTracks = async () => {
            try {
                const [bgRes, menuRes] = await Promise.all([
                    fetch('/api/audio/list?folder=background_music'),
                    fetch('/api/audio/list?folder=menu_music'),
                ]);

                const bgData = await bgRes.json();
                const menuData = await menuRes.json();

                const allTracks = [
                    ...(bgData.files || []).map((f: string) => `background_music/${f}`),
                    ...(menuData.files || []).map((f: string) => `menu_music/${f}`),
                ];

                setAllMusicTracks(allTracks);
                if (allTracks.length > 0) {
                    setSelectedTrack(allTracks[0]);
                }
            } catch (error) {
                console.error('Failed to load music tracks:', error);
                // Fallback to hardcoded list if API fails
                const fallback = BACKGROUND_MUSIC.concat(MENU_MUSIC);
                setAllMusicTracks(fallback);
                if (fallback.length > 0) {
                    setSelectedTrack(fallback[0]);
                }
            }
        };

        loadMusicTracks();
    }, []);

    useEffect(() => {
        const onResize = () => setIsDesktop(typeof window !== 'undefined' && window.innerWidth >= 768);
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md animate-fadeIn">
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
                                    <Switch id="theme-switch" checked={settings.theme === 'dark'} onCheckedChange={handleThemeChange} />
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
                            <Separator />
                            <div className="space-y-3">
                                <Label className="font-semibold flex items-center gap-2">🔊 {t('audioSettings')}</Label>
                                <p className="text-sm leading-snug text-muted-foreground">{t('audioSettingsDesc')}</p>
                                <div className="rounded-lg border p-3 shadow-sm">
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="font-medium">{t('musicVolume')}</div>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => audio.setMuted(!audio.muted)}>
                                                    {audio.muted ? t('unmute') : 'Tắt âm'}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="mb-2">
                                            <label className="text-xs text-muted-foreground">{t('trackSelection')}</label>
                                            <select className="w-full mt-1 p-1 rounded bg-popover" value={selectedTrack || ''} onChange={(e) => setSelectedTrack(e.target.value)}>
                                                {allMusicTracks.length === 0 ? (
                                                    <option value="">Loading...</option>
                                                ) : (
                                                    allMusicTracks.map(track => (
                                                        <option key={track} value={track}>
                                                            {track.replace(/^(background_music|menu_music)\//, '').replace(/\.(mp3|wav|ogg|m4a)$/i, '')}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" onClick={() => audio.playMusic(selectedTrack)}>{t('playTrack')}</Button>
                                            <Button size="sm" onClick={() => audio.pauseMusic()}>{t('pauseTrack')}</Button>
                                            <Button size="sm" onClick={() => audio.stopMusic()}>{t('stopTrack')}</Button>
                                        </div>
                                        <div className="mt-3">
                                            <div className="text-xs text-muted-foreground mb-1">{t('musicVolume')}</div>
                                            <Slider value={[audio.musicVolume]} onValueChange={(v) => audio.setMusicVolume(v[0] ?? 0.5)} step={0.01} min={0} max={1} />
                                        </div>
                                        {/* Autoplay safety CTA: if browser blocked autoplay, allow the user to retry */}
                                        {audio.autoplayBlocked && (
                                            <div className="mt-3 p-2 border rounded bg-yellow-50">
                                                <div className="text-sm font-medium">{t('autoplayBlocked')}</div>
                                                <div className="text-xs text-muted-foreground mb-2">{t('autoplayBlockedDesc')}</div>
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={() => audio.tryEnableAutoplay()}>{t('enableAutoplay')}</Button>
                                                    <Button size="sm" variant="ghost" onClick={() => { try { localStorage.setItem('dl_auto_menu', '0'); audio.setMuted(true); } catch { } }}>{t('deferAutoplay')}</Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4">
                                        <div className="text-xs text-muted-foreground mb-1">{t('sfxVolume')}</div>
                                        <Slider value={[audio.sfxVolume]} onValueChange={(v) => audio.setSfxVolume(v[0] ?? 0.9)} step={0.01} min={0} max={1} />
                                        <div className="flex gap-2 mt-3">
                                            <Button size="sm" onClick={() => audio.playSfx('Menu_Select_00.mp3')}>{t('testSoundButton')} 1</Button>
                                            <Button size="sm" onClick={() => audio.playSfx('Pickup_Gold_00.mp3')}>{t('testSoundButton')} 2</Button>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <div className="text-xs text-muted-foreground mb-1">Ambience Volume</div>
                                        <Slider value={[audio.ambienceVolume]} onValueChange={(v) => audio.setAmbienceVolume(v[0] ?? 0.7)} step={0.01} min={0} max={1} />
                                    </div>

                                    <div className="mt-4">
                                        <div className="text-xs text-muted-foreground mb-1">{t('playbackFrequency')}</div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <label className="flex items-center gap-1">
                                                <input type="radio" name="playbackMode" checked={audio.playbackMode === 'off'} onChange={() => audio.setPlaybackMode('off')} />
                                                <span className="ml-1">{t('frequencyNever')}</span>
                                            </label>
                                            <label className="flex items-center gap-1">
                                                <input type="radio" name="playbackMode" checked={audio.playbackMode === 'occasional'} onChange={() => audio.setPlaybackMode('occasional')} />
                                                <span className="ml-1">{t('frequencyOccasional')}</span>
                                            </label>
                                            <label className="flex items-center gap-1">
                                                <input type="radio" name="playbackMode" checked={audio.playbackMode === 'always'} onChange={() => audio.setPlaybackMode('always')} />
                                                <span className="ml-1">{t('frequencyAlways')}</span>
                                            </label>
                                        </div>
                                        {audio.playbackMode === 'occasional' && (
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs text-muted-foreground">{t('playbackInterval')}</label>
                                                <input type="number" min={1} value={audio.playbackIntervalMinutes} onChange={(e) => audio.setPlaybackIntervalMinutes(Number(e.target.value) || 1)} className="w-20 p-1 rounded bg-popover" />
                                                <div className="text-xs text-muted-foreground">Một bài sẽ tự phát sau mỗi khoảng đã chọn.</div>
                                            </div>
                                        )}
                                        {audio.playbackMode === 'always' && (
                                            <div className="text-xs text-muted-foreground">Luôn phát liên tiếp: sau khi 1 bài kết thúc sẽ phát tiếp sau 5 giây.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="gameplay" className="space-y-6">
                            <div className="flex items-center justify-between space-x-4">
                                <Label htmlFor="game-mode" className="flex flex-col space-y-1">
                                    <span className="font-semibold flex items-center gap-2"><BrainCircuit /> {t('aiStoryteller')}</span>
                                    <span className="font-normal leading-snug text-muted-foreground">{t('aiStorytellerDesc')}</span>
                                </Label>
                                <Switch id="game-mode" checked={settings.gameMode === 'ai'} onCheckedChange={handleGameModeChange} />
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
                            <Separator />
                            <div className="space-y-3">
                                <Label className="font-semibold flex items-center gap-2">⚙️ Performance</Label>
                                <p className="text-sm leading-snug text-muted-foreground">Frame-limiting controls to improve performance on low-end devices or reduce power consumption.</p>
                                <div className="space-y-3 pl-4">
                                    <div>
                                        <Label className="text-sm">Target FPS</Label>
                                        <div className="flex items-center gap-2 mt-2">
                                            <input
                                                type="number"
                                                min={30}
                                                max={120}
                                                step={10}
                                                defaultValue={localStorage.getItem('dl_fps_target') || '60'}
                                                onChange={(e) => {
                                                    const val = Math.max(30, Math.min(120, Number(e.target.value) || 60));
                                                    localStorage.setItem('dl_fps_target', String(val));
                                                }}
                                                className="w-20 p-1 rounded bg-popover"
                                            />
                                            <span className="text-xs text-muted-foreground">FPS (30-120)</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">Sets maximum frames-per-second limit. Lower values = less power usage.</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="vsync-toggle"
                                            defaultChecked={localStorage.getItem('dl_vsync') !== '0'}
                                            onChange={(e) => {
                                                localStorage.setItem('dl_vsync', e.target.checked ? '1' : '0');
                                            }}
                                            className="w-4 h-4 rounded"
                                        />
                                        <Label htmlFor="vsync-toggle" className="text-sm">Enable VSync (disables frame-limiter, uses monitor refresh rate)</Label>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">When VSync is ON: Frame-limiter disabled, animations use native monitor refresh rate (~60Hz). When VSync is OFF: Frame-limiter applies target FPS cap. Changes take effect immediately.</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between space-x-4">
                                <Label htmlFor="controls-scroll-switch" className="flex flex-col space-y-1">
                                    <span className="font-semibold">{t('preventControlsScroll') || 'Prevent controls auto-scroll'}</span>
                                    <span className="font-normal leading-snug text-muted-foreground">{t('preventControlsScrollDesc') || 'When enabled, focusing the controls input on desktop will avoid auto-scrolling the controls panel.'}</span>
                                </Label>
                                <Switch id="controls-scroll-switch" checked={settings.controlsPreventScroll ?? true} onCheckedChange={(v) => setSettings({ controlsPreventScroll: !!v })} />
                            </div>
                            <div className="flex items-center justify-between space-x-4 mt-3">
                                <Label htmlFor="auto-pickup-switch" className="flex flex-col space-y-1">
                                    <span className="font-semibold">{t('autoPickup') || 'Auto Pick Up'}</span>
                                    <span className="font-normal leading-snug text-muted-foreground">{t('autoPickupDesc') || 'Automatically pick up items when you move onto a tile that contains items.'}</span>
                                </Label>
                                <Switch id="auto-pickup-switch" checked={!!settings.autoPickup} onCheckedChange={(v) => setSettings({ autoPickup: !!v })} />
                            </div>
                            <Separator />
                            <div className="space-y-3">
                                <Label className="font-semibold flex items-center gap-2">⏱️ {t('idleProgressionSection')}</Label>
                                <p className="text-sm leading-snug text-muted-foreground">
                                    {t('idleProgressionSectionDesc')}
                                </p>
                                <div className="flex items-center justify-between space-x-4 pl-4">
                                    <Label htmlFor="pause-idle-switch" className="flex flex-col space-y-1">
                                        <span className="font-semibold">{t('pauseIdleProgression') || 'Pause Idle Progression'}</span>
                                        <span className="font-normal leading-snug text-muted-foreground">{t('pauseIdleProgressionDesc') || 'When enabled, the world will not progress when you are idle or have the app backgrounded.'}</span>
                                    </Label>
                                    <Switch id="pause-idle-switch" checked={settings.pauseGameIdleProgression ?? false} onCheckedChange={(v) => setSettings({ pauseGameIdleProgression: !!v })} />
                                </div>
                            </div>
                            <div>
                                <Label className="font-semibold mt-4">{t('keyBindings') || 'Key bindings'}</Label>
                                <p className="text-sm text-muted-foreground mb-2">{t('keyBindingsDesc') || 'Customize keyboard shortcuts for movement and common actions.'}</p>
                                <KeyBindingsEditor settings={settings} setSettings={setSettings} />
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

// Simple key bindings editor used inside SettingsPopup. It listens for a single key press
// when the user clicks "Change" and persists the result into settings via setSettings.
function KeyBindingsEditor({ settings, setSettings }: { settings: any; setSettings: (s: any) => void }) {
    const { t } = useLanguage();
    const [listeningFor, setListeningFor] = useState<string | null>(null);

    useEffect(() => {
        if (!listeningFor) return;
        const handler = (e: KeyboardEvent) => {
            e.preventDefault?.();
            const key = e.key;
            // update the specific binding
            setSettings({ keyBindings: { ...(settings.keyBindings || {}), [listeningFor]: [key] } });
            setListeningFor(null);
        };
        const cancel = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setListeningFor(null);
        };
        window.addEventListener('keydown', handler, { capture: true });
        window.addEventListener('keydown', cancel);
        return () => {
            window.removeEventListener('keydown', handler, { capture: true });
            window.removeEventListener('keydown', cancel);
        };
    }, [listeningFor, setSettings, settings.keyBindings]);

    const getLabel = (k: string) => {
        const val = settings?.keyBindings?.[k];
        if (!val) return '(unset)';
        return Array.isArray(val) ? val.join(', ') : String(val);
    };

    const resetDefaults = () => {
        localStorage.removeItem('gameSettings');
        // Reload page so SettingsProvider rehydrates defaults
        window.location.reload();
    };

    return (
        <div className="space-y-2">
            {[
                { key: 'moveUp', label: t('moveUp') || 'Move Up' },
                { key: 'moveDown', label: t('moveDown') || 'Move Down' },
                { key: 'moveLeft', label: t('moveLeft') || 'Move Left' },
                { key: 'moveRight', label: t('moveRight') || 'Move Right' },
                { key: 'attack', label: t('attack') || 'Attack' },
                { key: 'openInventory', label: t('inventoryShort') || 'Inventory' },
                { key: 'openStatus', label: t('statusShort') || 'Status' },
                { key: 'openMap', label: t('minimap') || 'Map' },
                { key: 'openCrafting', label: t('craftingShort') || 'Crafting' },
                { key: 'pickUp', label: t('pickUpItems') || 'Pick up items' },
                { key: 'hot1', label: 'Hotkey 1' },
                { key: 'hot2', label: 'Hotkey 2' },
                { key: 'hot3', label: 'Hotkey 3' },
                { key: 'hot4', label: 'Hotkey 4' },
                { key: 'hot5', label: 'Hotkey 5' },
            ].map((row) => (
                <div key={row.key} className="flex items-center justify-between">
                    <div className="text-sm">{row.label}</div>
                    <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">{getLabel(row.key)}</div>
                        <Button size="sm" onClick={() => setListeningFor(row.key)}>{listeningFor === row.key ? (t('pressAnyKey') || 'Press any key...') : (t('change') || 'Change')}</Button>
                    </div>
                </div>
            ))}
            <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setSettings({ keyBindings: settings.keyBindings })}>{t('save') || 'Save'}</Button>
                <Button variant="destructive" onClick={resetDefaults}>{t('resetToDefaults') || 'Reset to defaults'}</Button>
            </div>
        </div>
    );
}
