<script lang="ts">
  import axios from "axios";
  import { onMount } from "svelte";
  import { Button, Container, Image } from "sveltestrap";
  import { userInfo } from "../store";

  let imageBuffer: string;

  async function startOnboarding() {
    try {
      if (!$userInfo.attributes?.enmeshedAddress) {
        const response = await axios.get(`api/v1/onboardingQR?username=${$userInfo.preferred_username}`);

        imageBuffer = window.btoa(response.data.join(""));
      }
    } catch (e) {
      alert(e);
    }
  }
  onMount(async () => {
    await startOnboarding();
  });
</script>

<div class="col-66">
  <div class="update">
    <h2 class="display-1">Weitere Funktionen</h2>
    <hr />
    {#if !$userInfo.attributes?.enmeshedAddress}
      <Image alt="QR_Code" src="data:image/png;base64,{imageBuffer}" />
    {:else}
      <Container>
        <div>
          Sende eine Beispielnachricht an den User.
          <br /><Button color="primary" on:click={async () => await axios.post("/api/v1/auth/sendDemoMessageToUser")}>
            Nachricht senden
          </Button>
        </div>
      </Container>
    {/if}
    <Container>
      <div>
        <br /><Button color="primary" on:click={() => ""}>Zurück zur Übersicht</Button>
      </div>
    </Container>
  </div>
</div>
<div class="col-33 flex">
  <div class="flex-content" />
</div>

<style>
  hr {
    background-color: gray;

    border-width: 10px;
  }

  .flex {
    display: flex;
    align-items: center;
    flex-direction: column;
  }

  .flex-content {
    padding-top: 24px;
  }

  h2 {
    color: #0158ab;
    font-size: 30px;
    font-weight: bold;
  }

  .update {
    padding: 24px;
    top: 10vh;
    margin: auto;
    text-align: left;
  }

  .col-66 {
    width: 66%;
    padding: 0 18px;
    margin: auto;
  }
</style>
