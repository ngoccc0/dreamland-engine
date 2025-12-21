/**
 * @file src/core/usecases/combat-action-usecase.ts
 * @description Combat action executor - bridges ActionProcessor to combat system
 *
 * @remarks
 * Executes ATTACK actions by:
 * 1. Finding target creature in world
 * 2. Rolling d20 for hit/miss
 * 3. Calculating damage (base + crit)
 * 4. Applying damage to target
 * 5. Triggering counter-attack or death
 * 6. Queueing visual feedback (sounds, animations, damage numbers)
 *
 * Pure function signature:
 * ```typescript
 * (player, world, targetId, weaponId) → { newPlayer, newWorld, effects, events }
 * ```
 */

import { PlayerStatus } from '@/core/types/player';
import { ActionResult } from './actions/result-types';
import { calculateBaseDamage, isCritical } from '@/core/rules/combat';

/**
 * Execute attack action against a target
 *
 * @remarks
 * Combat flow:
 * 1. Validate target exists in world
 * 2. Get equipped weapon or use specified weapon
 * 3. Roll d20 (1-20) for hit chance
 * 4. Calculate base damage (attacker attack - target defense)
 * 5. Check critical hit (attacker crit chance)
 * 6. Apply final damage to target
 * 7. If target HP reaches 0: queue death animation, XP gain, loot drop
 * 8. Queue visual feedback: damage numbers, sounds, screen shake, blood effects
 *
 * @param player - Current player state
 * @param world - Current world state (contains creatures)
 * @param targetId - ID of creature to attack
 * @param weaponId - Optional: weapon ID to use (default: equipped weapon)
 * @param diceRoll - Optional: d20 roll for testing (default: random 1-20)
 * @returns ActionResult with damage applied and visual events
 *
 * @example
 * ```typescript
 * const result = executeCombatAction(player, world, 'goblin_1', 'sword_iron', 12);
 * // - Rolls 12 on d20 (hit if > accuracy threshold)
 * // - Calculates damage
 * // - Target takes damage
 * // - Shows damage number, plays hit sound, screen shake
 * ```
 */
export function executeCombatAction(
    player: PlayerStatus,
    world: any,
    targetId: string,
    weaponId?: string,
    diceRoll: number = Math.floor(Math.random() * 20) + 1 // Default: d20 (1-20)
): Partial<ActionResult> {
    const result: Partial<ActionResult> = {
        newPlayerState: player,
        visualEvents: [],
    };

    // Step 1: Validate target exists
    const targetCreature = world.creatures?.find((c: any) => c.id === targetId);
    if (!targetCreature) {
        result.visualEvents?.push({
            type: 'SHOW_TOAST',
            message: 'Target not found!',
            severity: 'error',
        });
        result.debugMessage = `Combat action failed: target '${targetId}' not found`;
        return result;
    }

    // Step 2: Get weapon (equipped or specified)
    // TODO: Implement weapon lookup from item definitions
    const weapon = {
        name: weaponId || player.equipment.weapon?.id || 'Bare Hands',
        attack: 10, // TODO: Get from weapon definition
        critChance: 5, // TODO: Get from weapon definition
    };

    // Step 3: Roll d20 for hit
    // TODO: Implement hit/miss threshold based on accuracy
    const hitThreshold = 10; // TODO: Calculate based on accuracy stat
    const isHit = diceRoll >= hitThreshold;

    // Step 4: Calculate damage
    const baseDamage = calculateBaseDamage(
        weapon.attack,
        targetCreature.defense || 0
    );

    // Step 5: Check critical (random d100 against crit chance)
    const critRoll = Math.random();
    const isCrit = isCritical(weapon.critChance, critRoll);
    const finalDamage = isCrit ? baseDamage * 1.5 : baseDamage;

    // Step 6: Apply damage to target
    const newTargetHp = Math.max(0, (targetCreature.hp || 0) - finalDamage);
    const targetDead = newTargetHp === 0;

    // Update creature in world
    const updatedCreatures = (world.creatures || []).map((c: any) =>
        c.id === targetId ? { ...c, hp: newTargetHp } : c
    );

    // Step 7: Generate visual feedback
    if (isHit) {
        result.visualEvents?.push({
            type: 'SHOW_DAMAGE_NUMBER',
            value: Math.round(finalDamage),
            position: { x: targetCreature.x || 0, y: targetCreature.y || 0 },
            isCrit: isCrit,
            color: isCrit ? '#FF0000' : '#FFFFFF',
        });

        result.visualEvents?.push({
            type: 'PLAY_SOUND',
            soundId: isCrit ? 'combat_critical' : 'combat_hit',
            volume: 0.8,
        });

        result.visualEvents?.push({
            type: 'SCREEN_SHAKE',
            intensity: isCrit ? 'HIGH' : 'MEDIUM',
            duration: 200,
        });

        result.visualEvents?.push({
            type: 'PARTICLE_EFFECT',
            effectId: isCrit ? 'crit_explosion' : 'blood_splatter',
            position: { x: targetCreature.x || 0, y: targetCreature.y || 0 },
        });

        if (targetDead) {
            result.visualEvents?.push({
                type: 'SHOW_ANIMATION',
                animationId: 'creature_death',
                position: { x: targetCreature.x || 0, y: targetCreature.y || 0 },
            });

            result.visualEvents?.push({
                type: 'PLAY_SOUND',
                soundId: 'creature_death',
                volume: 0.7,
            });

            result.visualEvents?.push({
                type: 'SHOW_TOAST',
                message: `Defeated ${targetCreature.name || 'creature'}!`,
                severity: 'success',
            });

            // TODO: Calculate and apply XP gain
            // TODO: Generate and queue loot drops
        } else {
            result.visualEvents?.push({
                type: 'SHOW_TOAST',
                message: `Hit for ${Math.round(finalDamage)} damage${isCrit ? ' (Critical!)' : ''}!`,
                severity: 'success',
            });
        }
    } else {
        // Miss
        result.visualEvents?.push({
            type: 'SHOW_TOAST',
            message: 'Attack missed!',
            severity: 'warning',
        });

        result.visualEvents?.push({
            type: 'PLAY_SOUND',
            soundId: 'combat_miss',
            volume: 0.6,
        });

        result.visualEvents?.push({
            type: 'PARTICLE_EFFECT',
            effectId: 'miss_effect',
            position: { x: targetCreature.x || 0, y: targetCreature.y || 0 },
        });
    }

    // Step 8: Queue counter-attack or passive trigger (TODO for future)
    // TODO: Implement creature counter-attack logic
    // TODO: Implement effect triggering (on-hit effects from armor, weapons)

    result.debugMessage = `Combat: ${isHit ? 'Hit' : 'Miss'} vs ${targetId}, damage=${Math.round(finalDamage)}${isCrit ? ' (CRIT)' : ''}`;

    return result;
}
