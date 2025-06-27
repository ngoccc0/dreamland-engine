
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Minimap, type MapCell } from "@/components/game/minimap";
import { Controls } from "@/components/game/controls";
import { StatusPopup } from "@/components/game/status-popup";
import { InventoryPopup } from "@/components/game/inventory-popup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Shield, Swords } from "lucide-react";
import { aiNarrativeResponse, generateChunkDescription } from "@/ai/flows";
import { Skeleton } from "@/components/ui/skeleton";


type PlayerStats = {
  hp: number;
  mana: number;
};

type NarrativeEntry = {
    id: number;
    text: string;
    type: 'narrative' | 'action' | 'system';
}

const initialMap: MapCell[][] = [
  [{ biome: "forest" }, { biome: "forest" }, { biome: "grassland" }, { biome: "grassland" }, { biome: "grassland" }],
  [{ biome: "forest" }, { biome: "forest" }, { biome: "grassland" }, { biome: "desert" }, { biome: "desert" }],
  [{ biome: "forest" }, { biome: "grassland", hasPlayer: true }, { biome: "grassland" }, { biome: "desert" }, { biome: "desert" }],
  [{ biome: "grassland" }, { biome: "grassland" }, { biome: "grassland", hasEnemy: true }, { biome: "desert" }, { biome: "desert" }],
  [{ biome: "grassland" }, { biome: "grassland" }, { biome: "grassland" }, { biome: "desert" }, { biome: "desert" }],
];

export default function GameLayout() {
  const [map, setMap] = useState<MapCell[][]>(initialMap);
  const [playerPosition, setPlayerPosition] = useState<{ x: number; y: number }>({ x: 2, y: 1 });
  const [playerStats, setPlayerStats] = useState<PlayerStats>({ hp: 100, mana: 50 });
  const [quests, setQuests] = useState<string[]>(["Find the ancient amulet."]);
  const [inventory, setInventory] = useState<string[]>(["Health Potion", "Old Key"]);
  const [isStatusOpen, setStatusOpen] = useState(false);
  const [isInventoryOpen, setInventoryOpen] = useState(false);
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [narrativeLog, setNarrativeLog] = useState<NarrativeEntry[]>([]);
  const [chunkDescription, setChunkDescription] = useState("");
  
  const [inputValue, setInputValue] = useState("");
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeGame = async () => {
      const startingCell = initialMap[playerPosition.x][playerPosition.y];
      try {
        const res = await generateChunkDescription({
          biome: startingCell.biome,
          nearbyElements: `The player character awakens here. It's the beginning of their adventure.`
        });
        setChunkDescription(res.description);
        setNarrativeLog([{ id: Date.now(), text: res.description, type: 'narrative' }]);
      } catch (error) {
        console.error("Failed to initialize game:", error);
        const fallbackDescription = "You awaken in a quiet, sun-dappled meadow. A gentle breeze whispers through the tall grass.";
        setChunkDescription(fallbackDescription);
        setNarrativeLog([
            {id: Date.now(), text: fallbackDescription, type: 'narrative'}, 
            {id: Date.now()+1, text: "The connection to the ethereal plane seems unstable. The world feels strangely predetermined.", type: 'system'}
        ]);
        toast({ title: "Initialization Error", description: "Could not generate the starting area. Using a fallback world.", variant: "destructive" });
      } finally {
        setIsInitializing(false);
      }
    };
    initializeGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [narrativeLog]);

  const addNarrativeEntry = (text: string, type: NarrativeEntry['type']) => {
    setNarrativeLog(prev => [...prev, {id: Date.now(), text, type}]);
  }

  const handleMove = async (direction: "north" | "south" | "east" | "west") => {
    const newPosition = { ...playerPosition };
    let moved = false;
    if (direction === "north" && newPosition.x > 0) { newPosition.x--; moved = true; }
    else if (direction === "south" && newPosition.x < map.length - 1) { newPosition.x++; moved = true; }
    else if (direction === "west" && newPosition.y > 0) { newPosition.y--; moved = true; }
    else if (direction === "east" && newPosition.y < map[0].length - 1) { newPosition.y++; moved = true; }
    
    if (!moved) {
        addNarrativeEntry("You can't move in that direction. The path is blocked.", 'system');
        return;
    }

    const newMap = map.map(row => row.map(cell => ({ ...cell, hasPlayer: false })));
    newMap[newPosition.x][newPosition.y].hasPlayer = true;

    setPlayerPosition(newPosition);
    setMap(newMap);
    addNarrativeEntry(`You move ${direction}.`, 'action');

    try {
        const currentChunk = newMap[newPosition.x][newPosition.y];
        const res = await generateChunkDescription({
            biome: currentChunk.biome,
            nearbyElements: `Player is at ${newPosition.x}, ${newPosition.y}. An enemy might be nearby.`
        });
        setChunkDescription(res.description);
        addNarrativeEntry(res.description, 'narrative');
    } catch (error) {
        console.error("Failed to generate chunk description:", error);
        toast({ title: "Error", description: "Could not generate next area description.", variant: "destructive" });
    }
  };
  
  const handleAction = async (action: string) => {
    if (!action.trim() || isInitializing) return;
    addNarrativeEntry(action, 'action');
    setInputValue("");
    try {
        const response = await aiNarrativeResponse({
            playerAction: action,
            chunkDescription: chunkDescription,
            inventory,
            playerStats: { ...playerStats, quests }
        });
        
        if (response.narrativeResponse) {
            addNarrativeEntry(response.narrativeResponse, 'narrative');
        }
        if (response.newChunkDescription && response.newChunkDescription !== chunkDescription) {
            setChunkDescription(response.newChunkDescription);
            addNarrativeEntry(`Your perception of the area has changed.`, 'system');
        }
        if (response.questUpdates && response.questUpdates.length > 0) {
            setQuests(prev => [...new Set([...prev, ...response.questUpdates])]);
            addNarrativeEntry('Your quest log has been updated.', 'system');
        }

    } catch(e) {
        console.error(e);
        toast({ title: "Error", description: "The winds of fate are confused. Please try again.", variant: "destructive" });
    }
  }

  const handleAttack = () => {
    handleAction("Attack the enemy!");
  };

  return (
    <div className="flex flex-col md:flex-row h-dvh bg-background text-foreground font-body">
      {/* Left Panel */}
      <div className="w-full md:w-[70%] h-full flex flex-col">
        <header className="p-4 border-b flex justify-between items-center">
          <h1 className="text-2xl font-bold font-headline">Terra Textura</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setStatusOpen(true)}><Shield className="mr-2 h-4 w-4"/>Status</Button>
            <Button variant="outline" onClick={() => setInventoryOpen(true)}><BookOpen className="mr-2 h-4 w-4"/>Inventory</Button>
          </div>
        </header>

        <ScrollArea className="flex-grow p-4 md:p-6" ref={scrollAreaRef}>
          <div className="prose prose-stone dark:prose-invert max-w-none">
            {isInitializing && (
                <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[80%]" />
                    <Skeleton className="h-4 w-full" />
                </div>
            )}
            {!isInitializing && narrativeLog.map((entry) => (
                <p key={entry.id} className={`animate-in fade-in duration-500 ${entry.type === 'action' ? 'italic text-accent-foreground/80' : ''} ${entry.type === 'system' ? 'font-semibold text-accent' : ''}`}>
                    {entry.text}
                </p>
            ))}
          </div>
        </ScrollArea>
        
        <Separator />
        
        <div className="p-4 space-y-4">
            <div className="p-4 bg-card rounded-lg shadow-inner">
                <h2 className="font-headline text-lg font-semibold mb-2">Description</h2>
                {isInitializing ? (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-[75%]" />
                    </div>
                ) : (
                    <p className="text-card-foreground/80 animate-in fade-in duration-500">{chunkDescription}</p>
                )}
            </div>
            <div className="flex gap-2">
                <Input 
                    placeholder="What do you do?" 
                    className="flex-grow"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAction(inputValue)}
                    disabled={isInitializing}
                />
                <Button variant="accent" onClick={() => handleAction(inputValue)} disabled={isInitializing}>Send</Button>
            </div>
            <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => handleAction("Look around")} disabled={isInitializing}>1. Look around</Button>
                <Button variant="secondary" className="flex-1" onClick={() => handleAction("Check inventory")} disabled={isInitializing}>2. Check inventory</Button>
                <Button variant="secondary" className="flex-1" onClick={() => handleAction("Rest")} disabled={isInitializing}>3. Rest</Button>
            </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full md:w-[30%] bg-card border-l flex flex-col p-4 md:p-6 gap-8 items-center justify-center">
        <Minimap grid={map} />
        <Controls onMove={handleMove} onAttack={handleAttack} />
      </div>
      
      <StatusPopup open={isStatusOpen} onOpenChange={setStatusOpen} stats={playerStats} quests={quests} />
      <InventoryPopup open={isInventoryOpen} onOpenChange={setInventoryOpen} items={inventory} />
    </div>
  );
}
