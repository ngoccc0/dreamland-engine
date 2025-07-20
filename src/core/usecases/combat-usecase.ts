import { Combatant, CombatResult, CombatRound, CombatAction } from '../entities/combat';

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

    private calculateExperience(winner: Combatant, loser: Combatant): number {
        // Implement experience calculation logic
        return 100; // Placeholder
    }

    private async generateLoot(loser: Combatant): Promise<any[]> {
        // Implement loot generation logic
        return []; // Placeholder
    }
}
