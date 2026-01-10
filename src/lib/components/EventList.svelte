<script lang="ts">
  import { events } from '../stores/events';
  import EventForm from './EventForm.svelte';
  import EventCard from './EventCard.svelte';

  let showForm = false;

  function toggleForm() {
    showForm = !showForm;
  }

  function handleEventAdded() {
    showForm = false;
  }

  function clearAll() {
    if ($events.length === 0) return;
    if (confirm('Are you sure you want to delete all event countdowns?')) {
      events.clearAll();
    }
  }

  // Sort events by date (upcoming first, then past)
  $: sortedEvents = [...$events].sort((a, b) => {
    const dateA = new Date(a.targetDate);
    const dateB = new Date(b.targetDate);
    const now = Date.now();
    const isPastA = dateA.getTime() < now;
    const isPastB = dateB.getTime() < now;

    // Put upcoming events first
    if (isPastA && !isPastB) return 1;
    if (!isPastA && isPastB) return -1;

    // Sort by date
    return dateA.getTime() - dateB.getTime();
  });
</script>

<div class="event-list">
  <div class="list-header">
    <h2>Event Countdowns</h2>
    <div class="header-actions">
      {#if $events.length > 0}
        <button class="clear-btn" on:click={clearAll}>
          Clear All
        </button>
      {/if}
      <button class="add-btn" on:click={toggleForm}>
        {#if showForm}
          Cancel
        {:else}
          <span class="plus">+</span> New Event
        {/if}
      </button>
    </div>
  </div>

  {#if showForm}
    <div class="form-container">
      <EventForm on:added={handleEventAdded} />
    </div>
  {/if}

  {#if $events.length === 0 && !showForm}
    <div class="empty-state">
      <div class="empty-icon">📅</div>
      <h3>No event countdowns yet</h3>
      <p>Create a countdown to birthdays, holidays, deadlines, and more!</p>
      <button class="add-btn large" on:click={toggleForm}>
        <span class="plus">+</span> Create Your First Event
      </button>
    </div>
  {:else if $events.length > 0}
    <div class="events-grid">
      {#each sortedEvents as event (event.id)}
        <EventCard {event} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .event-list {
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
    background: #8b5cf6;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .add-btn:hover {
    background: #7c3aed;
    transform: translateY(-1px);
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

  .form-container {
    margin-bottom: 24px;
    animation: slideDown 0.3s ease;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
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
  .events-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
  }

  /* Tablet: 2 columns */
  @media (min-width: 640px) {
    .events-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* Desktop: 3 columns */
  @media (min-width: 1024px) {
    .events-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
