<script lang="ts">
  import TimerList from './lib/components/TimerList.svelte';
  import EventList from './lib/components/EventList.svelte';
  import { settings } from './lib/stores/settings';
  import { setVolume } from './lib/utils/alarm';

  type Tab = 'timers' | 'events';
  let activeTab: Tab = 'timers';

  // Sync volume with alarm utility
  $: setVolume($settings.volume / 100);
</script>

<div class="app">
  <header>
    <h1>⏱️ Countdown Timer</h1>
    <p class="tagline">Track time, stay on schedule</p>
  </header>

  <nav class="tabs">
    <button
      class="tab"
      class:active={activeTab === 'timers'}
      on:click={() => activeTab = 'timers'}
    >
      ⏱️ Timers
    </button>
    <button
      class="tab"
      class:active={activeTab === 'events'}
      on:click={() => activeTab = 'events'}
    >
      📅 Events
    </button>
  </nav>

  <main>
    {#if activeTab === 'timers'}
      <TimerList />
    {:else}
      <EventList />
    {/if}
  </main>

  <footer>
    <div class="settings">
      <label class="sound-toggle">
        <input
          type="checkbox"
          checked={$settings.soundEnabled}
          on:change={(e) => settings.setSoundEnabled(e.currentTarget.checked)}
        />
        <span>🔔 Sound {$settings.soundEnabled ? 'On' : 'Off'}</span>
      </label>
      {#if $settings.soundEnabled}
        <div class="volume-control">
          <span>🔊</span>
          <input
            type="range"
            min="0"
            max="100"
            value={$settings.volume}
            on:input={(e) => settings.setVolume(parseInt(e.currentTarget.value))}
          />
          <span class="volume-value">{$settings.volume}%</span>
        </div>
      {/if}
    </div>
    <p class="copyright">Built with Svelte + Vite</p>
  </footer>
</div>

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  header {
    text-align: center;
    padding: 32px 20px 24px;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    color: white;
  }

  header h1 {
    margin: 0;
    font-size: 32px;
    font-weight: 700;
  }

  .tagline {
    margin: 8px 0 0;
    opacity: 0.9;
    font-size: 16px;
  }

  .tabs {
    display: flex;
    background: white;
    padding: 0 20px;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .tab {
    flex: 1;
    padding: 16px 24px;
    background: none;
    border: none;
    font-size: 16px;
    font-weight: 600;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
    border-bottom: 3px solid transparent;
    max-width: 200px;
  }

  .tab:hover {
    color: #3b82f6;
    background: #f9fafb;
  }

  .tab.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
  }

  main {
    flex: 1;
    padding: 24px 20px;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
  }

  footer {
    padding: 20px;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
  }

  .settings {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  .sound-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
    color: #4b5563;
  }

  .sound-toggle input {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .volume-control {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #4b5563;
  }

  .volume-control input[type="range"] {
    width: 100px;
    cursor: pointer;
  }

  .volume-value {
    width: 40px;
    text-align: right;
  }

  .copyright {
    text-align: center;
    margin: 0;
    font-size: 12px;
    color: #9ca3af;
  }

  @media (max-width: 480px) {
    header h1 {
      font-size: 24px;
    }

    .tab {
      padding: 12px 16px;
      font-size: 14px;
    }

    main {
      padding: 16px;
    }

    .settings {
      flex-direction: column;
      gap: 12px;
    }
  }
</style>
