<script lang="ts">
  import axios from "axios";
  import { parse } from "qs";
  import type { Socket } from "socket.io-client";
  import { onMount } from "svelte";
  import { push, querystring } from "svelte-spa-router";
  import type { Writable } from "svelte/store";
  import { Alert, Button, FormGroup, Image, Input, Modal, ModalFooter, ModalHeader } from "sveltestrap";
  import type { KeycloakInstance } from "./types.svelte";

  export let normalLoginTitle = "Login!";
  export let keycloakInstance: KeycloakInstance;
  export let loggedIn: Writable<boolean | undefined>;
  export let userInfo: Writable<any>;
  export let socket: Socket | undefined;
  export let adminOnly = false;
  $: parsed = parse($querystring!);

  let imageBuffer = "";
  let error = "";
  let enmeshedLoginError = "";

  if (socket) {
    socket.on("failedLogin", (message) => {
      enmeshedLoginError = message.german;
      setTimeout(() => {
        enmeshedLoginError = "";
      }, 5000);
    });
  }

  async function login() {
    const name: any = document.getElementById("uName");
    const pw: any = document.getElementById("pwd");

    const urlencoded = new URLSearchParams();
    urlencoded.append("client_id", keycloakInstance.clientId);
    urlencoded.append("username", name.value);
    urlencoded.append("password", pw.value);
    urlencoded.append("grant_type", "password");
    try {
      const authServerUrl = keycloakInstance.authServerUrl;
      if (!authServerUrl) throw new Error("No auth server url set");

      const response = await axios.post(
        `${authServerUrl}realms/${keycloakInstance.realm}/protocol/openid-connect/token`,
        urlencoded
      );

      const loginResponse = await axios.post("api/v1/auth/login", null, {
        headers: { authorization: `Bearer ${response.data.access_token}` }
      });

      if (adminOnly) {
        if (!loginResponse.data.realm_access.roles.includes("admin")) {
          error = "Forbidden";
          return;
        }
      }
      // This call is needed to make the session persistant if the user imedatiely leaves the site and returns.
      // TODO: Why do we need this/how do we fix this?
      await axios.get("api/v1/session");
      userInfo.set(loginResponse.data);
      loggedIn.set(true);

      await push(`${parsed.redirect || "/"}`);
    } catch (e) {
      error = "Logindata wrong!";
    }
  }

  onMount(async () => {
    const response = await axios.get("api/v1/registrationQR");
    imageBuffer = window.btoa(response.data.join(""));
  });

  let open = false;
  const toggle = () => (open = !open);
</script>

<div class="center">
  <Modal isOpen={open} backdrop="static" {toggle}>
    <ModalHeader>Scan with Enmeshed!</ModalHeader>
    <Image alt="QR_Code" src="data:image/png;base64,{imageBuffer}" />
    <ModalFooter>
      {#if enmeshedLoginError}
        <Alert dismissible fade color="danger">
          {enmeshedLoginError}</Alert
        >
      {/if}
      <Button color="secondary" on:click={toggle}>Cancel</Button>
    </ModalFooter>
  </Modal>
</div>
<h1 class="display-1">{normalLoginTitle}</h1>
<form on:submit|preventDefault={login}>
  <FormGroup floating label="Username">
    <Input id="uName" name="username" required placeholder="Enter your Username!" />
  </FormGroup>
  <FormGroup floating label="Password">
    <Input id="pwd" name="password" required type="password" placeholder="Enter your Password!" />
  </FormGroup>
  {#if error !== ""}
    <Alert dismissible fade={false} color="danger">
      {error}</Alert
    >
  {/if}
  <FormGroup>
    <Button type="submit" color="primary">Login</Button>
  </FormGroup>
</form>
<FormGroup>
  <Button color="info" on:click={toggle}>Login with Enmeshed</Button>
</FormGroup>

<style>
  h1 {
    text-transform: uppercase;
    font-weight: 100;
    padding-top: 10vh;
    padding-bottom: 5vh;
  }
</style>
