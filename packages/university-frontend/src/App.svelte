<script lang="ts">
  import { NavbarLoggedIn, NavbarLoggedOut } from "@js-soft/nmshd-login-demo-helper";
  import axios from "axios";
  import { parse } from "qs";
  import { onMount } from "svelte";
  import Router, { push, querystring } from "svelte-spa-router";
  import { Container, Styles } from "sveltestrap";
  import Index from "./components/index.svelte";
  import State from "./components/state.svelte";
  import { io } from "./lib/realtime";
  import { routes } from "./lib/routes.svelte";
  import {
    application,
    applicationRequestStatus,
    keycloakInstance,
    loggedIn,
    siteConfig,
    Status,
    userInfo
  } from "./store";
  $: parsed = parse($querystring!);

  let stateIndex = 0;

  onMount(async () => {
    try {
      const config = await axios.get("api/v1/config");
      siteConfig.set(config.data);
      await keycloakInstance.init({});

      const usr = await axios.get("api/v1/session");
      userInfo.set(usr.data);

      if (usr.data.exp) {
        loggedIn.set(true);
      } else {
        loggedIn.set(false);
      }

      io.on("login", () => {
        // user.set({ name: v.name, connected: v.connected });
      });
      io.on("register", async (keycloakTokens) => {
        const u = await axios.post("api/v1/auth/login", null, {
          headers: {
            authorization: `Bearer ${keycloakTokens.access_token}`
          }
        });

        userInfo.set(u.data);
        loggedIn.set(true);
        await push(`${parsed.redirect ?? "/"}`);
      });

      io.on("onboard", async (keycloakTokens) => {
        const u = await axios.post("api/v1/auth/login", null, {
          headers: {
            authorization: `Bearer ${keycloakTokens.access_token}`
          }
        });

        userInfo.set(u.data);
        loggedIn.set(true);
      });

      io.on("application", (applicationData) => {
        $applicationRequestStatus = Status.Received;
        $application = applicationData;
        setTimeout(() => {
          $applicationRequestStatus = Status.Idle;
        }, 1000);
      });

      io.on("error", (e) => {
        console.log(JSON.stringify(e, null, 2));
        alert(e);
      });
    } catch (e) {
      console.error(e);
    }
  });
</script>

<Styles />

<main>
  <div class="story-container">
    <div class="sidebar" style="width:25%"><Index index={stateIndex} /></div>
    <div class="story-content">
      {#if $siteConfig && $userInfo}
        {#if $loggedIn !== undefined}
          <Container>
            {#if $loggedIn}
              <NavbarLoggedIn userName={$userInfo.preferred_username} {siteConfig} />
              <div class="row align-self-center">
                <State bind:stateIndex />
              </div>
            {:else}
              <NavbarLoggedOut {siteConfig} />
              <div class="row align-self-center">
                <Router {routes} />
              </div>
            {/if}
          </Container>
        {/if}
      {/if}
    </div>
  </div>
</main>

<style>
  main {
    text-align: center;
    margin: 0 auto;
    height: 100%;
  }

  .sidebar {
    border-right: 6px solid black;
    flex: 15%;
    background-color: lightgray;
    padding: 2em;
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
    padding: 0 2em;
  }

  .story-state {
    height: 95%;
    min-height: 800px;
    min-width: 600px;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
