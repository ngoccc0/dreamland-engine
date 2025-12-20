import React, { useEffect, useRef, useState } from 'react';
import AreaFill from '@/components/ui/area-fill';
import { cn } from '@/lib/utils';

interface HudIconStaminaProps {
  percent: number; // 0..1
  size?: number;
  className?: string;
}

// Bolt silhouette path (1024 coordinate space) taken from the provided SVG
const BOLT_PATH = `M584.00,135.00Q702.00,135.00,710.50,140.50Q719.00,146.00,722.00,153.50Q725.00,161.00,722.50,171.50Q720.00,182.00,659.00,284.50Q598.00,387.00,652.00,387.50Q706.00,388.00,714.00,394.00Q722.00,400.00,724.50,405.50Q727.00,411.00,727.00,419.00Q727.00,427.00,724.50,433.50Q722.00,440.00,559.50,661.00Q397.00,882.00,392.00,885.00Q387.00,888.00,381.50,888.00Q376.00,888.00,370.00,884.50Q364.00,881.00,362.00,876.50Q360.00,872.00,360.00,866.50Q360.00,861.00,399.50,711.00Q439.00,561.00,387.50,560.50Q336.00,560.00,327.50,554.50Q319.00,549.00,315.50,537.50Q312.00,526.00,373.00,344.00Q434.00,162.00,441.00,152.00Q448.00,142.00,456.50,139.00Q465.00,136.00,465.50,135.50Q466.00,135.00,584.00,135.00Z`;

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
      } catch {
        /* ignore */
      }
      if (t < 1) anim.id = requestAnimationFrame(step);
      else {
        try {
          dispNonNull.setAttribute('scale', '0');
          turbNonNull.setAttribute('baseFrequency', '0.015');
        } catch {}
        waveAnimRef.current = null;
      }
    }
    anim.id = requestAnimationFrame(step);
    waveAnimRef.current = anim;
  }

  // Display ratio tweaks: use the provided 1024 viewBox path; keep visual
  // scaling consistent with other icons by mapping `size` → display px.
  // Use exact requested size for consistent HUD icon sizing
  const displayWidth = size;
  const displayHeight = size;

  return (
    <div className={cn('inline-block', className)} style={{ width: displayWidth, height: displayHeight }}>
      {/* Use the 1024x1024 coordinate system to match the provided path */}
      <svg viewBox={`0 0 1024 1024`} width={displayWidth} height={displayHeight} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stops[0]} />
            <stop offset="50%" stopColor={stops[1]} />
            <stop offset="100%" stopColor={stops[2]} />
          </linearGradient>

          {/* Metallic outline gradient (from the provided sample) */}
          <linearGradient id={outlineGradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7b4a1a" />
            <stop offset="30%" stopColor="#d3a04a" />
            <stop offset="60%" stopColor="#ffd88a" />
            <stop offset="100%" stopColor="#8b5a22" />
          </linearGradient>

          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
            <feTurbulence ref={(el) => { turbRef.current = el; }} type="fractalNoise" baseFrequency="0.015" numOctaves={2} seed={42} result="noise" />
            <feDisplacementMap ref={(el) => { dispRef.current = el; }} in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* Use AreaFill to compute area-aware fill; pass gradient url and filter on the filled group */}
        <g>
          <foreignObject x={0} y={0} width={1024} height={1024} style={{ overflow: 'visible', filter: 'drop-shadow(0px 6px 8px rgba(0,0,0,0.18))' }}>
            {/* AreaFill will render its own SVG; we want fill to reference our gradient and apply filter */}
            <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
              {/* Pass size=1024 to match the path coordinate space */}
              <AreaFill pathD={BOLT_PATH} percent={percent} size={1024} innerScale={0.965} fill={`url(#${gradId})`} fillGroupFilter={`url(#${filterId})`} />
            </div>
          </foreignObject>
        </g>

        {/* Metallic outline on top (thicker stroke appropriate for 1024 coords) */}
        <path d={BOLT_PATH} fill="none" stroke={`url(#${outlineGradId})`} strokeWidth={28} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default HudIconStamina;
