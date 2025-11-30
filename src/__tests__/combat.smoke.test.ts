/**
 * OVERVIEW: Combat system smoke test validates initiate/round/end combat flow.
 * Tests: CombatUseCase instantiation → combat round execution → result verification.
 * This smoke test ensures the combat system can execute a full combat sequence.
 */

import { CombatUseCase } from '@/core/usecases/combat-usecase';
import { Combatant, CombatantType } from '@/core/entities/combat';

describe('combat.smoke', () => {
  let combatUseCase: CombatUseCase;

  beforeEach(() => {
    combatUseCase = new CombatUseCase();
  });

  test('combat initiation succeeds', async () => {
    // STEP 1: Create mock combatants
    const attacker = new Combatant('player-1', CombatantType.PLAYER, { en: 'Hero', vi: 'Anh Hùng' }, { health: 100, maxHealth: 100, attack: 20, defense: 5, speed: 10 });
    const defender = new Combatant('enemy-1', CombatantType.MONSTER, { en: 'Wolf', vi: 'Sói' }, { health: 50, maxHealth: 50, attack: 10, defense: 2, speed: 8 });

    // STEP 2: Initiate combat
    await combatUseCase.initiateCombat(attacker, defender);

    // STEP 3: Verify no errors (test passes if no exception thrown)
    expect(combatUseCase).toBeDefined();
  });

  test('combat round execution succeeds', async () => {
    // STEP 1: Set up combat
    const attacker = new Combatant('player-1', CombatantType.PLAYER, { en: 'Hero', vi: 'Anh Hùng' }, { health: 100, maxHealth: 100, attack: 20, defense: 5, speed: 10 });
    const defender = new Combatant('enemy-1', CombatantType.MONSTER, { en: 'Wolf', vi: 'Sói' }, { health: 50, maxHealth: 50, attack: 10, defense: 2, speed: 8 });

    await combatUseCase.initiateCombat(attacker, defender);

    // STEP 2: Execute a combat round
    const round = await combatUseCase.executeCombatRound();

    // STEP 3: Verify round structure
    expect(round).toBeDefined();
    expect(round.actions).toBeDefined();
    expect(Array.isArray(round.actions)).toBe(true);
  });

  test('combat end produces valid result', async () => {
    // STEP 1: Set up and execute combat
    const attacker = new Combatant('player-1', CombatantType.PLAYER, { en: 'Hero', vi: 'Anh Hùng' }, { health: 100, maxHealth: 100, attack: 20, defense: 5, speed: 10 });
    const defender = new Combatant('enemy-1', CombatantType.MONSTER, { en: 'Wolf', vi: 'Sói' }, { health: 50, maxHealth: 50, attack: 10, defense: 2, speed: 8 });

    await combatUseCase.initiateCombat(attacker, defender);
    await combatUseCase.executeCombatRound();

    // STEP 2: End combat
    const result = await combatUseCase.endCombat();

    // STEP 3: Verify result structure
    expect(result).toBeDefined();
    // Result should contain outcome information
    expect(typeof result).toBe('object');
  });

  test('multiple combat rounds execute sequentially', async () => {
    // STEP 1: Set up combat
    const attacker = new Combatant('player-1', CombatantType.PLAYER, { en: 'Hero', vi: 'Anh Hùng' }, { health: 100, maxHealth: 100, attack: 20, defense: 5, speed: 10 });
    const defender = new Combatant('enemy-1', CombatantType.MONSTER, { en: 'Wolf', vi: 'Sói' }, { health: 50, maxHealth: 50, attack: 10, defense: 2, speed: 8 });

    await combatUseCase.initiateCombat(attacker, defender);

    // STEP 2: Execute 3 rounds
    const rounds = [];
    for (let i = 0; i < 3; i++) {
      const round = await combatUseCase.executeCombatRound();
      rounds.push(round);
    }

    // STEP 3: Verify 3 rounds completed
    expect(rounds).toHaveLength(3);
    rounds.forEach((round) => {
      expect(round).toBeDefined();
      expect(round.actions).toBeDefined();
    });
  });

  test('combatant properties are validated', () => {
    // STEP 1: Create valid combatant
    const combatant = new Combatant('test-1', CombatantType.NPC, { en: 'TestUnit', vi: 'Đơn Vị Kiểm Tra' }, { health: 50, maxHealth: 50, attack: 15, defense: 5, speed: 10 });

    // STEP 2: Verify all required properties exist
    expect(combatant.id).toBe('test-1');
    expect(typeof combatant.isDead).toBe('function');
    expect(typeof combatant.takeDamage).toBe('function');
  });
});
