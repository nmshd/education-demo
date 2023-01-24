<script lang="ts" context="module">
  import { Login, Onboarding, Profile, Register } from "@js-soft/nmshd-login-demo-helper";
  import { wrap } from "svelte-spa-router/wrap";
  import { get } from "svelte/store";
  import About from "../components/routes/about.svelte";
  import Main from "../components/routes/index/main.svelte";
  import Test from "../components/routes/test.svelte";
  import { keycloakInstance, loggedIn, siteConfig, userInfo } from "../store";
  import { io } from "./realtime";

  export const routes = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "/": wrap({
      component: Main,
      conditions: [
        (_detail: any) => {
          return !!get(loggedIn);
        }
      ]
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "/test": wrap({
      component: Test,
      conditions: [
        (_detail: any) => {
          return !!get(loggedIn);
        }
      ]
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "/profile/onboarding": wrap({
      component: Onboarding,
      props: {
        userInfo,
        siteConfig
      },
      conditions: [
        (_detail: any) => {
          return !!get(loggedIn) && !get(userInfo).enmeshedAddress;
        }
      ]
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "/profile/:success?": wrap({
      component: Profile,
      props: {
        userInfo
      },
      conditions: [
        (_detail: any) => {
          return !!get(loggedIn);
        }
      ]
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "/login": wrap({
      component: Login,
      props: {
        siteConfig,
        keycloakInstance,
        loggedIn,
        userInfo,
        socket: io
      },
      conditions: [
        (_detail: any) => {
          return !get(loggedIn);
        }
      ]
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "/register": wrap({
      component: Register,
      props: {
        siteConfig
      },
      conditions: [
        (_detail: any) => {
          return !get(loggedIn);
        }
      ]
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "/about": wrap({
      component: About
    }),

    // eslint-disable-next-line @typescript-eslint/naming-convention
    "*": wrap({
      component: Main,
      conditions: [
        (_detail: any) => {
          return !!get(loggedIn);
        }
      ]
    })
  };
</script>
