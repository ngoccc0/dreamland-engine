"use client";

import React from 'react';
import { useId } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

  // Determine gradient stops (as color strings) based on statName and current percentage
  // We use explicit color stops because SVG <linearGradient> requires stop colors.
  let gradientStops: string[];
  if (statName === 'Health' && percentage < 25) {
    gradientStops = ['#b91c1c', '#f97316', '#eab308']; // red -> orange -> yellow
  } else {
    switch (statName) {
      case 'Health':
        gradientStops = ['#b91c1c', '#ef4444'];
        break;
      case 'Mana':
        gradientStops = ['#1d4ed8', '#3b82f6'];
        break;
      case 'Stamina':
        gradientStops = ['#a16207', '#facc15'];
        break;
      case 'Hunger':
        gradientStops = ['#b45309', '#f59e0b'];
        break;
      default:
        gradientStops = ['#6b7280', '#9ca3af'];
        break;
    }
  }

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
              "relative w-8 h-8 flex items-center justify-center cursor-default",
              className
            )}
            aria-label={`${statName}: ${value}/${maxValue}`}
          >
            {/* Background icon (empty state) */}
            <Icon className="absolute w-full h-full text-muted-foreground opacity-30" />

            {/* Filled icon rendered by masking a gradient with the icon's SVG shape.
                We render a hidden Icon element, read its outerHTML on the client, and
                build a data URL SVG mask used via CSS mask-image / -webkit-mask-image.
            */}
            <MaskedGradientFill Icon={Icon} percentage={percentage} gradientStops={gradientStops} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{statName}: {value}/{maxValue}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function MaskedGradientFill({ Icon, percentage, gradientStops }: { Icon: React.ElementType; percentage: number; gradientStops: string[] }) {
  const hiddenRef = React.useRef<HTMLDivElement | null>(null);
  const [maskUrl, setMaskUrl] = React.useState<string | null>(null);

  // Build a CSS linear-gradient string from gradientStops
  const gradientCss = React.useMemo(() => {
    if (!gradientStops || gradientStops.length === 0) return 'linear-gradient(to top, #9ca3af, #6b7280)';
    if (gradientStops.length === 1) return `linear-gradient(to top, ${gradientStops[0]}, ${gradientStops[0]})`;
    return `linear-gradient(to top, ${gradientStops.join(', ')})`;
  }, [gradientStops]);
  // Hook: unique id used for inline gradients/clipPaths
  const uid = React.useId();
  const inlineGradId = `hud-grad-inline-${uid}`;
  const inlineClipId = `hud-clip-inline-${uid}`;
  // Try to render an inline SVG first. Prefer hardcoded silhouette paths when available
  // because they produce a true filled shape that clips correctly (best visual result).
  let inlineSvg: React.ReactNode | null = null;
  try {
    const iconName = (Icon as any).displayName ?? (Icon as any).name ?? null;

    // Hardcoded silhouette paths for critical HUD icons. These are filled path(s)
    // suitable for a true "cup-filling" gradient + clip. Add or adjust paths as needed.
    const SILHOUETTE_PATHS: Record<string, string> = {
      // Heart silhouette (simple filled heart)
      Heart: 'M12 21s-7-4.736-9-7.064C0.5 11.5 1 7 4 5c2-1.5 5-0.5 6.5 1C12 4.5 15 3.5 17 5c3 2 3.5 6.5 1 8.936C19 16.264 12 21 12 21z',
      // Zap / Lightning bolt silhouette
      Zap: 'M13 2L3 14h7l-1 8 11-13h-7l0-7z',
      // Footprints: two simple filled oval shapes to approximate footprint silhouettes
      Footprints: 'M6 7c-1.657 0-3 1.567-3 3.5S4.343 14 6 14s3-1.567 3-3.5S7.657 7 6 7zm12 0c-1.657 0-3 1.567-3 3.5S16.343 14 18 14s3-1.567 3-3.5S19.657 7 18 7z',
      // Beef / Meat silhouette (simple rounded meat shape)
      Beef: 'M20 12c0 3-3 6-8 8-5-2-8-5-8-8s3-6 8-8c5 2 8 5 8 8z',
    };

    const sil = iconName ? SILHOUETTE_PATHS[iconName] : undefined;
    if (sil) {
      const viewSize = 24;
      const height = Math.max(0, (percentage / 100) * viewSize) || 0;
      const y = Math.max(0, viewSize - height) || 0;

      inlineSvg = (
        <>
          {/* Filled silhouette with gradient and bottom-up clip */}
          <svg className="absolute w-full h-full" viewBox={`0 0 ${viewSize} ${viewSize}`} preserveAspectRatio="xMidYMid meet" aria-hidden>
            <defs>
              <linearGradient id={inlineGradId} x1="0" y1="1" x2="0" y2="0">
                {gradientStops.map((c, i) => (
                  <stop key={i} offset={`${(i / Math.max(1, gradientStops.length - 1)) * 100}%`} stopColor={c} />
                ))}
              </linearGradient>
              <clipPath id={inlineClipId} clipPathUnits="userSpaceOnUse">
                <rect x={0} y={y} width={viewSize} height={Math.max(0, height)} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${inlineClipId})`}>
              <path d={sil} fill={`url(#${inlineGradId})`} />
            </g>
          </svg>

          {/* Outline on top: render the original Icon as an overlay with stroke=currentColor */}
          <Icon className="absolute w-full h-full text-current" stroke="currentColor" fill="none" width={24} height={24} aria-hidden />
        </>
      );
    } else {
      // No silhouette available — fall back to the previous inline-child cloning approach
      const iconEl = React.createElement(Icon, { width: 24, height: 24 });
      const children = (iconEl && (iconEl as any).props && (iconEl as any).props.children) || null;

      if (children) {
        const viewSize = 24;
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
            stroke: 'currentColor',
            fill: 'none',
            strokeWidth: origStrokeWidth,
          });
          return React.cloneElement(child, { key: `outline-${i}`, ...outlineProps });
        });

        inlineSvg = (
          <svg className="absolute w-full h-full" viewBox={`0 0 ${viewSize} ${viewSize}`} preserveAspectRatio="xMidYMid meet" aria-hidden>
            <defs>
              <linearGradient id={inlineGradId} x1="0" y1="1" x2="0" y2="0">
                {gradientStops.map((c, i) => (
                  <stop key={i} offset={`${(i / Math.max(1, gradientStops.length - 1)) * 100}%`} stopColor={c} />
                ))}
              </linearGradient>
              <clipPath id={inlineClipId} clipPathUnits="userSpaceOnUse">
                <rect x={0} y={y} width={viewSize} height={Math.max(0, height)} />
              </clipPath>
            </defs>
            {/* Color layer clipped to show only bottom percentage */}
            <g clipPath={`url(#${inlineClipId})`}>
              {colorParts}
            </g>
            {/* Outline layer on top */}
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

  // If we produced an inline SVG, return it now
  if (inlineSvg) {
    return <>{inlineSvg}</>;
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
      <div ref={hiddenRef} style={{ position: 'absolute', width: 24, height: 24, overflow: 'hidden', pointerEvents: 'none', opacity: 0 }} aria-hidden>
        <Icon width={24} height={24} />
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
          }}
        />
      </div>
    </>
  );
}
