import { writable, get } from 'svelte/store';

export interface AppSettings {
  soundEnabled: boolean;
  volume: number; // 0-100
  theme: 'light' | 'dark' | 'system';
}

const STORAGE_KEY = 'countdown_settings';

const isBrowser = typeof window !== 'undefined';

const defaultSettings: AppSettings = {
  soundEnabled: true,
  volume: 70,
  theme: 'light',
};

function loadFromStorage(): AppSettings {
  if (!isBrowser) return defaultSettings;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load settings from storage:', e);
  }
  return defaultSettings;
}

function saveToStorage(settings: AppSettings): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to storage:', e);
  }
}

function createSettingsStore() {
  const { subscribe, set, update } = writable<AppSettings>(loadFromStorage());

  let initialized = false;
  subscribe((settings) => {
    if (initialized && isBrowser) {
      saveToStorage(settings);
    }
  });
  initialized = true;

  return {
    subscribe,

    setSoundEnabled: (enabled: boolean) => {
      update(s => ({ ...s, soundEnabled: enabled }));
    },

    setVolume: (volume: number) => {
      update(s => ({ ...s, volume: Math.max(0, Math.min(100, volume)) }));
    },

    setTheme: (theme: AppSettings['theme']) => {
      update(s => ({ ...s, theme }));
    },

    reset: () => {
      set(defaultSettings);
    },

    get: () => get({ subscribe }),
  };
}

export const settings = createSettingsStore();
