/**
 * Alarm audio utilities for countdown timers
 */

let audio: HTMLAudioElement | null = null;
let isInitialized = false;

// Default alarm sound URL (using a simple beep pattern with Web Audio API as fallback)
const DEFAULT_ALARM_URL = '/alarm-sound.mp3';

/**
 * Initialize the alarm audio element
 * Call this early in the app lifecycle (e.g., on first user interaction)
 */
export function initAlarm(soundUrl: string = DEFAULT_ALARM_URL): void {
  if (typeof window === 'undefined') return;

  if (!audio) {
    audio = new Audio(soundUrl);
    audio.loop = true;
    audio.volume = 0.7;
  }
  isInitialized = true;
}

/**
 * Play the alarm sound
 * Returns a promise that resolves when playback starts
 */
export async function playAlarm(): Promise<void> {
  if (!isInitialized) {
    initAlarm();
  }

  if (audio) {
    try {
      audio.currentTime = 0;
      audio.loop = true;
      await audio.play();
    } catch (error) {
      // If audio playback fails (e.g., no user interaction yet), use fallback
      console.warn('Audio playback failed, using fallback:', error);
      playFallbackAlarm();
    }
  } else {
    playFallbackAlarm();
  }
}

/**
 * Stop the alarm sound
 */
export function stopAlarm(): void {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
  stopFallbackAlarm();
}

/**
 * Set the alarm volume (0.0 to 1.0)
 */
export function setVolume(volume: number): void {
  if (audio) {
    audio.volume = Math.max(0, Math.min(1, volume));
  }
}

/**
 * Check if alarm is currently playing
 */
export function isPlaying(): boolean {
  return audio ? !audio.paused : false;
}

// Fallback alarm using Web Audio API
let audioContext: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let fallbackInterval: ReturnType<typeof setInterval> | null = null;

function playFallbackAlarm(): void {
  if (typeof window === 'undefined') return;

  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNode.gain.value = 0.3;

    // Create beeping pattern
    let isOn = true;
    const beep = () => {
      if (oscillator) {
        oscillator.stop();
        oscillator.disconnect();
      }

      if (isOn) {
        oscillator = audioContext!.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = 800;
        oscillator.connect(gainNode!);
        oscillator.start();
      }
      isOn = !isOn;
    };

    beep();
    fallbackInterval = setInterval(beep, 500);
  } catch (error) {
    console.error('Fallback alarm failed:', error);
  }
}

function stopFallbackAlarm(): void {
  if (fallbackInterval) {
    clearInterval(fallbackInterval);
    fallbackInterval = null;
  }
  if (oscillator) {
    oscillator.stop();
    oscillator.disconnect();
    oscillator = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
}
