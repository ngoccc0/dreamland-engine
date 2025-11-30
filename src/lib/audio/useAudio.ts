import { useMemo } from 'react';
import { useAudioContext } from './AudioProvider';

export function useAudio() {
  const ctx = useAudioContext();
  return useMemo(() => ({
    playMusic: ctx.playMusic,
    playMenuMusic: ctx.playMenuMusic,
    playAmbienceForBiome: ctx.playAmbienceForBiome,
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
    musicVolume: ctx.musicVolume,
    sfxVolume: ctx.sfxVolume,
    muted: ctx.muted,
    setMuted: ctx.setMuted,
    currentTrack: ctx.currentTrack,
  }), [ctx]);
}
