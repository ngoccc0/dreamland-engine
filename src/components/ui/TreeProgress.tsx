import React from 'react';
import ProgressBar from '@/components/ui/ProgressBar';

type Props = {
  value: number;
  max?: number;
  size?: 'small' | 'medium' | 'large';
  className?: string;
};

function sizeToHeight(size: Props['size']) {
  switch (size) {
    case 'small':
      return 22;
    case 'large':
      return 40;
    default:
      return 30;
  }
}

/**
 * Small convenience wrapper for tree growth progress. Uses the generic
 * ProgressBar but provides a sensible label and default sizing.
 */
export default function TreeProgress({ value, max = 100, size = 'medium', className }: Props) {
  const height = sizeToHeight(size);
  return (
    <div className={className}>
      <ProgressBar value={value} max={max} height={height} label="Growth" ariaLabel="Tree growth" />
    </div>
  );
}
