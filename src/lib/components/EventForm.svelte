<script lang="ts">
  import { events } from '../stores/events';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let eventName = '';
  let eventDate = '';
  let eventTime = '';
  let error = '';

  // Set minimum date to today
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  // Default time to noon
  $: if (!eventTime) {
    eventTime = '12:00';
  }

  function handleSubmit() {
    error = '';

    // Validation
    if (!eventName.trim()) {
      error = 'Please enter an event name';
      return;
    }

    if (!eventDate) {
      error = 'Please select a date';
      return;
    }

    // Combine date and time
    const dateTimeString = `${eventDate}T${eventTime}`;
    const targetDate = new Date(dateTimeString);

    // Check if date is in the future
    if (targetDate <= new Date()) {
      error = 'Please select a future date and time';
      return;
    }

    // Add the event
    events.add(eventName.trim(), targetDate);

    // Reset form
    eventName = '';
    eventDate = '';
    eventTime = '12:00';

    dispatch('added');
  }
</script>

<form class="event-form" on:submit|preventDefault={handleSubmit}>
  <h3>Create Event Countdown</h3>

  <div class="form-group">
    <label for="event-name">Event Name</label>
    <input
      id="event-name"
      type="text"
      bind:value={eventName}
      placeholder="e.g., Birthday, Vacation, Deadline"
      maxlength="50"
    />
  </div>

  <div class="form-row">
    <div class="form-group">
      <label for="event-date">Date</label>
      <input
        id="event-date"
        type="date"
        bind:value={eventDate}
        min={minDate}
      />
    </div>

    <div class="form-group">
      <label for="event-time">Time</label>
      <input
        id="event-time"
        type="time"
        bind:value={eventTime}
      />
    </div>
  </div>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  <button type="submit" class="submit-btn">
    Create Countdown
  </button>
</form>

<style>
  .event-form {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  h3 {
    margin: 0 0 20px;
    font-size: 18px;
    color: #1f2937;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-row {
    display: flex;
    gap: 16px;
  }

  .form-row .form-group {
    flex: 1;
  }

  label {
    display: block;
    margin-bottom: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #4b5563;
  }

  input {
    width: 100%;
    padding: 12px 14px;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    font-size: 16px;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }

  input:focus {
    outline: none;
    border-color: #3b82f6;
  }

  input::placeholder {
    color: #9ca3af;
  }

  .error {
    color: #ef4444;
    font-size: 14px;
    margin: 0 0 16px;
    padding: 10px;
    background: #fef2f2;
    border-radius: 8px;
  }

  .submit-btn {
    width: 100%;
    padding: 14px;
    background: #8b5cf6;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .submit-btn:hover {
    background: #7c3aed;
    transform: translateY(-1px);
  }

  @media (max-width: 480px) {
    .form-row {
      flex-direction: column;
      gap: 0;
    }
  }
</style>
