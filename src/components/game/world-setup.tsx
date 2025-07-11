
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
import type { WorldConcept, Skill, PlayerItem, GeneratedItem, Terrain } from "@/lib/game/types";
import { premadeWorlds } from "@/lib/game/data/premade-worlds";
import type { TranslationKey } from "@/lib/i18n";
import { SettingsPopup } from "./settings-popup";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { Sparkles, ArrowRight, BrainCircuit, Loader2, Settings, ArrowLeft, ChevronLeft, ChevronRight, BookOpen, Map, WandSparkles, BaggageClaim, ListTodo } from "./icons";
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

// Component to render a selectable card in the new mix-and-match UI
const SelectionCard = ({
  label,
  icon,
  options,
  selectedIndex,
  onSelect,
  renderOption,
  className = ''
}: {
  label: string;
  icon: React.ReactNode;
  options: any[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  renderOption: (option: any) => React.ReactNode;
  className?: string;
}) => (
  <Card className={cn("flex flex-col", className)}>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium flex items-center gap-2">{icon} {label}</CardTitle>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onSelect((selectedIndex - 1 + options.length) % options.length)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">{selectedIndex + 1}/{options.length}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onSelect((selectedIndex + 1) % options.length)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </CardHeader>
    <CardContent className="flex-grow flex items-center justify-center text-center p-4 pt-0 min-h-[90px]">
      {renderOption(options[selectedIndex])}
    </CardContent>
  </Card>
);


export function WorldSetup({ onWorldCreated }: WorldSetupProps) {
    const { t, language } = useLanguage();
    
    const [step, setStep] = useState(0);
    const [userInput, setUserInput] = useState("");
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
    const [examplePrompts, setExamplePrompts] = useState<{text: string; keyword: string | null}[]>([]);
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
        const selectedExamples = shuffled.slice(0, 6).map((key, index) => {
            const text = t(key);
            const match = text.match(/\(Thử: '([^']+)'\)|\(Try: '([^']+)'\)/);
            const keyword = match ? (match[1] || match[2]) : null;
            return {
                text: text.replace(/\s\(Thử: '([^']+)'\)|\s\(Try: '([^']+)'\)/, ''),
                keyword: keyword
            };
        });
        setExamplePrompts(selectedExamples);

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
            const timeoutPromise = new Promise<GenerateWorldSetupOutput>((_, reject) =>
                setTimeout(() => reject(new Error("AI generation timed out after 30 seconds.")), 30000)
            );

            const generationPromise = generateWorldSetup({ userInput, language });
            
            const result = await Promise.race([generationPromise, timeoutPromise]);
            
            setGeneratedData(result);
        } catch (error) {
            console.error("Failed to generate world:", error);
            toast({ title: t('worldGenError'), description: String(error), variant: "destructive" });
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
    
    const handleExampleClick = (prompt: {text: string, keyword: string | null}) => {
        setUserInput(prompt.keyword || prompt.text);
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
                        {examplePrompts.map((prompt, index) => (
                            <button
                                key={`${prompt.text}-${index}`}
                                type="button"
                                onClick={() => handleExampleClick(prompt)}
                                className="text-left p-2 rounded-md hover:bg-muted transition-colors text-accent text-sm flex items-center gap-2"
                            >
                                &raquo; {prompt.text} {prompt.keyword && <span title="Pre-made World">⭐</span>}
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
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="lg:col-span-2">
                            <SelectionCard
                                label={t('worldName')}
                                icon={<Sparkles />}
                                options={generatedData.concepts.map(c => c.worldName)}
                                selectedIndex={selection.worldName}
                                onSelect={(index) => setSelection(s => ({...s, worldName: index}))}
                                renderOption={(option) => <p className="text-xl font-bold font-headline">{t(option as TranslationKey)}</p>}
                            />
                        </div>
                        <SelectionCard
                            label={t('openingNarrative')}
                            icon={<BookOpen />}
                            options={generatedData.concepts.map(c => c.initialNarrative)}
                            selectedIndex={selection.initialNarrative}
                            onSelect={(index) => setSelection(s => ({...s, initialNarrative: index}))}
                            renderOption={(option) => <ScrollArea className="h-24"><p className="text-sm italic text-muted-foreground">{t(option as TranslationKey)}</p></ScrollArea>}
                        />
                        <SelectionCard
                            label={t('startingBiome')}
                            icon={<Map />}
                            options={generatedData.concepts.map(c => c.startingBiome)}
                            selectedIndex={selection.startingBiome}
                            onSelect={(index) => setSelection(s => ({...s, startingBiome: index}))}
                            renderOption={(option) => <p className="font-semibold text-lg">{t(option as TranslationKey)}</p>}
                        />
                         <SelectionCard
                            label={t('startingSkill')}
                            icon={<WandSparkles />}
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
                         <SelectionCard
                            label={t('startingEquipment')}
                            icon={<BaggageClaim />}
                            options={generatedData.concepts.map(c => c.playerInventory)}
                            selectedIndex={selection.playerInventory}
                            onSelect={(index) => setSelection(s => ({...s, playerInventory: index}))}
                            renderOption={(option: PlayerItem[]) => 
                                <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center text-sm">
                                    {option.map((item, i) => {
                                        const allItems = [...(premadeWorlds[userInput.toLowerCase()]?.customItemCatalog || []), ...(generatedData?.customItemCatalog || [])];
                                        const def = allItems.find(d => d.name === item.name);
                                        return <span key={i} className="flex items-center gap-1">{def?.emoji} {t(item.name as TranslationKey)} x{item.quantity}</span>
                                    })}
                                </div>
                            }
                        />
                        <div className="lg:col-span-2">
                          <SelectionCard
                              label={t('firstQuest')}
                              icon={<ListTodo />}
                              options={generatedData.concepts.map(c => c.initialQuests)}
                              selectedIndex={selection.initialQuests}
                              onSelect={(index) => setSelection(s => ({...s, initialQuests: index}))}
                              renderOption={(option: string[]) => 
                                  <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                                      {option.map((q, i) => <li key={i}>{t(q as TranslationKey)}</li>)}
                                  </ul>
                              }
                          />
                        </div>
                      </div>
                    )
                )}
            </CardContent>
            <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-6">
                <Button variant="ghost" onClick={() => { setStep(0); setGeneratedData(null); }} type="button">
                    <ArrowLeft className="mr-2"/> {t('backAndEdit')}
                </Button>
                <Button onClick={handleStartGame} disabled={isLoading || !generatedData} type="button" size="lg">
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
