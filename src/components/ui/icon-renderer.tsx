import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface IconRendererProps {
  icon: string | { type: 'image'; url: string };
  /** If omitted, size will be driven by CSS (e.g. minimap cell rules) */
  size?: number;
  alt?: string;
  className?: string;
}

/**
 * IconRenderer component that handles both emoji strings and image objects
 * for item icons in the game UI.
 *
 * Supports two formats:
 * - String: Direct emoji character (e.g., '🍎')
 * - Object: Image object with type and url (e.g., { type: 'image', url: '/assets/items/apple.png' })
 */
export function IconRenderer({ icon, size, alt = '', className }: IconRendererProps) {
  // Handle image object format
  if (typeof icon === 'object' && icon.type === 'image') {
    return (
      <Image
        src={icon.url}
        alt={alt}
        width={size ?? undefined}
        height={size ?? undefined}
        className={cn(size ? 'object-contain flex-shrink-0' : 'w-full h-full object-contain', className)}
        style={size ? { width: size, height: size } : undefined}
      />
    );
  }

  // Handle string emoji format
  if (typeof icon === 'string') {
    const style = size ? { fontSize: size, width: size, height: size } : undefined;
    const classes = size ? 'flex items-center justify-center flex-shrink-0' : 'w-full h-full flex items-center justify-center';
    return (
      <span
        className={cn(classes, className)}
        style={style}
        role="img"
        aria-label={alt}
      >
        {icon}
      </span>
    );
  }

  // Fallback for invalid icon format
  return (
    <span
      className={cn('flex items-center justify-center bg-muted rounded flex-shrink-0', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={alt || 'Unknown icon'}
    >
      ❓
    </span>
  );
}
