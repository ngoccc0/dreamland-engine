"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WandSparkles, Shield, Backpack, Hammer, Home, FlaskConical } from "./icons";
import { getTranslatedText, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useSkillState } from "@/hooks/useSkillState";
import { useSkillShake } from "@/hooks/useSkillShake";

interface Skill {
  name: any;
  description?: any;
  manaCost?: number;
  cooldownRemaining?: number;
  cooldown?: number;
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

/**
 * Skill button component that renders a single skill with proper state management.
 * Shows button state (ready/cooldown/insufficient mana) with visual feedback.
 */
function SkillButton({
  skill,
  skillName,
  language,
  t,
  onUseSkill,
  playerMana
}: {
  skill: Skill;
  skillName: string;
  language: any;
  t: (k: any, p?: any) => string;
  onUseSkill: (name: string) => void;
  playerMana: number;
}) {
  const { state, disabled, label, tooltip } = useSkillState(skill, playerMana);
  const { shake, triggerShake } = useSkillShake();
  const { toast } = useToast();

  const handleClick = () => {
    if (disabled) {
      // Trigger visual feedback
      triggerShake();

      // Show error toast
      if (state === 'INSUFFICIENT_MANA') {
        toast({
          title: '❌ Mana không đủ',
          description: `Bạn cần ${(skill.manaCost ?? 0) - playerMana} mana nữa để sử dụng ${skillName}`,
          variant: 'destructive'
        });
      } else if (state === 'ON_COOLDOWN') {
        toast({
          title: '⏳ Kỹ năng đang cooldown',
          description: `${skillName} sẽ sẵn sàng trong ${label}`,
          variant: 'default'
        });
      }
      return;
    }

    // Skill is ready - use it
    onUseSkill(skillName);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={state === 'ON_COOLDOWN' ? 'outline' : 'secondary'}
          className={cn(
            'text-xs relative',
            shake && 'animate-shake',
            state === 'ON_COOLDOWN' && 'animate-pulse text-amber-600'
          )}
          onClick={handleClick}
          disabled={disabled}
        >
          <WandSparkles className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{String(label).substring(0, 3)}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{String(tooltip)}</TooltipContent>
    </Tooltip>
  );
}

export function BottomActionBar({
  skills = [],
  playerStats,
  language,
  t,
  pickUpActions,
  otherActions: _otherActions,
  isLoading,
  onUseSkill,
  onActionClick: _onActionClick,
  onOpenPickup,
  onOpenAvailableActions,
  onOpenCustomDialog,
  onOpenStatus: _onOpenStatus,
  onOpenInventory: _onOpenInventory,
  onOpenCrafting: _onOpenCrafting,
  onOpenBuilding: _onOpenBuilding,
  onOpenFusion: _onOpenFusion
}: Props) {
  return (
    <TooltipProvider>
      <div className="hidden md:flex fixed bottom-0 left-0 md:right-auto md:[width:calc(100%-var(--aside-w))] bg-card p-3 items-center gap-3 overflow-x-auto z-40">
        {/* Skills (left) */}
        <div className="flex items-center gap-2">
          {skills.map((skill: Skill) => {
            const skillName = getTranslatedText(skill.name, language, t);
            return (
              <SkillButton
                key={skillName}
                skill={skill}
                skillName={skillName}
                language={language}
                t={t}
                onUseSkill={onUseSkill}
                playerMana={playerStats.mana ?? 0}
              />
            );
          })}
        </div>

        {/* Available actions (center) */}
        <div className="flex-1 flex items-center justify-center gap-2">
          {pickUpActions.length > 0 && (
            <Button variant="accent" onClick={onOpenPickup}>
              {t('pickUpItems') || 'Pick up items'}
            </Button>
          )}
        </div>

        {/* Right: only keep Actions & Custom on desktop */}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={onOpenAvailableActions}>
            {t('actions') || 'Actions'}
          </Button>
          <Button variant="outline" onClick={onOpenCustomDialog}>
            {t('customAction') || 'Custom'}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default BottomActionBar;
