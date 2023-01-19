<script lang="ts">
  import axios from "axios";
  import type { Writable } from "svelte/store";
  import { Alert, Button, FormGroup, Image, Input, Modal, ModalFooter, ModalHeader } from "sveltestrap";
  import { generateQRCode } from "./functions.svelte";
  import type { UserData } from "./register";
  import { keycloakBasicUserInfo, SiteConfig } from "./types.svelte";

  export let siteConfig: Writable<SiteConfig>;
  const userData: UserData = $siteConfig.userData;
  let normalRegistration = $siteConfig.enableBasicAuth;
  let imageBuffer: string;
  let err = "";

  async function register() {
    const name: any = document.getElementById(userData.username.name);
    const password: any = document.getElementById(userData.password.name);
    const body = {
      username: name.value,
      password: password.value
    };
    const attributes = {};
    userData.req.forEach((element) => {
      const x: any = document.getElementById(element!.name);
      if (keycloakBasicUserInfo.includes(element!.name)) {
        body[`${element!.name}`] = x.value;
      } else if (x.value) {
        attributes[`${element!.name}`] = x.value;
      }
    });
    userData.opt.forEach((element) => {
      const x: any = document.getElementById(element!.name);
      if (keycloakBasicUserInfo.includes(element!.name)) {
        body[`${element!.name}`] = x.value;
      } else if (x.value) {
        attributes[`${element!.name}`] = x.value;
      }
    });
    body["attributes"] = attributes;

    try {
      await axios.post("api/v1/register", body);
    } catch (e) {
      err = "Username already taken!";
    }
  }

  async function registerWithEnmeshed() {
    try {
      const name: any = document.getElementById("uName");

      imageBuffer = await generateQRCode(name.value);
      toggle();
    } catch (e) {
      err = "Username already taken!";
    }
  }

  let open = false;
  const toggle = () => (open = !open);
</script>

{#if userData}
  {#if normalRegistration}
    <h1 class="display-1">Register!</h1>
    <form on:submit|preventDefault={register}>
      <FormGroup floating label="Username*">
        <Input id={userData.username.name} type={userData.username.type} placeholder="Enter your Username!" required />
      </FormGroup>

      <FormGroup floating label="Password*">
        <Input id={userData.password.name} type={userData.password.type} required />
      </FormGroup>
      {#each userData.req as required}
        {#if required}
          <FormGroup floating label="{required.name}*">
            <Input id={required.name} type={required.type} placeholder="Enter your {required.name}!" required />
          </FormGroup>
        {/if}
      {/each}
      {#each userData.opt as optional}
        {#if optional}
          <FormGroup floating label={optional.name}>
            <Input
              id={optional.name}
              type={optional.type}
              pattern={optional.type.toString() === "tel" ? "((\\+[0-9]{2})[-/]?)?[0-9]{5,}" : undefined}
              placeholder="Enter your {optional.name}!"
            />
          </FormGroup>
        {/if}
      {/each}
      {#if err !== ""}
        <Alert dismissible fade={false} color="danger">
          {err}</Alert
        >
      {/if}
      <FormGroup>
        <Button color="primary" type="submit">Register</Button>
      </FormGroup>
    </form>
    <FormGroup>
      <Button
        color="info"
        on:click={() => {
          normalRegistration = false;
          err = "";
        }}>Register with Enmeshed</Button
      >
    </FormGroup>
  {:else}
    <h1 class="display-1">Register with Enmeshed!</h1>
    <form on:submit|preventDefault={registerWithEnmeshed}>
      <Modal isOpen={open} backdrop="static" {toggle}>
        <ModalHeader>Scan with Enmeshed to continue!</ModalHeader>
        <Image alt="QR_Code" src="data:image/png;base64,{imageBuffer}" />
        <ModalFooter>
          <Button color="secondary" on:click={toggle}>Cancel</Button>
        </ModalFooter>
      </Modal>
      <FormGroup floating label="Username">
        <Input id="uName" placeholder="Enter your Username!" required />
      </FormGroup>
      {#if err !== ""}
        <Alert dismissible fade={false} color="danger">
          {err}</Alert
        >
      {/if}
      <FormGroup>
        <Button color="primary" type="submit">Register</Button>
      </FormGroup>
    </form>
    {#if $siteConfig.enableBasicAuth}
      <FormGroup>
        <Button
          color="info"
          on:click={() => {
            normalRegistration = true;
            err = "";
          }}>Ordenary Registration</Button
        >
      </FormGroup>
    {/if}
  {/if}
{/if}

<style>
  h1 {
    text-transform: uppercase;
    font-weight: 100;
    padding-top: 10vh;
    padding-bottom: 5vh;
  }
</style>
