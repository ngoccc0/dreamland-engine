"use client";

import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {BACKGROUND_MUSIC, MENU_MUSIC, SFX, MOOD_TRACK_MAP} from './assets';

// Prefer static serving from `public/asset/sound` so browsers can fetch files directly.
// We copy the repository `asset/sound` into `public/asset/sound` during setup.
const AUDIO_BASE = '/asset/sound';

type AudioContextType = {
  playMusic: (track?: string) => void;
  playMenuMusic: () => void;
  // play ambience track based on biome name (e.g. 'cave' -> Ambience_Cave_00.mp3)
  playAmbienceForBiome: (biome?: string | null) => void;
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
  musicVolume: number;
  sfxVolume: number;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  muted: boolean;
  setMuted: (m: boolean) => void;
  currentTrack?: string;
};

const AudioContext = createContext<AudioContextType | null>(null);

function buildPath(...parts: string[]) {
  // join and encode components so filenames with spaces work in URLs
  return parts.map(p => encodeURI(p)).join('/');
}

export const AudioProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const [musicVolume, setMusicVolumeState] = useState<number>(() => {
    try { return Number(localStorage.getItem('dl_music_volume') ?? 0.6); } catch { return 0.6; }
  });
  const [sfxVolume, setSfxVolumeState] = useState<number>(() => {
    try { return Number(localStorage.getItem('dl_sfx_volume') ?? 0.9); } catch { return 0.9; }
  });
  const [muted, setMutedState] = useState<boolean>(() => {
    try { return localStorage.getItem('dl_muted') === '1'; } catch { return false; }
  });
  const [currentTrack, setCurrentTrack] = useState<string | undefined>(undefined);
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);
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
    try { localStorage.setItem('dl_music_volume', String(musicVolume)); } catch {}
    if (musicRef.current) musicRef.current.volume = muted ? 0 : musicVolume;
  }, [musicVolume, muted]);

  useEffect(() => { try { localStorage.setItem('dl_sfx_volume', String(sfxVolume)); } catch {} }, [sfxVolume]);
  useEffect(() => { try { localStorage.setItem('dl_muted', muted ? '1' : '0'); } catch {} }, [muted]);
  useEffect(() => { try { localStorage.setItem('dl_playback_mode', playbackMode); } catch {} }, [playbackMode]);
  useEffect(() => { try { localStorage.setItem('dl_playback_interval_minutes', String(playbackIntervalMinutes)); } catch {} }, [playbackIntervalMinutes]);

  const playMusic = useCallback((track?: string) => {
    const list = [...BACKGROUND_MUSIC, ...MENU_MUSIC];
    const chosen = track ?? list[0];
    if (!chosen) return;
    // background music files are stored in background_music; menu tracks may live in menu_music
    const isMenu = MENU_MUSIC.includes(chosen);
    const folder = isMenu ? 'menu_music' : 'background_music';
    const full = buildPath(AUDIO_BASE, folder, chosen);
    // stop and cleanup previous audio
    if (musicRef.current) {
      try { musicRef.current.pause(); } catch {}
      try { musicRef.current.src = ''; } catch {}
      musicRef.current = null;
    }

    const audio = new Audio(full);
    audio.volume = muted ? 0 : musicVolume;
    audio.preload = 'auto';

    // Determine if this is ambience/menu so we can decide looping behavior.
    const chosenLower = String(chosen).toLowerCase();
    const isAmbience = /ambience[_\-\s]?/.test(chosenLower) || chosenLower.startsWith('ambience');
    // playback mode affects looping/next-track behavior for non-ambience background music
    if (isMenu) {
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
        try { nextTrackTimeoutRef.current = window.setTimeout(() => {
          // pick next background music (rotate through list)
          const available = BACKGROUND_MUSIC.length ? BACKGROUND_MUSIC : [chosen];
          const idx = available.indexOf(chosen);
          const next = available[(idx + 1) % available.length] ?? available[0];
          playMusic(next);
        }, 5000); } catch(e){}
      };
    } else {
      // for 'off' and 'occasional', keep music looping when played directly
      audio.loop = true;
      audio.onended = null;
    }

    // Play and ignore rejection here; autoplay detection handled elsewhere.
    audio.play().catch(()=>{});
    musicRef.current = audio;
    setCurrentTrack(chosen);
  }, [musicVolume, muted]);

  const playMenuMusic = useCallback(() => {
    if (MENU_MUSIC.length === 0) return;
    playMusic(MENU_MUSIC[0]);
  }, [playMusic]);

  const playAmbienceForBiome = useCallback((biome?: string | null) => {
    if (!biome) return;
    const b = String(biome).toLowerCase();
    // try to find a background music that matches the biome name or contains 'ambience' + biome
    const candidate = BACKGROUND_MUSIC.find(fn => fn.toLowerCase().includes(b) || fn.toLowerCase().includes(`ambience_${b}`) || fn.toLowerCase().includes(`ambience ${b}`));
    if (candidate) playMusic(candidate);
  }, [playMusic]);

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
        occasionalTimerRef.current = window.setInterval(() => {
          // pick a random background track and play it
          if (BACKGROUND_MUSIC.length === 0) return;
          const idx = Math.floor(Math.random() * BACKGROUND_MUSIC.length);
          playMusic(BACKGROUND_MUSIC[idx]);
        }, ms);
      } catch (e) {}
    }

    return () => {
      if (occasionalTimerRef.current) { clearInterval(occasionalTimerRef.current); occasionalTimerRef.current = null; }
      if (nextTrackTimeoutRef.current) { clearTimeout(nextTrackTimeoutRef.current); nextTrackTimeoutRef.current = null; }
    };
  }, [playbackMode, playbackIntervalMinutes, playMusic]);

  const stopMusic = useCallback(() => {
    if (musicRef.current) {
      try { musicRef.current.pause(); } catch {}
      musicRef.current = null;
      setCurrentTrack(undefined);
    }
  }, []);

  const pauseMusic = useCallback(() => {
    if (musicRef.current) {
      try { musicRef.current.pause(); } catch {}
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
    a.play().catch(()=>{});
  }, [sfxVolume, muted]);

  const setMusicVolume = useCallback((v: number) => setMusicVolumeState(Math.max(0, Math.min(1, v))), []);
  const setSfxVolume = useCallback((v: number) => setSfxVolumeState(Math.max(0, Math.min(1, v))), []);
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
      const t = setTimeout(() => { preload.forEach(p => { try { p.src = ''; } catch {} }); }, 5000);
      return () => { clearTimeout(t); preload.forEach(p => { try { p.src = ''; } catch {} }); };
    } catch (e) { /* ignore */ }
  }, []);

  // Attempt to autoplay menu music on first client mount unless user disabled it.
  useEffect(() => {
    try {
      const disabled = localStorage.getItem('dl_auto_menu');
      if (disabled === '0') return;
      // Respect user mute: if muted, don't attempt autoplay
      if (muted) return;
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
          try { temp.src = ''; } catch {}
        }).catch(() => {
          // autoplay blocked: persist opt-out so we don't keep retrying
          setAutoplayBlocked(true);
          try { localStorage.setItem('dl_auto_menu', '0'); } catch {}
          try { temp.src = ''; } catch {}
        });
      } catch (e) {
        // ignore
      }
    } catch (e) {
      // ignore
    }
  }, [playMenuMusic]);

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
        try { localStorage.setItem('dl_auto_menu', '1'); } catch {}
        playMenuMusic();
        try { temp.src = ''; } catch {}
      }).catch(() => {
        setAutoplayBlocked(true);
        try { temp.src = ''; } catch {}
      });
    } catch (e) {
      setAutoplayBlocked(true);
    }
  }, [musicVolume, muted, playMenuMusic]);

  const api: AudioContextType = {
    playMusic,
    playMenuMusic,
    playAmbienceForBiome,
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
    musicVolume,
    sfxVolume,
    setMusicVolume,
    setSfxVolume,
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
