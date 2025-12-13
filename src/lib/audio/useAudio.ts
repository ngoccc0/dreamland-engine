import { useMemo } from 'react';
import { useAudioContext } from './AudioProvider';

/**
 * Audio system hook - provides access to music, SFX, and ambience controls.
 *
 * @remarks
 * Wraps AudioProvider context to expose all audio playback controls.
 * Provides imperative API for playing music, SFX, ambience, and managing
 * volume/mute states. Memoized to prevent unnecessary re-renders.
 *
 * **Audio Types:**
 * - Music: Background tracks (play one at a time)
 * - SFX: Sound effects (concurrent, action-triggered)
 * - Ambience: Biome background layers (e.g., forest rain, ocean waves)
 *
 * **Playback Modes:**
 * - continuous: Loop music indefinitely
 * - interval: Play music for X minutes, pause, repeat
 * - disabled: No auto-play (user control only)
 *
 * **Autoplay Handling:**
 * Modern browsers require user interaction before playing audio.
 * Hook provides `tryEnableAutoplay()` to request permission.
 *
 * @returns Audio API object with methods for playback control
 *
 * @example
 * const audio = useAudio();
 * 
 * // Play biome ambience
 * audio.playAmbienceForBiome('forest', { enableLayers: true });
 * 
 * // Play action sound effect
 * audio.playSfxForAction('UI_BUTTON_CLICK');
 * 
 * // Control volume
 * audio.setMusicVolume(0.8);
 */
export function useAudio() {
  const ctx = useAudioContext();
  return useMemo(() => ({
    playMusic: ctx.playMusic,
    playMenuMusic: ctx.playMenuMusic,
    playMenuMusicForTime: ctx.playMenuMusicForTime,
    playAmbienceForBiome: ctx.playAmbienceForBiome,
    playAmbienceLayers: ctx.playAmbienceLayers,
    playBackgroundForMoods: ctx.playBackgroundForMoods,
    autoplayBlocked: ctx.autoplayBlocked,
    tryEnableAutoplay: ctx.tryEnableAutoplay,
    playbackMode: ctx.playbackMode,
    setPlaybackMode: ctx.setPlaybackMode,
    playbackIntervalMinutes: ctx.playbackIntervalMinutes,
    setPlaybackIntervalMinutes: ctx.setPlaybackIntervalMinutes,
    stopMusic: ctx.stopMusic,
    pauseMusic: ctx.pauseMusic,
    playSfx: ctx.playSfx,
    playSfxForAction: ctx.playSfxForAction,
    emitAudioEventDirect: ctx.emitAudioEventDirect,
    setMusicVolume: ctx.setMusicVolume,
    setSfxVolume: ctx.setSfxVolume,
    setAmbienceVolume: ctx.setAmbienceVolume,
    musicVolume: ctx.musicVolume,
    sfxVolume: ctx.sfxVolume,
    ambienceVolume: ctx.ambienceVolume,
    muted: ctx.muted,
    setMuted: ctx.setMuted,
    currentTrack: ctx.currentTrack,
  }), [ctx]);
}
