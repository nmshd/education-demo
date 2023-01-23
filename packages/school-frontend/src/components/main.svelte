<script>
  import Index from "./index.svelte";
  import State from "./state.svelte";

  let stateIndex = 0;
</script>

<div class="story-container">
  <div class="sidebar" style="width:25%"><Index index={stateIndex} /></div>
  <div class="story-content">
    <div class="story-state">
      <State {stateIndex} />
    </div>
    {#if stateIndex !== 5}
      <div class="button_container">
        <button type="button" class="btn btn-primary" on:click={() => stateIndex++}>Weiter</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .sidebar {
    border-right: 6px solid black;
    flex: 15%;
    background-color: lightgray;
    padding: 2em;
  }

  .btn {
    padding-top: 5px;
  }
  .story-container {
    display: flex;
    height: 100%;
    width: 100%;
    min-width: 1000px;
  }

  .story-content {
    position: relative;
    flex: 85%;
    padding: 2em;
  }

  .story-state {
    height: 95%;
    min-height: 800px;
    min-width: 600px;
  }

  .button_container {
  }
</style>
