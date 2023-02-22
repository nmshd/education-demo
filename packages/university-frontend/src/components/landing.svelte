<script lang="ts">
  import { replace } from "svelte-spa-router";
  import { Button, Container } from "sveltestrap";
  import { userInfo } from "../store";
</script>

<Container>
  <h1 class="display-1">Hello {$userInfo.given_name ? $userInfo.given_name : $userInfo.preferred_username}</h1>
  <div>
    Starte deine Bewerbung zur Immatrikulation für das Fach Bachelor of Science Informatik an der Muster <a
      href="https://www.google.com">Hochschule</a
    >.
    <br /><Button color="primary" on:click={async () => await replace("/application")}>Start</Button>
  </div></Container
>

<style>
  div {
    text-align: left;
  }
  a {
    text-decoration: none;
    color: inherit;
  }
  h1 {
    color: black;
    text-transform: uppercase;
    font-weight: 100;
  }
</style>
