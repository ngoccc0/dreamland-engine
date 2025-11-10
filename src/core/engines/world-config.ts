// Compatibility shim: re-export worldConfig/seasonConfig from the library location
// so engine-relative imports like `../world-config` continue to work.
export { worldConfig, seasonConfig } from '@/lib/game/world-config';
