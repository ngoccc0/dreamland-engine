import React, { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AreaFillProps {
  /** SVG path `d` attribute describing the silhouette. */
  pathD: string;
  /** Fill percent 0..1 */
  percent: number;
  /** Size in px */
  size?: number;
  /** Fill color */
  fill?: string;
  /** Optional filter url to apply to the filled group, e.g. 'url(#myFilter)' */
  fillGroupFilter?: string;
  /** Optional inner scale to inset the filled shape (scale about center). Useful to render the fill slightly inset from the outline. */
  innerScale?: number;
  /** Optional className for wrapper */
  className?: string;
}

/**
 * AreaFill
 *
 * Renders an SVG silhouette (provided as a path `d`) and fills it according to
 * the provided percent, where the visual level is computed by the actual
 * filled area of the silhouette (not simple linear height). This gives
 * perceptually-correct fill levels for complex shapes.
 *
 * Implementation notes:
 * - Uses an offscreen canvas + Path2D to rasterize the silhouette at the
 *   requested size and builds a cumulative area lookup table by scanning rows
 *   of pixels. The table maps target filled-area fraction -> pixel row height.
 * - The component is client-only (uses DOM APIs) and will render nothing
 *   until the mapping is computed.
 */
export function AreaFill({ pathD, percent, size = 48, fill = '#ff5a76', fillGroupFilter, innerScale = 1, className }: AreaFillProps) {
  const [map, setMap] = useState<number[] | null>(null);
  const idRef = useRef(`area-fill-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    // Only run in browser
    if (typeof document === 'undefined') return;
    const pixelSize = Math.max(32, Math.min(256, Math.round(size * 2))); // clamp resolution
    const canvas = document.createElement('canvas');
    canvas.width = pixelSize;
    canvas.height = pixelSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // clear
    ctx.clearRect(0, 0, pixelSize, pixelSize);

    // Build Path2D from provided pathD
    let path: Path2D;
    try {
      path = new Path2D(pathD);
    } catch (e: any) {
      // If path parsing fails, bail out
      // Silently handle invalid path
      setMap(null);
      return;
    }

    // Scale path to fit canvas. Support optional innerScale to inset the
    // filled shape by scaling about the center of the viewBox.
    const pixelScale = pixelSize / size;
    const totalScale = pixelScale * (innerScale ?? 1);
    // draw with scaling about center
    ctx.save();
    ctx.translate(pixelSize / 2, pixelSize / 2);
    ctx.scale(totalScale, totalScale);
    ctx.translate(-size / 2, -size / 2);
    ctx.fillStyle = '#000';
    ctx.fill(path);
    ctx.restore();

    // Read pixels row by row and build cumulative alpha counts
    const img = ctx.getImageData(0, 0, pixelSize, pixelSize);
    const alpha = img.data;
    const rows = pixelSize;
    const cols = pixelSize;

    const rowCounts = new Uint32Array(rows);
    let total = 0;
    for (let y = 0; y < rows; y++) {
      let rowSum = 0;
      const base = y * cols * 4;
      for (let x = 0; x < cols; x++) {
        const a = alpha[base + x * 4 + 3];
        if (a > 127) rowSum++;
      }
      rowCounts[y] = rowSum;
      total += rowSum;
    }

    if (total === 0) {
      // empty silhouette
      setMap(null);
      return;
    }

    // Build cumulative from bottom to top (so filled area grows upward)
    const cum = new Uint32Array(rows);
    let acc = 0;
    for (let y = rows - 1; y >= 0; y--) {
      acc += rowCounts[y];
      cum[y] = acc;
    }

    // Convert cumulative counts to fraction [0..1] for each pixel-row top-edge
    const table: number[] = new Array(rows);
    for (let y = 0; y < rows; y++) {
      table[y] = cum[y] / total; // fraction filled if top of this row is filled
    }

    setMap(table);
  }, [pathD, size, innerScale]);

  // If mapping not ready, render a placeholder silhouette (unfilled)
  const clipId = `${idRef.current}-clip`;

  // Compute y position (in SVG coordinates) to produce desired percent using map
  const fillY = useMemo(() => {
    if (!map) return size; // no fill
    const p = Math.max(0, Math.min(1, percent));
    // Find the highest row where table[row] >= p, table is fraction when top-edge
    let rows = map.length;
    let found = rows; // default: nothing filled
    for (let i = 0; i < rows; i++) {
      if (map[i] >= p) {
        found = i;
        break;
      }
    }
    // Convert row index to SVG y coordinate (top is 0). We want rect y to be at that row
    const rowHeight = size / rows;
    const y = found * rowHeight;
    return y;
  }, [map, percent, size]);

  return (
    <div className={cn('inline-block', className)} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} preserveAspectRatio="xMidYMid meet">
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            {/* The fill rect starts at y=fillY and extends to bottom */}
            <rect x={0} y={fillY} width={size} height={size - fillY} />
          </clipPath>
        </defs>

        {/* Background silhouette (stroke) */}
        <path d={pathD} fill="none" stroke="currentColor" strokeWidth={1.5} style={{ color: '#444' }} />

        {/* Filled portion clipped by area-aware rect. When innerScale != 1 we
            render the filled path scaled about the viewBox center so the fill
            sits slightly inset from the outline. */}
        <g clipPath={`url(#${clipId})`} filter={fillGroupFilter}>
          <path d={pathD} fill={fill} stroke="none" transform={innerScale !== 1 ? `translate(${size / 2} ${size / 2}) scale(${innerScale}) translate(${-size / 2} ${-size / 2})` : undefined} />
        </g>
      </svg>
    </div>
  );
}

export default AreaFill;
