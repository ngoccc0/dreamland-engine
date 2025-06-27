"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateWorldSetup, type GenerateWorldSetupOutput, type WorldConcept } from "@/ai/flows/generate-world-setup";
import { suggestKeywords } from "@/ai/flows/suggest-keywords";
import { Sparkles, Wand2, ArrowRight, BrainCircuit, Loader2 } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "../ui/separator";

interface WorldSetupProps {
    // A single, finalized world object, constructed from the user's choices.
    onWorldCreated: (worldSetup: WorldConcept) => void;
}

const examplePrompts = [
    "Một thành phố hậu tận thế bị cây cối có tri giác xâm chiếm.",
    "Một vương quốc giả tưởng cao trên mây.",
    "Một câu chuyện trinh thám cyberpunk noir trên Sao Hỏa.",
    "Một ngôi làng yên bình của các loài động vật biết nói với một bí mật đen tối.",
];

type Selection = {
    worldName: number;
    initialNarrative: number;
    startingBiome: number;
    playerInventory: number;
    initialQuests: number;
};

export function WorldSetup({ onWorldCreated }: WorldSetupProps) {
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

    const { toast } = useToast();

    const handleSuggest = async () => {
        if (!userInput.trim()) return;
        setIsSuggesting(true);
        try {
            const result = await suggestKeywords({ userInput });
            setSuggestedKeywords(result.keywords);
        } catch (error) {
            console.error("Failed to suggest keywords:", error);
            toast({ title: "Lỗi", description: "Không thể tạo gợi ý lúc này.", variant: "destructive" });
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleGenerate = async () => {
        if (!userInput.trim()) {
            toast({ title: "Chưa có ý tưởng!", description: "Vui lòng mô tả thế giới bạn muốn tạo.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        setGeneratedConcepts(null);
        setStep(1); // Move to the next step to show loading
        try {
            const result = await generateWorldSetup({ userInput });
            setGeneratedConcepts(result.concepts);
        } catch (error) {
            console.error("Failed to generate world:", error);
            toast({ title: "Lỗi Tạo Thế Giới", description: "Năng lượng vũ trụ đang bị nhiễu loạn. Vui lòng thử lại.", variant: "destructive" });
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
                <CardTitle className="font-headline text-3xl flex items-center gap-3"><Wand2 /> Tạo Thế Giới Của Bạn</CardTitle>
                <CardDescription>Bước 1: Mô tả ý tưởng của bạn. Có thể ngắn gọn hoặc chi tiết.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Textarea
                    placeholder="Ví dụ: 'Một ngọn hải đăng cô độc trên bờ biển bão tố, bị một bóng ma ám ảnh.'"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    rows={4}
                    className="text-base"
                />
                <div className="space-y-2">
                    <Button onClick={handleSuggest} disabled={isSuggesting || !userInput.trim()} variant="outline">
                        {isSuggesting ? <Loader2 className="animate-spin mr-2" /> : <BrainCircuit className="mr-2"/>}
                        Gợi ý từ khóa
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
                    <h4 className="font-semibold mb-2">Hoặc thử một trong những ý tưởng này:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {examplePrompts.map((prompt) => (
                            <button
                                key={prompt}
                                onClick={() => setUserInput(prompt)}
                                className="text-left p-2 rounded-md hover:bg-muted transition-colors text-accent-foreground/80 text-xs"
                            >
                                &raquo; {prompt}
                            </button>
                        ))}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button onClick={handleGenerate}>
                    Tạo các phiên bản thế giới <ArrowRight className="ml-2"/>
                </Button>
            </CardFooter>
        </>
    );

    const renderStep1 = () => (
        <>
            <CardHeader>
                <CardTitle className="font-headline text-3xl flex items-center gap-3"><Sparkles /> Chọn và Kết hợp</CardTitle>
                <CardDescription>Bước 2: AI đã tạo ra 3 phiên bản. Hãy chọn các yếu tố bạn thích nhất!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {isLoading ? (
                    <div className="text-center py-10">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                        <p className="mt-4 text-muted-foreground">Đang kiến tạo các vũ trụ... Xin chờ chút!</p>
                    </div>
                ) : (
                    generatedConcepts && (
                        <div className="space-y-6">
                            {Object.keys(selection).map((key) => {
                                const title = {
                                    worldName: "Tên Thế Giới",
                                    initialNarrative: "Cốt Truyện Mở Đầu",
                                    startingBiome: "Môi Trường Bắt Đầu",
                                    playerInventory: "Trang Bị Ban Đầu",
                                    initialQuests: "Nhiệm Vụ Đầu Tiên",
                                }[key]!;
                                return (
                                    <div key={key}>
                                        <h3 className="text-lg font-semibold font-headline mb-3">{title}</h3>
                                        <RadioGroup
                                            value={String(selection[key as keyof Selection])}
                                            onValueChange={(value) => setSelection(prev => ({...prev, [key]: Number(value)}))}
                                            className="grid grid-cols-1 md:grid-cols-3 gap-4"
                                        >
                                            {generatedConcepts.map((concept, index) => (
                                                <Label key={index} htmlFor={`${key}-${index}`} className="flex flex-col p-4 border rounded-lg cursor-pointer hover:border-primary has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary/50">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-semibold text-sm">Lựa chọn {index + 1}</span>
                                                        <RadioGroupItem value={String(index)} id={`${key}-${index}`} />
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {key === 'playerInventory' || key === 'initialQuests' ? (
                                                            <ul>{concept[key as 'playerInventory' | 'initialQuests'].map(item => <li key={item}>- {item}</li>)}</ul>
                                                        ) : (
                                                            <p>{concept[key as keyof WorldConcept] as string}</p>
                                                        )}
                                                    </div>
                                                </Label>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                );
                            })}
                             <div className="!mt-8 p-4 border-t">
                                <h3 className="font-headline text-xl font-bold">Thế giới của bạn:</h3>
                                 <p className="text-muted-foreground">Đây là thế giới được tạo từ các lựa chọn của bạn.</p>
                                <Card className="mt-4 p-4 bg-muted/30">
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
                    &larr; Quay lại & Chỉnh sửa
                </Button>
                <Button onClick={handleStartGame} disabled={isLoading || !generatedConcepts}>
                    Bắt đầu cuộc phiêu lưu &rarr;
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
