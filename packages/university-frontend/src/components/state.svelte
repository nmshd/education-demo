<script lang="ts">
  import Application from "./application.svelte";
  import Final from "./final.svelte";
  import Landing from "./landing.svelte";
  const state: any[] = [Landing, Application, Final];

  export let stateIndex: number;

  stateIndex++;
</script>

<div class="story">
  <div class="story-content">
    <svelte:component this={state[stateIndex - 1]} bind:stateIndex />
  </div>
</div>

<style>
  .story {
    position: relative;
    min-height: 800px;
    height: 100%;
  }

  .story-description {
    position: relative;
    padding-bottom: 2em;
    margin-bottom: 2em;
    overflow: hidden;
    width: 100%;
    height: auto;
    border-bottom: 6px solid black;
  }

  .typewriter {
    overflow: hidden; /* Ensures the content is not revealed until the animation */
    white-space: nowrap; /* Keeps the content on a single line */
    margin: 0 auto; /* Gives that scrolling effect as the typing happens */
    max-width: 100%;
    letter-spacing: 0.15em; /* Adjust as needed */
    text-align: left;
  }

  .story-content {
    position: relative;
    max-height: 90%;
    height: 90%;
    display: flex;
    justify-content: center;
  }
</style>
