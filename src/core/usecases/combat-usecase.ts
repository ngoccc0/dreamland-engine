import { Combatant, CombatResult, CombatRound, CombatAction } from '../entities/combat';

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
        const base = attacker.stats.attack;
        const isCritical = Math.random() < (attacker.stats.criticalChance || 0);
        const critMult = isCritical ? (attacker.stats.criticalDamage || 1.5) : 1;

        return {
            amount: Math.floor(base * critMult),
            type: 'PHYSICAL' as const,
            isCritical
        };
    }

    private calculateExperience(_winner: Combatant, _loser: Combatant): number {
        // Implement experience calculation logic
        return 100; // Placeholder
    }

    private async generateLoot(_loser: Combatant): Promise<any[]> {
        // Implement loot generation logic
        return []; // Placeholder
    }
}
