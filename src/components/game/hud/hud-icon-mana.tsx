import React, { useEffect, useRef, useState } from 'react';
import AreaFill from '@/components/ui/area-fill';
import { cn } from '@/lib/utils';

interface HudIconManaProps {
  percent: number; // 0..1
  size?: number;
  className?: string;
}

// Teardrop path provided by user in 0..1024 coords
const DROP_PATH = 'M512 64 C680 220 832 420 800 656 C768 900 256 900 224 656 C192 420 344 220 512 64 Z';

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

export function HudIconMana({ percent, size = 48, className }: HudIconManaProps) {
  const id = useRef(`mana-${Math.random().toString(36).slice(2, 9)}`).current;
  const gradId = `dynGradMana-${id}`;
  const outlineGradId = `metalOutlineGradMana-${id}`;
  const filterId = `liquidFilterMana-${id}`;
  const turbRef = useRef<SVGFETurbulenceElement | null>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement | null>(null);

  const ramp = [
    { p: 100, s: ['#9be7ff', '#33c6ff', '#0078d4'] },
    { p: 70, s: ['#7fe2ff', '#1fb6ff', '#0066c1'] },
    { p: 40, s: ['#53d0ff', '#00aaff', '#0050a1'] },
    { p: 15, s: ['#2aa8d6', '#0088c0', '#003d66'] },
    { p: 0, s: ['#0c2a3a', '#071922', '#020a0f'] },
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
    const maxScale = 12 + mag * 40;
    const baseFreq = 0.012 + mag * 0.02;
    const duration = 800 + mag * 700;
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
      if (t < 1) anim.id = requestAnimationFrame(step); else { try { dispNonNull.setAttribute('scale', '0'); turbNonNull.setAttribute('baseFrequency', '0.012'); } catch {} waveAnimRef.current = null; }
    }
    anim.id = requestAnimationFrame(step);
    waveAnimRef.current = anim;
  }

  // Use exact requested size for consistent HUD icon sizing
  const displayWidth = size;
  const displayHeight = size;

  // Use the user's provided gradients and filters (colors taken from the SVG they supplied)
  const innerGradStops = ['#57d8d6', '#1fa6b2', '#08184a'];
  const metalGradStops = ['#7b4a1a', '#d3a04a', '#ffd88a', '#8b5a22'];

  return (
    <div className={cn('inline-block', className)} style={{ width: displayWidth, height: displayHeight }}>
      <svg viewBox={`0 0 1024 1024`} width={displayWidth} height={displayHeight} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={innerGradStops[0]} />
            <stop offset="50%" stopColor={innerGradStops[1]} />
            <stop offset="100%" stopColor={innerGradStops[2]} />
          </linearGradient>

          <linearGradient id={outlineGradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={metalGradStops[0]} />
            <stop offset="30%" stopColor={metalGradStops[1]} />
            <stop offset="60%" stopColor={metalGradStops[2]} />
            <stop offset="100%" stopColor={metalGradStops[3]} />
          </linearGradient>

          <radialGradient id={`goldShine-${id}`} cx="0.35" cy="0.2" r="0.9">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#fff8e6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          <filter id={`softBlur-${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={6} />
          </filter>

          <filter id={`innerShadow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feOffset dx="0" dy="10" result="off" />
            <feGaussianBlur in="off" stdDeviation={18} result="blur" />
            <feComposite in="blur" in2="SourceGraphic" operator="out" result="shadow" />
            <feColorMatrix in="shadow" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.45 0" />
            <feBlend in="SourceGraphic" in2="shadow" mode="normal" />
          </filter>

          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
            <feTurbulence ref={(el) => { turbRef.current = el; }} type="fractalNoise" baseFrequency="0.012" numOctaves={2} seed={7} result="noise" />
            <feDisplacementMap ref={(el) => { dispRef.current = el; }} in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* Area-aware fill rendered by AreaFill (size=1024 -> matches path coordinates) */}
        <g>
          <foreignObject x={0} y={0} width={1024} height={1024} style={{ overflow: 'visible' }}>
            <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
              <AreaFill pathD={DROP_PATH} percent={percent} size={1024} fill={`url(#${gradId})`} fillGroupFilter={`url(#${filterId})`} />
            </div>
          </foreignObject>
        </g>

        {/* Metallic border */}
        <path d={DROP_PATH} fill="none" stroke={`url(#${outlineGradId})`} strokeWidth={56} strokeLinejoin="round" strokeLinecap="round" />

        {/* Optional metallic highlight */}
        <path d="M512 86 C666 244 796 424 770 642 C746 852 278 852 254 642 C230 432 358 252 512 86 Z"
          fill="none" stroke={`url(#goldShine-${id})`} strokeWidth={22} strokeLinejoin="round" opacity={0.65} filter={`url(#softBlur-${id})`} />
      </svg>
    </div>
  );
}

export default HudIconMana;
