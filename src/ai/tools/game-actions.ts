/**
 * Lazy-loading wrapper for game action tools.
 *
 * This module wraps the game-actions tools to defer their initialization
 * until they're actually used (i.e., at request time), not at module load time.
 * This prevents Genkit initialization errors during Next.js build.
 */

import { getAi } from '@/ai/genkit';
import type { Genkit } from 'genkit';

// Tool caches
let toolsInitialized = false;
let toolsCache: any = {};

/**
 * Initialize all game action tools on first call
 */
async function initializeGameTools() {
    if (toolsInitialized) return toolsCache;

    const ai = await getAi();

    // Import and execute the tool definitions within the async context
    // where ai is guaranteed to be available
    const toolDefinitions = await import('./game-actions-impl');
    
    // Re-export all tools from the cached definitions
    Object.assign(toolsCache, toolDefinitions);
    toolsInitialized = true;
    
    return toolsCache;
}

/**
 * Lazy-load and return the game tools
 */
export async function getGameTools() {
    return initializeGameTools();
}

// Create proxy exports that ensure tools are available before use
export async function getPlayerAttackTool() {
    const tools = await getGameTools();
    return tools.playerAttackTool;
}

export async function getTakeItemTool() {
    const tools = await getGameTools();
    return tools.takeItemTool;
}

export async function getUseItemTool() {
    const tools = await getGameTools();
    return tools.useItemTool;
}

export async function getTameEnemyTool() {
    const tools = await getGameTools();
    return tools.tameEnemyTool;
}

export async function getUseSkillTool() {
    const tools = await getGameTools();
    return tools.useSkillTool;
}

export async function getCompleteQuestTool() {
    const tools = await getGameTools();
    return tools.completeQuestTool;
}

export async function getStartQuestTool() {
    const tools = await getGameTools();
    return tools.startQuestTool;
}

// Re-export schemas (these don't need the AI instance)
export {
    PlayerAttackInputSchema, PlayerAttackOutputSchema,
    TakeItemInputSchema, TakeItemOutputSchema,
    UseItemInputSchema, UseItemOutputSchema,
    TameEnemyInputSchema, TameEnemyOutputSchema,
    UseSkillInputSchema, UseSkillOutputSchema,
    CompleteQuestInputSchema, CompleteQuestOutputSchema,
    StartQuestInputSchema, StartQuestOutputSchema
} from './game-actions-impl';
