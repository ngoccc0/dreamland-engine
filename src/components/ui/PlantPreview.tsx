import React from 'react';
import type { CreatureDefinition } from '@/core/types/definitions/creature';

type Props = {
  plant?: CreatureDefinition | null;
  visible?: boolean;
  x?: number;
  y?: number;
};

/**
 * Simple visual preview for planting a seed. This renders a small ghosted
 * badge with the plant emoji and name. The component is intentionally minimal
 * so it can be integrated into tile renderers or overlays.
 */
export default function PlantPreview({ plant, visible = false, x, y }: Props) {
  if (!visible || !plant) return null;

  const style: React.CSSProperties = {
    position: 'absolute',
    pointerEvents: 'none',
    transform: 'translate(-50%, -50%)',
    left: x ?? '50%',
    top: y ?? '50%',
    background: 'rgba(255,255,255,0.06)',
    padding: '6px 8px',
    borderRadius: 6,
    border: '1px dashed rgba(255,255,255,0.12)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backdropFilter: 'blur(2px)'
  };

  return (
    <div aria-hidden={!visible} role="img" aria-label={`Preview ${plant.id}`} style={style}>
      <span style={{ fontSize: 20 }}>{plant.emoji ?? '🌱'}</span>
      <span style={{ fontSize: 13 }}>{(plant.name as any)?.en ?? (plant.name as any) ?? plant.id}</span>
    </div>
  );
}
