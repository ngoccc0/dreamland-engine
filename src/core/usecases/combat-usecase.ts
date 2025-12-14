import { Combatant, CombatResult, CombatRound, CombatAction } from '../entities/combat';
import { itemDefinitions } from '@/lib/game/items';
import { combatConfig } from '@/lib/config';
import {
    calculateBaseDamage,
    isCritical,
    applyMultiplier,
    calculateExperience as calculateExpFromRules,
    isDead,
    applyDamage,
} from '@/core/rules/combat';

/**
 * OVERVIEW: Combat system orchestrator
 *
 * Orchestrates turn-based combat between two Combatants. Manages action selection,
 * damage calculation, effect application, round progression, and outcome determination.
 *
 * ## Combat Flow
 *
 * ```
 * initiateCombat(attacker, defender)
 *   ├─ Initialize round counter, clear history
 *   ├─ Store both combatants
 *   └─ Ready for combat loops
 *
 * executeCombatRound() (loop N times until one is dead)
 *   ├─ Attacker turn:
 *   │  ├─ determineAction() → select attack, skill, defend, flee
 *   │  ├─ executeAction() → resolve action, apply damage/effects
 *   │  └─ Update defender effects
 *   │
 *   ├─ Defender turn (if alive):
 *   │  ├─ determineAction()
 *   │  ├─ executeAction()
 *   │  └─ Update attacker effects
 *   │
 *   └─ Store round record, return for narrative
 *
 * endCombat()
 *   ├─ Calculate XP gains
 *   ├─ Generate loot
 *   ├─ Clear combatant state
 *   └─ Return CombatResult
 * ```
 *
 * ## Damage Calculation
 *
 * Standard combat formula:
 *
 * ```
 * baseDamage = attacker.stats.attack - defender.stats.defense
 * baseDamage = max(1, baseDamage)  // Minimum 1 damage
 *
 * isCritical = random() < attacker.stats.criticalChance / 100
 * multiplier = isCritical ? 1.5 : 1.0
 *
 * finalDamage = baseDamage × multiplier
 * defender.health -= finalDamage
 * ```
 *
 * Variables:
 * - **attack stat**: Attacker's offensive power (scales 1:1 with damage)
 * - **defense stat**: Defender's protection (scales 1:1 damage reduction)
 * - **critical chance**: Probability of 1.5× damage (e.g., 20% = 20 stat points)
 * - **Minimum 1 damage**: Prevents stalemate (even weak attacks hurt)
 *
 * ## Action Selection
 *
 * Combatants choose actions based on:
 * - Health/mana/stamina availability
 * - Skill cooldowns
 * - Strategic assessment (offensive vs defensive)
 * - Current effects/statuses
 *
 * Options:
 * 1. **Basic Attack**: Always available, costs nothing
 * 2. **Skill Use**: Available if cooldown ready + resources sufficient
 * 3. **Defend**: Reduce incoming damage this round by 50%
 * 4. **Item Use**: Heal/buff, limited resources
 * 5. **Flee**: Escape combat (50% success chance)
 *
 * ## Round Structure
 *
 * CombatRound contains:
 * - **actions**: Array of CombatAction taken by each combatant
 * - **results**: Map of action → outcome (damage dealt, effect applied)
 * - **effects**: Map of active effects applied this round
 *
 * Actions processed sequentially: attacker → defender → effects update.
 *
 * ## Combatant Death Check
 *
 * After each action:
 * ```
 * if defender.isDead():
 *   return CombatResult with winner = attacker
 * ```
 *
 * Is Dead: health <= 0
 *
 * ## Effect System Integration
 *
 * Combat effects (DoT, stun, buff) persist across rounds via Combatant.updateEffects():
 *
 * ```
 * // After both combatants act
 * attacker.updateEffects()  // Tick DoTs, check status effects
 * defender.updateEffects()
 * ```
 *
 * Example effect flow:
 * - Round 1: Apply "poison" debuff (3 damage/round, 5 rounds)
 * - Round 2-5: Poison ticks, each round 3 damage
 * - Round 6: Poison expires
 *
 * ## Combat Result
 *
 * After combat ends:
 * ```
 * CombatResult {
 *   winner: Combatant,
 *   loser: Combatant,
 *   duration: number of rounds,
 *   xpGained: number,
 *   lootDropped: Item[],
 *   combatLog: CombatRound[]
 * }
 * ```
 *
 * Winner rewards:
 * - XP = loser level × 100 × difficulty modifier
 * - Loot = drop table from loser definition
 * - Achievements unlocked
 *
 * ## Performance Notes
 *
 * - O(1) per action (simple stat comparison)
 * - O(rounds) total complexity
 * - No pathfinding or environmental queries
 * - Suitable for real-time combat
 *
 * ## Design Notes
 *
 * - **Determin Outcome Fast**: Combat should resolve in 5-15 rounds typically
 * - **Clear Feedback**: Each round generates narrative messages
 * - **Skill Synergy**: Effects enable complex strategies
 * - **Balanced**: Attack ≈ Defense scaling prevents dominated strategies
 */
export interface ICombatUseCase {
    initiateCombat(attacker: Combatant, defender: Combatant): Promise<void>;
    executeCombatRound(): Promise<CombatRound>;
    endCombat(): Promise<CombatResult>;
}

export class CombatUseCase implements ICombatUseCase {
    private currentAttacker?: Combatant;
    private currentDefender?: Combatant;
    private rounds: CombatRound[] = [];

    async initiateCombat(attacker: Combatant, defender: Combatant): Promise<void> {
        this.currentAttacker = attacker;
        this.currentDefender = defender;
        this.rounds = [];
    }

    async executeCombatRound(): Promise<CombatRound> {
        if (!this.currentAttacker || !this.currentDefender) {
            throw new Error('Combat not initialized');
        }

        const round: CombatRound = {
            actions: [],
            results: new Map(),
            effects: new Map()
        };

        // Process attacker's turn
        const attackerAction = await this.determineAction(this.currentAttacker);
        round.actions.push(attackerAction);
        await this.executeAction(attackerAction, round);

        if (!this.currentDefender.isDead()) {
            // Process defender's turn
            const defenderAction = await this.determineAction(this.currentDefender);
            round.actions.push(defenderAction);
            await this.executeAction(defenderAction, round);
        }

        // Update effects for both combatants
        this.currentAttacker.updateEffects();
        this.currentDefender.updateEffects();

        this.rounds.push(round);
        return round;
    }

    async endCombat(): Promise<CombatResult> {
        if (!this.currentAttacker || !this.currentDefender) {
            throw new Error('Combat not initialized');
        }

        const winner = this.currentAttacker.isDead() ? this.currentDefender : this.currentAttacker;
        const loser = this.currentAttacker.isDead() ? this.currentAttacker : this.currentDefender;

        return {
            winner,
            loser,
            rounds: this.rounds,
            experience: this.calculateExperience(winner, loser),
            loot: await this.generateLoot(loser)
        };
    }

    private async determineAction(combatant: Combatant): Promise<CombatAction> {
        // This could be enhanced with AI decision making for NPCs/Monsters
        // For now, just return a basic attack
        return {
            actor: combatant,
            target: combatant === this.currentAttacker ? this.currentDefender! : this.currentAttacker!,
            type: 'ATTACK'
        };
    }

    private async executeAction(action: CombatAction, round: CombatRound): Promise<void> {
        switch (action.type) {
            case 'ATTACK': {
                const damage = this.calculateDamage(action.actor, action.target);
                const actualDamage = action.target.takeDamage(damage.amount);
                round.results.set(action.target.id, {
                    ...damage,
                    amount: actualDamage
                });
                break;
            }
            case 'SKILL': {
                if (!action.skill) throw new Error('Skill action requires a skill');
                // Handle skill execution
                break;
            }
            case 'DEFEND':
                // Add defensive buffs
                break;
            case 'FLEE':
                // Handle flee attempt
                break;
        }
    }

    private calculateDamage(attacker: Combatant, defender: Combatant) {
        /**
         * Calculate damage using pure combat rules from core/rules/combat.
         *
         * @remarks
         * Integrates Phase 3.A pure functions:
         * 1. calculateBaseDamage(attack) → base damage
         * 2. isCritical(critChance) → boolean
         * 3. applyMultiplier(baseDmg, mult) → final damage
         *
         * Formula (from Glass Box TSDoc):
         * - base = attack × 0.8 (normalized)
         * - multiplier = 1.5 if critical, else 1.0
         * - final = base × multiplier
         *
         * Using pure functions ensures:
         * - Testability (deterministic with seeded RNG)
         * - Reusability (same logic in usecases + UI)
         * - Auditability (formulas in @remarks)
         */
        const baseDmg = calculateBaseDamage(attacker.stats.attack);
        const isCrit = isCritical(attacker.stats.criticalChance || 0.2);
        const finalDmg = applyMultiplier(baseDmg, isCrit ? 1.5 : 1.0);

        return {
            amount: Math.floor(finalDmg),
            type: 'PHYSICAL' as const,
            isCritical: isCrit
        };
    }

    private calculateExperience(winner: Combatant, loser: Combatant): number {
        /**
         * Calculate XP gain using pure combat rules.
         *
         * @remarks
         * Integrates Phase 3.A pure function:
         * - calculateExperience(winnerLevel, loserLevel) from core/rules/combat
         *
         * Formula (from Glass Box TSDoc):
         * - xp = max(10, floor(baseXp × (1 + healthDiff × multiplier)))
         * - baseXp: combat stat base (typically 50)
         * - healthDiff: loserMaxHealth - winnerMaxHealth
         * - multiplier: adjustment factor (e.g., 0.01 per 10 HP difference)
         *
         * Pure rule ensures:
         * - Consistent XP across all usecases
         * - No duplicate XP logic in different files
         * - Easy balance tuning via rules file
         */
        const winnerLevel = (winner as any).level ?? 1;
        const loserLevel = (loser as any).level ?? 1;

        return calculateExpFromRules(winnerLevel, loserLevel);
    }

    private async generateLoot(loser: Combatant): Promise<any[]> {
        /**
         * Generate combat loot from defeated creature.
         *
         * Logic:
         * 1. Check if creature has loot definition
         * 2. For each loot entry, roll chance
         * 3. If successful, generate quantity
         * 4. Only add tier/grade for equipment items (Weapon/Armor/Accessory)
         * 5. Non-equipment items (Food/Material/Consumable) have no tier/grade
         *
         * @remarks
         * Uses creature definition's loot field to determine drops.
         * Equipment items get tier from itemDefinitions.tier, grade randomly assigned.
         * Non-equipment items are dropped without tier/grade fields.
         * Grade distribution for equipment: 50% grade 0, 30% grade 1, 20% grade 2.
         * 
         * If no loot is defined on creature, returns empty array.
         */
        // Check if creature has loot definition
        const creatureLoot = (loser as any).definition?.loot;
        if (!creatureLoot || creatureLoot.length === 0) {
            return [];
        }

        const droppedItems: any[] = [];
        const equipmentCategories = ['Weapon', 'Armor', 'Accessory'];

        // Process each loot entry
        for (const lootEntry of creatureLoot) {
            // Roll for this specific loot
            if (Math.random() > lootEntry.chance) {
                continue; // Didn't drop
            }

            // Determine quantity
            const minQty = lootEntry.quantity?.min ?? 1;
            const maxQty = lootEntry.quantity?.max ?? 1;
            const quantity = Math.floor(Math.random() * (maxQty - minQty + 1)) + minQty;

            // Look up item definition to check category
            const itemDef = itemDefinitions[lootEntry.name];
            const isEquipment = itemDef && equipmentCategories.includes(itemDef.category);

            // Only assign tier/grade for equipment items
            if (isEquipment && itemDef) {
                // Assign grade randomly: 50% grade 0, 30% grade 1, 20% grade 2
                const gradeRoll = Math.random();
                let grade = 0;
                if (gradeRoll > 0.5 && gradeRoll <= 0.8) {
                    grade = 1;
                } else if (gradeRoll > 0.8) {
                    grade = 2;
                }

                // Add equipment item with tier and grade
                droppedItems.push({
                    itemId: lootEntry.name,
                    tier: itemDef.tier,
                    grade: grade,
                    quantity: quantity
                });
            } else {
                // Add non-equipment item without tier/grade
                droppedItems.push({
                    itemId: lootEntry.name,
                    quantity: quantity
                });
            }
        }

        return droppedItems;
    }
}
