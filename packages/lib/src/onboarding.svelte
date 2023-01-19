<script lang="ts">
  import type { Writable } from "svelte/store";
  import { Button } from "sveltestrap";
  import OnboardingInfo from "./onboardingInfo.svelte";
  import OnboardinProcedure from "./onboardingProcedure.svelte";
  import type { SiteConfig, UserInfo } from "./types.svelte";

  export let userInfo: Writable<UserInfo>;
  export let siteConfig: Writable<SiteConfig>;

  const onboardingInfo = $siteConfig.onboardingInfo;
  const enmeshedIntro = $siteConfig.enmeshedIntro;

  let info = true;
  function toggle() {
    info = !info;
  }
</script>

<h1>Onboarding</h1>
{#if info}
  <OnboardingInfo enmeshedInfo={enmeshedIntro} information={onboardingInfo} />
  <div>
    <Button color="info" on:click={toggle}>Connect to Enmeshed</Button>
  </div>
{:else}
  <OnboardinProcedure userInfo={$userInfo} />
{/if}

<style>
  div {
    padding-top: 2.5vh;
    margin-bottom: 2.5vh;
  }
  h1 {
    text-transform: uppercase;
    font-weight: 100;
  }
</style>
