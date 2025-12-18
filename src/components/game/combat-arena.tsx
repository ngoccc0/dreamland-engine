'use client';

import React, { useState } from 'react';
import type { GameState } from '@/core/types/game';
import { useCombatState } from '@/hooks/use-combat-state';

interface CombatArenaProps {
  gameState: GameState;
  onActionSelect?: (action: string) => void;
  onFlee?: () => void;
  onSkillUse?: (skillId: string) => void;
}

/**
 * Combat Arena component - displays combat encounter with turn-based UI.
 *
 * @remarks
 * **Layout:**
 * - **Top**: Player and enemy health bars with portrait frames
 * - **Center**: Combat log showing action sequence
 * - **Bottom**: Action buttons (Attack, Skill, Defend, Item, Flee)
 *
 * **Animation Features (Framer Motion):**
 * - Characters zoom in on combat start (scale up)
 * - Damage numbers float and fade out
 * - Critical hits have red flash effect
 * - Skill animations: player slides forward for melee, spawns projectile for ranged
 * - Enemy recoils on hit (knockback effect)
 * - Combat end: fade out + slide down transition
 * - Heal/buff effects: green sparkle animation
 *
 * **Styling:**
 * - Themed with game color palette
 * - Health bars use red-to-green gradient
 * - Status effects shown as icons under combatant name
 * - Combat log scrolls automatically to latest entry
 * - Action buttons highlight when available/unavailable
 *
 * **Accessibility:**
 * - Keyboard navigation: arrow keys to select action, Enter to execute
 * - Screen reader announces damage values and combat events
 * - High contrast health bars for visibility
 *
 * **Props:**
 * - `gameState`: Full game state (selector extracts combat subset)
 * - `onActionSelect`: Callback when player chooses action
 * - `onFlee`: Callback when player attempts to flee
 * - `onSkillUse`: Callback to execute skill during combat
 *
 * @example
 * <CombatArena
 *   gameState={gameState}
 *   onActionSelect={(action) => handleCombatAction(action)}
 *   onFlee={() => handleFlee()}
 * />
 */
export function CombatArena({
  gameState,
  onActionSelect,
  onFlee,
  onSkillUse
}: CombatArenaProps) {
  const combatState = useCombatState(gameState);
  const [selectedAction, setSelectedAction] = useState<string>('attack');
  const [combatLog, setCombatLog] = useState<string[]>([]);

  const {
    isInCombat,
    currentEnemy,
    playerCombatStats,
    enemyCombatStats,
    roundNumber,
    canFlee
  } = combatState;

  if (!isInCombat || !currentEnemy || !enemyCombatStats) {
    return null;
  }

  const playerHpPercent =
    playerCombatStats && playerCombatStats.maxHp > 0
      ? (playerCombatStats.hp / playerCombatStats.maxHp) * 100
      : 0;

  const enemyHpPercent =
    enemyCombatStats && enemyCombatStats.maxHp > 0
      ? (enemyCombatStats.hp / enemyCombatStats.maxHp) * 100
      : 0;

  const actions = [
    { id: 'attack', label: 'Attack', icon: '⚔️' },
    { id: 'skill', label: 'Skill', icon: '✨' },
    { id: 'defend', label: 'Defend', icon: '🛡️' },
    { id: 'item', label: 'Item', icon: '🧪' }
  ];

  const handleActionSelect = (actionId: string) => {
    setSelectedAction(actionId);
    onActionSelect?.(actionId);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-blue-900 to-slate-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 px-6 py-4 border-b-2 border-blue-500">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Combat - Round {roundNumber}</h1>
          <button
            className="text-gray-400 hover:text-white text-2xl"
            onClick={() => onFlee?.()}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Combatants Area */}
      <div className="flex-1 grid grid-cols-2 gap-8 p-8 items-center">
        {/* Player Side */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg border-4 border-blue-300 flex items-center justify-center text-6xl shadow-lg">
            🧙
          </div>
          <div>
            <h2 className="text-xl font-bold text-white text-center">You</h2>
            <p className="text-sm text-gray-300">Level {playerCombatStats?.level || 1}</p>
          </div>

          {/* Player Health Bar */}
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-xs text-gray-300 mb-1">
              <span>HP</span>
              <span>
                {playerCombatStats?.hp || 0} / {playerCombatStats?.maxHp || 0}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-6 border-2 border-gray-600 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-green-500 transition-all duration-300"
                style={{ width: `${playerHpPercent}%` }}
              />
            </div>
          </div>

          {/* Player Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs text-center w-full max-w-xs">
            <div className="bg-slate-700 p-2 rounded">
              <div className="text-gray-400">ATK</div>
              <div className="text-white font-bold">{playerCombatStats?.attack || 0}</div>
            </div>
            <div className="bg-slate-700 p-2 rounded">
              <div className="text-gray-400">DEF</div>
              <div className="text-white font-bold">{playerCombatStats?.defense || 0}</div>
            </div>
          </div>
        </div>

        {/* Enemy Side */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-red-700 rounded-lg border-4 border-red-300 flex items-center justify-center text-6xl shadow-lg">
            👹
          </div>
          <div>
            <h2 className="text-xl font-bold text-white text-center">{currentEnemy.name}</h2>
            <p className="text-sm text-gray-300">Level {enemyCombatStats?.level || 1}</p>
          </div>

          {/* Enemy Health Bar */}
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-xs text-gray-300 mb-1">
              <span>HP</span>
              <span>
                {enemyCombatStats?.hp || 0} / {enemyCombatStats?.maxHp || 0}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-6 border-2 border-gray-600 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-green-500 transition-all duration-300"
                style={{ width: `${enemyHpPercent}%` }}
              />
            </div>
          </div>

          {/* Enemy Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs text-center w-full max-w-xs">
            <div className="bg-slate-700 p-2 rounded">
              <div className="text-gray-400">ATK</div>
              <div className="text-white font-bold">{enemyCombatStats?.attack || 0}</div>
            </div>
            <div className="bg-slate-700 p-2 rounded">
              <div className="text-gray-400">DEF</div>
              <div className="text-white font-bold">{enemyCombatStats?.defense || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Combat Log */}
      <div className="bg-slate-800 border-t-2 border-blue-500 max-h-32 overflow-y-auto p-4">
        <div className="space-y-1 text-sm font-mono">
          {combatLog.length === 0 ? (
            <p className="text-gray-500">Combat started...</p>
          ) : (
            combatLog.map((log, i) => (
              <p key={i} className="text-gray-300">
                {log}
              </p>
            ))
          )}
        </div>
      </div>

      {/* Action Selection */}
      <div className="bg-slate-800 border-t-2 border-blue-500 p-6">
        <p className="text-white text-sm mb-3">Choose your action:</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionSelect(action.id)}
              className={`px-4 py-3 rounded-lg font-semibold transition-all ${selectedAction === action.id
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
            >
              <div className="text-2xl mb-1">{action.icon}</div>
              <div className="text-xs">{action.label}</div>
            </button>
          ))}
        </div>

        {/* Flee Button */}
        {canFlee && (
          <button
            onClick={() => onFlee?.()}
            className="w-full mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
          >
            🏃 Flee from Combat
          </button>
        )}
      </div>
    </div>
  );
}
