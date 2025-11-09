import React, { useEffect, useMemo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Props for AnimatedIcon
 */
export interface AnimatedIconProps {
  /**
   * The icon to render. Can be:
   * - string (emoji)
   * - React node (inline SVG component or element)
   * - image object: { type: 'image', url: string }
   */
  icon: React.ReactNode | string | { type: 'image'; url: string };
  /** Size in pixels (width and height). Defaults to 24 */
  size?: number;
  /** CSS color string to apply to emoji / inline SVGs. Images are not tinted. */
  color?: string;
  /** Animation to apply */
  animation?: 'none' | 'pulse' | 'spin' | 'wave' | 'shake';
  /** Duration in seconds for the animation (where applicable) */
  duration?: number;
  className?: string;
}

/**
 * AnimatedIcon
 *
 * A lightweight wrapper that allows emoji and inline SVG icons to be colored
 * and animated with a few simple presets. Image icons (type: 'image') will
 * receive animation classes but not color tinting (browsers require more
 * advanced techniques for reliable image tinting).
 *
 * This component injects the minimal keyframes it needs on the client only.
 */
export function AnimatedIcon({
  icon,
  size = 24,
  color,
  animation = 'none',
  duration = 1.2,
  className,
}: AnimatedIconProps) {
  // Inject CSS keyframes once on the client
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const id = 'animated-icon-styles';
    if (document.getElementById(id)) return;

    const style = document.createElement('style');
    style.id = id;
    style.innerHTML = `
    @keyframes aicon-pulse { 0% { transform: scale(1) } 50% { transform: scale(1.08) } 100% { transform: scale(1) } }
    @keyframes aicon-spin { 0% { transform: rotate(0deg) } 100% { transform: rotate(360deg) } }
    @keyframes aicon-wave { 0% { transform: translateY(0px) } 50% { transform: translateY(-3px) } 100% { transform: translateY(0px) } }
    @keyframes aicon-shake { 0% { transform: translateX(0) } 25% { transform: translateX(-2px) } 50% { transform: translateX(2px) } 75% { transform: translateX(-2px) } 100% { transform: translateX(0) } }

    .aicon { display: inline-flex; align-items: center; justify-content: center; overflow: visible }
    .aicon svg { width: 100%; height: 100%; display: block }
    .aicon svg path, .aicon svg circle, .aicon svg rect, .aicon svg g { fill: currentColor; stroke: currentColor }
    .aicon--pulse { animation-name: aicon-pulse; animation-iteration-count: infinite; animation-timing-function: ease-in-out }
    .aicon--spin { animation-name: aicon-spin; animation-iteration-count: infinite; animation-timing-function: linear }
    .aicon--wave { animation-name: aicon-wave; animation-iteration-count: infinite; animation-timing-function: ease-in-out }
    .aicon--shake { animation-name: aicon-shake; animation-iteration-count: infinite; animation-timing-function: ease-in-out }
    `;
    document.head.appendChild(style);
  }, []);

  const animClass = useMemo(() => {
    switch (animation) {
      case 'pulse':
        return 'aicon--pulse';
      case 'spin':
        return 'aicon--spin';
      case 'wave':
        return 'aicon--wave';
      case 'shake':
        return 'aicon--shake';
      default:
        return '';
    }
  }, [animation]);

  const style: React.CSSProperties = {
    width: size,
    height: size,
    fontSize: size,
    color: color,
    // allow animation speed control
    animationDuration: `${duration}s`,
  };

  // Image object case
  if (typeof icon === 'object' && (icon as any).type === 'image') {
    const img = icon as { type: 'image'; url: string };
    return (
      <span className={cn('aicon', animClass, className)} style={style} aria-hidden>
        <Image src={img.url} alt="" width={size} height={size} style={{ width: size, height: size }} />
      </span>
    );
  }

  // String (emoji) case
  if (typeof icon === 'string') {
    return (
      <span
        className={cn('aicon', animClass, className)}
        style={style}
        role="img"
        aria-label={icon}
      >
        {icon}
      </span>
    );
  }

  // ReactNode / inline SVG case
  return (
    <span className={cn('aicon', animClass, className)} style={style} aria-hidden>
      {icon as React.ReactNode}
    </span>
  );
}

export default AnimatedIcon;
