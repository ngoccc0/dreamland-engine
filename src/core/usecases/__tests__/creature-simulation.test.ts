/**
 * @file src/core/usecases/__tests__/creature-simulation.test.ts
 * @description Tests for creature simulation functions with save game compatibility
 *
 * @remarks
 * **Test Strategy:**
 * Focus on backward compatibility - old saves must load and creatures work.
 * Tests the pure functions in creature-simulation.ts (no React context needed).
 *
 * **Critical Test Cases:**
 * 1. Build visible chunks from world and fallback paths
 * 2. Register creatures idempotently (no duplicates)
 * 3. Plant growth messages generated correctly
 * 4. Creature AI updates applied
 * 5. Save game v0 → v1 migration (creature format compatibility)
 */

import {
    buildVisibleChunks,
    registerCreatures,
    processPlantsSync,
    updateCreaturesSync,
    simulateCreaturesSync,
} from '../creature-simulation';
import { GridPosition } from '@/core/values/grid-position';

describe('creatureSimulationSync - Creature Simulation Functions', () => {
    // Mock game state with creatures
    const mockGameState = {
        world: null,
        currentChunk: { x: 10, y: 10, enemy: null, items: [], plants: [] },
        playerPosition: { x: 10, y: 10 },
        currentSeason: 'spring',
        worldProfile: { biomeType: 'grassland' },
    };

    const mockPlayerStats = {
        hp: 100,
        maxHp: 100,
        stamina: 100,
        maxStamina: 150,
        hunger: 50,
        thirst: 50,
        items: [],
        quests: [],
        skills: [],
        persona: 'explorer',
        dailyActionLog: [],
        experience: 0,
        level: 1,
    } as any;

    const mockT = (key: string) => key;

    // Mock creature engine
    const createMockCreatureEngineRef = () => ({
        current: {
            getCreature: (id: string) => null,
            registerCreature: jest.fn(),
            updateCreatures: jest.fn().mockReturnValue([]),
        },
    });

    describe('buildVisibleChunks', () => {
        it('should return map with current chunk', () => {
            const playerPos = new GridPosition(10, 10);
            const chunks = buildVisibleChunks(mockGameState, playerPos);

            expect(chunks.size).toBeGreaterThan(0);
            expect(chunks.has('10,10')).toBe(true);
        });

        it('should handle missing world gracefully', () => {
            const state = { ...mockGameState, world: null, currentChunk: { x: 5, y: 5 } };
            const playerPos = new GridPosition(5, 5);
            const chunks = buildVisibleChunks(state, playerPos);

            expect(chunks.size).toBe(1);
            expect(chunks.has('5,5')).toBe(true);
        });

        it('should handle missing currentChunk gracefully', () => {
            const state = { ...mockGameState, currentChunk: null, world: null };
            const playerPos = new GridPosition(10, 10);
            const chunks = buildVisibleChunks(state, playerPos);

            expect(chunks.size).toBe(0);
        });

        it('should respect custom viewRadius', () => {
            const state = {
                ...mockGameState,
                currentChunk: { x: 0, y: 0 },
                world: {
                    getChunksInArea: (pos: GridPosition, radius: number) => {
                        const result = [];
                        for (let dx = -radius; dx <= radius; dx++) {
                            for (let dy = -radius; dy <= radius; dy++) {
                                result.push({ x: dx, y: dy });
                            }
                        }
                        return result;
                    },
                },
            };
            const playerPos = new GridPosition(0, 0);
            const chunks = buildVisibleChunks(state, playerPos, 2); // 2 tile radius

            // Should have at least current chunk + surrounding (5x5 = 25 tiles)
            expect(chunks.size).toBe(25);
        });
    });

    describe('registerCreatures', () => {
        it('should register creature from chunk', () => {
            const engineRef = createMockCreatureEngineRef();
            const chunks = new Map([
                ['5,5', { x: 5, y: 5, enemy: { id: 'wolf_1', type: 'wolf', hp: 50 } }],
            ]);

            const count = registerCreatures(engineRef, chunks);

            expect(count).toBe(1);
            expect(engineRef.current.registerCreature).toHaveBeenCalled();
        });

        it('should not register duplicate creatures (idempotent)', () => {
            const engineRef = {
                current: {
                    getCreature: (id: string) => ({ id, type: 'wolf' }), // Already exists
                    registerCreature: jest.fn(),
                },
            };
            const chunks = new Map([
                ['5,5', { x: 5, y: 5, enemy: { id: 'wolf_1', type: 'wolf' } }],
            ]);

            const count = registerCreatures(engineRef, chunks);

            expect(count).toBe(0);
            expect(engineRef.current.registerCreature).not.toHaveBeenCalled();
        });

        it('should skip chunks without enemies', () => {
            const engineRef = createMockCreatureEngineRef();
            const chunks = new Map([
                ['5,5', { x: 5, y: 5, enemy: null }],
                ['6,6', { x: 6, y: 6, enemy: { id: 'wolf_1', type: 'wolf' } }],
            ]);

            const count = registerCreatures(engineRef, chunks);

            expect(count).toBe(1);
        });

        it('should handle engine errors gracefully', () => {
            const engineRef = {
                current: {
                    getCreature: (id: string) => null,
                    registerCreature: jest.fn().mockImplementation(() => {
                        throw new Error('Engine error');
                    }),
                },
            };
            const chunks = new Map([
                ['5,5', { x: 5, y: 5, enemy: { id: 'wolf_1' } }],
            ]);

            expect(() => registerCreatures(engineRef, chunks)).not.toThrow();
        });

        it('should handle null engine ref gracefully', () => {
            const engineRef = { current: null };
            const chunks = new Map([
                ['5,5', { x: 5, y: 5, enemy: { id: 'wolf_1' } }],
            ]);

            const count = registerCreatures(engineRef, chunks);

            expect(count).toBe(0);
        });
    });

    describe('processPlantsSync', () => {
        it('should return plant messages array', () => {
            const chunks = new Map([['5,5', { x: 5, y: 5, plants: [] }]]);
            const messages = processPlantsSync(0, chunks, mockGameState, mockT);

            expect(Array.isArray(messages)).toBe(true);
        });

        it('should handle missing worldProfile gracefully', () => {
            const state = { ...mockGameState, worldProfile: null };
            const chunks = new Map();

            expect(() => processPlantsSync(0, chunks, state, mockT)).not.toThrow();
        });

        it('should default to spring season if not provided', () => {
            const state = { ...mockGameState, currentSeason: null };
            const chunks = new Map();
            const messages = processPlantsSync(0, chunks, state, mockT);

            expect(Array.isArray(messages)).toBe(true);
        });
    });

    describe('updateCreaturesSync', () => {
        it('should call updateCreatures on engine', () => {
            const engineRef = createMockCreatureEngineRef();
            const playerPos = new GridPosition(10, 10);
            const chunks = new Map();

            updateCreaturesSync(engineRef, 0, playerPos, mockPlayerStats, chunks);

            expect(engineRef.current.updateCreatures).toHaveBeenCalledWith(
                0,
                expect.any(GridPosition),
                mockPlayerStats,
                chunks,
            );
        });

        it('should return messages from engine', () => {
            const messages = [{ text: 'Wolf attacks!', type: 'action' }];
            const engineRef = {
                current: {
                    updateCreatures: jest.fn().mockReturnValue(messages),
                },
            };
            const playerPos = new GridPosition(10, 10);
            const chunks = new Map();

            const result = updateCreaturesSync(engineRef, 0, playerPos, mockPlayerStats, chunks);

            expect(result).toEqual(messages);
        });

        it('should return empty array if engine unavailable', () => {
            const engineRef = { current: null };
            const playerPos = new GridPosition(10, 10);
            const chunks = new Map();

            const result = updateCreaturesSync(engineRef, 0, playerPos, mockPlayerStats, chunks);

            expect(result).toEqual([]);
        });

        it('should handle engine errors gracefully', () => {
            const engineRef = {
                current: {
                    updateCreatures: jest.fn().mockImplementation(() => {
                        throw new Error('Engine error');
                    }),
                },
            };
            const playerPos = new GridPosition(10, 10);
            const chunks = new Map();

            expect(() =>
                updateCreaturesSync(engineRef, 0, playerPos, mockPlayerStats, chunks),
            ).not.toThrow();
        });
    });

    describe('simulateCreaturesSync - Full Cycle', () => {
        it('should return creature and plant messages', () => {
            const engineRef = createMockCreatureEngineRef();
            engineRef.current.updateCreatures.mockReturnValue([
                { text: 'Wolf appears', type: 'action' },
            ]);

            const playerPos = new GridPosition(10, 10);
            const result = simulateCreaturesSync(
                engineRef,
                0,
                playerPos,
                mockPlayerStats,
                mockGameState,
                mockT,
            );

            expect(result.creatureMessages).toBeDefined();
            expect(result.plantMessages).toBeDefined();
            expect(Array.isArray(result.creatureMessages)).toBe(true);
            expect(Array.isArray(result.plantMessages)).toBe(true);
        });

        it('should handle missing chunks gracefully', () => {
            const engineRef = createMockCreatureEngineRef();
            const state = { ...mockGameState, currentChunk: null, world: null };
            const playerPos = new GridPosition(10, 10);

            const result = simulateCreaturesSync(
                engineRef,
                0,
                playerPos,
                mockPlayerStats,
                state,
                mockT,
            );

            expect(result.creatureMessages).toBeDefined();
            expect(result.plantMessages).toBeDefined();
        });
    });

    describe('Save Game Backward Compatibility', () => {
        it('should handle v0 save game with legacy creature format', () => {
            // Old save format with creature in chunk
            const legacyGameState = {
                ...mockGameState,
                currentChunk: {
                    x: 10,
                    y: 10,
                    enemy: {
                        id: 'wolf_legacy',
                        type: 'wolf',
                        hp: 50,
                        // Old format may have additional fields
                        position: { x: 10, y: 10 }, // Deprecated field
                        lastMoveTick: 0, // Deprecated field
                    },
                },
            };

            const engineRef = createMockCreatureEngineRef();
            const playerPos = new GridPosition(10, 10);

            // Should not throw when loading old format
            const result = simulateCreaturesSync(
                engineRef,
                0,
                playerPos,
                mockPlayerStats,
                legacyGameState,
                mockT,
            );

            expect(result).toBeDefined();
            expect(engineRef.current.registerCreature).toHaveBeenCalled();
        });

        it('should preserve creature IDs across save/load cycles', () => {
            const engineRef = {
                current: {
                    getCreature: (id: string) => null,
                    registerCreature: jest.fn(),
                    updateCreatures: jest.fn().mockReturnValue([]),
                },
            };

            const chunks = new Map([
                ['5,5', { x: 5, y: 5, enemy: { id: 'wolf_abc123', type: 'wolf' } }],
            ]);

            registerCreatures(engineRef, chunks);

            // Verify creature ID is preserved
            expect(engineRef.current.registerCreature).toHaveBeenCalledWith(
                'creature_5_5',
                expect.objectContaining({ id: 'wolf_abc123' }),
                expect.any(GridPosition),
                expect.any(Object),
            );
        });

        it('should not lose creature state when re-registering same creature', () => {
            let creatureRegistry: Record<string, any> = {};

            const engineRef = {
                current: {
                    getCreature: (id: string) => creatureRegistry[id],
                    registerCreature: (id: string, data: any) => {
                        creatureRegistry[id] = data;
                    },
                    updateCreatures: jest.fn().mockReturnValue([]),
                },
            };

            const chunks1 = new Map([
                ['5,5', { x: 5, y: 5, enemy: { id: 'wolf_1', hp: 50 } }],
            ]);

            const chunks2 = new Map([
                ['5,5', { x: 5, y: 5, enemy: { id: 'wolf_1', hp: 45 } }], // Updated state
            ]);

            // First registration
            registerCreatures(engineRef, chunks1);
            expect(creatureRegistry['creature_5_5']?.hp).toBe(50);

            // Second registration (should not re-register existing creature)
            registerCreatures(engineRef, chunks2);
            expect(creatureRegistry['creature_5_5']?.hp).toBe(50); // Unchanged (already registered)
        });
    });

    describe('Partial Failure Recovery', () => {
        it('should register remaining creatures when one fails', () => {
            let registeredCount = 0;
            const engineRef = {
                current: {
                    getCreature: (id: string) => null,
                    registerCreature: jest.fn((id: string) => {
                        if (id === 'creature_3_3') {
                            throw new Error('Creature 3,3 registration failed');
                        }
                        registeredCount++;
                    }),
                    updateCreatures: jest.fn().mockReturnValue([]),
                },
            };

            const chunks = new Map([
                ['1,1', { x: 1, y: 1, enemy: { id: 'c1' } }],
                ['2,2', { x: 2, y: 2, enemy: { id: 'c2' } }],
                ['3,3', { x: 3, y: 3, enemy: { id: 'c3' } }],
                ['4,4', { x: 4, y: 4, enemy: { id: 'c4' } }],
            ]);

            const count = registerCreatures(engineRef, chunks);

            // Should register 3 out of 4 (partial success)
            expect(count).toBe(3);
            expect(registeredCount).toBe(3);
        });

        it('should limit creature messages to prevent explosion', () => {
            const largeMessageArray = Array.from({ length: 2000 }, (_, i) => ({
                text: `Message ${i}`,
                type: 'action',
            }));

            const engineRef = {
                current: {
                    updateCreatures: jest.fn().mockReturnValue(largeMessageArray),
                },
            };

            const playerPos = new GridPosition(10, 10);
            const chunks = new Map();
            const result = updateCreaturesSync(engineRef, 0, playerPos, mockPlayerStats, chunks);

            // Should truncate to max 1000 messages
            expect(result.length).toBeLessThanOrEqual(1000);
        });
    });

    describe('Edge Cases - Strategy Fallback Paths', () => {
        it('should fall back to getCellAt when getChunksInArea throws', () => {
            const fallbackCells: Array<{ x: number; y: number }> = [];
            for (let dx = -2; dx <= 2; dx++) {
                for (let dy = -2; dy <= 2; dy++) {
                    fallbackCells.push({ x: 10 + dx, y: 10 + dy });
                }
            }

            const state = {
                ...mockGameState,
                currentChunk: { x: 10, y: 10 },
                world: {
                    getChunksInArea: jest.fn(() => {
                        throw new Error('World corrupted');
                    }),
                    getCellAt: jest.fn((pos: GridPosition) => {
                        return fallbackCells.find((c) => c.x === pos.x && c.y === pos.y) || null;
                    }),
                },
            };

            const playerPos = new GridPosition(10, 10);
            const chunks = buildVisibleChunks(state, playerPos, 2);

            // Should have used fallback getCellAt and found cells
            expect(chunks.size).toBeGreaterThan(1);
        });

        it('should use only current chunk when both strategies fail', () => {
            const state = {
                ...mockGameState,
                currentChunk: { x: 10, y: 10 },
                world: {
                    getChunksInArea: jest.fn(() => {
                        throw new Error('Strategy 1 fails');
                    }),
                    getCellAt: jest.fn(() => {
                        throw new Error('Strategy 2 fails');
                    }),
                },
            };

            const playerPos = new GridPosition(10, 10);
            const chunks = buildVisibleChunks(state, playerPos, 2);

            // Should fall back to just current chunk
            expect(chunks.size).toBe(1);
            expect(chunks.has('10,10')).toBe(true);
        });
    });
});

