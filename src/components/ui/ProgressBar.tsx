import React, { useMemo } from 'react';

type Props = {
  value: number;
  max?: number;
  width?: number; // overall SVG width (defaults to 300)
  height?: number; // overall SVG height (defaults to 30)
  className?: string;
  label?: string | null;
  ariaLabel?: string;
};

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return { r: parseInt(h.substring(0, 2), 16), g: parseInt(h.substring(2, 4), 16), b: parseInt(h.substring(4, 6), 16) };
}
function rgbToHex(r: number, g: number, b: number) {
  const toHex = (v: number) => ('0' + v.toString(16)).slice(-2);
  return '#' + toHex(r) + toHex(g) + toHex(b);
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const stops = [
  { p: 0, c: '#ff4d4d' }, // red
  { p: 33, c: '#ff8c1a' }, // orange
  { p: 66, c: '#ffd11a' }, // yellow
  { p: 100, c: '#4caf50' } // green
];

function getColorForPercent(p: number) {
  p = Math.max(0, Math.min(100, p));
  for (let i = 1; i < stops.length; i++) {
    if (p <= stops[i].p) {
      const a = stops[i - 1];
      const b = stops[i];
      const t = (p - a.p) / (b.p - a.p);
      const ra = hexToRgb(a.c);
      const rb = hexToRgb(b.c);
      const r = Math.round(lerp(ra.r, rb.r, t));
      const g = Math.round(lerp(ra.g, rb.g, t));
      const bcol = Math.round(lerp(ra.b, rb.b, t));
      return rgbToHex(r, g, bcol);
    }
  }
  return stops[stops.length - 1].c;
}

/**
 * SVG-based metallic progress bar.
 * Props drive the width of the inner fill rect and its color.
 */
export default function ProgressBar({ value, max = 100, width = 300, height = 30, className, label = null, ariaLabel }: Props) {
  const clampedMax = Math.max(1, max);
  const clampedValue = Math.max(0, Math.min(value, clampedMax));
  const percent = Math.round((clampedValue / clampedMax) * 100);

  const innerInset = 6; // total inset left+right = 6 (match original: x=3..width-3)
  const fullWidth = Math.max(10, width - innerInset);

  const fillWidth = Math.round((fullWidth * percent) / 100);
  const fillColor = useMemo(() => getColorForPercent(percent), [percent]);

  // compute rx for rounded corners based on fill width and track height
  const trackHeight = Math.max(6, height - 6);
  const rxForFill = Math.min(Math.floor(trackHeight / 2), Math.floor(fillWidth / 2));

  return (
    <div className={className} style={{ fontFamily: 'Arial, Helvetica, sans-serif', width }}>
      {label ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontSize: 12 }}>{label}</div>
          <div style={{ fontSize: 11, opacity: 0.9 }}>{percent}%</div>
        </div>
      ) : null}

      <svg
        id="progressSvg"
        width={width}
        height={height}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={ariaLabel ?? label ?? 'Progress'}
        aria-valuemin={0 as any}
        aria-valuemax={clampedMax as any}
        aria-valuenow={clampedValue as any}
      >
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5E3C" />
            <stop offset="100%" stopColor="#888888" />
          </linearGradient>
          <linearGradient id="goldStroke" x1="0%" y1="0%" x2="100%" y2="0">
            <stop offset="0%" stopColor="#b78628" />
            <stop offset="25%" stopColor="#ffd966" />
            <stop offset="50%" stopColor="#fff1c7" />
            <stop offset="75%" stopColor="#ffd966" />
            <stop offset="100%" stopColor="#8f6b22" />
          </linearGradient>
          <filter id="metallicGloss" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
            <feSpecularLighting in="blur" surfaceScale="1" specularConstant="0.5" specularExponent="20" lightingColor="#ffffff" result="specOut">
              <fePointLight x="-100" y="-200" z="500" />
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specMask" />
            <feMerge>
              <feMergeNode in="specMask" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* outer rounded frame with metallic stroke */}
        <rect x={0} y={0} width={width} height={height} rx={Math.floor(height / 2)} ry={Math.floor(height / 2)} fill="url(#bgGradient)" stroke="url(#goldStroke)" strokeWidth={4} filter="url(#metallicGloss)" />

        {/* track background (inset) */}
        <rect x={3} y={3} width={fullWidth} height={trackHeight} rx={Math.floor(trackHeight / 2)} ry={Math.floor(trackHeight / 2)} fill="rgba(255,255,255,0.06)" />

        {/* fill bar */}
        <rect id="barFill" x={3} y={3} width={fillWidth} height={trackHeight} rx={rxForFill} ry={rxForFill} fill={fillColor} />
      </svg>
    </div>
  );
}
