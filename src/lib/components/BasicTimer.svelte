<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { timers, type Timer } from '../stores/timers';
  import { formatTime, calculatePercentComplete } from '../utils/timeCalculations';
  import { playAlarm, stopAlarm, initAlarm } from '../utils/alarm';
  import { settings } from '../stores/settings';

  export let timerId: string;

  let timer: Timer | undefined;
  let interval: ReturnType<typeof setInterval> | undefined;
  let editMode = false;
  let inputHours = 0;
  let inputMinutes = 5;
  let inputSeconds = 0;
  let labelInput = '';

  // Subscribe to timer changes
  $: timer = $timers.find(t => t.id === timerId);
  $: formattedTime = timer ? formatTime(timer.remainingTime) : '00:00:00';
  $: percentComplete = timer ? calculatePercentComplete(timer.totalSeconds, timer.remainingTime) : 0;
  $: isRunning = timer?.status === 'running';
  $: isPaused = timer?.status === 'paused';
  $: isCompleted = timer?.status === 'completed';
  $: isIdle = timer?.status === 'idle';

  // Sync inputs with timer when not editing
  $: if (timer && !editMode) {
    inputHours = timer.hours;
    inputMinutes = timer.minutes;
    inputSeconds = timer.seconds;
    labelInput = timer.label;
  }

  // Handle alarm on completion
  $: if (isCompleted && $settings.soundEnabled) {
    playAlarm();
  }

  function start() {
    if (!timer || timer.remainingTime <= 0) return;

    // Initialize alarm on first user interaction
    initAlarm();

    timers.start(timerId);

    // Clear any existing interval
    if (interval) clearInterval(interval);

    // Start countdown interval
    interval = setInterval(() => {
      timers.tick(timerId);
    }, 1000);
  }

  function pause() {
    if (interval) {
      clearInterval(interval);
      interval = undefined;
    }
    timers.pause(timerId);
  }

  function reset() {
    if (interval) {
      clearInterval(interval);
      interval = undefined;
    }
    stopAlarm();
    timers.reset(timerId);
  }

  function remove() {
    if (interval) {
      clearInterval(interval);
      interval = undefined;
    }
    stopAlarm();
    timers.remove(timerId);
  }

  function dismissAlarm() {
    stopAlarm();
    reset();
  }

  function startEdit() {
    if (isRunning) return;
    editMode = true;
  }

  function saveEdit() {
    timers.setDuration(timerId, inputHours, inputMinutes, inputSeconds);
    timers.updateTimer(timerId, { label: labelInput });
    editMode = false;
  }

  function cancelEdit() {
    if (timer) {
      inputHours = timer.hours;
      inputMinutes = timer.minutes;
      inputSeconds = timer.seconds;
      labelInput = timer.label;
    }
    editMode = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
  }

  // Quick set buttons
  function quickSet(mins: number) {
    timers.setDuration(timerId, 0, mins, 0);
  }

  onMount(() => {
    // Resume running timer if it was running
    if (timer?.status === 'running') {
      interval = setInterval(() => {
        timers.tick(timerId);
      }, 1000);
    }
  });

  onDestroy(() => {
    if (interval) {
      clearInterval(interval);
    }
  });
</script>

<div class="timer-card" class:running={isRunning} class:completed={isCompleted} class:paused={isPaused}>
  <!-- Alarm overlay -->
  {#if isCompleted}
    <div class="alarm-overlay">
      <div class="alarm-content">
        <div class="alarm-icon">🔔</div>
        <h3>Time's Up!</h3>
        {#if timer?.label}
          <p>{timer.label}</p>
        {/if}
        <button class="dismiss-btn" on:click={dismissAlarm}>Dismiss</button>
      </div>
    </div>
  {/if}

  <!-- Timer label -->
  <div class="timer-header">
    {#if editMode}
      <input
        type="text"
        class="label-input"
        bind:value={labelInput}
        placeholder="Timer name (optional)"
        on:keydown={handleKeydown}
      />
    {:else}
      <span class="timer-label" on:click={startEdit} on:keypress={startEdit} role="button" tabindex="0">
        {timer?.label || 'Untitled Timer'}
      </span>
    {/if}
    <button class="delete-btn" on:click={remove} title="Delete timer">×</button>
  </div>

  <!-- Progress ring -->
  <div class="progress-container">
    <svg class="progress-ring" viewBox="0 0 120 120">
      <circle
        class="progress-bg"
        cx="60"
        cy="60"
        r="54"
        fill="none"
        stroke-width="8"
      />
      <circle
        class="progress-bar"
        cx="60"
        cy="60"
        r="54"
        fill="none"
        stroke-width="8"
        stroke-dasharray={2 * Math.PI * 54}
        stroke-dashoffset={2 * Math.PI * 54 * (1 - percentComplete / 100)}
        transform="rotate(-90 60 60)"
      />
    </svg>
    <div class="time-display" on:click={startEdit} on:keypress={startEdit} role="button" tabindex="0">
      {formattedTime}
    </div>
  </div>

  <!-- Edit mode inputs -->
  {#if editMode}
    <div class="edit-inputs">
      <div class="time-input-group">
        <input
          type="number"
          min="0"
          max="23"
          bind:value={inputHours}
          on:keydown={handleKeydown}
        />
        <span>h</span>
      </div>
      <div class="time-input-group">
        <input
          type="number"
          min="0"
          max="59"
          bind:value={inputMinutes}
          on:keydown={handleKeydown}
        />
        <span>m</span>
      </div>
      <div class="time-input-group">
        <input
          type="number"
          min="0"
          max="59"
          bind:value={inputSeconds}
          on:keydown={handleKeydown}
        />
        <span>s</span>
      </div>
    </div>
    <div class="edit-actions">
      <button class="btn secondary" on:click={cancelEdit}>Cancel</button>
      <button class="btn primary" on:click={saveEdit}>Save</button>
    </div>
  {:else}
    <!-- Quick set buttons -->
    {#if isIdle}
      <div class="quick-set">
        <button on:click={() => quickSet(1)}>1m</button>
        <button on:click={() => quickSet(5)}>5m</button>
        <button on:click={() => quickSet(10)}>10m</button>
        <button on:click={() => quickSet(30)}>30m</button>
      </div>
    {/if}

    <!-- Controls -->
    <div class="controls">
      {#if isRunning}
        <button class="btn warning" on:click={pause}>Pause</button>
      {:else}
        <button class="btn primary" on:click={start} disabled={timer?.remainingTime === 0}>
          {isPaused ? 'Resume' : 'Start'}
        </button>
      {/if}
      <button class="btn secondary" on:click={reset} disabled={isIdle && timer?.remainingTime === timer?.totalSeconds}>
        Reset
      </button>
    </div>
  {/if}
</div>

<style>
  .timer-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .timer-card.running {
    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.2);
    border: 2px solid #10b981;
  }

  .timer-card.paused {
    border: 2px solid #f59e0b;
  }

  .timer-card.completed {
    border: 2px solid #ef4444;
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0%, 100% { box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3); }
    50% { box-shadow: 0 4px 30px rgba(239, 68, 68, 0.5); }
  }

  /* Alarm overlay */
  .alarm-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(239, 68, 68, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .alarm-content {
    text-align: center;
    color: white;
  }

  .alarm-icon {
    font-size: 48px;
    animation: shake 0.5s infinite;
  }

  @keyframes shake {
    0%, 100% { transform: rotate(-10deg); }
    50% { transform: rotate(10deg); }
  }

  .alarm-content h3 {
    margin: 12px 0 8px;
    font-size: 24px;
  }

  .alarm-content p {
    margin: 0 0 16px;
    opacity: 0.9;
  }

  .dismiss-btn {
    background: white;
    color: #ef4444;
    border: none;
    padding: 12px 32px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .dismiss-btn:hover {
    transform: scale(1.05);
  }

  /* Header */
  .timer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .timer-label {
    font-size: 14px;
    color: #6b7280;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background 0.2s;
  }

  .timer-label:hover {
    background: #f3f4f6;
  }

  .label-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 14px;
    margin-right: 8px;
  }

  .delete-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: #fee2e2;
    color: #ef4444;
    border-radius: 6px;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .delete-btn:hover {
    background: #ef4444;
    color: white;
  }

  /* Progress ring */
  .progress-container {
    position: relative;
    width: 160px;
    height: 160px;
    margin: 0 auto 20px;
  }

  .progress-ring {
    width: 100%;
    height: 100%;
  }

  .progress-bg {
    stroke: #e5e7eb;
  }

  .progress-bar {
    stroke: #3b82f6;
    transition: stroke-dashoffset 0.5s ease;
  }

  .timer-card.running .progress-bar {
    stroke: #10b981;
  }

  .timer-card.paused .progress-bar {
    stroke: #f59e0b;
  }

  .timer-card.completed .progress-bar {
    stroke: #ef4444;
  }

  .time-display {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 32px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: #1f2937;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    transition: background 0.2s;
  }

  .time-display:hover {
    background: #f3f4f6;
  }

  /* Edit mode */
  .edit-inputs {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  .time-input-group {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .time-input-group input {
    width: 60px;
    padding: 10px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 18px;
    text-align: center;
    font-weight: 600;
  }

  .time-input-group input:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .time-input-group span {
    color: #6b7280;
    font-size: 14px;
  }

  .edit-actions {
    display: flex;
    gap: 8px;
  }

  /* Quick set buttons */
  .quick-set {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  .quick-set button {
    padding: 6px 12px;
    border: 1px solid #e5e7eb;
    background: white;
    border-radius: 6px;
    font-size: 12px;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
  }

  .quick-set button:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }

  /* Controls */
  .controls {
    display: flex;
    gap: 8px;
  }

  .btn {
    flex: 1;
    padding: 12px 16px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn.primary {
    background: #3b82f6;
    color: white;
  }

  .btn.primary:hover:not(:disabled) {
    background: #2563eb;
  }

  .btn.secondary {
    background: #f3f4f6;
    color: #4b5563;
  }

  .btn.secondary:hover:not(:disabled) {
    background: #e5e7eb;
  }

  .btn.warning {
    background: #f59e0b;
    color: white;
  }

  .btn.warning:hover:not(:disabled) {
    background: #d97706;
  }
</style>
