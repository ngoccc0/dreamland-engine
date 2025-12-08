/**
 * Lazy-loading wrapper for game action tools.
 *
 * Delays Genkit initialization until first actual use, preventing
 * "noConflict is not a function" errors during Next.js build time.
 *
 * This module exports async getter functions that lazily initialize tools
 * on first call. Each subsequent call returns the cached tool.
 */

import { initializeGameTools } from './game-actions-impl';

/**
 * Initialize all tools on first call
 */
async function getTools() {
    return initializeGameTools();
}

/**
 * Get the playerAttack tool
 */
export async function getPlayerAttackTool() {
    const tools = await getTools();
    return tools.playerAttackTool;
}

/**
 * Get the takeItem tool
 */
export async function getTakeItemTool() {
    const tools = await getTools();
    return tools.takeItemTool;
}

/**
 * Get the useItem tool
 */
export async function getUseItemTool() {
    const tools = await getTools();
    return tools.useItemTool;
}

/**
 * Get the tameEnemy tool
 */
export async function getTameEnemyTool() {
    const tools = await getTools();
    return tools.tameEnemyTool;
}

/**
 * Get the useSkill tool
 */
export async function getUseSkillTool() {
    const tools = await getTools();
    return tools.useSkillTool;
}

/**
 * Get the completeQuest tool
 */
export async function getCompleteQuestTool() {
    const tools = await getTools();
    return tools.completeQuestTool;
}

/**
 * Get the startQuest tool
 */
export async function getStartQuestTool() {
    const tools = await getTools();
    return tools.startQuestTool;
}

/**
 * Re-export schemas (no Genkit init needed for these)
 */
export {
    PlayerAttackInputSchema, PlayerAttackOutputSchema,
    TakeItemInputSchema, TakeItemOutputSchema,
    UseItemInputSchema, UseItemOutputSchema,
    TameEnemyInputSchema, TameEnemyOutputSchema,
    UseSkillInputSchema, UseSkillOutputSchema,
    CompleteQuestInputSchema, CompleteQuestOutputSchema,
    StartQuestInputSchema, StartQuestOutputSchema,
} from './game-actions-impl';
