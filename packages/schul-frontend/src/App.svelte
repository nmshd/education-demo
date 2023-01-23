<script lang="ts">
  import axios from "axios";
  import { parse } from "qs";
  import { onMount } from "svelte";
  import Router, { push, querystring } from "svelte-spa-router";
  import { Styles } from "sveltestrap";
  import { io } from "./lib/realtime";
  import { routes } from "./lib/routes.svelte";
  import { loggedIn, siteConfig, userInfo } from "./store";
  $: parsed = parse($querystring!);

  onMount(async () => {
    try {
      const config = await axios.get("api/v1/config");

      siteConfig.set(config.data);

      io.on("register", async (keycloakTokens) => {
        const u = await axios.post("api/v1/auth/login", null, {
          headers: {
            authorization: `Bearer ${keycloakTokens.access_token}`
          }
        });
        // This call is needed to make the session persistant if the user imedatiely leaves the site and returns.
        // TODO: Why do we need this/how do we fix this?
        await axios.get("api/v1/session");
        userInfo.set(u.data);
        loggedIn.set(true);
        await push(`${parsed.redirect ?? "/"}`);
      });

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
