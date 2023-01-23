<script lang="ts">
  import { onMount } from "svelte";
  import DownloadQr from "./story_states/downloadQr.svelte";
  import OnboardingQr from "./story_states/onboardingQr.svelte";
  import QrDummy from "./story_states/QrDummy.svelte";
  import Zeugnis from "./story_states/zeugnis.svelte";

  const state: any[] = [Zeugnis, QrDummy, DownloadQr, OnboardingQr];

  const stateDescription: string[] = [
    "Herzlichen Glückwunsch Sie haben ihr Abitur erfolgreich bestanden!\nUm ihnen den Bewerbungsprozess so angenehm wie Möglich zu gestalten ist ihr Zeugnis auch Digital verfügbar. Um fortzufahren clicken Sie auf weiter.",
    "Ihre Zeugnismappe beinhaltet einen Zettel mit QR-Codes die zum Download der Enmeshed App und anschließend zum speichern des Zeugnisses in selbiger dienen. Um ihre individuellen QR-Codes zu erhalten clicken Sie auf weiter.",
    "Falls Sie die Enmeshed App noch nicht installiert haben können Sie das über die hier Sichtbaren QR-Codes tun."
  ];

  export let stateIndex: number;

  let copy = stateIndex;

  let timer: any;

  function typeWriter(txt: string, i: number) {
    if (i < txt.length) {
      document.getElementById("typewriter")!.innerHTML += txt.charAt(i);
      i++;
      timer = setTimeout(() => typeWriter(txt, i), 50);
    }
  }
  onMount(() => {
    typeWriter(stateDescription[stateIndex], 0);
  });
  $: try {
    if (copy !== stateIndex) {
      copy = stateIndex;
      window.clearTimeout(timer);
      document.getElementById("typewriter")!.innerHTML = "";
      typeWriter(stateDescription[stateIndex], 0);
    }
  } catch (e) {
    console.log(e);
  }
</script>

<div class="story">
  <div class="story-description">
    <div id="typewriter" class="typewriter" />
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
