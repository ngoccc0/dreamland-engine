"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WandSparkles, Shield, Backpack, Hammer, Home, FlaskConical } from "./icons";
import { getTranslatedText } from "@/lib/utils";

interface Skill {
  name: any;
  description?: any;
  manaCost?: number;
}

interface Action {
  id: number;
  textKey: string;
  params?: any;
}

interface Props {
  skills?: Skill[];
  playerStats: any;
  language: any;
  t: (k: any, p?: any) => string;
  pickUpActions: Action[];
  otherActions: Action[];
  isLoading: boolean;
  onUseSkill: (skillName: string) => void;
  onActionClick: (id: number) => void;
  onOpenPickup: () => void;
  onOpenAvailableActions: () => void;
  onOpenCustomDialog: () => void;
  onOpenStatus: () => void;
  onOpenInventory: () => void;
  onOpenCrafting: () => void;
  onOpenBuilding: () => void;
  onOpenFusion: () => void;
}

export function BottomActionBar({ skills = [], playerStats, language, t, pickUpActions, otherActions, isLoading,
  onUseSkill, onActionClick, onOpenPickup, onOpenAvailableActions, onOpenCustomDialog, onOpenStatus, onOpenInventory, onOpenCrafting, onOpenBuilding, onOpenFusion
}: Props) {
  return (
    <TooltipProvider>
  <div className="hidden md:flex fixed bottom-0 left-0 md:right-auto md:[width:calc(100%-var(--aside-w))] bg-card p-3 items-center gap-3 overflow-x-auto z-40">
        {/* Skills (left) */}
        <div className="flex items-center gap-2">
          {skills.map((skill: Skill) => {
            const skillName = getTranslatedText(skill.name, language, t);
            return (
              <Tooltip key={skillName}>
                <TooltipTrigger asChild>
                  <Button variant="secondary" className="text-xs" onClick={() => onUseSkill(skillName)} disabled={isLoading || (playerStats.mana < (skill.manaCost ?? 0))}>
                    <WandSparkles className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">{skillName}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{getTranslatedText(skill.description, language, t)}</p></TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Available actions (center) */}
        <div className="flex-1 flex items-center justify-center gap-2">
          {pickUpActions.length > 0 && (
            <Button variant="accent" onClick={onOpenPickup}>{t('pickUpItems') || 'Pick up items'}</Button>
          )}
            {/* Intentionally show only the Pick Up button among contextual actions on desktop.
               Other contextual actions are accessible via the "Actions" menu. */}
        </div>

        {/* Right: only keep Actions & Custom on desktop (main action icons removed) */}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={onOpenAvailableActions}>{t('actions') || 'Actions'}</Button>
          <Button variant="outline" onClick={onOpenCustomDialog}>{t('customAction') || 'Custom'}</Button>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default BottomActionBar;
