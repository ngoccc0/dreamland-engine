/**
 * @overview
 * Body temperature icon component displaying PersonStanding from lucide-react
 * with dynamic color based on body temperature (blue=cold, yellow=neutral, red=hot).
 * Used in HUD to provide visual feedback about body temperature state.
 */

import React from 'react';
import { PersonStanding } from 'lucide-react';
import { getTempColor } from './hud-icon-temperature';
import { cn } from '@/lib/utils';

interface BodyTemperatureIconProps {
  /** Current body temperature in Celsius */
  temp: number;
  /** Maximum temperature for gauge scale (default: 40°C for body temp) */
  maxTemp?: number;
  /** Icon size in pixels */
  size?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * BodyTemperatureIcon component
 * Renders a colored PersonStanding icon that changes color based on body temperature.
 * Color transitions smoothly (0.3s) from blue (cold) → yellow (neutral) → red (hot).
 *
 * @example
 * <BodyTemperatureIcon temp={38.5} maxTemp={40} size={40} />
 */
export function BodyTemperatureIcon({
  temp,
  maxTemp = 40,
  size = 32,
  className,
}: BodyTemperatureIconProps) {
  const tempColor = getTempColor(temp, maxTemp);

  return (
    <div
      className={cn(
        'flex items-center justify-center flex-shrink-0 transition-colors duration-300',
        className
      )}
      style={{
        width: size,
        height: size,
        color: tempColor,
      }}
      title={`Body Temperature: ${temp.toFixed(1)}°C`}
    >
      <PersonStanding
        size={size}
        strokeWidth={1.5}
        style={{
          transition: 'color 0.3s ease-out',
        }}
      />
    </div>
  );
}

export default BodyTemperatureIcon;
