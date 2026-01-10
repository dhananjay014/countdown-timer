<script lang="ts">
  import { timers } from '../stores/timers';
  import BasicTimer from './BasicTimer.svelte';
  import { initAlarm } from '../utils/alarm';

  const MAX_TIMERS = 20;

  function addTimer() {
    if ($timers.length >= MAX_TIMERS) {
      alert(`Maximum ${MAX_TIMERS} timers allowed`);
      return;
    }
    // Initialize alarm on first user interaction
    initAlarm();
    timers.add({ hours: 0, minutes: 5, seconds: 0 });
  }

  function clearAll() {
    if ($timers.length === 0) return;
    if (confirm('Are you sure you want to delete all timers?')) {
      timers.clearAll();
    }
  }
</script>

<div class="timer-list">
  <div class="list-header">
    <h2>Countdown Timers</h2>
    <div class="header-actions">
      {#if $timers.length > 0}
        <button class="clear-btn" on:click={clearAll}>
          Clear All
        </button>
      {/if}
      <button class="add-btn" on:click={addTimer} disabled={$timers.length >= MAX_TIMERS}>
        <span class="plus">+</span> Add Timer
      </button>
    </div>
  </div>

  {#if $timers.length === 0}
    <div class="empty-state">
      <div class="empty-icon">⏱️</div>
      <h3>No timers yet</h3>
      <p>Click "Add Timer" to create your first countdown timer</p>
      <button class="add-btn large" on:click={addTimer}>
        <span class="plus">+</span> Add Your First Timer
      </button>
    </div>
  {:else}
    <div class="timers-grid">
      {#each $timers as timer (timer.id)}
        <BasicTimer timerId={timer.id} />
      {/each}
    </div>
    <p class="timer-count">{$timers.length} of {MAX_TIMERS} timers</p>
  {/if}
</div>

<style>
  .timer-list {
    width: 100%;
  }

  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .list-header h2 {
    margin: 0;
    font-size: 24px;
    color: #1f2937;
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }

  .add-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .add-btn:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
  }

  .add-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .add-btn .plus {
    font-size: 20px;
    font-weight: 400;
  }

  .add-btn.large {
    padding: 16px 32px;
    font-size: 18px;
  }

  .clear-btn {
    padding: 12px 20px;
    background: #fee2e2;
    color: #ef4444;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .clear-btn:hover {
    background: #ef4444;
    color: white;
  }

  /* Empty state */
  .empty-state {
    text-align: center;
    padding: 60px 20px;
    background: #f9fafb;
    border-radius: 16px;
    border: 2px dashed #e5e7eb;
  }

  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }

  .empty-state h3 {
    margin: 0 0 8px;
    color: #1f2937;
    font-size: 20px;
  }

  .empty-state p {
    margin: 0 0 24px;
    color: #6b7280;
  }

  /* Grid layout */
  .timers-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
  }

  /* Tablet: 2 columns */
  @media (min-width: 640px) {
    .timers-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* Desktop: 3 columns */
  @media (min-width: 1024px) {
    .timers-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  /* Large desktop: 4 columns */
  @media (min-width: 1400px) {
    .timers-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .timer-count {
    text-align: center;
    margin-top: 20px;
    color: #9ca3af;
    font-size: 14px;
  }
</style>
