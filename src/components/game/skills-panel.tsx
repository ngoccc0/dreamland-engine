'use client';

import React, { useState } from 'react';
import type { GameState } from '@/core/types/game';
import { useSkillState } from '@/hooks/use-skill-state';

interface SkillsPanelProps {
  gameState: GameState;
  onSkillExecute?: (skillId: string) => void;
  onSkillLearn?: (skillId: string) => void;
}

/**
 * Skills Panel component - displays player skills and allows management.
 *
 * @remarks
 * **Layout:**
 * - **Unlocked Tab**: Shows learned skills, their levels, cooldowns
 * - **Available Tab**: Shows locked skills, shows requirements
 * - **Skill Details**: Click to expand skill info (description, cost, cooldown)
 *
 * **Styling:**
 * - Uses Tailwind with responsive grid
 * - Color-coding by skill tier (green=basic, blue=T1, purple=T2, gold=ultimate)
 * - Shows cooldown progress bar when skill is cooling down
 * - Shows resource cost as icon + amount
 *
 * **Accessibility:**
 * - Tab navigation with keyboard support
 * - aria-label on skill buttons
 * - Semantic HTML with descriptions
 *
 * **Props:**
 * - `gameState`: Full game state (selector hook extracts skill subset)
 * - `onSkillExecute`: Callback when player clicks skill to use
 * - `onSkillLearn`: Callback when player clicks to unlock skill
 *
 * @example
 * <SkillsPanel
 *   gameState={gameState}
 *   onSkillExecute={(skillId) => executeSkill(skillId)}
 *   onSkillLearn={(skillId) => learnSkill(skillId)}
 * />
 */
export function SkillsPanel({
  gameState,
  onSkillExecute,
  onSkillLearn
}: SkillsPanelProps) {
  const skillState = useSkillState(gameState);
  const [activeTab, setActiveTab] = useState<'unlocked' | 'available'>('unlocked');
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  const {
    unlockedSkills,
    skillLevels,
    availableSkillPoints,
    readySkills,
    isHighLevel
  } = skillState;

  // Mock skill data (replace with actual skill definitions)
  const mockSkills: Record<
    string,
    {
      name: string;
      description: string;
      tier: 'basic' | 'tier1' | 'tier2' | 'ultimate';
      cost: number;
      cooldown: number;
      resourceType: 'mana' | 'stamina';
      resourceAmount: number;
    }
  > = {
    attack: {
      name: 'Attack',
      description: 'Basic melee attack',
      tier: 'basic',
      cost: 0,
      cooldown: 0,
      resourceType: 'stamina',
      resourceAmount: 10
    },
    power_slash: {
      name: 'Power Slash',
      description: 'Heavy slash dealing +50% damage',
      tier: 'tier1',
      cost: 1,
      cooldown: 3,
      resourceType: 'stamina',
      resourceAmount: 25
    },
    fireball: {
      name: 'Fireball',
      description: 'Launch a ball of flames',
      tier: 'tier1',
      cost: 1,
      cooldown: 4,
      resourceType: 'mana',
      resourceAmount: 30
    },
    meteor_strike: {
      name: 'Meteor Strike',
      description: 'Call meteors from the sky (Requires Level 20)',
      tier: 'ultimate',
      cost: 5,
      cooldown: 60,
      resourceType: 'mana',
      resourceAmount: 100
    }
  };

  const tierColors = {
    basic: 'bg-gray-100 border-gray-300 text-gray-700',
    tier1: 'bg-blue-100 border-blue-400 text-blue-700',
    tier2: 'bg-purple-100 border-purple-400 text-purple-700',
    ultimate: 'bg-yellow-100 border-yellow-500 text-yellow-800'
  };

  const tierBadgeColors = {
    basic: 'bg-gray-300 text-gray-900',
    tier1: 'bg-blue-300 text-blue-900',
    tier2: 'bg-purple-300 text-purple-900',
    ultimate: 'bg-yellow-400 text-yellow-900'
  };

  const resourceIcon = {
    mana: '✨',
    stamina: '💪'
  };

  const renderSkillCard = (skillId: string, isLocked: boolean = false) => {
    const skill = mockSkills[skillId];
    if (!skill) return null;

    const level = skillLevels[skillId] || 0;
    const isReady = readySkills.includes(skillId);
    const isExpanded = expandedSkill === skillId;

    return (
      <div
        key={skillId}
        className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${isLocked
            ? 'bg-gray-50 border-gray-300 opacity-60'
            : tierColors[skill.tier]
          } ${isExpanded ? 'ring-2 ring-blue-500' : ''}`}
        onClick={() => setExpandedSkill(isExpanded ? null : skillId)}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-bold text-sm">{skill.name}</h4>
            {!isLocked && <p className="text-xs opacity-75">Level {level}</p>}
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded ${tierBadgeColors[skill.tier]}`}>
            {skill.tier === 'basic' ? 'Basic' : skill.tier === 'tier1' ? 'Tier 1' : skill.tier === 'tier2' ? 'Tier 2' : 'Ultimate'}
          </span>
        </div>

        {!isLocked && (
          <div className="mb-2 flex items-center gap-2 text-xs">
            <span>{resourceIcon[skill.resourceType]}</span>
            <span>{skill.resourceAmount}</span>
            {skill.cooldown > 0 && (
              <>
                <span>•</span>
                <span>⏱️ {skill.cooldown}s</span>
              </>
            )}
          </div>
        )}

        {isExpanded && (
          <div className="mt-3 pt-3 border-t-2 border-current opacity-60">
            <p className="text-xs mb-2">{skill.description}</p>
            {isLocked && (
              <div className="flex gap-2">
                <button
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs py-1 rounded transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSkillLearn?.(skillId);
                  }}
                  disabled={availableSkillPoints < skill.cost || (skill.tier === 'ultimate' && !isHighLevel)}
                >
                  Learn ({skill.cost} points)
                </button>
              </div>
            )}
            {!isLocked && (
              <div className="flex gap-2">
                <button
                  className={`flex-1 text-xs py-1 rounded transition-colors ${isReady
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isReady) onSkillExecute?.(skillId);
                  }}
                  disabled={!isReady}
                >
                  {isReady ? 'Use' : 'Cooling down...'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Skills</h2>
        <div className="text-sm text-gray-600">
          Points: <span className="font-bold text-blue-600">{availableSkillPoints}</span> available
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab('unlocked')}
          className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'unlocked'
              ? 'text-blue-600 border-b-2 border-blue-600 -mb-2'
              : 'text-gray-600 hover:text-gray-800'
            }`}
        >
          Unlocked ({unlockedSkills.length})
        </button>
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'available'
              ? 'text-blue-600 border-b-2 border-blue-600 -mb-2'
              : 'text-gray-600 hover:text-gray-800'
            }`}
        >
          Available
        </button>
      </div>

      {/* Skill Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {activeTab === 'unlocked' ? (
          <>
            {unlockedSkills.length > 0 ? (
              unlockedSkills.map((skillId: string) => renderSkillCard(skillId, false))
            ) : (
              <p className="text-gray-600 col-span-2 text-center py-4">No skills unlocked yet</p>
            )}
          </>
        ) : (
          <>
            {Object.keys(mockSkills)
              .filter((skillId: string) => !unlockedSkills.includes(skillId))
              .map((skillId: string) => renderSkillCard(skillId, true))}
          </>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600 flex gap-4">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-gray-300 rounded"></span>
          <span>Basic</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-blue-300 rounded"></span>
          <span>Tier 1</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-purple-300 rounded"></span>
          <span>Tier 2</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-yellow-400 rounded"></span>
          <span>Ultimate</span>
        </div>
      </div>
    </div>
  );
}
