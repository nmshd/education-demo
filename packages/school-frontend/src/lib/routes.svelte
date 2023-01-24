<script lang="ts" context="module">
  import { wrap } from "svelte-spa-router/wrap";
  import Main from "../components/main.svelte";

  export const routes = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "/": wrap({
      component: Main
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "*": wrap({
      component: Main
    })
  };
</script>
