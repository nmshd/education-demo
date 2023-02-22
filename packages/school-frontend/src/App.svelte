<script lang="ts">
  import axios from "axios";
  import { parse } from "qs";
  import { onMount } from "svelte";
  import Router, { querystring } from "svelte-spa-router";
  import { Styles } from "sveltestrap";
  import { io } from "./lib/realtime";
  import { routes } from "./lib/routes.svelte";
  import { siteConfig } from "./store";
  $: parsed = parse($querystring!);

  onMount(async () => {
    try {
      const config = await axios.get("api/v1/config");

      siteConfig.set(config.data);

      io.on("error", (e) => {
        alert(e);
      });
    } catch (e) {
      console.error(e);
    }
  });
</script>

<Styles />

<main>
  {#if $siteConfig}
    <Router {routes} />
  {/if}
</main>

<style>
  main {
    text-align: center;
    margin: 0 auto;
    height: 100%;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
