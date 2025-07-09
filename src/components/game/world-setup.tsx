
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
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { useLanguage } from "@/context/language-context";
import type { WorldConcept, Skill } from "@/lib/game/types";
import { premadeWorlds } from "@/lib/game/data/premade-worlds";
import type { TranslationKey } from "@/lib/i18n";
import { SettingsPopup } from "./settings-popup";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { Sparkles, Wand2, ArrowRight, BrainCircuit, Loader2, Settings, ArrowLeft } from "./icons";

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
    const [selection, setSelection] = useState<Selection>({
        worldName: 0,
        initialNarrative: 0,
        startingBiome: 0,
        playerInventory: 0,
        initialQuests: 0,
        startingSkill: 0,
    });
    
    const [apiWorldName, setApiWorldName] = useState<CarouselApi>();
    const [apiNarrative, setApiNarrative] = useState<CarouselApi>();
    const [apiBiome, setApiBiome] = useState<CarouselApi>();
    const [apiInventory, setApiInventory] = useState<CarouselApi>();
    const [apiQuests, setApiQuests] = useState<CarouselApi>();
    const [apiSkill, setApiSkill] = useState<CarouselApi>();
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


    // Attach listeners to each carousel to update the selection state
    useEffect(() => {
        if (!apiWorldName) return;
        const onSelect = () => setSelection(p => ({ ...p, worldName: apiWorldName.selectedScrollSnap() }));
        apiWorldName.on('select', onSelect);
        return () => { apiWorldName.off('select', onSelect); };
    }, [apiWorldName]);

    useEffect(() => {
        if (!apiNarrative) return;
        const onSelect = () => setSelection(p => ({ ...p, initialNarrative: apiNarrative.selectedScrollSnap() }));
        apiNarrative.on('select', onSelect);
        return () => { apiNarrative.off('select', onSelect); };
    }, [apiNarrative]);
    
    useEffect(() => {
        if (!apiBiome) return;
        const onSelect = () => setSelection(p => ({ ...p, startingBiome: apiBiome.selectedScrollSnap() }));
        apiBiome.on('select', onSelect);
        return () => { apiBiome.off('select', onSelect); };
    }, [apiBiome]);

    useEffect(() => {
        if (!apiInventory) return;
        const onSelect = () => setSelection(p => ({ ...p, playerInventory: apiInventory.selectedScrollSnap() }));
        apiInventory.on('select', onSelect);
        return () => { apiInventory.off('select', onSelect); };
    }, [apiInventory]);

    useEffect(() => {
        if (!apiQuests) return;
        const onSelect = () => setSelection(p => ({ ...p, initialQuests: apiQuests.selectedScrollSnap() }));
        apiQuests.on('select', onSelect);
        return () => { apiQuests.off('select', onSelect); };
    }, [apiQuests]);

    useEffect(() => {
        if (!apiSkill) return;
        const onSelect = () => setSelection(p => ({ ...p, startingSkill: apiSkill.selectedScrollSnap() }));
        apiSkill.on('select', onSelect);
        return () => { apiSkill.off('select', onSelect); };
    }, [apiSkill]);


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

        // Check for secret keyword
        if (premadeWorlds[lowerInput]) {
            onWorldCreated(premadeWorlds[lowerInput]);
            return;
        }

        setIsLoading(true);
        setGeneratedData(null);
        setStep(1);
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
        
        // Use the first concept as there's only one in the array for AI-generated worlds now.
        const finalConcept = generatedData.concepts[0];
        
        const finalOutput: GenerateWorldSetupOutput = {
            customItemCatalog: generatedData.customItemCatalog,
            customStructures: generatedData.customStructures,
            concepts: [finalConcept as any], // Cast to bypass strict type check for biome
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
                 <CardDescription>{t('worldGenResultDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {isLoading ? (
                    <div className="text-center py-10">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                        <p className="mt-4 text-muted-foreground">{t('generatingUniverses')}</p>
                    </div>
                ) : (
                    generatedData && generatedData.concepts[0] && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                             <div className="space-y-2">
                                <h3 className="text-lg font-semibold font-headline text-center">{t('worldName')}</h3>
                                <Card className="flex items-center justify-center p-6 h-24 shadow-inner bg-muted/30 max-w-sm mx-auto">
                                    <CardTitle className="text-xl text-center font-headline">{t(generatedData.concepts[0].worldName as TranslationKey)}</CardTitle>
                                </Card>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold font-headline text-center">{t('openingNarrative')}</h3>
                                <Card className="shadow-inner bg-muted/30 max-w-2xl mx-auto">
                                    <CardContent className="p-4 h-40 overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
                                        <p>{t(generatedData.concepts[0].initialNarrative as TranslationKey)}</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
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
