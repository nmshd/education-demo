<script lang="ts">
  import axios from "axios";
  import { onMount } from "svelte";

  let imageBuffer = "";
  onMount(async () => {
    const response = await axios.get("api/v1/registrationQR");
    imageBuffer = window.btoa(response.data.join(""));
  });
</script>

<div class="flex">
  <img class="onboarding-qr" alt="QR_Code" src="data:image/png;base64,{imageBuffer}" />
  <img alt="QR_Code" src="/pictures/enmeshed_onboarding.png" />
</div>

<style>
  .flex {
    display: flex;
    columns: 2;
    width: 100%;
    justify-content: space-evenly;
  }

  .onboarding-qr {
    min-width: 50px;
    min-height: 50px;
    width: 20vw;
    height: 20vw;
    margin-top: auto;
    margin-bottom: auto;
  }
</style>
