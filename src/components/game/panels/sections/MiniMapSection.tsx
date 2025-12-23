'use client';

import React from 'react';
import { useMinimapData } from '@/hooks/use-minimap-data';

/**
 * MiniMapSection - Smart Container (Memoized)
 *
 * @remarks
 * **Responsibility:**
 * - Subscribe to minimap store for grid data
 * - Listen for game state changes and update grid
 * - Render minimap with current grid
 * - Handle viewport size changes
 *
 * **Why Smart Container:**
 * - Only re-renders when minimap data changes
 * - Independent from HUD, Controls, or Dialog updates
 * - Manages grid update pipeline independently
 * - Memoized to prevent parent re-renders
 * - Testable without GameLayout
 *
 * **Data Flow:**
 * GameLayout useGameEngine → MiniMapSection subscriptions → update minimap store → re-render
 *
 * @returns Rendered minimap with grid visualization
 */
export const MiniMapSection = React.memo(function MiniMapSection() {
    // Aggregate all minimap data in single hook subscription
    const minimapData = useMinimapData();

    if (!minimapData.grid || minimapData.grid.length === 0) {
      return (
        <div className="minimap-section p-4">
          <div className="text-center text-gray-500">Loading minimap...</div>
        </div>
      );
    }

    return (
      <div className="minimap-section p-4">
        <div className="minimap-container">
          <h3 className="text-sm font-semibold mb-2">Minimap</h3>

          {/* Minimap Grid Display */}
          <div className="minimap-grid border border-gray-400 bg-gray-900 p-2">
            {minimapData.grid.map((row: any, y: number) => (
              <div key={`row-${y}`} className="minimap-row flex gap-0.5">
                {row.map((chunk: any, x: number) => (
                  <div
                    key={`cell-${y}-${x}`}
                    className="minimap-cell w-4 h-4 border border-gray-600"
                    style={{
                      backgroundColor: chunk
                        ? chunk.explored
                          ? '#444'
                          : '#222'
                        : '#000',
                      opacity: chunk && chunk.lastVisited ? 0.8 : 0.4,
                    }}
                    title={chunk ? `${chunk.type || 'chunk'}` : 'unexplored'}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Animation Indicator */}
          {minimapData.isAnimating && (
            <div className="minimap-status text-xs text-yellow-400 mt-2">
              Moving...
            </div>
          )}

          {/* Viewport Size Indicator */}
          <div className="minimap-info text-xs text-gray-400 mt-2">
            Size: {minimapData.viewportSize}x{minimapData.viewportSize}
          </div>
        </div>
      </div>
    );
  });

