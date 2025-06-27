"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateWorldSetup, type GenerateWorldSetupOutput } from "@/ai/flows/generate-world-setup";
import { Sparkles, Wand2 } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

interface WorldSetupProps {
    onWorldCreated: (worldSetup: GenerateWorldSetupOutput) => void;
}

const examplePrompts = [
    "A post-apocalyptic city overrun by sentient plants.",
    "A high-fantasy kingdom in the clouds.",
    "A cyberpunk noir detective story on Mars.",
    "A tranquil village of talking animals with a dark secret.",
];

export function WorldSetup({ onWorldCreated }: WorldSetupProps) {
    const [userInput, setUserInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [generatedWorld, setGeneratedWorld] = useState<GenerateWorldSetupOutput | null>(null);
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!userInput.trim()) {
            toast({
                title: "Uh oh!",
                description: "Please describe the world you want to create.",
                variant: "destructive",
            });
            return;
        }
        setIsLoading(true);
        setGeneratedWorld(null);
        try {
            const result = await generateWorldSetup({ userInput });
            setGeneratedWorld(result);
        } catch (error) {
            console.error("Failed to generate world:", error);
            toast({
                title: "Error Creating World",
                description: "The cosmic energies are misaligned. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartGame = () => {
        if (generatedWorld) {
            onWorldCreated(generatedWorld);
        }
    }

    return (
        <div className="flex items-center justify-center min-h-dvh bg-background text-foreground p-4 md:p-8 font-body">
            <Card className="w-full max-w-2xl shadow-2xl">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl flex items-center gap-3"><Wand2 /> Create Your World</CardTitle>
                    <CardDescription>Describe the adventure you want to embark on. Be as brief or as detailed as you like.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!generatedWorld ? (
                        <div className="space-y-4">
                            <Textarea
                                placeholder="For example: 'A lonely lighthouse on a storm-wracked coast, haunted by a ghost.'"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                rows={4}
                                disabled={isLoading}
                                className="text-base"
                            />
                            <div className="text-sm text-muted-foreground">
                                <h4 className="font-semibold mb-2">Or try one of these ideas:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {examplePrompts.map((prompt) => (
                                        <button
                                            key={prompt}
                                            onClick={() => setUserInput(prompt)}
                                            disabled={isLoading}
                                            className="text-left p-2 rounded-md hover:bg-muted transition-colors text-accent-foreground/80 text-xs"
                                        >
                                            &raquo; {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 p-4 bg-muted/50 rounded-lg animate-in fade-in">
                            {isLoading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-6 w-1/2" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-[80%]" />
                                    <Skeleton className="h-4 w-[90%]" />
                                </div>
                            ) : (
                                <>
                                    <h2 className="font-headline text-2xl font-bold">{generatedWorld.worldName}</h2>
                                    <p className="text-muted-foreground">{generatedWorld.initialNarrative}</p>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <h3 className="font-semibold mb-1">Starting Items</h3>
                                            <ul className="list-disc list-inside">
                                                {generatedWorld.playerInventory.map(item => <li key={item}>{item}</li>)}
                                            </ul>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-1">Starting Quests</h3>
                                            <ul className="list-disc list-inside">
                                                {generatedWorld.initialQuests.map(quest => <li key={quest}>{quest}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    {generatedWorld && !isLoading && (
                        <Button variant="ghost" onClick={() => setGeneratedWorld(null)}>
                            &larr; Go Back & Edit
                        </Button>
                    )}
                    {generatedWorld && !isLoading ? (
                        <Button onClick={handleStartGame}>
                            Embark on Your Adventure &rarr;
                        </Button>
                    ) : (
                        <Button onClick={handleGenerate} disabled={isLoading}>
                            {isLoading ? "Generating..." : "Generate World"}
                            <Sparkles className="ml-2" />
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
