<script lang="ts">
  import axios from "axios";
  import { onMount } from "svelte";
  import { Container, Image } from "sveltestrap";
  import type { UserInfo } from "./types.svelte";

  export let userInfo: UserInfo;
  let imageBuffer: string;

  async function startOnboarding() {
    try {
      const response = await axios.get(
        `api/v1/${
          userInfo.preferred_username
            ? `onboardingQR?username=${userInfo.preferred_username}`
            : "registrationQR?patient=true"
        }`
      );

      imageBuffer = window.btoa(response.data.join(""));
    } catch (e) {
      alert(e);
    }
  }

  onMount(async () => {
    await startOnboarding();
  });
</script>

<Container sm style="padding-top: 2.5vh">
  <p class="lead">
    You can connect your account with Enmeshed by Scanning the following QR-Code with your Enmeshed app:<br />
    Please don't let anyone else Scan this QR-Code since it may contain critical information!
  </p>
  {#if imageBuffer}
    <figure class="figure">
      <Image alt="QR_Code" src="data:image/png;base64,{imageBuffer}" />
      <figcaption class="figure-caption">This QR-Code is valid for 5min</figcaption>
    </figure>
  {:else}
    <div class="spinner-border" style="width: 40px; height: 40px;">
      <span class="visually-hidden">Loading...</span>
    </div>
  {/if}
</Container>
