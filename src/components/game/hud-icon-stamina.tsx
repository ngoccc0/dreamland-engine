import React, { useEffect, useRef, useState } from 'react';
import AreaFill from '@/components/ui/area-fill';
import { cn } from '@/lib/utils';

interface HudIconStaminaProps {
  percent: number; // 0..1
  size?: number;
  className?: string;
}

// Bolt silhouette path (same as the HTML sample)
const BOLT_PATH = 'M60 6 L36 46 L56 46 L28 94 L68 52 L48 52 L72 6 Z';

function hexToRgb(hex: string) {
  const m = hex.replace('#', '');
  const v = parseInt(m, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
function rgbToHex(r: number, g: number, b: number) {
  return (
    '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('')
  );
}
function mixHex(a: string, b: string, t: number) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(Math.round(A[0] + (B[0] - A[0]) * t), Math.round(A[1] + (B[1] - A[1]) * t), Math.round(A[2] + (B[2] - A[2]) * t));
}

export function HudIconStamina({ percent, size = 48, className }: HudIconStaminaProps) {
  const id = useRef(`bolt-${Math.random().toString(36).slice(2, 9)}`).current;
  const gradId = `dynGradBolt-${id}`;
  const outlineGradId = `metalOutlineGradBolt-${id}`;
  const filterId = `liquidFilterBolt-${id}`;
  const turbRef = useRef<SVGFETurbulenceElement | null>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement | null>(null);

  // Ramp similar to the HTML sample (percent in 0..100 scale)
  const ramp = [
    { p: 100, s: ['#ffd27a', '#ff9a1a', '#d94f00'] },
    { p: 70, s: ['#ffc06a', '#ff8b00', '#c54a00'] },
    { p: 40, s: ['#ff9a3a', '#ff6600', '#b23f00'] },
    { p: 15, s: ['#ff7a2a', '#e65100', '#7a2f00'] },
    { p: 0, s: ['#5c2a14', '#341306', '#1a0b03'] },
  ];

  const [stops, setStops] = useState<string[]>(ramp[0].s);
  // For wave animation control
  const lastPercent = useRef<number>(percent * 100);
  const waveAnimRef = useRef<{ id: number } | null>(null);

  useEffect(() => {
    const p100 = Math.max(0, Math.min(100, Math.round(percent * 100)));
    // pick range
    let lo = ramp[0], hi = ramp[ramp.length - 1];
    for (let i = 0; i < ramp.length - 1; i++) {
      const a = ramp[i], b = ramp[i + 1];
      if (p100 <= a.p && p100 >= b.p) {
        lo = a;
        hi = b;
        break;
      }
    }
    const t = (p100 - hi.p) / (lo.p - hi.p || 1);
    setStops([mixHex(hi.s[0], lo.s[0], t), mixHex(hi.s[1], lo.s[1], t), mixHex(hi.s[2], lo.s[2], t)]);

    // Trigger wave on change
    const delta = p100 - lastPercent.current;
    if (Math.abs(delta) > 0.5) {
      triggerWave(Math.abs(delta) / 100);
    }
    lastPercent.current = p100;
  }, [percent]);

  // Wave animation: update disp.scale and turb.baseFrequency over time
  function triggerWave(mag: number) {
  const dispEl = dispRef.current;
  const turbEl = turbRef.current;
  if (!dispEl || !turbEl) return;
  if (waveAnimRef.current) cancelAnimationFrame(waveAnimRef.current.id);
  const dispNonNull = dispEl as SVGFEDisplacementMapElement;
  const turbNonNull = turbEl as SVGFETurbulenceElement;
    const maxScale = 18 + mag * 50;
    const baseFreq = 0.015 + mag * 0.03;
    const duration = 900 + mag * 900;
    const start = performance.now();
    const anim = { id: 0 };
    function step(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      const scaleVal = maxScale * (1 - ease);
      const freq = baseFreq * (1 + 0.6 * Math.sin(t * Math.PI * 2));
      try {
        dispNonNull.setAttribute('scale', scaleVal.toFixed(2));
        turbNonNull.setAttribute('baseFrequency', freq.toFixed(4));
      } catch (e) {
        /* ignore */
      }
      if (t < 1) anim.id = requestAnimationFrame(step);
      else {
        try {
          dispNonNull.setAttribute('scale', '0');
          turbNonNull.setAttribute('baseFrequency', '0.015');
        } catch (e) {}
        waveAnimRef.current = null;
      }
    }
    anim.id = requestAnimationFrame(step);
    waveAnimRef.current = anim;
  }

  // Display ratio tweaks: make the bolt icon ~20% wider and ~10% shorter visually
  const displayWidth = size * 1.2;
  const displayHeight = size * 0.9;

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
            <stop offset="22%" stopColor="#b06b2f" />
            <stop offset="48%" stopColor="#ffd39f" />
            <stop offset="72%" stopColor="#c07a2f" />
            <stop offset="100%" stopColor="#4b2a06" />
          </linearGradient>

          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
            <feTurbulence ref={(el) => { turbRef.current = el; }} type="fractalNoise" baseFrequency="0.015" numOctaves={2} seed={42} result="noise" />
            <feDisplacementMap ref={(el) => { dispRef.current = el; }} in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* Use AreaFill to compute area-aware fill; pass gradient url and filter on the filled group */}
        <g>
          <foreignObject x={0} y={0} width={100} height={100} style={{ overflow: 'visible' }}>
            {/* AreaFill will render its own SVG; we want fill to reference our gradient and apply filter */}
            <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
              <AreaFill pathD={BOLT_PATH} percent={percent} size={100} fill={`url(#${gradId})`} fillGroupFilter={`url(#${filterId})`} />
            </div>
          </foreignObject>
        </g>

        {/* Outline on top */}
        <path d={BOLT_PATH} fill="none" stroke={`url(#${outlineGradId})`} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default HudIconStamina;
