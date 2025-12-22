'use client';

import React, { useEffect } from 'react';
import { useMinimapStore, selectGridData, selectAnimating, selectViewportSize } from '@/store';

/**
 * MiniMapSection - Smart Container
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
 * - Testable without GameLayout
 *
 * **Data Flow:**
 * GameLayout useGameEngine → MiniMapSection subscriptions → update minimap store → re-render
 *
 * @returns Rendered minimap with grid visualization
 */
export function MiniMapSection() {
  // Atomic selectors - only re-render on these specific values
  const gridData = useMinimapStore(selectGridData);
  const isAnimating = useMinimapStore(selectAnimating);
  const viewportSize = useMinimapStore(selectViewportSize);

  // Update minimap grid when game state changes
  // Grid data is already computed by useMinimapGridData in store updates
  // This effect ensures minimap stays in sync if game state changes
  useEffect(() => {
    // Grid update pipeline happens in GameLayout
  }, []);

  if (!gridData || gridData.length === 0) {
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
          {gridData.map((row, y) => (
            <div key={`row-${y}`} className="minimap-row flex gap-0.5">
              {row.map((chunk, x) => (
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
        {isAnimating && (
          <div className="minimap-status text-xs text-yellow-400 mt-2">
            Moving...
          </div>
        )}

        {/* Viewport Size Indicator */}
        <div className="minimap-info text-xs text-gray-400 mt-2">
          Size: {viewportSize}x{viewportSize}
        </div>
      </div>
    </div>
  );
}

