import React, { useEffect, useRef, useState } from 'react';
import AreaFill from '@/components/ui/area-fill';
import { cn } from '@/lib/utils';

interface HudIconHealthProps {
  percent: number; // 0..1
  size?: number;
  className?: string;
}

// Heart silhouette in 0..100 coordinate space (copied from hud-icon-progress)
const HEART_PATH = 'M50 85 C20 60, 6 42, 20 26 A18 18 0 0 1 50 27 A18 18 0 0 1 80 26 C94 42, 80 60, 50 85 Z';

function hexToRgb(hex: string) {
  const m = hex.replace('#', '');
  const v = parseInt(m, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
}
function mixHex(a: string, b: string, t: number) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(Math.round(A[0] + (B[0] - A[0]) * t), Math.round(A[1] + (B[1] - A[1]) * t), Math.round(A[2] + (B[2] - A[2]) * t));
}

export function HudIconHealth({ percent, size = 40, className }: HudIconHealthProps) {
  const id = useRef(`hp-${Math.random().toString(36).slice(2, 9)}`).current;
  const gradId = `dynGradHp-${id}`;
  const outlineGradId = `metalOutlineGradHp-${id}`;
  const filterId = `liquidFilterHp-${id}`;
  const turbRef = useRef<SVGFETurbulenceElement | null>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement | null>(null);

  const ramp = [
    { p: 100, s: ['#ff4d4d', '#ff1a1a', '#b20000'] },
    { p: 75, s: ['#ff6b6b', '#ff3333', '#c11616'] },
    { p: 50, s: ['#fff176', '#ffd54d', '#ffb74d'] },
    { p: 30, s: ['#ffb84d', '#ff8c00', '#cc6600'] },
    { p: 0, s: ['#7a0000', '#4a0000', '#2a0000'] },
  ];

  const [stops, setStops] = useState<string[]>(ramp[0].s);
  const lastPercent = useRef<number>(percent * 100);
  const waveAnimRef = useRef<{ id: number } | null>(null);

  useEffect(() => {
    const p100 = Math.max(0, Math.min(100, Math.round(percent * 100)));
    let lo = ramp[0], hi = ramp[ramp.length - 1];
    for (let i = 0; i < ramp.length - 1; i++) {
      const a = ramp[i], b = ramp[i + 1];
      if (p100 <= a.p && p100 >= b.p) { lo = a; hi = b; break; }
    }
    const t = (p100 - hi.p) / (lo.p - hi.p || 1);
    setStops([mixHex(hi.s[0], lo.s[0], t), mixHex(hi.s[1], lo.s[1], t), mixHex(hi.s[2], lo.s[2], t)]);

    const delta = p100 - lastPercent.current;
    if (Math.abs(delta) > 0.5) triggerWave(Math.abs(delta) / 100);
    lastPercent.current = p100;
  }, [percent]);

  function triggerWave(mag: number) {
    const dispEl = dispRef.current;
    const turbEl = turbRef.current;
    if (!dispEl || !turbEl) return;
    if (waveAnimRef.current) cancelAnimationFrame(waveAnimRef.current.id);
    const maxScale = 20 + mag * 60;
    const baseFreq = 0.015 + mag * 0.03;
    const duration = 900 + mag * 900;
    const start = performance.now();
    const anim = { id: 0 };
    const dispNonNull = dispEl as SVGFEDisplacementMapElement;
    const turbNonNull = turbEl as SVGFETurbulenceElement;
    function step(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      const scaleVal = maxScale * (1 - ease);
      const freq = baseFreq * (1 + 0.6 * Math.sin(t * Math.PI * 2));
      try { dispNonNull.setAttribute('scale', scaleVal.toFixed(2)); turbNonNull.setAttribute('baseFrequency', freq.toFixed(4)); } catch {}
      if (t < 1) anim.id = requestAnimationFrame(step); else { try { dispNonNull.setAttribute('scale', '0'); turbNonNull.setAttribute('baseFrequency', '0.015'); } catch {} waveAnimRef.current = null; }
    }
    anim.id = requestAnimationFrame(step);
    waveAnimRef.current = anim;
  }

  // Use exact requested size for consistent HUD icon sizing
  const displayWidth = size;
  const displayHeight = size;

  return (
    <div className={cn('inline-block', className)} style={{ width: displayWidth, height: displayHeight }}>
      <svg viewBox={`0 0 100 100`} width={displayWidth} height={displayHeight} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stops[0]} />
            <stop offset="50%" stopColor={stops[1]} />
            <stop offset="100%" stopColor={stops[2]} />
          </linearGradient>

          <linearGradient id={outlineGradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#59330b" />
            <stop offset="20%" stopColor="#b06b2f" />
            <stop offset="45%" stopColor="#ffd39f" />
            <stop offset="70%" stopColor="#c07a2f" />
            <stop offset="100%" stopColor="#4b2a06" />
          </linearGradient>

          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
            <feTurbulence ref={(el) => { turbRef.current = el; }} type="fractalNoise" baseFrequency="0.015" numOctaves={2} seed={2} result="noise" />
            <feDisplacementMap ref={(el) => { dispRef.current = el; }} in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        <g>
          <foreignObject x={0} y={0} width={100} height={100} style={{ overflow: 'visible' }}>
            <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
              <AreaFill pathD={HEART_PATH} percent={percent} size={100} fill={`url(#${gradId})`} fillGroupFilter={`url(#${filterId})`} />
            </div>
          </foreignObject>
        </g>

        <path d={HEART_PATH} fill="none" stroke={`url(#${outlineGradId})`} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default HudIconHealth;
