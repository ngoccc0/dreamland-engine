
"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/context/language-context";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, SwordIcon } from "./icons";

interface ControlsProps {
  onMove: (direction: "north" | "south" | "east" | "west") => void;
  onAttack: () => void;
}

export function Controls({ onMove, onAttack }: ControlsProps) {
  const { t } = useLanguage();
  const desktopButtonSize = "h-[60px] w-[60px]";

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center gap-2 w-full">
        <h3 className="text-lg font-headline font-semibold text-center text-foreground/80">{t('moveAndAttack')}</h3>
        
        {/* Mobile Layout */}
        <div className="md:hidden w-full flex flex-col items-center space-y-2">
            <Button variant="accent" className="w-full max-w-xs justify-center" onClick={() => onMove("north")}>
                <ArrowUp className="mr-2 h-4 w-4" /> {t('moveUp')}
            </Button>
            <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
                <Button variant="accent" className="justify-center" onClick={() => onMove("west")}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> {t('moveLeft')}
                </Button>
                <Button variant="destructive" onClick={onAttack} aria-label="Attack">
                    <SwordIcon />
                </Button>
                <Button variant="accent" className="justify-center" onClick={() => onMove("east")}>
                    {t('moveRight')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
            <Button variant="accent" className="w-full max-w-xs justify-center" onClick={() => onMove("south")}>
                <ArrowDown className="mr-2 h-4 w-4" /> {t('moveDown')}
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
                <p>{t('moveNorthTooltip')}</p>
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
                <p>{t('moveWestTooltip')}</p>
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
                <p>{t('attackTooltip')}</p>
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
                <p>{t('moveEastTooltip')}</p>
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
                <p>{t('moveSouthTooltip')}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
