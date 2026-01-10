import { writable, get } from 'svelte/store';

export interface CountdownEvent {
  id: string;
  name: string;
  targetDate: string; // ISO string for serialization
  createdAt: string;
}

const STORAGE_KEY = 'countdown_events';

const isBrowser = typeof window !== 'undefined';

function loadFromStorage(): CountdownEvent[] {
  if (!isBrowser) return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as CountdownEvent[];
    }
  } catch (e) {
    console.error('Failed to load events from storage:', e);
  }
  return [];
}

function saveToStorage(events: CountdownEvent[]): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    console.error('Failed to save events to storage:', e);
  }
}

function generateId(): string {
  return crypto.randomUUID();
}

function createEventsStore() {
  const { subscribe, set, update } = writable<CountdownEvent[]>(loadFromStorage());

  let initialized = false;
  subscribe((events) => {
    if (initialized && isBrowser) {
      saveToStorage(events);
    }
  });
  initialized = true;

  return {
    subscribe,

    add: (name: string, targetDate: Date) => {
      const newEvent: CountdownEvent = {
        id: generateId(),
        name,
        targetDate: targetDate.toISOString(),
        createdAt: new Date().toISOString(),
      };

      update(events => [...events, newEvent]);
      return newEvent.id;
    },

    remove: (id: string) => {
      update(events => events.filter(e => e.id !== id));
    },

    update: (id: string, updates: Partial<Pick<CountdownEvent, 'name' | 'targetDate'>>) => {
      update(events =>
        events.map(e => {
          if (e.id !== id) return e;
          return {
            ...e,
            name: updates.name ?? e.name,
            targetDate: updates.targetDate
              ? (updates.targetDate instanceof Date
                  ? updates.targetDate.toISOString()
                  : updates.targetDate)
              : e.targetDate,
          };
        })
      );
    },

    getEvent: (id: string): CountdownEvent | undefined => {
      return get({ subscribe }).find(e => e.id === id);
    },

    clearAll: () => {
      set([]);
    }
  };
}

export const events = createEventsStore();
