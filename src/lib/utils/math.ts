/**
 * Math Utilities
 *
 * @remarks
 * Contains helper functions for mathematical operations commonly used
 * in game logic, such as clamping values between min/max bounds.
 */

/**
 * Clamp a number between minimum and maximum values
 *
 * @remarks
 * Ensures a numeric value stays within specified bounds.
 * Used throughout the game for stat calculations, damage, etc.
 *
 * @param num - The number to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns The clamped number
 *
 * @example
 * clamp(150, 0, 100) // → 100
 * clamp(-5, 0, 100) // → 0
 * clamp(50, 0, 100) // → 50
 */
export const clamp = (num: number, min: number, max: number): number =>
    Math.min(Math.max(num, min), max);
