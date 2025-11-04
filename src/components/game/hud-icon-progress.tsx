import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HudIconProgressProps {
  Icon: React.ElementType; // Lucide icon component
  value: number; // Current stat value
  maxValue: number; // Maximum stat value
  fillColor: string; // Tailwind CSS class for fill color (e.g., 'text-red-500')
  statName: string; // Name of the stat (e.g., "Health")
  className?: string; // Additional class names for the container
}

/**
 * Renders a HUD icon with a dynamic "liquid fill" progress effect.
 * The icon's fill level changes based on the current value relative to its maximum value.
 * On hover (desktop) or tap (mobile), a tooltip displays the stat name and current value.
 *
 * @param {Object} props - The component props.
 * @param {React.ElementType} props.Icon - The Lucide icon component to render.
 * @param {number} props.value - The current value of the stat.
 * @param {number} props.maxValue - The maximum possible value of the stat.
 * @param {string} props.fillColor - Tailwind CSS class for the color of the filled portion of the icon (e.g., 'text-red-500').
 * @param {string} props.statName - The name of the stat, used for the tooltip.
 * @param {string} [props.className] - Optional additional class names for the container div.
 * @returns {JSX.Element} The rendered HudIconProgress component.
 *
 * @example
 * // Renders a heart icon that fills based on HP, with a red fill.
 * <HudIconProgress Icon={Heart} value={playerStats.hp} maxValue={100} fillColor="text-destructive" statName="Health" />
 */
export function HudIconProgress({ Icon, value, maxValue, fillColor, statName, className }: HudIconProgressProps) {
  // Calculate the fill percentage. Ensure it's between 0 and 100.
  // RATIONALE: This calculation determines the visual fill level of the icon.
  // IMPACT: A higher percentage means more of the icon will be filled, visually representing a higher stat value.
  const percentage = Math.max(0, Math.min(100, (value / maxValue) * 100));

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

            {/* Filled icon (dynamic fill) */}
            <div
              className="absolute w-full h-full overflow-hidden"
              style={{
                // RATIONALE: clipPath is used to dynamically "fill" the icon from the bottom up.
                // The 'inset' value controls how much of the icon is visible from the bottom.
                // IMPACT: As 'percentage' increases, 'inset' decreases, making more of the icon visible and appearing "filled".
                clipPath: `inset(${100 - percentage}% 0 0 0)`,
              }}
            >
              <Icon className={cn("w-full h-full", fillColor)} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{statName}: {value}/{maxValue}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
