import type { TranslationKey } from "@/lib/core/i18n"
/**
 * World chunk generation engine responsible for creating diverse, procedurally-generated game environments.
 * This module orchestrates the complete pipeline from terrain templates to populated chunks with items,
 * NPCs, structures, enemies, and interactive actions.
 *
 * Key responsibilities:
 * - Terrain-based content generation using template-driven approach
 * - Probabilistic entity spawning with environmental and world-profile modifiers
 * - Resource distribution balancing across chunk properties
 * - Integration of custom-generated content (items, structures) with static templates
 * - Action generation for player interaction with spawned entities
 * - Multi-language support for generated descriptions and content
 *
 * Generation pipeline:
 * 1. **Template Selection**: Choose terrain-appropriate templates for base content
 * 2. **Spawn Candidate Preparation**: Combine static template + custom catalog items
 * 3. **Environmental Filtering**: Apply chunk conditions to eligible entities
 * 4. **Probability Calculation**: Factor in world profile, resource scores, and tier modifiers
 * 5. **Entity Selection**: Use selectEntities() for probabilistic spawning
 * 6. **Content Assembly**: Generate final chunk with descriptions, actions, and entities
 *
 * Data flow and interdependencies:
 * - Terrain templates → provide base spawn candidates and descriptions
 * - ItemDefinition.naturalSpawn → defines custom item spawning rules
 * - WorldProfile → global multipliers for spawn rates and resource density
 * - Chunk properties → environmental factors affecting spawn probabilities
 * - selectEntities() → core probabilistic selection algorithm
 * - Translation system → multi-language content generation
 *
 * Performance characteristics:
 * - O(n*m) complexity where n=spawn candidates, m=chunk filtering operations
 * - Optimized for world generation with batched chunk processing
 * - Memory efficient with streaming entity resolution
 * - Extensive logging for spawn debugging and balance tuning
 */

/**
 * World chunk generation engine responsible for creating diverse, procedurally-generated game environments.
 * This module orchestrates the complete pipeline from terrain templates to populated chunks with items,
 * NPCs, structures, enemies, and interactive actions.
 *
 * Key responsibilities:
 * - Terrain-based content generation using template-driven approach
 * - Probabilistic entity spawning with environmental and world-profile modifiers
 * - Resource distribution balancing across chunk properties
 * - Integration of custom-generated content (items, structures) with static templates
 * - Action generation for player interaction with spawned entities
 * - Multi-language support for generated descriptions and content
 *
 * Generation pipeline:
 * 1. **Template Selection**: Choose terrain-appropriate templates for base content
 * 2. **Spawn Candidate Preparation**: Combine static template + custom catalog items
 * 3. **Environmental Filtering**: Apply chunk conditions to eligible entities
 * 4. **Probability Calculation**: Factor in world profile, resource scores, and tier modifiers
 * 5. **Entity Selection**: Use selectEntities() for probabilistic spawning
 * 6. **Content Assembly**: Generate final chunk with descriptions, actions, and entities
 *
 * Data flow and interdependencies:
 * - Terrain templates → provide base spawn candidates and descriptions
 * - ItemDefinition.naturalSpawn → defines custom item spawning rules
 * - WorldProfile → global multipliers for spawn rates and resource density
 * - Chunk properties → environmental factors affecting spawn probabilities
 * - selectEntities() → core probabilistic selection algorithm
 * - Translation system → multi-language content generation
 *
 * Performance characteristics:
 * - O(n*m) complexity where n=spawn candidates, m=chunk filtering operations
 * - Optimized for world generation with batched chunk processing
 * - Memory efficient with streaming entity resolution
 * - Extensive logging for spawn debugging and balance tuning
 */

import type {
    WorldProfile,
    ItemDefinition,
    GeneratedItem,
    Structure,
    Language,
    Npc,
    ChunkItem,
    Action,
    Terrain,
    World,
    Region,
    Season,
    SoilType,
    Enemy
} from "@/core/types/game";
import { translations } from "@/lib/core/i18n";
import { getTemplates } from "@/lib/game/templates";
import { creatureTemplates } from '@/core/data/creatures';
import { logger } from "@/lib/core/logger";
import { getTranslatedText, resolveItemId } from "@/lib/utils";
import { getRandomInRange, getValidAdjacentTerrains, weightedRandom } from "./world-generation";
import { selectEntities } from "./entity-generation";
import { worldConfig } from "@/core/data/biome-config";
import { generateRegion } from "./region-generation";

// Import types and utilities from chunk-generation submodules
import type { SpawnCandidate, SpawnConditions, ChunkGenerationResult, ChunkBaseData } from "./chunk-generation/types";
import { softcap, createTranslationHelper, clamp01, calculateResourceCapacity } from "./chunk-generation/helpers";
import { resolveItemByName } from "./chunk-generation/resolver";
import { processStructureLoot } from "./chunk-generation/loot";
import { processSelectedItems } from "./chunk-generation/item-processor";
import { generateChunkActions } from "./chunk-generation/actions";
import { prepareSpawnCandidates } from "./chunk-generation/spawn-candidates";
import { calculateResourceParameters } from "./chunk-generation/resource-scoring";

// ============================================================================
// TYPE DEFINITIONS (see ./chunk-generation/types.ts for detailed documentation)
// ============================================================================
// SpawnConditions, SpawnCandidate, ChunkGenerationResult, ChunkBaseData
// are now defined in ./chunk-generation/types.ts for better modularity

/**
 * Core chunk content generation algorithm that transforms environmental data into playable game content.
 * This function implements the complete procedural generation pipeline, combining terrain templates,
 * custom content, and probabilistic spawning to create diverse, interactive chunks.
 *
 * Generation pipeline overview:
 * 1. **Template Resolution**: Select terrain-appropriate template with descriptions and base entities.
 * 2. **Spawn Candidate Assembly**: Merge static template entities with custom-generated content.
 * 3. **Resource Capacity Calculation**: Determine max items based on environmental factors.
 * 4. **Entity Selection**: Apply probabilistic spawning via `selectEntities()` with world modifiers.
 * 5. **Content Resolution**: Convert entity references to actual game objects with quantities.
 * 6. **Structure Processing**: Handle loot distribution and structure-specific spawning.
 * 7. **Action Generation**: Create interactive actions based on spawned content.
 * 8. **Result Assembly**: Package everything into final `ChunkGenerationResult`.
 *
 * Spawn candidate preparation:
 * - **Static candidates**: From terrain templates (e.g., `terrainTemplate.items`, `NPCs`, `enemies`, `structures`).
 * - **Custom candidates**: From `customItemCatalog` filtered by `spawnEnabled` and `spawnBiomes`.
 * - **Combined pool**: Merged arrays passed to `selectEntities()` for unified probabilistic selection.
 *
 * Resource capacity formula:
 * ```
 * // chunkResourceScore is a normalized 0..1 score derived from chunk metrics
 * chunkResourceScore = (veg/100 + moist/100 + (1-human/100) + (1-danger/100) + (1-pred/100)) / 5
 * // worldProfile.resourceDensity is now a multiplier (0.5..1.5). We apply it directly
 * // to scale the chunkCountMultiplier so richer worlds yield more items.
 * chunkCountMultiplier = 0.5 + (chunkResourceScore * 1.0 * worldProfile.resourceDensity)
 * maxItems = max(1, floor(10 * effectiveMultiplier * chunkCountMultiplier))
 * ```
 *
 * Remarks:
 * - This formula makes per-chunk item counts easily tunable via `WorldProfile.resourceDensity`.
 * - Use `spawnMultiplier` for global spawn frequency adjustments that are softcapped.
 *
 * Item resolution process:
 * 1. `selectEntities()` returns entity references with names.
 * 2. `resolveItemByName()` converts display names to `ItemDefinition` objects.
 * 3. Quantity is determined from `ItemDefinition.baseQuantity` range.
 * 4. `ChunkItem` objects are created with resolved properties.
 *
 * Structure loot handling:
 * - Loot items have individual spawn chances within structures.
 * - Existing items in the chunk get quantity increases (stacking).
 * - New items are added to the `spawnedItems` array.
 *
 * Action generation rules:
 * - Enemy observation actions for spawned enemies.
 * - NPC interaction actions for spawned NPCs.
 * - Item pickup actions for all spawned items.
 * - Generic exploration actions are always available.
 *
 * Interdependencies:
 * - `selectEntities()` → uses `entity-generation.ts` for probabilistic selection.
 * - `ItemDefinition` → provides spawn rules and properties via `naturalSpawn`.
 * - `WorldProfile` → global spawn multipliers and resource density scaling.
 * - Terrain templates → base content and spawn candidates.
 * - Translation system → multi-language descriptions and action text.
 *
 * Performance considerations:
 * - O(n) for spawn candidate preparation where n = template + custom items.
 * - O(m) for entity selection where m = `maxItems` parameter.
 * - Extensive debug logging for spawn balance tuning.
 * - Memory efficient with streaming resolution of large item catalogs.
 *
 * @param chunkData - Environmental properties defining chunk characteristics and spawn conditions.
 * @param worldProfile - Global world settings affecting spawn rates and content density.
 * @param allItemDefinitions - Complete registry of item definitions for resolution and validation.
 * @param customItemCatalog - Procedurally generated items that can spawn in addition to templates.
 * @param customStructures - Custom structures available for spawning in this chunk.
 * @param language - Language code for generating localized descriptions and actions.
 * @returns Complete chunk content ready for game integration.
 *
 * @example
 * ```typescript
 * const chunk = generateChunkContent(
 *   {
 *     vegetationDensity: 70, moisture: 60, elevation: 100, dangerLevel: 30,
 *     magicAffinity: 20, humanPresence: 10, predatorPresence: 40, temperature: 25,
 *     terrain: 'forest', explorability: 80, soilType: 'fertile', travelCost: 1,
 *     lightLevel: 100, windLevel: 50
 *   },
 *   { spawnMultiplier: 1.2, resourceDensity: 75, difficulty: 0.5, name: 'Test World' },
 *   itemDefinitions,
 *   customGeneratedItems,
 *   customGeneratedStructures,
 *   'en'
 * );
 * // Result contains description, NPCs, items, structures, enemy, and actions
 * ```
 */
export function generateChunkContent(
    chunkData: ChunkBaseData,
    worldProfile: WorldProfile,
    allItemDefinitions: Record<string, ItemDefinition>,
    customItemCatalog: GeneratedItem[],
    customStructures: Structure[],
    language: Language
): ChunkGenerationResult {
    logger.debug('[generateChunkContent] STARTING', { chunkData, customItemCatalogLength: customItemCatalog.length });

    /**
     * Local translation helper function.
     * This function retrieves translated text for a given key, falling back to English if the target language is not available.
     * It also handles basic string replacements for dynamic content within translations.
     * @param key - The translation key to look up.
     * @param replacements - Optional key-value pairs for replacing placeholders (e.g., `{count}`) in the translated text.
     * @returns The translated string, or the key itself if no translation is found.
     */
    // Use shared translation helper and softcap util from chunk-generation/helpers
    const t = createTranslationHelper(language);

    const templates = getTemplates(language);
    const terrainTemplate = templates[chunkData.terrain];

    if (!terrainTemplate) {
        logger.error(`[generateChunkContent] No template found for terrain: ${chunkData.terrain}`);
        return {
            description: "An unknown and undescribable area.",
            NPCs: [],
            items: [],
            structures: [],
            enemy: null,
            actions: [],
            plants: [],
        };
    }

    // ========================================================================
    // DESCRIPTION GENERATION - Create a descriptive text for the chunk
    // ========================================================================
    // Select random template and replace placeholders with adjectives and features
    const descriptionTemplates = (terrainTemplate.descriptionTemplates?.short || ["A generic area."]).filter(Boolean);
    const finalDescription = descriptionTemplates[Math.floor(Math.random() * descriptionTemplates.length)]
        .replace('[adjective]', (terrainTemplate.adjectives || ['normal'])[Math.floor(Math.random() * (terrainTemplate.adjectives || ['normal']).length)])
        .replace('[feature]', (terrainTemplate.features || ['nothing special'])[Math.floor(Math.random() * (terrainTemplate.features || ['nothing special']).length)]);

    // ========================================================================
    // SPAWN MULTIPLIER SCALING - Apply softcap to prevent excessive spawning
    // ========================================================================
    // Apply a softcap to the world's spawn multiplier to prevent excessive spawning.
    // This ensures that even with high spawn multipliers, the game remains balanced.
    const effectiveMultiplier = softcap(worldProfile?.spawnMultiplier ?? 1);

    // ========================================================================
    // SPAWN CANDIDATE PREPARATION - Organize items, plants, and animals by terrain
    // ========================================================================
    // Delegate to helper for clean separation of candidate preparation logic
    const { itemSpawnCandidates, plantSpawnCandidates, animalSpawnCandidates } = prepareSpawnCandidates(
        chunkData,
        terrainTemplate,
        creatureTemplates,
        customItemCatalog,
        t
    );

    logger.debug('[generateChunkContent] spawn candidates', {
        itemSpawnCandidatesLength: itemSpawnCandidates.length,
        plantSpawnCandidatesLength: plantSpawnCandidates.length,
        animalSpawnCandidatesLength: animalSpawnCandidates.length
    });

    // ========================================================================
    // ITEM SPAWNING PIPELINE - Multi-stage selection with budget allocation
    // ========================================================================
    // Delegate resource scoring to helper for clean parameter calculation
    const { chunkResourceScore, worldDensityScale, maxItems, chunkFindChance } = calculateResourceParameters(
        chunkData,
        worldProfile,
        effectiveMultiplier
    );

    let spawnedItemRefs: any[] = [];
    // Only proceed with item selection if a random roll passes the chunkFindChance.
    if (Math.random() < chunkFindChance) {
        // Implement multi-stage selection pipeline:
        // 1) Two-stage sampling: Reduce the pool of candidates to a manageable size (M).
        // 2) Budget allocation per chunk: Assign a "cost" to items based on rarity and a "budget" based on world density.
        // 3) Diminishing chance scaling: Adjust final spawn chances based on how many items passed the budget.
        // 4) Final roll: Perform the final probabilistic selection.

        /**
         * Local helper function to resolve an item definition from its display name or key.
         * It first attempts a direct lookup by key in `allItemDefinitions`. If not found, it iterates through all definitions
         * to find a match based on the translated display name (English or Vietnamese).
         * @param displayOrKey - The display name or key of the item to resolve.
         * @returns The {@link ItemDefinition} if found, otherwise `undefined`.
         */
        const resolveDef = (displayOrKey: string): ItemDefinition | undefined => {
            // Direct key lookup first for efficiency.
            if (allItemDefinitions[displayOrKey]) return allItemDefinitions[displayOrKey];
            // Otherwise, search definitions for a translated/display name match (en/vi).
            for (const key of Object.keys(allItemDefinitions)) {
                const def = allItemDefinitions[key];
                // `def.name` can be a TranslatableString object or a plain string.
                const defNameAny: any = def.name;
                if (typeof defNameAny === 'string') {
                    if (defNameAny === displayOrKey) return def;
                } else if (defNameAny) {
                    // Check both English and Vietnamese translations for a match.
                    if (defNameAny.en === displayOrKey || defNameAny.vi === displayOrKey) return def;
                }
            }
            return undefined; // Return undefined if no match is found.
        };

        const candidateList = itemSpawnCandidates.filter(Boolean); // Filter out any null/undefined candidates.

        // Stage 2: Two-stage sampling.
        // Determine `M`, the number of candidates to sample, based on the total number of candidates.
        // This uses a logarithmic scale to keep `M` reasonable even with many candidates.
        const M = Math.min(6 + Math.floor(Math.log(Math.max(1, candidateList.length))), candidateList.length);
        /**
         * Shuffles an array and returns the first `m` elements.
         * This is a standard Fisher-Yates (Knuth) shuffle implementation.
         * @param arr - The array to sample from.
         * @param m - The number of elements to return.
         * @returns A new array containing `m` randomly selected elements from `arr`.
         */
        const randomSample = (arr: any[], m: number) => {
            const copy = arr.slice(); // Create a copy to avoid modifying the original array.
            // Iterate backwards through the array.
            for (let i = copy.length - 1; i > 0; i--) {
                // Pick a random index from 0 to i.
                const j = Math.floor(Math.random() * (i + 1));
                // Swap element at i with the element at the random index j.
                const tmp = copy[i];
                copy[i] = copy[j];
                copy[j] = tmp;
            }
            return copy.slice(0, m); // Return the first `m` elements of the shuffled array.
        };

        const sampledCandidates = randomSample(candidateList, M); // Get `M` random candidates.

        // (No heuristic prioritization here) The responsibility for ensuring essential
        // crafting materials appear in appropriate biomes belongs in terrain templates
        // and item definitions. We intentionally avoid ad-hoc keyword heuristics.

        /**
         * Stage 3: Budget system.
         * - `chunkBudget` is a soft currency representing how many or how expensive items this chunk can support.
         *   It is derived from world resource density, so richer worlds allow more or pricier spawns.
         * - Each item's "rarity" (normalized to [0.05, 1.0]) is mapped to a "cost". Higher rarity items have a higher cost.
         * - The `cost` formula is intentionally conservative but scaled down slightly (multiplied by `costScale`)
         *   so very-high-tier items still have a non-zero chance to appear in resource-rich contexts.
         *   A very small fallback chance is included later to allow players to occasionally discover rare items
         *   even in modest chunks.
         */
        let chunkBudget = 1.0 * (worldProfile?.resourceDensity ?? 1); // Initialize budget based on world density.
        const costScale = 0.6; // Scale factor to reduce the raw cost of items, making rarer items more accessible.
        const preBudgetSelected: SpawnCandidate[] = []; // Array to hold candidates that pass the budget check.
        // Iterate through the sampled candidates to determine if they fit within the chunk's budget.
        for (const cand of sampledCandidates) {
            const def = resolveDef(typeof cand.name === 'string' ? cand.name : String(cand.name));
            // Derive rarity: prefer explicit rarity, else infer from tier, else fallback to a default.
            let rarity = (def as any)?.rarity as number | undefined;
            if (rarity === undefined) {
                if (def && typeof def.tier === 'number') {
                    // Infer rarity from tier: lower tier = higher rarity (closer to 1).
                    rarity = Math.max(0.05, 1 - (def.tier - 1) * 0.15);
                } else {
                    rarity = 0.2; // Default moderate rarity if tier is not available.
                }
            }
            rarity = Math.max(0.05, Math.min(1, rarity)); // Normalize rarity to be within [0.05, 1].

            // Calculate the cost of the item: inversely proportional to rarity, scaled by `costScale`.
            const cost = (1 / Math.max(0.05, rarity)) * costScale;
            // If the item's cost does not exceed the remaining budget, add it to the pre-selected list and deduct its cost.
            if (chunkBudget - cost >= 0) {
                preBudgetSelected.push(cand);
                chunkBudget -= cost;
            }
        }

        // Stage 4: Diminishing scaling.
        // Reduce final spawn chances when many items have passed the budget, preventing over-saturation.
        const N = preBudgetSelected.length; // Number of items that passed the budget.
        // The scale factor decreases as N increases, reducing the probability of each item.
        // `Math.pow(Math.max(0, N), 0.6)` ensures the exponent is non-negative.
        const scaleFactor = 1 / (0.5 + Math.pow(Math.max(0, N), 0.6));

        // Stage 5: Final roll.
        // Iterate through the candidates that passed the budget and perform a final random check to determine if they spawn.
        for (const cand of preBudgetSelected) {
            const def = resolveDef(typeof cand.name === 'string' ? cand.name : String(cand.name));
            let rarity = (def as any)?.rarity as number | undefined;
            if (rarity === undefined) {
                if (def && typeof def.tier === 'number') {
                    rarity = Math.max(0.05, 1 - (def.tier - 1) * 0.15);
                } else {
                    rarity = 0.2;
                }
            }
            rarity = Math.max(0.05, Math.min(1, rarity)); // Normalize rarity.

            const baseChance = cand.conditions?.chance ?? 1; // Use the candidate's base chance, defaulting to 1.
            // Calculate the final spawn chance by combining base chance, rarity, world density, effective multiplier, and the scale factor.
            let finalChance = baseChance * rarity * (worldDensityScale ?? 1) * effectiveMultiplier * scaleFactor;
            finalChance = Math.max(0, Math.min(0.95, finalChance)); // Clamp final chance between 0 and 0.95.

            // If the random roll passes the final chance, add the candidate to the list of spawned items.
            if (Math.random() < finalChance) {
                spawnedItemRefs.push(cand);
            }

            // Enforce a hard cap on the number of unique items to prevent exceeding `maxItems`.
            if (spawnedItemRefs.length >= maxItems) break;
        }

        // Fallback for ultra-rare items:
        // If the budget selection process resulted in no items being selected (`spawnedItemRefs.length === 0`),
        // and there were sampled candidates, this block provides a small chance to spawn a top-tier candidate.
        // This prevents tier-5/6 items from being impossible to find in practice, while still keeping them rare.
        if (spawnedItemRefs.length === 0 && sampledCandidates.length > 0) {
            // Find the candidate with the highest tier among the sampled ones.
            let bestCand: any | null = null;
            let bestTier = -Infinity;
            for (const sc of sampledCandidates) {
                const def = resolveDef(typeof sc.name === 'string' ? sc.name : String(sc.name));
                const tier = (def as any)?.tier ?? 0; // Default tier to 0 if not found.
                if (tier > bestTier) {
                    bestTier = tier;
                    bestCand = sc;
                }
            }
            // If the highest tier found is 5 or greater, give it a small fallback chance to spawn.
            // This chance is scaled by world density and the global effective multiplier.
            if (bestCand && bestTier >= 5) {
                const fallbackChance = 0.02 * (worldDensityScale ?? 1) * effectiveMultiplier; // ~2% base chance.
                if (Math.random() < fallbackChance) {
                    spawnedItemRefs.push(bestCand); // Add the rare item if the roll succeeds.
                    logger.debug('[generateChunkContent] rare fallback triggered', { bestTier, fallbackChance });
                }
            }
        }
        // No post-budget heuristics; templates should provide the necessary chance for essentials.

        logger.debug('[generateChunkContent] multi-stage selection', { candidateCount: candidateList.length, sampled: sampledCandidates.length, preBudget: preBudgetSelected.length, final: spawnedItemRefs.length, chunkBudgetLeft: chunkBudget });
    } else {
        // Log if the initial chunkFindChance roll failed, meaning no items will spawn in this chunk.
        logger.debug('[generateChunkContent] chunkFindChance failed, no items this chunk', { chunkFindChance });
    }
    logger.debug('[generateChunkContent] spawnedItemRefs', { spawnedItemRefsLength: spawnedItemRefs.length, spawnedItemRefs });
    const spawnedItems: ChunkItem[] = []; // Array to hold the final `ChunkItem` objects.

    // ========================================================================
    // ITEM RESOLUTION - Convert item references to ChunkItem objects
    // ========================================================================
    // Use the item processor helper for consistent quantity calculation and logging
    processSelectedItems(spawnedItemRefs, spawnedItems, (name) => resolveItemByName(name, allItemDefinitions));

    // ========================================================================
    // NPC SPAWNING - Probabilistic NPC selection with resource gates
    // ========================================================================
    // NPC spawn gating: avoid NPCs in nearly every chunk. Use a per-chunk gate
    // so only a fraction of chunks attempt to spawn NPCs. When they do, limit to 1.
    const npcBaseFindChance = 0.01; // ~1% baseline a chunk will try to spawn NPCs
    const npcFindMultiplier = 0.5 + (chunkResourceScore * 0.5); // range [0.5,1.0]
    const npcFindChance = Math.max(0.01, Math.min(0.6, npcBaseFindChance * (worldDensityScale ?? 1) * npcFindMultiplier * effectiveMultiplier));
    let spawnedNPCs: Npc[] = [];
    if (Math.random() < npcFindChance) {
        // Map defensively in case `selectEntities` returns refs without `data`.
        spawnedNPCs = (selectEntities(terrainTemplate.NPCs, 1, chunkData, allItemDefinitions, worldProfile) || []).map(ref => ref?.data);
    } else {
        logger.debug('[generateChunkContent] npcFindChance failed, no NPCs this chunk', { npcFindChance });
    }

    // Filter out any null/undefined enemy candidates from the terrain template.
    // Also include creatures list from templates (legacy) and creature-level natural spawn candidates.
    let allEnemyCandidates = [...(terrainTemplate.enemies || []), ...(terrainTemplate.creatures || [])].filter(Boolean);
    // Append creature-level candidates (those include `data` with creature definition)
    if (animalSpawnCandidates.length > 0) {
        allEnemyCandidates = [...allEnemyCandidates, ...animalSpawnCandidates];
    }

    // Enemy spawn gating: keep enemies relatively rare per-chunk. Use a smaller base chance
    // and only allow at most 1 enemy to spawn per chunk to avoid battlefield-like density.
    const enemyBaseFindChance = 0.006; // ~6% baseline a chunk will try to spawn an enemy
    // enemyMultiplier increases with dangerLevel so dangerous areas are more likely to have enemies.
    const enemyMultiplier = 0.5 + (clamp01(chunkData.dangerLevel ?? 50) * 0.8); // range [0.5,1.3]
    const enemyFindChance = Math.max(0.005, Math.min(0.5, enemyBaseFindChance * (worldDensityScale ?? 1) * enemyMultiplier * effectiveMultiplier));
    let spawnedEnemies: any[] = [];
    if (Math.random() < enemyFindChance) {
        spawnedEnemies = selectEntities(allEnemyCandidates, 1, chunkData, allItemDefinitions, worldProfile);
    } else {
        logger.debug('[generateChunkContent] enemyFindChance failed, no enemies this chunk', { enemyFindChance });
    }

    // ========================================================================
    // STRUCTURE SPAWNING - Select and process structures with loot distribution
    // ========================================================================
    let spawnedStructures: Structure[] = [];
    // Select structures to spawn based on terrain template. Limits to 2 structures.
    const spawnedStructureRefs = selectEntities((terrainTemplate.structures || []).filter(Boolean), 2, chunkData, allItemDefinitions, worldProfile);

    // ========================================================================
    // STRUCTURE PROCESSING - Handle loot distribution from spawned structures
    // ========================================================================
    // Delegate to helper for cleaner logic and reusability
    processStructureLoot(spawnedStructureRefs, spawnedItems, allItemDefinitions, (name) => resolveItemByName(name, allItemDefinitions));
    spawnedStructures = spawnedStructureRefs;

    // Determine the final enemy to spawn, if any. `selectEntities` returns references, so we extract the data.
    const enemyData = spawnedEnemies.length > 0 ? spawnedEnemies[0].data : null;
    // ========================================================================
    // ENEMY FINALIZATION - Convert enemy references to Enemy objects
    // ========================================================================
    // Construct the `Enemy` object with default values if not specified in the template.
    const spawnedEnemy = enemyData ? {
        type: enemyData.type,
        hp: enemyData.hp ?? 100,
        damage: enemyData.damage ?? 10,
        behavior: enemyData.behavior ?? 'aggressive',
        size: enemyData.size ?? 'medium',
        emoji: enemyData.emoji ?? '👾',
        satiation: 0, // Initial satiation is 0.
        maxSatiation: enemyData.maxSatiation ?? 100,
        diet: enemyData.diet ?? ['meat'],
        senseEffect: enemyData.senseEffect ? { // Configure sensory effect if defined.
            range: enemyData.senseRadius ?? 3,
            type: 'detection'
        } : undefined
    } : null;

    // ========================================================================
    // ACTION GENERATION - Create interactive actions for the player
    // ========================================================================
    // Use helper function to generate all actions based on spawned entities
    const actions = generateChunkActions(spawnedEnemy, spawnedNPCs, spawnedItems, t);

    // Instrumentation: log a compact summary for debugging spawn issues.
    logger.debug('[generateChunkContent] spawn summary', {
        terrain: chunkData.terrain,
        spawnedItemsCount: spawnedItems.length,
        spawnedEnemy: !!spawnedEnemy,
        sampleItems: spawnedItems.slice(0, 3).map(i => getTranslatedText(i.name, 'en')).join(', ') // Log names of first 3 items.
    });
    logger.debug('[generateChunkContent] FINAL spawnedItems', { spawnedItemsLength: spawnedItems.length, spawnedItems });

    // ========================================================================
    // PLANT SPAWNING - Dense vegetation coverage with random selection
    // ========================================================================
    // Plants now spawn nearly everywhere (95%+) to create immersive vegetation coverage.
    // Increased from 85% → 95% base chance; maxPlantsPerChunk from 8 → 18 types.
    // This ensures most chunks are covered with vegetation (80-90% cell density).
    const plantBaseFindChance = 0.95; // Nearly guaranteed plant spawning for dense world
    const maxPlantsPerChunk = 18; // Allow up to 18 different plant types per chunk (3x increase)
    const plantFindMultiplier = 1.0 + (chunkResourceScore * 1.0); // Scale with resource richness
    const plantFindChance = Math.max(0.01, Math.min(0.99, plantBaseFindChance * (worldDensityScale ?? 1) * plantFindMultiplier * effectiveMultiplier));

    let spawnedPlants: any[] = [];
    if (Math.random() < plantFindChance && plantSpawnCandidates.length > 0) {
        // Simple selection for plants - take up to maxPlantsPerChunk
        const numPlantsToSelect = Math.min(maxPlantsPerChunk, Math.floor(Math.random() * maxPlantsPerChunk) + 1);
        const shuffledPlants = [...plantSpawnCandidates].sort(() => Math.random() - 0.5);
        spawnedPlants = shuffledPlants.slice(0, numPlantsToSelect).map(plantRef => {
            const plantDef = plantRef.data;
            if (plantDef) {
                return {
                    definition: plantDef,
                    hp: plantDef.hp,
                    maturity: 0,
                    age: 0
                };
            }
            return null;
        }).filter(Boolean);
    }

    // ========================================================================
    // ANIMAL SPAWNING - Low-chance creature spawning scaled by danger level
    // ========================================================================
    const animalBaseFindChance = 0.08; // Lower chance for animals
    const maxAnimalsPerChunk = 1; // Usually only 1 animal type per chunk
    const animalFindMultiplier = 0.5 + (clamp01(chunkData.dangerLevel ?? 50) * 0.8); // Scale with danger level
    const animalFindChance = Math.max(0.005, Math.min(0.5, animalBaseFindChance * (worldDensityScale ?? 1) * animalFindMultiplier * effectiveMultiplier));

    let spawnedAnimals: any[] = [];
    if (Math.random() < animalFindChance && animalSpawnCandidates.length > 0) {
        // Select one animal type
        const selectedAnimal = animalSpawnCandidates[Math.floor(Math.random() * animalSpawnCandidates.length)];
        if (selectedAnimal) {
            spawnedAnimals = [selectedAnimal];
        }
    }

    // ========================================================================
    // ANIMAL FINALIZATION - Convert animal references to Enemy objects if needed
    // ========================================================================
    // Process spawned animals into enemy format
    let finalSpawnedEnemy = spawnedEnemy;
    if (spawnedAnimals.length > 0 && !finalSpawnedEnemy) {
        const animalData = spawnedAnimals[0].data;
        if (animalData) {
            finalSpawnedEnemy = {
                type: animalData.name || animalData.id,
                hp: animalData.hp ?? 100,
                damage: animalData.damage ?? 10,
                behavior: animalData.behavior ?? 'aggressive',
                size: animalData.size ?? 'medium',
                emoji: animalData.emoji ?? '🐾',
                satiation: 0,
                maxSatiation: animalData.maxSatiation ?? 100,
                diet: animalData.diet ?? ['meat'],
                senseEffect: animalData.senseEffect ? {
                    range: animalData.senseRadius ?? 3,
                    type: 'detection'
                } : undefined
            };
        }
    }

    // ========================================================================
    // RESULT ASSEMBLY - Combine all spawned content into final ChunkContent
    // ========================================================================
    // Return the complete generated content for the chunk.
    return {
        description: finalDescription,
        NPCs: spawnedNPCs,
        items: spawnedItems,
        structures: spawnedStructures,
        enemy: finalSpawnedEnemy,
        actions: actions,
        plants: spawnedPlants,
    };
}

// end of generateChunkContent

/**
 * Ensures a specific chunk exists at the given position. If the chunk does not exist,
 * it generates a new region for that chunk based on adjacent terrains and world profile.
 * This function is crucial for expanding the game world procedurally.
 *
 * @param pos - The {x, y} coordinates of the chunk to ensure.
 * @param currentWorld - The current state of the world, mapping chunk keys to chunk data.
 * @param currentRegions - A map of existing region IDs to their `Region` data.
 * @param currentRegionCounter - The next available ID for a new region.
 * @param worldProfile - Global world settings affecting generation.
 * @param currentSeason - The current season, which might influence generation.
 * @param allItemDefinitions - A registry of all available item definitions.
 * @param customItemCatalog - A list of custom items that can be generated.
 * @param customStructures - A list of custom structures that can be generated.
 * @param language - The current language for translations.
 * @returns An object containing the updated world, regions, and region counter.
 */
export function ensureChunkExists(
    pos: { x: number; y: number },
    currentWorld: World,
    currentRegions: { [id: number]: Region },
    currentRegionCounter: number,
    worldProfile: WorldProfile,
    currentSeason: Season,
    allItemDefinitions: Record<string, ItemDefinition>,
    customItemCatalog: GeneratedItem[],
    customStructures: Structure[],
    language: Language
) {
    logger.debug(`[ensureChunkExists] STARTING for chunk (${pos.x},${pos.y}).`);
    const key = `${pos.x},${pos.y}`; // Create the unique key for the chunk.
    // If the chunk already exists in the world, log and return without further action.
    if (currentWorld[key]) {
        logger.debug(`[ensureChunkExists] Chunk at (${pos.x},${pos.y}) already exists. Skipping generation.`);
        logger.debug(`[ensureChunkExists] FINISHED for chunk (${pos.x}, ${pos.y}). Returning world profile.`);
        return { worldWithChunk: currentWorld, newRegions: currentRegions, newRegionCounter: currentRegionCounter };
    }
    // If the chunk does not exist, log and proceed to generate a new region.
    logger.info(`[ensureChunkExists] Chunk at (${pos.x},${pos.y}) does not exist. Generating new region.`);
    // Determine valid adjacent terrains to influence the new terrain selection.
    const validTerrains = getValidAdjacentTerrains(pos, currentWorld);
    logger.debug(`[ensureChunkExists] Valid adjacent terrains:`, validTerrains);
    // Create weights for terrain selection based on their spreadWeight in worldConfig.
    const terrainWeights = validTerrains.map(t => [t, worldConfig[t].spreadWeight] as [Terrain, number]);
    // Select a new terrain type using weighted random selection.
    const newTerrain = weightedRandom(terrainWeights);
    logger.info(`[ensureChunkExists] Selected new terrain: ${newTerrain}`);

    // Call `generateRegion` to create the new region and update the world state.
    const { newWorld, newRegions, newRegionCounter } = generateRegion(pos, newTerrain, currentWorld, currentRegions, currentRegionCounter, worldProfile, currentSeason, allItemDefinitions, customItemCatalog, customStructures, language);
    logger.debug(`[ensureChunkExists] FINISHED generating region for chunk (${pos.x}, ${pos.y}).`);
    logger.debug(`[ensureChunkExists] FINISHED for chunk (${pos.x}, ${pos.y}). Returning world profile.`);
    // Return the updated world, regions, and region counter.
    return { worldWithChunk: newWorld, newRegions: newRegions, newRegionCounter: newRegionCounter };
}

/**
 * Creates chunks in a specified radius around a central point if they do not already exist.
 * This function iterates through all chunk coordinates within the given radius and calls `ensureChunkExists`
 * for each one, effectively expanding the game world outwards from a central point.
 *
 * @param currentWorld - The current state of the world map.
 * @param currentRegions - The current map of regions.
 * @param currentRegionCounter - The next available ID for a new region.
 * @param center_x - The X-coordinate of the center point for generation.
 * @param center_y - The Y-coordinate of the center point for generation.
 * @param radius - The radius around the center point within which to generate chunks.
 * @param worldProfile - Global world settings affecting generation.
 * @param currentSeason - The current season.
 * @param allItemDefinitions - A registry of all available item definitions.
 * @param customItemCatalog - A list of custom items that can be generated.
 * @param customStructures - A list of custom structures that can be generated.
 * @param language - The current language for translations.
 * @returns An object containing the updated world, regions, and region counter after generation.
 */
import { maybeDebug } from '@/lib/core/debug';

export const generateChunksInRadius = (
    currentWorld: World,
    currentRegions: { [id: number]: Region },
    currentRegionCounter: number,
    center_x: number,
    center_y: number,
    radius: number,
    worldProfile: WorldProfile,
    currentSeason: Season,
    allItemDefinitions: Record<string, ItemDefinition>,
    customItemCatalog: GeneratedItem[],
    customStructures: Structure[],
    language: Language
): { world: World, regions: { [id: number]: Region }, regionCounter: number } => {
    logger.debug(`[generateChunksInRadius] STARTING generation for radius ${radius} around (${center_x}, ${center_y}).`);
    // Pause here when debugging to inspect large generation inputs/state. This is a debug helper.
    maybeDebug('generateChunksInRadius:start');
    let newWorld = { ...currentWorld }; // Create copies to allow mutation.
    let newRegions = { ...currentRegions };
    let newRegionCounter = currentRegionCounter;

    // Iterate through all possible chunk coordinates within the specified radius.
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            const chunk_x = center_x + dx;
            const chunk_y = center_y + dy;
            const chunkKey = `${chunk_x},${chunk_y}`;
            logger.debug(`[generateChunksInRadius] Checking chunk at (${chunk_x}, ${chunk_y}).`);
            // Short pause to inspect per-chunk processing if needed. This is a debug helper.
            maybeDebug('generateChunksInRadius:per-chunk');
            // If the chunk does not already exist in the world, call `ensureChunkExists` to generate it.
            if (!newWorld[chunkKey]) {
                const result = ensureChunkExists(
                    { x: chunk_x, y: chunk_y },
                    newWorld,
                    newRegions,
                    newRegionCounter,
                    worldProfile,
                    currentSeason,
                    allItemDefinitions,
                    customItemCatalog,
                    customStructures,
                    language
                );
                // Update the world, regions, and region counter with the results from `ensureChunkExists`.
                newWorld = result.worldWithChunk;
                newRegions = result.newRegions;
                newRegionCounter = result.newRegionCounter;
            }
        }
    }
    logger.info(`[generateChunksInRadius] Finished generation for radius ${radius}.`);
    // Pause here when debugging to inspect large generation inputs/state. This is a debug helper.
    maybeDebug('generateChunksInRadius:finished');
    // Return the final updated world state.
    return { world: newWorld, regions: newRegions, regionCounter: newRegionCounter };
};

