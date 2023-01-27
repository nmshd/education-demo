<script lang="ts" context="module">
  import { Login, Register } from "@js-soft/nmshd-login-demo-helper";
  import { wrap } from "svelte-spa-router/wrap";
  import { get } from "svelte/store";
  import { keycloakInstance, loggedIn, siteConfig, userInfo } from "../store";
  import { io } from "./realtime";

  export const routes = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "/": wrap({
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
    "*": wrap({
      component: Login,
      conditions: [
        (_detail: any) => {
          return !!get(loggedIn);
        }
      ]
    })
  };
</script>
