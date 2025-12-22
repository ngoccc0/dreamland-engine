/**
 * @file src/hooks/use-context-action.ts
 * @description Hook for context-sensitive action determination
 * 
 * @remarks
 * Determines the primary action available in the current chunk based on:
 * - Enemy presence (attack)
 * - Items on ground (pickup)
 * - Structures with effects (rest)
 * - Interactive elements (dialogue)
 * 
 * Returns action object with type, label, handler, and icon for UI rendering.
 */

import { useCallback } from 'react';
import type { Language, TranslatableString } from '@/core/types/game';

export interface ContextAction {
  type: 'attack' | 'pickup' | 'rest' | 'interact' | 'explore';
  label: string;
  handler: () => void;
  icon: string;
}

interface UseContextActionParams {
  currentChunk: any;
  pickUpActions: any[];
  otherActions: any[];
  language: Language;
  t: (key: string) => string;
  getTranslatedText: (text: TranslatableString | null | undefined, lang: Language, tFunc?: any) => string;
  handleAttack: () => void;
  handleRest: () => void;
  handleActionClick: (actionId: number) => void;
}

/**
 * Hook for determining context-sensitive game action
 * 
 * @remarks
 * Analyzes current chunk state to determine the most relevant action.
 * Priority: attack > pickup > rest > interact > explore
 * 
 * @returns ContextAction with type, label, handler, and icon
 * 
 * @example
 * ```tsx
 * const contextAction = useContextAction({
 *   currentChunk,
 *   pickUpActions,
 *   otherActions,
 *   // ... other params
 * });
 * return <InteractButton action={contextAction} />;
 * ```
 */
export function useContextAction({
  currentChunk,
  pickUpActions,
  otherActions,
  language,
  t,
  getTranslatedText,
  handleAttack,
  handleRest,
  handleActionClick,
}: UseContextActionParams): ContextAction {
  const restingPlace = currentChunk?.structures?.find((s: any) => s.restEffect);

  return useCallback((): ContextAction => {
    if (currentChunk?.enemy) {
      return {
        type: 'attack',
        label: t('attack') || 'Attack',
        handler: handleAttack,
        icon: '⚔️',
      };
    }
    if (pickUpActions.length > 0) {
      return {
        type: 'pickup',
        label: t('pickUpItems') || 'Pick Up',
        handler: () => {
          // Handler will be passed in from component (setPickupDialogOpen)
        },
        icon: '🎒',
      };
    }
    if (restingPlace) {
      return {
        type: 'rest',
        label: t('rest') || 'Rest',
        handler: handleRest,
        icon: '🛌',
      };
    }
    if (otherActions.length > 0) {
      const action = otherActions[0];
      const actionText = getTranslatedText(
        { key: action.textKey, params: action.params },
        language,
        t
      );
      return {
        type: 'interact',
        label: actionText,
        handler: () => handleActionClick(action.id),
        icon: '💬',
      };
    }
    return {
      type: 'explore',
      label: t('explore') || 'Explore',
      handler: () => { },
      icon: '🔍',
    };
  }, [
    currentChunk?.enemy,
    pickUpActions.length,
    restingPlace,
    otherActions.length,
    t,
    handleAttack,
    handleRest,
    handleActionClick,
    language,
  ])();
}

export default useContextAction;
