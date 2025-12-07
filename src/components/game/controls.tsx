
"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/context/language-context";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, SwordIcon } from "./icons";

interface ControlsProps {
  onMove: (direction: "north" | "south" | "east" | "west") => void;
  onAttack: () => void;
  onRest?: () => void;
}

export function Controls({ onMove, onAttack, onRest }: ControlsProps) {
  const { t } = useLanguage();
  const desktopButtonSize = "h-[60px] w-[60px]";

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center gap-2 w-full">
        <h3 className="text-lg font-headline font-semibold text-center text-foreground/80">{t('moveAndAttack')}</h3>
        
        {/* Mobile Layout - D-pad Style */}
        <div className="md:hidden w-full flex flex-col items-center space-y-4">
            <div className="grid grid-cols-3 grid-rows-3 gap-2 w-fit">
                <div className="col-start-2 row-start-1 flex justify-center">
                    <Button variant="accent" className="h-16 w-16 rounded-full" onClick={() => onMove("north")} aria-label="Move North">
                        <ArrowUp className="h-6 w-6" />
                    </Button>
                </div>
                <div className="col-start-1 row-start-2 flex justify-center">
                    <Button variant="accent" className="h-16 w-16 rounded-full" onClick={() => onMove("west")} aria-label="Move West">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                </div>
                <div className="col-start-2 row-start-2 flex justify-center">
                    <Button variant="destructive" className="h-16 w-16 rounded-full" onClick={onAttack} aria-label="Attack">
                        <span className="h-6 w-6 flex items-center justify-center">
                            <SwordIcon />
                        </span>
                    </Button>
                </div>
                <div className="col-start-3 row-start-2 flex justify-center">
                    <Button variant="accent" className="h-16 w-16 rounded-full" onClick={() => onMove("east")} aria-label="Move East">
                        <ArrowRight className="h-6 w-6" />
                    </Button>
                </div>
                <div className="col-start-2 row-start-3 flex justify-center">
                    <Button variant="accent" className="h-16 w-16 rounded-full" onClick={() => onMove("south")} aria-label="Move South">
                        <ArrowDown className="h-6 w-6" />
                    </Button>
                </div>
                <div className="col-start-3 row-start-3 flex justify-center">
                    <Button variant="secondary" className="h-12 w-12 rounded-full" onClick={() => onRest && onRest()} aria-label="Rest">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v6l4 2" /></svg>
                    </Button>
                </div>
            </div>
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
          <div className="col-start-3 row-start-3 flex justify-center items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" className={desktopButtonSize} onClick={() => onRest && onRest()} aria-label="Rest">
                  {/* use a simple clock-like glyph via ArrowDown placeholder when icon not available */}
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v6l4 2" /></svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('rest') || 'Rest'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
