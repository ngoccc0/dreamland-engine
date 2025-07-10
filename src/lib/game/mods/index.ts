/**
 * @fileoverview This is the central registry for all mods.
 * To add a new mod to the game, create your mod file within this directory
 * and then import and add it to the `allMods` array below.
 * The game engine will automatically load and integrate all mods listed here.
 */

import type { ModDefinition } from '@/lib/game/types';
import { mod as exampleMod } from './example_mod';

// Add all your imported mods to this array.
export const allMods: ModDefinition[] = [
  exampleMod,
];
