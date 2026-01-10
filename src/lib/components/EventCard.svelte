<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { events, type CountdownEvent } from '../stores/events';
  import { formatEventTimeRemaining, isPastDate } from '../utils/timeCalculations';

  export let event: CountdownEvent;

  let timeRemaining = '';
  let isPast = false;
  let interval: ReturnType<typeof setInterval>;

  function updateTime() {
    const targetDate = new Date(event.targetDate);
    isPast = isPastDate(targetDate);
    timeRemaining = formatEventTimeRemaining(targetDate);
  }

  function remove() {
    events.remove(event.id);
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  onMount(() => {
    updateTime();
    // Update every second for accuracy
    interval = setInterval(updateTime, 1000);
  });

  onDestroy(() => {
    if (interval) {
      clearInterval(interval);
    }
  });
</script>

<div class="event-card" class:past={isPast}>
  <button class="delete-btn" on:click={remove} title="Delete event">×</button>

  <div class="event-name">{event.name}</div>

  <div class="countdown" class:past={isPast}>
    {#if isPast}
      <span class="celebration">🎉</span>
    {/if}
    {timeRemaining}
    {#if isPast}
      <span class="celebration">🎉</span>
    {/if}
  </div>

  <div class="target-date">
    {formatDate(event.targetDate)}
  </div>

  {#if isPast}
    <div class="past-badge">Event Completed!</div>
  {/if}
</div>

<style>
  .event-card {
    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
    border-radius: 16px;
    padding: 24px;
    color: white;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .event-card::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
    pointer-events: none;
  }

  .event-card.past {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  }

  .delete-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 28px;
    height: 28px;
    border: none;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border-radius: 6px;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .delete-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .event-name {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
    padding-right: 30px;
  }

  .countdown {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 12px;
    font-variant-numeric: tabular-nums;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .countdown.past {
    font-size: 24px;
  }

  .celebration {
    font-size: 28px;
    animation: bounce 1s infinite;
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  .target-date {
    font-size: 14px;
    opacity: 0.9;
    text-align: center;
  }

  .past-badge {
    margin-top: 12px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    text-align: center;
    display: inline-block;
    width: fit-content;
    margin-left: auto;
    margin-right: auto;
    display: block;
  }
</style>
