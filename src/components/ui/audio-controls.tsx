"use client";

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAudio } from '@/lib/audio/useAudio';
import { AudioActionType } from '@/lib/definitions/audio-events';
import { BACKGROUND_MUSIC, MENU_MUSIC } from '@/lib/audio/assets';

export default function AudioControls() {
  const audio = useAudio();
  const allBackground = useMemo(() => BACKGROUND_MUSIC.concat(MENU_MUSIC), []);
  const [selectedTrack, setSelectedTrack] = useState<string | undefined>(allBackground[0]);

  return (
    <div className="fixed right-4 bottom-4 z-50 w-64 bg-neutral-900/80 backdrop-blur rounded p-3 text-sm text-white shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">Audio</div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" noSfx onClick={() => audio.setMuted(!audio.muted)}>
            {audio.muted ? 'Unmute' : 'Mute'}
          </Button>
        </div>
      </div>

      <div className="mb-2">
        <div className="text-xs text-neutral-300 mb-1">Music</div>
        <div className="mb-2">
          <label className="text-xs text-neutral-300">Chọn bài</label>
          <select className="w-full mt-1 p-1 rounded bg-neutral-800" value={selectedTrack} onChange={(e) => setSelectedTrack(e.target.value)}>
            {allBackground.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" noSfx onClick={() => audio.playMusic(selectedTrack)}>{'Phát'}</Button>
          <Button size="sm" noSfx onClick={() => audio.pauseMusic()}>Tạm dừng</Button>
          <Button size="sm" noSfx onClick={() => audio.stopMusic()}>Dừng</Button>
        </div>
        <div className="mt-2">
          <Slider value={[audio.musicVolume]} onValueChange={(v) => audio.setMusicVolume(v[0] ?? 0.5)} step={0.01} min={0} max={1} />
        </div>
      </div>

      <div>
        <div className="text-xs text-neutral-300 mb-1">SFX</div>
        <div className="mt-2">
          <Slider value={[audio.sfxVolume]} onValueChange={(v) => audio.setSfxVolume(v[0] ?? 0.9)} step={0.01} min={0} max={1} />
        </div>
        <div className="flex gap-2 mt-3">
          <Button size="sm" noSfx onClick={() => audio.playSfx('Menu_Select_00.mp3')}>Play select</Button>
          <Button size="sm" noSfx onClick={() => audio.playSfx('Pickup_Gold_00.mp3')}>Play pickup</Button>
        </div>
        <div className="flex flex-col gap-2 mt-3 text-xs">
          <Button size="sm" onClick={() => audio.playSfxForAction?.(AudioActionType.PLAYER_MOVE)}>Test Move</Button>
          <Button size="sm" onClick={() => audio.playSfxForAction?.(AudioActionType.PLAYER_ATTACK)}>Test Attack</Button>
          <Button size="sm" onClick={() => audio.playSfxForAction?.(AudioActionType.ITEM_PICKUP, { itemRarity: 'rare' })}>Test Pickup</Button>
        </div>
        <div className="mt-3">
          <div className="text-xs text-neutral-300 mb-1">Tần suất âm thanh hành động</div>
          <div className="flex items-center gap-2 mb-2">
            <label className="flex items-center gap-1">
              <input type="radio" name="sfxPlaybackMode" checked={audio.playbackMode === 'off'} onChange={() => audio.setPlaybackMode('off')} />
              <span className="ml-1">Không</span>
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name="sfxPlaybackMode" checked={audio.playbackMode === 'occasional'} onChange={() => audio.setPlaybackMode('occasional')} />
              <span className="ml-1">Thỉnh thoảng</span>
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name="sfxPlaybackMode" checked={audio.playbackMode === 'always'} onChange={() => audio.setPlaybackMode('always')} />
              <span className="ml-1">Luôn luôn</span>
            </label>
          </div>
          {audio.playbackMode === 'occasional' && (
            <div className="text-xs text-neutral-400">50% sự kiện thường, 100% sự kiện quan trọng</div>
          )}
        </div>
      </div>
    </div>
  );
}
