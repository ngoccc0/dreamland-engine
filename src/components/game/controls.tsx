"use client";

import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


interface ControlsProps {
  onMove: (direction: "north" | "south" | "east" | "west") => void;
  onAttack: () => void;
}

const SwordIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 17.5l-8-8"/>
        <path d="M5 3l16 16"/>
        <path d="M17 3l4 4"/>
        <path d="M3 17l4 4"/>
    </svg>
)

export function Controls({ onMove, onAttack }: ControlsProps) {
  const desktopButtonSize = "h-[60px] w-[60px]";

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center gap-2 w-full">
        <h3 className="text-lg font-headline font-semibold text-center text-foreground/80">Di chuyển & Tấn công</h3>
        
        {/* Mobile Layout */}
        <div className="md:hidden w-full flex flex-col items-center space-y-2">
            <Button variant="accent" className="w-full max-w-xs justify-center" onClick={() => onMove("north")}>
                <ArrowUp className="mr-2 h-4 w-4" /> Đi lên
            </Button>
            <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
                <Button variant="accent" className="justify-center" onClick={() => onMove("west")}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Trái
                </Button>
                <Button variant="destructive" onClick={onAttack} aria-label="Attack">
                    <SwordIcon />
                </Button>
                <Button variant="accent" className="justify-center" onClick={() => onMove("east")}>
                    Phải <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
            <Button variant="accent" className="w-full max-w-xs justify-center" onClick={() => onMove("south")}>
                <ArrowDown className="mr-2 h-4 w-4" /> Đi xuống
            </Button>
        </div>

        {/* Desktop Layout (with Tooltips) */}
        <div className="hidden md:grid grid-cols-3 grid-rows-3 gap-2 w-fit">
          <div className="col-start-2 row-start-1 flex justify-center items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="accent" className={desktopButtonSize} onClick={() => onMove("north")} aria-label="Move North">
                  <ArrowUp />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Đi lên (North)</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="col-start-1 row-start-2 flex justify-center items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="accent" className={desktopButtonSize} onClick={() => onMove("west")} aria-label="Move West">
                  <ArrowLeft />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Đi sang trái (West)</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="col-start-2 row-start-2 flex justify-center items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="destructive" className={desktopButtonSize} onClick={onAttack} aria-label="Attack">
                  <SwordIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tấn công</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="col-start-3 row-start-2 flex justify-center items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="accent" className={desktopButtonSize} onClick={() => onMove("east")} aria-label="Move East">
                  <ArrowRight />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Đi sang phải (East)</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="col-start-2 row-start-3 flex justify-center items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="accent" className={desktopButtonSize} onClick={() => onMove("south")} aria-label="Move South">
                  <ArrowDown />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Đi xuống (South)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
