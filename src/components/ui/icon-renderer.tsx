import React from 'react';
import { Icon } from '@/lib/game/types';

interface IconRendererProps {
  icon: Icon;
  size?: number;
  alt?: string;
  className?: string;
}

export const IconRenderer: React.FC<IconRendererProps> = ({
  icon,
  size = 20,
  alt = '',
  className = ''
}) => {
  if (!icon) return null;

  if (typeof icon === 'string') {
    // Render emoji
    return (
      <span
        className={`inline-block ${className}`}
        style={{ fontSize: `${size}px` }}
        role="img"
        aria-label={alt}
      >
        {icon}
      </span>
    );
  } else if (icon.type === 'image') {
    // Render image
    return (
      <img
        src={icon.url}
        alt={alt}
        className={`inline-block ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    );
  }

  return null;
};
