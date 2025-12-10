/**
 * Styling Utilities
 *
 * @remarks
 * Contains helper functions for managing CSS classes and styles,
 * particularly for Tailwind CSS integration and class merging.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with conflict resolution
 *
 * @remarks
 * Intelligently combines class strings using clsx and twMerge,
 * handling conflicts and removing duplicates.
 *
 * @param inputs - Class names or conditional class objects
 * @returns Merged class string
 *
 * @example
 * cn("p-4", "font-bold", { "bg-red-500": isError });
 * // → "p-4 font-bold bg-red-500" (or adjusted for conflicts)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
