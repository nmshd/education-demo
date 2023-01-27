<script lang="ts">
  import { Button, Container } from "sveltestrap";
  import { userInfo } from "../store";
  export let stateIndex: number;
</script>

<Container>
  <h1 class="display-1">Hello {$userInfo.given_name ? $userInfo.given_name : $userInfo.preferred_username}</h1>
  <div>
    Starte deine Bewerbung zur Immatrikulation für das Fach Bachelor of Science Informatik an der Muster Hochschule.
    <br /><Button color="primary" on:click={() => stateIndex++}>Start</Button>
  </div></Container
>

<style>
  code:hover {
    cursor: pointer;
  }
  mark:hover {
    cursor: pointer;
  }
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
