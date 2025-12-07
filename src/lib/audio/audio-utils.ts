/**
 * Audio utility functions for common audio operations.
 * Extracted from AudioProvider for reusability and testability.
 *
 * @remarks
 * This module provides pure functions for audio manipulation without React dependencies.
 * All functions are designed to be framework-agnostic for maximum reusability.
 */

/**
 * Fade out an audio element and stop playback when complete.
 *
 * @remarks
 * Animates the volume from current to 0 over durationMs milliseconds.
 * Automatically pauses and clears the audio src when fade completes.
 * Safe to call on already-stopped elements (no-op if volume === 0).
 *
 * @param audio The HTMLAudioElement to fade out
 * @param durationMs Duration of fade in milliseconds (default: 2500)
 * @returns void
 *
 * @example
 * const audio = document.getElementById('background-music') as HTMLAudioElement;
 * fadeOutAudio(audio, 3000); // Fade out over 3 seconds
 */
export function fadeOutAudio(audio: HTMLAudioElement, durationMs: number = 2500): void {
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
}

/**
 * Fade in an audio element from silence to target volume.
 *
 * @remarks
 * Animates volume from 0 to targetVolume over durationMs milliseconds.
 * Useful for smooth transitions when starting new audio tracks.
 *
 * @param audio The HTMLAudioElement to fade in
 * @param targetVolume Target volume level (0-1)
 * @param durationMs Duration of fade in milliseconds (default: 1500)
 * @returns void
 *
 * @example
 * const audio = document.getElementById('ambience') as HTMLAudioElement;
 * audio.play();
 * fadeInAudio(audio, 0.7, 2000); // Fade in to 70% over 2 seconds
 */
export function fadeInAudio(audio: HTMLAudioElement, targetVolume: number = 1, durationMs: number = 1500): void {
  if (!audio) return;

  audio.volume = 0;
  const startTime = Date.now();
  const fadeInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / durationMs, 1);
    audio.volume = targetVolume * progress;

    if (progress === 1) {
      clearInterval(fadeInterval);
      audio.volume = targetVolume;
    }
  }, 30);
}

/**
 * Cross-fade between two audio elements.
 *
 * @remarks
 * Fades out the current audio while fading in the new audio simultaneously.
 * This creates a smooth transition between different tracks without silence.
 *
 * @param fromAudio Audio element to fade out (can be null)
 * @param toAudio Audio element to fade in
 * @param targetVolume Target volume for incoming audio (default: 1)
 * @param durationMs Fade duration in milliseconds (default: 2000)
 * @returns void
 *
 * @example
 * const oldTrack = currentAudio;
 * const newTrack = document.getElementById('new-ambience') as HTMLAudioElement;
 * newTrack.play();
 * crossFadeAudio(oldTrack, newTrack, 0.8, 2500);
 */
export function crossFadeAudio(
  fromAudio: HTMLAudioElement | null,
  toAudio: HTMLAudioElement,
  targetVolume: number = 1,
  durationMs: number = 2000
): void {
  if (fromAudio) {
    fadeOutAudio(fromAudio, durationMs);
  }
  fadeInAudio(toAudio, targetVolume, durationMs);
}

/**
 * Safely stop all audio elements in a collection.
 *
 * @remarks
 * Iterates through audio elements, pauses each, and clears the src attribute.
 * Errors in one element don't prevent stopping others.
 *
 * @param audioElements Array or HTMLCollection of audio elements to stop
 * @returns void
 *
 * @example
 * const layers = document.querySelectorAll('.ambience-layer');
 * stopAllAudio(layers);
 */
export function stopAllAudio(audioElements: HTMLAudioElement[] | HTMLCollection): void {
  try {
    for (let i = 0; i < audioElements.length; i++) {
      const audio = audioElements[i] as HTMLAudioElement;
      if (audio) {
        try { audio.pause(); } catch { }
        try { audio.src = ''; } catch { }
      }
    }
  } catch {
    // Silently handle iteration errors
  }
}

/**
 * Calculate logarithmic volume from linear percentage.
 *
 * @remarks
 * Human hearing perceives volume logarithmically. This function converts
 * a linear slider value (0-1) to a logarithmic volume level for more
 * natural-feeling volume adjustments.
 *
 * @param linearValue Linear value from 0 to 1
 * @returns Logarithmic volume value (0-1)
 *
 * @example
 * const sliderValue = 0.5; // 50% on slider
 * const audioVolume = getLogarithmicVolume(sliderValue);
 * audio.volume = audioVolume; // Feels like 50% to human ear
 */
export function getLogarithmicVolume(linearValue: number): number {
  // Formula: log10(linearValue + 1) / log10(2)
  // Maps 0 → 0, 1 → 1 with logarithmic curve
  const clamped = Math.max(0, Math.min(1, linearValue));
  return Math.log10(clamped * 9 + 1) / Math.log10(10);
}
