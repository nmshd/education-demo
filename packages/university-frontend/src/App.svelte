<script lang="ts">
  import { NavbarLoggedIn, NavbarLoggedOut } from "@js-soft/nmshd-login-demo-helper";
  import axios from "axios";
  import { parse } from "qs";
  import { onMount } from "svelte";
  import Router, { location, push, querystring, replace } from "svelte-spa-router";
  import { Container, Styles } from "sveltestrap";
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

  console.log($location);

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
    <div class="story-content">
      {#if $siteConfig && $userInfo}
        {#if $loggedIn !== undefined}
          <Container>
            {#if $loggedIn}
              <NavbarLoggedIn userName={$userInfo.preferred_username} {siteConfig} />
            {:else}
              <NavbarLoggedOut {siteConfig} />
            {/if}
            <div class="row align-self-center">
              <div class={$location !== "/login" && $location !== "/register" ? "story" : ""}>
                <div class={$location !== "/login" && $location !== "/register" ? "story-content" : ""}>
                  <Router
                    {routes}
                    on:conditionsFailed={async (event) => {
                      if (event.detail.route === "/login" || event.detail.route === "/register") {
                        await replace("/");
                      } else {
                        await replace(`/login?redirect=${event.detail.route !== "*" ? event.detail.route : "/"}`);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
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

  .story {
    position: relative;
    min-height: 800px;
    height: 100%;
  }

  .story-content {
    position: relative;
    max-height: 90%;
    height: 90%;
    display: flex;
    justify-content: center;
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

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
