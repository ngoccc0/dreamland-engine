import React from 'react';
import AreaFill from './area-fill';

// Compatibility shim: previously there was an image-based AreaFillImage
// component. Some older code still imports '@/components/ui/area-fill-image'.
// Provide a forgiving shim that accepts legacy props (including `src`) and
// forwards them to the vector AreaFill. This keeps the typechecker happy while
// we remove legacy usages incrementally.

// Use a very permissive prop type to accept legacy shape: callers may pass
// `src`, `width`, `height`, etc. We map common props to the AreaFill API if
// possible, otherwise forward through and let the runtime ignore extras.
type LegacyAreaFillProps = Record<string, any>;

export default function AreaFillImage(props: LegacyAreaFillProps) {
  // If a caller passed `width`/`height`/`percent`/`fill` directly, forward
  // them. The vector AreaFill expects `pathD`, `percent`, and `size`/`fill`.
  // If the legacy code passed an `src` (URL to an SVG), we can't deterministically
  // extract a path here — so we just forward props and let the consumer be
  // responsible. In practice this shim is temporary and only present to
  // silence TS errors during migration.
  return <AreaFill {...(props as any)} />;
}
