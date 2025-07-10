
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
    const [isPremade, setIsPremade] = useState(false);
    
    const [api, setApi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)
    const [count, setCount] = useState(0)
    
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


     useEffect(() => {
        if (!api) {
          return
        }
    
        setCount(api.scrollSnapList().length)
        setCurrent(api.selectedScrollSnap() + 1)
    
        api.on("select", () => {
          setCurrent(api.selectedScrollSnap() + 1)
        })
      }, [api])


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

        // Check for secret keyword
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
        
        // If it's a premade world, there can be multiple concepts. Pick one.
        // If it's AI-generated, there's only one concept.
        const conceptIndex = isPremade ? (api?.selectedScrollSnap() || 0) : 0;
        const selectedConcept = generatedData.concepts[conceptIndex];
        
        // We only need the selected concept and the shared catalogs to start the game.
        const finalOutput: GenerateWorldSetupOutput = {
            customItemCatalog: generatedData.customItemCatalog,
            customStructures: generatedData.customStructures,
            concepts: [selectedConcept as any], // Cast to bypass strict type check for biome
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
                 <CardDescription>{isPremade ? "Choose a starting scenario for this pre-made world." : t('worldGenResultDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {isLoading ? (
                    <div className="text-center py-10">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                        <p className="mt-4 text-muted-foreground">{t('generatingUniverses')}</p>
                    </div>
                ) : (
                    generatedData && (
                         <Carousel setApi={setApi} className="w-full max-w-xl mx-auto">
                            <CarouselContent>
                                {generatedData.concepts.map((concept, index) => (
                                    <CarouselItem key={index}>
                                        <div className="p-1">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="font-headline text-center">{t(concept.worldName as TranslationKey)}</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                     <div className="prose prose-sm dark:prose-invert max-w-none h-24 overflow-y-auto p-2 bg-muted/30 rounded-md">
                                                        <p>{t(concept.initialNarrative as TranslationKey)}</p>
                                                    </div>
                                                    <Separator/>
                                                    <div className="text-sm">
                                                        <p><span className="font-semibold">Biome:</span> {t(concept.startingBiome as TranslationKey)}</p>
                                                        <p><span className="font-semibold">Skill:</span> {t(concept.startingSkill.name as TranslationKey)}</p>
                                                        <p><span className="font-semibold">Quests:</span> {concept.initialQuests.map(q => t(q as TranslationKey)).join(', ')}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                             <CarouselPrevious />
                            <CarouselNext />
                             <div className="py-2 text-center text-sm text-muted-foreground">
                                Scenario {current} of {count}
                            </div>
                        </Carousel>
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
