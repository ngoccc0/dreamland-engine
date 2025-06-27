"use client";

import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const buttonSize = "h-[50px] w-[50px] md:h-[60px] md:w-[60px]";

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-lg font-headline font-semibold text-center text-foreground/80">Controls</h3>
      <div className="grid grid-cols-3 grid-rows-3 gap-2 w-fit">
        <div className="col-start-2 row-start-1 flex justify-center items-center">
          <Button variant="accent" className={buttonSize} onClick={() => onMove("north")} aria-label="Move North">
            <ArrowUp />
          </Button>
        </div>
        <div className="col-start-1 row-start-2 flex justify-center items-center">
          <Button variant="accent" className={buttonSize} onClick={() => onMove("west")} aria-label="Move West">
            <ArrowLeft />
          </Button>
        </div>
        <div className="col-start-2 row-start-2 flex justify-center items-center">
          <Button variant="destructive" className={buttonSize} onClick={onAttack} aria-label="Attack">
            <SwordIcon />
          </Button>
        </div>
        <div className="col-start-3 row-start-2 flex justify-center items-center">
          <Button variant="accent" className={buttonSize} onClick={() => onMove("east")} aria-label="Move East">
            <ArrowRight />
          </Button>
        </div>
        <div className="col-start-2 row-start-3 flex justify-center items-center">
          <Button variant="accent" className={buttonSize} onClick={() => onMove("south")} aria-label="Move South">
            <ArrowDown />
          </Button>
        </div>
      </div>
    </div>
  );
}
