import { writable, get } from 'svelte/store';
import { parseTimeToSeconds } from '../utils/timeCalculations';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface Timer {
  id: string;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  remainingTime: number;
  status: TimerStatus;
  label: string;
}

const STORAGE_KEY = 'countdown_timers';

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

function loadFromStorage(): Timer[] {
  if (!isBrowser) return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const timers = JSON.parse(saved) as Timer[];
      // Reset running timers to paused on load (intervals don't persist)
      return timers.map(t => ({
        ...t,
        status: t.status === 'running' ? 'paused' : t.status
      }));
    }
  } catch (e) {
    console.error('Failed to load timers from storage:', e);
  }
  return [];
}

function saveToStorage(timers: Timer[]): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
  } catch (e) {
    console.error('Failed to save timers to storage:', e);
  }
}

function generateId(): string {
  return crypto.randomUUID();
}

function createTimerStore() {
  const { subscribe, set, update } = writable<Timer[]>(loadFromStorage());

  // Subscribe to changes and save to localStorage
  let initialized = false;
  subscribe((timers) => {
    if (initialized && isBrowser) {
      saveToStorage(timers);
    }
  });
  initialized = true;

  return {
    subscribe,

    add: (options: Partial<Pick<Timer, 'hours' | 'minutes' | 'seconds' | 'label'>> = {}) => {
      const hours = options.hours ?? 0;
      const minutes = options.minutes ?? 5;
      const seconds = options.seconds ?? 0;
      const totalSeconds = parseTimeToSeconds(hours, minutes, seconds);

      const newTimer: Timer = {
        id: generateId(),
        hours,
        minutes,
        seconds,
        totalSeconds,
        remainingTime: totalSeconds,
        status: 'idle',
        label: options.label ?? '',
      };

      update(timers => [...timers, newTimer]);
      return newTimer.id;
    },

    remove: (id: string) => {
      update(timers => timers.filter(t => t.id !== id));
    },

    updateTimer: (id: string, updates: Partial<Timer>) => {
      update(timers =>
        timers.map(t => t.id === id ? { ...t, ...updates } : t)
      );
    },

    setDuration: (id: string, hours: number, minutes: number, seconds: number) => {
      const totalSeconds = parseTimeToSeconds(hours, minutes, seconds);
      update(timers =>
        timers.map(t => t.id === id ? {
          ...t,
          hours,
          minutes,
          seconds,
          totalSeconds,
          remainingTime: totalSeconds,
          status: 'idle'
        } : t)
      );
    },

    start: (id: string) => {
      update(timers =>
        timers.map(t => t.id === id && t.remainingTime > 0 ? { ...t, status: 'running' } : t)
      );
    },

    pause: (id: string) => {
      update(timers =>
        timers.map(t => t.id === id ? { ...t, status: 'paused' } : t)
      );
    },

    reset: (id: string) => {
      update(timers =>
        timers.map(t => t.id === id ? {
          ...t,
          remainingTime: t.totalSeconds,
          status: 'idle'
        } : t)
      );
    },

    tick: (id: string) => {
      update(timers =>
        timers.map(t => {
          if (t.id !== id || t.status !== 'running') return t;
          const newRemaining = Math.max(0, t.remainingTime - 1);
          return {
            ...t,
            remainingTime: newRemaining,
            status: newRemaining === 0 ? 'completed' : 'running'
          };
        })
      );
    },

    getTimer: (id: string): Timer | undefined => {
      return get({ subscribe }).find(t => t.id === id);
    },

    clearAll: () => {
      set([]);
    }
  };
}

export const timers = createTimerStore();
