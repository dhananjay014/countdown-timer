import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

const STORAGE_KEY = 'countdown_timers';
let idCounter = 0;

function mockWindow() {
  Object.defineProperty(globalThis, 'window', {
    value: globalThis,
    configurable: true,
  });
}

function mockLocalStorage() {
  let store: Record<string, string> = {};
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (key: string) => (key in store ? store[key] : null),
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    },
    configurable: true,
  });
}

function mockCrypto() {
  idCounter = 0;
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      randomUUID: () => `id-${++idCounter}`,
    },
    configurable: true,
  });
}

async function loadTimersStore() {
  const module = await import('./timers');
  return module.timers;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  vi.resetModules();
  mockWindow();
  mockLocalStorage();
  mockCrypto();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('timers store', () => {
  it('ticks based on endTime when time advances', async () => {
    const timers = await loadTimersStore();
    const id = timers.add({ hours: 0, minutes: 0, seconds: 10 });
    const startTime = Date.now();

    timers.start(id);

    const [started] = get(timers);
    expect(started.endTime).toBe(startTime + 10_000);

    vi.setSystemTime(new Date(startTime + 4000));
    timers.tick(id);

    const [updated] = get(timers);
    expect(updated.remainingTime).toBe(6);
    expect(updated.status).toBe('running');
  });

  it('recalculates remaining time on pause', async () => {
    const timers = await loadTimersStore();
    const id = timers.add({ hours: 0, minutes: 0, seconds: 10 });
    const startTime = Date.now();

    timers.start(id);
    vi.setSystemTime(new Date(startTime + 3000));
    timers.pause(id);

    const [paused] = get(timers);
    expect(paused.remainingTime).toBe(7);
    expect(paused.status).toBe('paused');
    expect(paused.endTime).toBeNull();
  });

  it('rehydrates running timers from storage using endTime', async () => {
    const now = Date.now();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 'stored-1',
          hours: 0,
          minutes: 0,
          seconds: 10,
          totalSeconds: 10,
          remainingTime: 10,
          endTime: now + 10_000,
          status: 'running',
          label: '',
        },
      ])
    );

    const timers = await loadTimersStore();
    const [rehydrated] = get(timers);

    expect(rehydrated.status).toBe('running');
    expect(rehydrated.remainingTime).toBe(10);
    expect(rehydrated.endTime).toBe(now + 10_000);
  });
});
