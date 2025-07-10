
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateWorldSetup, type GenerateWorldSetupOutput } from "@/ai/flows/generate-world-setup";
import { suggestKeywords } from "@/ai/flows/suggest-keywords";
import { Skeleton } from "../ui/skeleton";
import { Separator } from "../ui/separator";
import { useLanguage } from "@/context/language-context";
import type { WorldConcept, Skill, PlayerItem, GeneratedItem } from "@/lib/game/types";
import { premadeWorlds } from "@/lib/game/data/premade-worlds";
import type { TranslationKey } from "@/lib/i18n";
import { SettingsPopup } from "./settings-popup";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { Sparkles, Wand2, ArrowRight, BrainCircuit, Loader2, Settings, ArrowLeft, ChevronLeft, ChevronRight } from "./icons";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";

interface WorldSetupProps {
    onWorldCreated: (worldSetupData: GenerateWorldSetupOutput) => void;
}

type Selection = {
    worldName: number;
    initialNarrative: number;
    startingBiome: number;
    playerInventory: number;
    initialQuests: number;
    startingSkill: number;
};

// Component to render a selectable row in the mix-and-match UI
const SelectionRow = ({ label, options, selectedIndex, onSelect, renderOption }: {
    label: string;
    options: any[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    renderOption: (option: any) => React.ReactNode;
}) => (
    <div className="space-y-2">
        <Label className="text-lg font-headline font-semibold">{label}</Label>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-full" onClick={() => onSelect((selectedIndex - 1 + options.length) % options.length)}>
                <ChevronLeft />
            </Button>
            <Card className="flex-grow p-4 bg-muted/30 min-h-[80px]">
                {renderOption(options[selectedIndex])}
            </Card>
            <Button variant="outline" size="icon" className="h-full" onClick={() => onSelect((selectedIndex + 1) % options.length)}>
                <ChevronRight />
            </Button>
        </div>
    </div>
);

// A simple Label component for the UI
const Label = ({ className, ...props }: React.ComponentProps<"label">) => (
  <label className={cn("font-medium text-foreground/80", className)} {...props} />
);


export function WorldSetup({ onWorldCreated }: WorldSetupProps) {
    const { t, language } = useLanguage();
    
    const [step, setStep] = useState(0);
    const [userInput, setUserInput] = useState("");
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
    const [examplePrompts, setExamplePrompts] = useState<string[]>([]);
    const [worldDescription, setWorldDescription] = useState("");
    
    const [isLoading, setIsLoading] = useState(false);
    const [generatedData, setGeneratedData] = useState<GenerateWorldSetupOutput | null>(null);
    const [isPremade, setIsPremade] = useState(false);
    
    const [selection, setSelection] = useState<Selection>({
        worldName: 0,
        initialNarrative: 0,
        startingBiome: 0,
        playerInventory: 0,
        initialQuests: 0,
        startingSkill: 0,
    });
    
    const [isSettingsOpen, setSettingsOpen] = useState(false);

    const { toast } = useToast();

    useEffect(() => {
        const allExampleKeys: TranslationKey[] = [
            'example1', 'example2', 'example3', 'example4', 'example5', 
            'example6', 'example7', 'example8', 'example9', 'example10',
            'example11', 'example12'
        ];

        const shuffled = [...allExampleKeys].sort(() => 0.5 - Math.random());
        const selectedPrompts = shuffled.slice(0, 6).map(key => t(key));
        setExamplePrompts(selectedPrompts);

        const descriptionKeys: TranslationKey[] = [
            'worldSetupDesc1',
            'worldSetupDesc2',
            'worldSetupDesc3',
            'worldSetupDesc4',
        ];
        const randomKey = descriptionKeys[Math.floor(Math.random() * descriptionKeys.length)];
        setWorldDescription(t(randomKey));

    }, [t]);

    const handleSuggest = async () => {
        if (!userInput.trim()) return;
        setIsSuggesting(true);
        try {
            const result = await suggestKeywords({ userInput, language });
            setSuggestedKeywords(result.keywords);
        } catch (error) {
            console.error("Failed to suggest keywords:", error);
            toast({ title: t('error'), description: t('suggestionError'), variant: "destructive" });
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleGenerate = async () => {
        if (!userInput.trim()) {
            toast({ title: t('noIdeaError'), description: t('noIdeaErrorDesc'), variant: "destructive" });
            return;
        }

        const lowerInput = userInput.trim().toLowerCase();
        
        setIsLoading(true);
        setGeneratedData(null);
        setStep(1);

        if (premadeWorlds[lowerInput]) {
            setGeneratedData(premadeWorlds[lowerInput]);
            setIsPremade(true);
            setIsLoading(false);
            return;
        }
        
        setIsPremade(false);

        try {
            const result = await generateWorldSetup({ userInput, language });
            setGeneratedData(result);
        } catch (error) {
            console.error("Failed to generate world:", error);
            toast({ title: t('worldGenError'), description: t('worldGenErrorDesc'), variant: "destructive" });
            setStep(0);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartGame = () => {
        if (!generatedData) return;
        
        const finalConcept: WorldConcept = {
            worldName: generatedData.concepts[selection.worldName].worldName,
            initialNarrative: generatedData.concepts[selection.initialNarrative].initialNarrative,
            startingBiome: generatedData.concepts[selection.startingBiome].startingBiome,
            playerInventory: generatedData.concepts[selection.playerInventory].playerInventory,
            initialQuests: generatedData.concepts[selection.initialQuests].initialQuests,
            startingSkill: generatedData.concepts[selection.startingSkill].startingSkill,
            customStructures: generatedData.customStructures, // Shared across concepts
            customItemCatalog: generatedData.customItemCatalog, // Shared across concepts
        };
        
        const finalOutput: GenerateWorldSetupOutput = {
            customItemCatalog: generatedData.customItemCatalog,
            customStructures: generatedData.customStructures,
            concepts: [finalConcept as any],
        };

        onWorldCreated(finalOutput);
    }
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleGenerate();
        }
    };
    
    const renderStep0 = () => (
        <>
            <CardHeader>
                <CardTitle className="font-headline text-3xl flex items-center gap-3"><Sparkles /> {t('worldSetupTitle')}</CardTitle>
                <CardDescription>{worldDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Textarea
                    placeholder={t('worldSetupPlaceholder')}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={4}
                    className="text-base"
                />
                <div className="space-y-2">
                    <Button onClick={handleSuggest} disabled={isSuggesting || !userInput.trim()} variant="outline" type="button">
                        {isSuggesting ? <Loader2 className="animate-spin mr-2" /> : <BrainCircuit className="mr-2"/>}
                        {isSuggesting ? t('suggesting') : t('suggestKeywords')}
                    </Button>
                    {suggestedKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {suggestedKeywords.map((keyword, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setUserInput(prev => `${prev} ${keyword}`)}
                                    className="px-3 py-1 rounded-full bg-accent/20 text-accent-foreground text-sm hover:bg-accent/40 transition-colors"
                                >
                                    + {keyword}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                 <Separator />
                <div className="text-sm text-muted-foreground">
                    <h4 className="font-semibold mb-2">{t('tryTheseIdeas')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {examplePrompts.map((prompt) => (
                            <button
                                key={prompt}
                                type="button"
                                onClick={() => setUserInput(prompt.split("(Try: '")[1].replace("')", ""))}
                                className="text-left p-2 rounded-md hover:bg-muted transition-colors text-accent text-sm"
                            >
                                &raquo; {prompt}
                            </button>
                        ))}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button onClick={handleGenerate} type="button">
                    {t('generateWorlds')} <ArrowRight className="ml-2"/>
                </Button>
            </CardFooter>
        </>
    );

    const renderStep1 = () => (
        <>
            <CardHeader>
                 <CardTitle className="font-headline text-3xl flex items-center gap-3"><Sparkles /> {t('worldGenResultTitle')}</CardTitle>
                 <CardDescription>{isPremade ? t('premadeWorldSelectDesc') : t('worldGenResultDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4 py-10">
                        <div className="text-center">
                          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                          <p className="mt-4 text-muted-foreground">{t('generatingUniverses')}</p>
                        </div>
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                ) : (
                    generatedData && (
                        <ScrollArea className="max-h-[60vh]">
                            <div className="space-y-6 p-4">
                                <SelectionRow 
                                    label={t('worldName')}
                                    options={generatedData.concepts.map(c => c.worldName)}
                                    selectedIndex={selection.worldName}
                                    onSelect={(index) => setSelection(s => ({...s, worldName: index}))}
                                    renderOption={(option) => <p className="text-2xl font-bold font-headline">{t(option as TranslationKey)}</p>}
                                />
                                <SelectionRow 
                                    label={t('openingNarrative')}
                                    options={generatedData.concepts.map(c => c.initialNarrative)}
                                    selectedIndex={selection.initialNarrative}
                                    onSelect={(index) => setSelection(s => ({...s, initialNarrative: index}))}
                                    renderOption={(option) => <p className="text-sm italic">{t(option as TranslationKey)}</p>}
                                />
                                <SelectionRow 
                                    label={t('startingBiome')}
                                    options={generatedData.concepts.map(c => c.startingBiome)}
                                    selectedIndex={selection.startingBiome}
                                    onSelect={(index) => setSelection(s => ({...s, startingBiome: index}))}
                                    renderOption={(option) => <p className="font-semibold">{t(option as TranslationKey)}</p>}
                                />
                                 <SelectionRow 
                                    label={t('startingSkill')}
                                    options={generatedData.concepts.map(c => c.startingSkill)}
                                    selectedIndex={selection.startingSkill}
                                    onSelect={(index) => setSelection(s => ({...s, startingSkill: index}))}
                                    renderOption={(option: Skill) => 
                                        <div>
                                            <p className="font-semibold">{t(option.name as TranslationKey)}</p>
                                            <p className="text-xs text-muted-foreground">{t(option.description as TranslationKey)}</p>
                                        </div>
                                    }
                                />
                                <SelectionRow 
                                    label={t('firstQuest')}
                                    options={generatedData.concepts.map(c => c.initialQuests)}
                                    selectedIndex={selection.initialQuests}
                                    onSelect={(index) => setSelection(s => ({...s, initialQuests: index}))}
                                    renderOption={(option: string[]) => 
                                        <ul className="list-disc list-inside text-sm">
                                            {option.map((q, i) => <li key={i}>{t(q as TranslationKey)}</li>)}
                                        </ul>
                                    }
                                />
                                <SelectionRow 
                                    label={t('startingEquipment')}
                                    options={generatedData.concepts.map(c => c.playerInventory)}
                                    selectedIndex={selection.playerInventory}
                                    onSelect={(index) => setSelection(s => ({...s, playerInventory: index}))}
                                    renderOption={(option: PlayerItem[]) => 
                                        <div className="flex flex-wrap gap-4 text-sm">
                                            {option.map((item, i) => {
                                                const def = generatedData.customItemCatalog.find(d => d.name === item.name);
                                                return <span key={i}>{def?.emoji} {t(item.name as TranslationKey)} (x{item.quantity})</span>
                                            })}
                                        </div>
                                    }
                                />
                            </div>
                        </ScrollArea>
                    )
                )}
            </CardContent>
            <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
                <Button variant="ghost" onClick={() => { setStep(0); setGeneratedData(null); }} type="button">
                    <ArrowLeft className="mr-2"/> {t('backAndEdit')}
                </Button>
                <Button onClick={handleStartGame} disabled={isLoading || !generatedData} type="button">
                    {t('startAdventure')} <ArrowRight className="ml-2"/>
                </Button>
            </CardFooter>
        </>
    )

    return (
        <TooltipProvider>
            <div className="flex items-center justify-center min-h-dvh bg-background text-foreground p-4 md:p-8 font-body">
                <Card className="w-full max-w-5xl shadow-2xl animate-in fade-in duration-500 relative">
                     <div className="absolute top-4 right-4 z-10">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button onClick={() => setSettingsOpen(true)} variant="ghost" size="icon" type="button">
                                    <Settings className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('gameSettings')}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    {step === 0 ? renderStep0() : renderStep1()}
                </Card>
                <SettingsPopup open={isSettingsOpen} onOpenChange={setSettingsOpen} isInGame={false} />
            </div>
        </TooltipProvider>
    );
}

    