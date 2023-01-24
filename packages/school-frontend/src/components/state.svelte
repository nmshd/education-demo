<script lang="ts">
  import DownloadQr from "./story_states/downloadQr.svelte";
  import OnboardingQr from "./story_states/onboardingQr.svelte";
  import SchoolCertificate from "./story_states/schoolCertificate.svelte";
  import SchoolCertificateTransmision from "./story_states/schoolCertificateTransmision.svelte";

  const state: any[] = [SchoolCertificate, DownloadQr, OnboardingQr, SchoolCertificateTransmision];

  const stateDescription: string[] = [
    "Herzlichen Glückwunsch Sie haben ihr Abitur erfolgreich bestanden!\nUm ihnen den Bewerbungsprozess so angenehm wie Möglich zu gestalten ist ihr Zeugnis auch Digital verfügbar. Um fortzufahren clicken Sie auf weiter.",
    "Falls Sie die Enmeshed App noch nicht installiert haben können Sie das über die hier Sichtbaren QR-Codes tun.",
    "Um ihre Zeugnis Digital in ihrer Enmeshed-Wallet zu speichern und fortzufahren scannen Sie diesen Qr-Code mit der App.",
    "In ihrer Beziehungsansicht mit der Schule sehen Sie nun eine neue Nachricht mit dem angehängten Zeugnis!"
  ];

  export let stateIndex: number;
</script>

<div class="story">
  <div class="story-description">
    <div id="typewriter" class="typewriter">{stateDescription[stateIndex]}</div>
  </div>
  <div class="story-content">
    <svelte:component this={state[stateIndex]} bind:stateIndex />
  </div>
</div>

<style>
  .story {
    position: relative;
    min-height: 800px;
    height: 100%;
  }

  .story-description {
    position: relative;
    padding-bottom: 2em;
    margin-bottom: 2em;
    overflow: hidden;
    width: 100%;
    height: auto;
    border-bottom: 6px solid black;
  }

  .typewriter {
    overflow: hidden; /* Ensures the content is not revealed until the animation */
    white-space: nowrap; /* Keeps the content on a single line */
    margin: 0 auto; /* Gives that scrolling effect as the typing happens */
    max-width: 100%;
    letter-spacing: 0.15em; /* Adjust as needed */
    text-align: left;
  }

  .story-content {
    position: relative;
    max-height: 90%;
    height: 90%;
    display: flex;
    justify-content: center;
  }
</style>
