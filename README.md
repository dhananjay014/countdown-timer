# Countdown Timer

A fast, responsive countdown timer and event countdown app built with Svelte 5, TypeScript, and Vite. Manage multiple timers and track important dates with persistent localStorage storage.

[![Svelte 5.43.8](https://img.shields.io/badge/Svelte-5.43.8-FF3E00?logo=svelte)](https://svelte.dev)
[![TypeScript 5.9.3](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite 7.2.4](https://img.shields.io/badge/Vite-7.2.4-646CFF?logo=vite)](https://vitejs.dev)
[![Storage](https://img.shields.io/badge/Storage-localStorage-informational)](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

## Features

### Countdown Timers
- Create and manage up to 20 independent countdown timers
- Edit timer durations (hours, minutes, seconds) anytime
- Add custom labels to identify each timer
- Quick-set presets: 1m, 5m, 10m, 30m buttons
- Real-time progress ring visualization with percentage tracking
- Start, pause, and reset controls
- Timer status tracking: Idle → Running → Paused → Completed

### Event Countdowns
- Create countdowns to important dates (birthdays, holidays, deadlines, etc.)
- Smart time formatting:
  - Under 24 hours: HH:MM:SS
  - 1-7 days: "Xd Yh Zm" format
  - 7-30 days: "X days, Y hours"
  - Over 30 days: "X months, Y days"
- Automatic event sorting (upcoming first, completed last)
- Celebration emojis and completion badges
- Real-time countdown updates every second

### Audio & Notifications
- Alarm system with HTML5 Audio playback
- Web Audio API fallback for browsers without audio support
- Sine wave beeping pattern: 800Hz sine wave at 500ms intervals
- Full-screen alarm overlay with "Time's Up!" message
- Adjustable volume control (0-100%)
- Toggle sound on/off in settings

### Persistence & Offline Support
- Automatic localStorage synchronization
- All timers, events, and settings persist across sessions
- No internet required after initial load
- Graceful degradation in environments without localStorage

## Architecture

### Project Structure
```
countdown_timer/
├── src/
│   ├── App.svelte                      # Root component (tab navigation, settings)
│   ├── main.ts                         # Application entry point
│   ├── app.css                         # Global styles and CSS variables
│   └── lib/
│       ├── stores/
│       │   ├── timers.ts               # Timer state management and business logic
│       │   ├── events.ts               # Event countdown state and operations
│       │   └── settings.ts             # User preferences (volume, sound, theme)
│       ├── components/
│       │   ├── BasicTimer.svelte       # Single timer display with controls
│       │   ├── TimerList.svelte        # Timer collection container (add/clear)
│       │   ├── EventCard.svelte        # Single event countdown card
│       │   ├── EventList.svelte        # Event collection with form toggle
│       │   └── EventForm.svelte        # Add/edit event modal
│       └── utils/
│           ├── alarm.ts                # Audio playback with Web Audio fallback
│           └── timeCalculations.ts     # Time parsing, formatting, calculations
```

### State Management Flow

```
App.svelte (tab navigation)
    ├── TimerList ──→ timers store ──→ BasicTimer (x20 max)
    │                                    └── alarm utils + timeCalculations
    │
    └── EventList ──→ events store ──→ EventCard (unlimited)
                     ├── EventForm
                     └── timeCalculations

settings store
    └── App.svelte (volume, sound toggle)
        └── alarm utils
```

## Data Models

### Timer Interface
```typescript
interface Timer {
  id: string;                  // UUID or fallback ID
  hours: number;              // User-set hours (0-23)
  minutes: number;            // User-set minutes (0-59)
  seconds: number;            // User-set seconds (0-59)
  totalSeconds: number;       // Calculated total duration
  remainingTime: number;      // Seconds left in countdown
  endTime: number | null;     // Timestamp when timer expires (null if idle)
  status: TimerStatus;        // 'idle' | 'running' | 'paused' | 'completed'
  label: string;              // Optional custom name
}
```

### Event Interface
```typescript
interface CountdownEvent {
  id: string;                 // UUID
  name: string;               // Event title
  targetDate: string;         // ISO 8601 string for serialization
  createdAt: string;          // ISO 8601 creation timestamp
}
```

### Settings Interface
```typescript
interface AppSettings {
  soundEnabled: boolean;      // Alarm audio toggle
  volume: number;             // 0-100 percentage
  theme: 'light' | 'dark' | 'system';  // Theme preference
}
```

## Technical Implementation

### Timer State Machine

```
START (add timer)
    ↓
[IDLE] ← ← ← ← ← ← ← ←
  ↓ (click "Start")
[RUNNING] (tick every 1000ms, decrement remainingTime)
  ├→ [PAUSED] (click "Pause", freeze remainingTime)
  │  └→ [RUNNING] (click "Resume")
  ├→ [COMPLETED] (remainingTime reaches 0)
  │  └→ [IDLE] (click "Reset")
  └→ [IDLE] (click "Reset")

DELETE: any state → removed from store
```

### Tick Algorithm

The `tick()` function runs every 1000ms while a timer is running:

```typescript
tick: (id: string) => {
  const now = Date.now();
  update(timers =>
    timers.map(t => {
      if (t.id !== id || t.status !== 'running') return t;

      // Recalculate remaining time from endTime
      const endTime = t.endTime ?? (now + (t.remainingTime * 1000));
      const remainingTime = Math.ceil((endTime - now) / 1000);

      if (remainingTime === 0) {
        return { ...t, status: 'completed', remainingTime: 0 };
      }
      return { ...t, remainingTime, endTime };
    })
  );
}
```

**Key insight:** timers use an absolute `endTime` timestamp instead of just decrementing. This ensures accuracy even if the tab is paused or backgrounded.

### Alarm System

The alarm implementation provides two mechanisms:

**Primary: HTML5 Audio**
- Loads audio file from `/public/alarm-sound.mp3`
- Loops continuously until stopped
- Volume controlled by `setVolume()` function
- Browser may require user interaction for autoplay

**Fallback: Web Audio API**
- Creates OscillatorNode with 800Hz sine wave
- 500ms beep/silence pattern
- Uses GainNode for volume control
- Activates if primary audio fails

```typescript
playAlarm() {
  try {
    audio.play();
  } catch (error) {
    // Browser blocked autoplay
    playFallbackAlarm(); // Web Audio API sine wave
  }
}
```

### Time Calculations

**formatTime(totalSeconds: number): string**
- Input: seconds (e.g., 3661)
- Output: "01:01:01" (HH:MM:SS with zero padding)

**formatEventTimeRemaining(targetDate: Date): string**
- Intelligent formatting based on time remaining:
  - 0-24 hours: "HH:MM:SS"
  - 1-7 days: "Xd Yh Zm"
  - 7-30 days: "X days, Y hours"
  - 30+ days: "X months, Y days"
- Returns "Event passed" for past dates

**calculatePercentComplete(total: number, remaining: number): number**
- Returns 0-100 for progress ring animation
- Handles edge case: if total is 0, returns 100

### Storage Persistence

Timer and event state auto-saves to localStorage on every change:

```typescript
subscribe((timers) => {
  if (initialized && isBrowser) {
    localStorage.setItem('countdown_timers', JSON.stringify(timers));
  }
});
```

On load, timers are normalized:
- Running timers recalculate `remainingTime` from stored `endTime`
- Timers that expired while app was closed become `'completed'`
- Paused timers with missing `endTime` revert to `'paused'` status

## Setup & Development

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+ or yarn 4+

### Installation

```bash
# Clone or download the repository
cd countdown_timer

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

### Available Commands

```bash
# Development server (with hot module reload)
npm run dev

# Build for production (dist/ folder)
npm run build

# Preview production build locally
npm run preview

# Type check and validate (TypeScript + Svelte)
npm check

# Run tests (unit tests with Vitest)
npm test

# Watch mode for tests
npm run test:watch
```

### Project Configuration

**TypeScript** (`tsconfig.app.json`)
- Target: ES2020
- Module: ESNext
- Strict mode enabled

**Vite** (`vite.config.ts`)
- Built-in Svelte 5 support via `@sveltejs/vite-plugin-svelte`
- Development server on `http://localhost:5173`
- Production build with code splitting

**Svelte 5**
- Runes system enabled
- Fine-grained reactivity
- No runtime overhead

## Build & Deployment

### Production Build

```bash
npm run build
```

Outputs to `dist/` directory:
- Minified JavaScript bundles
- CSS extracted and minified
- Assets optimized and hashed
- Ready for static hosting

### Deployment Targets

This app is a single-page application (SPA) with no backend requirements. Deploy to any static hosting service:

**Vercel** (recommended, fastest build)
```bash
npm install -g vercel
vercel
```

**Netlify**
```bash
npm run build
# Drag dist/ to Netlify drop zone
```

**GitHub Pages**
```bash
# Update vite.config.ts base: '/countdown_timer/'
npm run build
# Deploy dist/ to gh-pages branch
```

**Traditional Web Host**
- FTP/SFTP `dist/` contents to web root
- Ensure 404.html redirects to index.html for SPA routing

## File Reference

| File | Purpose | Key Exports |
|------|---------|------------|
| **App.svelte** | Root component | Tab navigation, header, footer, settings UI |
| **main.ts** | Entry point | Mounts App component to DOM |
| **app.css** | Global styles | CSS variables, reset, responsive fonts |
| **timers.ts** | Timer store | `timers` store with add/start/pause/reset methods |
| **events.ts** | Event store | `events` store with add/remove/update methods |
| **settings.ts** | Settings store | `settings` store with volume/sound/theme controls |
| **alarm.ts** | Audio utils | `playAlarm()`, `stopAlarm()`, `setVolume()`, fallback Web Audio |
| **timeCalculations.ts** | Time utils | `formatTime()`, `formatEventTimeRemaining()`, `calculatePercentComplete()` |
| **BasicTimer.svelte** | Timer component | Single timer card with progress ring, controls, alarm overlay |
| **TimerList.svelte** | Timer container | Grid layout, add/clear buttons, empty state, max 20 timers |
| **EventCard.svelte** | Event component | Event display with countdown, completion badge, delete button |
| **EventList.svelte** | Event container | Grid layout, form toggle, sorting (upcoming first) |
| **EventForm.svelte** | Event modal | Date/time picker, name input, form validation |

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Core Timer | ✓ | ✓ | ✓ | ✓ |
| localStorage | ✓ | ✓ | ✓ | ✓ |
| Web Audio API | ✓ | ✓ | ✓ | ✓ |
| HTML5 Audio | ✓ | ✓ | ✓ | ✓ |
| crypto.randomUUID | ✓ | ✓ | ✓ | ✓ |

## Performance Considerations

- **Max 20 Timers:** Hard limit prevents excessive DOM nodes and store updates
- **Event Loop Tick:** 1000ms interval using `setInterval` (reduces CPU vs. requestAnimationFrame)
- **SVG Progress Ring:** CSS transitions on `stroke-dashoffset` (GPU accelerated)
- **localStorage Debounce:** Automatic sync on every store change (serializes entire array per change)

## Common Tasks

### Adding a Custom Alarm Sound
1. Replace `/public/alarm-sound.mp3` with your audio file (MP3, WAV, OGG)
2. Restart dev server
3. Alarm plays automatically when timers complete

### Customizing Colors
Edit `app.css` CSS variables:
```css
:root {
  --primary: #3b82f6;        /* Timer progress ring */
  --secondary: #8b5cf6;      /* Event cards */
  --success: #10b981;        /* Running timers */
  --warning: #f59e0b;        /* Paused timers */
  --error: #ef4444;          /* Completed timers */
}
```

### Disabling localStorage
Comment out the save subscription in `timers.ts`, `events.ts`, and `settings.ts`:
```typescript
// subscribe((timers) => {
//   if (initialized && isBrowser) saveToStorage(timers);
// });
```

### Adjusting Max Timers
In `TimerList.svelte`, change `MAX_TIMERS`:
```typescript
const MAX_TIMERS = 50; // was 20
```

## Troubleshooting

**Alarm doesn't play**
- Check browser console for autoplay policy errors
- Click "Start" button to trigger user interaction before alarm plays
- Verify `/public/alarm-sound.mp3` exists
- Fallback Web Audio API should produce sine wave beeping

**Timers not persisting**
- Check browser localStorage is enabled
- Open DevTools → Application → localStorage
- Verify "countdown_timers" key exists
- Clear localStorage and reload if corrupted

**Progress ring not animating**
- CSS transitions require GPU support
- Check DevTools for animation performance
- Progress updates every 500ms (SVG stroke-dashoffset)

**TypeScript errors in IDE**
- Run `npm check` to validate configuration
- Ensure `tsconfig.app.json` is present
- Restart your IDE's TypeScript language server

## Dependencies

- **svelte** (5.43.8): Reactive UI framework
- **typescript** (5.9.3): Type safety
- **vite** (7.2.4): Fast bundler and dev server
- **date-fns** (4.1.0): Date manipulation utilities
- **@sveltejs/vite-plugin-svelte**: Svelte integration for Vite
- **vitest** (3.2.4): Unit testing framework
- **svelte-check**: Type and component validation

No external UI frameworks or CSS libraries needed - all styling is custom CSS with Tailwind-inspired utilities.
