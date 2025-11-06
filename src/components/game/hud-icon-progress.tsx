"use client";

import React from 'react';
import { useId } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Hardcoded silhouette paths for critical HUD icons. These are filled path(s)
// suitable for a true "cup-filling" gradient + clip. Add or adjust paths as needed.
const SILHOUETTE_PATHS: Record<string, string> = {
  // Heart silhouette (from provided SVG, 0..100 coordinates)
  Heart: 'M50 85 C20 60, 6 42, 20 26 A18 18 0 0 1 50 27 A18 18 0 0 1 80 26 C94 42, 80 60, 50 85 Z',
  // Zap / Lightning bolt silhouette
  Zap: 'M13 2L3 14h7l-1 8 11-13h-7l0-7z',
  // Footprints: two simple filled oval shapes to approximate footprint silhouettes
  Footprints: 'M6 7c-1.657 0-3 1.567-3 3.5S4.343 14 6 14s3-1.567 3-3.5S7.657 7 6 7zm12 0c-1.657 0-3 1.567-3 3.5S16.343 14 18 14s3-1.567 3-3.5S19.657 7 18 7z',
  // Beef / Meat silhouette (simple rounded meat shape)
  Beef: 'M20 12c0 3-3 6-8 8-5-2-8-5-8-8s3-6 8-8c5 2 8 5 8 8z',
};

interface HudIconProgressProps {
  Icon: React.ElementType; // Lucide icon component
  value: number; // Current stat value
  maxValue: number; // Maximum stat value
  fillColor: string; // Base Tailwind CSS class for fill color (e.g., 'text-red-500')
  statName: string; // Name of the stat (e.g., "Health")
  className?: string; // Additional class names for the container
}

/**
 * Renders a HUD icon with a dynamic "liquid fill" progress effect and an upward gradient.
 * The icon's fill level changes based on the current value relative to its maximum value.
 * On hover (desktop) or tap (mobile), a tooltip displays the stat name and current value.
 * For HP, the fill color changes to a warning gradient when health is below 25%.
 *
 * @param {Object} props - The component props.
 * @param {React.ElementType} props.Icon - The Lucide icon component to render.
 * @param {number} props.value - The current value of the stat.
 * @param {number} props.maxValue - The maximum possible value of the stat.
 * @param {string} props.fillColor - Tailwind CSS class for the base color of the filled portion of the icon (e.g., 'text-red-500').
 * @param {string} props.statName - The name of the stat, used for the tooltip.
 * @param {string} [props.className] - Optional additional class names for the container div.
 * @returns {JSX.Element} The rendered HudIconProgress component.
 *
 * @example
 * // Renders a heart icon that fills based on HP, with a red fill and warning colors.
 * <HudIconProgress Icon={Heart} value={playerStats.hp} maxValue={playerStats.maxHp ?? 100} fillColor="text-destructive" statName="Health" />
 */
export function HudIconProgress({ Icon, value, maxValue, fillColor, statName, className }: HudIconProgressProps) {
  // Calculate the fill percentage. Ensure it's between 0 and 100.
  // RATIONALE: This calculation determines the visual fill level of the icon.
  // IMPACT: A higher percentage means more of the icon will be filled, visually representing a higher stat value.
  const percentage = Math.max(0, Math.min(100, (value / maxValue) * 100));

  // Pass responsibility for gradient selection to the MaskedGradientFill where
  // the `Icon` name is available for robust detection (handles localization).

  // RATIONALE: This approach uses a div with a background gradient, and then applies the SVG icon
  // as a mask to that div. This is generally more reliable for dynamic SVG fills than
  // `background-clip: text` across different browsers and SVG structures.
  // IMPACT: Ensures the gradient correctly fills the icon shape from the bottom up,
  // and the fill level accurately reflects the stat's percentage.
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              // Increase HUD icon container so all icons are larger and uniform (w-10 = 40px)
              "relative w-10 h-10 flex items-center justify-center cursor-default",
              className
            )}
            aria-label={`${statName}: ${value}/${maxValue}`}
          >
            {/* Background icon removed — using hardcoded silhouette SVG for crisp fills/outlines */}

      {/* Filled icon rendered by masking a gradient with the icon's SVG shape.
                We render a hidden Icon element, read its outerHTML on the client, and
                build a data URL SVG mask used via CSS mask-image / -webkit-mask-image.
            */}
      <MaskedGradientFill Icon={Icon} percentage={percentage} statName={statName} fillColor={fillColor} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{statName}: {value}/{maxValue}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function MaskedGradientFill({ Icon, percentage, statName, fillColor }: { Icon: React.ElementType; percentage: number; statName?: string; fillColor?: string }) {
  const hiddenRef = React.useRef<HTMLDivElement | null>(null);
  const [maskUrl, setMaskUrl] = React.useState<string | null>(null);

  // Pixel size used for inline-child fallbacks and hidden extraction. Keep in sync
  // with the container size above (w-10/h-10 -> 40px).
  const ICON_PX = 40;

  // Cache for silhouette pixel data (cumulative counts per row and total pixels)
  // Keyed by the silhouette path string so multiple icons reuse the computed map.
  const silhouettePixelCache = React.useRef(new Map<string, { cumulative: Uint32Array; total: number }>()).current;

  // Mapping state for the currently-used silhouette (if any). This is populated
  // by sampling a 100x100 canvas rendering of the silhouette path and counting
  // filled pixels per row to form a cumulative distribution.
  const [silhouetteMapping, setSilhouetteMapping] = React.useState<{ cumulative: Uint32Array; total: number } | null>(null);

  // We'll compute gradientStops here because we can inspect the Icon's name
  // (handles localized statName values). Helpers to mix hex colors.
  function hexToRgb(hex: string) { const m = hex.replace('#',''); const bigint = parseInt(m,16); return [(bigint>>16)&255, (bigint>>8)&255, bigint&255]; }
  function rgbToHex(r:number,g:number,b:number){ return '#' + [r,g,b].map(x=>x.toString(16).padStart(2,'0')).join(''); }
  function mixHex(a:string,b:string,t:number){ const A = hexToRgb(a), B = hexToRgb(b); const R = Math.round(A[0] + (B[0]-A[0])*t); const G = Math.round(A[1] + (B[1]-A[1])*t); const Bc = Math.round(A[2] + (B[2]-A[2])*t); return rgbToHex(R,G,Bc); }

  function computeHealthRamp(pct: number) {
    const ramp = [
      { p: 100, s: ['#ff4d4d','#ff1a1a','#b20000'] },
      { p: 75,  s: ['#ff6b6b','#ff3333','#c11616'] },
      { p: 50,  s: ['#fff176','#ffd54d','#ffb74d'] },
      { p: 30,  s: ['#ffb84d','#ff8c00','#cc6600'] },
      { p: 0,   s: ['#7a0000','#4a0000','#2a0000'] },
    ];
    pct = Math.max(0, Math.min(100, pct));
    let lo = ramp[0], hi = ramp[ramp.length-1];
    for (let i=0;i<ramp.length-1;i++){
      const a = ramp[i], b = ramp[i+1];
      if (pct <= a.p && pct >= b.p) { lo = a; hi = b; break; }
      if (pct >= a.p && pct <= b.p) { lo = a; hi = b; break; }
    }
    let t = 0; if (lo.p === hi.p) t = 0; else t = (pct - lo.p) / (hi.p - lo.p);
    t = Math.max(0, Math.min(1, t));
    return [ mixHex(lo.s[0], hi.s[0], t), mixHex(lo.s[1], hi.s[1], t), mixHex(lo.s[2], hi.s[2], t) ];
  }

  // figure out the icon name and any hardcoded silhouette path we have for it
  const uid = React.useId();
  const iconName = (Icon as any).displayName ?? (Icon as any).name ?? null;
  const sil = iconName ? SILHOUETTE_PATHS[iconName] : undefined;

  // Decide gradient stops based on icon/stat hints
  let gradientStops: string[] = [];
  const isHeartIcon = !!(iconName && /heart/i.test(String(iconName)));
  const statNameLower = String(statName || '').toLowerCase();
  const looksLikeHealthStat = /health|hp|máu|sức/i.test(statNameLower);
  const fillHint = String(fillColor || '').toLowerCase();
  const fillSuggestsHealth = fillHint.includes('destruct') || fillHint.includes('danger') || fillHint.includes('red');
  if (isHeartIcon || looksLikeHealthStat || fillSuggestsHealth) {
    gradientStops = computeHealthRamp(percentage);
  } else {
    switch (statName) {
      case 'Mana': gradientStops = ['#1d4ed8', '#3b82f6', '#60a5fa']; break;
      case 'Stamina': gradientStops = ['#a16207', '#facc15', '#f59e0b']; break;
      case 'Hunger': gradientStops = ['#b45309', '#f59e0b', '#fb923c']; break;
      default: gradientStops = ['#6b7280', '#9ca3af']; break;
    }
  }

  // Build a CSS linear-gradient string from gradientStops
  const gradientCss = React.useMemo(() => {
    if (!gradientStops || gradientStops.length === 0) return 'linear-gradient(to top, #9ca3af, #6b7280)';
    if (gradientStops.length === 1) return `linear-gradient(to top, ${gradientStops[0]}, ${gradientStops[0]})`;
    return `linear-gradient(to top, ${gradientStops.join(', ')})`;
  }, [gradientStops]);
  // Hook: unique id used for inline gradients/clipPaths
  const inlineGradId = `hud-grad-inline-${uid}`;
  const inlineClipId = `hud-clip-inline-${uid}`;
  const metalGradId = `hud-metal-${uid}`;

  // Compute a transform to normalize silhouette paths to the 0..100 viewBox.
  // Some silhouettes were authored in smaller coordinate spaces (e.g. 0..24).
  // We parse numeric coordinates approximately and compute translate+scale to
  // center & fit the path into a 100×100 box.
  const silTransform = React.useMemo(() => {
    if (!sil) return '';
    try {
      const nums = Array.from(sil.matchAll(/-?\d*\.?\d+/g)).map(m => parseFloat(m[0]));
      const pairs: Array<[number, number]> = [];
      for (let i = 0; i + 1 < nums.length; i += 2) pairs.push([nums[i], nums[i + 1]]);
      if (pairs.length === 0) return '';
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const [x, y] of pairs) {
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
      if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) return '';
      const width = Math.max(1, maxX - minX);
      const height = Math.max(1, maxY - minY);
      const scale = 100 / Math.max(width, height);
      // clamp scale to reasonable maximum to avoid extreme upscales
      const clampedScale = Math.min(scale, 10);
      const targetW = width * clampedScale;
      const targetH = height * clampedScale;
      const tx = (100 - targetW) / 2 - minX * clampedScale;
      const ty = (100 - targetH) / 2 - minY * clampedScale;
      return `translate(${tx} ${ty}) scale(${clampedScale})`;
    } catch (e) {
      return '';
    }
  }, [sil]);

  // Compute / load the silhouette -> per-row cumulative pixel mapping so that
  // we can map a percentage to a visually-correct fill height (area-based).
  React.useEffect(() => {
    if (!sil) { setSilhouetteMapping(null); return; }
    // If cached, sync immediately
    const cached = silhouettePixelCache.get(sil);
    if (cached) { setSilhouetteMapping(cached); return; }

    let cancelled = false;
    const size = 100;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

  // Include the same normalization transform used when rendering so sampling matches visual layout
  const transformAttr = silTransform ? `<g transform="${silTransform}">` : '';
  const transformClose = silTransform ? `</g>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${transformAttr}<path d="${sil}" fill="black"/>${transformClose}</svg>`;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      try {
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        const rows = new Uint32Array(size);
        for (let y = 0; y < size; y++) {
          let rowCount = 0;
          for (let x = 0; x < size; x++) {
            const idx = (y * size + x) * 4;
            const a = data[idx + 3];
            if (a > 128) rowCount++;
          }
          rows[y] = rowCount;
        }
        const cumulative = new Uint32Array(size);
        let sum = 0;
        for (let y = 0; y < size; y++) { sum += rows[y]; cumulative[y] = sum; }
        const total = sum;
        const map = { cumulative, total };
        silhouettePixelCache.set(sil, map);
        setSilhouetteMapping(map);
      } catch (e) {
        // ignore sampling errors
      }
    };
    img.onerror = () => { /* ignore */ };
    img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    return () => { cancelled = true; };
  }, [sil, silhouettePixelCache]);
  // Try to render an inline SVG first. Prefer hardcoded silhouette paths when available
  // because they produce a true filled shape that clips correctly (best visual result).
  let inlineSvg: React.ReactNode | null = null;
  try {
    if (sil) {
      // silhouette paths are authored in a 0..100 coordinate system (matching provided SVG).
      // Render the silhouette inside a 100x100 viewBox so the path coordinates align exactly.
      const viewSize = 100;
      // If we have a precomputed silhouette mapping, use it to pick a height
      // such that the visible area corresponds to `percentage`.
      let height: number;
      if (silhouetteMapping && silhouetteMapping.total > 0) {
        const desired = (silhouetteMapping.total * (percentage / 100));
        const cum = silhouetteMapping.cumulative;
        let idx = 0;
        while (idx < cum.length && cum[idx] < desired) idx++;
        height = Math.max(0, idx + 1);
      } else {
        height = Math.max(0, (percentage / 100) * viewSize) || 0;
      }
      const y = Math.max(0, viewSize - height) || 0;

      // Namespaced ids so multiple icons can exist on the page without clashing
      const gradId = `hud-dyngrad-${uid}`;
      const metalGradId = `hud-metal-${uid}`;
      const turbId = `hud-turb-${uid}`;
      const dispId = `hud-disp-${uid}`;
      const clipId = `hud-heart-clip-${uid}`;
      const maskId = `hud-hp-mask-${uid}`;
      const rectId = `hud-hp-rect-${uid}`;

      inlineSvg = (
        <>
          {/* Filled silhouette with gradient, liquid filter, and bottom-up clip. Uses 0..100 coordinates. */}
          <svg className="absolute w-full h-full transform scale-110" viewBox={`0 0 ${viewSize} ${viewSize}`} preserveAspectRatio="xMidYMid meet" aria-hidden>
            <defs>
              <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
                {gradientStops.map((c, i) => (
                  <stop key={i} offset={`${(i / Math.max(1, gradientStops.length - 1)) * 100}%`} stopColor={c} />
                ))}
              </linearGradient>

              <linearGradient id={metalGradId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#59330b" />
                <stop offset="20%" stopColor="#b06b2f" />
                <stop offset="45%" stopColor="#ffd39f" />
                <stop offset="70%" stopColor="#c07a2f" />
                <stop offset="100%" stopColor="#4b2a06" />
              </linearGradient>

              {/* Liquid displacement filter */}
              <filter id={`hud-liquid-${uid}`} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
                <feTurbulence id={turbId} type="fractalNoise" baseFrequency="0.015" numOctaves="2" seed="2" result="noise" />
                <feDisplacementMap id={dispId} in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
              </filter>

              <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                <g transform={silTransform}><path d={sil} fill="black" /></g>
              </clipPath>
            </defs>

            {/* Fill group: uses clipPath to heart shape, mask to control visible area, and liquid filter for wave */}
            {/* Clip the colored rectangle to the heart silhouette and size it to the computed height */}
            <g clipPath={`url(#${clipId})`} filter={`url(#hud-liquid-${uid})`}>
              <rect x="0" y={String(y)} width="100" height={String(Math.max(0, height))} fill={`url(#${gradId})`} style={{ transition: 'y 280ms ease, height 280ms ease' }} />
            </g>

            {/* Metallic outline on top */}
            <g>
              <g transform={silTransform}>
                <path d={sil} fill="none" stroke={`url(#${metalGradId})`} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
              </g>
            </g>
          </svg>
        </>
      );
    } else {
      // No silhouette available — fall back to the previous inline-child cloning approach
  const iconEl = React.createElement(Icon, { width: ICON_PX, height: ICON_PX });
      const children = (iconEl && (iconEl as any).props && (iconEl as any).props.children) || null;

      if (children) {
  const viewSize = ICON_PX;
  const height = Math.max(0, (percentage / 100) * viewSize) || 0;
  const y = Math.max(0, viewSize - height) || 0;

        // Build two layers: colorLayer (thicker gradient stroke acting as fill) and outlineLayer
        const colorParts = React.Children.map(children, (child: any, i) => {
          if (!React.isValidElement(child)) return child;
          const propsAny = (child.props || {}) as any;
          const origStrokeWidth = Number(propsAny.strokeWidth ?? propsAny.stroke_width ?? 2);
          const colorProps = Object.assign({}, (child && (child.props || {})) as Record<string, any>, {
            stroke: `url(#${inlineGradId})`,
            fill: 'none',
            strokeWidth: Math.max(1, origStrokeWidth * 3),
            strokeLinecap: propsAny.strokeLinecap || 'round',
            strokeLinejoin: propsAny.strokeLinejoin || 'round',
          });
          return React.cloneElement(child, { key: `color-${i}`, ...colorProps });
        });

        const outlineParts = React.Children.map(children, (child: any, i) => {
          if (!React.isValidElement(child)) return child;
          const propsAny2 = (child.props || {}) as any;
          const origStrokeWidth = propsAny2.strokeWidth ?? 2;
          const outlineProps = Object.assign({}, (child && (child.props || {})) as Record<string, any>, {
            stroke: `url(#${metalGradId})`,
            fill: 'none',
            strokeWidth: origStrokeWidth,
          });
          return React.cloneElement(child, { key: `outline-${i}`, ...outlineProps });
        });

        inlineSvg = (
          <svg className="absolute w-full h-full transform scale-110" viewBox={`0 0 ${viewSize} ${viewSize}`} preserveAspectRatio="xMidYMid meet" aria-hidden>
            <defs>
              <linearGradient id={inlineGradId} x1="0" y1="1" x2="0" y2="0">
                {gradientStops.map((c, i) => (
                  <stop key={i} offset={`${(i / Math.max(1, gradientStops.length - 1)) * 100}%`} stopColor={c} />
                ))}
              </linearGradient>
              <linearGradient id={metalGradId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#59330b" />
                <stop offset="20%" stopColor="#b06b2f" />
                <stop offset="45%" stopColor="#ffd39f" />
                <stop offset="70%" stopColor="#c07a2f" />
                <stop offset="100%" stopColor="#4b2a06" />
              </linearGradient>
              <clipPath id={inlineClipId} clipPathUnits="userSpaceOnUse">
                <rect x={0} y={y} width={viewSize} height={Math.max(0, height)} />
              </clipPath>
            </defs>
            {/* Color layer clipped to show only bottom percentage */}
            <g clipPath={`url(#${inlineClipId})`}>
              {colorParts}
            </g>
            {/* Outline layer on top (metallic) */}
            <g>
              {outlineParts}
            </g>
          </svg>
        );
      }
    }
  } catch (err) {
    // fallthrough to mask-based approach below
  }

  // Wave animation for silhouettes: briefly increase displacement scale and turbulence when percentage changes
  const lastPctRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    try {
      if (!((Icon as any).displayName ?? (Icon as any).name)) return; // only for silhouette branch
      const prev = lastPctRef.current;
      if (prev === null) { lastPctRef.current = percentage; return; }
      const delta = percentage - prev;
      lastPctRef.current = percentage;
      if (Math.abs(delta) < 0.5) return; // ignore tiny changes

  const turb = document.getElementById(`hud-turb-${uid}`) as SVGElement | null;
  const disp = document.getElementById(`hud-disp-${uid}`) as SVGElement | null;
      if (!turb || !disp) return;

      let rafId: number | null = null;
      const start = performance.now();
      const duration = 900 + Math.min(800, Math.abs(delta) * 8);
      const maxScale = 25 + Math.min(60, Math.abs(delta) * 0.8);
      function step(now: number) {
        const t = Math.min(1, (now - start) / duration);
        const ease = 1 - Math.pow(1 - t, 3);
        const scaleVal = maxScale * (1 - ease);
        const freq = 0.015 + 0.02 * (1 - ease);
        try {
          if (turb) turb.setAttribute('baseFrequency', freq.toFixed(4));
          if (disp) disp.setAttribute('scale', (scaleVal).toFixed(2));
        } catch (e) {
          // ignore DOM set failures
        }
        if (t < 1) rafId = requestAnimationFrame(step);
        else {
          try { if (turb) turb.setAttribute('baseFrequency', '0.015'); if (disp) disp.setAttribute('scale', '0'); } catch (e) {}
        }
      }
      rafId = requestAnimationFrame(step);
      return () => { if (rafId) cancelAnimationFrame(rafId); };
    } catch (e) {
      // ignore
    }
  }, [percentage, Icon, uid]);

  // If we produced an inline SVG, return it now. Also render a tiny debug
  // gradient strip at the bottom so we can confirm the computed gradientCss
  // is present and visible (helps diagnose clipping/masking issues).
  if (inlineSvg) {
    return (
      <>
        {inlineSvg}
        {/* Debug strip: shows computed gradient so we can verify it's generated */}
        <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 6, pointerEvents: 'none', background: gradientCss, borderTop: '1px solid rgba(0,0,0,0.2)' }} />
      </>
    );
  }

  // Otherwise fall back to the mask-dataurl approach.
  React.useEffect(() => {
    const container = hiddenRef.current;
    if (!container) return;
    try {
      const svgEl = container.querySelector && (container.querySelector('svg') as SVGSVGElement | null);
      if (!svgEl) { setMaskUrl(null); return; }
      let svg = svgEl.outerHTML as string;
      svg = svg.replace(/currentColor/g, 'black');
      svg = svg.replace(/<svg([^>]*)>/, (m, p1) => `<svg${p1} style=\"fill:black;stroke:black\">`);
      const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
      setMaskUrl(dataUrl);
    } catch (e) {
      setMaskUrl(null);
    }
  }, [Icon]);

  return (
    <>
      {/* Hidden icon instance to extract markup for mask creation */}
      <div ref={hiddenRef} style={{ position: 'absolute', width: ICON_PX, height: ICON_PX, overflow: 'hidden', pointerEvents: 'none', opacity: 0 }} aria-hidden>
        <Icon width={ICON_PX} height={ICON_PX} />
      </div>

      {/* Gradient fill clipped by percentage and masked by the icon SVG */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          aria-hidden
          className="absolute bottom-0 left-0 w-full"
          style={{
            height: `${percentage}%`,
            background: gradientCss,
            maskImage: maskUrl ? `url("${maskUrl}")` : undefined,
            WebkitMaskImage: maskUrl ? `url("${maskUrl}")` : undefined,
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskSize: '100% 100%',
            WebkitMaskSize: '100% 100%',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
            transition: 'height 300ms ease',
          }}
        />
      </div>
    </>
  );
}
