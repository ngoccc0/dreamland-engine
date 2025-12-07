"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { BACKGROUND_MUSIC, MENU_MUSIC, SFX, MOOD_TRACK_MAP } from './assets';
import { getTimeOfDay } from '@/lib/game/time/time-utils';
import type { AudioActionType, AudioEventContext } from '@/lib/definitions/audio-events';
import { emitAudioEvent } from '@/core/usecases/emit-audio-event';
import { selectAmbienceLayers, buildAmbienceContext, type AmbienceContext, type AmbienceLayer } from './ambience-engine';
import type { MoodTag } from '@/core/types/game';

// Prefer static serving from `public/asset/sound` so browsers can fetch files directly.
// We copy the repository `asset/sound` into `public/asset/sound` during setup.
const AUDIO_BASE = '/asset/sound';

// Default game time constants (can be overridden)
const DEFAULT_START_TIME = 360; // 6 AM
const DEFAULT_DAY_DURATION = 1440; // 24 hours in minutes

type AudioContextType = {
  playMusic: (track?: string) => void;
  playMenuMusic: () => void;
  /**
   * Play menu music based on real-time game hour.
   * Selects different tracks for morning/afternoon/evening/night.
   * @param gameTime Current game time in minutes
   * @param dayDuration Total day duration in minutes (default: 1440)
   */
  playMenuMusicForTime: (gameTime: number, dayDuration?: number) => void;
  // play ambience track based on biome name (e.g. 'cave' -> Ambience_Cave_00.mp3)
  playAmbienceForBiome: (biome?: string | null) => void;
  /**
   * Play multi-layer ambience based on biome, mood, time, and weather.
   * Dynamically selects and layers appropriate ambience tracks.
   * @param context Ambience context (biome, mood, timeOfDay, weather)
   * @param maxLayers Maximum number of layers to play (default: 2)
   */
  playAmbienceLayers: (context: AmbienceContext, maxLayers?: number) => void;
  playBackgroundForMoods: (moods: string[] | undefined) => void;
  // whether autoplay was blocked by the browser when attempting menu autoplay
  autoplayBlocked: boolean;
  // try to enable autoplay (attempt to play menu music again) returning immediately
  tryEnableAutoplay: () => void;
  // playbackMode: 'off' | 'occasional' | 'always'
  playbackMode: 'off' | 'occasional' | 'always';
  setPlaybackMode: (m: 'off' | 'occasional' | 'always') => void;
  playbackIntervalMinutes: number;
  setPlaybackIntervalMinutes: (n: number) => void;
  stopMusic: () => void;
  pauseMusic: () => void;
  playSfx: (name: string) => void;
  /** Play SFX for a specific game action (e.g., PLAYER_MOVE, ENEMY_HIT). Applies playback mode filtering. */
  playSfxForAction: (actionType: AudioActionType, context?: AudioEventContext) => void;
  /** Emit audio event with full event payload (for testing/logging purposes). */
  emitAudioEventDirect: (actionType: AudioActionType, context?: AudioEventContext) => void;
  musicVolume: number;
  sfxVolume: number;
  ambienceVolume: number;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setAmbienceVolume: (v: number) => void;
  muted: boolean;
  setMuted: (m: boolean) => void;
  currentTrack?: string;
};

const AudioContext = createContext<AudioContextType | null>(null);

function buildPath(...parts: string[]) {
  // join and encode components so filenames with spaces work in URLs
  return parts.map(p => encodeURI(p)).join('/');
}

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const musicRef = useRef<HTMLAudioElement | null>(null);
  // Ambience layer players (for multi-layer soundscape)
  const ambienceLayersRef = useRef<HTMLAudioElement[]>([]);
  // Track current biome to avoid restarting ambience when biome doesn't change
  const currentBiomeRef = useRef<string | null>(null);
  // Track active fade intervals to clear old ones when new transition starts
  const fadeIntervalsRef = useRef<NodeJS.Timeout[]>([]);

  const [musicVolume, setMusicVolumeState] = useState<number>(() => {
    try { return Number(localStorage.getItem('dl_music_volume') ?? 0.6); } catch { return 0.6; }
  });
  const [sfxVolume, setSfxVolumeState] = useState<number>(() => {
    try { return Number(localStorage.getItem('dl_sfx_volume') ?? 0.9); } catch { return 0.9; }
  });
  const [ambienceVolume, setAmbienceVolumeState] = useState<number>(() => {
    try { return Number(localStorage.getItem('dl_ambience_volume') ?? 0.7); } catch { return 0.7; }
  });
  const [muted, setMutedState] = useState<boolean>(() => {
    try { return localStorage.getItem('dl_muted') === '1'; } catch { return false; }
  });
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(() => {
    try { return localStorage.getItem('dl_auto_menu') === '0'; } catch { return false; }
  });
  const [currentTrack, setCurrentTrack] = useState<string | undefined>(undefined);
  const [playbackMode, setPlaybackModeState] = useState<'off' | 'occasional' | 'always'>(() => {
    try { return (localStorage.getItem('dl_playback_mode') as any) ?? 'off'; } catch { return 'off'; }
  });
  const [playbackIntervalMinutes, setPlaybackIntervalMinutesState] = useState<number>(() => {
    try { return Number(localStorage.getItem('dl_playback_interval_minutes') ?? 3); } catch { return 3; }
  });

  // timers for occasional/always modes
  const occasionalTimerRef = useRef<number | null>(null);
  const nextTrackTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    try { localStorage.setItem('dl_music_volume', String(musicVolume)); } catch { }
    if (musicRef.current) musicRef.current.volume = muted ? 0 : musicVolume;
  }, [musicVolume, muted]);

  useEffect(() => { try { localStorage.setItem('dl_sfx_volume', String(sfxVolume)); } catch { } }, [sfxVolume]);
  
  useEffect(() => { 
    try { localStorage.setItem('dl_ambience_volume', String(ambienceVolume)); } catch { }
    // Update volume for all currently playing ambience layers
    ambienceLayersRef.current.forEach(audio => {
      if (audio) audio.volume = muted ? 0 : ambienceVolume * (audio.dataset.layerVolume ? Number(audio.dataset.layerVolume) : 1);
    });
  }, [ambienceVolume, muted]);

  useEffect(() => {
    try { localStorage.setItem('dl_playback_interval_minutes', String(playbackIntervalMinutes)); } catch { }
  }, [playbackIntervalMinutes]);

  useEffect(() => {
    try { localStorage.setItem('dl_playback_mode', playbackMode); } catch { }
  }, [playbackMode]);
  useEffect(() => { try { localStorage.setItem('dl_muted', muted ? '1' : '0'); } catch { } }, [muted]);
  useEffect(() => { try { localStorage.setItem('dl_playback_mode', playbackMode); } catch { } }, [playbackMode]);
  useEffect(() => { try { localStorage.setItem('dl_playback_interval_minutes', String(playbackIntervalMinutes)); } catch { } }, [playbackIntervalMinutes]);

  const playMusic = useCallback((track?: string) => {
    const list = [...BACKGROUND_MUSIC, ...MENU_MUSIC];
    const chosen = track ?? list[0];
    if (!chosen) return;

    // Handle both old format (filename only) and new format (folder/filename)
    let folder = 'background_music';
    let filename = chosen;

    if (chosen.includes('/')) {
      const parts = chosen.split('/');
      folder = parts[0];
      filename = parts[1];
    } else {
      // Legacy format - determine folder from MENU_MUSIC
      const isMenu = MENU_MUSIC.includes(chosen);
      folder = isMenu ? 'menu_music' : 'background_music';
    }

    const full = buildPath(AUDIO_BASE, folder, filename);
    // stop and cleanup previous audio
    if (musicRef.current) {
      try { musicRef.current.pause(); } catch { }
      try { musicRef.current.src = ''; } catch { }
      musicRef.current = null;
    }

    const audio = new Audio(full);
    audio.volume = muted ? 0 : musicVolume;
    audio.preload = 'auto';

    // Determine if this is ambience/menu so we can decide looping behavior.
    const chosenLower = String(chosen).toLowerCase();
    const isAmbience = /ambience[_\-\s]?/.test(chosenLower) || chosenLower.startsWith('ambience');
    const isMenuFolder = folder === 'menu_music';

    // playback mode affects looping/next-track behavior for non-ambience background music
    if (isMenuFolder) {
      // Menu tracks should loop continuously
      audio.loop = true;
      audio.onended = null;
    } else if (isAmbience) {
      // Ambience tracks should loop continuously
      audio.loop = true;
      audio.onended = null;
    } else if (playbackMode === 'always') {
      // when the track ends, schedule next after 5s
      audio.loop = false;
      audio.onended = () => {
        try {
          nextTrackTimeoutRef.current = window.setTimeout(() => {
            // pick next background music (rotate through list)
            const available = BACKGROUND_MUSIC.length ? BACKGROUND_MUSIC : [chosen];
            const idx = available.indexOf(chosen);
            const next = available[(idx + 1) % available.length] ?? available[0];
            playMusic(next);
          }, 5000);
        } catch { }
      };
    } else {
      // for 'off' and 'occasional', keep music looping when played directly
      audio.loop = true;
      audio.onended = null;
    }

    // Play and ignore rejection here; autoplay detection handled elsewhere.
    audio.play().catch(() => { });
    musicRef.current = audio;
    setCurrentTrack(chosen);
  }, [musicVolume, muted]);

  const playMenuMusic = useCallback(() => {
    if (MENU_MUSIC.length === 0) return;
    playMusic(MENU_MUSIC[0]);
  }, [playMusic]);

  /**
   * Determine menu music based on game time of day.
   * Different music for morning, afternoon, evening, night for immersion.
   * Falls back to default menu music if no time-specific tracks available.
   *
   * @param gameTime Current game time in minutes (0-dayDuration)
   * @param dayDuration Total day duration in minutes (default: 1440 = 24 hours)
   */
  const getMenuMusicForTime = useCallback((gameTime: number, dayDuration: number = DEFAULT_DAY_DURATION): string => {
    // Calculate current hour (0-23)
    const currentMinutes = gameTime % dayDuration;
    const currentHour = Math.floor(currentMinutes / 60);

    // Determine time period: morning (6-12), afternoon (12-18), evening (18-24/0-6)
    let timePeriod: 'morning' | 'afternoon' | 'evening' | 'night';
    if (currentHour >= 6 && currentHour < 12) timePeriod = 'morning';
    else if (currentHour >= 12 && currentHour < 18) timePeriod = 'afternoon';
    else if (currentHour >= 18 && currentHour < 24) timePeriod = 'evening';
    else timePeriod = 'night'; // 0-6 AM

    // Try to find menu music that matches the time period
    for (const track of MENU_MUSIC) {
      const lowerTrack = String(track).toLowerCase();
      if (lowerTrack.includes(timePeriod)) {
        return track;
      }
    }

    // Fallback to first menu music if no time-specific track found
    return MENU_MUSIC[0] ?? '8bit Bossa.mp3';
  }, []);

  /**
   * Play menu music selected based on current game time.
   * Time-aware music selection creates dynamic menu atmosphere.
   *
   * @param gameTime Current game time in minutes
   * @param dayDuration Total day duration in minutes (default: 1440)
   */
  const playMenuMusicForTime = useCallback((gameTime: number, dayDuration: number = DEFAULT_DAY_DURATION) => {
    const track = getMenuMusicForTime(gameTime, dayDuration);
    playMusic(track);
  }, [getMenuMusicForTime, playMusic]);

  const playAmbienceForBiome = useCallback((biome?: string | null) => {
    if (!biome) return;
    const b = String(biome).toLowerCase();
    // try to find a background music that matches the biome name or contains 'ambience' + biome
    const candidate = BACKGROUND_MUSIC.find(fn => fn.toLowerCase().includes(b) || fn.toLowerCase().includes(`ambience_${b}`) || fn.toLowerCase().includes(`ambience ${b}`));
    if (candidate) playMusic(candidate);
  }, [playMusic]);

  /**
   * Play multi-layer ambience based on biome, mood, time, and weather.
   * Creates dynamic soundscape by layering complementary ambience tracks.
   * Implements crossfading: when biome changes, old tracks fade out while new tracks fade in simultaneously.
   * When biome stays the same, ambience continues uninterrupted (seamless).
   * 
   * Example: Forest biome + sunny day + peaceful mood → bird sounds + nature ambience
   * Example: Cave + night + dangerous mood → dark cave ambience + eerie sounds
   *
   * @param context Ambience selection context (biome, mood, timeOfDay, weather)
   * @param maxLayers Maximum number of layers to play simultaneously (default: 2)
   */
  const playAmbienceLayers = useCallback((context: AmbienceContext, maxLayers: number = 2) => {
    // Check if biome has actually changed - if not, don't restart ambience
    const newBiome = context.biome || null;
    if (newBiome === currentBiomeRef.current && ambienceLayersRef.current.length > 0) {
      // Same biome, same ambience still playing - no need to restart
      try { console.debug('[AudioProvider] Same biome, continuing seamless ambience'); } catch { }
      return;
    }

    // Biome changed - start crossfade transition
    currentBiomeRef.current = newBiome;

    // Select new ambience layers
    const newLayers = selectAmbienceLayers(context, maxLayers);
    if (newLayers.length === 0) {
      // No layers for new context, fade out old ones
      ambienceLayersRef.current.forEach(audio => {
        fadeOutAudio(audio, 2500); // fade out old tracks
      });
      ambienceLayersRef.current = [];
      return;
    }

    // Fade out old ambience layers while new ones fade in (crossfade)
    const oldLayers = [...ambienceLayersRef.current];
    ambienceLayersRef.current = [];

    // Start fade-out of old tracks
    oldLayers.forEach(audio => {
      if (audio && audio.volume > 0) {
        fadeOutAudio(audio, 2500);
      }
    });

    // Play new ambience layers with fade-in
    newLayers.forEach((layer, idx) => {
      try {
        const fullPath = `/asset/sound/ambience/${layer.track}`;
        const audio = new Audio(fullPath);
        audio.volume = (muted ? 0 : ambienceVolume) * layer.volume;
        audio.preload = 'auto';
        audio.loop = true; // Ambience always loops
        // Store layer volume ratio for dynamic updates when master volume changes
        (audio as any).dataset.layerVolume = layer.volume;

        // Fade in new track
        if (layer.fadeInMs && layer.fadeInMs > 0) {
          audio.volume = 0;
          audio.play().catch(() => { });
          const startTime = Date.now();
          const fadeInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / layer.fadeInMs!, 1);
            audio.volume = (muted ? 0 : ambienceVolume) * layer.volume * progress;
            if (progress === 1) clearInterval(fadeInterval);
          }, 30);
          fadeIntervalsRef.current.push(fadeInterval);
        } else {
          audio.play().catch(() => { });
        }

        ambienceLayersRef.current.push(audio);
      } catch (e) {
        console.error('[AudioProvider] Failed to play ambience layer:', layer.track, e);
      }
    });
  }, [musicVolume, ambienceVolume, muted]);

  /**
   * Helper function to fade out an audio element and stop it when done.
   */
  const fadeOutAudio = useCallback((audio: HTMLAudioElement, durationMs: number = 2500) => {
    if (!audio || audio.volume === 0) {
      try { audio?.pause(); } catch { }
      try { audio && (audio.src = ''); } catch { }
      return;
    }

    const startVolume = audio.volume;
    const startTime = Date.now();
    const fadeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      audio.volume = startVolume * (1 - progress);

      if (progress === 1) {
        clearInterval(fadeInterval);
        try { audio.pause(); } catch { }
        try { audio.src = ''; } catch { }
      }
    }, 30);

    fadeIntervalsRef.current.push(fadeInterval);
  }, []);

  const playBackgroundForMoods = useCallback((moods: string[] | undefined) => {
    if (!moods || moods.length === 0) return;
    for (const m of moods) {
      const candidates = MOOD_TRACK_MAP[m];
      if (!candidates) continue;
      for (const c of candidates) {
        if (BACKGROUND_MUSIC.includes(c) || MENU_MUSIC.includes(c)) {
          playMusic(c);
          return;
        }
      }
    }
    if (BACKGROUND_MUSIC.length) playMusic(BACKGROUND_MUSIC[0]);
  }, [playMusic]);

  // manage occasional mode timer
  useEffect(() => {
    // clear any existing timers
    if (occasionalTimerRef.current) { clearInterval(occasionalTimerRef.current); occasionalTimerRef.current = null; }
    if (nextTrackTimeoutRef.current) { clearTimeout(nextTrackTimeoutRef.current); nextTrackTimeoutRef.current = null; }

    if (playbackMode === 'occasional') {
      // schedule occasional play every playbackIntervalMinutes minutes
      const ms = Math.max(1, playbackIntervalMinutes) * 60 * 1000;
      try {
        // Play immediately on mode change, then schedule future plays
        if (BACKGROUND_MUSIC.length > 0) {
          const idx = Math.floor(Math.random() * BACKGROUND_MUSIC.length);
          playMusic(BACKGROUND_MUSIC[idx]);
        }
        // Schedule next plays at intervals
        occasionalTimerRef.current = window.setInterval(() => {
          if (BACKGROUND_MUSIC.length === 0) return;
          // Select random track (don't skip, play every interval)
          const idx = Math.floor(Math.random() * BACKGROUND_MUSIC.length);
          playMusic(BACKGROUND_MUSIC[idx]);
        }, ms);
      } catch { }
    }

    return () => {
      if (occasionalTimerRef.current) { clearInterval(occasionalTimerRef.current); occasionalTimerRef.current = null; }
      if (nextTrackTimeoutRef.current) { clearTimeout(nextTrackTimeoutRef.current); nextTrackTimeoutRef.current = null; }
    };
  }, [playbackMode, playbackIntervalMinutes, playMusic]);

  const stopMusic = useCallback(() => {
    if (musicRef.current) {
      try { musicRef.current.pause(); } catch { }
      musicRef.current = null;
      setCurrentTrack(undefined);
    }
  }, []);

  const pauseMusic = useCallback(() => {
    if (musicRef.current) {
      try { musicRef.current.pause(); } catch { }
    }
  }, []);

  const playSfx = useCallback((name: string) => {
    // prefer exact filename, but allow base name lookup
    let file = name;
    if (!file.includes('.mp3') && SFX.includes(name + '.mp3')) file = name + '.mp3';
    if (!file) return;
    const full = buildPath(AUDIO_BASE, 'sfx', file);
    const a = new Audio(full);
    a.volume = muted ? 0 : sfxVolume;
    a.preload = 'auto';
    // allow overlapping sfx by not reusing element
    a.play().catch(() => { });
  }, [sfxVolume, muted]);

  /**
   * Play sound effect for a specific game action.
   * Automatically resolves SFX file(s) from audio-events registry and applies playback mode filtering.
   * 
   * @param actionType - The action type (e.g., PLAYER_MOVE, ENEMY_HIT)
   * @param context - Optional context for SFX resolution (e.g., biome for footsteps, rarity for pickups)
   */
  const playSfxForAction = useCallback((actionType: AudioActionType, context?: AudioEventContext) => {
    const payload = emitAudioEvent(actionType, context || {}, playbackMode);
    if (!payload) return; // filtered by playback mode

    // Randomly select one SFX file from the array
    const sfxFile = payload.sfxFiles[Math.floor(Math.random() * payload.sfxFiles.length)];
    if (sfxFile) {
      playSfx(sfxFile);
    }
  }, [playbackMode, playSfx]);

  /**
   * Direct audio event emission (mainly for testing/debugging).
   * Returns the resolved audio event payload before playback.
   * 
   * @param actionType - The action type
   * @param context - Optional context for SFX resolution
   */
  const emitAudioEventDirect = useCallback((actionType: AudioActionType, context?: AudioEventContext) => {
    const payload = emitAudioEvent(actionType, context || {}, playbackMode);
    if (payload) {
      const sfxFile = payload.sfxFiles[Math.floor(Math.random() * payload.sfxFiles.length)];
      if (sfxFile) {
        playSfx(sfxFile);
      }
    }
  }, [playbackMode, playSfx]);

  const setMusicVolume = useCallback((v: number) => setMusicVolumeState(Math.max(0, Math.min(1, v))), []);
  const setSfxVolume = useCallback((v: number) => setSfxVolumeState(Math.max(0, Math.min(1, v))), []);
  const setAmbienceVolume = useCallback((v: number) => setAmbienceVolumeState(Math.max(0, Math.min(1, v))), []);
  const setMuted = useCallback((m: boolean) => setMutedState(m), []);
  const setPlaybackMode = useCallback((m: 'off' | 'occasional' | 'always') => setPlaybackModeState(m), []);
  const setPlaybackIntervalMinutes = useCallback((n: number) => setPlaybackIntervalMinutesState(Math.max(1, Math.floor(n))), []);

  // optional: preload a few small sfx to reduce initial latency
  useEffect(() => {
    try {
      const preload = SFX.slice(0, 6).map(name => {
        const p = buildPath(AUDIO_BASE, 'sfx', name);
        const a = new Audio(p);
        a.preload = 'auto';
        return a;
      });
      // keep them briefly in memory
      const t = setTimeout(() => { preload.forEach(p => { try { p.src = ''; } catch { } }); }, 5000);
      return () => { clearTimeout(t); preload.forEach(p => { try { p.src = ''; } catch { } }); };
    } catch { /* ignore */ }
  }, []);

  // Attempt to autoplay menu music on first client mount.
  useEffect(() => {
    try {
      // Respect user autoplay setting and mute flag
      const autoplayEnabled = localStorage.getItem('dl_auto_menu') !== '0';
      if (!autoplayEnabled || muted) return;
      // try to play menu music; browsers may block autoplay until a user gesture.
      if (!MENU_MUSIC.length) return;
      try {
        const temp = new Audio(buildPath(AUDIO_BASE, 'menu_music', MENU_MUSIC[0]));
        temp.preload = 'auto';
        temp.volume = muted ? 0 : musicVolume;
        temp.loop = true;
        temp.play().then(() => {
          // autoplay allowed: play via provider to keep state consistent
          playMenuMusic();
          try { temp.src = ''; } catch { }
        }).catch(() => {
          // autoplay blocked: persist opt-out so we don't keep retrying
          setAutoplayBlocked(true);
          try { localStorage.setItem('dl_auto_menu', '0'); } catch { }
          try { temp.src = ''; } catch { }
        });
      } catch {
        // ignore
      }
    } catch {
      // ignore
    }
  }, [playMenuMusic, muted]);

  const tryEnableAutoplay = useCallback(() => {
    // attempt to play menu music and clear blocked flag on success
    setAutoplayBlocked(false);
    if (!MENU_MUSIC.length) return;
    try {
      const temp = new Audio(buildPath(AUDIO_BASE, 'menu_music', MENU_MUSIC[0]));
      temp.preload = 'auto';
      temp.volume = muted ? 0 : musicVolume;
      temp.loop = true;
      temp.play().then(() => {
        try { localStorage.setItem('dl_auto_menu', '1'); } catch { }
        playMenuMusic();
        try { temp.src = ''; } catch { }
      }).catch(() => {
        setAutoplayBlocked(true);
        try { temp.src = ''; } catch { }
      });
    } catch {
      setAutoplayBlocked(true);
    }
  }, [musicVolume, muted, playMenuMusic]);

  // Cleanup all fade intervals and audio resources on unmount
  useEffect(() => {
    return () => {
      // Clear all active fade intervals
      fadeIntervalsRef.current.forEach(interval => clearInterval(interval));
      fadeIntervalsRef.current = [];

      // Stop all ambience layers
      ambienceLayersRef.current.forEach(audio => {
        try { audio.pause(); } catch { }
        try { audio.src = ''; } catch { }
      });
      ambienceLayersRef.current = [];

      // Stop music
      if (musicRef.current) {
        try { musicRef.current.pause(); } catch { }
        try { musicRef.current.src = ''; } catch { }
      }
    };
  }, []);

  const api: AudioContextType = {
    playMusic,
    playMenuMusic,
    playMenuMusicForTime,
    playAmbienceForBiome,
    playAmbienceLayers,
    playBackgroundForMoods,
    autoplayBlocked,
    tryEnableAutoplay,
    playbackMode,
    setPlaybackMode,
    playbackIntervalMinutes,
    setPlaybackIntervalMinutes,
    stopMusic,
    pauseMusic,
    playSfx,
    playSfxForAction,
    emitAudioEventDirect,
    musicVolume,
    sfxVolume,
    ambienceVolume,
    setMusicVolume,
    setSfxVolume,
    setAmbienceVolume,
    muted,
    setMuted,
    currentTrack,
  };

  return <AudioContext.Provider value={api}>{children}</AudioContext.Provider>;
};

export function useAudioContext() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudioContext must be used inside AudioProvider');
  return ctx;
}
