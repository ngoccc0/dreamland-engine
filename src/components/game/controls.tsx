
"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/context/language-context";
import { useSettings } from "@/context/settings-context";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, SwordIcon } from "./icons";
import { Joystick } from "./joystick";

interface ControlsProps {
  onMove: (direction: "north" | "south" | "east" | "west" | null) => void;
  onAttack: () => void;
  onRest?: () => void;
}

/**
 * Movement and action controls component for the game.
 *
 * @remarks
 * On mobile displays a joystick with size adjustment controls, attack button, and rest button.
 * On desktop shows a traditional d-pad layout with arrow buttons.
 * The joystick size can be adjusted between 100-180px with +/- buttons.
 * Joystick preference is saved to settings.
 *
 * @param {function} onMove - Callback for movement (emits direction or null when joystick is idle).
 * @param {function} onAttack - Callback fired when attack button is clicked.
 * @param {function} onRest - Optional callback for rest/wait action.
 *
 * @example
 * <Controls
 *   onMove={handleMove}
 *   onAttack={handleAttack}
 *   onRest={handleRest}
 * />
 */
export function Controls({ onMove, onAttack, onRest }: ControlsProps) {
  const { t } = useLanguage();
  const { settings, setSettings } = useSettings();
  const desktopButtonSize = "h-[60px] w-[60px]";

  const joystickSize = (settings?.joystickSize as number) || 140;

  const handleJoystickMove = useCallback(
    (direction: "north" | "south" | "east" | "west" | null) => {
      if (direction) {
        onMove(direction);
      }
    },
    [onMove]
  );

  const handleSizeChange = (delta: number) => {
    const sizes = [100, 120, 140, 160, 180];
    const currentIndex = sizes.indexOf(joystickSize);
    const nextIndex = Math.max(0, Math.min(sizes.length - 1, currentIndex + delta));
    setSettings({ ...settings, joystickSize: sizes[nextIndex] });
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center gap-4 w-full">
        <h3 className="text-lg font-headline font-semibold text-center text-foreground/80">{t('moveAndAttack')}</h3>

        {/* Mobile Layout - Joystick */}
        <div className="md:hidden w-full flex flex-col items-center space-y-4">
          <div className="flex flex-col items-center gap-3">
            {/* Joystick */}
            <Joystick onMove={handleJoystickMove} size={joystickSize} />

            {/* Size adjustment controls */}
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleSizeChange(-1)}
                  >
                    −
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('smaller') || 'Smaller'}</p>
                </TooltipContent>
              </Tooltip>
              <span className="text-xs text-muted-foreground w-12 text-center">
                {joystickSize}px
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleSizeChange(1)}
                  >
                    +
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('larger') || 'Larger'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Attack and Rest buttons below joystick */}
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="destructive" className="h-16 w-16 rounded-full" onClick={onAttack} aria-label="Attack">
                  <span className="h-6 w-6 flex items-center justify-center">
                    <SwordIcon />
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('attackTooltip') || 'Attack'}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" className="h-16 w-16 rounded-full" onClick={() => onRest && onRest()} aria-label="Rest">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v6l4 2" /></svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('rest') || 'Rest'}</p>
              </TooltipContent>
            </Tooltip>
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
