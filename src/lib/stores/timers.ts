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
  endTime: number | null;
  status: TimerStatus;
  label: string;
}

const STORAGE_KEY = 'countdown_timers';

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

function getRemainingSeconds(endTime: number, now: number = Date.now()): number {
  return Math.max(0, Math.ceil((endTime - now) / 1000));
}

function normalizeLoadedTimer(timer: Timer): Timer {
  if (timer.status !== 'running') {
    return {
      ...timer,
      endTime: timer.endTime ?? null,
    };
  }

  const endTime = typeof timer.endTime === 'number' ? timer.endTime : null;
  if (!endTime) {
    return {
      ...timer,
      status: 'paused',
      endTime: null,
    };
  }

  const remainingTime = getRemainingSeconds(endTime);
  return {
    ...timer,
    remainingTime,
    status: remainingTime === 0 ? 'completed' : 'running',
    endTime: remainingTime === 0 ? null : endTime,
  };
}

function loadFromStorage(): Timer[] {
  if (!isBrowser) return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const timers = JSON.parse(saved) as Timer[];
      return timers.map(normalizeLoadedTimer);
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
        endTime: null,
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
          endTime: null,
          status: 'idle'
        } : t)
      );
    },

    start: (id: string) => {
      const now = Date.now();
      update(timers =>
        timers.map(t =>
          t.id === id && t.remainingTime > 0
            ? { ...t, status: 'running', endTime: now + (t.remainingTime * 1000) }
            : t
        )
      );
    },

    pause: (id: string) => {
      const now = Date.now();
      update(timers =>
        timers.map(t => {
          if (t.id !== id) return t;
          const endTime = t.endTime ?? (now + (t.remainingTime * 1000));
          const remainingTime = getRemainingSeconds(endTime, now);
          return {
            ...t,
            remainingTime,
            status: 'paused',
            endTime: null,
          };
        })
      );
    },

    reset: (id: string) => {
      update(timers =>
        timers.map(t => t.id === id ? {
          ...t,
          remainingTime: t.totalSeconds,
          status: 'idle',
          endTime: null,
        } : t)
      );
    },

    tick: (id: string) => {
      const now = Date.now();
      update(timers =>
        timers.map(t => {
          if (t.id !== id || t.status !== 'running') return t;
          const endTime = t.endTime ?? (now + (t.remainingTime * 1000));
          const remainingTime = getRemainingSeconds(endTime, now);
          if (remainingTime === 0) {
            return {
              ...t,
              remainingTime,
              status: 'completed',
              endTime: null,
            };
          }
          return {
            ...t,
            remainingTime,
            status: 'running',
            endTime,
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
