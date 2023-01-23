<script lang="ts">
  const srcMap = ["/pictures/app_store.png", "/pictures/play_store.png"];
  let state = 0;
</script>

<div class="container">
  <div class="header">
    <p class="a {state === 0 ? 'active' : ''}" on:click={() => (state = 0)}>App Store</p>
    <p class="b {state === 1 ? 'active' : ''}" on:click={() => (state = 1)}>Play Store</p>
  </div>
  <div>
    <img src={srcMap[state]} alt="Qr-Code" />
  </div>
</div>

<style>
  .container {
    max-width: 500px;
  }

  .header {
    display: flex;
  }
  .active {
    background-color: blue;
  }

  .header * {
    padding: 1em;
    border-radius: 1rem;
  }

  .a {
    max-width: 250px;
    width: 50%;
  }

  .a:hover {
    cursor: pointer;
  }

  .b {
    max-width: 250px;
    width: 50%;
  }

  .b:hover {
    cursor: pointer;
  }
</style>
