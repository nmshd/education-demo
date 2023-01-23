<script lang="ts">
  import axios from "axios";
  import { onMount } from "svelte";

  let imageBuffer = "";
  onMount(async () => {
    const response = await axios.get("api/v1/registrationQR");
    imageBuffer = window.btoa(response.data.join(""));
  });
</script>

<img alt="QR_Code" src="data:image/png;base64,{imageBuffer}" />

<style>
</style>
