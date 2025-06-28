"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateWorldSetup, type WorldConcept } from "@/ai/flows/generate-world-setup";
import { suggestKeywords } from "@/ai/flows/suggest-keywords";
import { Sparkles, Wand2, ArrowRight, BrainCircuit, Loader2 } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { Separator } from "../ui/separator";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { useLanguage } from "@/context/language-context";


interface WorldSetupProps {
    onWorldCreated: (worldSetup: WorldConcept) => void;
}

type Selection = {
    worldName: number;
    initialNarrative: number;
    startingBiome: number;
    playerInventory: number;
    initialQuests: number;
};

export function WorldSetup({ onWorldCreated }: WorldSetupProps) {
    const { t, language } = useLanguage();
    
    const [step, setStep] = useState(0);
    const [userInput, setUserInput] = useState("");
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [generatedConcepts, setGeneratedConcepts] = useState<WorldConcept[] | null>(null);
    const [selection, setSelection] = useState<Selection>({
        worldName: 0,
        initialNarrative: 0,
        startingBiome: 0,
        playerInventory: 0,
        initialQuests: 0,
    });
    
    const [apiWorldName, setApiWorldName] = useState<CarouselApi>();
    const [apiNarrative, setApiNarrative] = useState<CarouselApi>();
    const [apiBiome, setApiBiome] = useState<CarouselApi>();
    const [apiInventory, setApiInventory] = useState<CarouselApi>();
    const [apiQuests, setApiQuests] = useState<CarouselApi>();

    const { toast } = useToast();

    const examplePrompts = [
        t('example1'),
        t('example2'),
        t('example3'),
        t('example4'),
    ];

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
        setIsLoading(true);
        setGeneratedConcepts(null);
        setStep(1); // Move to the next step to show loading
        try {
            const result = await generateWorldSetup({ userInput, language });
            setGeneratedConcepts(result.concepts);
        } catch (error) {
            console.error("Failed to generate world:", error);
            toast({ title: t('worldGenError'), description: t('worldGenErrorDesc'), variant: "destructive" });
            setStep(0); // Go back if error
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartGame = () => {
        if (!generatedConcepts) return;

        // Construct the final world object based on user selections
        const finalWorld: WorldConcept = {
            worldName: generatedConcepts[selection.worldName].worldName,
            initialNarrative: generatedConcepts[selection.initialNarrative].initialNarrative,
            startingBiome: generatedConcepts[selection.startingBiome].startingBiome,
            playerInventory: generatedConcepts[selection.playerInventory].playerInventory,
            initialQuests: generatedConcepts[selection.initialQuests].initialQuests,
        };
        onWorldCreated(finalWorld);
    }
    
    const renderStep0 = () => (
        <>
            <CardHeader>
                <CardTitle className="font-headline text-3xl flex items-center gap-3"><Wand2 /> {t('worldSetupTitle')}</CardTitle>
                <CardDescription>{t('worldSetupStep1')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Textarea
                    placeholder={t('worldSetupPlaceholder')}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    rows={4}
                    className="text-base"
                />
                <div className="space-y-2">
                    <Button onClick={handleSuggest} disabled={isSuggesting || !userInput.trim()} variant="outline">
                        {isSuggesting ? <Loader2 className="animate-spin mr-2" /> : <BrainCircuit className="mr-2"/>}
                        {isSuggesting ? t('suggesting') : t('suggestKeywords')}
                    </Button>
                    {suggestedKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {suggestedKeywords.map((keyword, i) => (
                                <button
                                    key={i}
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
                                onClick={() => setUserInput(prompt)}
                                className="text-left p-2 rounded-md hover:bg-muted transition-colors text-accent text-xs"
                            >
                                &raquo; {prompt}
                            </button>
                        ))}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button onClick={handleGenerate}>
                    {t('generateWorlds')} <ArrowRight className="ml-2"/>
                </Button>
            </CardFooter>
        </>
    );

    const renderStep1 = () => (
        <>
            <CardHeader>
                <CardTitle className="font-headline text-3xl flex items-center gap-3"><Sparkles /> {t('mixAndMatchTitle')}</CardTitle>
                <CardDescription>{t('worldSetupStep2')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {isLoading ? (
                    <div className="text-center py-10">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                        <p className="mt-4 text-muted-foreground">{t('generatingUniverses')}</p>
                    </div>
                ) : (
                    generatedConcepts && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                             {/* World Name */}
                             <div className="space-y-2">
                                <h3 className="text-lg font-semibold font-headline text-center">{t('worldName')}</h3>
                                <Carousel setApi={setApiWorldName} opts={{ align: "start", loop: true }} className="w-full max-w-sm mx-auto">
                                    <CarouselContent>
                                        {generatedConcepts.map((concept, index) => (
                                            <CarouselItem key={index}>
                                                <div className="p-1">
                                                    <Card className="flex items-center justify-center p-6 h-24 shadow-inner bg-muted/30">
                                                        <CardTitle className="text-xl text-center font-headline">{concept.worldName}</CardTitle>
                                                    </Card>
                                                </div>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    <CarouselPrevious />
                                    <CarouselNext />
                                </Carousel>
                            </div>

                            <Separator />

                            {/* Narrative */}
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold font-headline text-center">{t('openingNarrative')}</h3>
                                <Carousel setApi={setApiNarrative} opts={{ align: "start", loop: true }} className="w-full max-w-2xl mx-auto">
                                    <CarouselContent>
                                        {generatedConcepts.map((concept, index) => (
                                            <CarouselItem key={index}>
                                                <div className="p-1">
                                                    <Card className="shadow-inner bg-muted/30">
                                                        <CardContent className="p-4 h-40 overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
                                                            <p>{concept.initialNarrative}</p>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    <CarouselPrevious />
                                    <CarouselNext />
                                </Carousel>
                            </div>
                            
                            <Separator />

                             {/* Biome */}
                             <div className="space-y-2">
                                <h3 className="text-lg font-semibold font-headline text-center">{t('startingBiome')}</h3>
                                <Carousel setApi={setApiBiome} opts={{ align: "start", loop: true }} className="w-full max-w-xs mx-auto">
                                    <CarouselContent>
                                        {generatedConcepts.map((concept, index) => (
                                            <CarouselItem key={index}>
                                                <div className="p-1">
                                                    <Card className="flex items-center justify-center p-4 h-20 shadow-inner bg-muted/30">
                                                        <p className="font-semibold text-center text-lg capitalize">{concept.startingBiome}</p>
                                                    </Card>
                                                </div>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    <CarouselPrevious />
                                    <CarouselNext />
                                </Carousel>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Inventory */}
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold font-headline text-center">{t('startingEquipment')}</h3>
                                    <Carousel setApi={setApiInventory} opts={{ align: "start", loop: true }} className="w-full max-w-md mx-auto">
                                        <CarouselContent>
                                            {generatedConcepts.map((concept, index) => (
                                                <CarouselItem key={index}>
                                                    <div className="p-1">
                                                        <Card className="h-40 shadow-inner bg-muted/30">
                                                            <CardHeader className="p-4">
                                                                <CardDescription>{t('itemsFromChoice', {index: index + 1})}</CardDescription>
                                                            </CardHeader>
                                                            <CardContent className="p-4 pt-0">
                                                                <ul className="list-disc list-inside text-sm text-muted-foreground">
                                                                    {concept.playerInventory.map(item => <li key={item}>{item}</li>)}
                                                                </ul>
                                                            </CardContent>
                                                        </Card>
                                                    </div>
                                                </CarouselItem>
                                            ))}
                                        </CarouselContent>
                                        <CarouselPrevious />
                                        <CarouselNext />
                                    </Carousel>
                                </div>

                                {/* Quests */}
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold font-headline text-center">{t('firstQuest')}</h3>
                                    <Carousel setApi={setApiQuests} opts={{ align: "start", loop: true }} className="w-full max-w-md mx-auto">
                                        <CarouselContent>
                                            {generatedConcepts.map((concept, index) => (
                                                <CarouselItem key={index}>
                                                    <div className="p-1">
                                                        <Card className="h-40 shadow-inner bg-muted/30">
                                                            <CardHeader className="p-4">
                                                                <CardDescription>{t('questFromChoice', {index: index + 1})}</CardDescription>
                                                            </CardHeader>
                                                            <CardContent className="p-4 pt-0">
                                                                <ul className="list-disc list-inside text-sm text-muted-foreground">
                                                                    {concept.initialQuests.map(item => <li key={item}>{item}</li>)}
                                                                </ul>
                                                            </CardContent>
                                                        </Card>
                                                    </div>
                                                </CarouselItem>
                                            ))}
                                        </CarouselContent>
                                        <CarouselPrevious />
                                        <CarouselNext />
                                    </Carousel>
                                </div>
                            </div>
                            
                            <div className="!mt-8 p-4 border-t">
                                <h3 className="font-headline text-xl font-bold">{t('yourWorld')}</h3>
                                <p className="text-muted-foreground">{t('yourWorldDescription')}</p>
                                <Card className="mt-4 p-4 bg-background">
                                    <h4 className="font-bold text-lg">{generatedConcepts[selection.worldName].worldName}</h4>
                                    <p className="italic text-muted-foreground mt-2">{generatedConcepts[selection.initialNarrative].initialNarrative}</p>
                                </Card>
                            </div>
                        </div>
                    )
                )}
            </CardContent>
            <CardFooter className="flex justify-between gap-2">
                <Button variant="ghost" onClick={() => { setStep(0); setGeneratedConcepts(null); }}>
                    {t('backAndEdit')}
                </Button>
                <Button onClick={handleStartGame} disabled={isLoading || !generatedConcepts}>
                    {t('startAdventure')}
                </Button>
            </CardFooter>
        </>
    )

    return (
        <div className="flex items-center justify-center min-h-dvh bg-background text-foreground p-4 md:p-8 font-body">
            <Card className="w-full max-w-5xl shadow-2xl animate-in fade-in duration-500">
                {step === 0 ? renderStep0() : renderStep1()}
            </Card>
        </div>
    );
}
