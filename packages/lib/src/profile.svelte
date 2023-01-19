<script lang="ts">
  import { push } from "svelte-spa-router";
  import type { Writable } from "svelte/store";
  import { Alert, Button, Container, Toast, ToastBody, ToastHeader } from "sveltestrap";
  import type { UserInfo } from "./types.svelte";
  export let userInfo: Writable<UserInfo>;
  export let params: any;
  export let successMessage = "Your account is successfully connected to Enmeshed!";
</script>

<Container>
  <h1 class="display-1">Profile</h1>
  {#if params.success === "success" && $userInfo.attributes?.enmeshedAddress}
    <Alert color="success" dismissible fade={false} toggle={() => push("#/profile")}>{successMessage}</Alert>
  {/if}
  <div class="p-3 mb-3">
    <Toast fade={false} class="me-1">
      <ToastHeader>Username</ToastHeader>
      <ToastBody>
        {$userInfo.preferred_username}
      </ToastBody>
    </Toast>
  </div>
  {#if $userInfo.given_name}
    <div class="p-3 mb-3">
      <Toast fade={false} class="me-1">
        <ToastHeader>Given Name</ToastHeader>
        <ToastBody>
          {$userInfo.given_name}
        </ToastBody>
      </Toast>
    </div>
  {/if}
  {#if $userInfo.family_name}
    <div class="p-3 mb-3">
      <Toast fade={false} class="me-1">
        <ToastHeader>Family Name</ToastHeader>
        <ToastBody>
          {$userInfo.family_name}
        </ToastBody>
      </Toast>
    </div>
  {/if}
  {#if $userInfo.email}
    <div class="p-3 mb-3">
      <Toast fade={false} class="me-1">
        <ToastHeader>E-Mail</ToastHeader>
        <ToastBody>
          {$userInfo.email}
        </ToastBody>
      </Toast>
    </div>
  {/if}
  {#if $userInfo.attributes}
    {#each Object.entries($userInfo.attributes) as entry}
      {#if entry[0] !== "enmeshedAddress"}
        <div class="p-3 mb-3">
          <Toast fade={false} class="me-1">
            <ToastHeader>{entry[0].charAt(0).toUpperCase() + entry[0].slice(1)}</ToastHeader>
            <ToastBody>
              {entry[1]}
            </ToastBody>
          </Toast>
        </div>
      {/if}
    {/each}
  {/if}

  <div class="p-3 mb-3">
    <Toast fade={false} class="me-1">
      <ToastHeader>Enmeshed Address</ToastHeader>
      <ToastBody>
        {#if $userInfo.attributes?.enmeshedAddress}
          {$userInfo.attributes.enmeshedAddress}
        {:else}
          <a href="#/profile/onboarding"><Button>Onboard</Button></a>
        {/if}
      </ToastBody>
    </Toast>
  </div>
</Container>

<style>
  div {
    text-align: left;
  }
  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-weight: 100;
  }
</style>
