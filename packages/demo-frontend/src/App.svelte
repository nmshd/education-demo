<script lang="ts">
  import { NavbarLoggedIn, NavbarLoggedOut } from "@js-soft/nmshd-login-demo-helper";
  import axios from "axios";
  import { parse } from "qs";
  import { onMount } from "svelte";
  import Router, { push, querystring, replace } from "svelte-spa-router";
  import { Container, Styles } from "sveltestrap";
  import { io } from "./lib/realtime";
  import { routes } from "./lib/routes.svelte";
  import { keycloakInstance, loggedIn, siteConfig, userInfo } from "./store";
  $: parsed = parse($querystring!);

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
        await push("/profile/success");
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
    {#if $loggedIn !== undefined}
      <Container>
        {#if $loggedIn}
          <NavbarLoggedIn userName={$userInfo.preferred_username} {siteConfig} />
        {:else}
          <NavbarLoggedOut {siteConfig} />
        {/if}
        <div class="row align-self-center">
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
      </Container>
    {/if}
  {/if}
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    margin: 0 auto;
    height: 100%;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
