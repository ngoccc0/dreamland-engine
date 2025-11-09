"use client";

import { useEffect, useMemo } from "react";
import { useSettings } from "@/context/settings-context";

type Dir = 'north' | 'south' | 'west' | 'east';

export interface KeyboardHandlers {
  move: (dir: Dir) => void;
  attack: () => void;
  openInventory?: () => void;
  openStatus?: () => void;
  openMap?: () => void;
  customAction?: () => void;
  pickUp?: () => void;
  hotkey?: (index: number) => void;
}

interface UseKeyboardBindingsOpts {
  handlers: KeyboardHandlers;
  popupOpen?: boolean; // if any major popup is open, keyboard bindings should be suppressed
  focusCustomActionInput?: () => void;
  enabled?: boolean;
  movementWhileTyping?: boolean; // allow movement keys while typing in inputs
}

export function useKeyboardBindings({ handlers, popupOpen = false, focusCustomActionInput, enabled = true, movementWhileTyping = true }: UseKeyboardBindingsOpts) {
  const { settings } = useSettings();

  const keyBindings = (settings as any).keyBindings ?? {};

  const keyToAction = useMemo(() => {
    const map = new Map<string, string>();
    const add = (k: string | string[] | undefined, action: string) => {
      if (!k) return;
      const keys = Array.isArray(k) ? k : [k];
      for (const key of keys) {
        if (!key) continue;
        map.set(key, action);
        // also map uppercase/lowercase variants for convenience when keys are letters
        if (key.length === 1) {
          map.set(key.toLowerCase(), action);
          map.set(key.toUpperCase(), action);
        }
      }
    };

    add(keyBindings.moveUp, 'moveUp');
    add(keyBindings.moveDown, 'moveDown');
    add(keyBindings.moveLeft, 'moveLeft');
    add(keyBindings.moveRight, 'moveRight');
    add(keyBindings.attack, 'attack');
    add(keyBindings.openInventory, 'openInventory');
    add(keyBindings.openStatus, 'openStatus');
    add(keyBindings.openMap, 'openMap');
  add(keyBindings.customAction, 'customAction');
  add((keyBindings as any).pickUp, 'pickUp');
  add((keyBindings as any).hot1, 'hot1');
  add((keyBindings as any).hot2, 'hot2');
  add((keyBindings as any).hot3, 'hot3');
  add((keyBindings as any).hot4, 'hot4');
  add((keyBindings as any).hot5, 'hot5');

    // Always include common defaults if not provided
    if (!map.has('ArrowUp')) map.set('ArrowUp', 'moveUp');
    if (!map.has('ArrowDown')) map.set('moveDown', 'moveDown');
    if (!map.has('ArrowLeft')) map.set('moveLeft', 'moveLeft');
    if (!map.has('ArrowRight')) map.set('moveRight', 'moveRight');
    if (!map.has(' ')) map.set(' ', 'attack');

    return map;
  }, [keyBindings]);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      try {
        if (popupOpen) return;

        const active = document.activeElement as HTMLElement | null;
        const tag = active?.tagName?.toUpperCase() ?? '';

        const action = keyToAction.get(e.key);
        // if not mapped, ignore
        if (!action) return;

        // If active element is an input/textarea/contentEditable and this is not a movement key
        const movementActions = new Set(['moveUp', 'moveDown', 'moveLeft', 'moveRight']);
        if (active && (tag === 'INPUT' || tag === 'TEXTAREA' || active.isContentEditable)) {
          if (!movementWhileTyping || !movementActions.has(action)) return;
        }

        // Prevent default browser behavior for mapped keys
        e.preventDefault?.();

        switch (action) {
          case 'moveUp':
            handlers.move('north');
            focusCustomActionInput?.();
            break;
          case 'moveDown':
            handlers.move('south');
            focusCustomActionInput?.();
            break;
          case 'moveLeft':
            handlers.move('west');
            focusCustomActionInput?.();
            break;
          case 'moveRight':
            handlers.move('east');
            focusCustomActionInput?.();
            break;
          case 'attack':
            handlers.attack();
            focusCustomActionInput?.();
            break;
          case 'openInventory':
            handlers.openInventory?.();
            focusCustomActionInput?.();
            break;
          case 'openStatus':
            handlers.openStatus?.();
            focusCustomActionInput?.();
            break;
          case 'openMap':
            handlers.openMap?.();
            focusCustomActionInput?.();
            break;
          case 'pickUp':
            handlers.pickUp?.();
            focusCustomActionInput?.();
            break;
          case 'hot1':
            handlers.hotkey?.(1);
            focusCustomActionInput?.();
            break;
          case 'hot2':
            handlers.hotkey?.(2);
            focusCustomActionInput?.();
            break;
          case 'hot3':
            handlers.hotkey?.(3);
            focusCustomActionInput?.();
            break;
          case 'hot4':
            handlers.hotkey?.(4);
            focusCustomActionInput?.();
            break;
          case 'hot5':
            handlers.hotkey?.(5);
            focusCustomActionInput?.();
            break;
          case 'customAction':
            handlers.customAction?.();
            focusCustomActionInput?.();
            break;
          default:
            break;
        }
      } catch (error: any) {
        // swallow errors
        // console.debug('[useKeyboardBindings] error', err);
      }
    };

    window.addEventListener('keydown', handler, { capture: true });
    return () => window.removeEventListener('keydown', handler, { capture: true });
  }, [keyToAction, handlers, popupOpen, enabled, focusCustomActionInput, movementWhileTyping]);
}

export default useKeyboardBindings;
