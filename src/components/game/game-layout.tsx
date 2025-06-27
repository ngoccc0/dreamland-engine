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
import { BookOpen, Shield } from "lucide-react";
import { aiNarrativeResponse } from "@/ai/flows/ai-narrative-response";
import { generateChunkDescription } from "@/ai/flows/generate-chunk-description";
import { Skeleton } from "@/components/ui/skeleton";
import type { GenerateWorldSetupOutput } from "@/ai/flows/generate-world-setup";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type PlayerStats = {
  hp: number;
  mana: number;
};

type NarrativeEntry = {
    id: number;
    text: string;
    type: 'narrative' | 'action' | 'system';
}

// Function to generate the initial map
const createInitialMap = (startingBiome: "forest" | "grassland" | "desert"): MapCell[][] => {
    const mapSize = 5;
    const playerPos = { x: 2, y: 2 };
    // Create a base map (e.g., all grassland)
    let map: MapCell[][] = Array(mapSize).fill(null).map(() => Array(mapSize).fill({ biome: "grassland" }));
    
    // Set the starting biome in a 3x3 area around the player
    for (let i = playerPos.x - 1; i <= playerPos.x + 1; i++) {
        for (let j = playerPos.y - 1; j <= playerPos.y + 1; j++) {
            if (map[i] && map[i][j]) {
                map[i][j] = { biome: startingBiome };
            }
        }
    }

    map[playerPos.x][playerPos.y].hasPlayer = true;
    // For variety, let's place an enemy and some other biomes randomly, but away from the player
    map[0][4] = { biome: "desert" };
    map[0][3] = { biome: "desert" };
    map[4][0] = { biome: "forest" };
    map[3][0] = { biome: "forest" };
    map[0][0].hasEnemy = true;
    
    return map;
};

interface GameLayoutProps {
  worldSetup: GenerateWorldSetupOutput;
}

export default function GameLayout({ worldSetup }: GameLayoutProps) {
  const [map, setMap] = useState<MapCell[][]>(() => createInitialMap(worldSetup.startingBiome));
  const [playerPosition, setPlayerPosition] = useState<{ x: number; y: number }>({ x: 2, y: 2 });
  const [playerStats, setPlayerStats] = useState<PlayerStats>({ hp: 100, mana: 50 });
  const [quests, setQuests] = useState<string[]>(worldSetup.initialQuests);
  const [inventory, setInventory] = useState<string[]>(worldSetup.playerInventory);
  const [isStatusOpen, setStatusOpen] = useState(false);
  const [isInventoryOpen, setInventoryOpen] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false); // Used for subsequent AI calls
  const [narrativeLog, setNarrativeLog] = useState<NarrativeEntry[]>([{ id: Date.now(), text: worldSetup.initialNarrative, type: 'narrative' }]);
  const [chunkDescription, setChunkDescription] = useState(worldSetup.initialNarrative);
  
  const [inputValue, setInputValue] = useState("");
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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
    setIsLoading(true);
    const newPosition = { ...playerPosition };
    let moved = false;
    if (direction === "north" && newPosition.x > 0) { newPosition.x--; moved = true; }
    else if (direction === "south" && newPosition.x < map.length - 1) { newPosition.x++; moved = true; }
    else if (direction === "west" && newPosition.y > 0) { newPosition.y--; moved = true; }
    else if (direction === "east" && newPosition.y < map[0].length - 1) { newPosition.y++; moved = true; }
    
    if (!moved) {
        addNarrativeEntry("You can't move in that direction. The path is blocked.", 'system');
        setIsLoading(false);
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
        addNarrativeEntry("The world feels hazy and indistinct here.", 'system');
        toast({ title: "Error", description: "Could not generate next area description.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleAction = async (action: string) => {
    if (!action.trim() || isLoading) return;
    addNarrativeEntry(action, 'action');
    setInputValue("");
    setIsLoading(true);

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
    } finally {
        setIsLoading(false);
    }
  }

  const handleAttack = () => {
    handleAction("Attack the enemy!");
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col md:flex-row h-dvh bg-background text-foreground font-body">
        {/* Left Panel */}
        <div className="w-full md:w-[70%] h-full flex flex-col">
          <header className="p-4 border-b flex justify-between items-center">
            <h1 className="text-2xl font-bold font-headline">{worldSetup.worldName}</h1>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={() => setStatusOpen(true)}><Shield className="mr-2 h-4 w-4"/>Status</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View your current health, mana, and quests.</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={() => setInventoryOpen(true)}><BookOpen className="mr-2 h-4 w-4"/>Inventory</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Check the items you are carrying.</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </header>

          <ScrollArea className="flex-grow p-4 md:p-6" ref={scrollAreaRef}>
            <div className="prose prose-stone dark:prose-invert max-w-none">
              {narrativeLog.map((entry) => (
                  <p key={entry.id} className={`animate-in fade-in duration-500 ${entry.type === 'action' ? 'italic text-accent-foreground/80' : ''} ${entry.type === 'system' ? 'font-semibold text-accent' : ''}`}>
                      {entry.text}
                  </p>
              ))}
              {isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground italic mt-4">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <p>Thinking...</p>
                  </div>
              )}
            </div>
          </ScrollArea>
          
          <Separator />
          
          <div className="p-4 space-y-4">
              <div className="p-4 bg-card rounded-lg shadow-inner">
                  <h2 className="font-headline text-lg font-semibold mb-2">Description</h2>
                  {isLoading && chunkDescription === "" ? (
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
                      disabled={isLoading}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="accent" onClick={() => handleAction(inputValue)} disabled={isLoading}>Send</Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Send your custom action to the game master.</p>
                    </TooltipContent>
                  </Tooltip>
              </div>
              <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="secondary" className="flex-1" onClick={() => handleAction("Look around")} disabled={isLoading}>1. Look around</Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Get a more detailed description of your surroundings.</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="secondary" className="flex-1" onClick={() => handleAction("Check inventory")} disabled={isLoading}>2. Check inventory</Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>See what items are in your bag.</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="secondary" className="flex-1" onClick={() => handleAction("Rest")} disabled={isLoading}>3. Rest</Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Take a moment to rest and possibly recover health.</p>
                    </TooltipContent>
                  </Tooltip>
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
    </TooltipProvider>
  );
}
