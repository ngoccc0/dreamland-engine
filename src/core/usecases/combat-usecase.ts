import { Combatant, CombatResult, CombatRound, CombatAction } from '../entities/combat';
import { SideEffect } from '../entities/side-effects';
import { allItems as itemDefinitions } from '@/core/data/items';
import { combatConfig } from '@/lib/config';
import {
    calculateBaseDamage,
    isCritical,
    applyMultiplier,
    isDead,
    applyDamage,
} from '@/core/rules/combat';
import { calculateExperienceGain as calculateExpFromRules } from '@/core/rules/experience';

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
/**
 * Combat round result with side effects
 *
 * @remarks
 * Pattern: (combatant) → {round, effects[]}
 * Effects: Animations, damage notifications, sounds, events
 */
export interface CombatRoundResult {
    round: CombatRound;
    effects: SideEffect[];
}

/**
 * Combat end result with side effects
 *
 * @remarks
 * Pattern: (combatants) → {result, effects[]}
 * Effects: Victory/defeat notifications, loot granted, XP awarded
 */
export interface CombatEndResult {
    result: CombatResult;
    effects: SideEffect[];
}

export interface ICombatUseCase {
    initiateCombat(attacker: Combatant, defender: Combatant): Promise<void>;
    executeCombatRound(): Promise<CombatRoundResult>;
    endCombat(): Promise<CombatEndResult>;
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

    async executeCombatRound(): Promise<CombatRoundResult> {
        /**
         * Execute one full combat round
         *
         * @remarks
         * **Pattern:** Pure function returns {round, effects[]}
         *
         * Effects generated:
         * - PlayAudioEffect: Attack sounds, critical hit sound
         * - TriggerAnimationEffect: Attack animations, hit animations
         * - ApplyDamageEffect: Damage to defender
         * - TriggerEventEffect: Combat action event
         * - ShowNotificationEffect: Combat log messages
         */
        if (!this.currentAttacker || !this.currentDefender) {
            throw new Error('Combat not initialized');
        }

        const effects: SideEffect[] = [];

        const round: CombatRound = {
            actions: [],
            results: new Map(),
            effects: new Map()
        };

        // Process attacker's turn
        const attackerAction = await this.determineAction(this.currentAttacker);
        round.actions.push(attackerAction);
        const attackerEffects = await this.executeAction(attackerAction, round);
        effects.push(...attackerEffects);

        if (!this.currentDefender.isDead()) {
            // Process defender's turn
            const defenderAction = await this.determineAction(this.currentDefender);
            round.actions.push(defenderAction);
            const defenderEffects = await this.executeAction(defenderAction, round);
            effects.push(...defenderEffects);
        }

        // Update effects for both combatants
        this.currentAttacker.updateEffects();
        this.currentDefender.updateEffects();

        this.rounds.push(round);
        return { round, effects };
    }

    async endCombat(): Promise<CombatEndResult> {
        /**
         * End combat and generate victory/defeat effects
         *
         * @remarks
         * **Pattern:** Pure function returns {result, effects[]}
         *
         * Effects generated:
         * - ShowNotificationEffect: Victory/defeat message
         * - GrantLootEffect: Item drops
         * - AddExperienceEffect: XP awarded
         * - TriggerEventEffect: Battle ended event
         * - PlayAudioEffect: Victory/defeat fanfare
         */
        if (!this.currentAttacker || !this.currentDefender) {
            throw new Error('Combat not initialized');
        }

        const effects: SideEffect[] = [];
        const winner = this.currentAttacker.isDead() ? this.currentDefender : this.currentAttacker;
        const loser = this.currentAttacker.isDead() ? this.currentAttacker : this.currentDefender;

        const result: CombatResult = {
            winner,
            loser,
            rounds: this.rounds,
            experience: this.calculateExperience(winner, loser),
            loot: await this.generateLoot(loser)
        };

        // Victory notification
        effects.push({
            type: 'showNotification',
            message: `${String(winner.name)} wins the battle!`,
            type_: 'success',
            duration: 3000
        });

        // Victory sound
        effects.push({
            type: 'playAudio',
            sound: 'combat-victory',
            volume: 0.8
        });

        // Grant loot if any
        if (result.loot && result.loot.length > 0) {
            effects.push({
                type: 'grantLoot',
                items: result.loot.map((item: any) => ({
                    id: item.itemId,
                    quantity: item.quantity
                })),
                source: `Defeated ${String(loser.name)}`
            });
        }

        // Award experience
        const xp = result.experience || 0;
        if (xp > 0) {
            effects.push({
                type: 'addExperience',
                amount: xp,
                type_: 'combat'
            });
        }

        // Combat ended event
        effects.push({
            type: 'triggerEvent',
            eventName: 'combat.ended',
            data: {
                winner: winner.id,
                loser: loser.id,
                roundCount: this.rounds.length,
                experienceAwarded: result.experience
            }
        });

        return { result, effects };
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

    private async executeAction(action: CombatAction, round: CombatRound): Promise<SideEffect[]> {
        /**
         * Execute a single combat action and generate effects
         *
         * @remarks
         * Effects:
         * - PlayAudioEffect: Attack sounds
         * - TriggerAnimationEffect: Attack/hit animations
         * - ApplyDamageEffect: Damage application
         * - ShowNotificationEffect: Action log
         */
        const effects: SideEffect[] = [];

        switch (action.type) {
            case 'ATTACK': {
                const damage = this.calculateDamage(action.actor, action.target);
                const actualDamage = action.target.takeDamage(damage.amount);
                round.results.set(action.target.id, {
                    ...damage,
                    amount: actualDamage
                });

                // Attack sound
                effects.push({
                    type: 'playAudio',
                    sound: damage.isCritical ? 'combat-critical-hit' : 'combat-attack',
                    volume: 0.7
                });

                // Attack animation
                effects.push({
                    type: 'triggerAnimation',
                    entityId: action.actor.id,
                    animation: 'attack',
                    speed: 1.2
                });

                // Hit animation
                effects.push({
                    type: 'triggerAnimation',
                    entityId: action.target.id,
                    animation: damage.isCritical ? 'hit-critical' : 'hit',
                    speed: 1.0
                });

                // Damage effect
                effects.push({
                    type: 'applyDamage',
                    targetId: action.target.id,
                    amount: actualDamage,
                    damageType: (damage.type === 'PHYSICAL' ? 'physical' : damage.type === 'MAGICAL' ? 'magical' : 'fire') as 'physical' | 'magical' | 'fire' | 'cold' | 'poison'
                });

                // Combat log notification
                const logMsg = damage.isCritical
                    ? `${String(action.actor.name)} CRITICALLY HIT ${String(action.target.name)} for ${actualDamage} damage!`
                    : `${String(action.actor.name)} attacked ${String(action.target.name)} for ${actualDamage} damage!`;

                effects.push({
                    type: 'showNotification',
                    message: logMsg,
                    type_: 'info',
                    duration: 1500
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

        return effects;
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
         * Uses health difference as difficulty proxy:
         * - calculateExperienceGain(playerMaxHealth, enemyMaxHealth) from core/rules/experience
         *
         * Formula (Glass Box TSDoc):
         * - xp = max(10, floor(baseXp × (1 + healthDiff × 0.002)))
         * - baseXp: combat base (typically 50, configurable)
         * - healthDiff: enemyMaxHealth - playerMaxHealth
         * - Stronger enemies (higher HP) grant more XP
         * - Weaker enemies grant reduced XP but minimum 10
         *
         * Pure rule ensures:
         * - Consistent XP calculation across all systems
         * - No duplicate logic (single source in core/rules/experience.ts)
         * - Easy balance tuning via combatConfig.baseXp
         *
         * Edge case handling:
         * - Null health values: Default to 100 (handled in experience rule)
         * - Negative XP: Clamped to minimum 10
         */
        const winnerMaxHealth = winner.stats.maxHealth ?? 100;
        const loserMaxHealth = loser.stats.maxHealth ?? 100;

        return calculateExpFromRules(winnerMaxHealth, loserMaxHealth);
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
